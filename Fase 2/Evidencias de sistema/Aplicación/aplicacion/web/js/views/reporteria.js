// View 1: Reportería (Actor: Apoderado)
// Diseño inclusivo y accesible: Lenguaje natural y semáforo visual para cualquier apoderado.
// Soporta filtro multi-estudiante (ej. apoderados con más de un hijo en el establecimiento).
const reporteriaView = {
  render() {
    const student = mockData.getSelectedStudent ? mockData.getSelectedStudent() : mockData.currentStudent;
    const parent = mockData.parentUser;
    const grades = mockData.getStudentGrades ? mockData.getStudentGrades(student.id) : mockData.gradeHistory;
    const studentsList = mockData.parentStudents || [student];
    const isTeacherOrAdmin = Boolean(window.app && app.currentUser && (app.currentUser.role === 'profesora' || app.currentUser.role === 'admin'));
    const teacherName = (isTeacherOrAdmin && app.currentUser && app.currentUser.name) || (mockData.teacherUser && mockData.teacherUser.name) || 'Profesora Jefe';

    return `
      <div class="space-y-6 animate-fadeIn pb-12">
        
        <!-- FILTRO / SELECTOR DE ESTUDIANTE (Combobox escalable para cursos y familias) -->
        <div class="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold flex-shrink-0">
              <i data-lucide="users" class="w-4 h-4"></i>
            </div>
            <div>
              <label for="reporteria-student-select" class="text-xs font-black text-slate-800 uppercase tracking-wider block cursor-pointer">
                Seleccionar Estudiante:
              </label>
              <span class="text-[11px] text-slate-500">
                ${isTeacherOrAdmin ? 'Selecciona un estudiante de la nómina para revisar su rendimiento' : 'Selecciona entre tus pupilos para revisar su reporte'}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-3 w-full sm:w-auto">
            <img 
              src="${student.avatar}" 
              alt="${student.shortName}" 
              onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=' + encodeURIComponent('${student.shortName}') + '&background=2563eb&color=fff&bold=true&size=150';"
              class="w-9 h-9 rounded-xl object-cover ring-2 ring-blue-500/30 shadow-xs flex-shrink-0"
            >
            <select
              id="reporteria-student-select"
              name="student_id"
              onchange="reporteriaView.switchStudent(this.value)"
              class="w-full sm:w-72 bg-slate-50 hover:bg-slate-100/80 border border-slate-300 text-slate-900 text-xs sm:text-sm font-black rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer transition"
            >
              ${studentsList.map(s => `
                <option value="${s.id}" ${s.id === student.id ? 'selected' : ''}>
                  ${s.name || s.shortName} (${s.course})
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <!-- Header Banner -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center space-x-4">
            <img 
              src="${student.avatar}" 
              alt="${student.name}" 
              onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=' + encodeURIComponent('${student.shortName}') + '&background=2563eb&color=fff&bold=true&size=150';"
              class="w-14 h-14 rounded-2xl object-cover ring-2 ring-blue-500/20 shadow"
            >
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full ${isTeacherOrAdmin ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}">
                  ${isTeacherOrAdmin ? 'Vista Docente • Rendimiento' : 'Portal del Apoderado'}
                </span>
                <span class="text-xs text-slate-400">•</span>
                <span class="text-xs text-slate-500 font-bold">${student.course}</span>
              </div>
              <h1 class="text-xl font-bold text-slate-900 mt-0.5">${isTeacherOrAdmin ? `Rendimiento de Estudiante: ${student.name}` : `Informe de tu Pupilo: ${student.name}`}</h1>
              <p class="text-xs text-slate-500">${isTeacherOrAdmin ? `Docente: ${teacherName} | Apoderada: ${parent.name}` : `Apoderada: ${parent.name} | ${student.school}`}</p>
            </div>
          </div>

          <div class="flex items-center gap-2 self-start md:self-center">
            <span class="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-xs">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Año Escolar 2026 • Semestre 2</span>
            </span>
          </div>
        </div>

        ${this.renderSimpleMode(student, grades)}

      </div>
    `;
  },

  // -------------------------------------------------------------
  // MODO SIMPLE: Pensado para el apoderado común, fácil de entender
  // Cero tecnicismos, semáforo claro, lenguaje humano y cercano.
  // -------------------------------------------------------------
  renderSimpleMode(student, grades) {
    const rawActivities = mockData.getStudentActivities ? mockData.getStudentActivities(student.id) : (mockData.studentActivities || []);
    const pendingList = rawActivities.filter(a => a.status === 'Pendiente');
    const inProgressList = rawActivities.filter(a => a.status === 'En progreso');
    const completedList = rawActivities.filter(a => a.status === 'Entregada');

    const pendingCount = pendingList.length;
    const inProgressCount = inProgressList.length;
    const completedCount = completedList.length;
    const activePendingTask = pendingList[0] || inProgressList[0] || null;

    const mathActs = rawActivities.filter(a => (a.subject || '').toLowerCase().includes('matem'));
    const mathDone = mathActs.filter(a => a.status === 'Entregada').length;
    const langActs = rawActivities.filter(a => (a.subject || '').toLowerCase().includes('lenguaje'));
    const langDone = langActs.filter(a => a.status === 'Entregada').length;

    const mathTasksLabel = mathActs.length > 0 ? `${mathDone} de ${mathActs.length} tareas completadas` : '0 de 0 tareas asignadas';
    const langTasksLabel = langActs.length > 0 ? `${langDone} de ${langActs.length} tareas completadas` : '0 de 0 tareas asignadas';

    const pendingHeaderTitle = rawActivities.length === 0
      ? 'Sin actividades asignadas'
      : (pendingCount > 0
        ? `${pendingCount} ${pendingCount === 1 ? 'tarea pendiente' : 'tareas pendientes'}`
        : (inProgressCount > 0 ? `${inProgressCount} ${inProgressCount === 1 ? 'tarea en progreso' : 'tareas en progreso'}` : 'Todas las tareas al día'));

    return `
      <!-- DIAGNÓSTICO EN LENGUAJE NATURAL (Lo más importante en 5 segundos) -->
      <div class="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="space-y-2 max-w-2xl">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-white">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse"></span>
              <span>Semáforo General: ¡Excelente Desempeño!</span>
            </div>
            <h2 class="text-2xl font-black text-white leading-tight">
              ${student.shortName} va muy bien este semestre
            </h2>
            <p class="text-sm text-white/90 leading-relaxed">
              ${student.diagnosisText}
            </p>
          </div>

          <!-- Big Visual Score Stamp -->
          <div class="bg-white text-slate-900 rounded-2xl p-4 shadow-xl text-center min-w-[170px] border border-white/20 self-start sm:self-center">
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Puntaje Promedio</span>
            <span class="text-4xl font-black text-emerald-600 block my-0.5">${student.overallGrade} <span class="text-lg text-slate-400">/ 10</span></span>
            <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Escala del 1 al 10
            </span>
            <span class="text-[10px] text-slate-400 block mt-1">Puntaje máximo: 10 pts</span>
          </div>
        </div>
      </div>

      <!-- 3 TARJETAS VISUALES CLARAS: "¿Qué debo saber hoy?" -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <!-- Tarjeta 1: Estado de tareas de la semana -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-400 uppercase">1. Estado de Tareas</span>
              <span class="w-8 h-8 rounded-full ${pendingCount === 0 && inProgressCount === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'} flex items-center justify-center font-bold text-sm">
                <i data-lucide="${pendingCount === 0 && inProgressCount === 0 ? 'check-circle' : 'clock'}" class="w-4 h-4"></i>
              </span>
            </div>
            <h3 class="font-bold text-slate-900 text-base mt-2">${pendingHeaderTitle}</h3>
            <p class="text-xs text-slate-600 mt-1">
              ${rawActivities.length === 0
                ? 'No hay actividades asignadas en este momento (0 asignadas).'
                : (activePendingTask
                  ? `"${activePendingTask.title}" (${activePendingTask.status})`
                  : `¡Excelente! ${student.shortName} completó todas sus actividades asignadas.`)}
            </p>
            <div class="grid grid-cols-3 gap-1.5 mt-3 text-center">
              <div class="p-2 rounded-xl bg-amber-50 border border-amber-200/80">
                <span class="block text-sm font-black text-amber-900">${pendingCount}</span>
                <span class="block text-[10px] font-bold text-amber-800">Por hacer</span>
              </div>
              <div class="p-2 rounded-xl bg-blue-50 border border-blue-200/80">
                <span class="block text-sm font-black text-blue-900">${inProgressCount}</span>
                <span class="block text-[10px] font-bold text-blue-800">En curso</span>
              </div>
              <div class="p-2 rounded-xl bg-emerald-50 border border-emerald-200/80">
                <span class="block text-sm font-black text-emerald-900">${completedCount}</span>
                <span class="block text-[10px] font-bold text-emerald-800">Completadas</span>
              </div>
            </div>
          </div>

          <button onclick="app.setView('actividades')" class="mt-4 w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer">
            <span>Ver las tareas de ${student.shortName}</span>
            <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
          </button>
        </div>

        <!-- Tarjeta 2: ¿Cuánto tiempo le dedica al estudio? -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-400 uppercase">2. Ritmo de Estudio</span>
              <span class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                <i data-lucide="check-circle" class="w-4 h-4"></i>
              </span>
            </div>
            <h3 class="font-bold text-slate-900 text-base mt-2">${student.avgTimePerActivityMinutes} minutos por actividad</h3>
            <p class="text-xs text-slate-600 mt-1">
              Tiempo pedagógico ideal para niños de <strong>${student.course} (${student.ageRange})</strong> sin cansar su atención.
            </p>
            <div class="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-900 flex items-center gap-1.5">
              <i data-lucide="check" class="w-3.5 h-3.5 text-emerald-600 flex-shrink-0"></i>
              <span>Muy buena concentración con la voz guiada.</span>
            </div>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Actividades hechas este mes:</span>
            <span class="font-bold text-slate-800">${student.completedActivitiesMonth} completadas</span>
          </div>
        </div>

        <!-- Tarjeta 3: Comunicación con la profesora jefe -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-400 uppercase">3. ¿Tienes dudas?</span>
              <span class="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                <i data-lucide="message-square" class="w-4 h-4"></i>
              </span>
            </div>
            <h3 class="font-bold text-slate-900 text-base mt-2">${student.teacherName}</h3>
            <p class="text-xs text-slate-600 mt-1">
              Docente jefe a cargo para orientar sobre el proceso escolar de ${student.shortName}.
            </p>
            <div class="mt-3 p-3 rounded-xl bg-purple-50 border border-purple-100 text-xs text-purple-900 flex items-center gap-1.5">
              <i data-lucide="message-square" class="w-3.5 h-3.5 text-purple-600 flex-shrink-0"></i>
              <span>Canal de comunicación oficial activo.</span>
            </div>
          </div>

          <button onclick="app.setView('mensajeria')" class="mt-4 w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer">
            <span>Escribir al Docente</span>
            <i data-lucide="send" class="w-3.5 h-3.5"></i>
          </button>
        </div>

      </div>

      <!-- SEMÁFORO DE ASIGNATURAS: Muy fácil de leer para cualquier padre -->
      <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 class="font-bold text-slate-900 text-base">Semáforo de Puntajes por Asignatura</h3>
            <p class="text-xs text-slate-500">Verde = Excelente (9 a 10 pts) | Amarillo = En avance (7 a 8 pts) | Rojo = Requiere apoyo (1 a 6 pts)</p>
          </div>
          <span class="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            Escala de Puntajes: 1 al 10
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          <!-- Materia 1: Matemáticas -->
          <div class="p-5 rounded-3xl border border-emerald-200/90 bg-emerald-50/30 flex items-center justify-between shadow-xs">
            <div class="space-y-1.5">
              <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-md inline-flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>${student.mathStatus}
              </span>
              <h4 class="font-extrabold text-slate-900 text-base">Matemáticas</h4>
              <p class="text-xs text-slate-500">${student.mathDesc}</p>
              <div class="flex items-center gap-2 text-[11px] text-emerald-800 font-bold pt-1">
                <span>Avance: <strong>${mathTasksLabel}</strong></span>
                <span>•</span>
                <span>Escala 1 al 10 pts</span>
              </div>
            </div>
            <div class="text-right">
              <span class="text-4xl font-black text-emerald-600">${student.mathGrade}</span>
              <span class="block text-[11px] text-slate-400 font-medium">de 10 puntos</span>
            </div>
          </div>

          <!-- Materia 2: Lenguaje y Comunicación -->
          <div class="p-5 rounded-3xl border border-emerald-200/90 bg-emerald-50/30 flex items-center justify-between shadow-xs">
            <div class="space-y-1.5">
              <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-md inline-flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>${student.languageStatus}
              </span>
              <h4 class="font-extrabold text-slate-900 text-base">Lenguaje y Comunicación</h4>
              <p class="text-xs text-slate-500">${student.languageDesc}</p>
              <div class="flex items-center gap-2 text-[11px] text-emerald-800 font-bold pt-1">
                <span>Avance: <strong>${langTasksLabel}</strong></span>
                <span>•</span>
                <span>Escala 1 al 10 pts</span>
              </div>
            </div>
            <div class="text-right">
              <span class="text-4xl font-black text-emerald-600">${student.languageGrade}</span>
              <span class="block text-[11px] text-slate-400 font-medium">de 10 puntos</span>
            </div>
          </div>

        </div>

        <!-- DETALLE DE ESTADOS DE ACTIVIDADES Y PUNTAJES (Sincronizado con Base de Datos) -->
        <div class="pt-4 border-t border-slate-100 space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 class="font-bold text-slate-900 text-sm sm:text-base">Estado Detallado de Actividades y Puntajes de ${student.shortName}</h4>
              <p class="text-xs text-slate-500">Seguimiento en tiempo real del progreso, entregas y puntajes registrados (escala 1 al 10)</p>
            </div>
            <div class="flex items-center gap-2 text-xs font-bold">
              <span class="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">${completedCount} Completadas</span>
              <span class="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">${inProgressCount} En progreso</span>
              <span class="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">${pendingCount} Pendientes</span>
            </div>
          </div>

          <div class="overflow-x-auto rounded-2xl border border-slate-200">
            <table class="w-full text-left text-xs sm:text-sm text-slate-600">
              <thead class="bg-slate-50 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-200">
                <tr>
                  <th class="px-4 py-3">Actividad Escolar</th>
                  <th class="px-4 py-3">Asignatura</th>
                  <th class="px-4 py-3">Estado Actual</th>
                  <th class="px-4 py-3">Avance</th>
                  <th class="px-4 py-3">Puntaje (1 al 10)</th>
                  <th class="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white">
                ${rawActivities.length === 0 ? `
                  <tr>
                    <td colspan="6" class="px-4 py-8 text-center text-slate-500 text-xs font-medium">
                      No hay actividades asignadas en este momento (0 actividades asignadas • Puntaje obtenido: 0 / 10).
                    </td>
                  </tr>
                ` : rawActivities.map(act => {
                  const isDone = act.status === 'Entregada';
                  const isInProg = act.status === 'En progreso';
                  const progPct = isDone ? 100 : (act.progressPercent || 0);
                  const badgeStyle = isDone
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : (isInProg ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-amber-100 text-amber-900 border-amber-200');
                  const statusIcon = isDone ? 'check-circle' : (isInProg ? 'loader' : 'clock');
                  const safeTitle = (act.title || '').replace(/'/g, "\\'");
                  const isTeacherOrAdmin = Boolean(window.app && app.currentUser && (app.currentUser.role === 'profesora' || app.currentUser.role === 'admin'));
                  const rawComment = String(act.comments || '');
                  const hasMistakes = Boolean(act.teacherDiagnosis || rawComment.includes('Se equivocó en:'));
                  const mistakeDetail = act.teacherDiagnosis || (rawComment.includes('Se equivocó en:') ? rawComment.substring(rawComment.indexOf('Se equivocó en:')) : '');
                  const parentFriendlySubtitle = isDone
                    ? 'Actividad completada por voz con Robot Leo'
                    : (act.dueDate || 'Asignada por la profesora');

                  return `
                    <tr class="hover:bg-slate-50/80 transition-colors">
                      <td class="px-4 py-3.5">
                        <span class="font-bold text-slate-900 block">${act.title}</span>
                        <span class="text-[11px] text-slate-400 block">${parentFriendlySubtitle}</span>
                        ${isTeacherOrAdmin && (hasMistakes || isDone) ? `
                          <div class="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                            hasMistakes
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }">
                            <i data-lucide="${hasMistakes ? 'alert-triangle' : 'check-circle-2'}" class="w-3.5 h-3.5"></i>
                            <span><strong>Diagnóstico Docente:</strong> ${hasMistakes ? mistakeDetail : 'Sin equivocaciones detectadas en los números'}</span>
                          </div>
                        ` : ''}
                      </td>
                      <td class="px-4 py-3.5">
                        <span class="text-xs font-bold px-2.5 py-1 rounded-lg ${
                          act.subject === 'Matemáticas' ? 'bg-blue-50 text-blue-800' : 'bg-purple-50 text-purple-800'
                        }">${act.subject}</span>
                      </td>
                      <td class="px-4 py-3.5">
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${badgeStyle}">
                          <i data-lucide="${statusIcon}" class="w-3.5 h-3.5"></i>
                          <span>${act.status}</span>
                        </span>
                      </td>
                      <td class="px-4 py-3.5">
                        <div class="flex items-center gap-2">
                          <div class="w-20 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/70">
                            <div class="h-full ${isDone ? 'bg-emerald-500' : (isInProg ? 'bg-blue-500' : 'bg-amber-400')} rounded-full" style="width: ${progPct}%"></div>
                          </div>
                          <span class="text-xs font-bold text-slate-700">${progPct}%</span>
                        </div>
                      </td>
                      <td class="px-4 py-3.5">
                        ${isDone || act.score
                          ? `<span class="font-black text-emerald-700 text-sm">${act.score || '10 / 10 pts'}</span>`
                          : `<span class="text-xs font-medium text-slate-400">${isInProg ? 'En evaluación' : 'Sin puntaje'}</span>`
                        }
                      </td>
                      <td class="px-4 py-3.5 text-right">
                        <div class="inline-flex items-center justify-end gap-1.5 flex-wrap">
                          ${isTeacherOrAdmin ? `
                            <button
                              type="button"
                              onclick="reporteriaView.reiniciarPuntajeActividad('${act.id}', '${student.id}')"
                              title="Reiniciar puntaje y estado de esta actividad a Pendiente (0%)"
                              class="px-3 py-1.5 rounded-xl text-xs font-black bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-xs transition inline-flex items-center gap-1 cursor-pointer active:scale-95"
                            >
                              <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                              <span>Reiniciar Puntaje</span>
                            </button>
                          ` : ''}
                          <button
                            onclick="app.openVoiceModal('${safeTitle}', '${act.id}')"
                            class="px-3 py-1.5 rounded-xl text-xs font-bold ${
                              isDone
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-xs'
                            } transition inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <i data-lucide="volume-2" class="w-3.5 h-3.5"></i>
                            <span>${isDone ? 'Repasar' : 'Iniciar'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Tarjeta de Guía para Apoderados en el Hogar -->
        <div class="p-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
              <i data-lucide="help-circle" class="w-5 h-5"></i>
            </div>
            <div>
              <span class="font-bold text-slate-800 block">¿Cómo apoyar el aprendizaje de ${student.shortName} en casa?</span>
              <p class="text-slate-500 mt-0.5">
                ${student.guidanceText}
              </p>
            </div>
          </div>
          <button onclick="alert('Consejo pedagógico del colegio: Felicitar a ${student.shortName} por su esfuerzo y fomentar 15 minutos diarios de conversación o lectura guiada por voz.')" class="text-blue-600 font-bold hover:underline whitespace-nowrap self-end sm:self-center cursor-pointer">
            Ver recomendaciones del docente
          </button>
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

  async reiniciarPuntajeActividad(code, studentId) {
    const alumnoDbId = studentId === 'alu-103' ? 6 : 5;
    if (window.api && api.reiniciarPuntajeActividad) {
      await api.reiniciarPuntajeActividad({
        curso_id: 3,
        codigo_frontend: code,
        alumno_id: alumnoDbId
      });
    }
    if (window.api && api.syncStudentDataFromDb) {
      await api.syncStudentDataFromDb(studentId);
    }
    if (window.asignarView) {
      asignarView.hasLoadedStatus = false;
    }
    app.renderCurrentView();
  },

  initCharts() {
    const student = mockData.getSelectedStudent ? mockData.getSelectedStudent() : mockData.currentStudent;
    if (window.api && api.syncStudentDataFromDb && !this._syncing) {
      this._syncing = true;
      api.syncStudentDataFromDb(student.id).then(() => {
        this._syncing = false;
      }).catch(() => {
        this._syncing = false;
      });
    }
  }
};
