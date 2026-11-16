// View 4: Asignar Actividades (Actor: Profesora de 1° y 2° Básico)
// [REQ-06] Asignación Individual (Una a Una), Desasignación y Ciclo de Vida Real conectado a FastAPI + MySQL
const asignarView = {
  selectedCourseId: "c1", // c1 -> curso_id 3 (1° Básico B), c2 -> curso_id 4 (2° Básico A)
  selectedSubject: "Todas",
  selectedCatalogCode: "act-conteo",
  fechaApertura: "2026-11-07",
  fechaEntregaGeneral: "2026-11-15",
  fechaEntregaPie: "2026-11-20",
  voiceAgentEnabled: true,
  hasLoadedFromApi: false,
  isAssigning: false,
  confirmationMessage: null,
  courseActivitiesStatus: {},
  isAssignModalOpen: false,
  modalSelectedCodes: ["act-conteo"],
  modalSubjectFilter: "Todas",
  modalError: null,

  // Catálogo oficial completo del Banco Curricular MINEDUC (1° y 2° Básico)
  mineducCatalog: [
    // --- 1° Básico B (curso_id: 3) - 6 Actividades ---
    {
      code: "act-conteo",
      actividad_id: 7,
      shortTitle: "Contar del 1 al 10",
      title: "Misión Conteo Mágico: Cuenta del 1 al 10 con Robot Leo",
      subject: "Matemáticas",
      oaCode: "MA01 OA 01",
      oaSummary: "Contar números del 1 al 10 de 1 en 1 hacia adelante en orden secuencial con reconocimiento de voz en vivo.",
      courseId: 3,
      icon: "hash"
    },
    {
      code: "act-mat-2",
      actividad_id: 4,
      shortTitle: "Sumas hasta 10",
      title: "El Bosque de los Números: Sumas hasta el 10 con Voz",
      subject: "Matemáticas",
      oaCode: "MA01 OA 09",
      oaSummary: "Demostrar que comprenden la adición de números del 0 al 10 progresivamente mediante representación pictórica (Modelo COPISI).",
      courseId: 3,
      icon: "plus-circle"
    },
    {
      code: "act-db-9",
      actividad_id: 9,
      shortTitle: "Restas hasta 10",
      title: "Restas con Juguetes y Animalitos hasta el 10",
      subject: "Matemáticas",
      oaCode: "MA01 OA 09",
      oaSummary: "Demostrar que comprenden la sustracción de números hasta el 10 quitando elementos pictóricos con guía por voz.",
      courseId: 3,
      icon: "minus-circle"
    },
    {
      code: "act-len-1",
      actividad_id: 8,
      shortTitle: "Sonido Inicial: M, P, L, S",
      title: "Caza de Sonidos: Sonido Inicial con M, P, L y S",
      subject: "Lenguaje y Comunicación",
      oaCode: "LE01 OA 03",
      oaSummary: "Identificar los sonidos que componen las palabras (conciencia fonológica), reconociendo sílabas y fonemas iniciales.",
      courseId: 3,
      icon: "ear"
    },
    {
      code: "act-db-5",
      actividad_id: 5,
      shortTitle: "Casa de las Letras: Letra M",
      title: "La Casa de las Letras: Identifica el sonido inicial M",
      subject: "Lenguaje y Comunicación",
      oaCode: "LE01 OA 03",
      oaSummary: "Reconocer y pronunciar palabras que comienzan con las sílabas MA, ME, MI, MO, MU junto a Robot Leo.",
      courseId: 3,
      icon: "home"
    },
    {
      code: "act-len-2",
      actividad_id: 10,
      shortTitle: "El Conejo y las Uvas",
      title: "Cuentos que Hablan: El Conejo y las Uvas",
      subject: "Lenguaje y Comunicación",
      oaCode: "LE01 OA 18",
      oaSummary: "Comprender textos orales (relatos y fábulas) formulando y respondiendo preguntas de comprensión por voz.",
      courseId: 3,
      icon: "book-open"
    },
    // --- 2° Básico A (curso_id: 4) - 4 Actividades ---
    {
      code: "act-sofia-1",
      actividad_id: 6,
      shortTitle: "Fábula: El Conejo y las Uvas",
      title: "Fábulas Clásicas: El Conejo y las Uvas (Comprensión con Voz)",
      subject: "Lenguaje y Comunicación",
      oaCode: "LE02 OA 18",
      oaSummary: "Comprender textos orales extrayendo información explícita, implícita y moraleja mediante voz.",
      courseId: 4,
      icon: "book-open"
    },
    {
      code: "act-sofia-2",
      actividad_id: 11,
      shortTitle: "Tablas del 2 y del 5",
      title: "El Reino de las Tablas: Multiplicando por 2 y por 5",
      subject: "Matemáticas",
      oaCode: "MA02 OA 11",
      oaSummary: "Demostrar que comprenden la multiplicación por 2 y por 5 usando conteo por saltos y grupos iguales.",
      courseId: 4,
      icon: "zap"
    },
    {
      code: "act-sofia-3",
      actividad_id: 12,
      shortTitle: "Oraciones y Puntuación",
      title: "Lectura de Oraciones y Reglas de Puntuación",
      subject: "Lenguaje y Comunicación",
      oaCode: "LE02 OA 21",
      oaSummary: "Juego rítmico de sílabas y entonación de oraciones con signos de interrogación y exclamación en voz alta.",
      courseId: 4,
      icon: "message-square"
    },
    {
      code: "act-sofia-4",
      actividad_id: 13,
      shortTitle: "Sumas hasta el 50",
      title: "Resolución de Problemas: Sumas con Reserva hasta el 50",
      subject: "Matemáticas",
      oaCode: "MA02 OA 09",
      oaSummary: "Sube los peldaños del Mercado Mágico sumando cantidades de dos dígitos con apoyo visual y voz.",
      courseId: 4,
      icon: "calculator"
    }
  ],

  // Nómina inicial de respaldo (se reemplaza dinámicamente desde GET /api/alumnos/curso/{id})
  studentsList: [
    { id: 5, name: "Mateo González Tapia", apoderado: "Carolina Tapia Morales", enabled: true, esPie: false, specialDeadline: "2026-11-15", status: "Habilitado", voiceDefault: "Activo (Robot Leo)" },
    { id: 2, name: "Benjamín Soto", apoderado: "Daniela Soto", enabled: true, esPie: false, specialDeadline: "2026-11-15", status: "Habilitado", voiceDefault: "Activo (Robot Leo)" },
    { id: 1, name: "Martina Fuentes", apoderado: "Rodrigo Fuentes", enabled: true, esPie: true, specialDeadline: "2026-11-20", status: "Inclusión PIE", voiceDefault: "Activo (Audio Lento PIE)" },
    { id: 4, name: "Vicente Contreras", apoderado: "Javiera Contreras", enabled: true, esPie: false, specialDeadline: "2026-11-15", status: "Habilitado", voiceDefault: "Activo (Robot Leo)" },
    { id: 3, name: "Antonia Rojas", apoderado: "Javiera Contreras", enabled: true, esPie: true, specialDeadline: "2026-11-20", status: "Inclusión PIE", voiceDefault: "Activo (Audio Lento PIE)" }
  ],

  getNumericCourseId() {
    return this.selectedCourseId === "c2" ? 4 : 3;
  },

  async loadCourseStudentsFromApi(force = false) {
    if (this.hasLoadedFromApi && !force) return;
    const numCourseId = this.getNumericCourseId();

    if (window.api) {
      const [rows, statusRows] = await Promise.all([
        api.getStudentsByCourse ? api.getStudentsByCourse(numCourseId) : Promise.resolve(null),
        api.getCourseActivitiesStatus ? api.getCourseActivitiesStatus(numCourseId) : Promise.resolve(null)
      ]);

      if (Array.isArray(rows) && rows.length > 0) {
        this.studentsList = rows.map(r => {
          const isPie = Boolean(r.es_pie);
          return {
            id: r.alumno_id || r.id || (numCourseId === 4 ? 6 : 5),
            name: r.nombre || r.nombre_completo || "Estudiante",
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
      }

      if (Array.isArray(statusRows)) {
        const map = {};
        statusRows.forEach(sr => {
          if (sr.codigo_frontend) {
            map[sr.codigo_frontend] = sr;
          }
          if (sr.actividad_id) {
            map[`id_${sr.actividad_id}`] = sr;
          }
        });
        this.courseActivitiesStatus = map;
      }

      this.hasLoadedFromApi = true;
      if (window.app && app.currentView === "asignar") {
        app.renderCurrentView();
      }
    }
  },

  getActivityStatusInfo(item) {
    const st = this.courseActivitiesStatus[item.code] || this.courseActivitiesStatus[`id_${item.actividad_id}`];
    if (!st) {
      return {
        asignada: false,
        totalAsignados: 0,
        totalEntregadas: 0,
        estadoAlumno: null,
        progresoAlumno: 0,
        puntajeAlumno: null,
        comentariosAlumno: null
      };
    }
    return {
      asignada: Boolean(st.asignada),
      totalAsignados: st.total_asignados || 0,
      totalEntregadas: st.total_entregadas || 0,
      estadoAlumno: st.estado_alumno || "Pendiente",
      progresoAlumno: st.progreso_alumno || 0,
      puntajeAlumno: st.calificacion_alumno != null ? Math.round(Number(st.calificacion_alumno)) : null,
      comentariosAlumno: st.comentarios_alumno || null
    };
  },

  getCourseCatalog() {
    const numCourseId = this.getNumericCourseId();
    return this.mineducCatalog.filter(item => item.courseId === numCourseId);
  },

  getFilteredCatalog() {
    const courseItems = this.getCourseCatalog();
    if (this.selectedSubject === "Todas") return courseItems;
    return courseItems.filter(item => item.subject === this.selectedSubject);
  },

  getSelectedCatalogItem() {
    const filtered = this.getFilteredCatalog();
    return filtered.find(i => i.code === this.selectedCatalogCode) || filtered[0] || this.getCourseCatalog()[0] || this.mineducCatalog[0];
  },

  changeCourse(courseId) {
    this.selectedCourseId = courseId;
    const courseItems = this.getCourseCatalog();
    if (courseItems.length > 0) {
      this.selectedCatalogCode = courseItems[0].code;
      this.modalSelectedCodes = [courseItems[0].code];
    } else {
      this.modalSelectedCodes = [];
    }
    this.modalSubjectFilter = "Todas";
    this.modalError = null;
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

  // Verifica que el usuario actual tenga rol autorizado de Profesora o Admin
  isTeacherAuthorized() {
    return Boolean(window.app && app.currentUser && (app.currentUser.role === 'profesora' || app.currentUser.role === 'admin'));
  },

  // Garantiza devolver siempre un ID de usuario docente válido (nunca apoderado 13 ni alumno 14)
  getValidTeacherUserId() {
    if (window.app && app.currentUser && (app.currentUser.role === 'profesora' || app.currentUser.role === 'admin')) {
      const uid = Number(app.currentUser.id);
      if (uid === 12 || uid === 11) {
        return uid;
      }
    }
    return 12;
  },

  // Asignar una actividad individual directamente desde su tarjeta (1 clic)
  async asignarActividadIndividual(code) {
    if (!this.isTeacherAuthorized() || this.isAssigning) return;
    const catItem = this.mineducCatalog.find(i => i.code === code);
    if (!catItem) return;

    this.selectedCatalogCode = code;
    await this.confirmarYAsignarActividad(catItem);
  },

  // Quitar / Desasignar una actividad individual para que no aparezca en la bandeja del alumno
  async desasignarActividadIndividual(code) {
    if (!this.isTeacherAuthorized() || this.isAssigning) return;
    const catItem = this.mineducCatalog.find(i => i.code === code);
    if (!catItem) return;

    const numCourseId = this.getNumericCourseId();
    this.isAssigning = true;
    this.confirmationMessage = null;
    app.renderCurrentView();

    if (window.api && api.unassignActivity) {
      await api.unassignActivity({
        actividad_id: catItem.actividad_id,
        codigo_frontend: catItem.code,
        curso_id: numCourseId
      });
    }

    if (window.api && api.syncStudentDataFromDb) {
      await api.syncStudentDataFromDb(numCourseId === 4 ? "alu-103" : "alu-102");
    }

    await this.loadCourseStudentsFromApi(true);
    this.isAssigning = false;
    this.confirmationMessage = {
      type: "success",
      title: `Actividad Quitada: "${catItem.shortTitle || catItem.title}"`,
      detail: `La actividad fue retirada de la bandeja de tareas del estudiante. Puedes volver a asignarla cuando lo desees.`
    };
    app.renderCurrentView();
  },

  // Vaciar todas las actividades asignadas del curso para empezar desde cero y asignar una a una
  async vaciarTodasLasActividades() {
    if (!this.isTeacherAuthorized() || this.isAssigning) return;
    const numCourseId = this.getNumericCourseId();
    this.isAssigning = true;
    this.confirmationMessage = null;
    app.renderCurrentView();

    if (window.api && api.unassignAllActivities) {
      await api.unassignAllActivities(numCourseId);
    }

    if (window.api && api.syncStudentDataFromDb) {
      await api.syncStudentDataFromDb(numCourseId === 4 ? "alu-103" : "alu-102");
    }

    await this.loadCourseStudentsFromApi(true);
    this.isAssigning = false;
    this.confirmationMessage = {
      type: "success",
      title: "Bandeja del Alumno Vaciada (0 Actividades Asignadas)",
      detail: "Se quitaron todas las actividades asignadas del curso. Ahora el estudiante tiene su bandeja vacía y puedes asignarle las actividades una a una."
    };
    app.renderCurrentView();
  },

  // Asignar todas las actividades del curso
  async asignarTodasLasActividades() {
    if (!this.isTeacherAuthorized() || this.isAssigning) return;
    const courseItems = this.getCourseCatalog();
    const numCourseId = this.getNumericCourseId();
    const enabledStudents = this.studentsList.filter(s => s.enabled);

    this.isAssigning = true;
    this.confirmationMessage = null;
    app.renderCurrentView();

    for (const catItem of courseItems) {
      const payload = {
        curso_id: numCourseId,
        profesor_usuario_id: this.getValidTeacherUserId(),
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
      if (window.api && api.assignActivityToCourse) {
        await api.assignActivityToCourse(payload);
      }
    }

    if (window.api && api.syncStudentDataFromDb) {
      await api.syncStudentDataFromDb(numCourseId === 4 ? "alu-103" : "alu-102");
    }

    await this.loadCourseStudentsFromApi(true);
    this.isAssigning = false;
    this.confirmationMessage = {
      type: "success",
      title: `Todas las Actividades Asignadas (${courseItems.length} actividades)`,
      detail: `Se asignaron las ${courseItems.length} actividades oficiales del curso a los ${enabledStudents.length} estudiantes seleccionados.`
    };
    app.renderCurrentView();
  },

  async confirmarYAsignarActividad(customCatItem = null) {
    if (!this.isTeacherAuthorized() || this.isAssigning) return;
    const enabledStudents = this.studentsList.filter(s => s.enabled);
    if (enabledStudents.length === 0) {
      alert("Selecciona al menos un estudiante habilitado para asignar la actividad.");
      return;
    }

    const catItem = customCatItem || this.getSelectedCatalogItem();
    const numCourseId = this.getNumericCourseId();

    this.isAssigning = true;
    this.confirmationMessage = null;
    app.renderCurrentView();

    const payload = {
      curso_id: numCourseId,
      profesor_usuario_id: this.getValidTeacherUserId(),
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

    if (window.api && api.syncStudentDataFromDb) {
      await api.syncStudentDataFromDb(numCourseId === 4 ? "alu-103" : "alu-102");
    }

    await this.loadCourseStudentsFromApi(true);
    this.isAssigning = false;
    if (result && result.success) {
      this.confirmationMessage = {
        type: "success",
        title: `Actividad Asignada: "${catItem.shortTitle || catItem.title}"`,
        detail: `Se asignó "${catItem.title}" (${catItem.oaCode}) a ${result.entregas_creadas || enabledStudents.length} estudiante(s) con estado PENDIENTE y se enviaron las notificaciones a los apoderados.`
      };
    } else {
      this.confirmationMessage = {
        type: "error",
        title: "Error al registrar la asignación",
        detail: (result && result.error) ? result.error : "Verifique su conexión e intente nuevamente."
      };
    }

    app.renderCurrentView();
  },

  async abrirRevisionActividad(code, customAlumnoId = null) {
    if (!this.isTeacherAuthorized()) return;
    const numCourseId = this.getNumericCourseId();
    const targetAlumnoId = customAlumnoId ? Number(customAlumnoId) : (numCourseId === 4 ? 6 : 5);
    this.reviewSentSuccess = false;
    this.reviewMessageDraft = undefined;

    if (window.api && api.getRevisionActividad) {
      const rev = await api.getRevisionActividad(numCourseId, code, targetAlumnoId);
      if (rev && rev.success) {
        this.activeReviewData = rev;
        if (rev.resumen_ia && rev.resumen_ia.mensaje_apoderado) {
          this.reviewMessageDraft = rev.resumen_ia.mensaje_apoderado;
        }
        app.renderCurrentView();
        return;
      }
    }

    const catItem = this.getCourseCatalog().find(i => i.code === code) || {};
    const st = this.courseActivitiesStatus[code] || {};
    const studentObj = this.studentsList.find(s => Number(s.id) === Number(targetAlumnoId));
    this.activeReviewData = {
      curso_id: numCourseId,
      codigo_frontend: code,
      titulo: catItem.title || st.titulo || "Actividad Escolar",
      asignatura: catItem.subject || st.asignatura || "Matemáticas",
      alumno_id: targetAlumnoId,
      alumno_nombre: (studentObj && studentObj.name) || (numCourseId === 4 ? "Sofía González" : "Mateo González"),
      apoderado_nombre: (studentObj && studentObj.apoderado) || "Carolina Tapia Morales",
      alumnos_completados: (st.estado_alumno === "Entregada") ? [{
        alumno_id: targetAlumnoId,
        alumno_nombre: (studentObj && studentObj.name) || "Mateo González",
        apoderado_nombre: (studentObj && studentObj.apoderado) || "Carolina Tapia Morales",
        estado: st.estado_alumno,
        progreso: st.progreso_alumno || 100,
        calificacion: st.calificacion_alumno != null ? st.calificacion_alumno : 10
      }] : [],
      alumnos_asignados: [],
      estado: st.estado_alumno || "Pendiente",
      progreso: st.progreso_alumno || 0,
      calificacion: st.calificacion_alumno != null ? st.calificacion_alumno : null,
      detalle_respuestas: st.detalle_respuestas_alumno || [],
      resumen_ia: st.resumen_ia_alumno || null
    };
    app.renderCurrentView();
  },

  async seleccionarAlumnoRevision(code, alumnoId) {
    await this.abrirRevisionActividad(code, Number(alumnoId));
  },

  cerrarRevisionActividad() {
    this.activeReviewData = null;
    this.reviewMessageDraft = undefined;
    this.reviewSentSuccess = false;
    app.renderCurrentView();
  },

  async reiniciarPuntajeAlumno(code, customAlumnoId = null) {
    if (!this.isTeacherAuthorized() || this.isAssigning) return;
    this.isAssigning = true;
    app.renderCurrentView();

    const targetAlumno = customAlumnoId ? Number(customAlumnoId) : ((this.activeReviewData && this.activeReviewData.alumno_id) ? Number(this.activeReviewData.alumno_id) : 5);
    const numCourseId = this.getNumericCourseId();

    if (window.api && api.reiniciarPuntajeActividad) {
      await api.reiniciarPuntajeActividad({
        curso_id: numCourseId,
        codigo_frontend: code,
        alumno_id: targetAlumno
      });
    }

    if (this.activeReviewData && this.activeReviewData.codigo_frontend === code) {
      this.activeReviewData.estado = 'Pendiente';
      this.activeReviewData.progreso = 0;
      this.activeReviewData.calificacion = null;
      this.activeReviewData.detalle_respuestas = [];
      this.activeReviewData.errores_conteo = [];
      this.activeReviewData.tiempo_promedio_segundos = 0;
      this.activeReviewData.tiempo_total_segundos = 0;
      if (Array.isArray(this.activeReviewData.alumnos_completados)) {
        this.activeReviewData.alumnos_completados = this.activeReviewData.alumnos_completados.filter(a => Number(a.alumno_id) !== targetAlumno);
      }
    }

    await this.loadCourseStudentsFromApi(true);
    if (window.api && api.syncStudentDataFromDb) {
      await api.syncStudentDataFromDb();
    }
    this.isAssigning = false;
    app.renderCurrentView();
  },

  async regenerarResumenIa() {
    if (!this.isTeacherAuthorized() || !this.activeReviewData || !window.api || !api.generarResumenDocenteIa) return;
    const rev = this.activeReviewData;
    const iaRes = await api.generarResumenDocenteIa({
      alumno_nombre: rev.alumno_nombre || "Mateo González",
      actividad_codigo: rev.codigo_frontend || "act-conteo",
      actividad_titulo: rev.titulo || "Actividad Escolar",
      asignatura: rev.asignatura || "Matemáticas",
      calificacion: rev.calificacion != null ? rev.calificacion : 10,
      errores_conteo: rev.errores_conteo || [],
      detalle_respuestas: rev.detalle_respuestas || []
    });
    if (iaRes && iaRes.success) {
      this.activeReviewData.resumen_ia = iaRes;
      this.reviewMessageDraft = iaRes.mensaje_apoderado;
      app.renderCurrentView();
    }
  },

  async enviarResumenApoderado() {
    if (!this.isTeacherAuthorized() || !this.activeReviewData) {
      alert("Solo el docente a cargo puede enviar reportes pedagógicos al apoderado.");
      return;
    }
    const textarea = document.getElementById("web-teacher-ia-msg");
    const msgText = (textarea ? textarea.value : (this.reviewMessageDraft || "")).trim();
    if (!msgText) {
      alert("El mensaje para el apoderado no puede estar vacío.");
      return;
    }

    const rev = this.activeReviewData;
    if (window.api && api.enviarResumenApoderado) {
      await api.enviarResumenApoderado({
        alumno_id: rev.alumno_id || 5,
        student_code: rev.alumno_id === 6 ? "alu-103" : "alu-102",
        profesor_usuario_id: this.getValidTeacherUserId(),
        actividad_titulo: rev.titulo || "Actividad Escolar",
        contenido: msgText
      });
    }

    if (window.mensajeriaView) {
      mensajeriaView.hasLoaded = false;
    }

    this.reviewSentSuccess = true;
    app.renderCurrentView();
  },

  abrirModalSeleccionActividades() {
    if (!this.isTeacherAuthorized() || this.isAssigning) return;
    const enabledStudents = this.studentsList.filter(s => s.enabled);
    if (enabledStudents.length === 0) {
      alert("Selecciona al menos un estudiante en la nómina para asignar actividades.");
      return;
    }

    const courseCatalog = this.getCourseCatalog();
    const validCodes = new Set(courseCatalog.map(item => item.code));
    this.modalSelectedCodes = (Array.isArray(this.modalSelectedCodes) ? this.modalSelectedCodes : []).filter(c => validCodes.has(c));
    if (this.modalSelectedCodes.length === 0 && courseCatalog.length > 0) {
      const defaultCode = validCodes.has(this.selectedCatalogCode) ? this.selectedCatalogCode : courseCatalog[0].code;
      this.modalSelectedCodes = [defaultCode];
    }

    this.modalSubjectFilter = "Todas";
    this.modalError = null;
    this.isAssignModalOpen = true;
    app.renderCurrentView();
    setTimeout(() => this.ensureAssignDialogShown(), 0);
  },

  cerrarModalSeleccionActividades() {
    if (this.isAssigning) return;
    this.isAssignModalOpen = false;
    this.modalError = null;
    const dlg = document.getElementById("assign-activities-dialog");
    if (dlg && dlg.open && typeof dlg.close === "function") {
      dlg.close();
    } else if (window.app && app.renderCurrentView) {
      app.renderCurrentView();
    }
  },

  ensureAssignDialogShown() {
    const dlg = document.getElementById("assign-activities-dialog");
    if (!dlg || !this.isAssignModalOpen) return;

    if (!dlg.dataset.boundClose) {
      dlg.dataset.boundClose = "1";
      dlg.addEventListener("close", () => {
        dlg.returnValue = "";
        if (this.isAssignModalOpen) {
          this.isAssignModalOpen = false;
          this.modalError = null;
          if (window.app && app.renderCurrentView) {
            app.renderCurrentView();
          }
        }
      });
      if (!("closedBy" in HTMLDialogElement.prototype)) {
        const isOutside = (e, dialogEl) => {
          const r = dialogEl.getBoundingClientRect();
          return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
        };
        let pressedOutside = false;
        dlg.addEventListener("pointerdown", (e) => {
          pressedOutside = isOutside(e, dlg);
        });
        dlg.addEventListener("pointerup", (e) => {
          if (pressedOutside && isOutside(e, dlg) && !this.isAssigning) {
            dlg.close();
          }
        });
      }
    }

    if (typeof dlg.showModal === "function" && !dlg.open) {
      dlg.showModal();
    }
  },

  refreshAssignModalBody(focusId = null) {
    const body = document.getElementById("assign-modal-body");
    if (!body) return;
    const activeId = focusId || (document.activeElement && document.activeElement.id ? document.activeElement.id : null);
    body.innerHTML = this.renderAssignModalInner();
    if (window.lucide) {
      lucide.createIcons();
    }
    if (activeId) {
      const el = document.getElementById(activeId);
      if (el && typeof el.focus === "function") {
        el.focus({ preventScroll: true });
      }
    }
  },

  getModalFilteredCatalog() {
    const courseItems = this.getCourseCatalog();
    if (!this.modalSubjectFilter || this.modalSubjectFilter === "Todas") {
      return courseItems;
    }
    return courseItems.filter(item => item.subject === this.modalSubjectFilter);
  },

  toggleModalActivityCode(code, checked) {
    const set = new Set(Array.isArray(this.modalSelectedCodes) ? this.modalSelectedCodes : []);
    if (checked) {
      set.add(code);
      this.selectedCatalogCode = code;
    } else {
      set.delete(code);
    }
    this.modalSelectedCodes = Array.from(set);
    this.modalError = null;
    this.refreshAssignModalBody(`modal-act-${code}`);
  },

  seleccionarTodasModalActividades() {
    const visibleItems = this.getModalFilteredCatalog();
    const set = new Set(Array.isArray(this.modalSelectedCodes) ? this.modalSelectedCodes : []);
    visibleItems.forEach(item => set.add(item.code));
    this.modalSelectedCodes = Array.from(set);
    this.modalError = null;
    this.refreshAssignModalBody();
  },

  seleccionarNoAsignadasModal() {
    const visibleItems = this.getModalFilteredCatalog();
    const unassigned = visibleItems.filter(item => !this.getActivityStatusInfo(item).asignada);
    const targets = unassigned.length > 0 ? unassigned : visibleItems;
    this.modalSelectedCodes = targets.map(item => item.code);
    this.modalError = null;
    this.refreshAssignModalBody();
  },

  limpiarSeleccionModalActividades() {
    this.modalSelectedCodes = [];
    this.modalError = null;
    this.refreshAssignModalBody();
  },

  cambiarFiltroAsignaturaModal(subject) {
    this.modalSubjectFilter = subject || "Todas";
    this.refreshAssignModalBody();
  },

  updateModalDeadline(kind, newDate) {
    if (!newDate) return;
    if (kind === "pie") {
      this.fechaEntregaPie = newDate;
      this.studentsList.forEach(s => {
        if (s.esPie) s.specialDeadline = newDate;
      });
    } else {
      this.fechaEntregaGeneral = newDate;
      this.studentsList.forEach(s => {
        if (!s.esPie) s.specialDeadline = newDate;
      });
    }
  },

  async confirmarAsignacionFormularioModal(event) {
    if (event && event.preventDefault) event.preventDefault();
    if (!this.isTeacherAuthorized() || this.isAssigning) return;

    const courseCatalog = this.getCourseCatalog();
    const selectedItems = courseCatalog.filter(item => this.modalSelectedCodes.includes(item.code));
    if (selectedItems.length === 0) {
      this.modalError = "Debes seleccionar al menos una actividad para asignar.";
      const visible = this.getModalFilteredCatalog();
      const firstId = visible.length > 0 ? `modal-act-${visible[0].code}` : null;
      this.refreshAssignModalBody(firstId);
      return;
    }

    const enabledStudents = this.studentsList.filter(s => s.enabled);
    if (enabledStudents.length === 0) {
      this.modalError = "Selecciona al menos un estudiante en la nómina para asignar actividades.";
      this.refreshAssignModalBody();
      return;
    }

    const numCourseId = this.getNumericCourseId();
    this.isAssigning = true;
    this.modalError = null;
    this.confirmationMessage = null;
    this.refreshAssignModalBody();

    const assignedNames = [];
    let lastError = null;
    let totalEntregas = 0;

    for (const catItem of selectedItems) {
      const payload = {
        curso_id: numCourseId,
        profesor_usuario_id: this.getValidTeacherUserId(),
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
      if (result && result.success !== false) {
        assignedNames.push(catItem.shortTitle || catItem.title);
        totalEntregas = Math.max(totalEntregas, result.entregas_creadas || enabledStudents.length);
      } else {
        lastError = (result && result.error) ? result.error : "Error al asignar una o más actividades.";
      }
    }

    this.selectedCatalogCode = selectedItems[0].code;

    if (window.api && api.syncStudentDataFromDb) {
      await api.syncStudentDataFromDb(numCourseId === 4 ? "alu-103" : "alu-102");
    }

    await this.loadCourseStudentsFromApi(true);
    this.isAssigning = false;
    this.isAssignModalOpen = false;

    const dlg = document.getElementById("assign-activities-dialog");
    if (dlg && dlg.open && typeof dlg.close === "function") {
      dlg.close();
    }

    if (assignedNames.length === selectedItems.length) {
      if (selectedItems.length === 1) {
        const onlyItem = selectedItems[0];
        this.confirmationMessage = {
          type: "success",
          title: `Actividad Asignada: "${onlyItem.shortTitle || onlyItem.title}"`,
          detail: `Se asignó "${onlyItem.title}" (${onlyItem.oaCode}) a ${totalEntregas || enabledStudents.length} estudiante(s) con estado PENDIENTE y se enviaron las notificaciones a los apoderados.`
        };
      } else {
        this.confirmationMessage = {
          type: "success",
          title: `${assignedNames.length} Actividades Asignadas Correctamente`,
          detail: `Se asignaron (${assignedNames.join(", ")}) a ${totalEntregas || enabledStudents.length} estudiante(s) seleccionados y se notificó a los apoderados.`
        };
      }
    } else if (assignedNames.length > 0) {
      this.confirmationMessage = {
        type: "error",
        title: `Asignación parcial (${assignedNames.length} de ${selectedItems.length})`,
        detail: lastError || "Algunas actividades no pudieron registrarse. Intenta nuevamente."
      };
    } else {
      this.confirmationMessage = {
        type: "error",
        title: "Error al registrar la asignación",
        detail: lastError || "Verifique su conexión e intente nuevamente."
      };
    }

    app.renderCurrentView();
  },

  renderAssignModalInner() {
    const teacher = mockData.teacherUser;
    const selectedCourse = teacher.courses.find(c => c.id === this.selectedCourseId) || teacher.courses[0];
    const courseCatalog = this.getCourseCatalog();
    const visibleCatalog = this.getModalFilteredCatalog();
    const enabledStudents = this.studentsList.filter(s => s.enabled);
    const pieSelectedCount = enabledStudents.filter(s => s.esPie).length;
    const selectedCodesSet = new Set(this.modalSelectedCodes || []);
    const selectedValidCount = courseCatalog.filter(i => selectedCodesSet.has(i.code)).length;
    const unassignedVisibleCount = visibleCatalog.filter(i => !this.getActivityStatusInfo(i).asignada).length;

    return `
      <form
        id="assign-activities-form"
        method="POST"
        action="#assign-activities"
        onsubmit="asignarView.confirmarAsignacionFormularioModal(event)"
        class="flex flex-col max-h-[88vh]"
        novalidate
      >
        <!-- Encabezado Modal -->
        <div class="p-5 sm:p-6 border-b border-slate-200 flex items-start justify-between gap-4 bg-slate-50/80 rounded-t-3xl">
          <div class="space-y-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-blue-100 text-blue-900 border border-blue-200">
                ${selectedCourse.name}
              </span>
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                ${enabledStudents.length} de ${this.studentsList.length} estudiante(s)${pieSelectedCount > 0 ? ` • ${pieSelectedCount} PIE` : ''}
              </span>
            </div>
            <h2 id="assign-modal-title" class="text-lg sm:text-xl font-black text-slate-900">
              Seleccionar Actividades a Asignar
            </h2>
            <p class="text-xs text-slate-600">
              Marca una o varias actividades del catálogo curricular para asignarlas a los estudiantes habilitados en la nómina.
            </p>
          </div>
          <button
            type="button"
            onclick="asignarView.cerrarModalSeleccionActividades()"
            ${this.isAssigning ? 'disabled' : ''}
            aria-label="Cerrar ventana"
            class="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition cursor-pointer flex-shrink-0"
          >
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <!-- Barra de Filtros y Acciones Rápidas -->
        <div class="px-5 sm:px-6 pt-4 pb-3 border-b border-slate-100 space-y-3 bg-white">
          <search aria-label="Filtrar actividades por asignatura" class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex flex-wrap items-center gap-1.5">
              ${["Todas", "Matemáticas", "Lenguaje y Comunicación"].map(subj => {
                const isActive = (this.modalSubjectFilter || "Todas") === subj;
                const labelText = subj === "Lenguaje y Comunicación" ? "Lenguaje" : subj;
                return `
                  <button
                    type="button"
                    id="modal-filter-${subj === 'Todas' ? 'todas' : (subj === 'Matemáticas' ? 'mat' : 'len')}"
                    onclick="asignarView.cambiarFiltroAsignaturaModal('${subj}')"
                    class="px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                      isActive
                        ? 'theme-primary-bg text-white border-transparent shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }"
                  >
                    ${labelText}
                  </button>
                `;
              }).join('')}
            </div>

            <div class="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onclick="asignarView.seleccionarTodasModalActividades()"
                class="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-[11px] font-black transition cursor-pointer"
              >
                Seleccionar todas (${visibleCatalog.length})
              </button>
              ${unassignedVisibleCount > 0 && unassignedVisibleCount < visibleCatalog.length ? `
                <button
                  type="button"
                  onclick="asignarView.seleccionarNoAsignadasModal()"
                  class="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-black transition cursor-pointer"
                >
                  Solo no asignadas (${unassignedVisibleCount})
                </button>
              ` : ''}
              <button
                type="button"
                onclick="asignarView.limpiarSeleccionModalActividades()"
                class="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[11px] font-bold transition cursor-pointer"
              >
                Limpiar
              </button>
            </div>
          </search>
        </div>

        <!-- Cuerpo Scrolleable con Listado de Actividades -->
        <div class="px-5 sm:px-6 py-4 overflow-y-auto space-y-4 flex-1 bg-slate-50/40">
          <fieldset class="space-y-2.5">
            <legend class="sr-only">Listado de actividades del curso disponibles para asignar</legend>
            ${visibleCatalog.map((item, idx) => {
              const isChecked = selectedCodesSet.has(item.code);
              const info = this.getActivityStatusInfo(item);
              const isMath = item.subject === "Matemáticas";
              return `
                <label
                  for="modal-act-${item.code}"
                  class="flex items-start gap-3.5 p-3.5 rounded-2xl border-2 transition cursor-pointer min-h-[44px] ${
                    isChecked
                      ? 'bg-blue-50/70 border-blue-500 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }"
                >
                  <input
                    type="checkbox"
                    id="modal-act-${item.code}"
                    name="activity_codes"
                    value="${item.code}"
                    ${isChecked ? 'checked' : ''}
                    ${idx === 0 ? 'autofocus' : ''}
                    ${this.isAssigning ? 'disabled' : ''}
                    onchange="asignarView.toggleModalActivityCode('${item.code}', this.checked)"
                    style="accent-color: #1e3a8a;"
                    class="w-5 h-5 mt-0.5 rounded border-slate-400 flex-shrink-0 cursor-pointer"
                  >
                  <div class="min-w-0 flex-1 space-y-1">
                    <div class="flex items-center justify-between gap-2 flex-wrap">
                      <div class="flex items-center gap-1.5 flex-wrap">
                        <span class="px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${isMath ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}">
                          ${isMath ? 'Matemáticas' : 'Lenguaje'}
                        </span>
                        <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900">
                          ${item.oaCode}
                        </span>
                      </div>
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                        info.asignada
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }">
                        ${info.asignada ? `Asignada (${info.estadoAlumno})` : 'No asignada'}
                      </span>
                    </div>
                    <span class="block font-black text-sm text-slate-900 leading-snug">${item.shortTitle || item.title}</span>
                    <span class="block text-xs text-slate-600 leading-relaxed">${item.oaSummary || item.title}</span>
                  </div>
                </label>
              `;
            }).join('')}
          </fieldset>

          <!-- Resumen Editable de Plazos -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
            <div>
              <label for="modal-deadline-general" class="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                Fecha Límite General
              </label>
              <input
                type="date"
                id="modal-deadline-general"
                name="fecha_entrega_general"
                value="${this.fechaEntregaGeneral}"
                ${this.isAssigning ? 'disabled' : ''}
                onchange="asignarView.updateModalDeadline('general', this.value)"
                class="w-full text-xs font-bold border border-slate-300 bg-white rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500"
              >
            </div>
            <div>
              <label for="modal-deadline-pie" class="block text-[11px] font-black text-purple-800 uppercase tracking-wider mb-1">
                Plazo Inclusión / PIE
              </label>
              <input
                type="date"
                id="modal-deadline-pie"
                name="fecha_entrega_pie"
                value="${this.fechaEntregaPie}"
                ${this.isAssigning ? 'disabled' : ''}
                onchange="asignarView.updateModalDeadline('pie', this.value)"
                class="w-full text-xs font-bold border border-purple-300 bg-purple-50/40 text-purple-950 rounded-xl p-2.5 focus:ring-2 focus:ring-purple-500"
              >
            </div>
          </div>

          <div role="status" aria-live="polite" class="${this.modalError ? 'p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-bold flex items-center gap-2' : 'hidden'}">
            <i data-lucide="alert-circle" class="w-4 h-4 text-rose-600 flex-shrink-0"></i>
            <span>${this.modalError || ''}</span>
          </div>
        </div>

        <!-- Pie del Formulario Modal -->
        <div class="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 rounded-b-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="text-xs font-semibold text-slate-600">
            Actividades elegidas: <strong class="text-slate-900">${selectedValidCount} de ${courseCatalog.length}</strong>
          </div>
          <div class="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onclick="asignarView.cerrarModalSeleccionActividades()"
              ${this.isAssigning ? 'disabled' : ''}
              class="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs sm:text-sm transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              ${this.isAssigning ? 'disabled' : ''}
              class="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black theme-primary-bg text-white shadow-md hover:opacity-95 active:scale-98 transition flex items-center gap-2 cursor-pointer"
            >
              <i data-lucide="check-circle" class="w-4 h-4"></i>
              <span>${this.isAssigning ? 'Asignando...' : `Confirmar y Asignar (${selectedValidCount})`}</span>
            </button>
          </div>
        </div>
      </form>
    `;
  },

  renderModalSeleccionActividades() {
    if (!this.isAssignModalOpen) return "";
    return `
      <dialog
        id="assign-activities-dialog"
        aria-labelledby="assign-modal-title"
        closedby="any"
        class="w-[calc(100%-1.5rem)] max-w-3xl rounded-3xl p-0 bg-white text-slate-900 shadow-2xl border border-slate-200 m-auto"
      >
        <div id="assign-modal-body">
          ${this.renderAssignModalInner()}
        </div>
      </dialog>
    `;
  },

  renderRevisionDocentePanel() {
    if (!this.activeReviewData) return "";
    const rev = this.activeReviewData;
    const detalles = Array.isArray(rev.detalle_respuestas) ? rev.detalle_respuestas : [];
    const ia = rev.resumen_ia || {};
    const puntajeVal = rev.calificacion != null ? Math.round(Number(rev.calificacion)) : 10;
    const completadosList = Array.isArray(rev.alumnos_completados) ? rev.alumnos_completados : [];
    const asignadosList = Array.isArray(rev.alumnos_asignados) ? rev.alumnos_asignados : [];
    const studentOptionsMap = new Map();
    completadosList.forEach(al => {
      const idNum = Number(al.alumno_id);
      if (!Number.isNaN(idNum)) {
        const alScore = al.calificacion != null ? Math.round(Number(al.calificacion)) : 10;
        studentOptionsMap.set(idNum, {
          alumno_id: idNum,
          completed: true,
          label: `${al.alumno_nombre} — ${al.estado || 'Entregada'} (${al.progreso || 100}% • ${alScore}/10 pts)`
        });
      }
    });
    asignadosList.forEach(al => {
      const idNum = Number(al.alumno_id);
      if (!Number.isNaN(idNum) && !studentOptionsMap.has(idNum)) {
        studentOptionsMap.set(idNum, {
          alumno_id: idNum,
          completed: false,
          label: `${al.alumno_nombre} — ${al.estado || 'Pendiente'} (${al.progreso || 0}%)`
        });
      }
    });
    if (studentOptionsMap.size === 0 && rev.alumno_id) {
      const idNum = Number(rev.alumno_id);
      studentOptionsMap.set(idNum, {
        alumno_id: idNum,
        completed: rev.estado === 'Entregada',
        label: `${rev.alumno_nombre || 'Mateo González'} — ${rev.estado || 'Pendiente'}`
      });
    }
    const revisionStudents = Array.from(studentOptionsMap.values());
    const completedOptions = revisionStudents.filter(s => s.completed);
    const pendingOptions = revisionStudents.filter(s => !s.completed);
    const currentRevAlumnoId = Number(rev.alumno_id || (revisionStudents[0] && revisionStudents[0].alumno_id) || 5);
    const draftMsg = this.reviewMessageDraft !== undefined
      ? this.reviewMessageDraft
      : (ia.mensaje_apoderado || `Hola ${rev.apoderado_nombre ? rev.apoderado_nombre.split(' ')[0] : 'Carolina'}, te comparto el resumen de la actividad "${rev.titulo}" de ${rev.alumno_nombre || 'Mateo'} (Puntaje: ${puntajeVal}/10 pts).`);

    return `
      <!-- Ventana Emergente (Modal) de Revisión de Respuestas -->
      <div
        onclick="if (event.target === this) asignarView.cerrarRevisionActividad()"
        class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn"
      >
        <div class="w-full max-w-4xl my-4 bg-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-2xl border-2 border-indigo-500/40 space-y-6">
          <!-- Encabezado de la Ventana Emergente -->
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div class="space-y-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="px-3 py-1 rounded-full text-xs font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center gap-1.5">
                  <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
                  Revisión Docente + Diagnóstico IA
                </span>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Alumno: ${rev.alumno_nombre || 'Mateo González'}
                </span>
              </div>
              <h2 class="text-lg sm:text-xl font-black text-white mt-1">${rev.titulo || 'Actividad Escolar'}</h2>
              <p class="text-xs text-slate-400">Selecciona a un estudiante que haya completado la actividad para inspeccionar sus respuestas, tiempos y resumen IA.</p>
            </div>

            <div class="flex flex-wrap items-center gap-3 self-start md:self-center">
              <div class="px-4 py-2 rounded-2xl bg-slate-800 border border-slate-700 text-center">
                <span class="block text-[10px] uppercase font-bold text-slate-400">Puntaje</span>
                <span class="text-base font-black text-amber-400">${rev.calificacion != null || rev.estado === 'Entregada' ? `${puntajeVal} / 10 pts` : 'Sin puntaje (0%)'}</span>
              </div>
              <div class="px-4 py-2 rounded-2xl bg-slate-800 border border-slate-700 text-center">
                <span class="block text-[10px] uppercase font-bold text-slate-400">Promedio / Número</span>
                <span class="text-base font-black text-sky-400">${rev.tiempo_promedio_segundos ? `${rev.tiempo_promedio_segundos} s` : '0.0 s'}</span>
              </div>
              <button
                type="button"
                onclick="asignarView.reiniciarPuntajeAlumno('${rev.codigo_frontend || 'act-conteo'}', ${rev.alumno_id || 5})"
                class="px-3.5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 transition"
              >
                <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
                <span>Reiniciar Puntaje</span>
              </button>
              <button
                type="button"
                onclick="asignarView.cerrarRevisionActividad()"
                class="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-xs border border-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <i data-lucide="x" class="w-4 h-4"></i>
                <span>Cerrar Revisión</span>
              </button>
            </div>
          </div>

          <!-- Selector de Alumnos mediante Combobox (escalable para cursos grandes) -->
          <div class="bg-slate-950/70 rounded-2xl p-4 border border-slate-800 space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="space-y-0.5">
                <div class="flex items-center gap-2">
                  <i data-lucide="users" class="w-4 h-4 text-emerald-400"></i>
                  <label for="revision-student-select" class="font-black text-xs sm:text-sm text-white uppercase tracking-wider cursor-pointer">
                    Seleccionar Estudiante (${completadosList.length} completado${completadosList.length === 1 ? '' : 's'} • ${revisionStudents.length} en nómina)
                  </label>
                </div>
                <span class="block text-[11px] text-slate-400 font-semibold">
                  ${completadosList.length === 0
                    ? `Ningún estudiante ha completado esta actividad todavía (${asignadosList.length} asignado(s) en estado pendiente).`
                    : 'Elige un estudiante del curso en el listado para inspeccionar sus respuestas, tiempos y resumen IA.'}
                </span>
              </div>

              <select
                id="revision-student-select"
                name="revision_alumno_id"
                onchange="asignarView.seleccionarAlumnoRevision('${rev.codigo_frontend}', this.value)"
                class="w-full sm:w-80 bg-slate-900 border border-indigo-400/40 text-white text-xs sm:text-sm font-bold rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-amber-400 focus:outline-none cursor-pointer"
              >
                ${completedOptions.length > 0 && pendingOptions.length > 0 ? `
                  <optgroup label="Completados (${completedOptions.length})">
                    ${completedOptions.map(al => `
                      <option value="${al.alumno_id}" ${al.alumno_id === currentRevAlumnoId ? 'selected' : ''}>
                        ${al.label}
                      </option>
                    `).join('')}
                  </optgroup>
                  <optgroup label="Pendientes (${pendingOptions.length})">
                    ${pendingOptions.map(al => `
                      <option value="${al.alumno_id}" ${al.alumno_id === currentRevAlumnoId ? 'selected' : ''}>
                        ${al.label}
                      </option>
                    `).join('')}
                  </optgroup>
                ` : revisionStudents.map(al => `
                  <option value="${al.alumno_id}" ${al.alumno_id === currentRevAlumnoId ? 'selected' : ''}>
                    ${al.label}
                  </option>
                `).join('')}
              </select>
            </div>
          </div>

          <div class="space-y-6">
            <!-- Bloque 1 (Ancho Completo - 1 Columna): Cómo respondió y cuánto tardó en cada número -->
            <div class="bg-slate-950/60 rounded-2xl p-5 border border-slate-800 space-y-4">
              <div class="flex items-center justify-between flex-wrap gap-2">
                <h3 class="font-black text-sm text-white flex items-center gap-2">
                  <i data-lucide="timer" class="w-4 h-4 text-sky-400"></i>
                  <span>Cómo Respondió el Alumno y Tiempo por Número</span>
                </h3>
                <span class="text-xs font-bold text-slate-400">
                  Tiempo Total: <strong class="text-emerald-400">${rev.tiempo_total_segundos ? `${rev.tiempo_total_segundos} s` : '0.0 s'}</strong>
                </span>
              </div>

              ${detalles.length === 0 ? `
                <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 font-semibold">
                  El estudiante seleccionado aún no registra respuestas grabadas en esta actividad (Estado actual: <strong>${rev.estado || 'Pendiente'}</strong>). Cuando complete o avance la actividad con Robot Leo, verás aquí cada número pronunciado y los segundos que tardó en responderlo.
                </div>
              ` : `
                <div class="grid grid-cols-1 gap-2.5">
                  ${detalles.map(d => {
                    const errPrev = Array.isArray(d.errores_previos) ? d.errores_previos : [];
                    const hasErr = !d.correcto || errPrev.length > 0;
                    const tSeg = Number(d.tiempo_segundos || 1.5).toFixed(1);
                    const isSlow = Number(tSeg) >= 3.2;
                    return `
                      <div class="p-3.5 rounded-xl border ${
                        hasErr
                          ? 'bg-rose-950/50 border-rose-500/50'
                          : (isSlow ? 'bg-amber-950/40 border-amber-500/40' : 'bg-slate-900/90 border-slate-800')
                      } flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div class="min-w-0 flex-1 space-y-1">
                          <div class="flex items-center gap-2 flex-wrap">
                            <span class="font-black text-xs sm:text-sm text-white">${d.etiqueta || ('Número ' + d.paso)}</span>
                            ${hasErr ? `
                              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-500 text-white">
                                Se equivocó (${errPrev.join(', ') || 'error'})
                              </span>
                            ` : `
                              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                1° intento OK
                              </span>
                            `}
                          </div>
                          <p class="text-xs text-slate-200 font-medium leading-relaxed break-words">
                            Respuesta registrada: <strong class="text-white">${d.respondido || d.esperado}</strong>
                          </p>
                        </div>
                        <div class="sm:text-right flex sm:flex-col items-center sm:items-end justify-between gap-2 flex-shrink-0">
                          <span class="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-black ${
                            hasErr ? 'bg-rose-500 text-white' : (isSlow ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-sky-300 border border-slate-700')
                          }">
                            <i data-lucide="clock" class="w-3.5 h-3.5"></i>
                            <span>${tSeg} s</span>
                          </span>
                          <span class="block text-[10px] font-bold ${isSlow ? 'text-amber-300' : 'text-slate-400'} mt-0.5">
                            ${isSlow ? 'Mayor demora' : 'Fluido'}
                          </span>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              `}
            </div>

            <!-- Bloque 2 (Ancho Completo - 1 Columna): Resumen con IA indicando puntos de mejora + Botón Rápido al Apoderado -->
            <div class="bg-indigo-950/50 rounded-2xl p-5 border border-indigo-500/40 flex flex-col justify-between space-y-4">
              <div class="space-y-3">
                <div class="flex items-center justify-between gap-2">
                  <h3 class="font-black text-sm text-white flex items-center gap-2">
                    <i data-lucide="bot" class="w-4 h-4 text-amber-400"></i>
                    <span>Resumen con IA y Puntos de Mejora</span>
                  </h3>
                  <button
                    type="button"
                    onclick="asignarView.regenerarResumenIa()"
                    class="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <i data-lucide="refresh-cw" class="w-3 h-3"></i>
                    <span>Regenerar IA</span>
                  </button>
                </div>

                <div class="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/30 space-y-1">
                  <span class="text-[10px] font-black uppercase text-emerald-400 tracking-wider block">Fortalezas Observadas:</span>
                  <p class="text-xs text-slate-200 leading-relaxed">${ia.fortalezas || 'El alumno completó la secuencia siguiendo las instrucciones por voz de Robot Leo.'}</p>
                </div>

                <div class="p-3 rounded-xl bg-slate-900/90 border border-amber-500/40 space-y-1">
                  <span class="text-[10px] font-black uppercase text-amber-400 tracking-wider block">Puntos de Mejora Detectados por IA:</span>
                  <p class="text-xs text-amber-100 font-semibold leading-relaxed">${ia.puntos_mejora || 'Reforzar los números donde presentó mayor tiempo de respuesta o vacilación.'}</p>
                </div>
              </div>

              <div class="pt-3 border-t border-indigo-500/30 space-y-3">
                <label class="block text-xs font-black text-indigo-200">
                  Mensaje directo para ${rev.apoderado_nombre || 'Carolina Tapia'} (Firmado por Profesora Marcela Soto):
                </label>
                <textarea
                  id="web-teacher-ia-msg"
                  rows="4"
                  oninput="asignarView.reviewMessageDraft = this.value"
                  class="w-full rounded-xl bg-slate-900 border border-indigo-400/40 p-3 text-xs text-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
                >${draftMsg}</textarea>

                ${this.reviewSentSuccess ? `
                  <div class="p-3 rounded-xl bg-emerald-600 text-white text-xs font-black flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <i data-lucide="check-circle-2" class="w-4 h-4"></i>
                      <span>¡Resumen enviado como mensaje al apoderado!</span>
                    </div>
                    <button
                      type="button"
                      onclick="asignarView.cerrarRevisionActividad(); app.setView('mensajeria');"
                      class="px-3 py-1 rounded-lg bg-white text-emerald-950 font-black text-[11px] cursor-pointer"
                    >
                      Ver en Mensajería
                    </button>
                  </div>
                ` : ''}

                <button
                  type="button"
                  onclick="asignarView.enviarResumenApoderado()"
                  class="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-950 font-black text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <i data-lucide="send" class="w-4 h-4"></i>
                  <span>Enviar Resumen al Apoderado por Mensaje</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  render() {
    if (!this.isTeacherAuthorized()) {
      this.activeReviewData = null;
      this.isAssignModalOpen = false;
      if (window.app && app.ensureValidViewForCurrentUser) {
        setTimeout(() => {
          app.ensureValidViewForCurrentUser();
          app.render();
        }, 0);
      }
      return '';
    }

    if (!this.hasLoadedFromApi) {
      this.loadCourseStudentsFromApi();
    }

    if (this.isAssignModalOpen) {
      setTimeout(() => this.ensureAssignDialogShown(), 0);
    }

    const teacher = mockData.teacherUser;
    const selectedCourse = teacher.courses.find(c => c.id === this.selectedCourseId) || teacher.courses[0];
    const courseCatalog = this.getCourseCatalog();
    const filteredCatalog = this.getFilteredCatalog();
    const currentCat = this.getSelectedCatalogItem();
    const enabledCount = this.studentsList.filter(s => s.enabled).length;
    const pieCount = this.studentsList.filter(s => s.esPie).length;
    const assignedCount = courseCatalog.filter(item => this.getActivityStatusInfo(item).asignada).length;
    const mainStudentName = this.getNumericCourseId() === 4 ? "Sofía González" : "Mateo González";

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
                <span class="text-xs text-emerald-700 font-bold">Asignación Individual en Tiempo Real</span>
              </div>
              <h1 class="text-xl font-bold text-slate-900 mt-0.5">Gestión y Asignación de Actividades Una a Una</h1>
              <p class="text-xs text-slate-500">${teacher.name} | ${teacher.role}</p>
            </div>
          </div>

          <!-- Course Selector -->
          <div class="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <span class="text-xs font-semibold text-slate-600 pl-2">Curso:</span>
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
          <div class="p-4 rounded-2xl border ${this.confirmationMessage.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-rose-50 border-rose-300 text-rose-950'} shadow-sm flex items-start justify-between gap-4 animate-fadeIn">
            <div class="flex items-start gap-3">
              <div class="w-9 h-9 rounded-xl ${this.confirmationMessage.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'} flex items-center justify-center flex-shrink-0 mt-0.5">
                <i data-lucide="${this.confirmationMessage.type === 'success' ? 'check-circle-2' : 'alert-triangle'}" class="w-5 h-5"></i>
              </div>
              <div>
                <h4 class="font-black text-sm">${this.confirmationMessage.title}</h4>
                <p class="text-xs mt-0.5 leading-relaxed opacity-90">${this.confirmationMessage.detail}</p>
              </div>
            </div>
            <button onclick="asignarView.confirmationMessage = null; app.renderCurrentView();" class="p-1.5 rounded-lg hover:bg-black/5 text-slate-500 cursor-pointer">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>
        ` : ''}

        <!-- PANEL PRINCIPAL: ASIGNAR O QUITAR ACTIVIDADES UNA A UNA -->
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div class="flex items-center gap-2.5">
                <h2 class="font-black text-slate-900 text-base flex items-center gap-2">
                  <i data-lucide="layers" class="w-5 h-5 text-blue-600"></i>
                  Catálogo de Actividades de ${selectedCourse.name} (Asignar Una a Una)
                </h2>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-black ${assignedCount > 0 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-600 border border-slate-300'}">
                  ${assignedCount} de ${courseCatalog.length} activas en el teléfono de ${mainStudentName}
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-1">
                Solo las actividades marcadas como <strong>Asignada</strong> aparecen en la App Móvil y portal del estudiante. Puedes vaciar la bandeja y asignarlas una por una.
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <button 
                type="button"
                onclick="asignarView.vaciarTodasLasActividades()"
                ${this.isAssigning ? 'disabled' : ''}
                class="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-black text-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                <span>Vaciar Bandeja (Quitar Todas)</span>
              </button>
              <button 
                type="button"
                onclick="asignarView.asignarTodasLasActividades()"
                ${this.isAssigning ? 'disabled' : ''}
                class="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-black text-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <i data-lucide="check-check" class="w-3.5 h-3.5"></i>
                <span>Asignar Todas (${courseCatalog.length})</span>
              </button>
            </div>
          </div>

          <!-- Grid de Tarjetas de Actividades Individuales (Simétricas y sin numeración) -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
            ${courseCatalog.map((item) => {
              const info = this.getActivityStatusInfo(item);
              const isMath = item.subject === "Matemáticas";
              const isSelectedForm = item.code === currentCat.code;
              return `
                <div class="h-full rounded-2xl border-2 p-5 flex flex-col justify-between gap-4 transition-all ${
                  info.asignada 
                    ? 'bg-emerald-50/30 border-emerald-300 shadow-xs' 
                    : 'bg-slate-50/60 border-slate-200 opacity-90'
                } ${isSelectedForm ? 'ring-2 ring-blue-500 ring-offset-1' : ''}">
                  
                  <div class="space-y-2.5">
                    <div class="flex items-center justify-between gap-2 flex-wrap">
                      <div class="flex items-center gap-1.5">
                        <span class="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase ${isMath ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}">
                          ${isMath ? 'Matemáticas' : 'Lenguaje'}
                        </span>
                        <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900">
                          ${item.oaCode}
                        </span>
                      </div>

                      ${info.asignada ? `
                        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-2xs">
                          <i data-lucide="check" class="w-3 h-3"></i>
                          Asignada (${info.estadoAlumno})
                        </span>
                      ` : `
                        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">
                          No asignada
                        </span>
                      `}
                    </div>

                    <div>
                      <h3 class="font-black text-slate-900 text-sm leading-snug">${item.shortTitle || item.title}</h3>
                      <p class="text-[11px] text-slate-500 mt-0.5 line-clamp-2 min-h-[32px]">${item.title}</p>
                    </div>

                    ${info.asignada ? `
                      <div class="pt-1 flex flex-wrap items-center gap-1.5">
                        <span class="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white border border-slate-200 text-slate-700">
                          Avance: ${info.progresoAlumno}%
                        </span>
                        ${info.puntajeAlumno != null ? `
                          <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-indigo-100 border border-indigo-200 text-indigo-900">
                            Puntaje: ${info.puntajeAlumno} / 10 pts
                          </span>
                        ` : ''}
                      </div>
                      ${info.comentariosAlumno && info.comentariosAlumno.includes('Se equivocó en:') ? `
                        <div class="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-[11px] text-amber-950 font-semibold leading-snug">
                          <div class="font-black text-amber-900 flex items-center gap-1 mb-0.5">
                            <i data-lucide="stethoscope" class="w-3.5 h-3.5 text-amber-700"></i>
                            Diagnóstico Docente (Exclusivo Profesora):
                          </div>
                          <div>${info.comentariosAlumno}</div>
                        </div>
                      ` : (info.estadoAlumno === 'Entregada' ? `
                        <div class="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 font-bold flex items-center gap-1.5">
                          <i data-lucide="award" class="w-3.5 h-3.5 text-emerald-600"></i>
                          <span>Sin equivocaciones detectadas (${info.puntajeAlumno != null ? info.puntajeAlumno : 10}/10 pts)</span>
                        </div>
                      ` : '')}
                    ` : ''}
                  </div>

                  <div class="pt-2 border-t border-slate-200/80 flex flex-col gap-2">
                    ${!info.asignada ? `
                      <button 
                        type="button"
                        onclick="asignarView.asignarActividadIndividual('${item.code}')"
                        ${this.isAssigning ? 'disabled' : ''}
                        class="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <i data-lucide="plus-circle" class="w-4 h-4"></i>
                        <span>Asignar Actividad</span>
                      </button>
                    ` : `
                      <button 
                        type="button"
                        onclick="asignarView.abrirRevisionActividad('${item.code}')"
                        class="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <i data-lucide="sparkles" class="w-4 h-4"></i>
                        <span>Revisar Respuestas, Tiempos y Resumen IA</span>
                      </button>
                      <div class="flex items-center justify-between gap-2">
                        <button 
                          type="button"
                          onclick="asignarView.desasignarActividadIndividual('${item.code}')"
                          ${this.isAssigning ? 'disabled' : ''}
                          class="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <i data-lucide="x-circle" class="w-4 h-4"></i>
                          <span>Quitar</span>
                        </button>
                        <button 
                          type="button"
                          onclick="asignarView.reiniciarPuntajeAlumno('${item.code}')"
                          ${this.isAssigning ? 'disabled' : ''}
                          title="Reiniciar puntaje y estado de esta actividad a Pendiente (0%)"
                          class="py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-xs"
                        >
                          <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                          <span>Reiniciar Puntaje</span>
                        </button>
                      </div>
                    `}
                  </div>

                </div>
              `;
            }).join('')}
          </div>
        </div>

        ${this.renderRevisionDocentePanel()}

        <!-- Configuración Detallada de Plazos y Nómina PIE -->
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div class="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 class="font-bold text-slate-900 text-base flex items-center gap-2">
              <i data-lucide="settings" class="w-4 h-4 text-blue-600"></i>
              Configuración Detallada y Plazos Diferenciados (PIE)
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
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">2. Actividad a Configurar</label>
              <select 
                onchange="asignarView.changeCatalogActivity(this.value)"
                class="w-full text-xs font-bold border border-slate-300 rounded-xl p-2.5 bg-white focus:ring-2 focus:ring-blue-500"
              >
                ${filteredCatalog.map(item => `
                  <option value="${item.code}" ${item.code === currentCat.code ? 'selected' : ''}>
                    [${item.oaCode}] ${item.shortTitle || item.title}
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

          <!-- Student Assignment Matrix Table -->
          <div class="border border-slate-200 rounded-2xl overflow-hidden">
            <div class="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 class="font-bold text-slate-900 text-sm">Nómina de Alumnos en ${selectedCourse.name} (${pieCount} con adecuación PIE)</h3>
              </div>
              <button onclick="asignarView.enableAllStudents()" class="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer">
                Seleccionar Todos (${this.studentsList.length})
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-sm text-slate-600">
                <thead class="bg-slate-50 text-xs uppercase font-bold text-slate-400 border-b border-slate-200">
                  <tr>
                    <th class="px-5 py-3">Incluir</th>
                    <th class="px-5 py-3">Estudiante y Apoderado</th>
                    <th class="px-5 py-3">Modalidad / Inclusión PIE</th>
                    <th class="px-5 py-3">Plazo de Entrega</th>
                    <th class="px-5 py-3 text-right">Modo Agente de Voz IA</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  ${this.studentsList.map(s => `
                    <tr class="hover:bg-slate-50/80 transition-colors ${!s.enabled ? 'opacity-50' : ''}">
                      <td class="px-5 py-3.5">
                        <input 
                          type="checkbox" 
                          ${s.enabled ? 'checked' : ''} 
                          onchange="asignarView.toggleStudentEnabled(${s.id}, this.checked)"
                          class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        >
                      </td>
                      <td class="px-5 py-3.5">
                        <span class="font-bold text-slate-800 block">${s.name}</span>
                        <span class="text-[11px] text-slate-500">Apoderado: ${s.apoderado || 'Apoderado Titular'}</span>
                      </td>
                      <td class="px-5 py-3.5 text-xs">
                        <button 
                          type="button"
                          onclick="asignarView.toggleStudentPie(${s.id})"
                          class="px-2.5 py-1 rounded-full font-bold transition cursor-pointer ${
                            s.esPie ? 'bg-purple-100 text-purple-800 border border-purple-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }"
                        >
                          ${s.esPie ? 'Inclusión PIE (Plazo Extendido)' : 'Regular (Habilitado)'}
                        </button>
                      </td>
                      <td class="px-5 py-3.5 text-xs">
                        <input 
                          type="date" 
                          value="${s.specialDeadline}" 
                          onchange="asignarView.updateStudentIndividualDeadline(${s.id}, this.value)"
                          class="px-2.5 py-1.5 rounded-lg border ${s.esPie ? 'border-purple-300 bg-purple-50 text-purple-900 font-bold' : 'border-slate-300 bg-white text-slate-700 font-medium'} text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                      </td>
                      <td class="px-5 py-3.5 text-right">
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
                Seleccionados: <strong>${enabledCount} de ${this.studentsList.length} estudiantes</strong>
              </span>
              <button 
                type="button"
                onclick="asignarView.abrirModalSeleccionActividades()" 
                ${this.isAssigning ? 'disabled' : ''}
                class="px-6 py-3 rounded-xl text-xs sm:text-sm font-black theme-primary-bg text-white shadow-md hover:opacity-95 active:scale-98 transition flex items-center gap-2 cursor-pointer"
              >
                <i data-lucide="check-circle" class="w-4 h-4"></i>
                <span>${this.isAssigning ? 'Procesando...' : 'Asignar actividad'}</span>
              </button>
            </div>
          </div>
        </div>

        ${this.renderModalSeleccionActividades()}
      </div>
    `;
  }
};
