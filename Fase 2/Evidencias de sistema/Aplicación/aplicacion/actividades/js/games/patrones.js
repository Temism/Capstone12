/**
 * Minijuego: "El Tren de los Patrones Rítmicos y Numéricos"
 * ALINEADO CON EXCEL FASE 1:
 * - Código: MA01 OA 11
 * - Eje: Patrones y álgebra
 * - Objetivo: "Reconocer, describir, crear y continuar patrones repetitivos y patrones numéricos hasta el 20, crecientes y decrecientes, usando material concreto, pictórico y simbólico."
 * - Indicador (métrica): "Reconoce, crea y continúa patrones repetitivos y numéricos (crecientes y decrecientes) hasta 20."
 * - Actividades sugeridas: "Secuencias con bloques de colores o cuentas; patrones sonoros y de movimiento; completar tablas numéricas con patrones."
 */

window.minigamePatrones = {
  id: 'act-mat-patrones',
  title: 'El Tren de los Patrones Rítmicos y Numéricos',
  subject: 'Matemática',
  oaCode: 'MA01 OA 11',
  eje: 'Patrones y álgebra',
  indicador: 'Reconoce, crea y continúa patrones repetitivos y numéricos (crecientes y decrecientes) hasta 20.',
  actividadSugerida: 'Secuencias con figuras, sonidos y completar vagones con patrones.',

  levels: [
    {
      title: 'Patrón 1: Figuras geométricas alternadas (AB-AB)',
      prompt: 'Observa los vagones: 🔴 Círculo, 🔷 Rombo, 🔴 Círculo... ¿Qué figura sigue?',
      sequence: ['🔴', '🔷', '🔴', '🔷', '🔴'],
      correct: '🔷',
      options: ['🔷', '🔴', '⭐']
    },
    {
      title: 'Patrón 2: Elementos del bosque (AAB-AAB)',
      prompt: 'Secuencia: 🌲 Pino, 🌲 Pino, 🍄 Hongo, 🌲 Pino, 🌲 Pino... ¿Cuál viene ahora?',
      sequence: ['🌲', '🌲', '🍄', '🌲', '🌲'],
      correct: '🍄',
      options: ['🌲', '🍄', '🌸']
    },
    {
      title: 'Patrón 3: Numérico Creciente (+2)',
      prompt: 'Vagones numéricos: 2, 4, 6, 8... ¿Qué número continúa el patrón que suma 2?',
      sequence: ['2', '4', '6', '8'],
      correct: '10',
      options: ['9', '10', '12']
    },
    {
      title: 'Patrón 4: Numérico Creciente (+5)',
      prompt: 'Secuencia de 5 en 5: 5, 10, 15... ¿Qué número completa el siguiente vagón?',
      sequence: ['5', '10', '15'],
      correct: '20',
      options: ['18', '20', '25']
    },
    {
      title: 'Patrón 5: Numérico Decreciente (-1)',
      prompt: 'Cuenta regresiva en los vagones: 10, 9, 8, 7... ¿Qué número sigue hacia atrás?',
      sequence: ['10', '9', '8', '7'],
      correct: '6',
      options: ['5', '6', '8']
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
    const lvl = this.levels[this.currentIndex];
    const progressPercent = (this.currentIndex / this.levels.length) * 100;

    const trainCarsHtml = lvl.sequence.map((item, idx) => `
      <div class="train-car" style="animation-delay: ${idx * 0.1}s;">
        <span class="train-car-wheel left"></span>
        <span class="train-car-content">${item}</span>
        <span class="train-car-wheel right"></span>
      </div>
    `).join('') + `
      <div class="train-car target-slot">
        <span class="train-car-wheel left"></span>
        <span class="train-car-content">❓</span>
        <span class="train-car-wheel right"></span>
      </div>
    `;

    const optionsHtml = lvl.options.map(opt => `
      <button 
        type="button" 
        onclick="minigamePatrones.handleAnswer('${opt}')" 
        class="math-opt-btn"
        style="min-width: 100px;"
      >
        <span>${opt}</span>
        <span class="label">Siguiente</span>
      </button>
    `).join('');

    this.container.innerHTML = `
      <div class="forest-clearing" style="background: linear-gradient(180deg, #fef3c7 0%, #ede9fe 100%); border-color: #a855f7;">
        
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

        <!-- Progreso -->
        <div class="stage-progress-bar-wrap" style="width: 100%;">
          <div class="stage-progress-fill" style="width: ${progressPercent}%;"></div>
        </div>

        <!-- Diálogo con Robot Leo -->
        <div class="stage-leo-dialogue" style="width: 100%;">
          <div class="stage-leo-mini-avatar leo-avatar-slot" data-size="54">
            ${window.robotLeo.getSvgMarkup('happy', 54)}
          </div>
          <div class="stage-leo-bubble">
            <p><strong>${lvl.title}</strong>: ${lvl.prompt}</p>
            <span class="speech-hint">🚂 Mineduc MA01 OA 11: Descubre la regla del patrón</span>
          </div>
          <button type="button" class="btn-repeat-voice" onclick="minigamePatrones.speakCurrent()" title="Repetir voz">
            🔊
          </button>
        </div>

        <!-- El Tren de los Patrones con Vías -->
        <div class="train-track-container">
          <div class="train-locomotive">🚂</div>
          <div class="train-cars-row">
            ${trainCarsHtml}
          </div>
        </div>

        <!-- Opciones para Enganchar el Vagón -->
        <div style="font-weight: 800; color: #6b21a8; font-size: 0.95rem; margin-top: 0.5rem;">
          ¿Qué vagón continúa el patrón correctamente?
        </div>
        <div class="math-options-grid" style="align-self: center;">
          ${optionsHtml}
        </div>
      </div>
    `;
  },

  handleAnswer(selected) {
    const lvl = this.levels[this.currentIndex];

    if (selected === lvl.correct) {
      this.score++;
      window.soundEngine.playCorrect();
      window.robotLeo.speak(`¡Excelente! El vagón ${selected} completa el patrón a la perfección.`);

      if (this.currentIndex + 1 < this.levels.length) {
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
      window.robotLeo.speak("¡Observa bien la repetición! Fíjate qué elemento se repite en orden.");
    }
  },

  speakCurrent() {
    const lvl = this.levels[this.currentIndex];
    window.robotLeo.speak(lvl.prompt);
  },

  triggerVictory() {
    window.soundEngine.playFanfare();
    window.confettiEngine.burst(85);

    window.app.showVictoryModal({
      title: '¡Maestro de los Patrones (MA01 OA 11)!',
      subtitle: `¡Completaste con éxito todos los patrones repetitivos y numéricos del estándar Mineduc!`,
      stars: 3,
      onReplay: () => this.start(this.container)
    });
  }
};
