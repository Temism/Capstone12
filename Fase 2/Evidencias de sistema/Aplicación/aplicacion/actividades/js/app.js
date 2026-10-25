/**
 * Controlador Principal de la Suite de Minijuegos Didácticos EDUCONNECT
 * Totalmente alineado con el archivo Excel de la Fase 1:
 * "Objetivos_Aprendizaje_MINEDUC_1basico.xlsx"
 * (Matemática • Lenguaje y Comunicación • Ciencias Naturales)
 */

class DidacticActivitiesApp {
  constructor() {
    this.currentStudentId = 'mateo';
    this.currentSubjectFilter = 'todas';
    this.totalStars = parseInt(localStorage.getItem('educonnect_stars') || '28', 10);
    this.activeMinigame = null;

    this.students = {
      mateo: {
        id: 'mateo',
        name: 'Mateo González Tapia',
        shortName: 'Mateo',
        course: '1° Básico B',
        age: '6-7 años',
        avatar: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=150&auto=format&fit=crop&q=80',
        welcomeMessage: '¡Hola Mateo! Explora los minijuegos oficiales del Mineduc para 1° Básico: conteo espacial, sumas del bosque, patrones, conciencia fonológica y ciencias.'
      },
      sofia: {
        id: 'sofia',
        name: 'Sofía González Tapia',
        shortName: 'Sofía',
        course: '2° Básico A',
        age: '7-8 años',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        welcomeMessage: '¡Hola Sofía! Practica tus desafíos de 2° básico: tablas de multiplicar con la ranita, comprensión de fábulas y sumas con canje multibase.'
      }
    };

    // Catálogo de Juegos Estrictamente Mapeado al Excel Mineduc de Fase 1
    this.gamesCatalog = [
      // === MATEMÁTICA (1° BÁSICO) ===
      {
        id: 'act-conteo',
        studentId: 'mateo',
        title: 'El Cohete del Conteo en Saltos',
        subject: 'Matemática',
        bannerClass: 'math',
        iconVisual: '🚀',
        oaCode: 'MA01 OA 01',
        eje: 'Números y operaciones',
        mineducText: 'Contar números del 0 al 100 de 1 en 1, 2 en 2, 5 en 5 y 10 en 10 hacia adelante y atrás.',
        desc: 'Llena la batería del cohete contando de 1 en 1, de 2 en 2, de 5 en 5 o en cuenta regresiva según el estándar Mineduc.',
        estimatedTime: '5 min',
        handler: () => window.minigameConteo
      },
      {
        id: 'act-mat-descomposicion',
        studentId: 'mateo',
        title: 'Amigos del 10: Descomposición Parte-Parte-Todo',
        subject: 'Matemática',
        bannerClass: 'math',
        iconVisual: '🧩',
        oaCode: 'MA01 OA 06',
        eje: 'Números y operaciones',
        mineducText: 'Componer y descomponer números del 0 a 20 de manera aditiva, en forma concreta, pictórica y simbólica.',
        desc: 'Tablero interactivo parte-parte-todo con fichas y parejas numéricas que forman el 10 y el 20.',
        estimatedTime: '6 min',
        handler: () => window.minigameAmigosDiez
      },
      {
        id: 'act-mat-2',
        studentId: 'mateo',
        title: 'El Bosque de Sumas y Restas (COPISI)',
        subject: 'Matemática',
        bannerClass: 'math',
        iconVisual: '🍎',
        oaCode: 'MA01 OA 09',
        eje: 'Números y operaciones',
        mineducText: 'Demostrar que comprenden la adición y sustracción de números del 0 al 20 con modelo COPISI.',
        desc: 'Canastas pictóricas de manzanas, peces y flores donde sumas y restas cantidades antes de responder.',
        estimatedTime: '8 min',
        handler: () => window.minigameSumasBosque
      },
      {
        id: 'act-mat-patrones',
        studentId: 'mateo',
        title: 'El Tren de los Patrones Rítmicos y Numéricos',
        subject: 'Matemática',
        bannerClass: 'tables',
        iconVisual: '🚂',
        oaCode: 'MA01 OA 11',
        eje: 'Patrones y álgebra',
        mineducText: 'Reconocer, describir, crear y continuar patrones repetitivos y numéricos hasta el 20.',
        desc: 'Engancha los vagones correctos en el tren para continuar patrones geométricos y numéricos crecientes y decrecientes.',
        estimatedTime: '7 min',
        handler: () => window.minigamePatrones
      },

      // === LENGUAJE Y COMUNICACIÓN (1° BÁSICO) ===
      {
        id: 'act-len-1',
        studentId: 'mateo',
        title: 'La Caza de Burbujas Fonológicas',
        subject: 'Lenguaje y Comunicación',
        bannerClass: 'language',
        iconVisual: '🫧',
        oaCode: 'LE01 OA 03',
        eje: 'Lectura (Conciencia Fonológica)',
        mineducText: 'Identificar los sonidos que componen las palabras (conciencia fonológica): fonemas y sílabas.',
        desc: 'Explota las burbujas para atrapar los fonemas y sílabas iniciales (M, P, L, S) y palmotea las sílabas.',
        estimatedTime: '8 min',
        handler: () => window.minigameCazaSonidos
      },
      {
        id: 'act-len-2',
        studentId: 'mateo',
        title: 'Teatro de Cuentos: La Zorra y las Uvas',
        subject: 'Lenguaje y Comunicación',
        bannerClass: 'story',
        iconVisual: '🦊',
        oaCode: 'LE01 OA 08',
        eje: 'Lectura - Comprensión',
        mineducText: 'Demostrar comprensión de narraciones familiares extrayendo información explícita e implícita.',
        desc: 'Teatro animado con marionetas, narración hablada y preguntas de comprensión explícita, implícita y moraleja.',
        estimatedTime: '10 min',
        handler: () => window.minigameCuentoZorra
      },
      {
        id: 'act-len-escritura',
        studentId: 'mateo',
        title: 'El Detective de las Oraciones',
        subject: 'Lenguaje y Comunicación',
        bannerClass: 'language',
        iconVisual: '🔍',
        oaCode: 'LE01 OA 14',
        eje: 'Escritura',
        mineducText: 'Escribir oraciones completas para transmitir mensajes, usando mayúscula y punto final.',
        desc: 'Usa la lupa y los sellos dorados para estructurar oraciones completas con mayúscula al inicio y punto final.',
        estimatedTime: '7 min',
        handler: () => window.minigameDetectiveOraciones
      },

      // === CIENCIAS NATURALES (1° BÁSICO - HOJA 4 EXCEL FASE 1) ===
      {
        id: 'act-ciencias-seres-vivos',
        studentId: 'mateo',
        title: 'Safari: Seres Vivos vs Cosas No Vivas',
        subject: 'Ciencias Naturales',
        bannerClass: 'tables',
        iconVisual: '🌱',
        oaCode: 'CN01 OA 01',
        eje: 'Ciencias de la Vida',
        mineducText: 'Reconocer que los seres vivos crecen, responden a estímulos y necesitan agua, alimento y aire.',
        desc: 'Clasifica elementos en seres vivos o cosas no vivas y descubre sus necesidades vitales de supervivencia.',
        estimatedTime: '8 min',
        handler: () => window.minigameSeresVivos
      },
      {
        id: 'act-ciencias-sentidos',
        studentId: 'mateo',
        title: 'Laboratorio de los 5 Sentidos',
        subject: 'Ciencias Naturales',
        bannerClass: 'story',
        iconVisual: '👀',
        oaCode: 'CN01 OA 06',
        eje: 'Ciencias de la Vida',
        mineducText: 'Identificar la ubicación y función de los sentidos y medidas de protección y cuidado.',
        desc: 'Estaciones sensoriales para explorar la vista, oído, olfato, gusto y tacto con consejos de autocuidado.',
        estimatedTime: '8 min',
        handler: () => window.minigameCincoSentidos
      },

      // === 2° BÁSICO (SOFÍA) ===
      {
        id: 'act-sofia-1',
        studentId: 'sofia',
        title: 'Fábulas Clásicas y Moralejas',
        subject: 'Lenguaje y Comunicación',
        bannerClass: 'story',
        iconVisual: '🍇',
        oaCode: 'LE02 OA 18',
        eje: 'Lectura - Comprensión',
        mineducText: 'Comprender textos orales y fábulas identificando lecciones y valores morales.',
        desc: 'Escucha la narración hablada de La Zorra y las Uvas y analiza con Robot Leo las enseñanzas morales.',
        estimatedTime: '10 min',
        handler: () => window.minigameCuentoZorra
      },
      {
        id: 'act-sofia-2',
        studentId: 'sofia',
        title: 'La Ranita Saltarina: Tablas del 2 y del 5',
        subject: 'Matemática',
        bannerClass: 'tables',
        iconVisual: '🐸',
        oaCode: 'MA02 OA 11',
        eje: 'Números y operaciones',
        mineducText: 'Demostrar que comprenden las tablas de multiplicar del 2 y del 5 con conteo reiterado.',
        desc: 'Salta por los nenúfares del estanque de 2 en 2 y de 5 en 5 para dominar las tablas de multiplicar.',
        estimatedTime: '12 min',
        handler: () => window.minigameTablasRana
      },
      {
        id: 'act-sofia-3',
        studentId: 'sofia',
        title: 'Detective de Letras: Mayúsculas y Puntos',
        subject: 'Lenguaje y Comunicación',
        bannerClass: 'language',
        iconVisual: '🔍',
        oaCode: 'LE02 OA 21',
        eje: 'Escritura',
        mineducText: 'Escribir correctamente oraciones respetando mayúscula inicial y punto final.',
        desc: 'Inspecciona y estampa los sellos de mayúsculas y puntos en el reporte ortográfico de Sofía.',
        estimatedTime: '10 min',
        handler: () => window.minigameDetectiveOraciones
      },
      {
        id: 'act-sofia-4',
        studentId: 'sofia',
        title: 'Laboratorio de Canje Decimal hasta el 50',
        subject: 'Matemática',
        bannerClass: 'math',
        iconVisual: '📦',
        oaCode: 'MA02 OA 09',
        eje: 'Números y operaciones',
        mineducText: 'Demostrar que comprenden la adición con canje/reserva mediante bloques multibase.',
        desc: 'Canjea 10 cubitos amarillos sueltos por una nueva barra azul de diez para resolver sumas con reserva.',
        estimatedTime: '14 min',
        handler: () => window.minigameBloquesCanje
      }
    ];
  }

