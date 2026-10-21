// Layout Architecture Engine: 3 Distinct Design Paradigms
// 1. "topbar"   : Barra Superior Clásica Horizontal
// 2. "sidebar"  : Dashboard SaaS Moderno con Barra Lateral Izquierda (Google Classroom / Slack / Notion)
// 3. "bento"    : Portal Lúdico Minimalista con Dock Flotante Inferior (Apple / Duolingo / Bento Grid)

const layouts = {
  // Selector global de layouts para comparar en tiempo real
  renderLayoutSwitcher(currentLayout) {
    const layoutOptions = [
      { id: 'topbar', name: '1. Barra Clásica', icon: 'layout' },
      { id: 'sidebar', name: '2. Sidebar Dashboard', icon: 'sidebar', badge: 'Recomendado' },
      { id: 'bento', name: '3. Bento + Dock', icon: 'grid', badge: 'Lúdico' }
    ];

    return `
      <div class="flex items-center gap-1 bg-black/30 p-1 rounded-xl backdrop-blur-md border border-white/20 text-xs">
        <span class="text-white/75 font-bold px-2 hidden sm:inline flex items-center gap-1">
          <i data-lucide="layers" class="w-3.5 h-3.5 text-amber-300"></i> Diseño:
        </span>
        ${layoutOptions.map(l => `
          <button 
            onclick="app.setLayout('${l.id}')"
            class="px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              currentLayout === l.id 
                ? 'bg-amber-400 text-slate-950 shadow-md scale-[1.02]' 
                : 'text-white/80 hover:bg-white/15 hover:text-white'
            }"
            title="Cambiar a ${l.name}"
          >
            <i data-lucide="${l.icon}" class="w-3.5 h-3.5"></i>
            <span>${l.name}</span>
            ${l.badge ? `<span class="text-[9px] px-1 py-0.2 rounded font-black ${currentLayout === l.id ? 'bg-black/20 text-slate-900' : 'bg-white/20 text-white'}">${l.badge}</span>` : ''}
          </button>
        `).join('')}
      </div>
    `;
  },

  // -------------------------------------------------------------
  // LAYOUT 1: Barra Superior Clásica Horizontal
  // -------------------------------------------------------------
  renderTopbar(currentView, currentTheme, currentLayout, viewHtml) {
    return `
      <div class="min-h-screen flex flex-col">
        <!-- Top Navigation Bar -->
        ${components.renderTopNav(currentView, currentTheme, currentLayout)}

        <!-- Main Content Centered -->
        <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          ${viewHtml}
        </main>
      </div>
    `;
  },

  // -------------------------------------------------------------
  // LAYOUT 2: Dashboard SaaS Moderno con Barra Lateral (Sidebar)
  // Reorganiza completamente la navegación a la izquierda, da más aire al contenido,
  // incluye breadcrumbs, agrupaciones por rol y widget de acceso al Tutor de Voz en el sidebar.
  // -------------------------------------------------------------
  renderSidebar(currentView, currentTheme, currentLayout, viewHtml) {
    const student = mockData.currentStudent;
    const teacher = mockData.teacherUser;

    const navGroups = [
      {
        groupName: "ESTUDIANTE (1° Y 2° BÁSICO)",
        items: [
          { id: "actividades", name: "Actividades con Voz IA", icon: "sparkles", badge: "Robot Leo 🤖", activeColor: "bg-amber-400 text-slate-950" }
        ]
      },
      {
        groupName: "FAMILIA Y APODERADOS",
        items: [
          { id: "reporteria", name: "Reportería y Semáforo", icon: "bar-chart-3", badge: null },
          { id: "mensajeria", name: "Mensajería con Colegio", icon: "message-square", badge: "1 nuevo" }
        ]
      },
      {
        groupName: "GESTIÓN DOCENTE",
        items: [
          { id: "alertas", name: "Alertas a Apoderados", icon: "bell-ring", badge: "Urgente" },
          { id: "asignar", name: "Programar Tareas", icon: "clipboard-check", badge: null }
        ]
      }
    ];

    const viewTitles = {
      reporteria: "Informe y Semáforo de Desempeño Escolar",
      alertas: "Centro de Alertas Oficiales para Familias",
      actividades: "Mis Actividades con Agente de Voz (Robot Leo)",
      asignar: "Programación y Habilitación Curricular",
      mensajeria: "Canal Oficial de Comunicación Escolar"
    };

    return `
      <div class="min-h-screen flex bg-slate-100/70 font-sans">
        
        <!-- SIDEBAR IZQUIERDA FIJA / ELEGANTE -->
        <aside class="w-72 bg-slate-900 text-white flex flex-col justify-between border-r border-slate-800 flex-shrink-0 z-30 shadow-2xl">
          
          <!-- Top Sidebar: Logo y Perfil -->
          <div>
            <!-- Branding Header -->
            <div class="p-5 border-b border-slate-800 flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg">
                  <i data-lucide="graduation-cap" class="w-6 h-6"></i>
                </div>
                <div>
                  <h1 class="font-black tracking-tight text-white text-base leading-none">EDUCONNECT</h1>
                  <span class="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Colegio San Andrés</span>
                </div>
              </div>
            </div>

            <!-- Perfil del Niño / Apoderado Activo -->
            <div class="p-4 mx-3 my-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center space-x-3">
              <div class="relative">
                <img src="${student.avatar}" alt="${student.name}" class="w-11 h-11 rounded-xl object-cover ring-2 ring-amber-400">
                <span class="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900"></span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-black text-white truncate">${student.name}</span>
                </div>
                <div class="flex items-center gap-1.5 text-[11px] text-amber-300 font-bold">
                  <span>${student.course}</span>
                  <span class="text-slate-500">•</span>
                  <span class="text-slate-400 font-medium">1° Ciclo</span>
                </div>
              </div>
            </div>

            <!-- Menú Vertical Agrupado -->
            <nav class="px-3 py-2 space-y-5">
              ${navGroups.map(grp => `
                <div>
                  <h2 class="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    ${grp.groupName}
                  </h2>
                  <div class="space-y-1">
                    ${grp.items.map(item => {
                      const isActive = currentView === item.id;
                      return `
                        <button 
                          onclick="app.setView('${item.id}')"
                          class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            isActive 
                              ? (item.activeColor || 'theme-primary-bg text-white shadow-lg') 
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }"
                        >
                          <div class="flex items-center space-x-3">
                            <i data-lucide="${item.icon}" class="w-4 h-4 ${isActive ? 'text-current' : 'text-slate-400'}"></i>
                            <span>${item.name}</span>
                          </div>
                          ${item.badge ? `
                            <span class="text-[10px] font-black px-2 py-0.5 rounded-full ${
                              isActive ? 'bg-black/20 text-current' : 'bg-slate-800 text-amber-300 border border-slate-700'
                            }">
                              ${item.badge}
                            </span>
                          ` : ''}
                        </button>
                      `;
                    }).join('')}
                  </div>
                </div>
              `).join('')}
            </nav>
          </div>

          <!-- Bottom Sidebar: Widget Robot Leo & Ayuda -->
          <div class="p-4 border-t border-slate-800 space-y-3">
            <div class="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-900/60 to-purple-900/40 border border-indigo-700/40 space-y-2">
              <div class="flex items-center space-x-2">
                <span class="text-2xl">🤖</span>
                <div>
                  <h4 class="text-xs font-black text-white">Robot Leo (Voz IA)</h4>
                  <p class="text-[10px] text-indigo-200">Preguntas habladas listas</p>
                </div>
              </div>
              <button 
                onclick="app.openVoiceModal('El Bosque de los Números: Sumas con Frutas')"
                class="w-full py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1.5 shadow"
              >
                <i data-lucide="mic" class="w-3.5 h-3.5"></i>
                <span>Hablar con Robot Leo</span>
              </button>
            </div>

            <div class="text-[10px] text-slate-400 text-center font-medium">
              EDUCONNECT v2.4 • Modo Sidebar
            </div>
          </div>

        </aside>

        <!-- ÁREA DE TRABAJO PRINCIPAL (Workspace) -->
        <div class="flex-1 flex flex-col min-w-0 overflow-y-auto">
          
          <!-- Top App Bar en el Workspace -->
          <header class="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs px-6 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            
            <!-- Breadcrumbs de navegación -->
            <div class="flex items-center space-x-2 text-xs text-slate-500 font-semibold">
              <span class="text-slate-400">Colegio San Andrés</span>
              <span class="text-slate-300">/</span>
              <span class="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">${student.course}</span>
              <span class="text-slate-300">/</span>
              <span class="text-slate-900 font-bold">${viewTitles[currentView]}</span>
            </div>

            <!-- Controles: Selector de Layout y Selector de Temas -->
            <div class="flex items-center space-x-3 flex-wrap gap-y-2">
              
              <!-- Switcher de Layout -->
              <div class="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button onclick="app.setLayout('topbar')" class="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900">
                  1. Clásico
                </button>
                <button onclick="app.setLayout('sidebar')" class="px-2.5 py-1 rounded-lg text-xs font-black bg-slate-900 text-white shadow-xs">
                  2. Sidebar SaaS ★
                </button>
                <button onclick="app.setLayout('bento')" class="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900">
                  3. Bento Dock
                </button>
              </div>

              <!-- Switcher de Temas -->
              <div class="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200 text-xs">
                <span class="text-slate-400 font-bold text-[11px] hidden sm:inline">Color:</span>
                <button onclick="app.setTheme('navy')" class="w-4 h-4 rounded-full bg-blue-600 ring-2 ${currentTheme === 'navy' ? 'ring-slate-900' : 'ring-transparent'}" title="Azul Oxford"></button>
                <button onclick="app.setTheme('emerald')" class="w-4 h-4 rounded-full bg-teal-600 ring-2 ${currentTheme === 'emerald' ? 'ring-slate-900' : 'ring-transparent'}" title="Nordic Esmeralda"></button>
                <button onclick="app.setTheme('violet')" class="w-4 h-4 rounded-full bg-purple-600 ring-2 ${currentTheme === 'violet' ? 'ring-slate-900' : 'ring-transparent'}" title="Cyber Violeta"></button>
              </div>

            </div>

          </header>

          <!-- Main View Body -->
          <main class="p-6 max-w-6xl w-full mx-auto">
            ${viewHtml}
          </main>

        </div>

      </div>
    `;
  },

  // -------------------------------------------------------------
  // LAYOUT 3: Bento Grid con Dock Flotante Inferior (Estilo Apple / Duolingo)
  // Super limpio, sin barras estorbosas, perfecto para niños y familias.
  // Toda la navegación se realiza a través de una "Isla / Dock Flotante" abajo.
  // -------------------------------------------------------------
  renderBento(currentView, currentTheme, currentLayout, viewHtml) {
    const student = mockData.currentStudent;

    const dockItems = [
      { id: "actividades", name: "Tareas Voz", icon: "sparkles", emoji: "🤖", badge: "Voz IA" },
      { id: "reporteria", name: "Semáforo", icon: "bar-chart-3", emoji: "📊", badge: null },
      { id: "alertas", name: "Alertas", icon: "bell-ring", emoji: "🚨", badge: "1" },
      { id: "asignar", name: "Docencia", icon: "clipboard-check", emoji: "✏️", badge: null },
      { id: "mensajeria", name: "Mensajes", icon: "message-square", emoji: "💬", badge: null }
    ];

    return `
      <div class="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-slate-100/80 to-blue-50/30 pb-28 font-sans">
        
        <!-- BARRA SUPERIOR FLOTANTE MINIMALISTA (Header Island) -->
        <header class="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-5">
          <div class="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            <!-- Branding con Avatar y Estrellas -->
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 font-black text-xl flex items-center justify-center shadow-md border-2 border-white">
                🌟
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-black text-slate-900 text-sm sm:text-base">EDUCONNECT</span>
                  <span class="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">${student.course}</span>
                </div>
                <p class="text-[11px] text-slate-500 font-medium">Alumno: <strong>${student.name}</strong> • 18 Estrellitas</p>
              </div>
            </div>

            <!-- Selectores de Layout y Temas -->
            <div class="flex items-center space-x-2 self-end sm:self-center">
              
              <!-- Switcher de Layout -->
              <div class="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
                <button onclick="app.setLayout('topbar')" class="px-2.5 py-1 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900">
                  1. Clásico
                </button>
                <button onclick="app.setLayout('sidebar')" class="px-2.5 py-1 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900">
                  2. Sidebar
                </button>
                <button onclick="app.setLayout('bento')" class="px-2.5 py-1 rounded-xl text-xs font-black bg-amber-400 text-slate-950 shadow-sm">
                  3. Bento Dock ★
                </button>
              </div>

              <!-- Switcher de Temas -->
              <div class="flex items-center space-x-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                <button onclick="app.setTheme('navy')" class="w-3.5 h-3.5 rounded-full bg-blue-600 ring-2 ${currentTheme === 'navy' ? 'ring-slate-900' : 'ring-transparent'}"></button>
                <button onclick="app.setTheme('emerald')" class="w-3.5 h-3.5 rounded-full bg-teal-600 ring-2 ${currentTheme === 'emerald' ? 'ring-slate-900' : 'ring-transparent'}"></button>
                <button onclick="app.setTheme('violet')" class="w-3.5 h-3.5 rounded-full bg-purple-600 ring-2 ${currentTheme === 'violet' ? 'ring-slate-900' : 'ring-transparent'}"></button>
              </div>

            </div>

          </div>
        </header>

        <!-- CONTENIDO PRINCIPAL: BENTO CANVAS -->
        <main class="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6 flex-1">
          ${viewHtml}
        </main>

        <!-- DOCK FLOTANTE INFERIOR ESTILO MACOS / IPAD (Navegación Táctil Ultra-Limpia) -->
        <nav class="fixed bottom-5 inset-x-0 z-40 flex justify-center pointer-events-none px-4">
          <div class="floating-dock pointer-events-auto px-3 py-2.5 rounded-3xl border border-slate-200/80 shadow-2xl flex items-center space-x-1 sm:space-x-3">
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
                  <span class="text-xl mb-0.5">${item.emoji}</span>
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
