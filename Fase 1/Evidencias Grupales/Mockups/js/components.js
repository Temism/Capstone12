// Global Components: Header Switcher, Voice AI Interactive Activity Player, and Navigation
const components = {
  // Renders the top bar with Theme Switcher and View Switcher
  renderTopNav(currentView, currentTheme) {
    const views = [
      { id: "reporteria", name: "1. Reportería", role: "Apoderado", icon: "bar-chart-3" },
      { id: "alertas", name: "2. Alertas", role: "Profesora", icon: "bell-ring" },
      { id: "actividades", name: "3. Actividades (Voz IA)", role: "Alumno (1°-2° Básico)", icon: "sparkles", badge: "Niños 6-7 años" },
      { id: "asignar", name: "4. Asignar Actividades", role: "Profesora", icon: "clipboard-check" },
      { id: "mensajeria", name: "5. Mensajería", role: "Familia y Colegio", icon: "message-square" }
    ];

    const themes = [
      { id: "navy", name: "Azul Oxford", icon: "school", desc: "Institucional clásico" },
      { id: "emerald", name: "Nordic Esmeralda", icon: "leaf", desc: "Fresco & EdTech" },
      { id: "violet", name: "Cyber Índigo", icon: "zap", desc: "Lúdico & Moderno" }
    ];

    return `
      <header class="theme-header text-white sticky top-0 z-40 shadow-lg border-b border-white/10 backdrop-blur-md">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <!-- Top Row: Branding & Theme Switcher -->
          <div class="flex items-center justify-between py-2.5 border-b border-white/10 text-xs sm:text-sm">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold text-white shadow-inner">
                <i data-lucide="graduation-cap" class="w-5 h-5"></i>
              </div>
              <div>
                <span class="font-extrabold tracking-tight text-white sm:text-base">EDUCONNECT</span>
                <span class="ml-1 text-white/70 hidden md:inline">| Primer Ciclo Básico (1° y 2° Básico)</span>
              </div>
            </div>

            <!-- Top Right: Layout Switcher & Theme Picker -->
            <div class="flex items-center space-x-2 flex-wrap gap-y-1">
              
              <!-- Layout Picker (1. Clásico, 2. Sidebar, 3. Bento) -->
              <div class="flex items-center bg-black/25 p-1 rounded-xl backdrop-blur-sm border border-white/10">
                <span class="text-white/80 font-bold px-2 hidden lg:inline flex items-center gap-1">
                  <i data-lucide="layers" class="w-3.5 h-3.5 text-amber-300"></i> Diseño:
                </span>
                <button 
                  onclick="app.setLayout('topbar')" 
                  class="px-2 py-0.5 rounded-lg text-xs font-bold transition ${currentLayout === 'topbar' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-white/80 hover:bg-white/10'}"
                >
                  1. Clásico
                </button>
                <button 
                  onclick="app.setLayout('sidebar')" 
                  class="px-2 py-0.5 rounded-lg text-xs font-bold transition ${currentLayout === 'sidebar' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-white/80 hover:bg-white/10'}"
                  title="Cambiar a Sidebar Dashboard SaaS"
                >
                  2. Sidebar ★
                </button>
                <button 
                  onclick="app.setLayout('bento')" 
                  class="px-2 py-0.5 rounded-lg text-xs font-bold transition ${currentLayout === 'bento' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-white/80 hover:bg-white/10'}"
                  title="Cambiar a Bento Grid con Dock Flotante"
                >
                  3. Bento Dock
                </button>
              </div>

              <!-- Theme Picker ("Sorpréndeme") -->
              <div class="flex items-center space-x-1.5 bg-black/20 p-1 rounded-xl backdrop-blur-sm border border-white/10">
                <span class="text-white/80 font-medium px-2 hidden sm:inline flex items-center gap-1">
                  <i data-lucide="palette" class="w-3.5 h-3.5 text-amber-300"></i> Paleta:
                </span>
                ${themes.map(t => `
                  <button 
                    onclick="app.setTheme('${t.id}')"
                    class="px-2.5 py-1 rounded-lg font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                      currentTheme === t.id 
                        ? 'bg-white text-slate-900 shadow-sm' 
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }"
                    title="${t.desc}"
                  >
                    <span class="w-2 h-2 rounded-full ${
                      t.id === 'navy' ? 'bg-blue-600' : t.id === 'emerald' ? 'bg-teal-500' : 'bg-purple-600'
                    }"></span>
                    <span>${t.name}</span>
                  </button>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Bottom Row: Navigation Tabs (The 5 Views) -->
          <div class="flex items-center justify-between overflow-x-auto py-2 scrollbar-none gap-2">
            <div class="flex items-center space-x-1 sm:space-x-2">
              ${views.map(v => {
                const isActive = currentView === v.id;
                return `
                  <button 
                    onclick="app.setView('${v.id}')"
                    class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                      isActive 
                        ? 'bg-white text-slate-900 shadow-md font-semibold scale-[1.02]' 
                        : 'text-white/85 hover:bg-white/10 hover:text-white'
                    }"
                  >
                    <i data-lucide="${v.icon}" class="w-4 h-4 ${isActive ? 'text-blue-600' : 'text-white/80'}"></i>
                    <span>${v.name}</span>
                    <span class="text-[10px] px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-slate-100 text-slate-700' : 'bg-white/15 text-white/90'
                    }">
                      ${v.role}
                    </span>
                    ${v.badge ? `<span class="bg-amber-400 text-amber-950 text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider">${v.badge}</span>` : ''}
                  </button>
                `;
              }).join('')}
            </div>

            <!-- Role / Student Info Pill -->
            <div class="hidden lg:flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full text-xs text-white/90 border border-white/10">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>${mockData.currentStudent.name}</span>
              <span class="text-white/40">|</span>
              <span class="font-semibold text-amber-300">${mockData.currentStudent.course}</span>
            </div>
          </div>
        </div>
      </header>
    `;
  },

  // Floating button to trigger Voice AI at any time
  renderVoiceAIFloatingButton() {
    return `
      <div class="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        <div class="hidden md:flex flex-col items-end bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-xl border border-slate-200 text-xs transition-all">
          <span class="font-black text-slate-800 flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Robot Leo 🤖 (Voz IA)
          </span>
          <span class="text-slate-500 text-[11px]">Lee las preguntas a los niños</span>
        </div>

        <button 
          id="btn-voice-ai"
          onclick="app.openVoiceModal('El Bosque de los Números: Sumas con Frutas hasta el 10')"
          class="ai-pulse-button w-14 h-14 rounded-full theme-primary-bg text-white shadow-2xl flex items-center justify-center transition-transform duration-200 hover:scale-110 active:scale-95 group focus:outline-none focus:ring-4 focus:ring-blue-300"
          aria-label="Abrir Actividad con Agente de Voz IA"
          title="Abrir Agente de Voz que lee preguntas para 1° y 2° Básico"
        >
          <div class="relative flex items-center justify-center">
            <i data-lucide="volume-2" class="w-7 h-7 text-white group-hover:rotate-6 transition-transform"></i>
            <span class="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black text-amber-950">
              🤖
            </span>
          </div>
        </button>
      </div>
    `;
  },

  // PANTALLA INTERACTIVA DE RESOLUCIÓN DE ACTIVIDAD CON AGENTE DE VOZ IA (Para 1° y 2° Básico)
  // La IA habla en voz alta las preguntas para niños que están en etapa inicial de lectura
  renderVoiceModal(isOpen, activityTitle = "El Bosque de los Números: Sumas con Frutas hasta el 10") {
    if (!isOpen) return '';

    return `
      <div id="voice-ai-modal-backdrop" class="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 transition-all duration-300 animate-fadeIn">
        <div class="bg-white rounded-3xl shadow-2xl border-4 border-amber-300 w-full max-w-2xl overflow-hidden flex flex-col transform transition-all scale-100 max-h-[92vh]">
          
          <!-- Header Lúdico y Amigable para Niños -->
          <div class="theme-header p-4 sm:p-5 text-white flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-12 h-12 rounded-2xl bg-amber-400 text-slate-900 flex items-center justify-center font-black text-2xl shadow-lg border-2 border-white">
                🤖
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="font-extrabold text-lg leading-tight text-white">Robot Leo: Tu Amigo de Voz</h3>
                  <span class="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">1° y 2° Básico</span>
                </div>
                <p class="text-xs text-white/90 font-medium">${activityTitle}</p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <span class="hidden sm:inline-flex items-center gap-1.5 bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 text-xs px-2.5 py-1 rounded-full font-bold">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Voz Activa
              </span>
              <button 
                onclick="app.closeVoiceModal()"
                class="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
                title="Pausar y salir"
              >
                <i data-lucide="x" class="w-6 h-6"></i>
              </button>
            </div>
          </div>

          <!-- Barra de Progreso Lúdica de Preguntas -->
          <div class="bg-amber-50 px-5 py-2.5 border-b border-amber-200 flex items-center justify-between text-xs text-amber-900 font-bold">
            <div class="flex items-center gap-2">
              <span>Pregunta 1 de 5</span>
              <div class="flex items-center gap-1">
                <span class="w-3 h-3 rounded-full bg-amber-500 border border-white"></span>
                <span class="w-3 h-3 rounded-full bg-amber-200"></span>
                <span class="w-3 h-3 rounded-full bg-amber-200"></span>
                <span class="w-3 h-3 rounded-full bg-amber-200"></span>
                <span class="w-3 h-3 rounded-full bg-amber-200"></span>
              </div>
            </div>
            <span class="text-xs text-slate-500 font-normal">Nivel: Inicial (Matemáticas)</span>
          </div>

          <!-- CONTENEDOR PRINCIPAL: LA IA HACE LA PREGUNTA EN VOZ ALTA -->
          <div class="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-gradient-to-b from-white to-slate-50">
            
            <!-- Bocadillo Hablado del Robot Leo con Ondas de Sonido -->
            <div class="bg-blue-50/80 border-2 border-blue-200 rounded-3xl p-5 shadow-sm space-y-3 relative">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span class="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1">
                    <i data-lucide="volume-2" class="w-4 h-4 text-blue-600"></i> Robot Leo te está hablando:
                  </span>
                </div>

                <!-- Ondas de Audio Animadas -->
                <div class="flex items-center space-x-1.5 h-6">
                  <div class="sound-bar !h-6"></div>
                  <div class="sound-bar !h-8"></div>
                  <div class="sound-bar !h-5"></div>
                  <div class="sound-bar !h-7"></div>
                  <div class="sound-bar !h-4"></div>
                </div>
              </div>

              <!-- Texto que la IA le lee al niño con apoyo de emojis gigantes -->
              <p class="text-base sm:text-lg font-bold text-slate-800 leading-relaxed">
                "¡Hola Mateo! Escucha con atención: En un canasto hay 
                <span class="text-blue-700 font-black underline decoration-amber-400 decoration-4">3 manzanas rojas</span> 🍎🍎🍎 
                y el conejito travieso trae 
                <span class="text-emerald-700 font-black underline decoration-emerald-400 decoration-4">2 peras verdes</span> 🍐🍐. 
                ¿Cuántas frutas tenemos en total?"
              </p>

              <!-- Botón Gigante: Repetir pregunta en voz alta (Vital para niños de 6 años) -->
              <div class="pt-2 flex items-center gap-2 flex-wrap">
                <button 
                  onclick="alert('🔊 Reproduciendo audio de la pregunta: ¡Hola Mateo! En un canasto hay 3 manzanas rojas...')"
                  class="px-4 py-2.5 rounded-2xl bg-white border-2 border-blue-300 hover:border-blue-500 text-blue-800 text-xs sm:text-sm font-black shadow-sm transition flex items-center gap-2 active:scale-95"
                >
                  <i data-lucide="volume-2" class="w-5 h-5 text-blue-600 animate-bounce"></i>
                  <span>🔊 Repetir la pregunta en voz alta</span>
                </button>
                <span class="text-[11px] text-slate-500 italic">Los niños no necesitan leer si aún están aprendiendo</span>
              </div>
            </div>

            <!-- ZONA DE RESPUESTA PARA EL NIÑO: HABLAR O TOCAR -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <i data-lucide="sparkles" class="w-4 h-4 text-amber-500"></i> ¿Cómo quieres responder?
                </span>
                <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Voz o Toque
                </span>
              </div>

              <!-- OPCIÓN 1: BOTÓN DE MICRÓFONO GRANDE PARA RESPONDER CON LA VOZ -->
              <div class="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div class="flex items-center gap-3 text-center sm:text-left">
                  <div class="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shadow-md flex-shrink-0 animate-pulse">
                    <i data-lucide="mic" class="w-6 h-6"></i>
                  </div>
                  <div>
                    <h4 class="font-extrabold text-slate-900 text-sm sm:text-base">Díselo a Robot Leo con tu voz</h4>
                    <p class="text-xs text-slate-600">Presiona el botón y di: <em>"¡Son cinco frutas!"</em></p>
                  </div>
                </div>

                <button 
                  onclick="alert('🎙️ Simulando reconocimiento de voz: Mateo dice: ¡Son 5!... \n\n🤖 Robot Leo responde con voz alegre: ¡Fantástico Mateo! 3 + 2 son 5 frutas. ¡Te ganaste una estrellita dorada! ⭐')"
                  class="w-full sm:w-auto px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-black text-xs sm:text-sm shadow-lg transition flex items-center justify-center gap-2"
                >
                  <i data-lucide="mic" class="w-5 h-5"></i>
                  <span>Presionar para Hablar</span>
                </button>
              </div>

              <!-- OPCIÓN 2: TARJETAS GRANDES CON NÚMEROS E ÍCONOS (Para tocar con el dedo o clic) -->
              <div>
                <p class="text-[11px] text-slate-400 font-semibold mb-2">O toca el número correcto aquí abajo:</p>
                <div class="grid grid-cols-3 gap-3">
                  
                  <button 
                    onclick="alert('🤖 Robot Leo dice con voz cariñosa: Mmm, casi casi. Si tenemos 3 y agregamos 2 más... ¡vamos a contar de nuevo con los deditos! 3... 4... ¿cuál viene?')"
                    class="p-4 rounded-2xl border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all flex flex-col items-center justify-center gap-1 active:scale-95 group"
                  >
                    <span class="text-3xl font-black text-slate-800 group-hover:text-blue-600">4</span>
                    <span class="text-xs font-semibold text-slate-500">4 frutas 🍎</span>
                  </button>

                  <button 
                    onclick="alert('🎉 ¡EXCELENTE MATEO! \n\n🤖 Robot Leo dice con voz festiva: ¡Correcto! Son 5 frutas en total. ¡Estrellita ganada! ⭐ Pasando a la pregunta 2...')"
                    class="p-4 rounded-2xl border-2 border-emerald-400 bg-emerald-50 hover:bg-emerald-100 transition-all flex flex-col items-center justify-center gap-1 active:scale-95 shadow-sm group"
                  >
                    <span class="text-3xl font-black text-emerald-700">5</span>
                    <span class="text-xs font-bold text-emerald-800">5 frutas ⭐ (Correcta)</span>
                  </button>

                  <button 
                    onclick="alert('🤖 Robot Leo dice con voz cariñosa: ¡Uyy, nos pasamos un poquito! 6 es más de lo que tenemos. ¡Escuchemos la historia otra vez!')"
                    class="p-4 rounded-2xl border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all flex flex-col items-center justify-center gap-1 active:scale-95 group"
                  >
                    <span class="text-3xl font-black text-slate-800 group-hover:text-blue-600">6</span>
                    <span class="text-xs font-semibold text-slate-500">6 frutas 🍐</span>
                  </button>

                </div>
              </div>

            </div>

          </div>

          <!-- Footer con Botones Grandes y Claros -->
          <div class="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
            <button 
              onclick="app.closeVoiceModal()"
              class="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition"
            >
              Guardar y Salir
            </button>

            <div class="flex items-center gap-2">
              <button 
                onclick="alert('Pasando a la siguiente pregunta leída por voz por Robot Leo...')"
                class="px-5 py-2.5 rounded-xl text-xs font-black theme-primary-bg text-white shadow-md hover:opacity-95 transition flex items-center gap-2"
              >
                <span>Siguiente Pregunta</span>
                <i data-lucide="arrow-right" class="w-4 h-4"></i>
              </button>
            </div>
          </div>

        </div>
      </div>
    `;
  }
};