  init() {
    this.renderHeader();
    this.renderMascotBanner();
    this.renderCards();
    this.setupListeners();
  }

  getCurrentStudent() {
    return this.students[this.currentStudentId] || this.students.mateo;
  }

  setStudent(studentId) {
    if (this.students[studentId]) {
      this.currentStudentId = studentId;
      window.soundEngine.playPop();
      this.renderHeader();
      this.renderMascotBanner();
      this.renderCards();

      const st = this.getCurrentStudent();
      window.robotLeo.speak(`¡Cambiamos al perfil de ${st.shortName}! ${st.welcomeMessage}`);
    }
  }

  setFilter(subject) {
    this.currentSubjectFilter = subject;
    window.soundEngine.playPop();
    document.querySelectorAll('.filter-chip').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-filter') === subject);
    });
    this.renderCards();
  }

  renderHeader() {
    const student = this.getCurrentStudent();

    document.querySelectorAll('.student-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-student') === this.currentStudentId);
    });

    const starCountEl = document.getElementById('total-stars-count');
    if (starCountEl) starCountEl.textContent = `${this.totalStars} Estrellitas`;
  }

  renderMascotBanner() {
    const student = this.getCurrentStudent();
    const welcomeEl = document.getElementById('leo-welcome-text');
    if (welcomeEl) {
      welcomeEl.innerHTML = `
        <div class="leo-badge">⭐ OBJETIVOS DE APRENDIZAJE MINEDUC • EXCEL FASE 1</div>
        <h2>¡Hola ${student.shortName}! ¿A qué jugaremos hoy?</h2>
        <p>${student.welcomeMessage}</p>
        <div class="leo-btn-group">
          <button type="button" class="btn-leo-listen" onclick="window.app.speakWelcome()">
            🔊 Escuchar a Robot Leo
          </button>
        </div>
      `;
    }

    const mascotSlot = document.querySelector('.leo-mascot-container');
    if (mascotSlot) {
      mascotSlot.innerHTML = window.robotLeo.getSvgMarkup('happy', 140);
    }
  }

  speakWelcome() {
    const student = this.getCurrentStudent();
    window.robotLeo.speak(`¡Hola ${student.shortName}! Soy Robot Leo. Todas tus actividades están alineadas con los Objetivos de Aprendizaje del Mineduc del Excel de la Fase 1. ¡Toca cualquier tarjeta para jugar y aprender!`);
  }

  renderCards() {
    const grid = document.getElementById('games-grid');
    if (!grid) return;

    let filtered = this.gamesCatalog.filter(g => g.studentId === this.currentStudentId);
    if (this.currentSubjectFilter !== 'todas') {
      filtered = filtered.filter(g => g.subject === this.currentSubjectFilter);
    }

    grid.innerHTML = filtered.map(game => {
      let subjIcon = '🔢';
      if (game.subject === 'Lenguaje y Comunicación') subjIcon = '📚';
      if (game.subject === 'Ciencias Naturales') subjIcon = '🔬';

      return `
        <div class="game-card" onclick="window.app.openGame('${game.id}')">
          <div class="game-card-banner ${game.bannerClass}">
            <div class="game-badge">
              <span>${subjIcon}</span>
              <span>${game.subject}</span>
            </div>
            <div class="game-stars-badge">
              <span>⭐</span>
              <span>3 Estrellas</span>
            </div>
            <div class="game-icon-visual">${game.iconVisual}</div>
          </div>

          <div class="game-card-body">
            <div style="display: flex; gap: 0.35rem; align-items: center; margin-bottom: 0.4rem; flex-wrap: wrap;">
              <span class="game-oa-tag">${game.oaCode}</span>
              <span style="font-size: 0.75rem; font-weight: 700; color: #475569; background: #f1f5f9; padding: 0.2rem 0.5rem; border-radius: 8px;">${game.eje}</span>
            </div>
            <h3 class="game-card-title">${game.title}</h3>
            <p class="game-card-desc">${game.desc}</p>
            <div class="game-card-footer">
              <div class="game-time-meta">
                <span>⏱️</span>
                <span>${game.estimatedTime}</span>
              </div>
              <button type="button" class="game-play-btn">
                <span>¡Jugar!</span>
                <span>🎮</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  openGame(gameId) {
    const game = this.gamesCatalog.find(g => g.id === gameId);
    if (!game) return;

    window.soundEngine.playPop();
    const modal = document.getElementById('game-modal');
    const titleEl = document.getElementById('stage-game-title');
    const badgeEl = document.getElementById('stage-game-badge');
    const iconEl = document.getElementById('stage-game-icon');
    const canvasEl = document.getElementById('stage-game-canvas');

    if (titleEl) titleEl.textContent = game.title;
    if (badgeEl) badgeEl.textContent = `${game.subject} • ${game.oaCode} (${game.eje})`;
    if (iconEl) iconEl.textContent = game.iconVisual;

    modal.classList.add('active');

    this.activeMinigame = game.handler();
    if (this.activeMinigame && this.activeMinigame.start) {
      this.activeMinigame.start(canvasEl);
    }
  }

  closeGame() {
    window.soundEngine.playPop();
    window.robotLeo.stop();
    const modal = document.getElementById('game-modal');
    modal.classList.remove('active');
    const victoryModal = document.getElementById('victory-modal');
    if (victoryModal) victoryModal.classList.remove('active');
  }

  showVictoryModal({ title, subtitle, stars = 3, onReplay }) {
    const victoryModal = document.getElementById('victory-modal');
    if (!victoryModal) return;

    document.getElementById('victory-title').textContent = title;
    document.getElementById('victory-subtitle').textContent = subtitle;

    this.onReplayCallback = onReplay;

    this.totalStars += stars * 5;
    localStorage.setItem('educonnect_stars', this.totalStars.toString());
    const starCountEl = document.getElementById('total-stars-count');
    if (starCountEl) starCountEl.textContent = `${this.totalStars} Estrellitas`;

    victoryModal.classList.add('active');
  }

  replayActiveGame() {
    window.soundEngine.playPop();
    const victoryModal = document.getElementById('victory-modal');
    if (victoryModal) victoryModal.classList.remove('active');
    if (this.onReplayCallback) this.onReplayCallback();
  }

  setupListeners() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = document.getElementById('game-modal');
        if (modal && modal.classList.contains('active')) {
          this.closeGame();
        }
      }
    });
  }

  toggleSound() {
    const enabled = window.soundEngine.toggle();
    const icon = document.getElementById('sound-toggle-icon');
    if (icon) icon.textContent = enabled ? '🔊' : '🔇';
  }
}

window.app = new DidacticActivitiesApp();
document.addEventListener('DOMContentLoaded', () => window.app.init());
