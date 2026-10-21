// View: Login (Autenticación Exclusiva por API REST y MySQL)
const loginView = {
  errorMessage: '',

  render() {
    return `
      <div class="min-h-screen flex flex-col justify-center items-center py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 via-slate-100/90 to-blue-50/40">
        
        <div class="max-w-md w-full space-y-6 animate-fadeIn">
          
          <!-- School & Platform Branding -->
          <div class="text-center space-y-2">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-amber-400 text-slate-950 shadow-lg border-2 border-white mb-2">
              <i data-lucide="graduation-cap" class="w-9 h-9"></i>
            </div>
            <h1 class="text-3xl font-black tracking-tight text-slate-900">EDUCONNECT</h1>
            <p class="text-xs font-bold uppercase tracking-widest text-slate-500">Colegio San Andrés • Ciclo Inicial 1° y 2° Básico</p>
            <p class="text-xs text-slate-600 max-w-sm mx-auto">
              Plataforma de aprendizaje asistido por voz y gestión escolar para estudiantes, familias y docentes.
            </p>
          </div>

          <!-- Main Login Box -->
          <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
            
            <div class="border-b border-slate-100 pb-3">
              <h2 class="text-lg font-bold text-slate-900">Ingreso al Sistema</h2>
              <p class="text-xs text-slate-500">Ingresa tu correo y contraseña institucional.</p>
            </div>

            <!-- Error Banner -->
            ${this.errorMessage ? `
              <div class="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2">
                <i data-lucide="alert-circle" class="w-4 h-4 text-red-500 flex-shrink-0"></i>
                <span>${this.errorMessage}</span>
              </div>
            ` : ''}

            <!-- Formulario Exclusivo de Autenticación -->
            <form onsubmit="loginView.handleSubmit(event)" class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Correo Electrónico</label>
                <div class="relative">
                  <i data-lucide="mail" class="w-4 h-4 text-slate-400 absolute left-3.5 top-3"></i>
                  <input 
                    type="email" 
                    id="login-email" 
                    required 
                    placeholder="ej. apoderado@sanandres.cl"
                    value=""
                    autocomplete="username"
                    class="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Contraseña</label>
                <div class="relative">
                  <i data-lucide="lock" class="w-4 h-4 text-slate-400 absolute left-3.5 top-3"></i>
                  <input 
                    type="password" 
                    id="login-password" 
                    required 
                    placeholder="••••••••"
                    value=""
                    autocomplete="current-password"
                    class="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                </div>
              </div>

              <div class="flex items-center justify-between text-xs text-slate-500 pt-1">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500">
                  <span>Recordar sesión</span>
                </label>
                <a href="javascript:void(0)" onclick="alert('Para recuperar tu contraseña, comunícate con secretaría o el equipo directivo del colegio.')" class="text-blue-600 font-bold hover:underline">¿Olvidaste tu contraseña?</a>
              </div>

              <button 
                type="submit" 
                class="w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
              >
                <span>Iniciar Sesión</span>
                <i data-lucide="arrow-right" class="w-4 h-4"></i>
              </button>
            </form>

          </div>

          <!-- School Security Banner & Mobile Link -->
          <div class="space-y-3">
            <div class="bg-white/80 backdrop-blur-md rounded-2xl p-3.5 border border-slate-200 text-xs text-slate-600 flex items-center justify-between gap-3 shadow-xs">
              <div class="flex items-center gap-2">
                <i data-lucide="shield-check" class="w-4 h-4 text-emerald-600 flex-shrink-0"></i>
                <span>Portal oficial Colegio San Andrés</span>
              </div>
              <span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                Acceso Seguro
              </span>
            </div>

            <!-- Botón hacia Versión Móvil -->
            <a 
              href="mobile.html"
              class="w-full py-3 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all flex items-center justify-between shadow-sm active:scale-98 group"
            >
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center">
                  <i data-lucide="smartphone" class="w-4 h-4"></i>
                </div>
                <div class="text-left">
                  <span class="block text-xs font-black">Acceder a Versión Móvil Responsive</span>
                  <span class="block text-[10px] text-slate-700 font-medium">Exclusivo Profesor y Apoderado (Mensajería, Reporte y Alertas)</span>
                </div>
              </div>
              <i data-lucide="arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform"></i>
            </a>
          </div>

        </div>

      </div>
    `;
  },

  async handleSubmit(e) {
    e.preventDefault();
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    if (!emailInput || !passwordInput) return;

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      this.errorMessage = 'Por favor ingresa tu correo y contraseña.';
      app.render();
      return;
    }

    // 1. Autenticar exclusivamente mediante la API FastAPI conectada a MySQL
    if (window.api && api.isOnline) {
      try {
        const response = await fetch(`${api.baseUrl}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        if (response.ok) {
          const apiUser = await response.json();
          if (apiUser.access_token) {
            api.token = apiUser.access_token;
            localStorage.setItem('educonnect_jwt_token', apiUser.access_token);
          }

          this.errorMessage = '';
          const rolPrincipal = (apiUser.rol_principal || 'APODERADO').toUpperCase();
          const mappedRole = rolPrincipal.includes('ADMIN') ? 'admin' :
                             rolPrincipal.includes('PROFE') ? 'profesora' :
                             rolPrincipal.includes('ALUM') ? 'alumno' : 'apoderado';

          const fullUser = {
            ...(mockData.demoUsers[mappedRole] || mockData.demoUsers['apoderado']),
            id: apiUser.id,
            name: apiUser.nombre,
            email: apiUser.email,
            role: mappedRole,
            fromLiveApi: true
          };
          app.login(fullUser);
          return;
        } else {
          const errData = await response.json().catch(() => ({}));
          this.errorMessage = errData.detail || 'Correo electrónico o contraseña incorrectos. Por favor intenta de nuevo.';
          app.render();
          return;
        }
      } catch (err) {
        console.warn("[API] Falló la comunicación con el servidor:", err);
      }
    }

    // 2. Modo Resiliente / Local
    const userFound = Object.values(mockData.demoUsers).find(
      u => u.email.toLowerCase() === email && u.password === password
    );

    if (userFound) {
      this.errorMessage = '';
      app.login(userFound);
    } else {
      this.errorMessage = 'Correo electrónico o contraseña incorrectos. Por favor intenta de nuevo.';
      app.render();
    }
  }
};
