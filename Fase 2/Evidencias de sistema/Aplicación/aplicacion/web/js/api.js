// EDUCONNECT API Client - Capstone Definitive Client Layer
// Maneja comunicación HTTP con FastAPI (http://localhost:8000/api)
// Estrategia Dual Mode: Utiliza datos reales de MySQL si el backend está activo;
// de lo contrario aplica fallback transparente a datos locales para garantizar resiliencia total.

const api = {
  baseUrl: 'http://localhost:8000/api',
  isOnline: false,
  checkedOnce: false,
  token: localStorage.getItem('educonnect_jwt_token') || null,

  // Utilidad de seguridad contra ataques Cross-Site Scripting (XSS)
  escapeHtml(str) {
    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  // Generador de cabeceras seguras con autenticación JWT Bearer
  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  },

  // Comprobar si el backend FastAPI y MySQL están activos
  async checkHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1800);
      
      const res = await fetch(`${this.baseUrl}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        this.isOnline = data.database_connected || data.status === 'healthy';
      } else {
        this.isOnline = false;
      }
    } catch (e) {
      this.isOnline = false;
    } finally {
      this.checkedOnce = true;
      this.updateConnectionBadge();
    }
    return this.isOnline;
  },

  // Indicador de conexión
  updateConnectionBadge() {
    const badge = document.getElementById('api-status-badge');
    if (badge) {
      badge.className = "hidden";
      badge.innerHTML = "";
    }
  },

  // 1. Autenticación con verificación criptográfica y emisión JWT
  async login(email, password) {
    if (this.isOnline) {
      try {
        const res = await fetch(`${this.baseUrl}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password: password.trim() })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.access_token) {
            this.token = data.access_token;
            localStorage.setItem('educonnect_jwt_token', data.access_token);
          }
          return data;
        }
      } catch (err) {
        console.warn("[API] Conexión remota no disponible, recurriendo a modo autónomo", err);
      }
    }
    // Fallback a demoUsers de data.js
    const roleKey = Object.keys(mockData.demoUsers).find(k => mockData.demoUsers[k].email.toLowerCase() === email.toLowerCase());
    return roleKey ? mockData.demoUsers[roleKey] : null;
  },

  logout() {
    this.token = null;
    localStorage.removeItem('educonnect_jwt_token');
  },

  // 2. Alumnos y Familias (Multi-estudiante)
  async getStudentsByParent(parentId = 13) {
    if (this.isOnline) {
      try {
        const res = await fetch(`${this.baseUrl}/alumnos/apoderado/${parentId}`, {
          headers: this.getHeaders()
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn("[API] Fallo alumnos vía API, usando datos locales", err);
      }
    }
    return mockData.parentStudents;
  },

  // 3. Actividades con preguntas y voz
  async getActivitiesByCourse(courseId = 1) {
    if (this.isOnline) {
      try {
        const res = await fetch(`${this.baseUrl}/actividades/curso/${courseId}`, {
          headers: this.getHeaders()
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn("[API] Fallo actividades vía API, usando datos locales", err);
      }
    }
    return mockData.studentActivities;
  },

  // 4. Calificaciones, Estados de Actividades y Reportería Sincronizada con Base de Datos
  async getStudentGrades(studentId = 1) {
    if (this.isOnline) {
      try {
        const res = await fetch(`${this.baseUrl}/calificaciones/alumno/${studentId}`, {
          headers: this.getHeaders()
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn("[API] Fallo calificaciones vía API, usando datos locales", err);
      }
    }
    return {
      promedio_general: mockData.currentStudent.overallGrade,
      entregas: mockData.gradeHistory
    };
  },

  async getReporteriaSummary(studentId = 'alu-102') {
    try {
      const res = await fetch(`${this.baseUrl}/calificaciones/reporteria/${encodeURIComponent(studentId)}`, {
        headers: this.getHeaders()
      });
      if (res.ok) {
        this.isOnline = true;
        return await res.json();
      }
    } catch (err) {
      console.warn("[API] Usando estados locales para reportería:", err);
    }
    return null;
  },

  async updateActivityState(payload) {
    try {
      const res = await fetch(`${this.baseUrl}/actividades/estado`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        this.isOnline = true;
        return await res.json();
      }
    } catch (err) {
      console.warn("[API] Guardando estado de actividad en memoria local:", err);
    }
    return { success: false, offline: true };
  },

  async syncStudentDataFromDb(studentId) {
    const targetId = studentId || (window.mockData && mockData.selectedStudentId) || 'alu-102';
    const data = await this.getReporteriaSummary(targetId);
    if (!data || !window.mockData) return null;

    // 1. Actualizar actividades locales con los estados reales de la base de datos
    const localList = targetId === 'alu-103' ? mockData.sofiaActivities : mockData.studentActivities;
    if (Array.isArray(data.actividades) && Array.isArray(localList)) {
      data.actividades.forEach(dbAct => {
        let match = localList.find(a =>
          (dbAct.codigo_frontend && a.id === dbAct.codigo_frontend) ||
          (dbAct.titulo && a.title.toLowerCase() === dbAct.titulo.toLowerCase())
        );
        if (match) {
          match.dbId = dbAct.actividad_id;
          match.status = dbAct.estado || 'Pendiente';
          match.progressPercent = dbAct.progreso !== undefined ? Number(dbAct.progreso) : 0;
          if (dbAct.calificacion !== null && dbAct.calificacion !== undefined) {
            const gradeNum = Number(dbAct.calificacion).toFixed(1);
            match.score = `${gradeNum} / 7.0`;
            match.gradeValue = Number(gradeNum);
          } else if (match.status !== 'Entregada') {
            delete match.score;
            delete match.gradeValue;
          }
          if (match.status === 'Entregada') {
            match.urgent = false;
          }
          if (dbAct.comentarios) {
            match.comments = dbAct.comentarios;
          }
        }
      });
    }

    // 2. Actualizar métricas de Reportería del estudiante activo
    const studentObj = (mockData.parentStudents || []).find(s => s.id === targetId);
    if (studentObj) {
      if (data.overall_grade) studentObj.overallGrade = Number(data.overall_grade).toFixed(1);
      if (data.math_grade) studentObj.mathGrade = Number(data.math_grade).toFixed(1);
      if (data.math_status) studentObj.mathStatus = data.math_status;
      if (data.math_tasks) studentObj.mathTasks = data.math_tasks;
      if (data.language_grade) studentObj.languageGrade = Number(data.language_grade).toFixed(1);
      if (data.language_status) studentObj.languageStatus = data.language_status;
      if (data.language_tasks) studentObj.languageTasks = data.language_tasks;
      if (data.completed_activities_month !== undefined) {
        studentObj.completedActivitiesMonth = data.completed_activities_month;
      }
      if (data.completion_rate !== undefined) {
        studentObj.completionRate = data.completion_rate;
      }
      studentObj.pendingCount = data.pending_count;
      studentObj.inProgressCount = data.in_progress_count;
      studentObj.completedCount = data.completed_count;
      studentObj.totalActivities = data.total_activities;

      if (data.next_pending_task && data.next_pending_task.titulo) {
        studentObj.pendingTaskTitle = data.next_pending_task.titulo;
        studentObj.pendingTaskStatus = data.next_pending_task.estado;
        if (data.pending_count === 0 && data.in_progress_count === 0) {
          studentObj.pendingTaskDeadline = "todas las tareas al día";
          studentObj.pendingTaskPrompt = "Felicitaciones, todas las actividades de la semana fueron completadas.";
        }
      }
    }

    // 3. Sincronizar historial de entregas para la tabla de Reportería
    if (Array.isArray(data.entregas) && data.entregas.length > 0) {
      const mappedGrades = data.entregas.map(e => ({
        id: e.id,
        actividadId: e.actividad_id,
        codigoFrontend: e.codigo_frontend,
        subject: e.asignatura || "Matemáticas",
        activity: e.actividad_titulo,
        date: e.fecha_entrega ? String(e.fecha_entrega) : "Hoy",
        grade: e.calificacion !== null && e.calificacion !== undefined ? Number(e.calificacion).toFixed(1) : null,
        status: e.estado || "Entregada",
        progress: e.progreso !== undefined ? Number(e.progreso) : 100,
        comments: e.comentarios || "",
        timeMinutes: e.tiempo_minutos || 10
      }));
      if (targetId === 'alu-103') {
        mockData.sofiaGradeHistory = mappedGrades;
      } else {
        mockData.gradeHistory = mappedGrades;
      }
    }

    mockData.currentStudent = mockData.getSelectedStudent();
    return data;
  },

  // 5. Mensajería
  async getConversations(userId = 13) {
    if (this.isOnline) {
      try {
        const res = await fetch(`${this.baseUrl}/mensajeria/conversaciones/usuario/${userId}`, {
          headers: this.getHeaders()
        });
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            return list;
          }
        }
      } catch (err) {
        console.warn("[API] Fallo conversaciones vía API, usando datos locales", err);
      }
    }
    return null;
  },

  async getMessages(conversationId = 1) {
    if (this.isOnline) {
      try {
        const res = await fetch(`${this.baseUrl}/mensajeria/conversacion/${conversationId}/mensajes`, {
          headers: this.getHeaders()
        });
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list)) {
            return list;
          }
        }
      } catch (err) {
        console.warn("[API] Fallo mensajería vía API, usando datos locales", err);
      }
    }
    return mockData.activeMessages;
  },

  async sendMessage(conversationId, senderId, text) {
    const cleanText = this.escapeHtml(text.trim());
    if (this.isOnline) {
      try {
        const res = await fetch(`${this.baseUrl}/mensajeria/mensaje`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            conversacion_id: conversationId,
            remitente_usuario_id: senderId,
            contenido: cleanText
          })
        });
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn("[API] Error enviando mensaje a la API", err);
      }
    }
    return { success: true, offline: true };
  },

  // 6. Reconocimiento de Voz STT (Deepgram a traves del servidor seguro)
  async getSttStatus() {
    try {
      const res = await fetch(`${this.baseUrl}/stt/status`);
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn("[API STT] Error consultando estado STT:", err);
    }
    return { configured: false, provider: "Deepgram", status: "offline" };
  },

  async transcribeAudio(audioBlob, language = 'es') {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'grabacion.webm');
      if (language) formData.append('language', language);

      const res = await fetch(`${this.baseUrl}/stt/transcribir`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        return await res.json();
      } else {
        const errData = await res.json().catch(() => ({}));
        console.warn("[API STT] Error transcribiendo audio:", errData);
        return { success: false, error: errData.detail || "Error en transcripcion" };
      }
    } catch (err) {
      console.warn("[API STT] Fallo de red en transcripcion:", err);
      return { success: false, error: "Fallo de conexion con servidor FastAPI (http://localhost:8000)" };
    }
  },

  // Grabador de voz interactivo para actividades escolares
  mediaRecorder: null,
  audioChunks: [],
  isRecordingAudio: false,
  _ttsBlobCache: {},

  async startVoiceRecording() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return { success: false, error: "Navegador no soporta captura de micrófono" };
      }
      // Limpiar cualquier stream previo que haya quedado abierto
      if (this.mediaRecorder && this.mediaRecorder.stream) {
        try {
          this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        } catch (e) {}
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      this.audioChunks = [];
      let options = {};
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported) {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          options = { mimeType: 'audio/webm;codecs=opus' };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          options = { mimeType: 'audio/webm' };
        }
      }
      this.mediaRecorder = new MediaRecorder(stream, options);
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) this.audioChunks.push(e.data);
      };
      // Solicitar fragmentos cada 200ms para garantizar datos completos desde el primer intento
      this.mediaRecorder.start(200);
      this.isRecordingAudio = true;
      return { success: true };
    } catch (err) {
      console.warn("[Voz] Error al acceder al micrófono:", err);
      return { success: false, error: "Permiso de micrófono denegado o no disponible" };
    }
  },

  async stopVoiceRecordingAndTranscribe(language = 'es') {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || !this.isRecordingAudio) {
        resolve({ success: false, error: "No hay grabación activa" });
        return;
      }

      this.mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          this.isRecordingAudio = false;
          // Liberar el micrófono
          if (this.mediaRecorder.stream) {
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
          }
          let result = await this.transcribeAudio(audioBlob, language);
          // Reintento automático único si hubo un micro-corte en el primer intento
          if (!result.success && audioBlob.size > 0) {
            await new Promise(r => setTimeout(r, 250));
            result = await this.transcribeAudio(audioBlob, language);
          }
          resolve(result);
        } catch (err) {
          resolve({ success: false, error: "Error procesando archivo de audio" });
        }
      };

      this.mediaRecorder.stop();
    });
  },

  // 7. Sintesis de Voz TTS (Robot Leo)
  getTtsAudioUrl(text, voiceId) {
    var clean = encodeURIComponent((text || '').trim());
    var vid = voiceId ? '&voice_id=' + encodeURIComponent(voiceId) : '';
    return this.baseUrl + '/tts/hablar?text=' + clean + vid;
  },

  async preloadTtsAudio(text, voiceId) {
    if (!text || !text.trim()) return null;
    var cacheKey = (voiceId || 'default') + '::' + text.trim();
    if (this._ttsBlobCache[cacheKey]) {
      return this._ttsBlobCache[cacheKey];
    }
    try {
      var url = this.getTtsAudioUrl(text, voiceId);
      var res = await fetch(url);
      if (res.ok) {
        var blob = await res.blob();
        var blobUrl = URL.createObjectURL(blob);
        this._ttsBlobCache[cacheKey] = blobUrl;
        return blobUrl;
      }
    } catch (err) {
      console.warn("[TTS] Precarga de audio:", err);
    }
    return null;
  },

  async speakText(text, voiceId, onEndedCallback) {
    if (!text || !text.trim()) return null;
    try {
      this.stopSpeaking();
      var cacheKey = (voiceId || 'default') + '::' + text.trim();
      var playUrl = this._ttsBlobCache[cacheKey];
      if (!playUrl) {
        playUrl = await this.preloadTtsAudio(text, voiceId);
      }
      if (!playUrl) {
        playUrl = this.getTtsAudioUrl(text, voiceId);
      }
      var audio = new Audio(playUrl);
      this._currentAudio = audio;
      if (typeof onEndedCallback === 'function') {
        audio.onended = () => {
          onEndedCallback();
        };
      }
      await audio.play();
      return audio;
    } catch (err) {
      console.warn("[TTS] Reproduccion de voz:", err);
      if (typeof onEndedCallback === 'function') {
        onEndedCallback();
      }
      return null;
    }
  },

  stopSpeaking() {
    if (this._currentAudio) {
      try {
        this._currentAudio.pause();
        this._currentAudio.currentTime = 0;
      } catch (e) {}
      this._currentAudio = null;
    }
  },

  // 8. Evaluador de Respuestas Abiertas por Voz (Comprensión Oral LE01 OA 18 - Retorno Booleano)
  async evaluateStoryAnswerWithAi(payload) {
    try {
      const res = await fetch(`${this.baseUrl}/ia/evaluar-respuesta`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn("[Evaluador Voz] Usando validacion local de respaldo:", err);
    }
    // Respaldo local en caso de desconexion
    const spoken = (payload.transcripcion_alumno || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const keywords = (payload.palabras_clave_respaldo || []).map(k => k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
    const isCorrect = keywords.some(kw => kw && spoken.includes(kw));
    return {
      success: true,
      es_correcto: Boolean(isCorrect),
      retroalimentacion: isCorrect
        ? "Muy bien dicho, tu respuesta sobre el cuento es correcta."
        : "Escucha nuevamente la pregunta del cuento e inténtalo otra vez con tu voz.",
      transcripcion_evaluada: payload.transcripcion_alumno || ""
    };
  }
};

window.api = api;


