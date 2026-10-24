// Mock Data for School Management & Learning Platform (Enfocado en 1° y 2° Básico - Chile)
// Materias exclusivas: Lenguaje y Comunicación / Matemáticas
const mockData = {
  // Usuarios autorizados para el Login Demo
  demoUsers: {
    admin: {
      email: "admin@sanandres.cl",
      password: "admin123",
      role: "admin",
      roleLabel: "Administrador",
      name: "Rodrigo Valenzuela Lagos",
      title: "Director Académico",
      course: "Colegio San Andrés",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
      defaultView: "asignar"
    },
    profesora: {
      email: "profesora@sanandres.cl",
      password: "profe123",
      role: "profesora",
      roleLabel: "Profesora",
      name: "Marcela Soto Valenzuela",
      title: "Profesora Jefe 1° Básico B",
      course: "1° Básico B",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
      defaultView: "asignar"
    },
    apoderado: {
      email: "apoderado@sanandres.cl",
      password: "apoderado123",
      role: "apoderado",
      roleLabel: "Apoderado",
      name: "Carolina Tapia Morales",
      title: "Apoderada Titular (2 Estudiantes a cargo)",
      course: "1° Básico B & 2° Básico A",
      studentName: "Mateo & Sofía González",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      defaultView: "reporteria"
    },
    alumno: {
      email: "alumno@sanandres.cl",
      password: "alumno123",
      role: "alumno",
      roleLabel: "Alumno",
      name: "Mateo González Tapia",
      title: "Estudiante 1° Básico B",
      course: "1° Básico B",
      avatar: "https://images.unsplash.com/photo-1543332164-6e82f355badc?w=150&auto=format&fit=crop&q=80",
      defaultView: "actividades"
    }
  },

  // Lista de Estudiantes a cargo del Apoderado (Multi-estudiante: Mateo en 1° Básico y Sofía en 2° Básico)
  parentStudents: [
    {
      id: "alu-102",
      name: "Mateo González Tapia",
      shortName: "Mateo",
      course: "1° Básico B",
      ageRange: "6-7 años",
      school: "Colegio San Andrés de Las Condes",
      avatar: "https://images.unsplash.com/photo-1543332164-6e82f355badc?w=150&auto=format&fit=crop&q=80",
      overallGrade: 6.6,
      completionRate: 90,
      expectedProgress: 80,
      totalCourseWeeks: 36,
      currentWeek: 28,
      avgTimePerActivityMinutes: 14,
      completedActivitiesMonth: 10,
      diagnosisText: "Mateo va muy bien este semestre. Tiene un promedio general de 6.6 (la nota de aprobación es 4.0). Gracias a que las actividades le leen las preguntas en voz alta con Robot Leo, Mateo ha completado el 90% de sus tareas a tiempo y sin la frustración de tener que leer textos largos solo.",
      pendingTaskTitle: "Misión Conteo Mágico: Cuenta del 1 al 10 con Robot Leo",
      pendingTaskDeadline: "hoy a las 19:00",
      pendingTaskPrompt: "Robot Leo escuchará tu voz mientras cuentas del 1 al 10.",
      mathGrade: 6.8,
      mathStatus: "Excelente",
      mathDesc: "Conteo lúdico, sumas y restas hasta el 10 con voz",
      mathTasks: "4 de 4 tareas al día",
      languageGrade: 6.5,
      languageStatus: "Muy Bien",
      languageDesc: "Lectoescritura inicial, vocales y fonética auditiva",
      languageTasks: "4 de 4 tareas al día",
      guidanceText: "Las dos materias troncales (Lenguaje y Matemáticas) cuentan con apoyo de voz para que el niño no se canse leyendo textos largos. Se recomienda practicar 15 minutos diarios con Robot Leo.",
      teacherName: "Tía Marcela Soto (Profesora Jefe 1° Básico B)"
    },
    {
      id: "alu-103",
      name: "Sofía González Tapia",
      shortName: "Sofía",
      course: "2° Básico A",
      ageRange: "7-8 años",
      school: "Colegio San Andrés de Las Condes",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
      overallGrade: 6.5,
      completionRate: 85,
      expectedProgress: 80,
      totalCourseWeeks: 36,
      currentWeek: 28,
      avgTimePerActivityMinutes: 16,
      completedActivitiesMonth: 9,
      diagnosisText: "Sofía muestra un progreso constante en 2° básico con un promedio general de 6.5. Ha consolidado la lectura fluida de oraciones y está afianzando el cálculo mental con reservas y tablas iniciales del 2 y del 5.",
      pendingTaskTitle: "Fábulas Clásicas: La Zorra y las Uvas (Comprensión con Voz)",
      pendingTaskDeadline: "jueves a las 17:00",
      pendingTaskPrompt: "Robot Leo le ayudará a identificar la moraleja mediante preguntas habladas.",
      mathGrade: 6.4,
      mathStatus: "Muy Bien",
      mathDesc: "Sumas con reserva y cálculo mental hasta el 50",
      mathTasks: "3 de 4 tareas al día",
      languageGrade: 6.7,
      languageStatus: "Excelente",
      languageDesc: "Comprensión lectora fluida, puntuación y fábulas",
      languageTasks: "4 de 4 tareas al día",
      guidanceText: "En 2° básico es ideal fomentar la lectura compartida de 15 minutos en el hogar y pedirle a Sofía que explique las conclusiones con sus propias palabras.",
      teacherName: "Profesor Andrés Morales (Profesor Jefe 2° Básico A)"
    }
  ],

  // Control del Estudiante Activo
  selectedStudentId: "alu-102",

  getSelectedStudent() {
    return this.parentStudents.find(s => s.id === this.selectedStudentId) || this.parentStudents[0];
  },

  setSelectedStudent(studentId) {
    this.selectedStudentId = studentId;
    this.currentStudent = this.getSelectedStudent();
  },

  // Perfil del Estudiante Activo por defecto (Mateo)
  currentStudent: {
    id: "alu-102",
    name: "Mateo González Tapia",
    shortName: "Mateo",
    course: "1° Básico B",
    school: "Colegio San Andrés de Las Condes",
    avatar: "https://images.unsplash.com/photo-1543332164-6e82f355badc?w=150&auto=format&fit=crop&q=80",
    overallGrade: 6.6,
    completionRate: 90,
    expectedProgress: 80,
    totalCourseWeeks: 36,
    currentWeek: 28,
    avgTimePerActivityMinutes: 14,
    questionsStats: {
      correct: 82,
      incorrect: 10,
      inReview: 4
    }
  },

  parentUser: {
    name: "Carolina Tapia Morales",
    role: "Apoderada Titular",
    email: "apoderado@sanandres.cl",
    studentName: "Mateo & Sofía González"
  },

  teacherUser: {
    name: "Tía Marcela Soto",
    role: "Profesora Jefe de 1° y 2° Básico",
    school: "Colegio San Andrés",
    email: "profesora@sanandres.cl",
    courses: [
      { id: "c1", name: "1° Básico B", studentsCount: 28, pendingAlerts: 1 },
      { id: "c2", name: "1° Básico A", studentsCount: 29, pendingAlerts: 0 },
      { id: "c3", name: "2° Básico A", studentsCount: 30, pendingAlerts: 2 }
    ]
  },

  // Calificaciones históricas de Mateo (1° Básico)
  gradeHistory: [
    { subject: "Matemáticas", activity: "Conteo y Sumas Mágicas hasta el 10 (con Voz IA)", date: "04 Sep 2026", grade: 6.8, timeMinutes: 12, correct: 10, total: 10 },
    { subject: "Lenguaje y Comunicación", activity: "Aventura de Vocales y Primeras Sílabas (M, P, L)", date: "30 Ago 2026", grade: 6.4, timeMinutes: 15, correct: 9, total: 10 },
    { subject: "Matemáticas", activity: "Resolución de Problemas con Monedas y Figuras", date: "24 Ago 2026", grade: 6.7, timeMinutes: 14, correct: 9, total: 10 },
    { subject: "Lenguaje y Comunicación", activity: "Comprensión Auditiva de Cuentos con Robot Leo", date: "18 Ago 2026", grade: 6.5, timeMinutes: 16, correct: 8, total: 10 }
  ],

  // Calificaciones históricas de Sofía (2° Básico)
  sofiaGradeHistory: [
    { subject: "Lenguaje y Comunicación", activity: "Lectura Fluida: Fábulas y Moralejas (con Voz IA)", date: "05 Sep 2026", grade: 6.7, timeMinutes: 14, correct: 10, total: 10 },
    { subject: "Matemáticas", activity: "Multiplicación Inicial: Tablas del 2 y del 5", date: "31 Ago 2026", grade: 6.4, timeMinutes: 16, correct: 9, total: 10 },
    { subject: "Lenguaje y Comunicación", activity: "Uso de Mayúsculas, Signos y Puntuación", date: "23 Ago 2026", grade: 6.6, timeMinutes: 15, correct: 9, total: 10 },
    { subject: "Matemáticas", activity: "Sumas con Reserva hasta el 50", date: "16 Ago 2026", grade: 6.3, timeMinutes: 18, correct: 8, total: 10 }
  ],

  // Alertas profesor para 1° y 2° Básico
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
      sender: "Tía Marcela Soto"
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
      sender: "Tía Marcela Soto"
    },
    {
      id: "alt-3",
      courseId: "c3",
      courseName: "2° Básico A",
      type: "Citación",
      typeColor: "amber",
      title: "Reunión de Apoderados: Plan Lector y Avance en Matemáticas",
      description: "Reunión presencial para mostrar los informes de comprensión lectora asistida por voz y entrega de diplomas de avance.",
      date: "28 Ago 2026 - 09:00 hrs",
      readCount: 30,
      totalCount: 30,
      sender: "Dirección de Ciclo Inicial"
    }
  ],

  // Actividades Alumno 1° Básico (Mateo) - 4 Actividades Oficiales Mineduc (2 Matemáticas + 2 Lenguaje)
  studentActivities: [
    {
      id: "act-conteo",
      subject: "Matemáticas",
      oaCode: "MA01 OA 01",
      oaSummary: "Contar números del 0 al 20 de 1 en 1 hacia adelante y hacia atrás",
      activityType: "counting",
      title: "Cuenta al Ritmo: Del 1 al 20 con Robot Leo",
      difficulty: "1° Básico • MA01 OA 01",
      dueDate: "Hoy, 19:00 hrs",
      urgent: true,
      status: "Pendiente",
      questionsCount: 20,
      estimatedTime: "5 min",
      voiceAIDefault: true,
      voiceCharacter: "Robot Leo",
      voiceAIPrompt: "Sigue el pulso musical y di cada número en español cuando se ilumine en pantalla (Niveles 1 al 5, 10, 15 y 20)",
      description: "Reto rítmico interactivo en español (Mineduc MA01 OA 01). Los números aparecen uno por uno siguiendo el compás automático: di cada número en voz alta a tiempo para completar la secuencia y subir de nivel.",
      disclaimerTtsText: "¡Hola! Qué alegría jugar contigo hoy. Antes de empezar, busca un rincón tranquilo sin tele ni música fuerte para poder escucharte súper bien. Cuando estés listo, toca la barra espaciadora.",
      isCountingMission: true
    },
    {
      id: "act-mat-2",
      subject: "Matemáticas",
      oaCode: "MA01 OA 09",
      oaSummary: "Demostrar que comprenden la adición en el ámbito del 0 al 10 (Modelo COPISI)",
      activityType: "addition",
      title: "Escalera de Sumas: Sube a la Cima Sumando hasta 10",
      difficulty: "1° Básico • MA01 OA 09",
      dueDate: "Mañana, 18:00 hrs",
      urgent: true,
      status: "Pendiente",
      questionsCount: 5,
      estimatedTime: "8 min",
      voiceAIDefault: true,
      voiceCharacter: "Robot Leo",
      voiceAIPrompt: "Ayuda a Robot Leo a subir los 5 peldaños de la Escalera Mágica resolviendo cada suma con tu voz",
      description: "Juego Escalera de Sumas (Mineduc MA01 OA 09 - Modelo COPISI). Cada suma correcta hace subir a Robot Leo un peldaño hacia el trofeo dorado.",
      disclaimerTtsText: "¡Hola! En la Escalera de Sumas vamos a subir cinco peldaños juntos. Mira los dibujos de cada grupo, cuéntalos todos y dime el resultado en voz alta para subir hasta la estrella dorada.",
      questions: [
        {
          number: 1,
          title: "Problema 1 de 5 • Agregar cantidades",
          equation: "2 + 1 = ?",
          groupA: { count: 2, icon: "apple", label: "2 manzanas rojas", color: "rose" },
          groupB: { count: 1, icon: "apple", label: "1 manzana más", color: "amber" },
          text: "En una rama hay <strong>2 manzanas</strong> y luego brota <strong>1 manzana más</strong>. ¿Cuántas manzanas hay en total?",
          speechAudioText: "Problema número uno: En una rama hay dos manzanas, y luego aparece una manzana más. Si las juntamos, ¿cuántas manzanas hay en total? Dilo con tu voz.",
          correctNumber: 3,
          correctWord: "tres",
          options: [
            { value: 2, label: "2 manzanas" },
            { value: 3, label: "3 manzanas", correct: true },
            { value: 4, label: "4 manzanas" }
          ]
        },
        {
          number: 2,
          title: "Problema 2 de 5 • Juntar colecciones",
          equation: "3 + 2 = ?",
          groupA: { count: 3, icon: "sun", label: "3 soles amarillos", color: "amber" },
          groupB: { count: 2, icon: "sparkles", label: "2 estrellas brillantes", color: "blue" },
          text: "En el cielo brillan <strong>3 soles</strong> y se suman <strong>2 estrellas</strong>. ¿Cuántos astros brillan en total?",
          speechAudioText: "Problema número dos: En el cielo brillan tres soles y se unen dos estrellas. ¿Cuántos son tres más dos en total? Responde en voz alta.",
          correctNumber: 5,
          correctWord: "cinco",
          options: [
            { value: 4, label: "4 en total" },
            { value: 5, label: "5 en total", correct: true },
            { value: 6, label: "6 en total" }
          ]
        },
        {
          number: 3,
          title: "Problema 3 de 5 • Avanzar en la laguna",
          equation: "4 + 3 = ?",
          groupA: { count: 4, icon: "fish", label: "4 pececitos azules", color: "blue" },
          groupB: { count: 3, icon: "fish", label: "3 pececitos nuevos", color: "emerald" },
          text: "En la laguna nadan <strong>4 pececitos</strong> y llegan <strong>3 pececitos más</strong>. ¿Cuántos pececitos nadan juntos ahora?",
          speechAudioText: "Problema número tres: En la laguna nadan cuatro pececitos y llegan tres pececitos más. ¿Cuánto es cuatro más tres?",
          correctNumber: 7,
          correctWord: "siete",
          options: [
            { value: 6, label: "6 pececitos" },
            { value: 7, label: "7 pececitos", correct: true },
            { value: 8, label: "8 pececitos" }
          ]
        },
        {
          number: 4,
          title: "Problema 4 de 5 • Jardín del bosque",
          equation: "5 + 3 = ?",
          groupA: { count: 5, icon: "flower-2", label: "5 flores moradas", color: "purple" },
          groupB: { count: 3, icon: "flower-2", label: "3 flores blancas", color: "emerald" },
          text: "En el jardín hay <strong>5 flores abiertas</strong> y florecen <strong>3 flores más</strong>. ¿Cuántas flores hay en el jardín?",
          speechAudioText: "Problema número cuatro: En el jardín hay cinco flores abiertas y florecen tres flores más. ¿Cuánto es cinco más tres?",
          correctNumber: 8,
          correctWord: "ocho",
          options: [
            { value: 7, label: "7 flores" },
            { value: 8, label: "8 flores", correct: true },
            { value: 9, label: "9 flores" }
          ]
        },
        {
          number: 5,
          title: "Problema 5 de 5 • Completar la decena",
          equation: "6 + 4 = ?",
          groupA: { count: 6, icon: "tree-pine", label: "6 pinitos altos", color: "emerald" },
          groupB: { count: 4, icon: "tree-pine", label: "4 pinitos pequeños", color: "blue" },
          text: "En la colina hay <strong>6 pinitos altos</strong> y plantamos <strong>4 pinitos más</strong>. ¿Cuántos pinitos suman en total?",
          speechAudioText: "Último desafío de suma: En la colina hay seis pinitos altos y plantamos cuatro pinitos más. ¿Cuánto es seis más cuatro?",
          correctNumber: 10,
          correctWord: "diez",
          options: [
            { value: 8, label: "8 pinitos" },
            { value: 9, label: "9 pinitos" },
            { value: 10, label: "10 pinitos", correct: true }
          ]
        }
      ]
    },
    {
      id: "act-len-1",
      subject: "Lenguaje y Comunicación",
      oaCode: "LE01 OA 03",
      oaSummary: "Identificar los sonidos que componen las palabras (conciencia fonológica)",
      activityType: "phonological",
      title: "Aplaude las Sílabas y Caza de Sonidos (M, P, L y S)",
      difficulty: "1° Básico • LE01 OA 03",
      dueDate: "Viernes, 18:00 hrs",
      urgent: false,
      status: "Pendiente",
      questionsCount: 5,
      estimatedTime: "8 min",
      voiceAIDefault: true,
      voiceCharacter: "Robot Leo",
      voiceAIPrompt: "Sigue el pulso de las sílabas con Robot Leo y di con qué letra o sílaba empieza cada palabra",
      description: "Juego rítmico de sílabas y sonidos iniciales (Mineduc LE01 OA 03 - Leo Primero). Aplaude las sílabas al ritmo y descubre el primer sonido.",
      disclaimerTtsText: "¡Hola! En Aplaude las Sílabas vamos a escuchar cómo suenan las palabras por partes y luego me dirás con qué sonido empiezan. Cuando estés listo, toca la barra espaciadora.",
      questions: [
        {
          number: 1,
          title: "Palabra 1 de 5 • Letra M",
          word: "MANO",
          syllables: "MA - NO",
          icon: "hand",
          targetLetter: "M",
          targetSyllable: "MA",
          text: "Escucha las sílabas <strong>MA - NO</strong>. ¿Con qué letra o sílaba empieza <strong>MANO</strong>?",
          speechAudioText: "Escuchemos la primera palabra por sílabas: MA... NO... Mano. ¿Con qué letra o sílaba empieza Mano? Dímelo con tu voz.",
          acceptedTokens: ["m", "eme", "ma", "mano", "con la m", "con m", "letra m"],
          options: [
            { value: "M", label: "Letra M (MA)", correct: true },
            { value: "P", label: "Letra P (PA)" },
            { value: "L", label: "Letra L (LA)" }
          ]
        },
        {
          number: 2,
          title: "Palabra 2 de 5 • Letra P",
          word: "PATO",
          syllables: "PA - TO",
          icon: "bird",
          targetLetter: "P",
          targetSyllable: "PA",
          text: "Escucha las sílabas <strong>PA - TO</strong>. ¿Con qué letra o sílaba empieza <strong>PATO</strong>?",
          speechAudioText: "Segunda palabra: PA... TO... Pato. ¿Con qué letra o sílaba empieza Pato?",
          acceptedTokens: ["p", "pe", "pa", "pato", "con la p", "con p", "letra p"],
          options: [
            { value: "M", label: "Letra M (MA)" },
            { value: "P", label: "Letra P (PA)", correct: true },
            { value: "S", label: "Letra S (SA)" }
          ]
        },
        {
          number: 3,
          title: "Palabra 3 de 5 • Letra L",
          word: "LUNA",
          syllables: "LU - NA",
          icon: "moon",
          targetLetter: "L",
          targetSyllable: "LU",
          text: "Escucha las sílabas <strong>LU - NA</strong>. ¿Con qué letra o sílaba empieza <strong>LUNA</strong>?",
          speechAudioText: "Tercera palabra: LU... NA... Luna. ¿Con qué letra o sílaba empieza Luna?",
          acceptedTokens: ["l", "ele", "lu", "luna", "con la l", "con l", "letra l"],
          options: [
            { value: "L", label: "Letra L (LU)", correct: true },
            { value: "M", label: "Letra M (MU)" },
            { value: "P", label: "Letra P (PU)" }
          ]
        },
        {
          number: 4,
          title: "Palabra 4 de 5 • Letra S",
          word: "SAPO",
          syllables: "SA - PO",
          icon: "smile",
          targetLetter: "S",
          targetSyllable: "SA",
          text: "Escucha las sílabas <strong>SA - PO</strong>. ¿Con qué letra o sílaba empieza <strong>SAPO</strong>?",
          speechAudioText: "Cuarta palabra: SA... PO... Sapo. ¿Con qué letra o sílaba empieza Sapo?",
          acceptedTokens: ["s", "ese", "sa", "sapo", "con la s", "con s", "letra s"],
          options: [
            { value: "P", label: "Letra P (PA)" },
            { value: "L", label: "Letra L (LA)" },
            { value: "S", label: "Letra S (SA)", correct: true }
          ]
        },
        {
          number: 5,
          title: "Palabra 5 de 5 • Sílabas con M",
          word: "MESA",
          syllables: "ME - SA",
          icon: "table-2",
          targetLetter: "M",
          targetSyllable: "ME",
          text: "Escucha las sílabas <strong>ME - SA</strong>. ¿Con qué letra o sílaba empieza <strong>MESA</strong>?",
          speechAudioText: "Última palabra: ME... SA... Mesa. ¿Con qué letra o sílaba empieza Mesa?",
          acceptedTokens: ["m", "eme", "me", "mesa", "con la m", "con m", "letra m"],
          options: [
            { value: "M", label: "Letra M (ME)", correct: true },
            { value: "S", label: "Letra S (SE)" },
            { value: "L", label: "Letra L (LE)" }
          ]
        }
      ]
    },
    {
      id: "act-len-2",
      subject: "Lenguaje y Comunicación",
      oaCode: "LE01 OA 18",
      oaSummary: "Comprender textos orales (relatos y fábulas) formulando y respondiendo preguntas oralmente",
      activityType: "story_comprehension",
      title: "Detective de Cuentos: La Zorra y las Uvas",
      difficulty: "1° Básico • LE01 OA 18",
      dueDate: "Lunes, 18:00 hrs",
      urgent: false,
      status: "Pendiente",
      questionsCount: 3,
      estimatedTime: "10 min",
      voiceAIDefault: true,
      voiceCharacter: "Robot Leo",
      voiceAIPrompt: "Completa las 3 piezas del Rompecabezas del Cuento respondiendo con tu voz",
      description: "Juego Detective de Cuentos (Mineduc LE01 OA 18). Cada respuesta correcta desbloquea una pieza del rompecabezas secreto de la fábula.",
      disclaimerTtsText: "¡Hola, Detective! Vamos a escuchar juntos el cuento de La Zorra y las Uvas. Por cada pregunta que respondas con tu voz, ganarás una pieza del rompecabezas del cuento.",
      storyTitle: "Fábula: La Zorra y las Uvas",
      storyText: "Había una vez una zorra muy hambrienta que caminaba por el bosque. De pronto, vio un racimo de uvas moradas y brillantes en lo alto de una rama. La zorra saltó una, dos y tres veces con todas sus fuerzas, pero no pudo alcanzarlas porque estaban demasiado altas. Finalmente, cansada de saltar, se alejó diciendo: Mejor no las como, seguro están verdes.",
      questions: [
        {
          number: 1,
          title: "Pista 1 de 3 • Pieza del Personaje",
          pieceLabel: "Pieza 1: Las Uvas Moradas",
          question: "¿Qué fruta quería comer la zorra en el bosque?",
          speechAudioText: "Primera pista de detective: ¿Qué fruta quería comer la zorra cuando caminaba por el bosque? Cuéntame con tu voz para ganar la primera pieza.",
          criterio: "El estudiante menciona que la zorra quería comer uvas (o un racimo de uvas moradas).",
          keywords: ["uva", "uvas", "racimo", "morada", "moradas"],
          hintText: "Eran pequeñas, moradas y colgaban en un racimo."
        },
        {
          number: 2,
          title: "Pista 2 de 3 • Pieza del Misterio",
          pieceLabel: "Pieza 2: La Rama Alta",
          question: "¿Por qué la zorra no pudo alcanzar las uvas aunque saltó muchas veces?",
          speechAudioText: "Segunda pista: ¿Por qué la zorra no pudo alcanzar las uvas aunque saltó con todas sus fuerzas? Dímelo con tus palabras.",
          criterio: "El estudiante explica que las uvas estaban muy altas, demasiado arriba en la rama, o muy lejos para alcanzarlas.",
          keywords: ["alta", "altas", "alto", "arriba", "lejos", "alcanzaba", "alcanzar", "llegaba", "llegar"],
          hintText: "Piensa en qué parte de la rama estaban las uvas."
        },
        {
          number: 3,
          title: "Pista 3 de 3 • Pieza de la Enseñanza",
          pieceLabel: "Pieza 3: El Secreto Final",
          question: "¿Qué dijo la zorra al final cuando se cansó de saltar y se fue?",
          speechAudioText: "Última pista para completar el rompecabezas: ¿Qué dijo la zorra sobre las uvas al final cuando se alejó?",
          criterio: "El estudiante menciona que la zorra dijo que estaban verdes, que no estaban maduras o que mejor no se las comía.",
          keywords: ["verde", "verdes", "madura", "maduras", "no las como", "no queria", "acida"],
          hintText: "Dijo que seguro las uvas todavía tenían color verde."
        }
      ]
    },
    {
      id: "act-tablas",
      subject: "Matemáticas",
      oaCode: "MA02 OA 11",
      oaSummary: "Demostrar que comprenden la multiplicación por 2 y por 5 mediante conteo por saltos y grupos iguales",
      activityType: "skip_counting",
      title: "Salta al Ritmo: Multiplicando por 2 y por 5",
      difficulty: "Desafío Rítmico • Tablas x2 y x5",
      dueDate: "Viernes, 18:00 hrs",
      urgent: false,
      status: "Pendiente",
      questionsCount: 10,
      estimatedTime: "6 min",
      voiceAIDefault: true,
      voiceCharacter: "Robot Leo",
      voiceAIPrompt: "Sigue los saltos de 2 en 2 y de 5 en 5 al ritmo de la música diciendo cada resultado en voz alta",
      description: "Juego rítmico de multiplicación inicial (Tablas del 2 y del 5). Salta por la recta numérica siguiendo el pulso y di los múltiplos a tiempo.",
      disclaimerTtsText: "¡Hola! En Salta al Ritmo vamos a multiplicar dando saltos de dos en dos y de cinco en cinco. Di cada número en voz alta apenas brille en la pantalla. Toca espacio para empezar."
    }
  ],

  // Actividades Alumno 2° Básico (Sofía)
  sofiaActivities: [
    {
      id: "act-sofia-2",
      subject: "Matemáticas",
      oaCode: "MA02 OA 11",
      oaSummary: "Demostrar que comprenden la multiplicación por 2 y por 5 usando representaciones concretas y pictóricas",
      activityType: "skip_counting",
      title: "Salta al Ritmo: Multiplicando por 2 y por 5",
      difficulty: "2° Básico • MA02 OA 11",
      dueDate: "Viernes 18:00 hrs",
      urgent: true,
      status: "Pendiente",
      questionsCount: 10,
      estimatedTime: "8 min",
      voiceAIDefault: true,
      voiceCharacter: "Robot Leo",
      voiceAIPrompt: "Sigue los saltos de 2 en 2 y de 5 en 5 al ritmo del compás diciendo cada resultado con tu voz",
      description: "Reto rítmico de tablas del 2 y del 5 (Mineduc MA02 OA 11). Cuenta de 2 en 2 hasta 20 y de 5 en 5 hasta 50 siguiendo el pulso.",
      disclaimerTtsText: "¡Hola Sofía! En Salta al Ritmo vamos a practicar las tablas del dos y del cinco siguiendo el compás. Di cada número fuerte cuando aparezca en el centro."
    },
    {
      id: "act-sofia-1",
      subject: "Lenguaje y Comunicación",
      oaCode: "LE02 OA 18",
      activityType: "story_comprehension",
      title: "Detective de Cuentos: La Zorra y las Uvas",
      difficulty: "2° Básico • LE02 OA 18",
      dueDate: "Jueves 17:00 hrs",
      urgent: true,
      status: "Pendiente",
      questionsCount: 3,
      estimatedTime: "10 min",
      voiceAIDefault: true,
      voiceCharacter: "Robot Leo",
      voiceAIPrompt: "Descubre las 3 piezas del rompecabezas de la fábula respondiendo con tu voz",
      description: "Escucha la narración hablada de la fábula y desbloquea las 3 piezas del rompecabezas respondiendo por voz.",
      disclaimerTtsText: "¡Hola Sofía! Escuchemos la fábula de La Zorra y las Uvas. Por cada respuesta que me des con tu voz, desbloquearás una pieza del rompecabezas.",
      storyTitle: "Fábula: La Zorra y las Uvas",
      storyText: "Había una vez una zorra muy hambrienta que caminaba por el bosque. De pronto, vio un racimo de uvas moradas y brillantes en lo alto de una rama. La zorra saltó una, dos y tres veces con todas sus fuerzas, pero no pudo alcanzarlas porque estaban demasiado altas. Finalmente, cansada de saltar, se alejó diciendo: Mejor no las como, seguro están verdes.",
      questions: [
        {
          number: 1,
          title: "Pista 1 de 3 • Pieza del Personaje",
          pieceLabel: "Pieza 1: Las Uvas Moradas",
          question: "¿Qué fruta quería comer la zorra en el bosque?",
          speechAudioText: "Hola Sofía. Primera pista: ¿Qué fruta quería comer la zorra en el bosque?",
          criterio: "El estudiante menciona las uvas.",
          keywords: ["uva", "uvas", "racimo"],
          hintText: "Era una fruta morada en racimo."
        },
        {
          number: 2,
          title: "Pista 2 de 3 • Pieza del Misterio",
          pieceLabel: "Pieza 2: La Rama Alta",
          question: "¿Por qué la zorra no pudo alcanzar las uvas?",
          speechAudioText: "Segunda pista: ¿Por qué la zorra no pudo alcanzar las uvas aunque saltó varias veces?",
          criterio: "Porque estaban muy altas.",
          keywords: ["alta", "altas", "alto", "arriba", "lejos"],
          hintText: "Estaban en lo más alto de la rama."
        },
        {
          number: 3,
          title: "Pista 3 de 3 • Pieza de la Enseñanza",
          pieceLabel: "Pieza 3: El Secreto Final",
          question: "¿Qué dijo la zorra al final cuando se cansó de saltar?",
          speechAudioText: "Tercera pista: ¿Qué dijo la zorra al final cuando decidió irse?",
          criterio: "Dijo que seguro estaban verdes.",
          keywords: ["verde", "verdes", "madura", "no las como"],
          hintText: "Dijo que aún estaban de color verde."
        }
      ]
    },
    {
      id: "act-sofia-3",
      subject: "Lenguaje y Comunicación",
      oaCode: "LE02 OA 21",
      activityType: "phonological",
      title: "Aplaude las Sílabas y Signos de Expresión",
      difficulty: "2° Básico • LE02 OA 21",
      dueDate: "18 Sep 2026",
      urgent: false,
      status: "En progreso",
      progressPercent: 60,
      questionsCount: 5,
      estimatedTime: "10 min",
      voiceAIDefault: true,
      voiceCharacter: "Robot Leo",
      description: "Juego rítmico de sílabas iniciales y entonación de oraciones en voz alta."
    },
    {
      id: "act-sofia-4",
      subject: "Matemáticas",
      oaCode: "MA02 OA 09",
      activityType: "addition",
      title: "Mercado de Robot Leo: Sumas hasta el 50",
      difficulty: "2° Básico • MA02 OA 09",
      dueDate: "Entregada el 01 Sep",
      urgent: false,
      status: "Entregada",
      score: "6.4 / 7.0",
      questionsCount: 5,
      estimatedTime: "12 min",
      voiceAIDefault: true,
      voiceCharacter: "Robot Leo",
      description: "Sube los peldaños del Mercado Mágico sumando cantidades con apoyo visual y voz."
    }
  ],

  // Obtener actividades según el estudiante seleccionado
  getStudentActivities(studentId) {
    if (studentId === 'alu-103') {
      return this.sofiaActivities;
    }
    return this.studentActivities;
  },

  // Obtener calificaciones según el estudiante seleccionado
  getStudentGrades(studentId) {
    if (studentId === 'alu-103') {
      return this.sofiaGradeHistory;
    }
    return this.gradeHistory;
  },

  // Asignar Actividades Profesor (Catálogo Oficial Mineduc: 2 Matemáticas y 2 Lenguaje)
  assignableActivities: [
    {
      id: "tpl-1",
      title: "Misión Conteo Mágico: Cuenta del 1 al 10 con Robot Leo (MA01 OA 01)",
      subject: "Matemáticas",
      assignedCourse: "1° Básico B",
      enabledStudents: 28,
      totalStudents: 28,
      voiceAIDefault: true,
      status: "Activa",
      openDate: "10 Oct 2026",
      closeDate: "17 Oct 2026"
    },
    {
      id: "tpl-2",
      title: "El Bosque de los Números: Sumas hasta el 10 con Voz (MA01 OA 09)",
      subject: "Matemáticas",
      assignedCourse: "1° Básico B",
      enabledStudents: 28,
      totalStudents: 28,
      voiceAIDefault: true,
      status: "Activa",
      openDate: "12 Oct 2026",
      closeDate: "19 Oct 2026"
    },
    {
      id: "tpl-3",
      title: "Caza de Sonidos: Sonido Inicial con M, P, L y S (LE01 OA 03)",
      subject: "Lenguaje y Comunicación",
      assignedCourse: "1° Básico B",
      enabledStudents: 28,
      totalStudents: 28,
      voiceAIDefault: true,
      status: "Activa",
      openDate: "14 Oct 2026",
      closeDate: "21 Oct 2026"
    },
    {
      id: "tpl-4",
      title: "Cuentos que Hablan: La Zorra y las Uvas (LE01 OA 18)",
      subject: "Lenguaje y Comunicación",
      assignedCourse: "1° Básico B",
      enabledStudents: 28,
      totalStudents: 28,
      voiceAIDefault: true,
      status: "Activa",
      openDate: "15 Oct 2026",
      closeDate: "22 Oct 2026"
    }
  ],

  // Mensajería (Familias de 1° y 2° Básico con Tía Marcela)
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
      lastMsg: "Circular N° 4: Horarios de apoyo en Lenguaje y Matemáticas.",
      lastTime: "01 Sep",
      avatarBg: "bg-purple-600",
      initials: "PC"
    }
  ],

  activeMessages: [
    {
      sender: "Tía Marcela Soto",
      role: "Profesora Jefe 1° Básico B",
      time: "Ayer a las 16:10",
      text: "Estimada Carolina, buenas tardes. Le comento que Mateo hoy realizó su primera actividad con el Agente de Voz IA en la sala. Como él aún está afianzando la lectura de textos largos, le ayudó muchísimo que el robot le leyera los problemas hablados con las frutas.",
      isSelf: false
    },
    {
      sender: "Carolina Tapia",
      role: "Apoderada",
      time: "Ayer a las 17:05",
      text: "Excelente noticia Tía Marcela. En la casa Mateo me contó muy entusiasmado que Robot Leo le hizo preguntas y que él le respondió hablando. Nos da mucha tranquilidad saber que no se frustra tratando de leer enunciados difíciles.",
      isSelf: true
    },
    {
      sender: "Tía Marcela Soto",
      role: "Profesora Jefe 1° Básico B",
      time: "Ayer a las 17:18",
      text: "Así es, esa es la meta de la IA por voz en 1° básico. Mañana continuaremos con la actividad de sumas y la próxima semana con la letra S. Saludos cordiales.",
      isSelf: false,
      readStatus: "Visto por la profesora"
    }
  ]
};

window.mockData = mockData;

