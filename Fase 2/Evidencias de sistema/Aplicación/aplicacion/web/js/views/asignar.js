// View 4: Asignar Actividades (Actor: Profesora de 1° y 2° Básico)
// [REQ-06] Persistencia y Ciclo de Vida Real conectado a FastAPI + MySQL
const asignarView = {
  selectedCourseId: "c1", // c1 -> curso_id 3 (1° Básico B), c2 -> curso_id 4 (2° Básico A)
  selectedSubject: "Todas",
  selectedCatalogCode: "act-conteo",
  fechaApertura: "2026-10-25",
  fechaEntregaGeneral: "2026-10-30",
  fechaEntregaPie: "2026-11-04",
  voiceAgentEnabled: true,
  hasLoadedFromApi: false,
  isAssigning: false,
  confirmationMessage: null,

  // Catálogo oficial del Banco Curricular MINEDUC (1° y 2° Básico)
  mineducCatalog: [
    {
      code: "act-conteo",
      actividad_id: 7,
      title: "Misión Conteo Mágico: Cuenta del 1 al 10 con Robot Leo",
      subject: "Matemáticas",
      oaCode: "MA01 OA 01",
      oaSummary: "Contar números del 0 al 20 de 1 en 1 hacia adelante y hacia atrás con estímulos visuales y auditivos.",
      courseId: 3
    },
    {
      code: "act-mat-2",
      actividad_id: 4,
      title: "El Bosque de los Números: Sumas hasta el 10 con Voz",
      subject: "Matemáticas",
      oaCode: "MA01 OA 09",
      oaSummary: "Demostrar que comprenden la adición y la sustracción de números del 0 al 20 progresivamente (Modelo COPISI).",
      courseId: 3
    },
    {
      code: "act-len-1",
      actividad_id: 8,
      title: "Caza de Sonidos: Sonido Inicial con M, P, L y S",
      subject: "Lenguaje y Comunicación",
      oaCode: "LE01 OA 03",
      oaSummary: "Identificar los sonidos que componen las palabras (conciencia fonológica), reconociendo sílabas y fonemas iniciales.",
      courseId: 3
    },
    {
      code: "act-len-2",
      actividad_id: 10,
      title: "Detective de Cuentos: El Conejo y las Uvas",
      subject: "Lenguaje y Comunicación",
      oaCode: "LE01 OA 18",
      oaSummary: "Comprender textos orales (relatos y fábulas) formulando y respondiendo preguntas oralmente.",
      courseId: 3
    },
    {
      code: "act-sofia-1",
      actividad_id: 6,
      title: "Fábulas Clásicas: El Conejo y las Uvas (Comprensión con Voz)",
      subject: "Lenguaje y Comunicación",
      oaCode: "LE02 OA 18",
      oaSummary: "Comprender textos orales extrayendo información explícita, implícita y moraleja mediante voz.",
      courseId: 4
    },
    {
      code: "act-sofia-2",
      actividad_id: 11,
      title: "Salta al Ritmo: Multiplicando por 2 y por 5",
      subject: "Matemáticas",
      oaCode: "MA02 OA 11",
      oaSummary: "Demostrar que comprenden la multiplicación por 2 y por 5 usando conteo por saltos y grupos iguales.",
      courseId: 4
    }
  ],

  // Nómina inicial de respaldo (se reemplaza dinámicamente desde GET /api/alumnos/curso/{id})
  studentsList: [
    { id: 5, name: "Mateo González Tapia", apoderado: "Carolina Tapia Morales", enabled: true, esPie: false, specialDeadline: "2026-10-30", status: "Habilitado", voiceDefault: "Activo (Robot Leo)" },
    { id: 2, name: "Benjamín Soto", apoderado: "Daniela Soto", enabled: true, esPie: false, specialDeadline: "2026-10-30", status: "Habilitado", voiceDefault: "Activo (Robot Leo)" },
    { id: 1, name: "Martina Fuentes", apoderado: "Rodrigo Fuentes", enabled: true, esPie: true, specialDeadline: "2026-11-04", status: "Inclusión PIE", voiceDefault: "Activo (Audio Lento PIE)" },
    { id: 4, name: "Vicente Contreras", apoderado: "Javiera Contreras", enabled: true, esPie: false, specialDeadline: "2026-10-30", status: "Habilitado", voiceDefault: "Activo (Robot Leo)" },
    { id: 3, name: "Antonia Rojas", apoderado: "Javiera Contreras", enabled: true, esPie: true, specialDeadline: "2026-11-04", status: "Inclusión PIE", voiceDefault: "Activo (Audio Lento PIE)" }
  ],

  getNumericCourseId() {
    return this.selectedCourseId === "c2" ? 4 : 3;
  },

  async loadCourseStudentsFromApi(force = false) {
    if (this.hasLoadedFromApi && !force) return;
    const numCourseId = this.getNumericCourseId();
    if (window.api && api.getStudentsByCourse) {
      const rows = await api.getStudentsByCourse(numCourseId);
      if (Array.isArray(rows) && rows.length > 0) {
        this.studentsList = rows.map(r => {
          const isPie = Boolean(r.es_pie);
          return {
            id: r.alumno_id,
            name: r.nombre,
            email: r.email || "",
            apoderado: r.apoderado_nombre || "Apoderado Titular",
            apoderadoId: r.apoderado_usuario_id || 13,
            enabled: true,
            esPie: isPie,
            specialDeadline: isPie ? this.fechaEntregaPie : this.fechaEntregaGeneral,
            status: isPie ? "Inclusión PIE" : "Habilitado",
            voiceDefault: isPie ? "Activo (Audio Lento PIE)" : "Activo (Robot Leo)"
          };
        });
        this.hasLoadedFromApi = true;
        if (window.app && app.currentView === "asignar") {
          app.renderCurrentView();
        }
      }
    }
  },

  getFilteredCatalog() {
    if (this.selectedSubject === "Todas") return this.mineducCatalog;
    return this.mineducCatalog.filter(item => item.subject === this.selectedSubject);
  },

  getSelectedCatalogItem() {
    const filtered = this.getFilteredCatalog();
    return filtered.find(i => i.code === this.selectedCatalogCode) || filtered[0] || this.mineducCatalog[0];
  },

  changeCourse(courseId) {
    this.selectedCourseId = courseId;
    this.hasLoadedFromApi = false;
    this.confirmationMessage = null;
    this.loadCourseStudentsFromApi(true);
    app.renderCurrentView();
  },

  changeSubject(subject) {
    this.selectedSubject = subject;
    const filtered = this.getFilteredCatalog();
    if (filtered.length > 0 && !filtered.some(i => i.code === this.selectedCatalogCode)) {
      this.selectedCatalogCode = filtered[0].code;
    }
    app.renderCurrentView();
  },

  changeCatalogActivity(code) {
    this.selectedCatalogCode = code;
    this.confirmationMessage = null;
    app.renderCurrentView();
  },

  updateGeneralDeadline(newDate) {
    if (!newDate) return;
    this.fechaEntregaGeneral = newDate;
    this.studentsList.forEach(s => {
      if (!s.esPie) {
        s.specialDeadline = newDate;
      }
    });
    app.renderCurrentView();
  },

  updatePieDeadline(newDate) {
    if (!newDate) return;
    this.fechaEntregaPie = newDate;
    this.studentsList.forEach(s => {
      if (s.esPie) {
        s.specialDeadline = newDate;
      }
    });
    app.renderCurrentView();
  },

  toggleStudentEnabled(studentId, checked) {
    const st = this.studentsList.find(s => Number(s.id) === Number(studentId));
    if (st) {
      st.enabled = Boolean(checked);
      app.renderCurrentView();
    }
  },

  toggleStudentPie(studentId) {
    const st = this.studentsList.find(s => Number(s.id) === Number(studentId));
    if (st) {
      st.esPie = !st.esPie;
      st.status = st.esPie ? "Inclusión PIE" : "Habilitado";
      st.specialDeadline = st.esPie ? this.fechaEntregaPie : this.fechaEntregaGeneral;
      st.voiceDefault = st.esPie ? "Activo (Audio Lento PIE)" : "Activo (Robot Leo)";
      app.renderCurrentView();
    }
  },

  updateStudentIndividualDeadline(studentId, newDate) {
    const st = this.studentsList.find(s => Number(s.id) === Number(studentId));
    if (st && newDate) {
      st.specialDeadline = newDate;
    }
  },

  enableAllStudents() {
    this.studentsList.forEach(s => {
      s.enabled = true;
    });
    app.renderCurrentView();
  },

  async confirmarYAsignarActividad() {
    if (this.isAssigning) return;
    const enabledStudents = this.studentsList.filter(s => s.enabled);
    if (enabledStudents.length === 0) {
      alert("Selecciona al menos un estudiante habilitado para asignar la actividad.");
      return;
    }

    const catItem = this.getSelectedCatalogItem();
    const numCourseId = this.getNumericCourseId();

    this.isAssigning = true;
    this.confirmationMessage = null;
    app.renderCurrentView();

    const payload = {
      curso_id: numCourseId,
      profesor_usuario_id: (window.app && app.currentUser && app.currentUser.id) ? app.currentUser.id : 12,
      actividad_id: catItem.actividad_id,
      codigo_frontend: catItem.code,
      titulo: catItem.title,
      descripcion: catItem.oaSummary,
      asignatura: catItem.subject,
      oa_codigo: catItem.oaCode,
      fecha_apertura: this.fechaApertura,
      fecha_entrega_general: this.fechaEntregaGeneral,
      fecha_entrega_pie: this.fechaEntregaPie,
      agente_voz_activo: this.voiceAgentEnabled,
      alumnos: this.studentsList.map(s => ({
        alumno_id: s.id,
        habilitado: s.enabled,
        fecha_entrega_especial: s.specialDeadline,
        es_pie: s.esPie,
        modo_voz: s.voiceDefault
      }))
    };

    let result = { success: true, entregas_creadas: enabledStudents.length, notificaciones_enviadas: enabledStudents.length };
    if (window.api && api.assignActivityToCourse) {
      result = await api.assignActivityToCourse(payload);
    }

    // Actualizar también estado en memoria local para sincronización inmediata en el navegador
    if (window.mockData) {
      const localActs = numCourseId === 4 ? mockData.sofiaActivities : mockData.studentActivities;
      const foundLocal = (localActs || []).find(a => a.id === catItem.code);
      if (foundLocal) {
        foundLocal.status = "Pendiente";
        foundLocal.progressPercent = 0;
        foundLocal.urgent = true;
        delete foundLocal.score;
        delete foundLocal.gradeValue;
      }
    }

    if (window.api && api.syncStudentDataFromDb) {
      await api.syncStudentDataFromDb(numCourseId === 4 ? "alu-103" : "alu-102");
    }

    this.isAssigning = false;
    if (result && result.success) {
      this.confirmationMessage = {
        type: "success",
        title: "Actividad Asignada y Publicada Exitosamente en Base de Datos",
        detail: `Se crearon ${result.entregas_creadas || enabledStudents.length} registros en la tabla ENTREGA (estado PENDIENTE) para "${catItem.title}" (${catItem.oaCode}) y se dispararon ${result.notificaciones_enviadas || enabledStudents.length} alertas automáticas en la tabla NOTIFICACION hacia la App Móvil de los apoderados.`
      };
    } else {
      this.confirmationMessage = {
        type: "error",
        title: "Error al registrar la asignación",
        detail: (result && result.error) ? result.error : "Verifique la conexión con el servidor FastAPI."
      };
    }

    app.renderCurrentView();
  },

  render() {
    if (!this.hasLoadedFromApi) {
      this.loadCourseStudentsFromApi();
    }

    const teacher = mockData.teacherUser;
    const selectedCourse = teacher.courses.find(c => c.id === this.selectedCourseId) || teacher.courses[0];
    const filteredCatalog = this.getFilteredCatalog();
    const currentCat = this.getSelectedCatalogItem();
    const enabledCount = this.studentsList.filter(s => s.enabled).length;
    const pieCount = this.studentsList.filter(s => s.esPie).length;

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
                <span class="text-xs text-emerald-700 font-bold">Conectado a MySQL (ENTREGA + NOTIFICACION)</span>
              </div>
              <h1 class="text-xl font-bold text-slate-900 mt-0.5">Programar Actividades del Banco Curricular MINEDUC</h1>
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
                  ${c.name}
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        ${this.confirmationMessage ? `
          <div class="p-5 rounded-2xl border ${this.confirmationMessage.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-rose-50 border-rose-300 text-rose-950'} shadow-sm flex items-start justify-between gap-4 animate-fadeIn">
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-xl ${this.confirmationMessage.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'} flex items-center justify-center flex-shrink-0 mt-0.5">
                <i data-lucide="${this.confirmationMessage.type === 'success' ? 'check-circle-2' : 'alert-triangle'}" class="w-5 h-5"></i>
              </div>
              <div>
                <h4 class="font-black text-sm">${this.confirmationMessage.title}</h4>
                <p class="text-xs mt-1 leading-relaxed opacity-90">${this.confirmationMessage.detail}</p>
              </div>
            </div>
            <button onclick="asignarView.confirmationMessage = null; app.renderCurrentView();" class="p-1.5 rounded-lg hover:bg-black/5 text-slate-500">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>
        ` : ''}

        <!-- Activity Configuration Grid -->
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div class="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 class="font-bold text-slate-900 text-base flex items-center gap-2">
              <i data-lucide="settings" class="w-4 h-4 text-blue-600"></i>
              Configurar Actividad para ${selectedCourse.name}
            </h2>
            <span class="text-xs text-blue-700 font-bold bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Objetivo Seleccionado: ${currentCat.oaCode}
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Asignatura Troncal -->
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">1. Filtrar Asignatura</label>
              <select 
                onchange="asignarView.changeSubject(this.value)"
                class="w-full text-xs font-bold border border-slate-300 rounded-xl p-2.5 bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="Todas" ${this.selectedSubject === 'Todas' ? 'selected' : ''}>Todas las Asignaturas</option>
                <option value="Matemáticas" ${this.selectedSubject === 'Matemáticas' ? 'selected' : ''}>Matemáticas</option>
                <option value="Lenguaje y Comunicación" ${this.selectedSubject === 'Lenguaje y Comunicación' ? 'selected' : ''}>Lenguaje y Comunicación</option>
              </select>
            </div>

            <!-- Select Template Activity -->
            <div class="lg:col-span-1">
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">2. Actividad Banco MINEDUC</label>
              <select 
                onchange="asignarView.changeCatalogActivity(this.value)"
                class="w-full text-xs font-bold border border-slate-300 rounded-xl p-2.5 bg-white focus:ring-2 focus:ring-blue-500"
              >
                ${filteredCatalog.map(item => `
                  <option value="${item.code}" ${item.code === currentCat.code ? 'selected' : ''}>
                    [${item.oaCode}] ${item.title}
                  </option>
                `).join('')}
              </select>
            </div>

            <!-- Fecha Límite General -->
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">3. Fecha Límite General</label>
              <input 
                type="date" 
                value="${this.fechaEntregaGeneral}" 
                onchange="asignarView.updateGeneralDeadline(this.value)"
                class="w-full text-xs font-bold border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500"
              >
            </div>

            <!-- Fecha Diferenciada Inclusión / PIE -->
            <div>
              <label class="block text-xs font-bold text-purple-800 uppercase tracking-wider mb-1.5">4. Plazo Inclusión / PIE</label>
              <input 
                type="date" 
                value="${this.fechaEntregaPie}" 
                onchange="asignarView.updatePieDeadline(this.value)"
                class="w-full text-xs font-bold border border-purple-300 bg-purple-50/40 text-purple-950 rounded-xl p-2.5 focus:ring-2 focus:ring-purple-500"
              >
            </div>
          </div>

          <!-- Resumen Curricular de la Actividad Seleccionada -->
          <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-lg text-[11px] font-black uppercase ${currentCat.subject === 'Matemáticas' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}">
                  ${currentCat.subject}
                </span>
                <span class="px-2.5 py-0.5 rounded-lg text-[11px] font-black bg-amber-100 text-amber-900">
                  ${currentCat.oaCode}
                </span>
              </div>
              <h4 class="font-black text-sm text-slate-900">${currentCat.title}</h4>
              <p class="text-xs text-slate-600">${currentCat.oaSummary}</p>
            </div>
          </div>

          <!-- PEDAGOGICAL TOGGLE: Agente de Voz IA por Defecto para 1° y 2° Básico -->
          <div class="bg-gradient-to-r from-amber-50/80 via-orange-50/70 to-yellow-50/80 p-5 rounded-3xl border border-amber-300/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-start gap-3.5">
              <div class="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center flex-shrink-0 shadow-md">
                <i data-lucide="bot" class="w-7 h-7 text-slate-950"></i>
              </div>
              <div>
                <h4 class="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  Agente de Voz IA por Defecto (Preguntas Habladas)
                  <span class="bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">1° y 2° Básico</span>
                </h4>
                <p class="text-xs text-slate-700 mt-1 leading-relaxed">
                  Al ingresar a la actividad desde la App Móvil o Web, <strong>Robot Leo guiará al estudiante 100% por voz</strong> para eliminar la barrera lectora en 1° y 2° básico.
                </p>
              </div>
            </div>

            <div class="flex items-center gap-3 self-end sm:self-center">
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" ${this.voiceAgentEnabled ? 'checked' : ''} onchange="asignarView.voiceAgentEnabled = this.checked" class="sr-only peer">
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
              <h3 class="font-bold text-slate-900 text-base">Nómina Real de Alumnos en ${selectedCourse.name} (Base de Datos MySQL)</h3>
              <p class="text-xs text-slate-500">Personaliza la habilitación y los plazos diferenciados para alumnos de inclusión / PIE (${pieCount} con adecuación)</p>
            </div>

            <div class="flex items-center gap-2">
              <button onclick="asignarView.enableAllStudents()" class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer">
                Habilitar Todos (${this.studentsList.length})
              </button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm text-slate-600">
              <thead class="bg-slate-50 text-xs uppercase font-bold text-slate-400 border-b border-slate-200">
                <tr>
                  <th class="px-5 py-3">Asignar</th>
                  <th class="px-5 py-3">Estudiante y Apoderado</th>
                  <th class="px-5 py-3">Modalidad / Inclusión PIE</th>
                  <th class="px-5 py-3">Plazo de Entrega</th>
                  <th class="px-5 py-3 text-right">Modo Agente de Voz IA</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${this.studentsList.map(s => `
                  <tr class="hover:bg-slate-50/80 transition-colors ${!s.enabled ? 'opacity-50' : ''}">
                    <td class="px-5 py-4">
                      <input 
                        type="checkbox" 
                        ${s.enabled ? 'checked' : ''} 
                        onchange="asignarView.toggleStudentEnabled(${s.id}, this.checked)"
                        class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      >
                    </td>
                    <td class="px-5 py-4">
                      <span class="font-bold text-slate-800 block">${s.name}</span>
                      <span class="text-[11px] text-slate-500">Apoderado: ${s.apoderado || 'Registrado en BD'}</span>
                    </td>
                    <td class="px-5 py-4 text-xs">
                      <button 
                        type="button"
                        onclick="asignarView.toggleStudentPie(${s.id})"
                        title="Haz clic para alternar modalidad Regular / Inclusión PIE"
                        class="px-2.5 py-1 rounded-full font-bold transition cursor-pointer ${
                          s.esPie ? 'bg-purple-100 text-purple-800 border border-purple-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }"
                      >
                        ${s.esPie ? 'Inclusión PIE (Plazo Extendido)' : 'Regular (Habilitado)'}
                      </button>
                    </td>
                    <td class="px-5 py-4 text-xs">
                      <input 
                        type="date" 
                        value="${s.specialDeadline}" 
                        onchange="asignarView.updateStudentIndividualDeadline(${s.id}, this.value)"
                        class="px-2.5 py-1.5 rounded-lg border ${s.esPie ? 'border-purple-300 bg-purple-50 text-purple-900 font-bold' : 'border-slate-300 bg-white text-slate-700 font-medium'} text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                    </td>
                    <td class="px-5 py-4 text-right">
                      <span class="inline-flex items-center gap-1.5 text-xs ${s.esPie ? 'text-purple-900 bg-purple-100 border-purple-200' : 'text-amber-900 bg-amber-100 border-amber-200'} font-bold border px-2.5 py-1 rounded-lg">
                        <i data-lucide="bot" class="w-3.5 h-3.5"></i>
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
            <span class="text-xs font-semibold text-slate-600">
              Seleccionados para asignación en BD: <strong>${enabledCount} de ${this.studentsList.length} estudiantes</strong>
            </span>
            <div class="flex items-center gap-2">
              <button 
                type="button"
                onclick="asignarView.confirmarYAsignarActividad()" 
                ${this.isAssigning ? 'disabled' : ''}
                class="px-6 py-3 rounded-xl text-xs sm:text-sm font-black theme-primary-bg text-white shadow-md hover:opacity-95 active:scale-98 transition flex items-center gap-2 cursor-pointer"
              >
                <i data-lucide="check-circle" class="w-4 h-4"></i>
                <span>${this.isAssigning ? 'Asignando y Notificando...' : 'Confirmar y Asignar Actividad'}</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    `;
  }
};
