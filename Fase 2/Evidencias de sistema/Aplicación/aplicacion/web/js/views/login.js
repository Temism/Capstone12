// View: Login Institucional (Autenticación Segura con Hash Criptográfico SHA-256)
const loginView = {
  errorMessage: '',

  render() {
    const safeError = (window.api && api.escapeHtml) ? api.escapeHtml(this.errorMessage) : this.errorMessage;
    return `
      <div class="min-h-screen flex flex-col justify-center items-center py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 via-slate-100/90 to-blue-50/40">
        
        <div class="max-w-md w-full space-y-6 animate-fadeIn">
          
          <!-- School & Platform Branding -->
          <div class="text-center space-y-2">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-amber-400 text-slate-950 shadow-lg border-2 border-white mb-2">
              <i data-lucide="bot" class="w-9 h-9"></i>
            </div>
            <h1 class="text-3xl font-black tracking-tight text-slate-900">EDUCONNECT</h1>
            <p class="text-xs font-bold uppercase tracking-widest text-slate-500">Colegio San Andrés • Ciclo Inicial 1° y 2° Básico</p>
          </div>

          <!-- Main Login Box -->
          <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
            
            <div class="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 class="text-lg font-bold text-slate-900">Ingreso al Sistema</h2>
                <p class="text-xs text-slate-500">Ingresa con tus credenciales institucionales.</p>
              </div>
              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <i data-lucide="shield-check" class="w-3.5 h-3.5"></i>
                Acceso Seguro
              </span>
            </div>

            <!-- Error Banner -->
            ${safeError ? `
              <div class="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2">
                <i data-lucide="alert-circle" class="w-4 h-4 text-red-500 flex-shrink-0"></i>
                <span>${safeError}</span>
              </div>
            ` : ''}

            <!-- Formulario Exclusivo de Autenticación -->
            <form onsubmit="loginView.handleSubmit(event)" class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Correo Institucional</label>
                <div class="relative">
                  <i data-lucide="mail" class="w-4 h-4 text-slate-400 absolute left-3.5 top-3"></i>
                  <input 
                    type="email" 
                    id="login-email" 
                    required 
                    placeholder="usuario@sanandres.cl"
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
                <a href="javascript:void(0)" onclick="alert('Para recuperar o restablecer tu contraseña institucional, comunícate con secretaría académica del Colegio San Andrés.')" class="text-blue-600 font-bold hover:underline">¿Olvidaste tu contraseña?</a>
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

          <p class="text-center text-[11px] text-slate-400 font-medium">
            Plataforma protegida con cifrado TLS y verificación criptográfica SHA-256
          </p>

        </div>

      </div>
    `;
  },

  async authenticateWithCredentials(email, password) {
    // 1. Autenticar contra Firebase Cloud Firestore (con hash SHA-256 y protección contra fuerza bruta)
    if (window.firebaseDb) {
      try {
        const fbRes = await firebaseDb.login(email, password);
        if (fbRes.ok && fbRes.data) {
          const apiUser = fbRes.data;
          if (apiUser.access_token && window.api) {
            api.token = apiUser.access_token;
            try {
              sessionStorage.setItem('educonnect_jwt_token', apiUser.access_token);
            } catch (e) {}
          }
          this.errorMessage = '';
          const rolPrincipal = (apiUser.rol_principal || 'APODERADO').toUpperCase();
          const mappedRole = rolPrincipal.includes('ADMIN') ? 'admin' :
                             rolPrincipal.includes('PROFE') ? 'profesora' :
                             rolPrincipal.includes('ALUM') ? 'alumno' : 'apoderado';
          const baseProfile = mockData.demoUsers[mappedRole] || mockData.demoUsers['apoderado'];
          const defaultAvatar = baseProfile.defaultAvatar || baseProfile.avatar;
          const resolvedAvatar = apiUser.avatar
            || (window.firebaseDb && firebaseDb.getCustomAvatar ? firebaseDb.getCustomAvatar(apiUser.id) : null)
            || defaultAvatar;
          const fullUser = {
            ...baseProfile,
            id: apiUser.id,
            name: apiUser.nombre,
            email: apiUser.email,
            role: mappedRole,
            avatar: resolvedAvatar,
            defaultAvatar: defaultAvatar,
            fromLiveApi: true
          };
          delete fullUser.password_hash;
          app.login(fullUser);
          return;
        } else {
          this.errorMessage = fbRes.detail || 'Credenciales incorrectas. Verifica tu correo y contraseña institucional.';
          app.render();
          return;
        }
      } catch (fbErr) {
        console.warn("[Auth] Respaldo a verificación local:", fbErr);
      }
    }

    // 2. Respaldo Criptográfico Local (compara únicamente hashes SHA-256)
    const inputHash = (window.firebaseDb && firebaseDb.hashPassword)
      ? firebaseDb.hashPassword(password)
      : '';
    const userFound = Object.values(mockData.demoUsers).find(
      u => u.email.toLowerCase() === email && u.password_hash && u.password_hash === inputHash
    );

    if (userFound) {
      this.errorMessage = '';
      const safeUser = { ...userFound };
      delete safeUser.password_hash;
      const fallbackDefault =
        safeUser.defaultAvatar ||
        safeUser.avatar ||
        (window.firebaseDb && window.firebaseDb.getDefaultAvatarForUser
          ? window.firebaseDb.getDefaultAvatarForUser(safeUser.id || safeUser.role)
          : '');
      if (fallbackDefault) {
        safeUser.defaultAvatar = fallbackDefault;
      }
      const customAvatar =
        window.firebaseDb && window.firebaseDb.getCustomAvatar
          ? window.firebaseDb.getCustomAvatar(userFound.id)
          : '';
      if (customAvatar) {
        safeUser.avatar = customAvatar;
      } else if (fallbackDefault && !safeUser.avatar) {
        safeUser.avatar = fallbackDefault;
      }
      app.login(safeUser);
    } else {
      this.errorMessage = 'Credenciales incorrectas. Verifica tu correo y contraseña institucional.';
      app.render();
    }
  },

  async handleSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    if (!emailInput || !passwordInput) return;

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      this.errorMessage = 'Por favor ingresa tu correo y contraseña institucional.';
      app.render();
      return;
    }

    await this.authenticateWithCredentials(email, password);
  }
};
