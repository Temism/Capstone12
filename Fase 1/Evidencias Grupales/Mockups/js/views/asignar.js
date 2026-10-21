// View 4: Asignar Actividades (Actor: Profesora de 1° y 2° Básico)
const asignarView = {
  selectedCourseId: "c1",
  studentsList: [
    { id: 1, name: "Mateo González Tapia", enabled: true, specialDeadline: "12 Sep 2026", status: "Habilitado", voiceDefault: "Activo (Robot Leo)" },
    { id: 2, name: "Sofía Araneda Pavez", enabled: true, specialDeadline: "12 Sep 2026", status: "Habilitado", voiceDefault: "Activo (Robot Leo)" },
    { id: 3, name: "Benjamín Contreras Rojas", enabled: true, specialDeadline: "12 Sep 2026", status: "Habilitado", voiceDefault: "Activo (Robot Leo)" },
    { id: 4, name: "Valentina Muñoz Silva", enabled: true, specialDeadline: "12 Sep 2026", status: "Habilitado", voiceDefault: "Activo (Robot Leo)" },
    { id: 5, name: "Lucas Soto Carvajal", enabled: true, specialDeadline: "12 Sep 2026", status: "Habilitado", voiceDefault: "Activo (Robot Leo)" },
    { id: 6, name: "Isidora Morales Vera", enabled: true, specialDeadline: "15 Sep (Apoyo PIE)", status: "Plazo Especial", voiceDefault: "Activo (Audio Lento)" },
    { id: 7, name: "Vicente Castro Riquelme", enabled: true, specialDeadline: "12 Sep 2026", status: "Habilitado", voiceDefault: "Activo (Robot Leo)" }
  ],

  render() {
    const teacher = mockData.teacherUser;
    const selectedCourse = teacher.courses.find(c => c.id === this.selectedCourseId) || teacher.courses[0];

    return `
      <div class="space-y-6 animate-fadeIn pb-12">
        <!-- Header Banner -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center space-x-4">
            <div class="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <i data-lucide="clipboard-check" class="w-6 h-6"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">Vista Profesora</span>
                <span class="text-xs text-slate-400">•</span>
                <span class="text-xs text-slate-500">Módulo Primer Ciclo Básico</span>
              </div>
              <h1 class="text-xl font-bold text-slate-900 mt-0.5">Programar Actividades para Niños</h1>
              <p class="text-xs text-slate-500">${teacher.name} | ${teacher.role}</p>
            </div>
          </div>

          <!-- Course Selector -->
          <div class="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <span class="text-xs font-semibold text-slate-600 pl-2">Curso a Programar:</span>
            <select 
              onchange="asignarView.changeCourse(this.value)"
              class="bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              ${teacher.courses.map(c => `
                <option value="${c.id}" ${c.id === this.selectedCourseId ? 'selected' : ''}>
                  ${c.name} (${c.studentsCount} niños matriculados)
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <!-- Activity Configuration Grid -->
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div class="border-b border-slate-100 pb-4 flex items-center justify-between">
            <h2 class="font-bold text-slate-900 text-base flex items-center gap-2">
              <i data-lucide="settings" class="w-4 h-4 text-blue-600"></i>
              Configurar Nueva Tarea para ${selectedCourse.name}
            </h2>
            <span class="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Ciclo 1° y 2° Básico
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            <!-- Select Template Activity -->
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Actividad del Banco Mineduc</label>
              <select class="w-full text-xs font-medium border border-slate-300 rounded-xl p-2.5 bg-white focus:ring-2 focus:ring-blue-500">
                <option selected>El Bosque de los Números: Sumas con Frutas hasta el 10 (con Robot Leo)</option>
                <option>Caza de Sonidos: Palabras con M, P y L (con Hada de las Letras)</option>
                <option>Descubriendo los Animales de Chile y sus Sonidos (con Pudú Guía)</option>
                <option>Aventura Geométrica: Círculos, Cuadrados y Triángulos en el Patio</option>
              </select>
            </div>

            <!-- Start Date / Time -->
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Fecha y Hora de Apertura</label>
              <input type="datetime-local" value="2026-09-08T08:00" class="w-full text-xs font-medium border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500">
            </div>

            <!-- Deadline -->
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Fecha y Hora Límite de Entrega</label>
              <input type="datetime-local" value="2026-09-12T18:00" class="w-full text-xs font-medium border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500">
            </div>
          </div>

          <!-- PEDAGOGICAL TOGGLE: Agente de Voz IA por Defecto para 1° y 2° Básico -->
          <div class="bg-gradient-to-r from-amber-50/80 via-orange-50/70 to-yellow-50/80 p-5 rounded-3xl border-2 border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-start gap-3.5">
              <div class="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center text-2xl font-black flex-shrink-0 shadow-md">
                🤖
              </div>
              <div>
                <h4 class="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  Agente de Voz IA por Defecto (Preguntas Habladas)
                  <span class="bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">1° y 2° Básico</span>
                </h4>
                <p class="text-xs text-slate-700 mt-1 leading-relaxed">
                  Al ingresar a la actividad, <strong>la IA leerá automáticamente en voz alta los enunciados y preguntas</strong> con entonación cálida para niños en etapa de lectoescritura inicial. Los alumnos podrán responder por voz o tocando la pantalla.
                </p>
                <div class="flex items-center gap-3 text-xs text-amber-900 font-bold mt-2">
                  <span>Personaje de voz: <strong>Robot Leo</strong></span>
                  <span>•</span>
                  <span>Velocidad de habla: <strong>Adaptada para 6-7 años</strong></span>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-3 self-end sm:self-center">
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked class="sr-only peer">
                <div class="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500 shadow-inner"></div>
                <span class="ml-2.5 text-xs font-black text-slate-800">Habilitado</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Student Assignment Matrix Table -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 class="font-bold text-slate-900 text-base">Alumnos Matriculados en ${selectedCourse.name}</h3>
              <p class="text-xs text-slate-500">Configuración individual de habilitación y modo de voz</p>
            </div>

            <div class="flex items-center gap-2">
              <button onclick="alert('Todos los niños han sido habilitados con Agente de Voz IA activo.')" class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition">
                Habilitar Todo el Curso (28)
              </button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm text-slate-600">
              <thead class="bg-slate-50 text-xs uppercase font-bold text-slate-400 border-b border-slate-200">
                <tr>
                  <th class="px-5 py-3">Habilitar</th>
                  <th class="px-5 py-3">Nombre del Niño/a</th>
                  <th class="px-5 py-3">Estado</th>
                  <th class="px-5 py-3">Plazo Entrega</th>
                  <th class="px-5 py-3 text-right">Agente de Voz IA</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${this.studentsList.map(s => `
                  <tr class="hover:bg-slate-50/80 transition-colors">
                    <td class="px-5 py-4">
                      <input type="checkbox" ${s.enabled ? 'checked' : ''} class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500">
                    </td>
                    <td class="px-5 py-4 font-bold text-slate-800">
                      ${s.name}
                    </td>
                    <td class="px-5 py-4 text-xs">
                      <span class="px-2.5 py-0.5 rounded-full font-semibold ${
                        s.status === 'Habilitado' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                      }">
                        ${s.status}
                      </span>
                    </td>
                    <td class="px-5 py-4 text-xs text-slate-600 font-medium">
                      ${s.specialDeadline}
                    </td>
                    <td class="px-5 py-4 text-right">
                      <span class="inline-flex items-center gap-1.5 text-xs text-amber-900 font-bold bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg">
                        <span>🤖</span>
                        <span>${s.voiceDefault}</span>
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Table Footer Actions -->
          <div class="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span class="text-xs text-slate-500">
              Mostrando 7 de 28 alumnos (Vista previa)
            </span>
            <div class="flex items-center gap-2">
              <button onclick="alert('Guardado como borrador programado.')" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition">
                Guardar Borrador
              </button>
              <button onclick="alert('¡Actividad con Agente de Voz IA publicada exitosamente para ${selectedCourse.name}!')" class="px-5 py-2 rounded-xl text-xs font-bold theme-primary-bg text-white shadow hover:opacity-95 transition flex items-center gap-1.5">
                <i data-lucide="check-circle" class="w-4 h-4"></i>
                <span>Publicar Tarea con Voz IA</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    `;
  },

  changeCourse(courseId) {
    this.selectedCourseId = courseId;
    app.renderCurrentView();
  }
};
