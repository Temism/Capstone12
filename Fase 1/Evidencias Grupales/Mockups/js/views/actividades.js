// View 3: Actividades Alumno (1° y 2° Básico de Educación Chilena)
// Diseñado para niños de 6 a 7 años en etapa de lectoescritura inicial:
// Las actividades cuentan por defecto con un Agente de Voz IA que formula las preguntas en voz alta.
const actividadesView = {
  activeFilter: 'todas',

  render() {
    const student = mockData.currentStudent;
    let activities = mockData.studentActivities;

    if (this.activeFilter === 'pendientes') {
      activities = activities.filter(a => a.status === 'Pendiente');
    } else if (this.activeFilter === 'en_progreso') {
      activities = activities.filter(a => a.status === 'En progreso');
    } else if (this.activeFilter === 'entregadas') {
      activities = activities.filter(a => a.status === 'Entregada');
    }

    return `
      <div class="space-y-6 animate-fadeIn pb-12">
        <!-- Student Header with Welcome Banner for 1° Básico -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center space-x-4">
            <div class="relative">
              <img src="${student.avatar}" alt="${student.name}" class="w-16 h-16 rounded-2xl object-cover ring-4 ring-amber-400/30 shadow-md">
              <span class="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-400 text-slate-900 border-2 border-white rounded-full flex items-center justify-center text-xs font-black">
                🌟
              </span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900">Portal del Estudiante</span>
                <span class="text-xs text-slate-400">•</span>
                <span class="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">${student.course} (6-7 años)</span>
              </div>
              <h1 class="text-xl sm:text-2xl font-black text-slate-900 mt-1">¡Hola ${student.name}! 🚀</h1>
              <p class="text-xs text-slate-500 font-medium">Tus actividades vienen con <strong>Robot Leo</strong> que te leerá las preguntas en voz alta.</p>
            </div>
          </div>

          <!-- Estrellas y Medallas Ganadas (Gamificación 1° Básico) -->
          <div class="flex items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 p-2.5 rounded-2xl border border-amber-200">
            <div class="w-10 h-10 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center font-black text-xl shadow-sm">
              ⭐
            </div>
            <div>
              <span class="text-[10px] uppercase font-black text-amber-800 tracking-wider block">Estrellitas Ganadas</span>
              <span class="text-base font-black text-slate-900">18 Estrellas</span>
            </div>
          </div>
        </div>

        <!-- HERO BANNER: Centro Lúdico de Robot Leo (Accesible, Visual y con Audio para Niños) -->
        <div class="relative overflow-hidden rounded-3xl p-6 sm:p-7 theme-header text-white shadow-xl border border-white/10">
          <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div class="space-y-3 max-w-xl">
              <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black text-amber-300">
                <span>🌟 MISIÓN DE HOY CON ROBOT LEO</span>
              </div>
              <h2 class="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight flex items-center gap-2">
                <span>¡Vamos a jugar juntos!</span>
                <span class="animate-bounce">🚀</span>
              </h2>
              <p class="text-sm text-white/90 leading-relaxed font-medium">
                Escucha la aventura de las frutas en el bosque, responde con tu voz y gana estrellitas doradas.
              </p>
              
              <!-- Botón Auditivo: Si el niño no sabe leer, la IA le habla de inmediato -->
              <div class="pt-1">
                <button 
                  onclick="alert('🔊 Audio de Robot Leo: ¡Hola Mateo! Toca el botón amarillo grande para jugar conmigo a las sumas en el bosque de frutas. ¡Vamos, tú puedes ganar 5 estrellas hoy!')"
                  class="px-4 py-2 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-amber-300 border border-white/30 text-xs sm:text-sm font-black transition flex items-center gap-2 active:scale-95 shadow-sm"
                >
                  <i data-lucide="volume-2" class="w-4 h-4 text-amber-300 animate-pulse"></i>
                  <span>🔊 Toca aquí para que Robot Leo te hable</span>
                </button>
              </div>
            </div>

            <!-- Botón Gigante Lúdico e Inconfundible para el Niño -->
            <div class="flex flex-col items-start lg:items-end justify-center">
              <button 
                onclick="app.openVoiceModal('El Bosque de los Números: Sumas con Frutas hasta el 10')"
                class="ai-pulse-button px-7 py-4 rounded-3xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-base shadow-2xl transition-all flex items-center gap-4 group transform hover:scale-105 border-4 border-white"
              >
                <div class="w-14 h-14 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center font-black text-3xl group-hover:rotate-12 transition-transform shadow-inner">
                  🤖
                </div>
                <div class="text-left">
                  <span class="block text-[11px] uppercase tracking-wider font-extrabold text-slate-800">1° Misión</span>
                  <span class="block font-black text-lg text-slate-950">¡Comenzar a Jugar!</span>
                </div>
              </button>
              <span class="text-xs text-amber-300 font-bold mt-2 flex items-center gap-1">
                <span>⭐</span> Gana hasta 5 estrellas hoy
              </span>
            </div>
          </div>

          <!-- Decorative background circles -->
          <div class="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/10 pointer-events-none blur-2xl"></div>
          <div class="absolute right-48 -top-12 w-48 h-48 rounded-full bg-amber-400/20 pointer-events-none blur-xl"></div>
        </div>

        <!-- Filter Bar -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div class="flex items-center gap-2 overflow-x-auto">
            <button 
              onclick="actividadesView.setFilter('todas')" 
              class="px-4 py-2 rounded-xl text-xs font-black transition ${this.activeFilter === 'todas' ? 'theme-primary-bg text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100'}"
            >
              Todas mis tareas (4)
            </button>
            <button 
              onclick="actividadesView.setFilter('pendientes')" 
              class="px-4 py-2 rounded-xl text-xs font-black transition ${this.activeFilter === 'pendientes' ? 'theme-primary-bg text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100'}"
            >
              Por hacer (2)
            </button>
            <button 
              onclick="actividadesView.setFilter('en_progreso')" 
              class="px-4 py-2 rounded-xl text-xs font-black transition ${this.activeFilter === 'en_progreso' ? 'theme-primary-bg text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100'}"
            >
              En curso (1)
            </button>
            <button 
              onclick="actividadesView.setFilter('entregadas')" 
              class="px-4 py-2 rounded-xl text-xs font-black transition ${this.activeFilter === 'entregadas' ? 'theme-primary-bg text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100'}"
            >
              Completadas (1)
            </button>
          </div>

          <div class="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>3 actividades tienen <strong>Voz Mágica</strong> habilitada por la profesora</span>
          </div>
        </div>

        <!-- Activities Cards Grid (Adaptado a 1° y 2° Básico) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          ${activities.map(act => `
            <div class="bg-white rounded-3xl p-5 sm:p-6 border-2 ${act.urgent ? 'border-amber-400 bg-amber-50/10' : 'border-slate-200'} shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group">
              
              <!-- Card Header -->
              <div>
                <div class="flex items-center justify-between mb-3">
                  <span class="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-xl ${
                    act.subject === 'Matemáticas' ? 'bg-blue-100 text-blue-900 border border-blue-200' :
                    act.subject === 'Lenguaje y Comunicación' ? 'bg-purple-100 text-purple-900 border border-purple-200' :
                    act.subject === 'Ciencias Naturales' ? 'bg-teal-100 text-teal-900 border border-teal-200' : 'bg-orange-100 text-orange-900 border border-orange-200'
                  }">
                    ${act.subject}
                  </span>

                  <!-- Badge de Voz IA por Defecto -->
                  ${act.voiceAIDefault ? `
                    <span class="inline-flex items-center gap-1.5 bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-black px-2.5 py-1 rounded-full shadow-xs">
                      <span>🤖</span>
                      <span>Preguntas con Voz</span>
                    </span>
                  ` : `
                    <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      ${act.status}
                    </span>
                  `}
                </div>

                <h3 class="font-black text-slate-900 text-lg leading-snug group-hover:text-blue-600 transition-colors">
                  ${act.title}
                </h3>
                <p class="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                  ${act.description}
                </p>

                <!-- Activity Details -->
                <div class="flex flex-wrap items-center gap-3 mt-4 text-xs font-medium text-slate-500">
                  <span class="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg">
                    <i data-lucide="help-circle" class="w-3.5 h-3.5 text-slate-400"></i> ${act.questionsCount} preguntas
                  </span>
                  <span class="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg">
                    <i data-lucide="clock" class="w-3.5 h-3.5 text-slate-400"></i> ~${act.estimatedTime}
                  </span>
                  <span class="flex items-center gap-1 ${act.urgent ? 'text-amber-700 font-black bg-amber-100 px-2.5 py-1 rounded-lg' : 'text-slate-500'}">
                    <i data-lucide="calendar" class="w-3.5 h-3.5"></i> Vence: ${act.dueDate}
                  </span>
                </div>

                <!-- CALLOUT DESTACADO: Personaje de Voz que hace las preguntas -->
                ${act.voiceAIDefault ? `
                  <div class="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex items-center justify-between gap-3">
                    <div class="flex items-center gap-2.5">
                      <div class="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm flex-shrink-0">
                        <i data-lucide="volume-2" class="w-5 h-5"></i>
                      </div>
                      <div>
                        <span class="text-xs font-black text-blue-950 block">
                          Tutor Asignado: ${act.voiceCharacter}
                        </span>
                        <span class="text-[11px] text-blue-700 font-medium">
                          ${act.voiceAIPrompt}
                        </span>
                      </div>
                    </div>
                  </div>
                ` : ''}

                <!-- Score if finished -->
                ${act.score ? `
                  <div class="mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                    <span class="font-bold text-emerald-900">Nota obtenida:</span>
                    <span class="font-black text-emerald-700 text-base">${act.score} (¡Felicitaciones!)</span>
                  </div>
                ` : ''}
              </div>

              <!-- Card Action Button -->
              <div class="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span class="text-[11px] font-bold text-slate-400">${act.difficulty}</span>
                <button 
                  onclick="app.openVoiceModal('${act.title}')"
                  class="px-5 py-2.5 rounded-2xl text-xs font-black ${
                    act.status === 'Entregada' ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' :
                    'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md'
                  } transition flex items-center gap-2 active:scale-95"
                >
                  <i data-lucide="volume-2" class="w-4 h-4"></i>
                  <span>${act.status === 'Entregada' ? 'Revisar' : '▶️ Jugar con Voz'}</span>
                  <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                </button>
              </div>

            </div>
          `).join('')}
        </div>

      </div>
    `;
  },

  setFilter(filter) {
    this.activeFilter = filter;
    app.renderCurrentView();
  }
};
