// EDUCONNECT Mobile Controller (Optimizado para demostración móvil en navegador)
// Acceso exclusivo para Profesor y Apoderado
const mobileApp = {
  currentUser: null,
  currentTab: 'mensajeria', // 'mensajeria' | 'reporteria' | 'alertas'
  errorMessage: '',
  confirmedAlerts: {},

  // Estado del chat interactivo en móvil
  chatMessages: [
    {
      senderRole: 'profesora',
      senderName: 'Tía Marcela Soto',
      time: '16:10',
      text: 'Estimada Carolina, buenas tardes. Le comento que Mateo hoy realizó su primera actividad con el Agente de Voz IA en la sala. Como él aún está afianzando la lectura de textos largos, le ayudó muchísimo que el robot le leyera los problemas hablados con las frutas.',
      readStatus: 'Leído'
    },
    {
      senderRole: 'apoderado',
      senderName: 'Carolina Tapia',
      time: '17:05',
      text: 'Excelente noticia Tía Marcela. En la casa Mateo me contó muy entusiasmado que Robot Leo le hizo preguntas y que él le respondió hablando. Nos da mucha tranquilidad saber que no se frustra con la lectura.',
      readStatus: 'Leído'
    },
    {
      senderRole: 'profesora',
      senderName: 'Tía Marcela Soto',
      time: '17:18',
      text: 'Así es, esa es la meta de la IA por voz en 1° básico. Mañana continuaremos con la actividad de sumas y la próxima semana con la letra S. Saludos cordiales.',
      readStatus: 'Visto por la profesora'
    }
  ],

  init() {
    if (window.api) {
      api.checkHealth().then(() => {
        this.loadApiMessages();
      });
    }
    this.render();
  },

  async loadApiMessages() {
    if (window.api && api.isOnline) {
      try {
        const msgs = await api.getMessages(1);
        if (Array.isArray(msgs) && msgs.length > 0) {
          this.chatMessages = msgs.map(m => {
            const senderName = m.remitente_nombre || '';
            const isProf = senderName.toLowerCase().includes('marcela') || senderName.toLowerCase().includes('prof');
            return {
              senderRole: isProf ? 'profesora' : 'apoderado',
              senderName: senderName,
              time: m.hora || 'Hoy',
              text: m.contenido,
              readStatus: 'Sincronizado'
            };
          });
          this.render();
        }
      } catch (err) {
        console.warn("[Mobile] Error cargando mensajes:", err);
      }
    }
  },

  login(roleKey) {
    if (roleKey !== 'apoderado' && roleKey !== 'profesora') {
      this.errorMessage = 'En versión móvil solo está habilitado el acceso para Profesores y Apoderados.';
      this.render();
      return;
    }

    this.currentUser = mockData.demoUsers[roleKey];
    this.currentTab = 'mensajeria';
    this.errorMessage = '';
    this.render();
  },

  async handleLoginForm(e) {
    if (e && e.preventDefault) e.preventDefault();
    const emailInput = document.getElementById('mobile-email');
    const passInput = document.getElementById('mobile-password');
    if (!emailInput || !passInput) return;

    const email = emailInput.value.trim().toLowerCase();
    const pass = passInput.value.trim();

    if (!email || !pass) {
      this.errorMessage = 'Por favor ingresa tu correo y contraseña.';
      this.render();
      return;
    }

    if (window.api && api.isOnline) {
      try {
        const response = await fetch(`${api.baseUrl}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: pass })
        });

        if (response.ok) {
          const apiUser = await response.json();
          if (apiUser.access_token) {
            api.token = apiUser.access_token;
            localStorage.setItem('educonnect_jwt_token', apiUser.access_token);
          }

          const rolPrincipal = (apiUser.rol_principal || 'APODERADO').toUpperCase();
          if (rolPrincipal.includes('ADMIN') || rolPrincipal.includes('ALUM')) {
            this.errorMessage = 'Esta versión móvil está habilitada únicamente para Profesores y Apoderados. Para Alumno o Administrador, ingresa desde la versión de escritorio.';
            this.render();
            return;
          }

          const mappedRole = rolPrincipal.includes('PROFE') ? 'profesora' : 'apoderado';
          this.currentUser = {
            ...(mockData.demoUsers[mappedRole] || mockData.demoUsers['apoderado']),
            id: apiUser.id,
            name: apiUser.nombre,
            email: apiUser.email,
            role: mappedRole,
            fromLiveApi: true
          };
          this.currentTab = 'mensajeria';
          this.errorMessage = '';
          this.render();
          return;
        } else {
          const errData = await response.json().catch(() => ({}));
          this.errorMessage = errData.detail || 'Error de autenticación: Credenciales no válidas.';
          this.render();
          return;
        }
      } catch (err) {
        console.warn("[API Mobile] Falló conexión con API", err);
      }
    }

    // Fallback si la API no está online
    if (email === 'profesora@sanandres.cl' && pass === 'profe123') {
      this.login('profesora');
    } else if (email === 'apoderado@sanandres.cl' && pass === 'apoderado123') {
      this.login('apoderado');
    } else if (email === 'admin@sanandres.cl' || email === 'alumno@sanandres.cl') {
      this.errorMessage = 'Esta versión móvil está habilitada únicamente para Profesores y Apoderados.';
      this.render();
    } else {
      this.errorMessage = 'Credenciales no válidas. Revisa el correo y contraseña.';
      this.render();
    }
  },

  logout() {
    this.currentUser = null;
    this.currentTab = 'mensajeria';
    this.render();
  },

  setTab(tabId) {
    // Regla estricta: El profesor no puede ver alertas en móvil
    if (this.currentUser.role === 'profesora' && tabId === 'alertas') {
      alert('La visualización y gestión de alertas solo está disponible en la versión de escritorio para docentes.');
      return;
    }
    this.currentTab = tabId;
    this.render();
  },

  async sendMessage(e) {
    e.preventDefault();
    const input = document.getElementById('mobile-chat-input');
    if (!input || !input.value.trim()) return;

    const text = input.value.trim();
    input.value = '';

    const senderId = (this.currentUser && this.currentUser.id) ? this.currentUser.id : 13;

    if (window.api && api.isOnline) {
      try {
        await api.sendMessage(1, senderId, text);
        await this.loadApiMessages();
      } catch (err) {
        console.warn("[Mobile] Error enviando mensaje a la API:", err);
      }
    } else {
      this.chatMessages.push({
        senderRole: this.currentUser.role,
        senderName: this.currentUser.name,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: text,
        readStatus: 'Entregado'
      });
      this.render();
    }

    setTimeout(() => {
      const stream = document.getElementById('mobile-chat-stream');
      if (stream) stream.scrollTop = stream.scrollHeight;
    }, 50);
  },

  confirmAlert(alertId) {
    this.confirmedAlerts[alertId] = true;
    this.render();
  },

  switchStudent(studentId) {
    if (mockData.setSelectedStudent) {
      mockData.setSelectedStudent(studentId);
    }
    this.render();
  },

  // -------------------------------------------------------------
  // RENDERIZADO PRINCIPAL
  // -------------------------------------------------------------
  render() {
    const root = document.getElementById('mobile-root');
    if (!root) return;

    if (!this.currentUser) {
      root.innerHTML = this.renderLoginView();
    } else {
      root.innerHTML = `
        <div class="flex flex-col h-full bg-slate-50 relative">
          <!-- Top App Bar -->
          ${this.renderHeader()}

          <!-- Scrollable Main View Body -->
          <main class="flex-1 overflow-y-auto pb-20 no-scrollbar">
            ${this.renderCurrentTabHtml()}
          </main>

          <!-- Fixed Bottom Navigation Bar -->
          ${this.renderBottomNav()}
        </div>
      `;
    }

    lucide.createIcons();
  },

  // -------------------------------------------------------------
  // VISTA: LOGIN MÓVIL
  // -------------------------------------------------------------
  renderLoginView() {
    return `
      <div class="min-h-screen flex flex-col justify-between p-6 bg-gradient-to-b from-slate-50 via-slate-100 to-blue-50/40 animate-fadeIn">
        
        <!-- Header Branding -->
        <div class="pt-8 text-center space-y-2">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 shadow-md border-2 border-white mb-1">
            <i data-lucide="smartphone" class="w-7 h-7"></i>
          </div>
          <h1 class="text-2xl font-black tracking-tight text-slate-900">EDUCONNECT Móvil</h1>
          <p class="text-[11px] font-bold uppercase tracking-widest text-slate-500">Colegio San Andrés • 1° y 2° Básico</p>
          <div class="inline-block bg-blue-100 text-blue-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase mt-1">
            Acceso Exclusivo: Profesor y Apoderado
          </div>
        </div>

        <!-- Login Card -->
        <div class="bg-white rounded-3xl p-5 border border-slate-200 shadow-xl space-y-5 my-4">
          
          <div>
            <h2 class="text-base font-bold text-slate-900">Ingreso Móvil</h2>
            <p class="text-xs text-slate-500">Mensajería directa y reportería de aprendizaje.</p>
          </div>

          ${this.errorMessage ? `
            <div class="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2">
              <i data-lucide="alert-circle" class="w-4 h-4 text-red-500 flex-shrink-0"></i>
              <span>${this.errorMessage}</span>
            </div>
          ` : ''}

          <!-- Formulario Manual -->
          <form onsubmit="mobileApp.handleLoginForm(e)" class="space-y-3.5">
            <div>
              <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Correo Electrónico</label>
              <div class="relative">
                <i data-lucide="mail" class="w-4 h-4 text-slate-400 absolute left-3 top-2.5"></i>
                <input 
                  type="email" 
                  id="mobile-email"
                  value=""
                  placeholder="ej. apoderado@sanandres.cl"
                  class="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
              </div>
            </div>

            <div>
              <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Contraseña</label>
              <div class="relative">
                <i data-lucide="lock" class="w-4 h-4 text-slate-400 absolute left-3 top-2.5"></i>
                <input 
                  type="password" 
                  id="mobile-password"
                  value=""
                  placeholder="••••••••"
                  class="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
              </div>
            </div>

            <button 
              type="submit" 
              class="w-full py-3 px-4 rounded-xl bg-slate-900 text-white text-xs font-bold uppercase tracking-wider transition active:scale-95 flex items-center justify-center gap-2 shadow"
            >
              <span>Validar e Ingresar</span>
              <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
            </button>
          </form>
        </div>

        </div>

        <!-- Footer / Link to Desktop -->
        <div class="text-center pb-4 space-y-1 text-xs text-slate-500">
          <p>Materias activas: <strong>Lenguaje y Matemáticas</strong></p>
          <a href="index.html" class="inline-flex items-center gap-1 font-bold text-blue-600 hover:underline">
            <i data-lucide="monitor" class="w-3.5 h-3.5"></i>
            <span>Ir a Versión de Escritorio (Desktop)</span>
          </a>
        </div>

      </div>
    `;
  },

  // -------------------------------------------------------------
  // HEADER MÓVIL
  // -------------------------------------------------------------
  renderHeader() {
    return `
      <header class="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-30 flex items-center justify-between shadow-xs">
        <div class="flex items-center gap-2.5">
          <img 
            src="${this.currentUser.avatar}" 
            alt="${this.currentUser.name}"
            onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=' + encodeURIComponent('${this.currentUser.name}') + '&background=2563eb&color=fff&bold=true&size=150';"
            class="w-9 h-9 rounded-xl object-cover ring-2 ring-amber-400"
          >
          <div>
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-black text-slate-900 leading-tight">${this.currentUser.name}</span>
              <span class="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full ${
                this.currentUser.role === 'profesora' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
              }">
                ${this.currentUser.roleLabel}
              </span>
            </div>
            <span class="text-[10px] text-slate-500 block leading-none mt-0.5">${this.currentUser.course || 'Colegio San Andrés'}</span>
          </div>
        </div>

        <button 
          onclick="mobileApp.logout()"
          class="p-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 transition"
          title="Cambiar de Rol / Salir"
        >
          <i data-lucide="log-out" class="w-4 h-4"></i>
        </button>
      </header>
    `;
  },

  // -------------------------------------------------------------
  // BOTTOM NAVIGATION BAR (Navegación Móvil)
  // Regla: Para Apoderado = Mensajes, Reporte, Alertas.
  // Regla: Para Profesor = Mensajes, Reporte (Alertas NO disponible).
  // -------------------------------------------------------------
  renderBottomNav() {
    const isTeacher = this.currentUser.role === 'profesora';

    return `
      <nav class="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 px-3 py-2 flex items-center justify-around shadow-lg">
        
        <!-- Tab 1: Mensajes -->
        <button 
          onclick="mobileApp.setTab('mensajeria')"
          class="flex flex-col items-center py-1 px-3 rounded-xl transition-all relative ${
            this.currentTab === 'mensajeria' ? 'text-blue-600 font-black' : 'text-slate-500 font-medium'
          }"
        >
          <i data-lucide="message-square" class="w-5 h-5 mb-0.5"></i>
          <span class="text-[10px]">Mensajes</span>
          <span class="absolute top-0.5 right-2 w-2 h-2 rounded-full bg-emerald-500"></span>
        </button>

        <!-- Tab 2: Reporte -->
        <button 
          onclick="mobileApp.setTab('reporteria')"
          class="flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
            this.currentTab === 'reporteria' ? 'text-blue-600 font-black' : 'text-slate-500 font-medium'
          }"
        >
          <i data-lucide="bar-chart-3" class="w-5 h-5 mb-0.5"></i>
          <span class="text-[10px]">Reporte</span>
        </button>

        <!-- Tab 3: Alertas (SOLO APODERADO - OCULTO PARA PROFESOR) -->
        ${!isTeacher ? `
          <button 
            onclick="mobileApp.setTab('alertas')"
            class="flex flex-col items-center py-1 px-3 rounded-xl transition-all relative ${
              this.currentTab === 'alertas' ? 'text-blue-600 font-black' : 'text-slate-500 font-medium'
            }"
          >
            <i data-lucide="bell" class="w-5 h-5 mb-0.5"></i>
            <span class="text-[10px]">Alertas</span>
            <span class="absolute top-0 right-2 bg-red-500 text-white text-[8px] font-black px-1 rounded-full">1</span>
          </button>
        ` : ''}

      </nav>
    `;
  },

  // -------------------------------------------------------------
  // DISPATCHER DE VISTAS MÓVILES
  // -------------------------------------------------------------
  renderCurrentTabHtml() {
    switch (this.currentTab) {
      case 'mensajeria':
        return this.renderMensajeriaView();
      case 'reporteria':
        return this.renderReporteriaView();
      case 'alertas':
        return this.renderAlertasView();
      default:
        return this.renderMensajeriaView();
    }
  },

  // -------------------------------------------------------------
  // VISTA MÓVIL 1: MENSAJERÍA
  // -------------------------------------------------------------
  renderMensajeriaView() {
    const isTeacher = this.currentUser.role === 'profesora';
    const contactName = isTeacher ? 'Carolina Tapia (Apoderada)' : 'Tía Marcela Soto (Profesora Jefe)';
    const contactSubtitle = isTeacher ? 'Apoderada de Mateo González • 1° Básico B' : 'Profesora Jefe • 1° Básico B';
    const contactAvatar = isTeacher 
      ? 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80';

    return `
      <div class="flex flex-col min-h-full">
        
        <!-- Contact Bar -->
        <div class="bg-white p-3 border-b border-slate-200 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <img src="${contactAvatar}" class="w-9 h-9 rounded-full object-cover ring-2 ring-blue-400">
            <div>
              <h3 class="text-xs font-bold text-slate-900 leading-tight">${contactName}</h3>
              <div class="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>En línea • Canal Oficial</span>
              </div>
            </div>
          </div>

          <button onclick="alert('Abriendo archivos y certificados médicos adjuntos...')" class="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs flex items-center gap-1" title="Ver archivos compartidos">
            <i data-lucide="paperclip" class="w-3.5 h-3.5"></i>
          </button>
        </div>

        <!-- Chat Stream -->
        <div id="mobile-chat-stream" class="p-4 space-y-3 overflow-y-auto flex-1 pb-16">
          <div class="text-center">
            <span class="text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
              Ayer
            </span>
          </div>

          ${this.chatMessages.map(msg => {
            const isSelf = msg.senderRole === this.currentUser.role;
            return `
              <div class="flex flex-col ${isSelf ? 'items-end' : 'items-start'}">
                <span class="text-[10px] font-bold text-slate-400 mb-0.5 px-1">${msg.senderName} • ${msg.time}</span>
                <div class="max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed shadow-xs ${
                  isSelf 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                }">
                  ${msg.text}
                </div>
                ${msg.readStatus ? `
                  <span class="text-[9px] text-emerald-600 font-semibold mt-0.5 px-1 flex items-center gap-0.5">
                    <i data-lucide="check-check" class="w-3 h-3"></i>
                    <span>${msg.readStatus}</span>
                  </span>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>

        <!-- Input Bar (Fixed at Bottom above Nav) -->
        <div class="fixed bottom-14 inset-x-0 bg-white border-t border-slate-200 p-2.5 z-30 max-w-[412px] mx-auto">
          <form onsubmit="mobileApp.sendMessage(event)" class="flex items-center gap-2">
            <button 
              type="button" 
              onclick="alert('Selecciona un certificado médico o foto de justificativo para adjuntar.')" 
              class="p-2.5 rounded-xl hover:bg-slate-100 text-slate-500 border border-slate-200 flex-shrink-0"
              title="Adjuntar justificativo o certificado"
            >
              <i data-lucide="paperclip" class="w-4 h-4"></i>
            </button>

            <input 
              type="text" 
              id="mobile-chat-input"
              placeholder="Escribe un mensaje..."
              class="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >

            <button 
              type="submit" 
              class="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow flex-shrink-0"
            >
              <i data-lucide="send" class="w-4 h-4"></i>
            </button>
          </form>
        </div>

      </div>
    `;
  },

  // -------------------------------------------------------------
  // VISTA MÓVIL 2: REPORTERÍA (ADAPTADA SEGÚN ROL)
  // -------------------------------------------------------------
  renderReporteriaView() {
    const isTeacher = this.currentUser.role === 'profesora';

    if (isTeacher) {
      // Reportería Móvil para la Profesora: Estado del Curso 1° Básico B
      return `
        <div class="p-4 space-y-4 animate-fadeIn">
          
          <!-- Banner Docente -->
          <div class="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-4 text-white shadow-md">
            <div class="flex items-center justify-between mb-1">
              <span class="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md">
                1° Básico B
              </span>
              <span class="text-xs font-bold text-emerald-200">28 Alumnos</span>
            </div>
            <h2 class="text-lg font-black">Rendimiento del Curso</h2>
            <p class="text-xs text-white/90 mt-1">
              Promedio general del curso: <strong>6.4</strong>. El 90% de los niños ha completado las actividades de voz al día.
            </p>
          </div>

          <!-- 2 Materias Troncales: Semáforo del Curso -->
          <div class="space-y-3">
            <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Materias Troncales Activas</h3>
            
            <!-- Matemáticas -->
            <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span class="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Excelente
                </span>
                <h4 class="font-black text-slate-900 text-sm mt-1">Matemáticas</h4>
                <p class="text-[11px] text-slate-500">Sumas y conteo lúdico hasta el 10</p>
              </div>
              <div class="text-right">
                <span class="text-2xl font-black text-emerald-600">6.6</span>
                <span class="block text-[10px] text-slate-400">Promedio curso</span>
              </div>
            </div>

            <!-- Lenguaje y Comunicación -->
            <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span class="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Muy Bien
                </span>
                <h4 class="font-black text-slate-900 text-sm mt-1">Lenguaje y Comunicación</h4>
                <p class="text-[11px] text-slate-500">Vocales, fonética y primeras sílabas</p>
              </div>
              <div class="text-right">
                <span class="text-2xl font-black text-emerald-600">6.2</span>
                <span class="block text-[10px] text-slate-400">Promedio curso</span>
              </div>
            </div>
          </div>

          <!-- Métricas Rápidas -->
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-white p-3.5 rounded-2xl border border-slate-200">
              <span class="text-[10px] font-bold text-slate-400 uppercase">Tiempo Promedio</span>
              <span class="block text-xl font-black text-slate-900 mt-1">14 min</span>
              <span class="text-[10px] text-emerald-600 font-semibold">Ritmo ideal 1° básico</span>
            </div>

            <div class="bg-white p-3.5 rounded-2xl border border-slate-200">
              <span class="text-[10px] font-bold text-slate-400 uppercase">Tasa de Aciertos</span>
              <span class="block text-xl font-black text-emerald-600 mt-1">82%</span>
              <span class="text-[10px] text-slate-500">Con apoyo de voz IA</span>
            </div>
          </div>

          <!-- Nota Informativa -->
          <div class="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
            <i data-lucide="info" class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5"></i>
            <span>Para descargar planillas Mineduc o configurar fechas de entrega, utiliza la <strong>versión de escritorio</strong>.</span>
          </div>

        </div>
      `;
    }

    // Reportería Móvil para la Apoderada (Multi-estudiante)
    const student = mockData.getSelectedStudent ? mockData.getSelectedStudent() : mockData.currentStudent;
    const studentsList = mockData.parentStudents || [student];

    return `
      <div class="p-4 space-y-4 animate-fadeIn">
        
        <!-- Selector de Pupilo en Móvil (Para familias con más de un estudiante) -->
        <div class="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2">
          ${studentsList.map(s => {
            const isSelected = s.id === student.id;
            return `
              <button 
                type="button"
                onclick="mobileApp.switchStudent('${s.id}')"
                class="flex-1 py-1.5 px-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
                  isSelected 
                    ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-600' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }"
              >
                <img 
                  src="${s.avatar}" 
                  alt="${s.shortName}" 
                  onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=' + encodeURIComponent('${s.shortName}') + '&background=2563eb&color=fff&bold=true&size=150';"
                  class="w-5 h-5 rounded-full object-cover"
                >
                <span>${s.shortName}</span>
                <span class="text-[9px] opacity-85">(${s.course})</span>
              </button>
            `;
          }).join('')}
        </div>

        <!-- Diagnóstico en Lenguaje Natural -->
        <div class="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-5 text-white shadow-md">
          <div class="flex items-center justify-between mb-1">
            <span class="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md">
              Informe Escolar
            </span>
            <span class="text-xs font-bold text-emerald-200">${student.course}</span>
          </div>
          <h2 class="text-lg font-black leading-tight">${student.shortName} va muy bien este semestre</h2>
          <p class="text-xs text-white/90 mt-1 leading-relaxed">
            Tiene un <strong>promedio general de ${student.overallGrade}</strong> (se aprueba con 4.0). ${student.diagnosisText}
          </p>

          <!-- Sello de Nota Promedio -->
          <div class="mt-3.5 bg-white text-slate-900 rounded-2xl p-3 flex items-center justify-between">
            <div>
              <span class="text-[10px] font-bold text-slate-400 uppercase">Nota Promedio</span>
              <span class="text-2xl font-black text-emerald-600 block">${student.overallGrade}</span>
            </div>
            <span class="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
              Escala 1 al 7 (Destacado)
            </span>
          </div>
        </div>

        <!-- Semáforo de Materias Troncales (Solo Lenguaje y Matemáticas) -->
        <div class="space-y-3">
          <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Notas por Asignatura</h3>

          <!-- Materia 1: Matemáticas -->
          <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span class="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>${student.mathStatus}
              </span>
              <h4 class="font-black text-slate-900 text-sm mt-1">Matemáticas</h4>
              <p class="text-[11px] text-slate-500">${student.mathDesc}</p>
              <span class="text-[10px] text-slate-400 block mt-0.5">${student.mathTasks}</span>
            </div>
            <div class="text-right">
              <span class="text-2xl font-black text-emerald-600">${student.mathGrade}</span>
              <span class="block text-[10px] text-slate-400">Nota final</span>
            </div>
          </div>

          <!-- Materia 2: Lenguaje y Comunicación -->
          <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span class="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>${student.languageStatus}
              </span>
              <h4 class="font-black text-slate-900 text-sm mt-1">Lenguaje y Comunicación</h4>
              <p class="text-[11px] text-slate-500">${student.languageDesc}</p>
              <span class="text-[10px] text-slate-400 block mt-0.5">${student.languageTasks}</span>
            </div>
            <div class="text-right">
              <span class="text-2xl font-black text-emerald-600">${student.languageGrade}</span>
              <span class="block text-[10px] text-slate-400">Nota final</span>
            </div>
          </div>
        </div>

        <!-- Consejo Pedagógico para el Hogar -->
        <div class="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 text-xs text-blue-950 space-y-1">
          <div class="flex items-center gap-1.5 font-bold text-blue-900">
            <i data-lucide="help-circle" class="w-4 h-4 text-blue-600"></i>
            <span>¿Cómo apoyar a ${student.shortName} hoy?</span>
          </div>
          <p class="text-[11px] text-slate-600 leading-relaxed">
            ${student.guidanceText}
          </p>
        </div>

      </div>
    `;
  },

  // -------------------------------------------------------------
  // VISTA MÓVIL 3: ALERTAS (ACCESIBLE EXCLUSIVAMENTE PARA APODERADO)
  // -------------------------------------------------------------
  renderAlertasView() {
    // Si por alguna razón la profesora llega aquí, bloqueo pedagógico estricto
    if (this.currentUser.role === 'profesora') {
      return `
        <div class="p-6 text-center space-y-3 animate-fadeIn">
          <div class="w-12 h-12 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center mx-auto">
            <i data-lucide="shield-alert" class="w-6 h-6"></i>
          </div>
          <h3 class="font-bold text-slate-900 text-sm">Módulo no disponible en versión móvil docente</h3>
          <p class="text-xs text-slate-500 max-w-xs mx-auto">
            La emisión y gestión de alertas oficiales al curso debe realizarse desde la plataforma de escritorio.
          </p>
          <button onclick="mobileApp.setTab('mensajeria')" class="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold">
            Volver a Mensajería
          </button>
        </div>
      `;
    }

    // Alertas escolares para el Apoderado
    return `
      <div class="p-4 space-y-3.5 animate-fadeIn">
        
        <div class="flex items-center justify-between pb-2 border-b border-slate-200">
          <div>
            <h2 class="text-sm font-bold text-slate-900">Alertas y Comunicados</h2>
            <p class="text-[11px] text-slate-500">Avisos oficiales del Colegio San Andrés</p>
          </div>
          <span class="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
            1° Básico B
          </span>
        </div>

        ${mockData.alertsList.map(alt => {
          const isConfirmed = this.confirmedAlerts[alt.id];

          return `
            <div class="bg-white rounded-2xl p-4 border ${
              alt.type === 'Urgente' ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
            } shadow-xs space-y-2.5">
              
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  alt.type === 'Urgente' ? 'bg-red-100 text-red-800' :
                  alt.type === 'Académica' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                }">
                  ${alt.type}
                </span>
                <span class="text-[10px] text-slate-400 font-medium">${alt.date}</span>
              </div>

              <div>
                <h4 class="font-bold text-xs text-slate-900 leading-snug">${alt.title}</h4>
                <p class="text-[11px] text-slate-600 mt-1 leading-relaxed">${alt.description}</p>
              </div>

              <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                <span class="text-slate-400">Emisor: <strong>${alt.sender}</strong></span>

                ${isConfirmed ? `
                  <span class="text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg">
                    <i data-lucide="check" class="w-3 h-3"></i>
                    <span>Lectura Confirmada</span>
                  </span>
                ` : `
                  <button 
                    onclick="mobileApp.confirmAlert('${alt.id}')"
                    class="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition flex items-center gap-1 active:scale-95"
                  >
                    <i data-lucide="check" class="w-3 h-3"></i>
                    <span>Confirmar Lectura</span>
                  </button>
                `}
              </div>

            </div>
          `;
        }).join('')}

      </div>
    `;
  }
};

// Iniciar app móvil al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  mobileApp.init();
});
