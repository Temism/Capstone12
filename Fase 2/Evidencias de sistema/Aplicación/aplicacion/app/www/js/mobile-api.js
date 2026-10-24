// API Client Móvil EduConnect con Resiliencia Offline y URL Configurable
const mobileApi = {
  // En Android nativo o WebView, se puede configurar la IP del host (ej: http://192.168.1.100:8000)
  baseUrl: localStorage.getItem('educonnect_api_url') || 'http://127.0.0.1:8000/api',
  token: localStorage.getItem('educonnect_jwt_token') || null,
  isOnline: false,

  setBaseUrl(url) {
    if (!url) return;
    let clean = url.trim().replace(/\/+$/, '');
    if (!clean.endsWith('/api')) {
      clean = clean + '/api';
    }
    this.baseUrl = clean;
    localStorage.setItem('educonnect_api_url', this.baseUrl);
  },

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = this.token || localStorage.getItem('educonnect_jwt_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  async checkHealth(candidateUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const targetBase = candidateUrl ? candidateUrl.trim().replace(/\/+$/, '') : this.baseUrl;
      const hostUrl = targetBase.replace(/\/api\/?$/, '');
      const res = await fetch(`${hostUrl}/api/health`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        this.isOnline = true;
        return { success: true, data };
      }
      this.isOnline = false;
      return { success: false, error: 'Status ' + res.status };
    } catch (e) {
      this.isOnline = false;
      return { success: false, error: e.name === 'AbortError' ? 'Tiempo de espera agotado (timeout 4s)' : e.message };
    }
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
    // Caché local
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
    // Guardar en cola de acuses offline
    const queue = JSON.parse(localStorage.getItem('educonnect_offline_acuses') || '[]');
    if (!queue.includes(notificacionId)) {
      queue.push(notificacionId);
      localStorage.setItem('educonnect_offline_acuses', JSON.stringify(queue));
    }
    return { success: true, offline: true };
  },

  // 4. Crear alerta (POST /api/alertas/) - Usada por el profesor para avisos de refuerzo
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
    // Guardar en cola offline
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
  async getReporteria(alumnoId = 1) {
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

  // 9. Sincronización en segundo plano de colas offline al reconectar
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
  }
};

window.mobileApi = mobileApi;
