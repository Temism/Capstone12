// View 2: Alertas (Actor: Profesor - Conectada a API REST y MySQL NOTIFICACION)
const alertasView = {
  selectedCourseId: "c1",
  hasLoaded: false,
  isLoading: false,
  isSendingAlert: false,
  sentSuccessMessage: "",
  parentFilter: "todas",
  draftType: "Urgente",
  draftTitle: "Cambio de fecha: Evaluación de Matemáticas y materiales requeridos",
  draftMessage: "",
  _pollIntervalId: null,

  isTeacherAuthorized() {
    return Boolean(window.app && app.currentUser && (app.currentUser.role === 'profesora' || app.currentUser.role === 'admin'));
  },

  isUserAuthorized() {
    return Boolean(window.app && app.currentUser && ['profesora', 'admin', 'apoderado'].includes(app.currentUser.role));
  },

  startPolling() {
    if (this._pollIntervalId) return;
    this._pollIntervalId = setInterval(() => {
      if (document.hidden || !window.app || app.currentView !== 'alertas') return;
      if (this.isUserAuthorized() && !this.isSendingAlert) {
        this.loadAlertsFromDb(true, true);
      }
    }, 4000);
  },

  stopPolling() {
    if (this._pollIntervalId) {
      clearInterval(this._pollIntervalId);
      this._pollIntervalId = null;
    }
  },

  async loadAlertsFromDb(force = false, silent = false) {
    if (this.isLoading && !force) return;
    if (this.hasLoaded && !force) return;
    this.isLoading = true;
    try {
      if (window.api && api.getAlertasUsuario) {
        const dbAlerts = await api.getAlertasUsuario(13);
        if (Array.isArray(dbAlerts)) {
          const prevSnap = JSON.stringify(mockData.alertsList || []);
          const nextAlerts = dbAlerts.map(a => ({
            id: a.id,
            courseId: "c1",
            courseName: "1° Básico B",
            type: (a.tipo || '').toLowerCase() === 'urgente' ? 'Urgente' : ((a.tipo || '').toLowerCase().includes('acad') ? 'Académica' : ((a.tipo || '').toLowerCase().includes('cita') ? 'Citación' : 'Informativa')),
            typeColor: (a.tipo || '').toLowerCase() === 'urgente' ? 'red' : 'blue',
            title: a.titulo,
            description: a.contenido || a.mensaje || '',
            date: a.fecha_creacion ? String(a.fecha_creacion) : 'Hoy',
            fechaLectura: a.fecha_lectura || null,
            estado: a.estado || 'PENDIENTE',
            readCount: a.estado === 'LEIDA' ? 1 : 0,
            totalCount: 1,
            sender: "Tía Marcela Soto"
          }));
          mockData.alertsList = nextAlerts;
          if (silent && prevSnap === JSON.stringify(nextAlerts)) {
            this.hasLoaded = true;
            this.isLoading = false;
            return;
          }
        }
      }
    } catch (err) {
      console.warn("[Alertas] Error cargando alertas:", err);
    }
    this.hasLoaded = true;
    this.isLoading = false;
    if (window.app && app.currentView === 'alertas') {
      const activeEl = document.activeElement;
      const focusedId = activeEl && activeEl.id ? activeEl.id : null;
      if (silent && focusedId && ['alert-title-input', 'alert-message-input'].includes(focusedId)) {
        return;
      }
      app.renderCurrentView();
    }
  },

  async handleSubmitAlert(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!this.isTeacherAuthorized() || this.isSendingAlert) return;
    const titleEl = document.getElementById('alert-title-input');
    const msgEl = document.getElementById('alert-message-input');
    const typeRadio = document.querySelector ? document.querySelector('input[name="alertType"]:checked') : null;
    const titulo = (titleEl ? titleEl.value : this.draftTitle || '').trim();
    const contenido = (msgEl ? msgEl.value : this.draftMessage || '').trim();
    const rawType = typeRadio ? typeRadio.value.toLowerCase() : (this.draftType || 'urgente').toLowerCase();
    const tipo = rawType.includes('urg') ? 'urgente' : (rawType.includes('acad') ? 'academica' : (rawType.includes('cita') ? 'citacion' : 'informativa'));

    if (!titulo) {
      alert("Ingresa un título para la alerta.");
      return;
    }

    this.isSendingAlert = true;
    this.sentSuccessMessage = "";
    app.renderCurrentView();

    try {
      if (window.api && api.emitirAlerta) {
        await api.emitirAlerta({
          usuario_id: 13,
          tipo: tipo,
          titulo: titulo,
          contenido: contenido
        });
      }
      this.sentSuccessMessage = `Alerta "${titulo}" emitida exitosamente y registrada en la bandeja del apoderado.`;
      await this.loadAlertsFromDb(true);
    } catch (err) {
      console.warn("[Alertas] Error emitiendo alerta:", err);
    } finally {
      this.isSendingAlert = false;
      app.renderCurrentView();
    }
  },

  async confirmarAlertaWeb(alertaId) {
    if (!this.isUserAuthorized()) return;
    try {
      if (window.api && api.marcarAlertaLeida) {
        await api.marcarAlertaLeida(alertaId);
      }
      const target = (mockData.alertsList || []).find(a => Number(a.id) === Number(alertaId));
      if (target) {
        target.estado = 'LEIDA';
        target.readCount = 1;
      }
      await this.loadAlertsFromDb(true);
    } catch (err) {
      console.warn("[Alertas] Error confirmando acuse de recibo:", err);
    }
    app.renderCurrentView();
  },

  async limpiarHistorialAlertas() {
    if (!this.isTeacherAuthorized()) return;
    if (window.api && api.limpiarAlertas) {
      await api.limpiarAlertas();
    }
    mockData.alertsList = [];
    this.sentSuccessMessage = "";
    await this.loadAlertsFromDb(true);
    app.renderCurrentView();
  },

  renderParentAlertsView(alerts) {
    const filtradas = (alerts || []).filter(a => {
      if (this.parentFilter === 'pendientes') return a.estado !== 'LEIDA';
      if (this.parentFilter === 'leidas') return a.estado === 'LEIDA';
      if (this.parentFilter === 'urgente') return (a.type || '').toLowerCase() === 'urgente';
      return true;
    });
    const pendientesCount = (alerts || []).filter(a => a.estado !== 'LEIDA').length;

    return `
      <div class="space-y-6 animate-fadeIn pb-12">
        <div class="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-5 text-slate-950 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center space-x-4">
            <div class="w-12 h-12 rounded-2xl bg-white/30 text-slate-950 flex items-center justify-center font-bold flex-shrink-0">
              <i data-lucide="bell-ring" class="w-6 h-6"></i>
            </div>
            <div>
              <span class="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/40 text-slate-950">
                Portal del Apoderado • 1° Básico B
              </span>
              <h1 class="text-xl font-black text-slate-950 mt-1">
                ${pendientesCount > 0 ? `Tienes ${pendientesCount} alerta(s) pendiente(s) de confirmación` : 'Alertas Escolares al Día'}
              </h1>
              <p class="text-xs text-slate-900 font-medium">
                Revisa los avisos oficiales enviados por Profesora Marcela Soto y registra tu acuse de recibo.
              </p>
            </div>
          </div>

          <button
            type="button"
            onclick="alertasView.loadAlertsFromDb(true)"
            class="px-4 py-2 rounded-xl bg-slate-950 text-white hover:bg-slate-800 text-xs font-black flex items-center gap-1.5 self-start sm:self-center cursor-pointer transition"
          >
            <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
            <span>Actualizar</span>
          </button>
        </div>

        <div class="flex flex-wrap items-center gap-2 text-xs font-bold">
          ${[
            { id: 'todas', label: `Todas (${alerts.length})` },
            { id: 'pendientes', label: `Pendientes (${pendientesCount})` },
            { id: 'urgente', label: 'Urgentes' },
            { id: 'leidas', label: 'Confirmadas' }
          ].map(tab => `
            <button
              type="button"
              onclick="alertasView.parentFilter = '${tab.id}'; app.renderCurrentView();"
              class="px-3.5 py-2 rounded-xl border transition cursor-pointer ${
                this.parentFilter === tab.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }"
            >
              ${tab.label}
            </button>
          `).join('')}
        </div>

        ${filtradas.length === 0 ? `
          <div class="bg-white rounded-2xl p-8 border border-dashed border-slate-300 text-center space-y-2">
            <i data-lucide="bell-off" class="w-8 h-8 text-slate-400 mx-auto"></i>
            <p class="text-sm font-black text-slate-700">No hay alertas registradas en esta categoría</p>
            <p class="text-xs text-slate-500">Las alertas y comunicados oficiales emitidos por la docente aparecerán aquí en tiempo real.</p>
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${filtradas.map(a => {
              const isRead = a.estado === 'LEIDA';
              const isUrgent = (a.type || '').toLowerCase() === 'urgente';
              return `
                <div class="bg-white rounded-2xl p-5 border-2 ${isUrgent && !isRead ? 'border-rose-300 shadow-sm' : (isRead ? 'border-emerald-200' : 'border-slate-200')} flex flex-col justify-between gap-4">
                  <div class="space-y-2.5">
                    <div class="flex items-center justify-between gap-2 flex-wrap">
                      <span class="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase ${
                        isUrgent ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }">
                        ${a.type}
                      </span>
                      <span class="text-xs text-slate-500 font-semibold">${a.date}</span>
                    </div>
                    <div>
                      <h3 class="font-black text-slate-900 text-sm leading-snug">${a.title}</h3>
                      ${a.description ? `<p class="text-xs text-slate-600 mt-1.5 leading-relaxed">${a.description}</p>` : ''}
                    </div>
                  </div>

                  <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span class="text-xs text-slate-500 font-semibold">${a.sender}</span>
                    ${isRead ? `
                      <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black">
                        <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600"></i>
                        <span>Acuse Confirmado${a.fechaLectura ? ` (${a.fechaLectura})` : ''}</span>
                      </span>
                    ` : `
                      <button
                        type="button"
                        onclick="alertasView.confirmarAlertaWeb(${a.id})"
                        class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <i data-lucide="check" class="w-4 h-4"></i>
                        <span>Confirmar Lectura (Acuse)</span>
                      </button>
                    `}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;
  },

  render() {
    if (!this.isUserAuthorized()) {
      if (window.app && app.ensureValidViewForCurrentUser) {
        setTimeout(() => {
          app.ensureValidViewForCurrentUser();
          app.render();
        }, 0);
      }
      return '';
    }

    this.startPolling();
    if (!this.hasLoaded && !this.isLoading) {
      this.loadAlertsFromDb();
    }

    const alerts = mockData.alertsList || [];
    if (!this.isTeacherAuthorized()) {
      return this.renderParentAlertsView(alerts);
    }

    const teacher = mockData.teacherUser;
    const selectedCourse = teacher.courses.find(c => c.id === this.selectedCourseId) || teacher.courses[0];
    if (!this.draftMessage) {
      this.draftMessage = `Estimados apoderados de ${selectedCourse.name}: Les recordamos repasar en casa las actividades guiadas por voz con Robot Leo en un ambiente tranquilo.`;
    }

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

              <form onsubmit="alertasView.handleSubmitAlert(event)" class="mt-4 space-y-4">
                ${this.sentSuccessMessage ? `
                  <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600"></i>
                    <span>${this.sentSuccessMessage}</span>
                  </div>
                ` : ''}
                
                <!-- Alert Type / Urgency Radio Buttons -->
                <div>
                  <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Nivel de Urgencia & Categoría</label>
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <label class="cursor-pointer border border-red-200 bg-red-50/50 hover:bg-red-50 p-2.5 rounded-xl flex items-center gap-2 text-xs font-semibold text-red-800 transition">
                      <input type="radio" name="alertType" value="Urgente" ${this.draftType === 'Urgente' ? 'checked' : ''} onchange="alertasView.draftType = this.value" class="text-red-600 focus:ring-red-500">
                      <span>Urgente</span>
                    </label>
                    <label class="cursor-pointer border border-blue-200 bg-blue-50/50 hover:bg-blue-50 p-2.5 rounded-xl flex items-center gap-2 text-xs font-semibold text-blue-800 transition">
                      <input type="radio" name="alertType" value="Academica" ${this.draftType === 'Academica' ? 'checked' : ''} onchange="alertasView.draftType = this.value" class="text-blue-600 focus:ring-blue-500">
                      <span>Académica</span>
                    </label>
                    <label class="cursor-pointer border border-amber-200 bg-amber-50/50 hover:bg-amber-50 p-2.5 rounded-xl flex items-center gap-2 text-xs font-semibold text-amber-800 transition">
                      <input type="radio" name="alertType" value="Citacion" ${this.draftType === 'Citacion' ? 'checked' : ''} onchange="alertasView.draftType = this.value" class="text-amber-600 focus:ring-amber-500">
                      <span>Citación</span>
                    </label>
                    <label class="cursor-pointer border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 p-2.5 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800 transition">
                      <input type="radio" name="alertType" value="Informativa" ${this.draftType === 'Informativa' ? 'checked' : ''} onchange="alertasView.draftType = this.value" class="text-emerald-600 focus:ring-emerald-500">
                      <span>Informativa</span>
                    </label>
                  </div>
                </div>

                <!-- Alert Title -->
                <div>
                  <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Título de la Alerta</label>
                  <input 
                    type="text" 
                    id="alert-title-input"
                    value="${(this.draftTitle || '').replace(/"/g, '&quot;')}"
                    oninput="alertasView.draftTitle = this.value"
                    class="w-full text-sm font-medium border border-slate-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Ej. Recordatorio de reunión o cambio de horario"
                  >
                </div>

                <!-- Alert Message -->
                <div>
                  <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Mensaje para los Apoderados</label>
                  <textarea 
                    id="alert-message-input"
                    rows="4" 
                    oninput="alertasView.draftMessage = this.value"
                    class="w-full text-sm border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Escriba aquí las indicaciones claras y plazos para la familia..."
                  >${this.draftMessage || ''}</textarea>
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
                    ${this.isSendingAlert ? 'disabled' : ''}
                    class="px-5 py-2.5 rounded-xl text-xs font-bold theme-primary-bg text-white shadow-md hover:opacity-95 transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    <i data-lucide="send" class="w-4 h-4"></i>
                    <span>${this.isSendingAlert ? 'Emitiendo...' : 'Emitir Alerta Inmediata'}</span>
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
                    <span class="w-6 h-6 rounded-lg bg-red-600 text-white flex items-center justify-center">
                      <i data-lucide="bell" class="w-3.5 h-3.5 text-white"></i>
                    </span>
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
              <div class="flex items-center justify-between mb-4 gap-2">
                <div>
                  <h3 class="font-bold text-slate-900 text-sm">Historial de Alertas Emitidas</h3>
                  <span class="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-semibold">${alerts.length} enviadas</span>
                </div>
                ${alerts.length > 0 ? `
                  <button
                    type="button"
                    onclick="alertasView.limpiarHistorialAlertas()"
                    class="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold transition cursor-pointer"
                  >
                    Vaciar Alertas
                  </button>
                ` : ''}
              </div>

              ${alerts.length === 0 ? `
                <div class="p-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center space-y-1.5">
                  <i data-lucide="bell-off" class="w-6 h-6 text-slate-400 mx-auto"></i>
                  <p class="text-xs font-bold text-slate-600">No hay alertas emitidas registradas (0 enviadas)</p>
                  <p class="text-[11px] text-slate-400">Las alertas que envíes desde el formulario aparecerán registradas aquí.</p>
                </div>
              ` : `
                <div class="space-y-3">
                  ${alerts.map(a => {
                    const total = a.totalCount || 1;
                    const read = a.readCount || 0;
                    const percent = Math.round((read / total) * 100);
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
                        ${a.description ? `<p class="text-[11px] text-slate-600 leading-relaxed">${a.description}</p>` : ''}
                        
                        <!-- Confirmation Progress Bar -->
                        <div>
                          <div class="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                            <span>Confirmación de lectura:</span>
                            <span class="font-bold text-slate-800">${read} de ${total} apoderados (${percent}%)</span>
                          </div>
                          <div class="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div class="bg-emerald-500 h-1.5 rounded-full" style="width: ${percent}%"></div>
                          </div>
                        </div>

                        <div class="flex items-center justify-between pt-1 text-[11px]">
                          <span class="text-slate-400">Curso: ${a.courseName}</span>
                          <button onclick="alert('Reenviando recordatorio automático a los ${Math.max(0, total - read)} apoderados pendientes...')" class="text-blue-600 font-semibold hover:underline cursor-pointer">
                            Reenviar a no leídos
                          </button>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              `}
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
