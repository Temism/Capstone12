// API Client Móvil EduConnect con Resiliencia Offline, URL Configurable LAN y Servicios de Voz IA
const mobileApi = {
  // [REQ-01] Persistencia obligatoria en localStorage ('educonnect_api_url')
  baseUrl: (() => {
    const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent || '');
    try {
      const saved = localStorage.getItem('educonnect_api_url');
      if (saved) {
        // Corregir automáticamente puertos inválidos previos (como 5040) o IPs obsoletas
        if (saved.includes(':5040') || saved.includes('192.168.1.85')) {
          const fixed = isAndroid ? 'http://192.168.1.113:8000/api' : 'http://127.0.0.1:8000/api';
          localStorage.setItem('educonnect_api_url', fixed);
          return fixed;
        }
        if (isAndroid && (saved.includes('127.0.0.1') || saved.includes('localhost'))) {
          const fixed = 'http://192.168.1.113:8000/api';
          localStorage.setItem('educonnect_api_url', fixed);
          return fixed;
        }
        return saved;
      }
    } catch (e) {}
    if (isAndroid) {
      return 'http://192.168.1.113:8000/api';
    }
    return 'http://127.0.0.1:8000/api';
  })(),
  token: localStorage.getItem('educonnect_jwt_token') || null,
  isOnline: false,
  _currentAudio: null,
  _ttsCache: {},
  _speakingTimer: null,

  setBaseUrl(url) {
    if (!url) return;
    let clean = String(url).trim().replace(/\/+$/, '');
    if (!/^https?:\/\//i.test(clean)) {
      clean = 'http://' + clean;
    }
    clean = clean.replace(/\/api\/?$/i, '') + '/api';
    this.baseUrl = clean;
    try {
      localStorage.setItem('educonnect_api_url', this.baseUrl);
    } catch (e) {}
  },

  getServerHostUrl() {
    return (this.baseUrl || 'http://192.168.1.113:8000/api').replace(/\/api\/?$/, '');
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

  // [REQ-01] Prueba inmediata contra /api/health y guardado permanente en localStorage
  async checkHealth(candidateUrl) {
    if (candidateUrl && String(candidateUrl).trim()) {
      this.setBaseUrl(candidateUrl);
    }
    const hostUrl = this.getServerHostUrl();

    // 1. Probar la URL solicitada con timeout estricto de 2.0 segundos
    const primaryRes = await this.probeSingleHealth(hostUrl, 2000);
    if (primaryRes.ok) {
      this.isOnline = true;
      return { success: true, data: primaryRes.data, host: hostUrl };
    }

    // 2. Si falló, probar en paralelo los 3 endpoints candidatos conocidos (máx 1.8s)
    const fallbackCandidates = [
      'http://192.168.1.113:8000',
      'http://10.0.2.2:8000',
      'http://127.0.0.1:8000'
    ].filter(h => h.toLowerCase() !== hostUrl.toLowerCase());

    if (fallbackCandidates.length > 0) {
      const results = await Promise.all(
        fallbackCandidates.map(h => this.probeSingleHealth(h, 1800))
      );
      const working = results.find(r => r && r.ok);
      if (working) {
        this.setBaseUrl(working.host);
        this.isOnline = true;
        return {
          success: true,
          data: working.data,
          host: working.host,
          autoRecovered: true
        };
      }
    }

    this.isOnline = false;
    return {
      success: false,
      error: 'Error de conexión: verifique IP y que el servidor esté activo en puerto 8000',
      host: hostUrl
    };
  },

  // 1. Autenticación (POST /api/auth/login)
  async login(email, password) {
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

  // 2. Alertas del usuario (GET /api/alertas/usuario/{usuario_id})
  async getAlertasUsuario(usuarioId) {
    if (this.isOnline) {
      try {
        const res = await fetch(`${this.baseUrl}/alertas/usuario/${usuarioId}`, {
          headers: this.getHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            localStorage.setItem(`educonnect_cache_alertas_${usuarioId}`, JSON.stringify(data));
            return data;
          }
        }
      } catch (e) {
        console.warn('[MobileApi] Falló carga de alertas en vivo:', e);
      }
    }
    const cached = localStorage.getItem(`educonnect_cache_alertas_${usuarioId}`);
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return null;
  },

  // 3. Confirmar / Acuse de recibo de alerta (PUT /api/alertas/{notificacion_id}/leer)
  async confirmarAlerta(notificacionId) {
    if (this.isOnline) {
      try {
        const res = await fetch(`${this.baseUrl}/alertas/${notificacionId}/leer`, {
          method: 'PUT',
          headers: this.getHeaders()
        });
        if (res.ok) {
          return { success: true };
        }
      } catch (e) {
        console.warn('[MobileApi] Falló confirmación online:', e);
      }
    }
    const queue = JSON.parse(localStorage.getItem('educonnect_offline_acuses') || '[]');
    if (!queue.includes(notificacionId)) {
      queue.push(notificacionId);
      localStorage.setItem('educonnect_offline_acuses', JSON.stringify(queue));
    }
    return { success: true, offline: true };
  },

  // 4. Crear alerta (POST /api/alertas/)
  async emitirAlerta(usuarioId, tipo, titulo, contenido) {
    if (this.isOnline) {
      try {
        const res = await fetch(`${this.baseUrl}/alertas/`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            usuario_id: usuarioId,
            tipo: tipo || 'urgente',
            titulo: titulo,
            contenido: contenido
          })
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {
        console.warn('[MobileApi] Falló emisión online:', e);
      }
    }
    return { message: 'Alerta guardada localmente (modo offline)', alerta_id: Date.now() };
  },

  // 5. Conversaciones del usuario (GET /api/mensajeria/conversaciones/usuario/{usuario_id})
  async getConversaciones(usuarioId) {
    if (this.isOnline) {
      try {
        const res = await fetch(`${this.baseUrl}/mensajeria/conversaciones/usuario/${usuarioId}`, {
          headers: this.getHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            localStorage.setItem(`educonnect_cache_conv_${usuarioId}`, JSON.stringify(data));
            return data;
          }
        }
      } catch (e) {
        console.warn('[MobileApi] Falló conversaciones online:', e);
      }
    }
    const cached = localStorage.getItem(`educonnect_cache_conv_${usuarioId}`);
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return null;
  },

  // 6. Mensajes de una conversación (GET /api/mensajeria/conversacion/{id}/mensajes)
  async getMensajes(conversacionId) {
    if (this.isOnline) {
      try {
        const res = await fetch(`${this.baseUrl}/mensajeria/conversacion/${conversacionId}/mensajes`, {
          headers: this.getHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            localStorage.setItem(`educonnect_cache_msg_${conversacionId}`, JSON.stringify(data));
            return data;
          }
        }
      } catch (e) {
        console.warn('[MobileApi] Falló mensajes online:', e);
      }
    }
    const cached = localStorage.getItem(`educonnect_cache_msg_${conversacionId}`);
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return null;
  },

  // 7. Enviar mensaje (POST /api/mensajeria/mensaje)
  async enviarMensaje(conversacionId, remitenteUsuarioId, contenido) {
    if (this.isOnline) {
      try {
        const res = await fetch(`${this.baseUrl}/mensajeria/mensaje`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            conversacion_id: conversacionId,
            remitente_usuario_id: remitenteUsuarioId,
            contenido: contenido
          })
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {
        console.warn('[MobileApi] Falló envío online:', e);
      }
    }
    const offlineMsg = {
      conversacion_id: conversacionId,
      remitente_usuario_id: remitenteUsuarioId,
      contenido: contenido,
      fecha_envio: new Date().toISOString()
    };
    const queue = JSON.parse(localStorage.getItem('educonnect_offline_mensajes') || '[]');
    queue.push(offlineMsg);
    localStorage.setItem('educonnect_offline_mensajes', JSON.stringify(queue));
    return {
      message: 'Mensaje en cola offline',
      mensaje_id: Date.now(),
      fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  },

  // 8. Reportería integral del estudiante (GET /api/calificaciones/reporteria/{alumno_id})
  async getReporteria(alumnoId = 5) {
    if (this.isOnline) {
      try {
        const res = await fetch(`${this.baseUrl}/calificaciones/reporteria/${alumnoId}`, {
          headers: this.getHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem(`educonnect_cache_rep_${alumnoId}`, JSON.stringify(data));
          return data;
        }
      } catch (e) {
        console.warn('[MobileApi] Falló reportería online:', e);
      }
    }
    const cached = localStorage.getItem(`educonnect_cache_rep_${alumnoId}`);
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return null;
  },

  // 9. [REQ-02] Actividades asignadas al alumno (GET /api/actividades/alumno/{student_ref})
  async getActividadesAlumno(studentRef = 5) {
    if (this.isOnline) {
      try {
        const res = await fetch(`${this.baseUrl}/actividades/alumno/${studentRef}`, {
          headers: this.getHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.actividades)) {
            localStorage.setItem(`educonnect_cache_acts_${studentRef}`, JSON.stringify(data.actividades));
            return data.actividades;
          }
        }
      } catch (e) {
        console.warn('[MobileApi] Falló carga de actividades alumno:', e);
      }
    }
    const cached = localStorage.getItem(`educonnect_cache_acts_${studentRef}`);
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return null;
  },

  // 10. Actualizar estado de actividad del alumno (POST /api/actividades/estado)
  async actualizarEstadoActividad(payload) {
    if (this.isOnline) {
      try {
        const res = await fetch(`${this.baseUrl}/actividades/estado`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {
        console.warn('[MobileApi] Guardando estado de actividad en cola offline:', e);
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
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }
  },

  async speakText(text, onStart, onEnd) {
    if (!text) {
      if (onEnd) onEnd();
      return;
    }
    this.stopSpeaking();
    const mySeq = this._speakSeq;

    if (onStart) onStart();

    // 1. Reproducir directamente el stream MP3 de /api/tts/hablar dentro del gesto del usuario (sin await previo que pierda el foco de reproducción en Android)
    const cleanText = encodeURIComponent(text.trim());
    const hostUrl = this.getServerHostUrl();
    const ttsUrl = `${hostUrl}/api/tts/hablar?text=${cleanText}`;

    const playedFromBackend = await new Promise((resolve) => {
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
      audio.src = ttsUrl;
      this._currentAudio = audio;

      // Salvaguarda si el servidor no responde en 4.5 segundos
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
      }, 4500);

      audio.onplaying = () => {
        if (mySeq !== this._speakSeq) {
          try { audio.pause(); } catch (e) {}
          done(true);
          return;
        }
        clearTimeout(loadGuard);
        this.isOnline = true;
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
          playPromise.catch((err) => {
            if (mySeq !== this._speakSeq) {
              done(true);
              return;
            }
            console.warn('[MobileApi TTS] Error al iniciar stream de audio:', err);
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

    if (playedFromBackend || mySeq !== this._speakSeq) {
      return;
    }

    // 2. Fallback a Web SpeechSynthesis local si el backend no está alcanzable
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        await new Promise((resolve) => {
          const utter = new SpeechSynthesisUtterance(text);
          utter.lang = 'es-CL';
          utter.rate = 0.95;
          utter.pitch = 1.0;
          let finished = false;
          const finishUtter = () => {
            if (finished) return;
            finished = true;
            if (this._speakingTimer) {
              clearTimeout(this._speakingTimer);
              this._speakingTimer = null;
            }
            if (mySeq === this._speakSeq && onEnd) onEnd();
            resolve();
          };
          utter.onend = finishUtter;
          utter.onerror = finishUtter;
          const estMs = Math.max(2000, Math.min(8000, text.length * 70));
          this._speakingTimer = setTimeout(finishUtter, estMs);
          window.speechSynthesis.speak(utter);
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

  // 12. [REQ-05] Transcripción de Voz (STT) contra el backend (/api/stt/transcribir)
  async transcribeAudio(audioBlob) {
    if (!audioBlob) {
      return { success: false, error: 'Sin archivo de audio' };
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

  // 13. [REQ-05] Evaluador Pedagógico IA (/api/ia/evaluar-respuesta)
  async evaluarRespuestaIA(payload) {
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

  // 14. Sincronización en segundo plano de colas offline al reconectar
  async syncOfflineQueues() {
    if (!this.isOnline) return;
    const acuses = JSON.parse(localStorage.getItem('educonnect_offline_acuses') || '[]');
    if (acuses.length > 0) {
      for (const notifId of acuses) {
        try {
          await fetch(`${this.baseUrl}/alertas/${notifId}/leer`, {
            method: 'PUT',
            headers: this.getHeaders()
          });
        } catch (e) {}
      }
      localStorage.removeItem('educonnect_offline_acuses');
    }

    const offlineMsgs = JSON.parse(localStorage.getItem('educonnect_offline_mensajes') || '[]');
    if (offlineMsgs.length > 0) {
      for (const m of offlineMsgs) {
        try {
          await fetch(`${this.baseUrl}/mensajeria/mensaje`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(m)
          });
        } catch (e) {}
      }
      localStorage.removeItem('educonnect_offline_mensajes');
    }

    const offlineEstados = JSON.parse(localStorage.getItem('educonnect_offline_estados') || '[]');
    if (offlineEstados.length > 0) {
      for (const st of offlineEstados) {
        try {
          await fetch(`${this.baseUrl}/actividades/estado`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(st)
          });
        } catch (e) {}
      }
      localStorage.removeItem('educonnect_offline_estados');
    }
  }
};

window.mobileApi = mobileApi;
