/**
 * Minijuego 3: "La Caza de Burbujas Fonológicas"
 * ALINEADO CON EXCEL FASE 1:
 * - Código: LE01 OA 03
 * - Eje: Lectura (Conciencia Fonológica)
 * - Objetivo: "Identificar los sonidos que componen las palabras (conciencia fonológica), reconociendo, separando y combinando sus fonemas y sílabas."
 * - Indicador (métrica): "Reconoce, separa y combina fonemas y sílabas al escuchar o pronunciar palabras."
 * - Actividades sugeridas: "Juegos de rimas y palmoteo silábico; 'veo veo' con sonido inicial; separar palabras en sílabas con material concreto."
 */

window.minigameCazaSonidos = {
  id: 'act-len-1',
  title: 'Caza de Sonidos: Fonemas y Sílabas Iniciales',
  subject: 'Lenguaje y Comunicación',
  oaCode: 'LE01 OA 03',
  eje: 'Lectura (Conciencia Fonológica)',
  indicador: 'Reconoce, separa y combina fonemas y sílabas al escuchar o pronunciar palabras.',
  actividadSugerida: 'Juegos de palmoteo silábico y "veo-veo" con sonido inicial del programa Leo Primero.',

  words: [
    {
      word: 'MANO',
      syllables: 'MA - NO',
      syllablesCount: 2,
      icon: '✋',
      targetLetter: 'M',
      targetSyllable: 'MA',
      bubbles: [
        { letter: 'M', syllable: 'MA', correct: true },
        { letter: 'P', syllable: 'PA', correct: false },
        { letter: 'L', syllable: 'LA', correct: false }
      ]
    },
    {
      word: 'PATO',
      syllables: 'PA - TO',
      syllablesCount: 2,
      icon: '🦆',
      targetLetter: 'P',
      targetSyllable: 'PA',
      bubbles: [
        { letter: 'M', syllable: 'MA', correct: false },
        { letter: 'P', syllable: 'PA', correct: true },
        { letter: 'S', syllable: 'SA', correct: false }
      ]
    },
    {
      word: 'LUNA',
      syllables: 'LU - NA',
      syllablesCount: 2,
      icon: '🌙',
      targetLetter: 'L',
      targetSyllable: 'LU',
      bubbles: [
        { letter: 'L', syllable: 'LU', correct: true },
        { letter: 'M', syllable: 'MU', correct: false },
        { letter: 'P', syllable: 'PU', correct: false }
      ]
    },
    {
      word: 'SAPO',
      syllables: 'SA - PO',
      syllablesCount: 2,
      icon: '🐸',
      targetLetter: 'S',
      targetSyllable: 'SA',
      bubbles: [
        { letter: 'P', syllable: 'PA', correct: false },
        { letter: 'L', syllable: 'LA', correct: false },
        { letter: 'S', syllable: 'SA', correct: true }
      ]
    },
    {
      word: 'MESA',
      syllables: 'ME - SA',
      syllablesCount: 2,
      icon: '🪑',
      targetLetter: 'M',
      targetSyllable: 'ME',
      bubbles: [
        { letter: 'M', syllable: 'ME', correct: true },
        { letter: 'S', syllable: 'SE', correct: false },
        { letter: 'L', syllable: 'LE', correct: false }
      ]
    }
  ],

  currentIndex: 0,
  score: 0,

  start(container) {
    this.container = container;
    this.currentIndex = 0;
    this.score = 0;
    this.render();
    this.speakCurrent();
  },

  render() {
    const w = this.words[this.currentIndex];
    const progressPercent = (this.currentIndex / this.words.length) * 100;

    const bubblesHtml = w.bubbles.map((b, idx) => `
      <div 
        class="phonics-bubble" 
        onclick="minigameCazaSonidos.handleBubbleClick(${idx})"
      >
        <span class="bubble-letter">${b.letter}</span>
        <span class="bubble-syllable">(${b.syllable})</span>
      </div>
    `).join('');

    this.container.innerHTML = `
      <div class="phonics-stage">
        
        <!-- Ficha Técnica Mineduc (Excel Fase 1) -->
        <div class="mineduc-curriculum-pill" style="width: 100%;">
          <div class="curriculum-tag">
            <span class="badge-mineduc">MINEDUC OFICIAL</span>
            <strong>${this.oaCode}</strong> • Eje: ${this.eje}
          </div>
          <div class="curriculum-desc">
            <strong>Métrica observable:</strong> ${this.indicador}
          </div>
        </div>

        <!-- Barra de Progreso -->
        <div class="stage-progress-bar-wrap" style="width: 100%;">
          <div class="stage-progress-fill" style="width: ${progressPercent}%;"></div>
        </div>

        <!-- Diálogo con Robot Leo -->
        <div class="stage-leo-dialogue" style="width: 100%;">
          <div class="stage-leo-mini-avatar leo-avatar-slot" data-size="54">
            ${window.robotLeo.getSvgMarkup('happy', 54)}
          </div>
          <div class="stage-leo-bubble">
            <p>Veo-veo una cosita que empieza con... <strong>${w.word}</strong> (${w.syllables}). ¡Explota la burbuja de su sonido inicial!</p>
            <span class="speech-hint">🫧 Conciencia fonológica: Sonido inicial y palmoteo</span>
          </div>
          <button type="button" class="btn-repeat-voice" onclick="minigameCazaSonidos.speakCurrent()" title="Repetir palabra">
            🔊
          </button>
        </div>

        <!-- Tarjeta de la Palabra Destacada con Palmoteo Silábico -->
        <div class="word-hero-card">
          <div class="word-hero-icon">${w.icon}</div>
          <div class="word-hero-details">
            <span style="font-size: 0.85rem; font-weight: 800; color: #a855f7; text-transform: uppercase;">Programa Leo Primero</span>
            <h4>${w.word}</h4>
            <div style="display: flex; gap: 0.5rem; align-items: center; margin-top: 0.35rem;">
              <div class="word-syllables-tag">Sílabas: ${w.syllables}</div>
              <button 
                type="button" 
                onclick="soundEngine.playPop(); soundEngine.playPop();" 
                class="filter-chip" 
                style="padding: 0.2rem 0.6rem; font-size: 0.8rem; background: #faf5ff; border-color: #d8b4fe;"
                title="Palmotear sílabas"
              >
                👏 2 Palmas
              </button>
            </div>
          </div>
        </div>

        <!-- Arena de Burbujas Mágicas Flotantes -->
        <div class="bubbles-play-arena">
          ${bubblesHtml}
        </div>
      </div>
    `;
  },

  handleBubbleClick(idx) {
    const w = this.words[this.currentIndex];
    const chosen = w.bubbles[idx];

    if (chosen.correct) {
      this.score++;
      window.soundEngine.playPop();
      window.soundEngine.playCorrect();
      window.robotLeo.speak(`¡Excelente! ${w.word} comienza con la letra ${chosen.letter}, sílaba ${chosen.syllable}.`);

      if (this.currentIndex + 1 < this.words.length) {
        this.currentIndex++;
        setTimeout(() => {
          this.render();
          this.speakCurrent();
        }, 1300);
      } else {
        setTimeout(() => this.triggerVictory(), 1000);
      }
    } else {
      window.soundEngine.playRetry();
      window.robotLeo.speak(`¡Casi! Escucha de nuevo: ${w.word}. ¿Con qué letra empieza?`);
    }
  },

  speakCurrent() {
    const w = this.words[this.currentIndex];
    window.robotLeo.speak(`Veo veo... La palabra es: ${w.word}. Sílabas: ${w.syllables}. ¿Con qué sonido o sílaba empieza ${w.word}? Explota la burbuja correcta.`);
  },

  triggerVictory() {
    window.soundEngine.playFanfare();
    window.confettiEngine.burst(85);

    window.app.showVictoryModal({
      title: '¡Cazador de Sonidos (LE01 OA 03)!',
      subtitle: `¡Alcanzaste el indicador de conciencia fonológica y segmentación silábica del Mineduc!`,
      stars: 3,
      onReplay: () => this.start(this.container)
    });
  }
};
