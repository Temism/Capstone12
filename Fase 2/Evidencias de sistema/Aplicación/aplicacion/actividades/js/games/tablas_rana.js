/**
 * Minijuego 5: "La Ranita Saltarina: Tablas del 2 y del 5"
 * Mineduc MA02 OA 11 (Demostrar que comprenden las tablas de multiplicar del 2 y del 5)
 */

window.minigameTablasRana = {
  id: 'act-sofia-2',
  title: 'El Reino de las Tablas: Multiplicando por 2 y por 5',
  subject: 'Matemáticas',
  oaCode: 'MA02 OA 11',
  studentGrade: '2° Básico',

  challenges: [
    {
      mode: 'by2',
      title: 'Saltos de 2 en 2',
      prompt: 'Ayuda a la ranita a saltar de 2 en 2: ¿Qué número sigue después del 4?',
      current: 4,
      correct: 6,
      options: [5, 6, 8],
      step: 2
    },
    {
      mode: 'by2',
      title: 'Saltos de 2 en 2',
      prompt: '¡Sigue saltando de 2 en 2! Después del 6 viene...',
      current: 6,
      correct: 8,
      options: [7, 8, 9],
      step: 2
    },
    {
      mode: 'by2',
      title: 'Multiplicando por 2',
      prompt: 'Si la ranita da 5 saltos de 2 metros cada uno (2 x 5), ¿a qué número llega?',
      current: 8,
      correct: 10,
      options: [9, 10, 12],
      step: 2
    },
    {
      mode: 'by5',
      title: 'Saltos de 5 en 5',
      prompt: '¡Ahora con saltos gigantes de 5 en 5! 5, 10, 15... ¿Cuál sigue?',
      current: 15,
      correct: 20,
      options: [18, 20, 25],
      step: 5
    },
    {
      mode: 'by5',
      title: 'Multiplicando por 5',
      prompt: 'Si tenemos 5 grupos de 5 nenúfares (5 x 5), ¿cuántos nenúfares hay en total?',
      current: 20,
      correct: 25,
      options: [22, 25, 30],
      step: 5
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
    const c = this.challenges[this.currentIndex];
    const progressPercent = (this.currentIndex / this.challenges.length) * 100;

    const optionsHtml = c.options.map(opt => `
      <button 
        type="button" 
        onclick="minigameTablasRana.handleAnswer(${opt})" 
        class="math-opt-btn"
      >
        <span>${opt}</span>
        <span class="label">Nenúfar ${opt}</span>
      </button>
    `).join('');

    this.container.innerHTML = `
      <div class="pond-stage">
        <!-- Barra de Progreso -->
        <div class="stage-progress-bar-wrap">
          <div class="stage-progress-fill" style="width: ${progressPercent}%;"></div>
        </div>

        <!-- Diálogo con Robot Leo -->
        <div class="stage-leo-dialogue" style="width: 100%;">
          <div class="stage-leo-mini-avatar leo-avatar-slot" data-size="54">
            ${window.robotLeo.getSvgMarkup('happy', 54)}
          </div>
          <div class="stage-leo-bubble">
            <p>${c.prompt}</p>
            <span class="speech-hint">🐸 Ayuda a la Ranita René a saltar al nenúfar correcto</span>
          </div>
          <button type="button" class="btn-repeat-voice" onclick="minigameTablasRana.speakCurrent()" title="Repetir voz">
            🔊
          </button>
        </div>

        <!-- Estanque de Nenúfares -->
        <div class="pond-water">
          <div class="lily-pad has-frog">
            <span>${c.current}</span>
          </div>

          <div style="font-size: 2.2rem; color: #a5f3fc; animation: gentlePulse 1.5s infinite;">➡️</div>

          <div class="lily-pad" style="border-style: dashed; background: rgba(34, 197, 94, 0.45);">
            <span>❓</span>
          </div>
        </div>

        <!-- Opciones de Salto -->
        <div class="math-options-grid">
          ${optionsHtml}
        </div>
      </div>
    `;
  },

  handleAnswer(selected) {
    const c = this.challenges[this.currentIndex];

    if (selected === c.correct) {
      this.score++;
      window.soundEngine.playFrogJump();
      window.soundEngine.playCorrect();
      window.robotLeo.speak(`¡Genial salto! El siguiente número es ${c.correct}.`);

      if (this.currentIndex + 1 < this.challenges.length) {
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
      window.robotLeo.speak(`¡Cuidado con el agua! Recuerda que estamos sumando de ${c.step} en ${c.step}.`);
    }
  },

  speakCurrent() {
    const c = this.challenges[this.currentIndex];
    window.robotLeo.speak(c.prompt);
  },

  triggerVictory() {
    window.soundEngine.playFanfare();
    window.confettiEngine.burst(85);

    window.app.showVictoryModal({
      title: '¡Reina de las Tablas!',
      subtitle: `¡Completaste todos los saltos de las tablas del 2 y del 5!`,
      stars: 3,
      onReplay: () => this.start(this.container)
    });
  }
};
