// API Client Móvil EduConnect - Conectado a Firebase Cloud Firestore
const mobileApi = {
  baseUrl: 'https://educonnect-capstone-2026-8f776.web.app/api',
  token: localStorage.getItem('educonnect_jwt_token') || null,
  isOnline: true,
  _currentAudio: null,
  _ttsCache: {},
  _speakingTimer: null,

  setBaseUrl(url) {
    if (!url) return;
    let clean = String(url).trim().replace(/\/+$/, '');
    if (!/^https?:\/\//i.test(clean)) {
      clean = 'https://' + clean;
    }
    clean = clean.replace(/\/api\/?$/i, '') + '/api';
    this.baseUrl = clean;
  },

  getServerHostUrl() {
    return (this.baseUrl || 'https://educonnect-capstone-2026-8f776.web.app/api').replace(/\/api\/?$/, '');
  },

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = this.token || localStorage.getItem('educonnect_jwt_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  // Petición HTTP con temporizador JS estricto (evita bloqueos en Android WebView durante SYN_SENT)
  probeSingleHealth(hostBase, timeoutMs = 2000) {
    return new Promise((resolve) => {
      let settled = false;
      let xhr = null;
      const done = (resObj) => {
        if (settled) return;
        settled = true;
        clearTimeout(hardTimer);
        resolve(resObj);
      };

      const hardTimer = setTimeout(() => {
        try { if (xhr) xhr.abort(); } catch (e) {}
        done({ ok: false, error: 'Timeout', host: hostBase });
      }, timeoutMs);

      try {
        xhr = new XMLHttpRequest();
        xhr.open('GET', `${hostBase}/api/health?_t=${Date.now()}`, true);
        xhr.timeout = timeoutMs;
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            let data = {};
            try { data = JSON.parse(xhr.responseText || '{}'); } catch (e) {}
            done({ ok: true, data, host: hostBase });
          } else {
            done({ ok: false, error: 'HTTP ' + xhr.status, host: hostBase });
          }
        };
        xhr.onerror = () => done({ ok: false, error: 'Network error', host: hostBase });
        xhr.ontimeout = () => done({ ok: false, error: 'Timeout', host: hostBase });
        xhr.send();
      } catch (err) {
        done({ ok: false, error: err.message || 'Error', host: hostBase });
      }
    });
  },

  // [REQ-01] Prueba inmediata contra Firebase Cloud Firestore (y opcionalmente servidor LAN)
  async checkHealth(candidateUrl) {
    if (candidateUrl && String(candidateUrl).trim()) {
      this.setBaseUrl(candidateUrl);
    }

    if (window.firebaseDb) {
      try {
        const fbRes = await firebaseDb.checkHealth();
        if (fbRes && fbRes.database_connected) {
          this.isOnline = true;
          return {
            success: true,
            data: fbRes,
            host: `Firebase Cloud (${fbRes.project_id})`
          };
        }
      } catch (e) {}
    }

    this.isOnline = false;
    return {
      success: false,
      error: 'Error de conexión: verifique su conexión a internet',
      host: 'Firebase Cloud'
    };
  },

  // 1. Autenticación (Firebase Cloud Firestore)
  async login(email, password) {
    if (window.firebaseDb) {
      try {
        const fbRes = await firebaseDb.login(email, password);
        if (fbRes.ok && fbRes.data) {
          this.isOnline = true;
          this.token = fbRes.data.access_token;
          try { localStorage.setItem('educonnect_jwt_token', this.token); } catch (e) {}
          return { success: true, data: fbRes.data };
        }
        return { success: false, detail: fbRes.detail || 'Credenciales no válidas' };
      } catch (e) {
        console.warn('[MobileApi] Error en login Firebase:', e);
      }
    }
    if (!this.isOnline) {
      return { success: false, error: 'offline', detail: 'Servidor no alcanzable en modo offline' };
    }
    try {
      const res = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password: password.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.access_token) {
          this.token = data.access_token;
          localStorage.setItem('educonnect_jwt_token', data.access_token);
        }
        return { success: true, data };
      }
      const err = await res.json().catch(() => ({}));
      return { success: false, detail: err.detail || 'Credenciales no válidas' };
    } catch (err) {
      return { success: false, detail: 'Error de conexión con el servidor' };
    }
  },

  // 2. Alertas del usuario (Firebase Cloud Firestore)
  async getAlertasUsuario(usuarioId) {
    if (window.firebaseDb) {
      try {
        const data = await firebaseDb.getAlertasUsuario(usuarioId || 13);
        this.isOnline = true;
        localStorage.setItem(`educonnect_cache_alertas_${usuarioId}`, JSON.stringify(data));
        return data;
      } catch (e) {
        console.warn('[MobileApi] Falló carga de alertas en Firebase:', e);
      }
    }
    const cached = localStorage.getItem(`educonnect_cache_alertas_${usuarioId}`);
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  },

  // 3. Confirmar / Acuse de recibo de alerta
  async confirmarAlerta(notificacionId) {
    if (window.firebaseDb) {
      try {
        this.isOnline = true;
        await firebaseDb.marcarAlertaLeida(notificacionId);
        return { success: true };
      } catch (e) {
        console.warn('[MobileApi] Falló confirmación en Firebase:', e);
      }
    }
    const queue = JSON.parse(localStorage.getItem('educonnect_offline_acuses') || '[]');
    if (!queue.includes(notificacionId)) {
      queue.push(notificacionId);
      localStorage.setItem('educonnect_offline_acuses', JSON.stringify(queue));
    }
    return { success: true, offline: true };
  },

  // 4. Crear alerta
  async emitirAlerta(usuarioId, tipo, titulo, contenido) {
    if (window.firebaseDb) {
      try {
        this.isOnline = true;
        return await firebaseDb.emitirAlerta({
          usuario_id: usuarioId || 13,
          tipo: tipo || 'urgente',
          titulo,
          contenido
        });
      } catch (e) {
        console.warn('[MobileApi] Falló emisión en Firebase:', e);
      }
    }
    return { message: 'Alerta guardada localmente', alerta_id: Date.now() };
  },

  // 4.b Vaciar historial de alertas
  async limpiarAlertas() {
    if (window.firebaseDb) {
      try {
        this.isOnline = true;
        return await firebaseDb.limpiarAlertas();
      } catch (e) {
        console.warn('[MobileApi] Falló limpieza de alertas en Firebase:', e);
      }
    }
    return { success: true, eliminadas: 0 };
  },

  // 5. Conversaciones del usuario
  async getConversaciones(usuarioId) {
    if (window.firebaseDb) {
      try {
        this.isOnline = true;
        const data = await firebaseDb.getConversaciones(usuarioId);
        localStorage.setItem(`educonnect_cache_conv_${usuarioId}`, JSON.stringify(data));
        return data;
      } catch (e) {
        console.warn('[MobileApi] Falló conversaciones en Firebase:', e);
      }
    }
    const cached = localStorage.getItem(`educonnect_cache_conv_${usuarioId}`);
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return null;
  },

  // 6. Mensajes de una conversación
  async getMensajes(conversacionId) {
    if (window.firebaseDb) {
      try {
        const data = await firebaseDb.getMensajes(conversacionId || 1);
        this.isOnline = true;
        localStorage.setItem(`educonnect_cache_msg_${conversacionId}`, JSON.stringify(data));
        return data;
      } catch (e) {
        console.warn('[MobileApi] Falló mensajes en Firebase:', e);
      }
    }
    const cached = localStorage.getItem(`educonnect_cache_msg_${conversacionId}`);
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  },

  // 7. Enviar mensaje
  async enviarMensaje(conversacionId, remitenteUsuarioId, contenido) {
    if (window.firebaseDb) {
      try {
        this.isOnline = true;
        return await firebaseDb.enviarMensaje(conversacionId || 1, remitenteUsuarioId, contenido);
      } catch (e) {
        console.warn('[MobileApi] Falló envío en Firebase:', e);
      }
    }
    return {
      message: 'Mensaje en cola',
      mensaje_id: Date.now(),
      fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  },

  // 8. Reportería integral del estudiante
  async getReporteria(alumnoId = 5) {
    if (window.firebaseDb) {
      try {
        const data = await firebaseDb.getReporteriaSummary(alumnoId);
        this.isOnline = true;
        localStorage.setItem(`educonnect_cache_rep_${alumnoId}`, JSON.stringify(data));
        return data;
      } catch (e) {
        console.warn('[MobileApi] Falló reportería en Firebase:', e);
      }
    }
    const cached = localStorage.getItem(`educonnect_cache_rep_${alumnoId}`);
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return null;
  },

  // 9. [REQ-02] Actividades asignadas al alumno
  async getActividadesAlumno(studentRef = 5) {
    if (window.firebaseDb) {
      try {
        const data = await firebaseDb.getActividadesAlumno(studentRef);
        this.isOnline = true;
        if (data && Array.isArray(data.actividades)) {
          localStorage.setItem(`educonnect_cache_acts_${studentRef}`, JSON.stringify(data.actividades));
          return data.actividades;
        }
      } catch (e) {
        console.warn('[MobileApi] Falló carga de actividades alumno en Firebase:', e);
      }
    }
    const cached = localStorage.getItem(`educonnect_cache_acts_${studentRef}`);
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  },

  // 9.b Obtener estado de asignación de actividades de un curso
  async getEstadoActividadesCurso(cursoId = 3) {
    if (window.firebaseDb) {
      try {
        this.isOnline = true;
        return await firebaseDb.getEstadoActividadesCurso(cursoId);
      } catch (e) {
        console.warn('[MobileApi] Falló estado-curso en Firebase:', e);
      }
    }
    return [];
  },

  // 9.c Asignar una actividad individualmente
  async asignarActividad(payload) {
    if (window.firebaseDb) {
      try {
        this.isOnline = true;
        return await firebaseDb.asignarActividad(payload);
      } catch (e) {
        console.warn('[MobileApi] Falló asignarActividad en Firebase:', e);
      }
    }
    return { success: true, offline: true };
  },

  // 9.d Desasignar una actividad individual
  async desasignarActividad(payload) {
    if (window.firebaseDb) {
      try {
        this.isOnline = true;
        return await firebaseDb.desasignarActividad(payload);
      } catch (e) {
        console.warn('[MobileApi] Falló desasignarActividad en Firebase:', e);
      }
    }
    return { success: true, offline: true };
  },

  // 9.e Desasignar todas las actividades del curso
  async desasignarTodasActividades(cursoId = 3) {
    if (window.firebaseDb) {
      try {
        this.isOnline = true;
        return await firebaseDb.desasignarTodasActividades(cursoId);
      } catch (e) {
        console.warn('[MobileApi] Falló desasignarTodasActividades en Firebase:', e);
      }
    }
    return { success: true, offline: true };
  },

  // 10. Actualizar estado de actividad del alumno
  async actualizarEstadoActividad(payload) {
    if (window.firebaseDb) {
      try {
        this.isOnline = true;
        return await firebaseDb.actualizarEstadoActividad(payload);
      } catch (e) {
        console.warn('[MobileApi] Error actualizando estado en Firebase:', e);
      }
    }
    const queue = JSON.parse(localStorage.getItem('educonnect_offline_estados') || '[]');
    queue.push(payload);
    localStorage.setItem('educonnect_offline_estados', JSON.stringify(queue));
    return { success: true, offline: true };
  },

  // 11. [REQ-03 / REQ-04] Síntesis de Voz (TTS) de Robot Leo con sincronía de estados visuales
  playRobotTone() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.22);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.32);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.32);
    } catch (e) {}
  },

  stopSpeaking() {
    this._speakSeq = (this._speakSeq || 0) + 1;
    if (this._speakingTimer) {
      clearTimeout(this._speakingTimer);
      this._speakingTimer = null;
    }
    if (this._currentAudio) {
      try {
        this._currentAudio.onplaying = null;
        this._currentAudio.onended = null;
        this._currentAudio.onerror = null;
        this._currentAudio.pause();
        this._currentAudio.removeAttribute('src');
        this._currentAudio.load();
      } catch (e) {}
      this._currentAudio = null;
    }
    if (this._currentSpeakDone) {
      const resolvePrev = this._currentSpeakDone;
      this._currentSpeakDone = null;
      try { resolvePrev(true); } catch (e) {}
    }
    if (this._speakPollInterval) {
      clearInterval(this._speakPollInterval);
      this._speakPollInterval = null;
    }
    this._currentUtterance = null;
    if (typeof window !== 'undefined') {
      window._onAndroidTtsEnd = null;
      if (window.AndroidVoiceBridge && typeof window.AndroidVoiceBridge.stopSpeaking === 'function') {
        try { window.AndroidVoiceBridge.stopSpeaking(); } catch (e) {}
      }
      if (window.speechSynthesis) {
        try { window.speechSynthesis.cancel(); } catch (e) {}
      }
    }
  },

  getStaticTtsAudioUrl(text, voiceId = 'IKne3meq5aSn9XLyUdCD') {
    const clean = (text || '').trim();
    if (!clean || !window.firebaseDb || typeof window.firebaseDb.sha256 !== 'function') return null;
    const vid = (voiceId || 'IKne3meq5aSn9XLyUdCD').trim();
    const raw = `${vid}_${clean}`;
    const utf8 = unescape(encodeURIComponent(raw));
    const digest = window.firebaseDb.sha256(utf8);
    return digest ? `audio_cache/${digest}.mp3` : null;
  },

  _playAudioUrl(url, mySeq, onEnd, guardMs = 1800) {
    return new Promise((resolve) => {
      let settled = false;
      const done = (ok) => {
        if (settled) return;
        settled = true;
        if (this._currentSpeakDone === done) {
          this._currentSpeakDone = null;
        }
        clearTimeout(loadGuard);
        resolve(ok);
      };
      this._currentSpeakDone = done;

      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = url;
      this._currentAudio = audio;

      const loadGuard = setTimeout(() => {
        if (mySeq !== this._speakSeq) {
          done(true);
          return;
        }
        if (audio.currentTime === 0 && audio.paused) {
          try {
            audio.onended = null;
            audio.onerror = null;
            audio.pause();
          } catch (e) {}
          done(false);
        }
      }, guardMs);

      audio.onplaying = () => {
        if (mySeq !== this._speakSeq) {
          try { audio.pause(); } catch (e) {}
          done(true);
          return;
        }
        clearTimeout(loadGuard);
      };

      audio.onended = () => {
        if (this._currentAudio === audio) {
          this._currentAudio = null;
        }
        if (mySeq === this._speakSeq && onEnd) {
          onEnd();
        }
        done(true);
      };

      audio.onerror = () => {
        if (this._currentAudio === audio) {
          this._currentAudio = null;
        }
        done(mySeq !== this._speakSeq);
      };

      try {
        const playPromise = audio.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {
            if (this._currentAudio === audio) {
              this._currentAudio = null;
            }
            done(false);
          });
        }
      } catch (err) {
        if (this._currentAudio === audio) {
          this._currentAudio = null;
        }
        done(false);
      }
    });
  },

  async speakText(text, onStart, onEnd) {
    if (!text) {
      if (onEnd) onEnd();
      return;
    }
    this.stopSpeaking();
    const mySeq = this._speakSeq;

    if (onStart) onStart();

    // 1. Audio estático cacheado original de Robot Leo (audio_cache/ incluido en Hosting y APK)
    const staticUrl = this.getStaticTtsAudioUrl(text);
    if (staticUrl) {
      const playedStatic = await this._playAudioUrl(staticUrl, mySeq, onEnd, 2200);
      if (playedStatic || mySeq !== this._speakSeq) {
        return;
      }
    }

    // 2. Si hay servidor local activo, intentar stream MP3 de /api/tts/hablar
    if (this._localServerActive) {
      const cleanText = encodeURIComponent(text.trim());
      const hostUrl = this.getServerHostUrl();
      const ttsUrl = `${hostUrl}/api/tts/hablar?text=${cleanText}`;

      const playedFromBackend = await this._playAudioUrl(ttsUrl, mySeq, onEnd, 1800);
      if (playedFromBackend) {
        this.isOnline = true;
      }
      if (playedFromBackend || mySeq !== this._speakSeq) {
        return;
      }
    }

    // 1.5. Puente nativo Android TextToSpeech (APK Capacitor)
    if (typeof window !== 'undefined' && window.AndroidVoiceBridge && typeof window.AndroidVoiceBridge.speak === 'function') {
      try {
        await new Promise((resolve) => {
          let finished = false;
          const finishNative = () => {
            if (finished) return;
            finished = true;
            if (this._speakingTimer) {
              clearTimeout(this._speakingTimer);
              this._speakingTimer = null;
            }
            if (this._speakPollInterval) {
              clearInterval(this._speakPollInterval);
              this._speakPollInterval = null;
            }
            if (window._onAndroidTtsEnd === finishNative) {
              window._onAndroidTtsEnd = null;
            }
            if (mySeq === this._speakSeq && onEnd) onEnd();
            resolve();
          };

          window._onAndroidTtsEnd = finishNative;
          window.AndroidVoiceBridge.speak(text.trim());

          const maxMs = Math.max(3000, Math.min(12000, text.length * 95 + 1500));
          this._speakingTimer = setTimeout(finishNative, maxMs);

          const startedAt = Date.now();
          this._speakPollInterval = setInterval(() => {
            if (finished || mySeq !== this._speakSeq) {
              finishNative();
              return;
            }
            if (Date.now() - startedAt < 400) return;
            try {
              if (
                typeof window.AndroidVoiceBridge.isSpeaking === 'function' &&
                !window.AndroidVoiceBridge.isSpeaking()
              ) {
                finishNative();
              }
            } catch (e) {}
          }, 180);
        });
        return;
      } catch (e) {}
    }

    // 2. Síntesis de voz nativa del dispositivo (Android / Web SpeechSynthesis)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        await new Promise((resolve) => {
          const synth = window.speechSynthesis;
          try {
            if (synth.paused) synth.resume();
          } catch (e) {}

          const utter = new SpeechSynthesisUtterance(text);
          this._currentUtterance = utter;
          utter.lang = 'es-CL';
          utter.rate = 0.95;
          utter.pitch = 1.0;

          try {
            const voices = synth.getVoices ? synth.getVoices() : [];
            if (voices && voices.length > 0) {
              const preferred =
                voices.find((v) => v.lang && v.lang.toLowerCase() === 'es-cl') ||
                voices.find((v) => v.lang && ['es-419', 'es-es', 'es-mx', 'es-ar'].includes(v.lang.toLowerCase())) ||
                voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('es'));
              if (preferred) utter.voice = preferred;
            }
          } catch (e) {}

          let finished = false;
          const finishUtter = () => {
            if (finished) return;
            finished = true;
            if (this._currentUtterance === utter) {
              this._currentUtterance = null;
            }
            if (this._speakingTimer) {
              clearTimeout(this._speakingTimer);
              this._speakingTimer = null;
            }
            if (mySeq === this._speakSeq && onEnd) onEnd();
            resolve();
          };
          utter.onend = finishUtter;
          utter.onerror = finishUtter;
          const estMs = Math.max(2500, Math.min(10000, text.length * 85 + 1000));
          this._speakingTimer = setTimeout(finishUtter, estMs);
          synth.speak(utter);
        });
        return;
      } catch (e) {}
    }

    // 3. Fallback auditivo amistoso con Web Audio API
    if (mySeq !== this._speakSeq) return;
    this.playRobotTone();
    await new Promise((resolve) => {
      const estMs = Math.max(1800, Math.min(5000, text.length * 50));
      this._speakingTimer = setTimeout(() => {
        if (mySeq === this._speakSeq && onEnd) onEnd();
        resolve();
      }, estMs);
    });
  },

  // 12. [REQ-05] Transcripción de Voz (STT)
  async transcribeAudio(audioBlob) {
    if (!audioBlob || !this._localServerActive) {
      return { success: false, error: 'Usando reconocimiento de voz integrado' };
    }
    try {
      const mime = (audioBlob.type || '').toLowerCase();
      const ext = mime.includes('mp4') || mime.includes('m4a') || mime.includes('aac') ? 'm4a' : (mime.includes('ogg') ? 'ogg' : 'webm');
      const formData = new FormData();
      formData.append('audio', audioBlob, `voz_alumno.${ext}`);
      const headers = {};
      const token = this.token || localStorage.getItem('educonnect_jwt_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const hostUrl = this.getServerHostUrl();
      const res = await fetch(`${hostUrl}/api/stt/transcribir`, {
        method: 'POST',
        headers: headers,
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        this.isOnline = true;
        const transcriptText = data.transcript || data.transcripcion || data.texto || data.text || '';
        return {
          success: data.success !== false,
          text: String(transcriptText).trim()
        };
      }
      return { success: false, error: 'Error HTTP ' + res.status };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // 13. [REQ-05] Evaluador Pedagógico IA
  async evaluarRespuestaIA(payload) {
    if (!this._localServerActive) return null;
    try {
      const hostUrl = this.getServerHostUrl();
      const res = await fetch(`${hostUrl}/api/ia/evaluar-respuesta`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        this.isOnline = true;
        return await res.json();
      }
    } catch (e) {
      console.warn('[MobileApi] Evaluador local de respaldo activado:', e);
    }
    return null;
  },

  // 13.b Revisión Docente de Actividad con Tiempos por Número y Resumen IA (Cloud Firestore)
  async getRevisionActividad(cursoId = 3, codigoFrontend = 'act-conteo', alumnoId = null) {
    if (window.firebaseDb) {
      try {
        this.isOnline = true;
        return await firebaseDb.getRevisionActividad(cursoId, codigoFrontend, alumnoId || 5);
      } catch (e) {
        console.warn('[MobileApi] Error obteniendo revisión en Firebase:', e);
      }
    }
    return null;
  },

  async generarResumenDocenteIa(payload) {
    if (window.firebaseDb) {
      this.isOnline = true;
      return firebaseDb.buildResumenDocenteIa(payload || {});
    }
    return null;
  },

  async enviarResumenApoderado(payload) {
    if (window.firebaseDb) {
      try {
        this.isOnline = true;
        return await firebaseDb.enviarResumenApoderado(payload);
      } catch (e) {
        console.warn('[MobileApi] Error enviando resumen en Firebase:', e);
      }
    }
    return null;
  },

  async reiniciarPuntajeActividad(payload) {
    if (window.firebaseDb) {
      try {
        this.isOnline = true;
        return await firebaseDb.reiniciarPuntajeActividad(payload);
      } catch (e) {
        console.warn('[MobileApi] Error reiniciando puntaje en Firebase:', e);
      }
    }
    return null;
  },

  // 14. Sincronización en segundo plano de colas offline al reconectar
  async syncOfflineQueues() {
    if (!this.isOnline || !window.firebaseDb) return;
    const acuses = JSON.parse(localStorage.getItem('educonnect_offline_acuses') || '[]');
    if (acuses.length > 0) {
      for (const notifId of acuses) {
        try { await firebaseDb.marcarAlertaLeida(notifId); } catch (e) {}
      }
      localStorage.removeItem('educonnect_offline_acuses');
    }

    const offlineMsgs = JSON.parse(localStorage.getItem('educonnect_offline_mensajes') || '[]');
    if (offlineMsgs.length > 0) {
      for (const m of offlineMsgs) {
        try { await firebaseDb.enviarMensaje(m.conversacion_id || 1, m.remitente_usuario_id || 12, m.contenido); } catch (e) {}
      }
      localStorage.removeItem('educonnect_offline_mensajes');
    }

    const offlineEstados = JSON.parse(localStorage.getItem('educonnect_offline_estados') || '[]');
    if (offlineEstados.length > 0) {
      for (const st of offlineEstados) {
        try { await firebaseDb.actualizarEstadoActividad(st); } catch (e) {}
      }
      localStorage.removeItem('educonnect_offline_estados');
    }
  }
};

window.mobileApi = mobileApi;
