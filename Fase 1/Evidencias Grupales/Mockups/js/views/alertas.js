// View 2: Alertas (Actor: Profesor)
const alertasView = {
  selectedCourseId: "c1",

  render() {
    const teacher = mockData.teacherUser;
    const selectedCourse = teacher.courses.find(c => c.id === this.selectedCourseId) || teacher.courses[0];
    const alerts = mockData.alertsList;

    return `
      <div class="space-y-6 animate-fadeIn pb-12">
        <!-- Header Banner & Course Switcher -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center space-x-4">
            <div class="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <i data-lucide="bell-ring" class="w-6 h-6"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">Vista Profesor</span>
                <span class="text-xs text-slate-400">•</span>
                <span class="text-xs text-slate-500">Módulo de Alertas y Notificaciones</span>
              </div>
              <h1 class="text-xl font-bold text-slate-900 mt-0.5">Gestión de Alertas a Apoderados</h1>
              <p class="text-xs text-slate-500">${teacher.name} | ${teacher.role}</p>
            </div>
          </div>

          <!-- Multi-course Selector (Profesor con múltiples cursos) -->
          <div class="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <span class="text-xs font-semibold text-slate-600 pl-2 flex items-center gap-1">
              <i data-lucide="users" class="w-3.5 h-3.5 text-blue-600"></i> Curso Activo:
            </span>
            <select 
              id="course-select-alerts"
              onchange="alertasView.changeCourse(this.value)"
              class="bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              ${teacher.courses.map(c => `
                <option value="${c.id}" ${c.id === this.selectedCourseId ? 'selected' : ''}>
                  ${c.name} (${c.studentsCount} alumnos matriculados)
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <!-- 2 Column Layout: Left = Alert Composer & Live Preview; Right = Sent Alerts History -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <!-- Left Column (7 cols): New Alert Form & Mobile Preview -->
          <div class="lg:col-span-7 space-y-6">
            <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div class="flex items-center justify-between pb-4 border-b border-slate-100">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                  <h2 class="font-bold text-slate-900 text-base">Redactar Nueva Alerta Oficial</h2>
                </div>
                <span class="text-xs text-slate-500">Destino: <strong class="text-slate-800">${selectedCourse.name}</strong></span>
              </div>

              <form onsubmit="event.preventDefault(); alert('Alerta enviada exitosamente a los ${selectedCourse.studentsCount} apoderados de ${selectedCourse.name}. Se ha notificado por App y Correo.');" class="mt-4 space-y-4">
                
                <!-- Alert Type / Urgency Radio Buttons -->
                <div>
                  <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Nivel de Urgencia & Categoría</label>
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <label class="cursor-pointer border border-red-200 bg-red-50/50 hover:bg-red-50 p-2.5 rounded-xl flex items-center gap-2 text-xs font-semibold text-red-800 transition">
                      <input type="radio" name="alertType" value="Urgente" checked class="text-red-600 focus:ring-red-500">
                      <span>🚨 Urgente</span>
                    </label>
                    <label class="cursor-pointer border border-blue-200 bg-blue-50/50 hover:bg-blue-50 p-2.5 rounded-xl flex items-center gap-2 text-xs font-semibold text-blue-800 transition">
                      <input type="radio" name="alertType" value="Academica" class="text-blue-600 focus:ring-blue-500">
                      <span>📚 Académica</span>
                    </label>
                    <label class="cursor-pointer border border-amber-200 bg-amber-50/50 hover:bg-amber-50 p-2.5 rounded-xl flex items-center gap-2 text-xs font-semibold text-amber-800 transition">
                      <input type="radio" name="alertType" value="Citacion" class="text-amber-600 focus:ring-amber-500">
                      <span>📅 Citación</span>
                    </label>
                    <label class="cursor-pointer border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 p-2.5 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800 transition">
                      <input type="radio" name="alertType" value="Informativa" class="text-emerald-600 focus:ring-emerald-500">
                      <span>ℹ️ Informativa</span>
                    </label>
                  </div>
                </div>

                <!-- Alert Title -->
                <div>
                  <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Título de la Alerta</label>
                  <input 
                    type="text" 
                    id="alert-title-input"
                    value="Cambio de fecha: Evaluación de Matemáticas y materiales requeridos"
                    class="w-full text-sm font-medium border border-slate-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Ej. Recordatorio de reunión o cambio de horario"
                  >
                </div>

                <!-- Alert Message -->
                <div>
                  <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Mensaje para los Apoderados</label>
                  <textarea 
                    rows="4" 
                    class="w-full text-sm border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Escriba aquí las indicaciones claras y plazos para la familia..."
                  >Estimados apoderados de ${selectedCourse.name}: Les comunicamos que la entrega de la guía de ecuaciones lineales ha sido extendida. Recuerden que sus pupilos cuentan con el Tutor IA por Voz habilitado para resolver dudas de cálculo en casa.</textarea>
                </div>

                <!-- Recipients Options -->
                <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-bold text-slate-700">Destinatarios Seleccionados:</span>
                    <span class="text-blue-600 font-semibold cursor-pointer hover:underline">Filtrar casos específicos</span>
                  </div>
                  <div class="flex items-center gap-4 text-xs text-slate-600">
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="recipients" checked class="text-blue-600">
                      <span>Todos los apoderados (${selectedCourse.studentsCount})</span>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="recipients" class="text-blue-600">
                      <span>Solo estudiantes con entregas pendientes (6)</span>
                    </label>
                  </div>
                </div>

                <!-- Delivery Channels & Read Confirmation Requirement -->
                <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div class="flex items-center space-x-4 text-xs text-slate-600">
                    <label class="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked class="rounded text-blue-600">
                      <span>Notificación Push Móvil</span>
                    </label>
                    <label class="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked class="rounded text-blue-600">
                      <span>Exigir Confirmación de Lectura</span>
                    </label>
                  </div>

                  <button 
                    type="submit"
                    class="px-5 py-2.5 rounded-xl text-xs font-bold theme-primary-bg text-white shadow-md hover:opacity-95 transition flex items-center gap-2"
                  >
                    <i data-lucide="send" class="w-4 h-4"></i>
                    <span>Emitir Alerta Inmediata</span>
                  </button>
                </div>

              </form>
            </div>
          </div>

          <!-- Right Column (5 cols): Live Preview & Past Alerts with Read Rates -->
          <div class="lg:col-span-5 space-y-6">
            
            <!-- Mobile Preview Widget -->
            <div class="bg-slate-900 rounded-3xl p-4 text-white shadow-xl border border-slate-800">
              <div class="flex items-center justify-between pb-3 border-b border-slate-800 text-[11px] text-slate-400">
                <span class="flex items-center gap-1.5"><i data-lucide="smartphone" class="w-3.5 h-3.5"></i> Vista Previa Apoderado</span>
                <span>Notificación Push</span>
              </div>

              <!-- Push Notification Simulated Card -->
              <div class="mt-3 bg-white text-slate-900 rounded-2xl p-4 shadow-lg border border-slate-100 space-y-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2">
                    <span class="w-6 h-6 rounded-lg bg-red-600 text-white flex items-center justify-center text-[10px] font-bold">🚨</span>
                    <span class="text-xs font-bold text-slate-800">EDUCONNECT • Alerta Urgente</span>
                  </div>
                  <span class="text-[10px] text-slate-400">Ahora</span>
                </div>
                <div class="font-bold text-xs text-slate-900 leading-snug">
                  Cambio de fecha: Evaluación de Matemáticas y materiales requeridos
                </div>
                <p class="text-[11px] text-slate-600 line-clamp-3 leading-relaxed">
                  Estimados apoderados de ${selectedCourse.name}: Les comunicamos que la entrega de la guía de ecuaciones lineales ha sido extendida...
                </p>
                <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                  <span class="text-blue-600 font-semibold">Tocar para confirmar lectura</span>
                  <span class="text-slate-400">${teacher.name}</span>
                </div>
              </div>
            </div>

            <!-- Historical Sent Alerts & Confirmations -->
            <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-bold text-slate-900 text-sm">Historial de Alertas Emitidas</h3>
                <span class="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-semibold">${alerts.length} enviadas</span>
              </div>

              <div class="space-y-3">
                ${alerts.map(a => {
                  const percent = Math.round((a.readCount / a.totalCount) * 100);
                  return `
                    <div class="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors bg-slate-50/50 space-y-2">
                      <div class="flex items-center justify-between text-xs">
                        <span class="px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          a.type === 'Urgente' ? 'bg-red-100 text-red-700' :
                          a.type === 'Académica' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                        }">
                          ${a.type}
                        </span>
                        <span class="text-[11px] text-slate-400 font-medium">${a.date}</span>
                      </div>
                      
                      <div class="font-semibold text-xs text-slate-800">${a.title}</div>
                      
                      <!-- Confirmation Progress Bar -->
                      <div>
                        <div class="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                          <span>Confirmación de lectura:</span>
                          <span class="font-bold text-slate-800">${a.readCount} de ${a.totalCount} apoderados (${percent}%)</span>
                        </div>
                        <div class="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div class="bg-emerald-500 h-1.5 rounded-full" style="width: ${percent}%"></div>
                        </div>
                      </div>

                      <div class="flex items-center justify-between pt-1 text-[11px]">
                        <span class="text-slate-400">Curso: ${a.courseName}</span>
                        <button onclick="alert('Reenviando recordatorio automático a los ${a.totalCount - a.readCount} apoderados pendientes...')" class="text-blue-600 font-semibold hover:underline">
                          Reenviar a no leídos
                        </button>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
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
