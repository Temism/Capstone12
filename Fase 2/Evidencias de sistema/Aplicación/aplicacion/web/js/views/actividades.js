// View 3: Actividades Alumno (1° y 2° Básico de Educación Chilena)
// Diseñado para niños de 6 a 8 años en etapa de lectoescritura inicial:
// Las actividades cuentan por defecto con un Agente de Voz IA que formula las preguntas en voz alta.
// Incluye selector de estudiantes para apoderados y familias con más de un alumno.
const actividadesView = {
  activeFilter: 'todas',

  render() {
    const student = mockData.getSelectedStudent ? mockData.getSelectedStudent() : mockData.currentStudent;
    const studentsList = mockData.parentStudents || [student];
    const rawActivities = mockData.getStudentActivities ? mockData.getStudentActivities(student.id) : mockData.studentActivities;

    let activities = rawActivities;
    if (this.activeFilter === 'pendientes') {
      activities = rawActivities.filter(a => a.status === 'Pendiente');
    } else if (this.activeFilter === 'en_progreso') {
      activities = rawActivities.filter(a => a.status === 'En progreso');
    } else if (this.activeFilter === 'entregadas') {
      activities = rawActivities.filter(a => a.status === 'Entregada');
    }

    const allCount = rawActivities.length;
    const pendingCount = rawActivities.filter(a => a.status === 'Pendiente').length;
    const inProgressCount = rawActivities.filter(a => a.status === 'En progreso').length;
    const completedCount = rawActivities.filter(a => a.status === 'Entregada').length;
    const featuredTask = rawActivities[0] || { title: 'Misión con Agente de Voz IA' };

    return `
      <div class="space-y-6 animate-fadeIn pb-12">
        
        <!-- FILTRO / SELECTOR DE ESTUDIANTE (Multi-estudiante para familias) -->
        <div class="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <i data-lucide="users" class="w-4 h-4"></i>
            </div>
            <div>
              <span class="text-xs font-black text-slate-800 uppercase tracking-wider block">Seleccionar Estudiante:</span>
              <span class="text-[11px] text-slate-500">Visualizando las tareas asignadas para este alumno</span>
            </div>
          </div>

          <div class="flex items-center gap-2 w-full sm:w-auto">
            ${studentsList.map(s => {
              const isSelected = s.id === student.id;
              return `
                <button 
                  type="button"
                  onclick="actividadesView.switchStudent('${s.id}')"
                  class="flex-1 sm:flex-initial flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    isSelected 
                      ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-400 ring-offset-1 scale-[1.02]' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }"
                >
                  <img 
                    src="${s.avatar}" 
                    alt="${s.shortName}" 
                    onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=' + encodeURIComponent('${s.shortName}') + '&background=f59e0b&color=000&bold=true&size=150';"
                    class="w-6 h-6 rounded-full object-cover ring-1 ring-white/60"
                  >
                  <span>${s.shortName}</span>
                  <span class="text-[10px] font-medium opacity-85">(${s.course})</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Student Header with Welcome Banner -->
        <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center space-x-3.5">
            <div class="relative">
              <img 
                src="${student.avatar}" 
                alt="${student.name}" 
                onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=' + encodeURIComponent('${student.shortName}') + '&background=f59e0b&color=000&bold=true&size=150';"
                class="w-14 h-14 rounded-2xl object-cover ring-2 ring-amber-400 shadow-sm"
              >
              <span class="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-400 text-slate-900 border-2 border-white rounded-full flex items-center justify-center">
                <i data-lucide="award" class="w-3 h-3 text-slate-900"></i>
              </span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900">Portal del Estudiante</span>
                <span class="text-xs text-slate-300">•</span>
                <span class="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">${student.course} (${student.ageRange || '6-7 anos'})</span>
              </div>
              <h1 class="text-xl sm:text-2xl font-black text-slate-900 mt-1">¡Hola ${student.shortName}!</h1>
              <p class="text-xs text-slate-500 font-medium">Tus actividades vienen con <strong>Robot Leo</strong> que te leera las preguntas en voz alta.</p>
            </div>
          </div>

          <!-- Estrellas y Medallas Ganadas (Gamificación) -->
          <div class="flex items-center gap-3 bg-amber-50/70 p-2.5 px-3.5 rounded-2xl border border-amber-200/80">
            <div class="w-9 h-9 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center shadow-xs">
              <i data-lucide="award" class="w-4 h-4 text-slate-950"></i>
            </div>
            <div>
              <span class="text-[10px] uppercase font-black text-amber-800 tracking-wider block">Estrellitas Ganadas</span>
              <span class="text-sm font-black text-slate-900">${8 + (completedCount * 10)} Estrellas</span>
            </div>
          </div>
        </div>

        <!-- HERO BANNER: Centro Lúdico de Robot Leo (Accesible, Visual y con Audio para Niños) -->
        <div class="relative overflow-hidden rounded-3xl p-6 sm:p-7 theme-header text-white shadow-lg border border-white/10">
          <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div class="space-y-3 max-w-xl">
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black text-amber-300">
                <i data-lucide="target" class="w-3.5 h-3.5 text-amber-300"></i>
                <span>MISION DESTACADA DE HOY</span>
              </div>
              <h2 class="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight flex items-center gap-2">
                <span>¡Vamos a jugar juntos, ${student.shortName}!</span>
                <i data-lucide="sparkles" class="w-5 h-5 text-amber-300"></i>
              </h2>
              <p class="text-sm text-white/90 leading-relaxed font-medium">
                ${featuredTask.title}. Escucha la voz de la IA, responde hablando o tocando las tarjetas y gana estrellitas doradas.
              </p>
              
              <!-- Botón Auditivo: Si el niño no sabe leer, la IA le habla de inmediato -->
              <div class="pt-1">
                <button 
                  id="btn-hero-speak"
                  type="button"
                  onclick="app.speakHeroGreeting('${student.shortName}', '${student.course}')"
                  class="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-amber-300 border border-white/20 text-xs font-bold transition flex items-center gap-2 active:scale-95 cursor-pointer shadow-xs"
                  title="Escuchar saludo de Robot Leo"
                >
                  <i data-lucide="volume-2" class="w-4 h-4 text-amber-300"></i>
                  <span>Toca aqui para que Robot Leo te hable</span>
                </button>
              </div>
            </div>

            <!-- Botón Lúdico Limpio y Destacado -->
            <div class="flex flex-col items-start lg:items-end justify-center">
              <button 
                onmouseenter="app.preloadActivityOnHover('${featuredTask.id || 'act-conteo'}')"
                onclick="app.openVoiceModal('${(featuredTask.title || '').replace(/'/g, "\\'")}', '${featuredTask.id || 'act-conteo'}')"
                class="px-6 py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-950 font-black text-base shadow-lg transition-all flex items-center gap-3.5 group cursor-pointer"
              >
                <div class="w-12 h-12 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center shadow-xs">
                  <i data-lucide="bot" class="w-7 h-7 text-amber-400"></i>
                </div>
                <div class="text-left">
                  <span class="block text-[11px] uppercase tracking-wider font-extrabold text-slate-800">${featuredTask.status === 'Entregada' ? 'Mision Completada' : '1° Mision'}</span>
                  <span class="block font-black text-base text-slate-950">${featuredTask.status === 'Entregada' ? '¡Volver a Jugar!' : '¡Comenzar a Jugar!'}</span>
                </div>
                <i data-lucide="arrow-right" class="w-5 h-5 text-slate-950 group-hover:translate-x-1 transition-transform ml-1"></i>
              </button>
              <span class="text-xs text-amber-300 font-semibold mt-2 flex items-center gap-1.5">
                <i data-lucide="star" class="w-3.5 h-3.5 text-amber-300 fill-amber-300"></i>
                <span>Gana hasta 10 estrellas hoy</span>
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
              class="px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${this.activeFilter === 'todas' ? 'theme-primary-bg text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100'}"
            >
              Todas mis tareas (${allCount})
            </button>
            <button 
              onclick="actividadesView.setFilter('pendientes')" 
              class="px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${this.activeFilter === 'pendientes' ? 'theme-primary-bg text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100'}"
            >
              Por hacer (${pendingCount})
            </button>
            <button 
              onclick="actividadesView.setFilter('en_progreso')" 
              class="px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${this.activeFilter === 'en_progreso' ? 'theme-primary-bg text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100'}"
            >
              En curso (${inProgressCount})
            </button>
            <button 
              onclick="actividadesView.setFilter('entregadas')" 
              class="px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${this.activeFilter === 'entregadas' ? 'theme-primary-bg text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100'}"
            >
              Completadas (${completedCount})
            </button>
          </div>

          <div class="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Actividades con <strong>Voz Mágica</strong> habilitada por el docente</span>
          </div>
        </div>

        <!-- Activities Cards Grid (Adaptado a 1° y 2° Básico) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          ${activities.map(act => {
            const safeTitle = (act.title || '').replace(/'/g, "\\'");
            const statusBadgeClass = act.status === 'Entregada'
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
              : (act.status === 'En progreso' ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-slate-100 text-slate-700 border-slate-300');
            return `
            <div class="bg-white rounded-3xl p-5 sm:p-6 border ${act.urgent && act.status !== 'Entregada' ? 'border-amber-400/90 bg-amber-50/20 ring-1 ring-amber-300/50' : (act.status === 'Entregada' ? 'border-emerald-300/80 bg-emerald-50/10' : 'border-slate-200/90')} shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative group">
              
              <!-- Card Header -->
              <div>
                <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <span class="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-xl ${
                    act.subject === 'Matemáticas' 
                      ? 'bg-blue-100 text-blue-900 border border-blue-200' 
                      : 'bg-purple-100 text-purple-900 border border-purple-200'
                  }">
                    ${act.subject}
                  </span>

                  <div class="flex items-center gap-1.5">
                    <span class="text-[11px] font-black px-2.5 py-1 rounded-full border ${statusBadgeClass}">
                      ${act.status}
                    </span>
                    ${act.voiceAIDefault ? `
                      <span class="inline-flex items-center gap-1 bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-black px-2.5 py-1 rounded-full shadow-xs">
                        <i data-lucide="volume-2" class="w-3.5 h-3.5 text-amber-900"></i>
                        <span>Voz</span>
                      </span>
                    ` : ''}
                  </div>
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
                  <span class="flex items-center gap-1 ${act.urgent && act.status !== 'Entregada' ? 'text-amber-700 font-black bg-amber-100 px-2.5 py-1 rounded-lg' : 'text-slate-500'}">
                    <i data-lucide="calendar" class="w-3.5 h-3.5"></i> ${act.status === 'Entregada' ? 'Completada' : 'Vence: ' + act.dueDate}
                  </span>
                </div>

                <!-- CALLOUT DESTACADO: Personaje de Voz que hace las preguntas -->
                ${act.voiceAIDefault ? `
                  <div class="mt-4 p-3 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center justify-between gap-3">
                    <div class="flex items-center gap-2.5">
                      <div class="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
                        <i data-lucide="volume-2" class="w-4 h-4"></i>
                      </div>
                      <div>
                        <span class="text-xs font-black text-blue-950 block">
                          Tutor Asignado: ${act.voiceCharacter}
                        </span>
                        <span class="text-[11px] text-blue-700 font-medium">
                          ${act.voiceAIPrompt || 'Guía auditiva paso a paso'}
                        </span>
                      </div>
                    </div>
                  </div>
                ` : ''}

                <!-- Progress if in progress -->
                ${act.status === 'En progreso' ? `
                  <div class="mt-4 p-3 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-1.5 text-xs">
                    <div class="flex items-center justify-between font-bold text-blue-900">
                      <span>Avance guardado:</span>
                      <span>${act.progressPercent || 50}% completado</span>
                    </div>
                    <div class="w-full h-2 rounded-full bg-blue-100 overflow-hidden">
                      <div class="h-full bg-blue-600 rounded-full transition-all" style="width: ${act.progressPercent || 50}%"></div>
                    </div>
                  </div>
                ` : ''}

                <!-- Score if finished -->
                ${act.status === 'Entregada' ? `
                  <div class="mt-4 p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between text-xs">
                    <span class="font-bold text-emerald-900 flex items-center gap-1.5">
                      <i data-lucide="check-circle" class="w-4 h-4 text-emerald-600"></i>
                      Nota obtenida:
                    </span>
                    <span class="font-black text-emerald-700 text-base">${act.score || '7.0 / 7.0'} (Felicitaciones)</span>
                  </div>
                ` : ''}
              </div>

              <!-- Card Action Button -->
              <div class="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span class="text-[11px] font-bold text-slate-400">${act.difficulty}</span>
                <button 
                  onmouseenter="app.preloadActivityOnHover('${act.id}')"
                  onclick="app.openVoiceModal('${safeTitle}', '${act.id}')"
                  class="px-4 py-2.5 rounded-xl text-xs font-black cursor-pointer ${
                    act.status === 'Entregada' ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900' :
                    'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-sm active:scale-98'
                  } transition flex items-center gap-2"
                >
                  <i data-lucide="volume-2" class="w-3.5 h-3.5"></i>
                  <span>${act.status === 'Entregada' ? 'Revisar Actividad' : (act.status === 'En progreso' ? 'Continuar con Voz' : 'Jugar con Voz')}</span>
                  <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                </button>
              </div>

            </div>
          `}).join('')}
        </div>

      </div>
    `;
  },

  async switchStudent(studentId) {
    if (mockData.setSelectedStudent) {
      mockData.setSelectedStudent(studentId);
    }
    if (window.api && api.syncStudentDataFromDb) {
      await api.syncStudentDataFromDb(studentId);
    }
    app.renderCurrentView();
  },

  setFilter(filter) {
    this.activeFilter = filter;
    app.renderCurrentView();
  }
};

