// View 1: Reportería (Actor: Apoderado)
// Adaptado con diseño inclusivo: "Modo Simple" (Lenguaje natural y semáforo visual para cualquier apoderado)
// y "Modo Analítico" (Para apoderados que desean métricas, gráficos y curvas de avance detalladas).
const reporteriaView = {
  displayMode: 'simple', // 'simple' | 'avanzado'

  render() {
    const student = mockData.currentStudent;
    const parent = mockData.parentUser;
    const grades = mockData.gradeHistory;

    return `
      <div class="space-y-6 animate-fadeIn pb-12">
        
        <!-- Header Banner & Mode Switcher -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center space-x-4">
            <img src="${student.avatar}" alt="${student.name}" class="w-14 h-14 rounded-2xl object-cover ring-2 ring-blue-500/20 shadow">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">Portal del Apoderado</span>
                <span class="text-xs text-slate-400">•</span>
                <span class="text-xs text-slate-500">${student.course}</span>
              </div>
              <h1 class="text-xl font-bold text-slate-900 mt-0.5">Informe de tu Pupilo: ${student.name}</h1>
              <p class="text-xs text-slate-500">Apoderada: ${parent.name} | ${student.school}</p>
            </div>
          </div>

          <!-- DUAL VIEW TOGGLE (Clave de accesibilidad: Simple vs Analítico) -->
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div class="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 shadow-inner">
              <button 
                onclick="reporteriaView.setMode('simple')"
                class="px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  this.displayMode === 'simple' 
                    ? 'bg-emerald-600 text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }"
              >
                <i data-lucide="smile" class="w-4 h-4"></i>
                <span>Vista Resumen Fácil</span>
                <span class="text-[9px] bg-white/20 text-white px-1.5 py-0.2 rounded-full hidden sm:inline">Para todos</span>
              </button>

              <button 
                onclick="reporteriaView.setMode('avanzado')"
                class="px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  this.displayMode === 'avanzado' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }"
              >
                <i data-lucide="bar-chart-2" class="w-4 h-4"></i>
                <span>Vista Avanzada</span>
                <span class="text-[9px] ${this.displayMode === 'avanzado' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'} px-1.5 py-0.2 rounded-full hidden sm:inline">Métricas</span>
              </button>
            </div>

            <button onclick="alert('Descargando informe resumido para imprimir en 1 página...')" class="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1" title="Descargar e Imprimir">
              <i data-lucide="printer" class="w-4 h-4"></i>
              <span class="hidden lg:inline">Imprimir</span>
            </button>
          </div>
        </div>

        ${this.displayMode === 'simple' ? this.renderSimpleMode(student, grades) : this.renderAdvancedMode(student, grades)}

      </div>
    `;
  },

  // -------------------------------------------------------------
  // MODO SIMPLE: Pensado para el apoderado común, fácil de entender
  // Cero tecnicismos, semáforo claro, lenguaje humano y cercano.
  // -------------------------------------------------------------
  renderSimpleMode(student, grades) {
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
              Mateo va muy bien este semestre 👏
            </h2>
            <p class="text-sm text-white/90 leading-relaxed">
              Tiene un <strong>promedio general de 6.4</strong> (la nota de aprobación es 4.0). 
              Gracias a que las actividades le <strong>leen las preguntas en voz alta con Robot Leo</strong>, Mateo ha completado el <strong>88% de sus tareas a tiempo</strong> y sin la frustración de tener que leer textos largos solo.
            </p>
          </div>

          <!-- Big Visual Grade Stamp -->
          <div class="bg-white text-slate-900 rounded-2xl p-4 shadow-xl text-center min-w-[170px] border border-white/20 self-start sm:self-center">
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Nota Promedio</span>
            <span class="text-4xl font-black text-emerald-600 block my-0.5">6.4</span>
            <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Escala 1 a 7 (Destacado)
            </span>
            <span class="text-[10px] text-slate-400 block mt-1">Aprueba con 4.0</span>
          </div>
        </div>
      </div>

      <!-- 3 TARJETAS VISUALES CLARAS: "¿Qué debo saber hoy?" -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <!-- Tarjeta 1: ¿Tiene tareas pendientes hoy? -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-400 uppercase">1. Tareas de esta semana</span>
              <span class="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
                <i data-lucide="clock" class="w-4 h-4"></i>
              </span>
            </div>
            <h3 class="font-bold text-slate-900 text-base mt-2">1 tarea pendiente</h3>
            <p class="text-xs text-slate-600 mt-1">
              "El Bosque de los Números" vence <strong>mañana a las 18:00</strong>.
            </p>
            <div class="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-center gap-2">
              <span class="text-lg">🤖</span>
              <span><strong>Robot Leo le leerá las sumas</strong> habladas con frutitas.</span>
            </div>
          </div>

          <button onclick="app.setView('actividades')" class="mt-4 w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1.5">
            <span>Ver las tareas de Mateo</span>
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
            <h3 class="font-bold text-slate-900 text-base mt-2">15 minutos por actividad</h3>
            <p class="text-xs text-slate-600 mt-1">
              Tiempo pedagógico ideal para niños de <strong>1° básico (6-7 años)</strong> sin cansar su atención.
            </p>
            <div class="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-900">
              ✅ Muy buena concentración con la voz guiada.
            </div>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Actividades hechas este mes:</span>
            <span class="font-bold text-slate-800">10 completadas</span>
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
            <h3 class="font-bold text-slate-900 text-base mt-2">Tía Marcela (Profesora Jefe)</h3>
            <p class="text-xs text-slate-600 mt-1">
              Disponible para orientar sobre el proceso de lectoescritura de Mateo.
            </p>
            <div class="mt-3 p-3 rounded-xl bg-purple-50 border border-purple-100 text-xs text-purple-900">
              💬 Último aviso: <em>"Mateo respondió muy contento las sumas por voz..."</em>
            </div>
          </div>

          <button onclick="app.setView('mensajeria')" class="mt-4 w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm">
            <span>Escribir a Tía Marcela</span>
            <i data-lucide="send" class="w-3.5 h-3.5"></i>
          </button>
        </div>

      </div>

      <!-- SEMÁFORO DE ASIGNATURAS: Muy fácil de leer para cualquier padre -->
      <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 class="font-bold text-slate-900 text-base">Semáforo de Notas por Asignatura</h3>
            <p class="text-xs text-slate-500">Verde = Muy bien | Amarillo = Atención | Rojo = Requiere apoyo urgente</p>
          </div>
          <span class="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            Escala chilena de 1.0 a 7.0
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          <!-- Materia 1: Inglés (7.0) -->
          <div class="p-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 flex items-center justify-between">
            <div class="space-y-1">
              <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">🟢 Excelente</span>
              <h4 class="font-extrabold text-slate-900 text-sm">Inglés</h4>
              <p class="text-xs text-slate-500">Todas las guías al día</p>
            </div>
            <div class="text-right">
              <span class="text-3xl font-black text-emerald-600">7.0</span>
              <span class="block text-[10px] text-slate-400">Nota máxima</span>
            </div>
          </div>

          <!-- Materia 2: Matemáticas (6.8) -->
          <div class="p-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 flex items-center justify-between">
            <div class="space-y-1">
              <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">🟢 Excelente</span>
              <h4 class="font-extrabold text-slate-900 text-sm">Matemáticas</h4>
              <p class="text-xs text-slate-500">Gran avance en Álgebra</p>
            </div>
            <div class="text-right">
              <span class="text-3xl font-black text-emerald-600">6.8</span>
              <span class="block text-[10px] text-slate-400">Destacado</span>
            </div>
          </div>

          <!-- Materia 3: Lenguaje (6.5) -->
          <div class="p-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 flex items-center justify-between">
            <div class="space-y-1">
              <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">🟢 Muy Bien</span>
              <h4 class="font-extrabold text-slate-900 text-sm">Lenguaje</h4>
              <p class="text-xs text-slate-500">Buena comprensión lectora</p>
            </div>
            <div class="text-right">
              <span class="text-3xl font-black text-emerald-600">6.5</span>
              <span class="block text-[10px] text-slate-400">Sobre la media</span>
            </div>
          </div>

          <!-- Materia 4: Ciencias Naturales (5.9) -->
          <div class="p-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 flex items-center justify-between">
            <div class="space-y-1">
              <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">🟢 Aprobado</span>
              <h4 class="font-extrabold text-slate-900 text-sm">Ciencias Naturales</h4>
              <p class="text-xs text-slate-500">Laboratorio pendiente</p>
            </div>
            <div class="text-right">
              <span class="text-3xl font-black text-slate-800">5.9</span>
              <span class="block text-[10px] text-slate-400">Bien</span>
            </div>
          </div>

          <!-- Materia 5: Historia (4.8 - Semáforo Amarillo) -->
          <div class="p-4 rounded-2xl border-2 border-amber-300 bg-amber-50/50 flex items-center justify-between">
            <div class="space-y-1">
              <span class="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-200 px-2 py-0.5 rounded-md">🟡 Poner Atención</span>
              <h4 class="font-extrabold text-slate-900 text-sm">Historia y Geografía</h4>
              <p class="text-xs text-amber-800 font-medium">Sugerencia: repasar antes del viernes</p>
            </div>
            <div class="text-right">
              <span class="text-3xl font-black text-amber-700">4.8</span>
              <span class="block text-[10px] text-amber-800 font-semibold">Aprueba (mínimo 4.0)</span>
            </div>
          </div>

          <!-- Tarjeta de Guía para Apoderados -->
          <div class="p-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 flex flex-col justify-between text-xs text-slate-600">
            <div>
              <span class="font-bold text-slate-800 flex items-center gap-1">
                <i data-lucide="help-circle" class="w-4 h-4 text-blue-500"></i> ¿Cómo ayudarlo en casa?
              </span>
              <p class="text-slate-500 mt-1">
                Recuérdale a Martín estudiar 20 minutos diarios y pedirle explicaciones a su Tutor de Voz IA.
              </p>
            </div>
            <button onclick="alert('Consejo pedagógico del colegio: En Historia se sugiere pedirle que explique con sus propias palabras las civilizaciones del Mediterráneo.')" class="mt-2 text-blue-600 font-bold hover:underline self-start">
              Ver sugerencias del profesor →
            </button>
          </div>

        </div>
      </div>
    `;
  },

  // -------------------------------------------------------------
  // MODO AVANZADO: Para apoderados que desean métricas y curvas analíticas
  // -------------------------------------------------------------
  renderAdvancedMode(student, grades) {
    return `
      <!-- 4 Top KPI Cards directly answering the requirements -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- KPI 1: Promedio de Nota (Escala 1 al 7) -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-400 transition-all">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Promedio General</span>
            <span class="grade-badge-excellent text-xs font-bold px-2 py-0.5 rounded-full">Destacado</span>
          </div>
          <div class="mt-3 flex items-baseline gap-2">
            <span class="text-3xl font-extrabold text-slate-900">${student.overallGrade}</span>
            <span class="text-xs text-slate-400">/ 7.0</span>
          </div>
          <p class="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <i data-lucide="trending-up" class="w-3.5 h-3.5"></i> +0.4 vs. semestre anterior
          </p>
          <div class="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div class="bg-blue-600 h-1.5 rounded-full" style="width: ${(student.overallGrade / 7) * 100}%"></div>
          </div>
        </div>

        <!-- KPI 2: Tiempo promedio por actividad -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm group hover:border-teal-400 transition-all">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Tiempo Promedio</span>
            <span class="p-1.5 rounded-lg bg-teal-50 text-teal-600"><i data-lucide="clock" class="w-4 h-4"></i></span>
          </div>
          <div class="mt-3 flex items-baseline gap-2">
            <span class="text-3xl font-extrabold text-slate-900">${student.avgTimePerActivityMinutes}</span>
            <span class="text-xs text-slate-500 font-medium">minutos / actividad</span>
          </div>
          <p class="text-xs text-slate-500 mt-1">
            Tiempo estimado esperado: <span class="font-semibold text-slate-700">30 min</span>
          </p>
          <div class="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div class="bg-teal-500 h-1.5 rounded-full" style="width: 78%"></div>
          </div>
        </div>

        <!-- KPI 3: Cantidad de correctas sobre incorrectas -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm group hover:border-emerald-400 transition-all">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Aciertos vs Errores</span>
            <span class="p-1.5 rounded-lg bg-emerald-50 text-emerald-600"><i data-lucide="check-circle-2" class="w-4 h-4"></i></span>
          </div>
          <div class="mt-3 flex items-baseline gap-2">
            <span class="text-3xl font-extrabold text-emerald-600">${student.questionsStats.correct}</span>
            <span class="text-sm text-slate-400 font-medium">correctas / ${student.questionsStats.incorrect} err.</span>
          </div>
          <p class="text-xs text-slate-500 mt-1">
            Efectividad global: <span class="font-bold text-emerald-600">83.5%</span>
          </p>
          <div class="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden flex">
            <div class="bg-emerald-500 h-1.5" style="width: 83.5%"></div>
            <div class="bg-red-400 h-1.5" style="width: 16.5%"></div>
          </div>
        </div>

        <!-- KPI 4: Avance Actual vs Esperado & Total del Curso -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm group hover:border-amber-400 transition-all">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Avance del Curso</span>
            <span class="p-1.5 rounded-lg bg-amber-50 text-amber-600"><i data-lucide="target" class="w-4 h-4"></i></span>
          </div>
          <div class="mt-3 flex items-baseline gap-2">
            <span class="text-3xl font-extrabold text-slate-900">${student.completionRate}%</span>
            <span class="text-xs text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">Al día</span>
          </div>
          <p class="text-xs text-slate-500 mt-1">
            Esperado: <span class="font-semibold text-slate-700">${student.expectedProgress}%</span> | Sem. ${student.currentWeek} de ${student.totalCourseWeeks}
          </p>
          <div class="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div class="bg-amber-500 h-1.5 rounded-full" style="width: ${student.completionRate}%"></div>
          </div>
        </div>

      </div>

      <!-- Charts Grid (Comparison & Distribution) -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Chart 1: Comparativa de Avance (Actual vs Esperado vs Total Curso) -->
        <div class="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="font-bold text-slate-900 text-base">Curva de Avance del Estudiante</h3>
              <p class="text-xs text-slate-500">Progreso real acumulado vs. ritmo planificado por el colegio</p>
            </div>
            <div class="flex items-center gap-3 text-xs">
              <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-blue-600"></span> Avance Real</span>
              <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-slate-300"></span> Esperado</span>
            </div>
          </div>

          <!-- Canvas for Chart.js -->
          <div class="h-64 w-full relative">
            <canvas id="chart-progress"></canvas>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
            <div class="p-2 rounded-xl bg-slate-50">
              <span class="text-slate-400 block">Avance Actual</span>
              <span class="font-bold text-slate-800 text-sm">84%</span>
            </div>
            <div class="p-2 rounded-xl bg-slate-50">
              <span class="text-slate-400 block">Avance Esperado</span>
              <span class="font-bold text-slate-800 text-sm">75%</span>
            </div>
            <div class="p-2 rounded-xl bg-slate-50">
              <span class="text-slate-400 block">Duración Total Curso</span>
              <span class="font-bold text-slate-800 text-sm">36 Semanas</span>
            </div>
          </div>
        </div>

        <!-- Chart 2: Desglose de Respuestas Correctas vs Incorrectas -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-bold text-slate-900 text-base">Desempeño en Preguntas</h3>
            <span class="text-xs text-slate-400">Total: 184</span>
          </div>
          
          <div class="h-52 relative flex items-center justify-center">
            <canvas id="chart-doughnut"></canvas>
          </div>

          <div class="space-y-2 mt-2 text-xs">
            <div class="flex items-center justify-between p-2 rounded-lg bg-emerald-50 text-emerald-900">
              <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Correctas a la primera</span>
              <span class="font-bold">142 (77.2%)</span>
            </div>
            <div class="flex items-center justify-between p-2 rounded-lg bg-red-50 text-red-900">
              <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-red-400"></span> Incorrectas</span>
              <span class="font-bold">28 (15.2%)</span>
            </div>
            <div class="flex items-center justify-between p-2 rounded-lg bg-amber-50 text-amber-900">
              <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Corregidas con Tutor IA</span>
              <span class="font-bold">14 (7.6%)</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Recent Activities History Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 class="font-bold text-slate-900 text-base">Historial Detallado de Actividades y Calificaciones</h3>
            <p class="text-xs text-slate-500">Desglose de tareas desarrolladas con tiempo empleado y nota obtenida</p>
          </div>
          <span class="text-xs bg-slate-100 px-3 py-1 rounded-full text-slate-600 font-medium">Escala 1.0 a 7.0</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm text-slate-600">
            <thead class="bg-slate-50 text-xs uppercase font-bold text-slate-400 border-b border-slate-200">
              <tr>
                <th class="px-5 py-3">Asignatura & Actividad</th>
                <th class="px-5 py-3">Fecha Entrega</th>
                <th class="px-5 py-3">Tiempo Empleado</th>
                <th class="px-5 py-3">Aciertos</th>
                <th class="px-5 py-3 text-right">Nota Final</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${grades.map(item => `
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="px-5 py-4">
                    <div class="font-bold text-slate-800">${item.subject}</div>
                    <div class="text-xs text-slate-500">${item.activity}</div>
                  </td>
                  <td class="px-5 py-4 text-xs font-medium text-slate-600">${item.date}</td>
                  <td class="px-5 py-4 text-xs">
                    <span class="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md font-medium text-slate-700">
                      <i data-lucide="clock" class="w-3 h-3 text-slate-400"></i> ${item.timeMinutes} min
                    </span>
                  </td>
                  <td class="px-5 py-4 text-xs font-medium">
                    <span class="text-emerald-600 font-bold">${item.correct}</span> / ${item.total} preguntas
                  </td>
                  <td class="px-5 py-4 text-right">
                    <span class="inline-block px-3 py-1 rounded-xl text-sm font-extrabold ${
                      item.grade >= 6.0 ? 'grade-badge-excellent' :
                      item.grade >= 5.0 ? 'grade-badge-good' :
                      item.grade >= 4.0 ? 'grade-badge-warning' : 'grade-badge-danger'
                    }">
                      ${item.grade.toFixed(1)}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  setMode(mode) {
    this.displayMode = mode;
    app.renderCurrentView();
  },

  // Initialize interactive charts when view renders in advanced mode
  initCharts() {
    if (this.displayMode !== 'avanzado') return;

    // 1. Progress line/bar chart
    const ctxProgress = document.getElementById('chart-progress');
    if (ctxProgress) {
      new Chart(ctxProgress, {
        type: 'line',
        data: {
          labels: ['Semana 4', 'Semana 8', 'Semana 12', 'Semana 16', 'Semana 20', 'Semana 24', 'Semana 28 (Hoy)', 'Semana 36 (Fin)'],
          datasets: [
            {
              label: 'Avance Real Martín (%)',
              data: [12, 25, 38, 52, 64, 76, 84, null],
              borderColor: '#2563eb',
              backgroundColor: 'rgba(37, 99, 235, 0.1)',
              tension: 0.35,
              fill: true,
              pointRadius: 5,
              pointHoverRadius: 7
            },
            {
              label: 'Avance Esperado del Plan (%)',
              data: [10, 22, 35, 48, 58, 68, 75, 100],
              borderColor: '#94a3b8',
              borderDash: [5, 5],
              fill: false,
              pointRadius: 3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              min: 0,
              max: 100,
              ticks: { callback: v => v + '%' }
            }
          }
        }
      });
    }

    // 2. Doughnut chart for correct vs incorrect
    const ctxDoughnut = document.getElementById('chart-doughnut');
    if (ctxDoughnut) {
      new Chart(ctxDoughnut, {
        type: 'doughnut',
        data: {
          labels: ['Correctas', 'Incorrectas', 'Corregidas con IA'],
          datasets: [{
            data: [142, 28, 14],
            backgroundColor: ['#10b981', '#f87171', '#fbbf24'],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: { display: false }
          }
        }
      });
    }
  }
};
