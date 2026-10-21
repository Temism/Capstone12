// Mock Data for School Management & Learning Platform (Enfocado en 1° y 2° Básico - Chile)
const mockData = {
  // Global Profile Data - Alumno de 1° Básico (6-7 años)
  currentStudent: {
    id: "alu-102",
    name: "Mateo González Tapia",
    course: "1° Básico B",
    school: "Colegio San Andrés de Las Condes",
    avatar: "https://images.unsplash.com/photo-1595454223600-91fbdd77e641?w=150&auto=format&fit=crop&q=80",
    overallGrade: 6.4,
    completionRate: 88,
    expectedProgress: 80,
    totalCourseWeeks: 36,
    currentWeek: 28,
    avgTimePerActivityMinutes: 15,
    questionsStats: {
      correct: 78,
      incorrect: 12,
      inReview: 6
    }
  },

  parentUser: {
    name: "Carolina Tapia Morales",
    role: "Apoderada Titular",
    email: "carolina.tapia@email.cl",
    studentName: "Mateo González"
  },

  teacherUser: {
    name: "Tía Marcela Valenzuela",
    role: "Profesora Jefe de 1° y 2° Básico",
    school: "Colegio San Andrés",
    email: "marcela.valenzuela@sanandres.cl",
    courses: [
      { id: "c1", name: "1° Básico B", studentsCount: 28, pendingAlerts: 1 },
      { id: "c2", name: "1° Básico A", studentsCount: 29, pendingAlerts: 0 },
      { id: "c3", name: "2° Básico A", studentsCount: 30, pendingAlerts: 2 }
    ]
  },

  // View 1: Reportería orientada a 1° y 2° Básico (Lectoescritura, cálculo inicial)
  gradeHistory: [
    { subject: "Matemáticas", activity: "Conteo y Sumas Mágicas hasta el 10 (con Voz IA)", date: "04 Sep 2026", grade: 6.8, timeMinutes: 12, correct: 10, total: 10 },
    { subject: "Lenguaje y Comunicación", activity: "Aventura de Vocales y Primeras Sílabas (M, P, L)", date: "30 Ago 2026", grade: 6.2, timeMinutes: 16, correct: 8, total: 10 },
    { subject: "Ciencias Naturales", activity: "Los 5 Sentidos y el Cuidado de mi Cuerpo", date: "24 Ago 2026", grade: 6.5, timeMinutes: 14, correct: 9, total: 10 },
    { subject: "Historia y Sociedad", activity: "Mi Familia y los Miembros de mi Comunidad", date: "18 Ago 2026", grade: 5.8, timeMinutes: 18, correct: 7, total: 10 },
    { subject: "Inglés Inicial", activity: "Colores y Números del 1 al 10 en Inglés", date: "10 Ago 2026", grade: 7.0, timeMinutes: 10, correct: 10, total: 10 }
  ],

  // View 2: Alertas profesor para 1° y 2° Básico
  alertsList: [
    {
      id: "alt-1",
      courseId: "c1",
      courseName: "1° Básico B",
      type: "Urgente",
      typeColor: "red",
      title: "Uso de audífonos para actividades de Voz IA en el aula",
      description: "Estimados apoderados: Mañana realizaremos la actividad interactiva de sumas con el Agente de Voz IA. Por favor enviar a los niños con sus audífonos marcados con su nombre.",
      date: "06 Sep 2026 - 10:15 hrs",
      readCount: 26,
      totalCount: 28,
      sender: "Tía Marcela Valenzuela"
    },
    {
      id: "alt-2",
      courseId: "c1",
      courseName: "1° Básico B",
      type: "Académica",
      typeColor: "blue",
      title: "Inicio del proceso de lectura: Sílaba de la letra 'S'",
      description: "Esta semana reforzaremos la letra 'S'. Los niños tienen habilitada una actividad guiada por voz donde la IA les leerá palabras y ellos deberán identificar el sonido inicial.",
      date: "02 Sep 2026 - 15:30 hrs",
      readCount: 27,
      totalCount: 28,
      sender: "Tía Marcela Valenzuela"
    },
    {
      id: "alt-3",
      courseId: "c3",
      courseName: "2° Básico A",
      type: "Citación",
      typeColor: "amber",
      title: "Reunión de Apoderados: Plan Lector y Avance Anual",
      description: "Reunión presencial para mostrar los informes de comprensión lectora asistida por voz y entrega de diplomas de avance.",
      date: "28 Ago 2026 - 09:00 hrs",
      readCount: 30,
      totalCount: 30,
      sender: "Dirección de Ciclo Inicial"
    }
  ],

  // View 3: Actividades Alumno (1° y 2° Básico: La IA les lee y habla las preguntas por defecto)
  studentActivities: [
    {
      id: "act-1",
      subject: "Matemáticas",
      title: "El Bosque de los Números: Sumas con Frutas hasta el 10",
      difficulty: "1° Básico • Fácil",
      dueDate: "Mañana, 18:00 hrs",
      urgent: true,
      status: "Pendiente",
      questionsCount: 5,
      estimatedTime: "12 min",
      voiceAIDefault: true, // ¡La IA hace las preguntas habladas por defecto!
      voiceCharacter: "Robot Leo 🤖",
      voiceAIPrompt: "La IA te leerá las preguntas en voz alta con sonido de animales y frutas",
      description: "¡Aprende a sumar jugando! Robot Leo te contará pequeñas historias habladas y tú le dirás la respuesta o la tocarás en la pantalla.",
      sampleQuestion: {
        number: 1,
        title: "Pregunta 1 de 5",
        text: "En un canastito hay 3 manzanas rojas 🍎🍎🍎 y el conejito trae 2 peras verdes 🍐🍐. ¿Cuántas frutas hay en total?",
        speechAudioText: "¡Hola Mateo! Escucha con mucha atención: En un canastito hay 3 manzanas rojas y el conejito travieso trae 2 peras verdes... ¿Cuántas frutas tenemos en total en el canasto? ¡Puedes decírmelo en voz alta o tocar el botón!",
        options: [
          { value: "4", label: "4 frutas", icon: "🍎" },
          { value: "5", label: "5 frutas", icon: "🌟", correct: true },
          { value: "6", label: "6 frutas", icon: "🍐" }
        ]
      }
    },
    {
      id: "act-2",
      subject: "Lenguaje y Comunicación",
      title: "Caza de Sonidos: Palabras con M, P y L",
      difficulty: "1° Básico • Inicial",
      dueDate: "Viernes 11 Sep",
      urgent: false,
      status: "Pendiente",
      questionsCount: 6,
      estimatedTime: "15 min",
      voiceAIDefault: true,
      voiceCharacter: "Hada de las Letras 🧚‍♀️",
      voiceAIPrompt: "El Hada te dirá palabras y deberás decir con qué sonido empiezan",
      description: "Escucha las palabras mágicas que te dirá la IA y descubre con qué letra comienzan.",
      sampleQuestion: {
        number: 1,
        title: "Pregunta 1 de 6",
        text: "¿Con qué sonido comienza la palabra <strong>M-A-M-Á</strong>? 🌸",
        speechAudioText: "¡Hola pequeño explorador! Escucha con tus orejitas bien abiertas: ¿Con qué sonido empieza la palabra... M-A-M-Á? ¿Empieza con la M de mariposa, o con la P de pelota?",
        options: [
          { value: "M", label: "Con la M (Mmm...)", icon: "🦋", correct: true },
          { value: "P", label: "Con la P (Ppp...)", icon: "⚽" },
          { value: "L", label: "Con la L (Lll...)", icon: "🦁" }
        ]
      }
    },
    {
      id: "act-3",
      subject: "Ciencias Naturales",
      title: "Descubriendo los Animales de Chile y sus Sonidos",
      difficulty: "1° Básico • Divertido",
      dueDate: "15 Sep 2026",
      urgent: false,
      status: "En progreso",
      progressPercent: 50,
      questionsCount: 4,
      estimatedTime: "10 min",
      voiceAIDefault: true,
      voiceCharacter: "Pudú Guía 🦌",
      voiceAIPrompt: "Escucha el sonido del animal y adivina quién es",
      description: "La IA reproducirá el sonido de un animal chileno y te preguntará de quién se trata.",
      sampleQuestion: {
        number: 2,
        title: "Pregunta 2 de 4",
        text: "Escucha el canto nocturno en la montaña: ¡Uuu-uuu! 🌙🦉",
        speechAudioText: "Escucha este sonido misterioso en la noche... ¡Uuu-uuu! ¿Qué animalito chileno está cantando en el árbol?",
        options: [
          { value: "tucuquere", label: "El Tucúquere (Búho)", icon: "🦉", correct: true },
          { value: "condor", label: "El Cóndor", icon: "🦅" },
          { value: "pudu", label: "El Pudú", icon: "🦌" }
        ]
      }
    },
    {
      id: "act-4",
      subject: "Artes y Creatividad",
      title: "Colores Primarios y Secundarios",
      difficulty: "1° Básico • Completada",
      dueDate: "Entregada el 02 Sep",
      urgent: false,
      status: "Entregada",
      score: "7.0 / 7.0",
      questionsCount: 5,
      estimatedTime: "10 min",
      voiceAIDefault: true,
      voiceCharacter: "Pincelito Mágico 🎨",
      description: "Identificación hablada de mezclas de colores con retroalimentación inmediata."
    }
  ],

  // View 4: Asignar Actividades Profesor (1° y 2° Básico)
  assignableActivities: [
    {
      id: "tpl-1",
      title: "El Bosque de los Números: Sumas con Frutas hasta el 10",
      subject: "Matemáticas",
      assignedCourse: "1° Básico B",
      enabledStudents: 28,
      totalStudents: 28,
      voiceAIDefault: true,
      status: "Activa",
      openDate: "05 Sep 2026",
      closeDate: "12 Sep 2026"
    },
    {
      id: "tpl-2",
      title: "Caza de Sonidos: Palabras con M, P y L",
      subject: "Lenguaje y Comunicación",
      assignedCourse: "1° Básico B",
      enabledStudents: 28,
      totalStudents: 28,
      voiceAIDefault: true,
      status: "Programada",
      openDate: "14 Sep 2026",
      closeDate: "21 Sep 2026"
    },
    {
      id: "tpl-3",
      title: "Lectura Inicial: Reconocimiento de Vocales",
      subject: "Lenguaje",
      assignedCourse: "1° Básico A",
      enabledStudents: 29,
      totalStudents: 29,
      voiceAIDefault: true,
      status: "Finalizada",
      openDate: "20 Ago 2026",
      closeDate: "27 Ago 2026"
    }
  ],

  // View 5: Mensajería (Familias de 1° y 2° Básico con Tía Marcela)
  chatChannels: [
    {
      id: "ch-1",
      name: "1° Básico B - Canal Oficial Apoderados",
      type: "Canal",
      unread: 0,
      lastMsg: "Recordar enviar delantal y audífonos para la actividad de mañana.",
      lastTime: "11:42",
      avatarBg: "bg-blue-600",
      initials: "1B"
    },
    {
      id: "ch-2",
      name: "Tía Marcela (Profesora Jefe)",
      type: "Directo",
      unread: 1,
      lastMsg: "Hola Carolina, Mateo respondió muy contento las sumas por voz...",
      lastTime: "Ayer",
      avatarBg: "bg-emerald-600",
      initials: "TM"
    },
    {
      id: "ch-3",
      name: "Coordinación Primer Ciclo Básico",
      type: "Oficial",
      unread: 0,
      lastMsg: "Circular N° 4: Actividades de Fiestas Patrias.",
      lastTime: "01 Sep",
      avatarBg: "bg-purple-600",
      initials: "PC"
    }
  ],

  activeMessages: [
    {
      sender: "Tía Marcela Valenzuela",
      role: "Profesora Jefe 1° Básico B",
      time: "Ayer a las 16:10",
      text: "Estimada Carolina, buenas tardes. Le comento que Mateo hoy realizó su primera actividad con el Agente de Voz IA en la sala. Como él aún está afianzando la lectura de textos largos, le ayudó muchísimo que el robot le leyera los problemas hablados con las frutas.",
      isSelf: false
    },
    {
      sender: "Carolina Tapia",
      role: "Apoderada",
      time: "Ayer a las 17:05",
      text: "¡Qué hermosa noticia Tía Marcela! En la casa Mateo me contó muy entusiasmado que 'el robot Leo' le hizo preguntas y que él le respondió hablando. Nos da mucha tranquilidad saber que no se frustra tratando de leer enunciados difíciles.",
      isSelf: true
    },
    {
      sender: "Tía Marcela Valenzuela",
      role: "Profesora Jefe 1° Básico B",
      time: "Ayer a las 17:18",
      text: "Así es, esa es la meta de la IA por voz en 1° básico. Mañana habilitaremos la actividad de sonidos de animales. Saludos cordiales.",
      isSelf: false,
      readStatus: "Visto por la profesora ✓✓"
    }
  ]
};
