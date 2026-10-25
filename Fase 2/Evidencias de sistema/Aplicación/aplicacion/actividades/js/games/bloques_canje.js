/**
 * Minijuego 7: "El Laboratorio de Canje Decimal: Sumas con Reserva hasta el 50"
 * Mineduc MA02 OA 09 (Demostrar que comprenden la adición con canje/reserva con bloques multibase)
 */

window.minigameBloquesCanje = {
  id: 'act-sofia-4',
  title: 'Resolución de Problemas: Sumas con Reserva hasta el 50',
  subject: 'Matemáticas',
  oaCode: 'MA02 OA 09',
  studentGrade: '2° Básico',

  exercises: [
    {
      num1: 18,
      num2: 7,
      tens1: 1, units1: 8,
      tens2: 0, units2: 7,
      totalUnits: 15,
      canjeDone: false,
      correctResult: 25,
      options: [23, 25, 27]
    },
    {
      num1: 25,
      num2: 16,
      tens1: 2, units1: 5,
      tens2: 1, units2: 6,
      totalUnits: 11,
      canjeDone: false,
      correctResult: 41,
      options: [39, 41, 43]
    },
    {
      num1: 27,
      num2: 15,
      tens1: 2, units1: 7,
      tens2: 1, units2: 5,
      totalUnits: 12,
      canjeDone: false,
      correctResult: 42,
      options: [40, 42, 45]
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
    const ex = this.exercises[this.currentIndex];
    const progressPercent = (this.currentIndex / this.exercises.length) * 100;

    const totalTensInitial = ex.tens1 + ex.tens2;
    const currentTens = ex.canjeDone ? totalTensInitial + 1 : totalTensInitial;
    const currentUnits = ex.canjeDone ? ex.totalUnits - 10 : ex.totalUnits;

    let tensHtml = '';
    for (let i = 0; i < currentTens; i++) {
      tensHtml += `<div class="ten-rod" title="Barra de 10 unidades"></div>`;
    }

    let unitsHtml = '';
    for (let i = 0; i < currentUnits; i++) {
      unitsHtml += `<div class="unit-cube" title="Cubito de 1 unidad"></div>`;
    }

    const optionsHtml = ex.options.map(opt => `
      <button 
        type="button" 
        onclick="minigameBloquesCanje.handleAnswer(${opt})" 
        class="math-opt-btn"
      >
        <span>${opt}</span>
        <span class="label">${opt} total</span>
      </button>
    `).join('');

    const canjeButtonHtml = (!ex.canjeDone && ex.totalUnits >= 10) ? `
      <button 
        type="button" 
        onclick="minigameBloquesCanje.doCanje()" 
        class="btn-canje-magic"
      >
        ⚡ ¡Hacer Canje! (10 cubitos = 1 barra azul)
      </button>
    ` : `
      <div style="color: #0369a1; font-weight: 800; font-size: 0.95rem; text-align: center;">
        ✨ ¡Canje realizado! Ahora cuenta las barras y los cubitos sueltos:
      </div>
    `;

    this.container.innerHTML = `
      <div class="blocks-lab">
        <!-- Progreso -->
        <div class="stage-progress-bar-wrap">
          <div class="stage-progress-fill" style="width: ${progressPercent}%;"></div>
        </div>

        <!-- Diálogo con Robot Leo -->
        <div class="stage-leo-dialogue" style="width: 100%;">
          <div class="stage-leo-mini-avatar leo-avatar-slot" data-size="54">
            ${window.robotLeo.getSvgMarkup('happy', 54)}
          </div>
          <div class="stage-leo-bubble">
            <p>Laboratorio de Sumas: <strong>${ex.num1} + ${ex.num2}</strong>. Tenemos ${ex.totalUnits} cubitos sueltos. ¡Cuando juntamos 10 podemos canjearlos por 1 barra azul!</p>
            <span class="speech-hint">📦 Observa las barras de 10 y los cubitos sueltos</span>
          </div>
          <button type="button" class="btn-repeat-voice" onclick="minigameBloquesCanje.speakCurrent()" title="Repetir voz">
            🔊
          </button>
        </div>

        <!-- Ecuación Principal -->
        <div style="display: flex; justify-content: center; width: 100%;">
          <div class="equation-display-bubble">
            <span>${ex.num1}</span>
            <span>+</span>
            <span>${ex.num2}</span>
            <span>=</span>
            <span>❓</span>
          </div>
        </div>

        <!-- Mesa de Trabajo Multibase: Decenas y Unidades -->
        <div class="blocks-table">
          <div class="block-column">
            <h4>🔵 DECENAS (${currentTens} barras = ${currentTens * 10})</h4>
            <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; justify-content: center;">
              ${tensHtml}
            </div>
          </div>

          <div class="block-column">
            <h4>🟡 UNIDADES (${currentUnits} cubitos = ${currentUnits})</h4>
            <div style="display: flex; gap: 0.25rem; flex-wrap: wrap; justify-content: center; max-width: 200px;">
              ${unitsHtml}
            </div>
          </div>
        </div>

        ${canjeButtonHtml}

        <!-- Opciones de Resultado -->
        <div class="math-options-grid" style="align-self: center;">
          ${optionsHtml}
        </div>
      </div>
    `;
  },

  doCanje() {
    const ex = this.exercises[this.currentIndex];
    ex.canjeDone = true;
    window.soundEngine.playCorrect();
    window.soundEngine.playPop();
    window.robotLeo.speak("¡Magia decimal! Los 10 cubitos se transformaron en una nueva barra azul de 10. ¡Ese es el canje!");
    this.render();
  },

  handleAnswer(selected) {
    const ex = this.exercises[this.currentIndex];

    if (selected === ex.correctResult) {
      this.score++;
      window.soundEngine.playCorrect();
      window.robotLeo.speak(`¡Exacto! ${ex.num1} más ${ex.num2} es igual a ${ex.correctResult}.`);

      if (this.currentIndex + 1 < this.exercises.length) {
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
      window.robotLeo.speak("¡Cuenta nuevamente las decenas y las unidades sueltas!");
    }
  },

  speakCurrent() {
    const ex = this.exercises[this.currentIndex];
    window.robotLeo.speak(`¿Cuánto es ${ex.num1} más ${ex.num2}? Haz el canje con los bloques y presiona el resultado.`);
  },

  triggerVictory() {
    window.soundEngine.playFanfare();
    window.confettiEngine.burst(85);

    window.app.showVictoryModal({
      title: '¡Científica del Canje Decimal!',
      subtitle: `¡Comprendiste cómo funcionan las sumas con reserva y los bloques multibase!`,
      stars: 3,
      onReplay: () => this.start(this.container)
    });
  }
};
