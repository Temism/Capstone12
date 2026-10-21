// Layout Architecture: Bento Grid Canvas con Dock Flotante Inferior
// Diseño definitivo seleccionado para la plataforma escolar
const layouts = {
  // Generación de ítems del Dock adaptados según el rol del usuario autenticado
  getDockItemsForRole(role) {
    switch (role) {
      case 'alumno':
        return [
          { id: "actividades", name: "Misiones con Voz", icon: "bot", badge: "Robot Leo" },
          { id: "reporteria", name: "Mi Semáforo", icon: "bar-chart-3", badge: null },
          { id: "mensajeria", name: "Mis Mensajes", icon: "message-square", badge: null }
        ];

      case 'apoderado':
        return [
          { id: "reporteria", name: "Informe y Semáforo", icon: "bar-chart-3", badge: "Destacado" },
          { id: "actividades", name: "Tareas", icon: "bot", badge: "Voz IA" },
          { id: "mensajeria", name: "Mensajería Docente", icon: "message-square", badge: "1 nuevo" }
        ];

      case 'profesora':
        return [
          { id: "asignar", name: "Asignar Tareas", icon: "clipboard-check", badge: null },
          { id: "alertas", name: "Alertas al Curso", icon: "bell-ring", badge: "1" },
          { id: "mensajeria", name: "Mensajería", icon: "message-square", badge: null },
          { id: "reporteria", name: "Rendimiento", icon: "bar-chart-3", badge: null }
        ];

      case 'admin':
      default:
        return [
          { id: "asignar", name: "Asignar Tareas", icon: "clipboard-check", badge: null },
          { id: "alertas", name: "Alertas Oficiales", icon: "bell-ring", badge: "1" },
          { id: "mensajeria", name: "Mensajería", icon: "message-square", badge: null },
          { id: "reporteria", name: "Reportería General", icon: "bar-chart-3", badge: null },
          { id: "actividades", name: "Módulos de Voz", icon: "bot", badge: null }
        ];
    }
  },

  // Renderizador principal del Layout Bento Dock
  renderBento(currentUser, currentView, currentTheme, viewHtml) {
    const dockItems = this.getDockItemsForRole(currentUser ? currentUser.role : 'apoderado');

    return `
      <div class="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-slate-100/80 to-blue-50/30 pb-28 font-sans">
        
        <!-- BARRA SUPERIOR FLOTANTE MINIMALISTA (Header Island) -->
        <header class="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-5">
          <div class="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            <!-- Branding, Avatar y Rol Activo -->
            <div class="flex items-center space-x-3">
              <div class="relative">
                <img 
                  src="${currentUser.avatar}" 
                  alt="${currentUser.name}" 
                  onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=' + encodeURIComponent('${currentUser.name}') + '&background=2563eb&color=fff&bold=true&size=150';"
                  class="w-11 h-11 rounded-2xl object-cover ring-2 ring-amber-400 shadow-md"
                >
                <span class="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white"></span>
              </div>

              <div>
                <div class="flex items-center gap-2">
                  <span class="font-black text-slate-900 text-sm sm:text-base">${currentUser.name}</span>
                  <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    currentUser.role === 'admin' ? 'bg-purple-100 text-purple-900' :
                    currentUser.role === 'profesora' ? 'bg-emerald-100 text-emerald-900' :
                    currentUser.role === 'alumno' ? 'bg-amber-100 text-amber-950' : 'bg-blue-100 text-blue-900'
                  }">
                    ${currentUser.roleLabel}
                  </span>
                </div>
                <p class="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                  <span>${currentUser.course}</span>
                  <span class="text-slate-300">•</span>
                  <span>Materias activas: <strong>Lenguaje y Matemáticas</strong></span>
                </p>
              </div>
            </div>

            <!-- Controles: Enlace a Móvil y Cerrar Sesión -->
            <div class="flex items-center space-x-2.5 self-end sm:self-center">
              <div id="api-status-badge" class="hidden"></div>

              <!-- Enlace a Versión Móvil -->
              <a 
                href="mobile.html"
                class="px-3 py-2 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all shadow-xs flex items-center gap-1.5"
                title="Probar Versión Móvil (Ctrl+Shift+C)"
              >
                <i data-lucide="smartphone" class="w-3.5 h-3.5"></i>
                <span class="hidden sm:inline">Versión Móvil</span>
              </a>

              <!-- Botón Salir / Cambiar de Rol -->
              <button 
                onclick="app.logout()"
                class="px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 text-xs font-bold transition-all border border-slate-200 flex items-center gap-1.5 active:scale-95"
                title="Cerrar Sesión y volver al Login"
              >
                <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
                <span class="hidden sm:inline">Cambiar Rol</span>
              </button>

            </div>

          </div>
        </header>

        <!-- CONTENIDO PRINCIPAL: BENTO CANVAS -->
        <main class="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6 flex-1">
          ${viewHtml}
        </main>

        <!-- DOCK FLOTANTE INFERIOR (Navegación Táctil Ultra-Limpia) -->
        <nav class="fixed bottom-5 inset-x-0 z-40 flex justify-center pointer-events-none px-4">
          <div class="floating-dock pointer-events-auto px-3 py-2.5 rounded-3xl border border-slate-200/90 shadow-2xl flex items-center space-x-1 sm:space-x-2.5">
            ${dockItems.map(item => {
              const isActive = currentView === item.id;
              return `
                <button 
                  onclick="app.setView('${item.id}')"
                  class="dock-item relative flex flex-col items-center px-3 sm:px-4 py-2 rounded-2xl transition-all ${
                    isActive 
                      ? 'theme-primary-bg text-white shadow-lg scale-105' 
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }"
                  title="${item.name}"
                >
                  <i data-lucide="${item.icon}" class="w-5 h-5 mb-1 ${isActive ? 'text-white' : 'text-slate-600'}"></i>
                  <span class="text-[11px] font-black tracking-tight whitespace-nowrap">${item.name}</span>

                  ${item.badge ? `
                    <span class="absolute -top-1 -right-1 bg-amber-400 text-slate-950 font-black text-[9px] px-1.5 py-0.2 rounded-full border border-white shadow-sm">
                      ${item.badge}
                    </span>
                  ` : ''}
                </button>
              `;
            }).join('')}
          </div>
        </nav>

      </div>
    `;
  }
};
