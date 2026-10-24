// Controlador Móvil EduConnect (Profesor y Apoderado)
// Cumple con el alcance delimitado del PMO: Alertas con Acuse de Recibo, Mensajería (Grupal e Individual),
// selección de rol, sin tutor ni actividades de alumno, y resiliencia offline.

const app = {
  currentUser: null,
  currentTab: 'mensajeria', // 'mensajeria' | 'alertas' | 'dashboard' | 'config'
  currentRoleKey: 'apoderado', // 'apoderado' | 'profesora'
  selectedPupilIndex: 0, // 0: Mateo (1° Básico), 1: Sofía (2° Básico)
  errorMessage: '',
  showServerModal: false,
  reporteriaData: null,
  isLoadingReporteria: false,

  // Estado de Mensajería
  chatMode: 'grupal', // 'grupal' | 'individual'
  activeConversacionId: 1, // 1: Mateo (1° B), 2: Sofía (2° A), 100: Canal Grupal Curso
  mensajesPorConversacion: {},
  _pollTimer: null,

  // Estado de Alertas
  filterAlertas: 'todas', // 'todas' | 'urgente' | 'informativa'
  alertasLocales: [],
  acuseStatus: {}, // id -> boolean

  // Lista simulada de apoderados del curso (para el Tablero del Profesor)
  apoderadosCurso: [
    { id: 13, apoderado: 'Carolina Tapia', alumno: 'Mateo González', rut: '19.452.120-K', confirmado: true, fechaAcuse: 'Hoy 11:42' },
    { id: 4, apoderado: 'Daniela Soto', alumno: 'Benjamín Soto', rut: '18.992.301-4', confirmado: true, fechaAcuse: 'Hoy 12:05' },
    { id: 5, apoderado: 'Rodrigo Fuentes', alumno: 'Martina Fuentes', rut: '20.104.887-2', confirmado: false, fechaAcuse: 'Pendiente' },
    { id: 6, apoderado: 'Javiera Contreras', alumno: 'Vicente Contreras', rut: '19.821.554-9', confirmado: false, fechaAcuse: 'Pendiente' },
    { id: 7, apoderado: 'Gonzalo Morales', alumno: 'Ignacio Morales', rut: '19.330.114-1', confirmado: true, fechaAcuse: 'Ayer 18:20' }
  ],

  // Comunicados oficiales del Canal Grupal (unidireccionales: Profesor -> Curso)
  comunicadosGrupales: [
    {
      id: 101,
      remitenteNombre: 'Tía Marcela Soto (Profesora Jefe)',
      curso: '1° Básico B',
      fecha: 'Hoy 08:30',
      titulo: 'Plan Semanal de Lectura y Conteo Rítmico',
      contenido: 'Estimadas familias: Durante esta semana reforzaremos el conteo del 1 al 20 y las sílabas iniciales con las dinámicas de ritmo. Por favor repasar en casa 10 minutos al día en un rincón sin ruido ambiente.',
      confirmado: true
    },
    {
      id: 102,
      remitenteNombre: 'Tía Marcela Soto (Profesora Jefe)',
      curso: '1° Básico B',
      fecha: 'Ayer 15:45',
      titulo: 'Materiales para Taller de Geometría y Cuerpos',
      contenido: 'Recordamos traer para este jueves una caja de fósforos vacía y plasticina de cualquier color para construir figuras del plano 2D y 3D en la clase de matemática.',
      confirmado: false
    }
  ],

  async init() {
    this.restoreSession();

    // Verificar conectividad inicial
    if (window.mobileApi) {
      await mobileApi.checkHealth();
      mobileApi.syncOfflineQueues();
    }
    this.initDefaultAlertas();
    if (this.currentUser) {
      await this.cargarDatosUsuario();
    }
    this.startPolling();
    this.render();
  },

  restoreSession() {
    try {
      const saved = localStorage.getItem('educonnect_session_user');
      if (saved) {
        const u = JSON.parse(saved);
        if (u && u.role) {
          this.currentUser = u;
          this.currentRoleKey = u.role;
        }
      }
    } catch (e) {}
  },

  startPolling() {
    if (this._pollTimer) return;
    this._pollTimer = setInterval(async () => {
      if (document.hidden || !this.currentUser) return;
      if (window.mobileApi && mobileApi.isOnline) {
        if (this.currentTab === 'mensajeria' && this.chatMode === 'individual') {
          await this.cargarMensajesConversacion(this.activeConversacionId, true);
        } else if (this.currentTab === 'alertas' && this.currentUser.role === 'apoderado') {
          const alertasApi = await mobileApi.getAlertasUsuario(this.currentUser.id);
          if (Array.isArray(alertasApi) && alertasApi.length > 0) {
            this.alertasLocales = alertasApi.map(a => ({
              ...a,
              alumno: a.alumno || (this.selectedPupilIndex === 0 ? 'Mateo González (1° Básico B)' : 'Sofía González (2° Básico A)')
            }));
            this.render();
          }
        }
      }
    }, 3500);
  },

  initDefaultAlertas() {
    this.alertasLocales = [
      {
        id: 4,
        usuario_id: 13,
        tipo: 'urgente',
        titulo: 'Rezago detectado en Objetivo MA01 OA 09 (Adiciones hasta el 10)',
        contenido: 'Mateo presenta dificultad en la descomposición aditiva pictórica. Se recomienda reforzar con la dinámica de adiciones y conteo concreto.',
        fecha_creacion: 'Hoy 09:15',
        estado: 'PENDIENTE',
        alumno: 'Mateo González (1° Básico B)'
      },
      {
        id: 2,
        usuario_id: 13,
        tipo: 'urgente',
        titulo: 'Aviso de Tarea Próxima a Vencer: Conteo al Ritmo',
        contenido: 'La actividad rítmica de matemática tiene plazo límite hoy hasta las 18:00 hrs. Faltan completar los niveles 3 y 4.',
        fecha_creacion: 'Hoy 08:00',
        estado: 'PENDIENTE',
        alumno: 'Mateo González (1° Básico B)'
      },
      {
        id: 3,
        usuario_id: 13,
        tipo: 'informativa',
        titulo: 'Registro de Inasistencia Justificada',
        contenido: 'Se ha registrado la justificación médica del día martes 20 de octubre en el libro digital de clases.',
        fecha_creacion: 'Ayer 16:20',
        estado: 'LEIDA',
        alumno: 'Mateo González (1° Básico B)'
      },
      {
        id: 1,
        usuario_id: 13,
        tipo: 'informativa',
        titulo: 'Citación Oficial: Reunión de Apoderados 1° y 2° Básico',
        contenido: 'Se cita a los apoderados a la reunión mensual el próximo jueves 29 a las 18:30 hrs en el aula magna del establecimiento.',
        fecha_creacion: '20 Oct 14:00',
        estado: 'LEIDA',
        alumno: 'General Colegio San Andrés'
      }
    ];
  },

  // -------------------------------------------------------------
  // Autenticación y Selector de Rol
  // -------------------------------------------------------------
  loginDemo(roleKey) {
    if (roleKey !== 'apoderado' && roleKey !== 'profesora') {
      this.errorMessage = 'Esta app móvil está habilitada únicamente para Profesores y Apoderados.';
      this.render();
      return;
    }

    if (roleKey === 'profesora') {
      this.currentUser = {
        id: 12,
        name: 'Marcela Soto Valenzuela',
        email: 'profesora@sanandres.cl',
        role: 'profesora',
        curso: '1° Básico B',
        rolLabel: 'Profesora Jefe 1° Básico B'
      };
      this.activeConversacionId = 1;
    } else {
      this.currentUser = {
        id: 13,
        name: 'Carolina Tapia Morales',
        email: 'apoderado@sanandres.cl',
        role: 'apoderado',
        pupils: ['Mateo González (1° Básico B)', 'Sofía González (2° Básico A)'],
        rolLabel: 'Apoderada Titular'
      };
      this.activeConversacionId = 1;
    }

    this.currentRoleKey = roleKey;
    this.currentTab = 'mensajeria';
    this.errorMessage = '';
    localStorage.setItem('educonnect_session_user', JSON.stringify(this.currentUser));
    this.cargarDatosUsuario();
    this.render();
  },

  async handleLoginForm(e) {
    if (e && e.preventDefault) e.preventDefault();
    const emailEl = document.getElementById('mob-email');
    const passEl = document.getElementById('mob-password');
    if (!emailEl || !passEl) return;

    const email = emailEl.value.trim().toLowerCase();
    const pass = passEl.value.trim();

    if (!email || !pass) {
      this.errorMessage = 'Ingresa tu correo y contraseña institucional.';
      this.render();
      return;
    }

    // Intento con backend en vivo si está online
    if (window.mobileApi && mobileApi.isOnline) {
      const authRes = await mobileApi.login(email, pass);
      if (authRes.success) {
        const u = authRes.data;
        const rol = (u.rol_principal || '').toUpperCase();
        if (rol.includes('ALUM') || rol.includes('ADMIN')) {
          this.errorMessage = 'Esta app móvil está reservada para Profesores y Apoderados. Para perfil Alumno o Administrador, ingresa en la versión Web.';
          this.render();
          return;
        }
        const mappedRole = rol.includes('PROF') ? 'profesora' : 'apoderado';
        this.currentUser = {
          id: u.id,
          name: u.nombre,
          email: u.email,
          role: mappedRole,
          curso: mappedRole === 'profesora' ? '1° Básico B' : null,
          pupils: mappedRole === 'apoderado' ? ['Mateo González (1° Básico B)', 'Sofía González (2° Básico A)'] : null,
          rolLabel: mappedRole === 'profesora' ? 'Profesora Jefe 1° Básico B' : 'Apoderada Titular'
        };
        this.currentRoleKey = mappedRole;
        this.currentTab = 'mensajeria';
        this.errorMessage = '';
        localStorage.setItem('educonnect_session_user', JSON.stringify(this.currentUser));
        this.cargarDatosUsuario();
        this.render();
        return;
      }
    }

    // Fallback de autenticación offline / credenciales estándar del colegio
    if (email === 'profesora@sanandres.cl' && pass === 'profe123') {
      this.loginDemo('profesora');
    } else if (email === 'apoderado@sanandres.cl' && pass === 'apoderado123') {
      this.loginDemo('apoderado');
    } else if (email.includes('admin') || email.includes('alumno')) {
      this.errorMessage = 'Esta app móvil está reservada exclusivamente para Profesores y Apoderados.';
      this.render();
    } else {
      this.errorMessage = 'Credenciales incorrectas. Usa profesora@sanandres.cl o apoderado@sanandres.cl';
      this.render();
    }
  },

  logout() {
    this.currentUser = null;
    this.currentTab = 'mensajeria';
    this.errorMessage = '';
    localStorage.removeItem('educonnect_session_user');
    this.render();
  },

  async cargarDatosUsuario() {
    if (!this.currentUser) return;

    // Cargar alertas desde API si está online
    if (window.mobileApi && mobileApi.isOnline) {
      const alertasApi = await mobileApi.getAlertasUsuario(this.currentUser.id);
      if (Array.isArray(alertasApi) && alertasApi.length > 0) {
        this.alertasLocales = alertasApi.map(a => ({
          ...a,
          alumno: a.alumno || (this.selectedPupilIndex === 0 ? 'Mateo González (1° Básico B)' : 'Sofía González (2° Básico A)')
        }));
      }

      // Cargar mensajes de la conversación activa
      await this.cargarMensajesConversacion(this.activeConversacionId);

      // Cargar reportería del alumno para el dashboard
      await this.cargarReporteriaAlumno();
    }
    this.render();
  },

  async cargarReporteriaAlumno() {
    if (!this.currentUser || this.currentUser.role !== 'apoderado') return;
    this.isLoadingReporteria = true;
    const pupilId = this.selectedPupilIndex === 0 ? 1 : 2;
    if (window.mobileApi && mobileApi.isOnline) {
      const rep = await mobileApi.getReporteria(pupilId);
      if (rep) {
        this.reporteriaData = rep;
      }
    }
    this.isLoadingReporteria = false;
  },

  async cargarMensajesConversacion(convId, isBackground = false) {
    if (window.mobileApi && mobileApi.isOnline) {
      const msgs = await mobileApi.getMensajes(convId);
      if (Array.isArray(msgs)) {
        const oldLen = (this.mensajesPorConversacion[convId] || []).length;
        this.mensajesPorConversacion[convId] = msgs.map(m => ({
          id: m.id,
          remitenteId: m.remitente_usuario_id,
          remitenteNombre: m.remitente_nombre,
          texto: m.contenido,
          hora: m.hora || 'Hoy',
          leido: Boolean(m.leido),
          esMio: this.currentUser ? m.remitente_usuario_id === this.currentUser.id : false
        }));

        if (isBackground && msgs.length !== oldLen) {
          this.render();
          setTimeout(() => {
            const stream = document.getElementById('chat-stream');
            if (stream) stream.scrollTop = stream.scrollHeight;
          }, 40);
        }
      }
    }
  },

  // -------------------------------------------------------------
  // Navegación
  // -------------------------------------------------------------
  setTab(tab) {
    this.currentTab = tab;
    this.render();
  },

  setChatMode(mode) {
    this.chatMode = mode;
    this.render();
  },

  async setPupil(index) {
    this.selectedPupilIndex = index;
    this.activeConversacionId = index === 0 ? 1 : 2;
    await this.cargarMensajesConversacion(this.activeConversacionId);
    await this.cargarReporteriaAlumno();
    this.render();
  },

  // -------------------------------------------------------------
  // Acciones de Alertas (Apoderado: Acuse de Recibo / Profesor: Emisión)
  // -------------------------------------------------------------
  async confirmarAlerta(alertaId) {
    this.acuseStatus[alertaId] = true;
    const a = this.alertasLocales.find(x => x.id === alertaId);
    if (a) {
      a.estado = 'LEIDA';
      a.fecha_lectura = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Si el usuario actual es Carolina (id: 13), marcar su acuse en el tablero del profesor
    const itemCurso = this.apoderadosCurso.find(x => x.id === 13);
    if (itemCurso) {
      itemCurso.confirmado = true;
      itemCurso.fechaAcuse = 'Hoy ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    if (window.mobileApi) {
      await mobileApi.confirmarAlerta(alertaId);
    }
    this.render();
  },

  async emitirAvisoReforzamiento(e) {
    if (e && e.preventDefault) e.preventDefault();
    const tituloInput = document.getElementById('aviso-titulo');
    const descInput = document.getElementById('aviso-desc');
    const tipoSelect = document.getElementById('aviso-tipo');

    if (!tituloInput || !descInput) return;
    const titulo = tituloInput.value.trim();
    const contenido = descInput.value.trim();
    const tipo = tipoSelect ? tipoSelect.value : 'urgente';

    if (!titulo || !contenido) {
      alert('Por favor completa el título y la descripción del aviso.');
      return;
    }

    const nuevaAlerta = {
      id: Date.now(),
      usuario_id: 13, // Carolina Tapia
      tipo: tipo,
      titulo: titulo,
      contenido: contenido,
      fecha_creacion: 'Hoy ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      estado: 'PENDIENTE',
      alumno: 'Curso 1° Básico B'
    };

    this.alertasLocales.unshift(nuevaAlerta);

    // Reiniciar confirmaciones del curso para este nuevo aviso
    this.apoderadosCurso.forEach(apo => {
      apo.confirmado = false;
      apo.fechaAcuse = 'Pendiente';
    });

    if (window.mobileApi) {
      await mobileApi.emitirAlerta(13, tipo, titulo, contenido);
    }

    alert('Aviso de reforzamiento emitido a los apoderados del curso.');
    this.render();
  },

  // -------------------------------------------------------------
  // Mensajería (Chat Directo y Canal Grupal)
  // -------------------------------------------------------------
  async enviarMensajeDirecto(e) {
    if (e && e.preventDefault) e.preventDefault();
    const input = document.getElementById('chat-directo-input');
    if (!input || !input.value.trim()) return;

    const texto = input.value.trim();
    input.value = '';

    const convId = this.activeConversacionId;
    if (!this.mensajesPorConversacion[convId]) {
      this.mensajesPorConversacion[convId] = [];
    }

    const nuevoMsg = {
      id: Date.now(),
      remitenteId: this.currentUser.id,
      remitenteNombre: this.currentUser.name,
      texto: texto,
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      leido: false,
      esMio: true
    };
    this.mensajesPorConversacion[convId].push(nuevoMsg);

    if (window.mobileApi) {
      await mobileApi.enviarMensaje(convId, this.currentUser.id, texto);
    }

    this.render();
    setTimeout(() => {
      const stream = document.getElementById('chat-stream');
      if (stream) stream.scrollTop = stream.scrollHeight;
    }, 50);
  },

  confirmarLecturaComunicado(comunicadoId) {
    const com = this.comunicadosGrupales.find(c => c.id === comunicadoId);
    if (com) {
      com.confirmado = true;
      this.render();
    }
  },

  publicarComunicadoGrupal(e) {
    if (e && e.preventDefault) e.preventDefault();
    const titEl = document.getElementById('comunicado-titulo');
    const contEl = document.getElementById('comunicado-contenido');
    if (!titEl || !contEl) return;

    const tit = titEl.value.trim();
    const cont = contEl.value.trim();
    if (!tit || !cont) {
      alert('Ingresa el título y contenido del comunicado.');
      return;
    }

    this.comunicadosGrupales.unshift({
      id: Date.now(),
      remitenteNombre: this.currentUser.name + ' (Profesora Jefe)',
      curso: '1° Básico B',
      fecha: 'Hoy ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      titulo: tit,
      contenido: cont,
      confirmado: true
    });

    titEl.value = '';
    contEl.value = '';
    alert('Comunicado oficial publicado en el canal grupal del curso.');
    this.render();
  },

  // -------------------------------------------------------------
  // Configuración de Servidor
  // -------------------------------------------------------------
  testServerConnectionMessage: '',
  isTestingConnection: false,

  async testConnection(candidateUrl) {
    this.isTestingConnection = true;
    this.testServerConnectionMessage = 'Probando conexión...';
    this.render();

    const url = candidateUrl || (document.getElementById('cfg-api-url') ? document.getElementById('cfg-api-url').value.trim() : mobileApi.baseUrl);
    const result = await mobileApi.checkHealth(url);
    this.isTestingConnection = false;

    if (result && result.success) {
      this.testServerConnectionMessage = 'Conexión exitosa: Backend y BD MySQL activos (' + (result.data && result.data.database_name ? result.data.database_name : 'conectado') + ')';
    } else {
      this.testServerConnectionMessage = 'Error de conexión: ' + (result.error || 'No se pudo alcanzar el servidor en ' + url);
    }
    this.render();
  },

  async saveServerUrl(e) {
    if (e && e.preventDefault) e.preventDefault();
    const input = document.getElementById('cfg-api-url');
    if (!input) return;
    const url = input.value.trim();
    if (window.mobileApi) {
      mobileApi.setBaseUrl(url);
      await this.testConnection(url);
      if (this.currentUser) {
        await this.cargarDatosUsuario();
      }
    }
  },

  // -------------------------------------------------------------
  // Render Principal de la Aplicación Móvil
  // -------------------------------------------------------------
  render() {
    const root = document.getElementById('mobile-root');
    if (!root) return;

    if (!this.currentUser) {
      root.innerHTML = this.renderLoginView();
    } else {
      root.innerHTML = `
        ${this.renderHeader()}
        <main class="flex-1 overflow-y-auto px-4 py-3 space-y-3 pb-24">
          ${this.currentTab === 'mensajeria' ? this.renderMensajeriaTab() : ''}
          ${this.currentTab === 'alertas' ? this.renderAlertasTab() : ''}
          ${this.currentTab === 'dashboard' ? this.renderDashboardTab() : ''}
          ${this.currentTab === 'config' ? this.renderConfigTab() : ''}
        </main>
        ${this.renderBottomNavigation()}
      `;
    }

    if (this.showServerModal) {
      root.insertAdjacentHTML('beforeend', this.renderServerModal());
    }

    if (window.lucide) {
      lucide.createIcons();
    }
  },

  // -------------------------------------------------------------
  // Vistas de Renderizado Parcial
  // -------------------------------------------------------------
  renderLoginView() {
    const isOnline = window.mobileApi && mobileApi.isOnline;
    return `
      <div class="flex-1 flex flex-col justify-between p-6 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white safe-top-padding">
        <div class="space-y-4 pt-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-lg">
                <i data-lucide="graduation-cap" class="w-6 h-6"></i>
              </div>
              <div>
                <h1 class="font-black text-lg text-white tracking-tight">EduConnect Móvil</h1>
                <p class="text-[11px] text-amber-300 font-bold uppercase tracking-wider">Colegio San Andrés</p>
              </div>
            </div>
            <button onclick="app.showServerModal = true; app.render();" class="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition">
              <i data-lucide="settings" class="w-4 h-4"></i>
            </button>
          </div>

          <div class="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between text-xs">
            <span class="text-slate-300 font-medium">Estado conexión backend:</span>
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black ${isOnline ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'}">
              <span class="w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}"></span>
              ${isOnline ? 'En línea (API activa)' : 'Modo Demostración'}
            </span>
          </div>

          <div class="space-y-1">
            <h2 class="text-xl font-black text-white">Acceso Móvil</h2>
            <p class="text-xs text-slate-400">Canal exclusivo para Profesores y Apoderados.</p>
          </div>

          ${this.errorMessage ? `
            <div class="p-3 rounded-xl bg-rose-500/20 border border-rose-400/30 text-rose-200 text-xs font-semibold flex items-center gap-2">
              <i data-lucide="alert-circle" class="w-4 h-4 flex-shrink-0 text-rose-400"></i>
              <span>${this.errorMessage}</span>
            </div>
          ` : ''}

          <!-- Formulario Credenciales -->
          <form onsubmit="app.handleLoginForm(event)" class="space-y-3 pt-2">
            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1">Correo Institucional</label>
              <input id="mob-email" type="email" placeholder="apoderado@sanandres.cl" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400 placeholder-slate-500 transition">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1">Contraseña</label>
              <input id="mob-password" type="password" placeholder="••••••••" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400 placeholder-slate-500 transition">
            </div>
            <button type="submit" class="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-950 font-black text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer">
              <i data-lucide="log-in" class="w-4 h-4"></i>
              <span>Ingresar con Cuenta</span>
            </button>
          </form>

          <!-- Acceso Rápido por Rol (Demostración directa) -->
          <div class="pt-3 border-t border-slate-800 space-y-2">
            <span class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">Acceso Rápido de Evaluación</span>
            <div class="grid grid-cols-2 gap-2">
              <button onclick="app.loginDemo('profesora')" class="p-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left transition active:scale-95 cursor-pointer">
                <div class="flex items-center gap-2 mb-1">
                  <span class="w-2 h-2 rounded-full bg-blue-400"></span>
                  <span class="text-xs font-black text-white">Profesor</span>
                </div>
                <p class="text-[11px] text-slate-400">Tía Marcela (1° B)</p>
              </button>
              <button onclick="app.loginDemo('apoderado')" class="p-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left transition active:scale-95 cursor-pointer">
                <div class="flex items-center gap-2 mb-1">
                  <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span class="text-xs font-black text-white">Apoderado</span>
                </div>
                <p class="text-[11px] text-slate-400">Carolina (Mateo)</p>
              </button>
            </div>
          </div>
        </div>

        <div class="pt-4 text-center text-[11px] text-slate-500">
          EduConnect v2.0 • Capstone APT122 • Grupo 12
        </div>
      </div>
    `;
  },

  renderHeader() {
    const isOnline = window.mobileApi && mobileApi.isOnline;
    const isProf = this.currentUser.role === 'profesora';
    return `
      <header class="bg-slate-900 text-white px-4 py-3 border-b border-slate-800 sticky top-0 z-30 flex-shrink-0 shadow-md safe-top-padding">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl ${isProf ? 'bg-blue-600' : 'bg-emerald-600'} flex items-center justify-center font-black text-white shadow-xs">
              <i data-lucide="${isProf ? 'book-open' : 'users'}" class="w-5 h-5"></i>
            </div>
            <div>
              <div class="flex items-center gap-1.5">
                <h2 class="font-black text-sm text-white">${this.currentUser.name}</h2>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${isProf ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'}">
                  ${isProf ? 'Docente' : 'Apoderado'}
                </span>
              </div>
              <p class="text-[11px] text-slate-400 font-medium">${this.currentUser.rolLabel}</p>
            </div>
          </div>
          <div class="flex items-center gap-1.5">
            <button onclick="app.showServerModal = true; app.render();" title="Configurar Servidor" class="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition">
              <i data-lucide="wifi" class="w-4 h-4 ${isOnline ? 'text-emerald-400' : 'text-amber-400'}"></i>
            </button>
            <button onclick="app.logout()" title="Cerrar Sesión" class="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 transition">
              <i data-lucide="log-out" class="w-4 h-4"></i>
            </button>
          </div>
        </div>

        ${!isProf && Array.isArray(this.currentUser.pupils) ? `
          <div class="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <span class="text-slate-400 text-[11px] font-bold">Estudiante activo:</span>
            <div class="flex items-center gap-1">
              <button onclick="app.setPupil(0)" class="px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${this.selectedPupilIndex === 0 ? 'bg-amber-400 text-slate-950 font-black shadow-xs' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">
                Mateo (1° B)
              </button>
              <button onclick="app.setPupil(1)" class="px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${this.selectedPupilIndex === 1 ? 'bg-amber-400 text-slate-950 font-black shadow-xs' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">
                Sofía (2° A)
              </button>
            </div>
          </div>
        ` : ''}
      </header>
    `;
  },

  // -------------------------------------------------------------
  // PESTAÑA: MENSAJERÍA ESCOLAR (Canal Grupal y Chat Directo)
  // -------------------------------------------------------------
  renderMensajeriaTab() {
    const isProf = this.currentUser.role === 'profesora';
    return `
      <div class="space-y-3">
        <!-- Selector Canal Grupal vs Chat Directo -->
        <div class="grid grid-cols-2 p-1 rounded-2xl bg-slate-200/80 border border-slate-300 text-xs font-black">
          <button onclick="app.setChatMode('grupal')" class="py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${this.chatMode === 'grupal' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}">
            <i data-lucide="radio" class="w-3.5 h-3.5 text-blue-600"></i>
            <span>Canal Grupal</span>
          </button>
          <button onclick="app.setChatMode('individual')" class="py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${this.chatMode === 'individual' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}">
            <i data-lucide="message-circle" class="w-3.5 h-3.5 text-emerald-600"></i>
            <span>Chat Individual</span>
          </button>
        </div>

        ${this.chatMode === 'grupal' ? this.renderCanalGrupalView() : this.renderChatIndividualView()}
      </div>
    `;
  },

  renderCanalGrupalView() {
    const isProf = this.currentUser.role === 'profesora';
    return `
      <div class="space-y-3">
        <div class="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-950 flex items-start gap-2.5">
          <i data-lucide="info" class="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5"></i>
          <div>
            <span class="font-black block">Canal Oficial de Comunicados (1° Básico B)</span>
            <span class="text-blue-800">Canal institucional unidireccional. La profesora publica anuncios oficiales y las familias registran confirmación de lectura.</span>
          </div>
        </div>

        ${isProf ? `
          <!-- Formulario de Emisión para Docente -->
          <div class="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
            <div class="flex items-center gap-1.5 text-xs font-black text-slate-900">
              <i data-lucide="send" class="w-4 h-4 text-blue-600"></i>
              <span>Publicar Comunicado al Curso</span>
            </div>
            <form onsubmit="app.publicarComunicadoGrupal(event)" class="space-y-2">
              <input id="comunicado-titulo" type="text" placeholder="Título del comunicado oficial..." class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500">
              <textarea id="comunicado-contenido" rows="2" placeholder="Redacta las indicaciones oficiales para las familias del curso..." class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500"></textarea>
              <button type="submit" class="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer">
                <i data-lucide="send" class="w-3.5 h-3.5"></i>
                <span>Emitir Comunicado a Todo el Curso</span>
              </button>
            </form>
          </div>
        ` : ''}

        <!-- Listado de Comunicados Oficiales -->
        <div class="space-y-2.5">
          ${this.comunicadosGrupales.map(com => `
            <div class="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <span class="text-[10px] font-black uppercase text-blue-600 tracking-wider">${com.curso} • ${com.fecha}</span>
                  <h4 class="font-black text-xs text-slate-900 leading-snug">${com.titulo}</h4>
                </div>
                <span class="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                  <i data-lucide="bell" class="w-4 h-4"></i>
                </span>
              </div>
              <p class="text-xs text-slate-700 leading-relaxed">${com.contenido}</p>
              <div class="pt-1 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span class="text-slate-500 font-medium">${com.remitenteNombre}</span>
                ${isProf ? `
                  <span class="inline-flex items-center gap-1 text-emerald-700 font-bold">
                    <i data-lucide="check-check" class="w-3.5 h-3.5"></i>
                    <span>Emitido al Curso</span>
                  </span>
                ` : `
                  ${com.confirmado ? `
                    <span class="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                      <i data-lucide="check" class="w-3 h-3"></i>
                      <span>Lectura Confirmada</span>
                    </span>
                  ` : `
                    <button onclick="app.confirmarLecturaComunicado(${com.id})" class="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] shadow-2xs transition flex items-center gap-1 cursor-pointer">
                      <i data-lucide="check" class="w-3 h-3"></i>
                      <span>Confirmar Lectura</span>
                    </button>
                  `}
                `}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  renderChatIndividualView() {
    const isProf = this.currentUser.role === 'profesora';
    const convId = this.activeConversacionId;
    const msgs = this.mensajesPorConversacion[convId] || [
      {
        id: 1,
        remitenteId: 12,
        remitenteNombre: 'Tía Marcela Soto',
        texto: 'Estimada Carolina, buenas tardes. Le comento que Mateo hoy realizó su primera actividad con el Agente de Voz en la sala y estuvo muy motivado.',
        hora: '16:10',
        leido: true,
        esMio: isProf
      },
      {
        id: 2,
        remitenteId: 13,
        remitenteNombre: 'Carolina Tapia',
        texto: 'Excelente noticia Tía Marcela. En casa me contó muy entusiasmado de las preguntas de adición. Muchas gracias por el reporte.',
        hora: '17:05',
        leido: true,
        esMio: !isProf
      }
    ];

    const interlocutor = isProf ? 'Carolina Tapia (Apoderada de Mateo)' : 'Tía Marcela Soto (Profesora Jefe 1° B)';

    return `
      <div class="flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden h-[460px]">
        <!-- Cabecera del Chat -->
        <div class="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full ${isProf ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'} flex items-center justify-center font-bold text-xs">
              ${isProf ? 'CT' : 'MS'}
            </div>
            <div>
              <h4 class="font-black text-xs text-slate-900">${interlocutor}</h4>
              <span class="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Chat Directo Activo</span>
              </span>
            </div>
          </div>
          <span class="text-[10px] text-slate-500 font-semibold bg-white px-2 py-0.5 rounded-md border border-slate-200">
            ${isProf ? 'Familia González' : '1° Básico B'}
          </span>
        </div>

        <!-- Flujo de Mensajes -->
        <div id="chat-stream" class="flex-1 p-3 overflow-y-auto space-y-2.5 bg-slate-50/50">
          ${msgs.map(m => `
            <div class="flex flex-col ${m.esMio ? 'items-end' : 'items-start'}">
              <div class="max-w-[82%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed shadow-2xs ${m.esMio ? 'bg-blue-600 text-white rounded-br-xs' : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs'}">
                <span class="block text-[10px] font-black mb-0.5 ${m.esMio ? 'text-blue-100' : 'text-slate-500'}">${m.remitenteNombre}</span>
                <p>${m.texto}</p>
              </div>
              <div class="flex items-center gap-1 mt-0.5 px-1 text-[10px] text-slate-400">
                <span>${m.hora}</span>
                ${m.esMio ? `
                  <i data-lucide="${m.leido ? 'check-check' : 'check'}" class="w-3 h-3 ${m.leido ? 'text-blue-600' : 'text-slate-400'}"></i>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Barra de Envío -->
        <form onsubmit="app.enviarMensajeDirecto(event)" class="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2">
          <input id="chat-directo-input" type="text" placeholder="Escribe un mensaje a ${isProf ? 'la apoderada' : 'la profesora'}..." class="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500">
          <button type="submit" class="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer shadow-xs">
            <i data-lucide="send" class="w-4 h-4"></i>
          </button>
        </form>
      </div>
    `;
  },

  // -------------------------------------------------------------
  // PESTAÑA: GESTIÓN DE ALERTAS (Apoderado: Acuse / Profesor: Tablero)
  // -------------------------------------------------------------
  renderAlertasTab() {
    const isProf = this.currentUser.role === 'profesora';
    return isProf ? this.renderTableroProfesorAlertas() : this.renderBandejaApoderadoAlertas();
  },

  // Vista B.1: Bandeja de Alertas para Apoderado con Acuse de Recibo
  renderBandejaApoderadoAlertas() {
    const filtradas = this.alertasLocales.filter(a => {
      if (this.filterAlertas === 'urgente') return a.tipo === 'urgente';
      if (this.filterAlertas === 'informativa') return a.tipo !== 'urgente';
      return true;
    });

    const pendientesCount = this.alertasLocales.filter(a => a.estado === 'PENDIENTE').length;

    return `
      <div class="space-y-3">
        <!-- Resumen de Alertas -->
        <div class="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-xs flex items-center justify-between">
          <div>
            <span class="text-[10px] font-black uppercase tracking-wider text-slate-900">Bandeja Oficial de Alertas</span>
            <h3 class="text-base font-black text-slate-950">
              ${pendientesCount > 0 ? `${pendientesCount} alerta(s) requieren tu acuse` : 'Todas las alertas al día'}
            </h3>
            <p class="text-xs text-slate-900 font-medium">Revisa las notificaciones del progreso de tu pupilo.</p>
          </div>
          <div class="w-10 h-10 rounded-xl bg-white/30 flex items-center justify-center font-black">
            <i data-lucide="bell" class="w-5 h-5 text-slate-950"></i>
          </div>
        </div>

        <!-- Filtros de Prioridad -->
        <div class="flex items-center gap-1.5 text-xs font-bold">
          <button onclick="app.filterAlertas = 'todas'; app.render();" class="px-3 py-1.5 rounded-xl border transition ${this.filterAlertas === 'todas' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}">
            Todas (${this.alertasLocales.length})
          </button>
          <button onclick="app.filterAlertas = 'urgente'; app.render();" class="px-3 py-1.5 rounded-xl border transition ${this.filterAlertas === 'urgente' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-rose-700 border-slate-200'}">
            Urgentes
          </button>
          <button onclick="app.filterAlertas = 'informativa'; app.render();" class="px-3 py-1.5 rounded-xl border transition ${this.filterAlertas === 'informativa' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-700 border-slate-200'}">
            Informativas
          </button>
        </div>

        <!-- Lista de Alertas -->
        <div class="space-y-2.5">
          ${filtradas.map(a => {
            const esUrgente = a.tipo === 'urgente';
            const yaLeida = a.estado === 'LEIDA' || this.acuseStatus[a.id];
            return `
              <div class="p-3.5 rounded-2xl bg-white border ${esUrgente && !yaLeida ? 'border-rose-300 ring-1 ring-rose-200 shadow-sm' : 'border-slate-200'} shadow-xs space-y-2">
                <div class="flex items-start justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${esUrgente ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}">
                      ${esUrgente ? 'Urgente' : 'Informativa'}
                    </span>
                    <span class="text-[11px] text-slate-400 font-bold">${a.fecha_creacion}</span>
                  </div>
                  <span class="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    ${a.alumno}
                  </span>
                </div>

                <div>
                  <h4 class="font-black text-xs text-slate-900 leading-snug">${a.titulo}</h4>
                  <p class="text-xs text-slate-600 mt-1 leading-relaxed">${a.contenido}</p>
                </div>

                <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div class="text-[11px]">
                    ${yaLeida ? `
                      <span class="inline-flex items-center gap-1 text-emerald-700 font-bold">
                        <i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-600"></i>
                        <span>Acuse de recibo registrado</span>
                      </span>
                    ` : `
                      <span class="inline-flex items-center gap-1 text-amber-700 font-bold">
                        <i data-lucide="clock" class="w-3.5 h-3.5 text-amber-600"></i>
                        <span>Pendiente de confirmación</span>
                      </span>
                    `}
                  </div>

                  ${!yaLeida ? `
                    <button onclick="app.confirmarAlerta(${a.id})" class="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer active:scale-95">
                      <i data-lucide="check" class="w-3.5 h-3.5"></i>
                      <span>Acuse de recibo</span>
                    </button>
                  ` : `
                    <span class="text-[10px] text-slate-400 font-semibold">Guardado en BD</span>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  // Vista B.2: Tablero del Profesor (Porcentaje de Acuses del Curso y Emisión de Alertas)
  renderTableroProfesorAlertas() {
    const totalApos = this.apoderadosCurso.length;
    const confirmados = this.apoderadosCurso.filter(a => a.confirmado).length;
    const pct = Math.round((confirmados / totalApos) * 100);

    return `
      <div class="space-y-3">
        <!-- Indicador de Acuses de Recibo del Curso -->
        <div class="p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xs space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black uppercase tracking-wider text-blue-200">Monitoreo Oficial 1° Básico B</span>
            <span class="px-2 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-black">${confirmados} de ${totalApos} Apoderados</span>
          </div>
          <div>
            <h3 class="text-xl font-black text-white">${pct}% de Acuses Confirmados</h3>
            <p class="text-xs text-blue-100">Porcentaje de recepción y lectura de las alertas emitidas al curso.</p>
          </div>
          <!-- Barra de Progreso -->
          <div class="w-full h-2.5 rounded-full bg-blue-900/60 overflow-hidden">
            <div class="h-full bg-amber-400 rounded-full transition-all duration-500" style="width: ${pct}%"></div>
          </div>
        </div>

        <!-- Emisión de Alerta de Reforzamiento -->
        <div class="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5 text-xs font-black text-slate-900">
              <i data-lucide="plus-circle" class="w-4 h-4 text-rose-600"></i>
              <span>Emitir Alerta de Reforzamiento al Curso</span>
            </div>
            <span class="text-[10px] font-bold text-slate-400">Escuela -> Apoderado</span>
          </div>

          <form onsubmit="app.emitirAvisoReforzamiento(event)" class="space-y-2">
            <div>
              <label class="block text-[11px] font-bold text-slate-600 mb-0.5">Tipo de Prioridad</label>
              <select id="aviso-tipo" class="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 focus:outline-none">
                <option value="urgente">Urgente (Rezago en Objetivo de Aprendizaje)</option>
                <option value="informativa">Informativa (Recordatorio escolar)</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-600 mb-0.5">Título del Aviso</label>
              <input id="aviso-titulo" type="text" value="Aviso de Refuerzo: Adiciones y Conteo Rítmico" class="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-500">
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-600 mb-0.5">Descripción para los Apoderados</label>
              <textarea id="aviso-desc" rows="2" class="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500">Estimados apoderados: Se solicita reforzar en casa la secuencia de adiciones con material pictórico y las dinámicas rítmicas antes de la evaluación del viernes.</textarea>
            </div>
            <button type="submit" class="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer">
              <i data-lucide="send" class="w-3.5 h-3.5"></i>
              <span>Emitir Alerta y Solicitar Acuse de Recibo</span>
            </button>
          </form>
        </div>

        <!-- Nómina de Confirmaciones del Curso -->
        <div class="space-y-1.5">
          <span class="block text-[11px] font-black uppercase tracking-wider text-slate-500 px-1">Estado de Confirmación por Apoderado</span>
          <div class="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
            ${this.apoderadosCurso.map(apo => `
              <div class="p-3 flex items-center justify-between text-xs">
                <div>
                  <span class="font-black text-slate-900 block">${apo.apoderado}</span>
                  <span class="text-[11px] text-slate-500">Pupilo: ${apo.alumno}</span>
                </div>
                <div class="text-right">
                  ${apo.confirmado ? `
                    <span class="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 text-[11px]">
                      <i data-lucide="check" class="w-3 h-3"></i>
                      <span>Acuse: ${apo.fechaAcuse}</span>
                    </span>
                  ` : `
                    <span class="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 text-[11px]">
                      <i data-lucide="clock" class="w-3 h-3"></i>
                      <span>Sin Confirmar</span>
                    </span>
                  `}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  // -------------------------------------------------------------
  // PESTAÑA: PANEL DASHBOARD (Apoderado: Seguimiento Académico)
  // -------------------------------------------------------------
  renderDashboardTab() {
    const isOnline = window.mobileApi && mobileApi.isOnline;
    const pupilName = this.selectedPupilIndex === 0 ? 'Mateo González' : 'Sofía González';
    const pupilCourse = this.selectedPupilIndex === 0 ? '1° Básico B' : '2° Básico A';

    // Datos por defecto si no ha cargado la API
    const data = this.reporteriaData || {
      overall_grade: this.selectedPupilIndex === 0 ? 6.5 : 5.5,
      math_grade: this.selectedPupilIndex === 0 ? 6.2 : 5.5,
      math_status: 'Muy Bien',
      math_tasks: '0 de 2 tareas completadas',
      language_grade: this.selectedPupilIndex === 0 ? 6.8 : 6.5,
      language_status: 'Excelente',
      language_tasks: '0 de 2 tareas completadas',
      pending_count: 4,
      completed_count: 0,
      total_activities: 4,
      completion_rate: 50,
      next_pending_task: {
        titulo: 'Misión Conteo Mágico: Cuenta del 1 al 10 con Robot Leo',
        asignatura: 'Matemáticas',
        estado: 'Pendiente'
      },
      actividades: [
        {
          actividad_id: 7,
          titulo: 'Misión Conteo Mágico: Cuenta del 1 al 10 con Robot Leo',
          asignatura: 'Matemáticas',
          estado: 'Pendiente'
        },
        {
          actividad_id: 4,
          titulo: 'El Bosque de los Números: Sumas hasta el 10 con Voz',
          asignatura: 'Matemáticas',
          estado: 'Pendiente'
        }
      ]
    };

    const overall = data.overall_grade || 6.5;
    const isGood = overall >= 6.0;

    return `
      <div class="space-y-3">
        <!-- Banner Principal del Dashboard -->
        <div class="p-4 rounded-2xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 text-white shadow-xs space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black uppercase tracking-wider text-indigo-200">Panel Académico del Pupilo</span>
            <span class="px-2 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-black">${pupilCourse}</span>
          </div>
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-black text-white">${pupilName}</h3>
              <p class="text-xs text-indigo-100">Progreso pedagógico oficial sincronizado con MySQL</p>
            </div>
            <div class="text-right">
              <span class="text-2xl font-black text-amber-300">${overall.toFixed ? overall.toFixed(1) : overall}</span>
              <span class="block text-[10px] font-bold text-indigo-200">Promedio General</span>
            </div>
          </div>
        </div>

        <!-- Tarjetas Semáforo por Asignatura -->
        <div class="grid grid-cols-2 gap-2.5">
          <!-- Matemáticas -->
          <div class="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div class="flex items-center justify-between">
              <span class="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
                <i data-lucide="calculator" class="w-4 h-4"></i>
              </span>
              <span class="text-lg font-black text-blue-700">${data.math_grade || 6.2}</span>
            </div>
            <div>
              <h4 class="font-black text-xs text-slate-900">Matemáticas</h4>
              <p class="text-[11px] text-emerald-600 font-bold">${data.math_status || 'Muy Bien'}</p>
              <p class="text-[10px] text-slate-400 mt-0.5">${data.math_tasks || '2 actividades'}</p>
            </div>
          </div>

          <!-- Lenguaje -->
          <div class="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div class="flex items-center justify-between">
              <span class="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
                <i data-lucide="book-open" class="w-4 h-4"></i>
              </span>
              <span class="text-lg font-black text-purple-700">${data.language_grade || 6.8}</span>
            </div>
            <div>
              <h4 class="font-black text-xs text-slate-900">Lenguaje</h4>
              <p class="text-[11px] text-emerald-600 font-bold">${data.language_status || 'Excelente'}</p>
              <p class="text-[10px] text-slate-400 mt-0.5">${data.language_tasks || '2 actividades'}</p>
            </div>
          </div>
        </div>

        <!-- Resumen de Cumplimiento -->
        <div class="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5 text-xs font-black text-slate-900">
              <i data-lucide="check-circle" class="w-4 h-4 text-emerald-600"></i>
              <span>Cumplimiento de Tareas</span>
            </div>
            <span class="text-xs font-black text-emerald-700">${data.completion_rate || 50}%</span>
          </div>
          <div class="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div class="h-full bg-emerald-500 rounded-full transition-all duration-500" style="width: ${data.completion_rate || 50}%"></div>
          </div>
          <div class="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Pendientes: <strong class="text-rose-600">${data.pending_count || 4}</strong></span>
            <span>Completadas: <strong class="text-emerald-600">${data.completed_activities_month || 9}</strong></span>
          </div>
        </div>

        <!-- Próxima Tarea Pedagógica -->
        <div class="p-3.5 rounded-2xl bg-white border border-amber-200 bg-amber-50/40 shadow-xs space-y-1.5">
          <div class="flex items-center gap-1.5 text-[11px] font-black uppercase text-amber-700">
            <i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-600"></i>
            <span>Próxima Actividad con Voz IA</span>
          </div>
          <h4 class="font-black text-xs text-slate-900">${(data.next_pending_task && data.next_pending_task.titulo) ? data.next_pending_task.titulo : 'Misión Conteo Mágico'}</h4>
          <p class="text-[11px] text-slate-600">El alumno responde oralmente con reconocimiento de voz en la plataforma web.</p>
        </div>

        <!-- Botón de actualización de métricas -->
        <button onclick="app.cargarReporteriaAlumno().then(() => app.render())" class="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer">
          <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
          <span>Actualizar Métricas del Backend</span>
        </button>
      </div>
    `;
  },

  // -------------------------------------------------------------
  // PESTAÑA: CONFIGURACIÓN Y ESTADO DE RED
  // -------------------------------------------------------------
  renderConfigTab() {
    const isOnline = window.mobileApi && mobileApi.isOnline;
    const currentUrl = window.mobileApi ? mobileApi.baseUrl : 'http://127.0.0.1:8000/api';
    return `
      <div class="space-y-3">
        <div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <i data-lucide="server" class="w-4 h-4"></i>
            </div>
            <div>
              <h3 class="font-black text-sm text-slate-900">Configuración de Conexión</h3>
              <p class="text-xs text-slate-500">Ajusta la dirección IP del servidor para pruebas en dispositivo físico.</p>
            </div>
          </div>

          <div class="space-y-2.5">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">URL Base de la API</label>
              <input id="cfg-api-url" type="text" value="${currentUrl}" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500">
              <p class="text-[10px] text-slate-500 mt-1">Tu PC actual en Wi-Fi: <strong>http://192.168.1.113:8000/api</strong></p>
            </div>

            ${this.testServerConnectionMessage ? `
              <div class="p-2.5 rounded-xl text-xs font-bold ${this.testServerConnectionMessage.startsWith('Conexión exitosa') ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' : 'bg-rose-50 text-rose-800 border border-rose-300'}">
                ${this.testServerConnectionMessage}
              </div>
            ` : ''}

            <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span class="font-bold text-slate-700">Estado de red actual:</span>
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black ${isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                <span class="w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
                ${isOnline ? 'Conectado al Backend' : 'Modo Offline / Caché'}
              </span>
            </div>

            <div class="flex flex-col gap-2 pt-1">
              <button type="button" onclick="app.testConnection()" class="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer">
                <i data-lucide="activity" class="w-4 h-4"></i>
                <span>${this.isTestingConnection ? 'Probando...' : 'Probar Conexión con Backend'}</span>
              </button>
              <button type="button" onclick="app.saveServerUrl(event)" class="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-xs transition cursor-pointer">
                Guardar URL
              </button>
            </div>
          </div>
        </div>

        <div class="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1.5 text-xs text-slate-600">
          <span class="font-black text-slate-900 block">Resiliencia y Modo Offline</span>
          <p>La aplicación guarda en LocalStorage las alertas, mensajes y comunicados. Si no hay conexión durante la defensa, las confirmaciones de lectura quedan en cola y se sincronizan automáticamente.</p>
        </div>
      </div>
    `;
  },

  renderServerModal() {
    const currentUrl = window.mobileApi ? mobileApi.baseUrl : 'http://127.0.0.1:8000/api';
    return `
      <div class="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
        <div class="bg-white rounded-3xl p-5 max-w-sm w-full space-y-3.5 shadow-2xl border border-slate-200">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                <i data-lucide="settings" class="w-4 h-4"></i>
              </div>
              <h3 class="font-black text-sm text-slate-900">Ajustes de Servidor</h3>
            </div>
            <button onclick="app.showServerModal = false; app.render();" class="p-1 rounded-lg text-slate-400 hover:text-slate-600">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Dirección IP / Host de la API</label>
              <input id="cfg-api-url" type="text" value="${currentUrl}" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:border-amber-400">
              <span class="text-[10px] text-slate-500 block mt-1">Tu PC actual en Wi-Fi: <strong>http://192.168.1.113:8000/api</strong></span>
            </div>

            ${this.testServerConnectionMessage ? `
              <div class="p-2.5 rounded-xl text-xs font-bold ${this.testServerConnectionMessage.startsWith('Conexión exitosa') ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' : 'bg-rose-50 text-rose-800 border border-rose-300'}">
                ${this.testServerConnectionMessage}
              </div>
            ` : ''}

            <div class="pt-1 flex flex-col gap-2">
              <button type="button" onclick="app.testConnection()" class="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs">
                <i data-lucide="activity" class="w-4 h-4"></i>
                <span>${this.isTestingConnection ? 'Probando...' : 'Probar Conexión con Backend'}</span>
              </button>
              <div class="flex items-center gap-2">
                <button type="button" onclick="app.saveServerUrl(event)" class="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black transition cursor-pointer">
                  Guardar IP
                </button>
                <button type="button" onclick="app.showServerModal = false; app.testServerConnectionMessage = ''; app.render();" class="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderBottomNavigation() {
    const isProf = this.currentUser.role === 'profesora';
    return `
      <nav class="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2 flex items-center justify-around z-30 shadow-lg">
        <button onclick="app.setTab('mensajeria')" class="flex flex-col items-center gap-1 transition ${this.currentTab === 'mensajeria' ? 'text-blue-600 font-black' : 'text-slate-400 hover:text-slate-600 font-bold'}">
          <i data-lucide="message-square" class="w-5 h-5"></i>
          <span class="text-[10px]">Mensajería</span>
        </button>

        <button onclick="app.setTab('alertas')" class="flex flex-col items-center gap-1 transition ${this.currentTab === 'alertas' ? 'text-rose-600 font-black' : 'text-slate-400 hover:text-slate-600 font-bold'}">
          <div class="relative">
            <i data-lucide="bell" class="w-5 h-5"></i>
            ${!isProf ? `
              <span class="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-rose-500"></span>
            ` : ''}
          </div>
          <span class="text-[10px]">${isProf ? 'Acuses Curso' : 'Alertas'}</span>
        </button>

        ${!isProf ? `
          <button onclick="app.setTab('dashboard')" class="flex flex-col items-center gap-1 transition ${this.currentTab === 'dashboard' ? 'text-indigo-600 font-black' : 'text-slate-400 hover:text-slate-600 font-bold'}">
            <i data-lucide="layout-dashboard" class="w-5 h-5"></i>
            <span class="text-[10px]">Dashboard</span>
          </button>
        ` : ''}

        <button onclick="app.setTab('config')" class="flex flex-col items-center gap-1 transition ${this.currentTab === 'config' ? 'text-slate-900 font-black' : 'text-slate-400 hover:text-slate-600 font-bold'}">
          <i data-lucide="sliders" class="w-5 h-5"></i>
          <span class="text-[10px]">Ajustes</span>
        </button>
      </nav>
    `;
  }
};

window.app = app;
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
