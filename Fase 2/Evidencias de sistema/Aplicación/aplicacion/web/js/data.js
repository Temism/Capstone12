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
      title: "Misión Conteo Mágico: Cuenta del 1 al 10 con Robot Leo",
      difficulty: "1° Básico • MA01 OA 01",
      dueDate: "Hoy, 19:00 hrs",
      urgent: true,
      status: "Pendiente",
      questionsCount: 10,
      estimatedTime: "5 min",
      voiceAIDefault: true,
      voiceCharacter: "Robot Leo",
      voiceAIPrompt: "Robot Leo escuchará tu voz mientras cuentas del 1 al 10 en orden ascendente",
      description: "Desafío interactivo de voz (Mineduc MA01 OA 01). Cuenta en voz alta y en orden ascendente del uno al diez para iluminar tus tarjetas.",
      disclaimerTtsText: "Hola. Antes de comenzar, recuerda cuidar el ruido ambiente: busca un lugar tranquilo, apaga la musica o el televisor, y habla fuerte y claro cerca del microfono. En esta actividad debes contar en voz alta y en orden del uno al diez: uno, dos, tres, cuatro, cinco, seis, siete, ocho, nueve y diez. Presiona la barra espaciadora nuevamente para iniciar la actividad.",
      isCountingMission: true
    },
    {
      id: "act-mat-2",
      subject: "Matemáticas",
      oaCode: "MA01 OA 09",
      oaSummary: "Demostrar que comprenden la adición en el ámbito del 0 al 10 (Modelo COPISI)",
      activityType: "addition",
      title: "El Bosque de los Números: Sumas hasta el 10 con Voz",
      difficulty: "1° Básico • MA01 OA 09",
      dueDate: "Mañana, 18:00 hrs",
      urgent: true,
      status: "Pendiente",
      questionsCount: 5,
      estimatedTime: "8 min",
      voiceAIDefault: true,
      voiceCharacter: "Robot Leo",
      voiceAIPrompt: "Robot Leo te leerá 5 problemas de suma con apoyo visual y responderás con tu voz",
      description: "Adiciones progresivas hasta el 10 con apoyo pictórico y simbólico (Mineduc MA01 OA 09 - Modelo COPISI). Escucha cada problema y responde con tu voz.",
      disclaimerTtsText: "Hola. Antes de comenzar con las sumas del bosque, busca un lugar tranquilo sin ruidos ni televisor encendido. Robot Leo te contará cinco pequeñas historias de suma. Mira los dibujos en pantalla, junta las cantidades y di el resultado en voz alta. Presiona la barra espaciadora nuevamente para iniciar la actividad.",
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
      title: "Caza de Sonidos: Sonido Inicial con M, P, L y S",
      difficulty: "1° Básico • LE01 OA 03",
      dueDate: "Viernes, 18:00 hrs",
      urgent: false,
      status: "Pendiente",
      questionsCount: 5,
      estimatedTime: "8 min",
      voiceAIDefault: true,
      voiceCharacter: "Robot Leo",
      voiceAIPrompt: "Robot Leo pronunciará palabras y dirás con qué letra o sílaba comienzan",
      description: "Conciencia fonológica e identificación de fonemas y sílabas iniciales (Mineduc LE01 OA 03 - Leo Primero). Escucha y responde hablando.",
      disclaimerTtsText: "Hola. Antes de comenzar la caza de sonidos, asegúrate de estar en un lugar tranquilo y sin ruido de fondo. Robot Leo te dirá cinco palabras del programa Leo Primero y tú deberás decir en voz alta con qué letra o sílaba empiezan. Presiona la barra espaciadora nuevamente para iniciar la actividad.",
      questions: [
        {
          number: 1,
          title: "Palabra 1 de 5 • Letra M",
          word: "MANO",
          syllables: "MA - NO",
          icon: "hand",
          targetLetter: "M",
          targetSyllable: "MA",
          text: "Escucha la palabra <strong>M - A - N - O</strong> (MA - NO). ¿Con qué letra o sílaba comienza <strong>MANO</strong>?",
          speechAudioText: "Escucha con mucha atención la primera palabra: M, A, N, O... Mano. ¿Con qué letra o sílaba empieza la palabra Mano? Dilo en voz alta.",
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
          text: "Escucha la palabra <strong>P - A - T - O</strong> (PA - TO). ¿Con qué letra o sílaba comienza <strong>PATO</strong>?",
          speechAudioText: "Segunda palabra: P, A, T, O... Pato. ¿Con qué letra o sílaba comienza la palabra Pato? Dilo en el micrófono.",
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
          text: "Escucha la palabra <strong>L - U - N - A</strong> (LU - NA). ¿Con qué letra o sílaba comienza <strong>LUNA</strong>?",
          speechAudioText: "Tercera palabra: L, U, N, A... Luna. ¿Con qué letra o sílaba comienza la palabra Luna?",
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
          text: "Escucha la palabra <strong>S - A - P - O</strong> (SA - PO). ¿Con qué letra o sílaba comienza <strong>SAPO</strong>?",
          speechAudioText: "Cuarta palabra: S, A, P, O... Sapo. ¿Con qué letra o sílaba comienza la palabra Sapo?",
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
          text: "Escucha la palabra <strong>M - E - S - A</strong> (ME - SA). ¿Con qué letra o sílaba comienza <strong>MESA</strong>?",
          speechAudioText: "Última palabra: M, E, S, A... Mesa. ¿Con qué letra o sílaba empieza la palabra Mesa?",
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
      title: "Cuentos que Hablan: La Zorra y las Uvas",
      difficulty: "1° Básico • LE01 OA 18",
      dueDate: "Lunes, 18:00 hrs",
      urgent: false,
      status: "Pendiente",
      questionsCount: 3,
      estimatedTime: "10 min",
      voiceAIDefault: true,
      voiceCharacter: "Robot Leo",
      voiceAIPrompt: "Escucha la fábula narrada y responde 3 preguntas abiertas con tu propia voz",
      description: "Comprensión oral de textos narrados (Mineduc LE01 OA 18). Escucha la fábula y responde con tus propias palabras a través del micrófono.",
      disclaimerTtsText: "Hola. En esta actividad escucharemos el cuento de La Zorra y las Uvas. Recuerda estar en un lugar tranquilo sin ruido ambiente. Después de escuchar la historia, te haré tres preguntas y deberás responderlas hablando con tus propias palabras por el micrófono. Presiona la barra espaciadora nuevamente para comenzar.",
      storyTitle: "Fábula: La Zorra y las Uvas",
      storyText: "Había una vez una zorra muy hambrienta que caminaba por el bosque. De pronto, vio un racimo de uvas moradas y brillantes en lo alto de una rama. La zorra saltó una, dos y tres veces con todas sus fuerzas, pero no pudo alcanzarlas porque estaban demasiado altas. Finalmente, cansada de saltar, se alejó diciendo: Mejor no las como, seguro están verdes.",
      questions: [
        {
          number: 1,
          title: "Pregunta 1 de 3 • Comprensión explícita",
          question: "¿Qué fruta quería comer la zorra en el bosque?",
          speechAudioText: "Pregunta número uno sobre el cuento: ¿Qué fruta quería comer la zorra cuando caminaba por el bosque? Presiona la barra espaciadora y cuéntame con tu voz.",
          criterio: "El estudiante menciona que la zorra quería comer uvas (o un racimo de uvas moradas).",
          keywords: ["uva", "uvas", "racimo", "morada", "moradas"],
          hintText: "Recuerda qué vio colgando en lo alto de la rama: eran pequeñas, moradas y venían en un racimo."
        },
        {
          number: 2,
          title: "Pregunta 2 de 3 • Comprensión inferencial",
          question: "¿Por qué la zorra no pudo alcanzar las uvas aunque saltó muchas veces?",
          speechAudioText: "Pregunta número dos: ¿Por qué la zorra no pudo alcanzar las uvas aunque saltó con todas sus fuerzas? Dilo con tus propias palabras.",
          criterio: "El estudiante explica que las uvas estaban muy altas, demasiado arriba en la rama, o muy lejos para alcanzarlas.",
          keywords: ["alta", "altas", "alto", "arriba", "lejos", "alcanzaba", "alcanzar", "llegaba", "llegar"],
          hintText: "Piensa en qué lugar de la rama estaban las uvas cuando la zorra saltaba."
        },
        {
          number: 3,
          title: "Pregunta 3 de 3 • Reflexión del relato",
          question: "¿Qué dijo la zorra al final cuando se cansó de saltar y se fue?",
          speechAudioText: "Última pregunta del cuento: ¿Qué dijo la zorra sobre las uvas al final cuando se rindió y se alejó? Cuéntame con tu voz.",
          criterio: "El estudiante menciona que la zorra dijo que estaban verdes, que no estaban maduras o que mejor no se las comía.",
          keywords: ["verde", "verdes", "madura", "maduras", "no las como", "no queria", "acida"],
          hintText: "Al final, la zorra dijo que seguro las uvas aún tenían cierto color y no estaban listas para comer."
        }
      ]
    }
  ],

  // Actividades Alumno 2° Básico (Sofía)
  sofiaActivities: [
    {
      id: "act-sofia-1",
      subject: "Lenguaje y Comunicación",
      oaCode: "LE02 OA 18",
      activityType: "story_comprehension",
      title: "Fábulas Clásicas: La Zorra y las Uvas (Comprensión con Voz)",
      difficulty: "2° Básico • LE02 OA 18",
      dueDate: "Jueves 17:00 hrs",
      urgent: true,
      status: "Pendiente",
      questionsCount: 3,
      estimatedTime: "10 min",
      voiceAIDefault: true,
      voiceCharacter: "Robot Leo",
      voiceAIPrompt: "Robot Leo leerá la fábula y hará preguntas abiertas de comprensión oral",
      description: "Escucha la narración hablada de la fábula y descubre la enseñanza de la historia respondiendo por voz.",
      storyTitle: "Fábula: La Zorra y las Uvas",
      storyText: "Había una vez una zorra muy hambrienta que caminaba por el bosque. De pronto, vio un racimo de uvas moradas y brillantes en lo alto de una rama. La zorra saltó una, dos y tres veces con todas sus fuerzas, pero no pudo alcanzarlas porque estaban demasiado altas. Finalmente, cansada de saltar, se alejó diciendo: Mejor no las como, seguro están verdes.",
      questions: [
        {
          number: 1,
          title: "Pregunta 1 de 3",
          question: "¿Qué fruta quería comer la zorra en el bosque?",
          speechAudioText: "Hola Sofía. Primera pregunta: ¿Qué fruta quería comer la zorra en el bosque?",
          criterio: "El estudiante menciona las uvas.",
          keywords: ["uva", "uvas", "racimo"],
          hintText: "Era una fruta morada en racimo."
        },
        {
          number: 2,
          title: "Pregunta 2 de 3",
          question: "¿Por qué la zorra no pudo alcanzar las uvas?",
          speechAudioText: "Segunda pregunta: ¿Por qué la zorra no pudo alcanzar las uvas aunque saltó varias veces?",
          criterio: "Porque estaban muy altas.",
          keywords: ["alta", "altas", "alto", "arriba", "lejos"],
          hintText: "Estaban en lo más alto de la rama."
        },
        {
          number: 3,
          title: "Pregunta 3 de 3",
          question: "¿Qué dijo la zorra al final cuando se cansó de saltar?",
          speechAudioText: "Tercera pregunta: ¿Qué dijo la zorra al final cuando decidió irse?",
          criterio: "Dijo que seguro estaban verdes.",
          keywords: ["verde", "verdes", "madura", "no las como"],
          hintText: "Dijo que aún estaban de color verde."
        }
      ]
    },
    {
      id: "act-sofia-2",
      subject: "Matemáticas",
      oaCode: "MA02 OA 11",
      activityType: "addition",
      title: "El Reino de las Tablas: Multiplicando por 2 y por 5",
      difficulty: "2° Básico • MA02 OA 11",
      dueDate: "Viernes 18:00 hrs",
      urgent: false,
      status: "Pendiente",
      questionsCount: 5,
      estimatedTime: "12 min",
      voiceAIDefault: true,
      voiceCharacter: "Robot Leo",
      voiceAIPrompt: "Robot Leo te dirá los grupos de números para contar de 2 en 2 y sumar cantidades",
      description: "Practica el conteo reiterado y las primeras tablas de multiplicar con preguntas habladas."
    },
    {
      id: "act-sofia-3",
      subject: "Lenguaje y Comunicación",
      oaCode: "LE02 OA 21",
      activityType: "phonological",
      title: "Lectura de Oraciones y Reglas de Puntuación",
      difficulty: "2° Básico • LE02 OA 21",
      dueDate: "18 Sep 2026",
      urgent: false,
      status: "En progreso",
      progressPercent: 60,
      questionsCount: 5,
      estimatedTime: "12 min",
      voiceAIDefault: true,
      voiceCharacter: "Robot Leo",
      description: "Identificación de mayúsculas al inicio y punto final al terminar una idea."
    },
    {
      id: "act-sofia-4",
      subject: "Matemáticas",
      oaCode: "MA02 OA 09",
      activityType: "addition",
      title: "Resolución de Problemas: Sumas con Reserva hasta el 50",
      difficulty: "2° Básico • MA02 OA 09",
      dueDate: "Entregada el 01 Sep",
      urgent: false,
      status: "Entregada",
      score: "6.4 / 7.0",
      questionsCount: 5,
      estimatedTime: "14 min",
      voiceAIDefault: true,
      voiceCharacter: "Robot Leo",
      description: "Ejercicios guiados de cálculo mental y sumas con canje hasta el número 50."
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

