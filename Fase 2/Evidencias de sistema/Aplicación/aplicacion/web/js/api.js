// EDUCONNECT API Client - Capstone Definitive Client Layer
// Maneja comunicación HTTP con FastAPI (http://localhost:8000/api)
// Estrategia Dual Mode: Utiliza datos reales de MySQL si el backend está activo;
// de lo contrario aplica fallback transparente a datos locales para garantizar resiliencia total.

const api = {
  localBackendUrl: 'http://127.0.0.1:8000/api',
  baseUrl: (window.location.protocol === 'file:' || !window.location.host) 
    ? 'http://127.0.0.1:8000/api' 
    : `${window.location.protocol}//${window.location.hostname}:8000/api`,
  isOnline: true,
  hasLocalBackend: false,
  checkedOnce: false,
  _liveSpeechTranscript: '',
  _speechRec: null,
  _currentUtterance: null,
  _currentAudio: null,
  _speakSeq: 0,
  _speakingTimer: null,
  _currentSpeakDone: null,
  token: sessionStorage.getItem('educonnect_jwt_token') || localStorage.getItem('educonnect_jwt_token') || null,

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

  // Comprobar si Firebase Cloud Firestore (o el backend local) están activos
  async checkHealth() {
    const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
    let fbHealthy = false;

    if (window.firebaseDb) {
      try {
        const fbHealth = await firebaseDb.checkHealth();
        if (fbHealth && fbHealth.database_connected) {
          fbHealthy = true;
          this.isOnline = true;
        }
      } catch (e) {}
    }

    const probeUrl = isLocalHost ? this.baseUrl : this.localBackendUrl;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const res = await fetch(`${probeUrl}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        this.hasLocalBackend = true;
        this.baseUrl = probeUrl;
        this.isOnline = this.isOnline || data.database_connected || data.status === 'healthy';
      } else {
        this.hasLocalBackend = false;
      }
    } catch (e) {
      this.hasLocalBackend = false;
    }

    if (!this.hasLocalBackend && !fbHealthy) {
      this.isOnline = false;
    }

    this.checkedOnce = true;
    this.updateConnectionBadge();
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

  // 1. Autenticación con verificación en Firebase Cloud Firestore
  async login(email, password) {
    if (window.firebaseDb) {
      try {
        const fbRes = await firebaseDb.login(email, password);
        if (fbRes.ok && fbRes.data) {
          this.isOnline = true;
          this.token = fbRes.data.access_token;
          try { sessionStorage.setItem('educonnect_jwt_token', this.token); } catch (e) {}
          return fbRes.data;
        }
      } catch (e) {}
    }
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
            try {
              sessionStorage.setItem('educonnect_jwt_token', data.access_token);
            } catch (e) {}
          }
          return data;
        }
      } catch (err) {
        console.warn("[API] Conexión remota no disponible, recurriendo a modo autónomo", err);
      }
    }
    // Fallback seguro verificando hash SHA-256
    const inputHash = (window.firebaseDb && firebaseDb.hashPassword)
      ? firebaseDb.hashPassword(password)
      : '';
    const roleKey = Object.keys(mockData.demoUsers).find(
      k => mockData.demoUsers[k].email.toLowerCase() === email.toLowerCase() &&
           mockData.demoUsers[k].password_hash === inputHash
    );
    return roleKey ? mockData.demoUsers[roleKey] : null;
  },

  logout() {
    this.token = null;
    try {
      sessionStorage.removeItem('educonnect_jwt_token');
      localStorage.removeItem('educonnect_jwt_token');
    } catch (e) {}
  },

  // 2. Alumnos y Familias (Multi-estudiante y Nómina de Curso)
  async getStudentsByParent(parentId = 13) {
    return mockData.parentStudents;
  },

  async getStudentsByCourse(courseId = 3) {
    if (window.firebaseDb) {
      this.isOnline = true;
      if (Number(courseId) === 4) {
        return [{
          id: 6,
          alumno_id: 6,
          codigo: "alu-103",
          nombre: "Sofía González Tapia",
          nombre_completo: "Sofía González Tapia",
          apoderado_nombre: "Carolina Tapia Morales",
          apoderado_usuario_id: 13,
          es_pie: false
        }];
      }
      return [{
        id: 5,
        alumno_id: 5,
        codigo: "alu-102",
        nombre: "Mateo González Tapia",
        nombre_completo: "Mateo González Tapia",
        apoderado_nombre: "Carolina Tapia Morales",
        apoderado_usuario_id: 13,
        es_pie: false,
        condicion_pie: "TEA Nivel 1"
      }];
    }
    try {
      const res = await fetch(`${this.baseUrl}/alumnos/curso/${courseId}`, {
        headers: this.getHeaders()
      });
      if (res.ok) {
        this.isOnline = true;
        return await res.json();
      }
    } catch (err) {
      console.warn("[API] Usando nómina local para el curso:", err);
    }
    return null;
  },

  // 3. Actividades con preguntas, voz y asignación docente
  async getActivitiesByCourse(courseId = 3) {
    if (window.firebaseDb) {
      try {
        const res = await firebaseDb.getActividadesAlumno(5);
        this.isOnline = true;
        return res.actividades || [];
      } catch (e) {}
    }
    return mockData.studentActivities;
  },

  async assignActivityToCourse(payload) {
    if (window.firebaseDb) {
      try {
        this.isOnline = true;
        return await firebaseDb.asignarActividad(payload);
      } catch (err) {
        console.warn("[Firebase] Error asignando actividad:", err);
      }
    }
    try {
      const res = await fetch(`${this.baseUrl}/actividades/asignar`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        this.isOnline = true;
        return await res.json();
      }
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.detail || 'Error al asignar actividad' };
    } catch (err) {
      console.warn("[API] Asignación guardada en modo local:", err);
      return { success: true, offline: true, entregas_creadas: (payload.alumnos || []).filter(a => a.habilitado).length, notificaciones_enviadas: (payload.alumnos || []).filter(a => a.habilitado).length };
    }
  },

  async getCourseActivitiesStatus(courseId = 3) {
    if (window.firebaseDb) {
      try {
        this.isOnline = true;
        return await firebaseDb.getEstadoActividadesCurso(courseId);
      } catch (err) {
        console.warn("[Firebase] Error consultando estado del curso:", err);
      }
    }
    try {
      const res = await fetch(`${this.baseUrl}/actividades/estado-curso/${courseId}`, {
        headers: this.getHeaders()
      });
      if (res.ok) {
        this.isOnline = true;
        const data = await res.json();
        return data.actividades || [];
      }
    } catch (err) {
      console.warn("[API] Fallo estado-curso:", err);
    }
    return null;
  },

  async unassignActivity(payload) {
    if (window.firebaseDb) {
      try {
        this.isOnline = true;
        return await firebaseDb.desasignarActividad(payload);
      } catch (err) {
        console.warn("[Firebase] Error desasignando actividad:", err);
      }
    }
    try {
      const res = await fetch(`${this.baseUrl}/actividades/desasignar`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        this.isOnline = true;
        return await res.json();
      }
    } catch (err) {
      console.warn("[API] Fallo desasignar actividad:", err);
    }
    return { success: true, offline: true };
  },

  async unassignAllActivities(courseId = 3) {
    if (window.firebaseDb) {
      try {
        this.isOnline = true;
        return await firebaseDb.desasignarTodasActividades(courseId);
      } catch (err) {
        console.warn("[Firebase] Error desasignando todas las actividades:", err);
      }
    }
    try {
      const res = await fetch(`${this.baseUrl}/actividades/desasignar-todas`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ curso_id: courseId })
      });
      if (res.ok) {
        this.isOnline = true;
        return await res.json();
      }
    } catch (err) {
      console.warn("[API] Fallo desasignar todas:", err);
    }
    return { success: true, offline: true };
  },

  // 4. Calificaciones, Estados de Actividades y Reportería Sincronizada con Cloud Firestore
  async getStudentGrades(studentId = 1) {
    if (window.firebaseDb) {
      try {
        const rep = await firebaseDb.getReporteriaSummary(studentId);
        return {
          promedio_general: rep.overall_grade,
          entregas: rep.entregas
        };
      } catch (e) {}
    }
    return {
      promedio_general: mockData.currentStudent.overallGrade,
      entregas: mockData.gradeHistory
    };
  },

  async getReporteriaSummary(studentId = 'alu-102') {
    if (window.firebaseDb) {
      try {
        this.isOnline = true;
        return await firebaseDb.getReporteriaSummary(studentId);
      } catch (err) {
        console.warn("[Firebase] Error obteniendo reportería:", err);
      }
    }
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
    if (window.firebaseDb) {
      try {
        this.isOnline = true;
        return await firebaseDb.actualizarEstadoActividad(payload);
      } catch (err) {
        console.warn("[Firebase] Error actualizando estado de actividad:", err);
      }
    }
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

    if (!mockData._studentCatalogBackup) {
      mockData._studentCatalogBackup = JSON.parse(JSON.stringify(mockData.studentActivities || []));
    }
    if (!mockData._sofiaCatalogBackup) {
      mockData._sofiaCatalogBackup = JSON.parse(JSON.stringify(mockData.sofiaActivities || []));
    }

    // 1. Filtrar y actualizar actividades locales únicamente con las actividades asignadas en la BD
    const catalogSource = targetId === 'alu-103' ? mockData._sofiaCatalogBackup : mockData._studentCatalogBackup;
    if (Array.isArray(data.actividades) && Array.isArray(catalogSource)) {
      const assignedList = [];
      data.actividades.forEach(dbAct => {
        const dbTitle = (dbAct.titulo || '').toLowerCase();
        let template = catalogSource.find(a =>
          (dbAct.codigo_frontend && a.id === dbAct.codigo_frontend) ||
          (dbTitle && a.title.toLowerCase() === dbTitle)
        );
        if (!template) {
          template = catalogSource[0] || {};
        }
        const cloned = JSON.parse(JSON.stringify(template));
        cloned.id = dbAct.codigo_frontend || cloned.id || `act-db-${dbAct.actividad_id}`;
        cloned.dbId = dbAct.actividad_id;
        cloned.title = dbAct.titulo || cloned.title;
        cloned.subject = dbAct.asignatura || cloned.subject;
        cloned.status = dbAct.estado || 'Pendiente';
        cloned.progressPercent = dbAct.progreso !== undefined ? Number(dbAct.progreso) : 0;
        if (dbAct.calificacion !== null && dbAct.calificacion !== undefined) {
          const gradeNum = Math.round(Number(dbAct.calificacion));
          cloned.score = `${gradeNum} / 10 pts`;
          cloned.gradeValue = gradeNum;
        } else if (cloned.status !== 'Entregada') {
          delete cloned.score;
          delete cloned.gradeValue;
        }
        if (cloned.status === 'Entregada') {
          cloned.urgent = false;
        }
        if (dbAct.comentarios) {
          cloned.comments = dbAct.comentarios;
        }
        if (dbAct.diagnostico_profesor) {
          cloned.teacherDiagnosis = dbAct.diagnostico_profesor;
        } else if (dbAct.comentarios && String(dbAct.comentarios).includes('Se equivocó en:')) {
          cloned.teacherDiagnosis = String(dbAct.comentarios).substring(String(dbAct.comentarios).indexOf('Se equivocó en:'));
        } else {
          delete cloned.teacherDiagnosis;
        }
        assignedList.push(cloned);
      });

      if (targetId === 'alu-103') {
        mockData.sofiaActivities = assignedList;
      } else {
        mockData.studentActivities = assignedList;
      }
    }

    // 2. Actualizar métricas de Reportería del estudiante activo
    const studentObj = (mockData.parentStudents || []).find(s => s.id === targetId);
    if (studentObj) {
      if (data.overall_grade !== undefined && data.overall_grade !== null) {
        studentObj.overallGrade = Number(data.overall_grade) > 0 ? Number(data.overall_grade).toFixed(1) : '0';
      }
      if (data.math_grade !== undefined && data.math_grade !== null) {
        studentObj.mathGrade = Number(data.math_grade) > 0 ? Number(data.math_grade).toFixed(1) : '0';
      }
      if (data.math_status) studentObj.mathStatus = data.math_status;
      if (data.math_tasks) studentObj.mathTasks = data.math_tasks;
      if (data.language_grade !== undefined && data.language_grade !== null) {
        studentObj.languageGrade = Number(data.language_grade) > 0 ? Number(data.language_grade).toFixed(1) : '0';
      }
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
          studentObj.pendingTaskDeadline = data.total_activities === 0 ? "sin tareas asignadas" : "todas las tareas al día";
          studentObj.pendingTaskPrompt = data.total_activities === 0
            ? "Aún no hay actividades asignadas por la profesora."
            : "Felicitaciones, todas las actividades de la semana fueron completadas.";
        }
      }
    }

    // 3. Sincronizar historial de entregas para la tabla de Reportería (incluyendo cuando queda vacío en 0)
    if (Array.isArray(data.entregas)) {
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
    if (window.firebaseDb) {
      try {
        this.isOnline = true;
        return await firebaseDb.getConversaciones(userId);
      } catch (err) {
        console.warn("[Firebase] Error obteniendo conversaciones:", err);
      }
    }
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
    if (window.firebaseDb) {
      try {
        this.isOnline = true;
        return await firebaseDb.getMensajes(conversationId);
      } catch (err) {
        console.warn("[Firebase] Error obteniendo mensajes:", err);
      }
    }
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
    if (window.firebaseDb) {
      try {
        this.isOnline = true;
        return await firebaseDb.enviarMensaje(conversationId, senderId, cleanText);
      } catch (err) {
        console.warn("[Firebase] Error enviando mensaje:", err);
      }
    }
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
  _audioContext: null,
  _analyser: null,
  _vadInterval: null,
  _hasSpokenVoice: false,
  _silenceStartTimestamp: null,

  stopVoiceRecordingCleanup() {
    if (this._vadInterval) {
      clearInterval(this._vadInterval);
      this._vadInterval = null;
    }
    if (this._speechRec) {
      try {
        this._speechRec.onresult = null;
        this._speechRec.onerror = null;
        this._speechRec.onend = null;
        this._speechRec.stop();
      } catch (e) {}
      this._speechRec = null;
    }
    if (this._audioContext) {
      try {
        this._audioContext.close();
      } catch (e) {}
      this._audioContext = null;
    }
    this._analyser = null;
    this._hasSpokenVoice = false;
    this._silenceStartTimestamp = null;
    if (this.mediaRecorder) {
      try {
        this.mediaRecorder.ondataavailable = null;
        this.mediaRecorder.onstop = null;
        if (this.mediaRecorder.state && this.mediaRecorder.state !== 'inactive') {
          this.mediaRecorder.stop();
        }
        if (this.mediaRecorder.stream) {
          this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
      } catch (e) {}
      this.mediaRecorder = null;
    }
    this.isRecordingAudio = false;
  },

  async startVoiceRecording(onSilenceDetected, options = {}) {
    this.stopVoiceRecordingCleanup();
    this._liveSpeechTranscript = '';
    const skipBrowserRec = Boolean(options && options.skipBrowserSpeechRec);

    let speechRecStarted = false;
    if (!skipBrowserRec) {
      const SpeechRec = (typeof window !== 'undefined') && (window.SpeechRecognition || window.webkitSpeechRecognition);
      if (SpeechRec) {
        try {
          const rec = new SpeechRec();
          rec.lang = 'es-CL';
          rec.continuous = true;
          rec.interimResults = true;
          let accumulatedFinal = '';
          let lastFinalIndex = 0;

          rec.onresult = (event) => {
            let newFinal = '';
            let currentInterim = '';
            for (let i = 0; i < event.results.length; i++) {
              const txt = (event.results[i][0] && event.results[i][0].transcript) ? event.results[i][0].transcript : '';
              if (event.results[i].isFinal) {
                if (i >= lastFinalIndex) {
                  newFinal += ' ' + txt;
                  lastFinalIndex = i + 1;
                }
              } else {
                currentInterim += ' ' + txt;
              }
            }
            if (newFinal) {
              accumulatedFinal = (accumulatedFinal + ' ' + newFinal).trim();
            }
            const combined = (accumulatedFinal + ' ' + currentInterim).trim();
            if (combined) {
              this._liveSpeechTranscript = combined;
              this._hasSpokenVoice = true;
              this._silenceStartTimestamp = null;
              if (typeof onSilenceDetected === 'function') {
                if (this._speechAutoStopTimer) clearTimeout(this._speechAutoStopTimer);
                this._speechAutoStopTimer = setTimeout(() => {
                  if (this.isRecordingAudio) {
                    onSilenceDetected();
                  }
                }, 1450);
              }
            }
          };
          rec.onerror = (ev) => {
            console.warn('[WebSpeech STT] Aviso:', ev && ev.error);
          };
          rec.onend = () => {
            if (this.isRecordingAudio && this._speechRec === rec) {
              try {
                lastFinalIndex = 0;
                rec.start();
              } catch (e) {}
            }
          };
          rec.start();
          this._speechRec = rec;
          speechRecStarted = true;
        } catch (recErr) {
          console.warn('[WebSpeech STT] No se pudo iniciar reconocimiento del navegador:', recErr);
        }
      }
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (speechRecStarted) {
          this.isRecordingAudio = true;
          return { success: true };
        }
        return { success: false, error: "Navegador no soporta captura de micrófono" };
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      this.audioChunks = [];
      let recOptions = {};
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported) {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          recOptions = { mimeType: 'audio/webm;codecs=opus' };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          recOptions = { mimeType: 'audio/webm' };
        }
      }
      this.mediaRecorder = new MediaRecorder(stream, recOptions);
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) this.audioChunks.push(e.data);
      };
      this.mediaRecorder.start(200);
      this.isRecordingAudio = true;

      // Analizador de audio en vivo + Detector de Silencio opcional (Auto-Stop VAD)
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          this._audioContext = new AudioContextClass();
          const source = this._audioContext.createMediaStreamSource(stream);
          this._analyser = this._audioContext.createAnalyser();
          this._analyser.fftSize = 512;
          source.connect(this._analyser);

          if (typeof onSilenceDetected === 'function') {
            const bufferLength = this._analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            this._hasSpokenVoice = false;
            this._silenceStartTimestamp = null;
            const SPEECH_THRESHOLD = 18; // Nivel de volumen mínimo para detectar voz activa
            const SILENCE_DURATION_MS = 1350; // 1.35s de silencio posterior a haber hablado

            this._vadInterval = setInterval(() => {
              if (!this.isRecordingAudio || !this._analyser) {
                if (this._vadInterval) {
                  clearInterval(this._vadInterval);
                  this._vadInterval = null;
                }
                return;
              }
              this._analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
              }
              const averageVolume = sum / bufferLength;

              if (averageVolume > SPEECH_THRESHOLD) {
                this._hasSpokenVoice = true;
                this._silenceStartTimestamp = null;
              } else if (this._hasSpokenVoice) {
                const now = Date.now();
                if (!this._silenceStartTimestamp) {
                  this._silenceStartTimestamp = now;
                } else if (now - this._silenceStartTimestamp >= SILENCE_DURATION_MS) {
                  if (this._vadInterval) {
                    clearInterval(this._vadInterval);
                    this._vadInterval = null;
                  }
                  onSilenceDetected();
                }
              }
            }, 100);
          }
        }
      } catch (vadErr) {
        console.warn("[VAD] Analizador de audio no disponible:", vadErr);
      }

      return { success: true };
    } catch (err) {
      console.warn("[Voz] Error al acceder al micrófono via getUserMedia:", err);
      if (speechRecStarted) {
        this.isRecordingAudio = true;
        return { success: true };
      }
      this.stopVoiceRecordingCleanup();
      return { success: false, error: "Permiso de micrófono denegado o no disponible" };
    }
  },

  async stopVoiceRecordingAndTranscribe(language = 'es') {
    if (this._speechAutoStopTimer) {
      clearTimeout(this._speechAutoStopTimer);
      this._speechAutoStopTimer = null;
    }

    // Dar un breve respiro para que Web Speech API emita los últimos tokens finales
    if (this._speechRec) {
      await new Promise(r => setTimeout(r, 250));
    }

    const activeSpeechRec = this._speechRec;
    if (activeSpeechRec) {
      try {
        activeSpeechRec.onend = null;
        activeSpeechRec.stop();
      } catch (e) {}
    }

    const browserTranscript = (this._liveSpeechTranscript || '').trim();

    if (!this.hasLocalBackend) {
      this.stopVoiceRecordingCleanup();
      return {
        success: true,
        transcripcion: browserTranscript,
        transcript: browserTranscript,
        provider: 'browser-speech-recognition'
      };
    }

    return new Promise((resolve) => {
      if (!this.mediaRecorder || !this.isRecordingAudio) {
        this.stopVoiceRecordingCleanup();
        if (browserTranscript) {
          resolve({ success: true, transcripcion: browserTranscript, transcript: browserTranscript });
        } else {
          resolve({ success: false, error: "No hay grabación activa" });
        }
        return;
      }

      this.mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          this.isRecordingAudio = false;
          this.stopVoiceRecordingCleanup();

          let result = await this.transcribeAudio(audioBlob, language);
          if (!result.success && audioBlob.size > 0) {
            await new Promise(r => setTimeout(r, 200));
            result = await this.transcribeAudio(audioBlob, language);
          }
          if ((!result || !result.success || !(result.transcripcion || result.transcript || '').trim()) && browserTranscript) {
            resolve({ success: true, transcripcion: browserTranscript, transcript: browserTranscript });
            return;
          }
          resolve(result);
        } catch (err) {
          this.stopVoiceRecordingCleanup();
          if (browserTranscript) {
            resolve({ success: true, transcripcion: browserTranscript, transcript: browserTranscript });
          } else {
            resolve({ success: false, error: "Error procesando archivo de audio" });
          }
        }
      };

      try {
        this.mediaRecorder.stop();
      } catch (e) {
        this.stopVoiceRecordingCleanup();
        if (browserTranscript) {
          resolve({ success: true, transcripcion: browserTranscript, transcript: browserTranscript });
        } else {
          resolve({ success: false, error: "Error al detener grabador" });
        }
      }
    });
  },

  // Precarga masiva de audios de una actividad para latencia cero
  async preloadActivityAudios(act) {
    if (!act) return;
    const textsToPreload = [];
    if (act.disclaimerTtsText) textsToPreload.push(act.disclaimerTtsText);
    if (act.storyText) textsToPreload.push(act.storyText);
    if (act.activityType === 'counting' && window.components && Array.isArray(components.countingItems)) {
      components.countingItems.forEach(item => {
        if (item.speechPrompt) textsToPreload.push(item.speechPrompt);
      });
    }
    if (Array.isArray(act.questions)) {
      act.questions.forEach(q => {
        if (q.speechAudioText) textsToPreload.push(q.speechAudioText);
        else if (q.question) textsToPreload.push(q.question);
        else if (q.text) textsToPreload.push(q.text.replace(/<[^>]+>/g, ''));
      });
    }
    await Promise.allSettled(textsToPreload.map(t => this.preloadTtsAudio(t)));
  },

  // 7. Sintesis de Voz TTS (Robot Leo)
  getStaticTtsAudioUrl(text, voiceId) {
    const clean = (text || '').trim();
    if (!clean || !window.firebaseDb || typeof window.firebaseDb.sha256 !== 'function') return null;
    const vid = (voiceId || 'IKne3meq5aSn9XLyUdCD').trim();
    const raw = `${vid}_${clean}`;
    const utf8 = unescape(encodeURIComponent(raw));
    const digest = window.firebaseDb.sha256(utf8);
    return digest ? `audio_cache/${digest}.mp3` : null;
  },

  getTtsAudioUrl(text, voiceId) {
    var clean = encodeURIComponent((text || '').trim());
    var vid = voiceId ? '&voice_id=' + encodeURIComponent(voiceId) : '';
    return this.baseUrl + '/tts/hablar?text=' + clean + vid;
  },

  async preloadTtsAudio(text, voiceId) {
    if (!text || !text.trim()) return null;
    var cleanText = text.trim();
    var cacheKey = (voiceId || 'default') + '::' + cleanText;
    if (this._ttsBlobCache[cacheKey]) {
      return this._ttsBlobCache[cacheKey];
    }

    var staticUrl = this.getStaticTtsAudioUrl(cleanText, voiceId);
    if (staticUrl) {
      try {
        var staticRes = await fetch(staticUrl);
        if (staticRes.ok) {
          var ct = (staticRes.headers.get('content-type') || '').toLowerCase();
          var staticBlob = await staticRes.blob();
          if (ct.includes('audio') || staticBlob.size > 500) {
            var staticBlobUrl = URL.createObjectURL(staticBlob);
            this._ttsBlobCache[cacheKey] = staticBlobUrl;
            return staticBlobUrl;
          }
        }
      } catch (err) {}
    }

    if (!this.hasLocalBackend) return null;

    try {
      var url = this.getTtsAudioUrl(cleanText, voiceId);
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
    if (!text || !text.trim()) {
      if (typeof onEndedCallback === 'function') onEndedCallback();
      return null;
    }

    this.stopSpeaking();
    const mySeq = (this._speakSeq = (this._speakSeq || 0) + 1);
    const cleanText = text.trim();

    try {
      var cacheKey = (voiceId || 'default') + '::' + cleanText;
      var playUrl = this._ttsBlobCache[cacheKey];
      if (!playUrl) {
        playUrl = await this.preloadTtsAudio(cleanText, voiceId);
      }
      if (mySeq !== this._speakSeq) return null;
      if (playUrl) {
        const audioPlayed = await new Promise((resolve) => {
          var audio = new Audio(playUrl);
          this._currentAudio = audio;
          var settled = false;
          var finishAudio = (ok) => {
            if (settled) return;
            settled = true;
            if (this._currentAudio === audio) {
              this._currentAudio = null;
            }
            if (this._currentSpeakDone === finishAudio) {
              this._currentSpeakDone = null;
            }
            if (ok && mySeq === this._speakSeq && typeof onEndedCallback === 'function') {
              onEndedCallback();
            }
            resolve(ok);
          };
          this._currentSpeakDone = () => finishAudio(true);

          audio.onended = () => finishAudio(true);
          audio.onerror = () => finishAudio(false);

          var playPromise = audio.play();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => finishAudio(false));
          }
        });
        if (audioPlayed || mySeq !== this._speakSeq) {
          return this._currentAudio;
        }
      }
    } catch (err) {
      console.warn("[TTS] Reproduccion de voz cache/backend:", err);
    }

    // Síntesis de voz nativa del navegador (Web SpeechSynthesis) cuando corre en Firebase Hosting
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      return new Promise((resolve) => {
        let callbackFired = false;
        const finishSpeak = (retVal) => {
          if (callbackFired) return;
          callbackFired = true;
          if (this._speakingTimer) {
            clearTimeout(this._speakingTimer);
            this._speakingTimer = null;
          }
          if (this._currentSpeakDone === finishSpeak) {
            this._currentSpeakDone = null;
          }
          if (mySeq === this._speakSeq && typeof onEndedCallback === 'function') {
            onEndedCallback();
          }
          resolve(retVal || null);
        };
        this._currentSpeakDone = finishSpeak;

        try {
          const synth = window.speechSynthesis;
          if (synth.speaking || synth.pending) {
            synth.cancel();
          }
          if (synth.paused) {
            synth.resume();
          }

          const utter = new SpeechSynthesisUtterance(cleanText);
          this._currentUtterance = utter;
          utter.lang = 'es-CL';
          utter.rate = 0.96;
          utter.pitch = 1.05;

          const voices = synth.getVoices ? synth.getVoices() : [];
          const esVoice = voices.find(v => (v.lang || '').toLowerCase() === 'es-cl')
            || voices.find(v => (v.lang || '').toLowerCase() === 'es-es')
            || voices.find(v => (v.lang || '').toLowerCase() === 'es-mx')
            || voices.find(v => (v.lang || '').toLowerCase() === 'es-419')
            || voices.find(v => (v.lang || '').toLowerCase().startsWith('es'));
          if (esVoice) utter.voice = esVoice;

          utter.onend = () => finishSpeak(utter);
          utter.onerror = () => finishSpeak(utter);

          const safetyMs = Math.min(18000, Math.max(2500, cleanText.length * 95));
          this._speakingTimer = setTimeout(() => finishSpeak(utter), safetyMs);

          synth.speak(utter);
        } catch (e) {
          finishSpeak(null);
        }
      });
    }

    if (typeof onEndedCallback === 'function') {
      onEndedCallback();
    }
    return null;
  },

  stopSpeaking() {
    this._speakSeq = (this._speakSeq || 0) + 1;
    if (this._speakingTimer) {
      clearTimeout(this._speakingTimer);
      this._speakingTimer = null;
    }
    if (this._currentAudio) {
      try {
        this._currentAudio.onended = null;
        this._currentAudio.onerror = null;
        this._currentAudio.pause();
        this._currentAudio.currentTime = 0;
      } catch (e) {}
      this._currentAudio = null;
    }
    this._currentUtterance = null;
    if (this._currentSpeakDone) {
      const resolvePrev = this._currentSpeakDone;
      this._currentSpeakDone = null;
      try { resolvePrev(null); } catch (e) {}
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }
  },

  // 8. Evaluador de Respuestas Abiertas por Voz (Comprensión Oral LE01 OA 18 - Retorno Booleano)
  async evaluateStoryAnswerWithAi(payload) {
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
  },

  // 9. Revisión Docente de Actividad con Tiempos por Número y Resumen IA (Cloud Firestore)
  async getRevisionActividad(cursoId = 3, codigoFrontend = 'act-conteo', alumnoId = null) {
    if (window.firebaseDb) {
      try {
        this.isOnline = true;
        return await firebaseDb.getRevisionActividad(cursoId, codigoFrontend, alumnoId || 5);
      } catch (err) {
        console.warn("[Firebase] Error consultando revisión de actividad:", err);
      }
    }
    try {
      const q = alumnoId ? `?alumno_id=${encodeURIComponent(alumnoId)}` : '';
      const res = await fetch(`${this.baseUrl}/actividades/revision/${cursoId}/${encodeURIComponent(codigoFrontend)}${q}`, {
        headers: this.getHeaders()
      });
      if (res.ok) {
        this.isOnline = true;
        return await res.json();
      }
    } catch (err) {
      console.warn("[API] Error consultando revisión de actividad:", err);
    }
    return null;
  },

  async generarResumenDocenteIa(payload) {
    if (window.firebaseDb) {
      this.isOnline = true;
      return firebaseDb.buildResumenDocenteIa(payload || {});
    }
    try {
      const res = await fetch(`${this.baseUrl}/ia/resumen-actividad-docente`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        this.isOnline = true;
        return await res.json();
      }
    } catch (err) {
      console.warn("[API] Error generando resumen IA docente:", err);
    }
    return null;
  },

  async enviarResumenApoderado(payload) {
    if (window.firebaseDb) {
      try {
        this.isOnline = true;
        return await firebaseDb.enviarResumenApoderado(payload);
      } catch (err) {
        console.warn("[Firebase] Error enviando resumen al apoderado:", err);
      }
    }
    try {
      const res = await fetch(`${this.baseUrl}/mensajeria/enviar-resumen-apoderado`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        this.isOnline = true;
        return await res.json();
      }
    } catch (err) {
      console.warn("[API] Error enviando resumen al apoderado:", err);
    }
    return null;
  },

  async reiniciarPuntajeActividad(payload) {
    if (window.firebaseDb) {
      try {
        this.isOnline = true;
        return await firebaseDb.reiniciarPuntajeActividad(payload);
      } catch (err) {
        console.warn("[Firebase] Error reiniciando puntaje:", err);
      }
    }
    try {
      const res = await fetch(`${this.baseUrl}/actividades/reiniciar-puntaje`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        this.isOnline = true;
        return await res.json();
      }
    } catch (err) {
      console.warn("[API] Error reiniciando puntaje:", err);
    }
    return null;
  },

  // 10. Gestión de Alertas y Notificaciones Oficiales (Cloud Firestore)
  async getAlertasUsuario(usuarioId = 13) {
    if (window.firebaseDb) {
      try {
        this.isOnline = true;
        return await firebaseDb.getAlertasUsuario(usuarioId);
      } catch (err) {
        console.warn("[Firebase] Error obteniendo alertas:", err);
      }
    }
    try {
      const res = await fetch(`${this.baseUrl}/alertas/usuario/${usuarioId}`, {
        headers: this.getHeaders()
      });
      if (res.ok) {
        this.isOnline = true;
        return await res.json();
      }
    } catch (err) {
      console.warn("[API] Error obteniendo alertas:", err);
    }
    return [];
  },

  async emitirAlerta(payload) {
    if (window.firebaseDb) {
      try {
        this.isOnline = true;
        return await firebaseDb.emitirAlerta(payload);
      } catch (err) {
        console.warn("[Firebase] Error emitiendo alerta:", err);
      }
    }
    try {
      const res = await fetch(`${this.baseUrl}/alertas/`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          usuario_id: payload.usuario_id || 13,
          tipo: payload.tipo || 'urgente',
          titulo: payload.titulo || '',
          contenido: payload.contenido || ''
        })
      });
      if (res.ok) {
        this.isOnline = true;
        return await res.json();
      }
    } catch (err) {
      console.warn("[API] Error emitiendo alerta:", err);
    }
    return null;
  },

  async marcarAlertaLeida(notificacionId) {
    if (window.firebaseDb) {
      try {
        this.isOnline = true;
        return await firebaseDb.marcarAlertaLeida(notificacionId);
      } catch (err) {
        console.warn("[Firebase] Error marcando alerta leída:", err);
      }
    }
    try {
      const res = await fetch(`${this.baseUrl}/alertas/${notificacionId}/leer`, {
        method: 'PUT',
        headers: this.getHeaders()
      });
      if (res.ok) {
        this.isOnline = true;
        return await res.json();
      }
    } catch (err) {
      console.warn("[API] Error marcando alerta leída:", err);
    }
    return null;
  },

  async limpiarAlertas() {
    if (window.firebaseDb) {
      try {
        this.isOnline = true;
        return await firebaseDb.limpiarAlertas();
      } catch (err) {
        console.warn("[Firebase] Error limpiando alertas:", err);
      }
    }
    try {
      const res = await fetch(`${this.baseUrl}/alertas/limpiar`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      if (res.ok) {
        this.isOnline = true;
        return await res.json();
      }
    } catch (err) {
      console.warn("[API] Error limpiando alertas:", err);
    }
    return null;
  }
};

window.api = api;


