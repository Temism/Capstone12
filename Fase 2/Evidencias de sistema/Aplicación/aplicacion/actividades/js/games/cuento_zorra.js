/**
 * Minijuego 4: "Teatro Mágico de Cuentos y Títeres: La Zorra y las Uvas"
 * ALINEADO CON EXCEL FASE 1:
 * - Código: LE01 OA 08 (y LE02 OA 18)
 * - Eje: Lectura - Comprensión
 * - Objetivo: "Demostrar comprensión de narraciones familiares extrayendo información explícita e implícita, respondiendo preguntas, recreando personajes y opinando sobre la lectura."
 * - Indicador (métrica): "Extrae información explícita e implícita y responde preguntas simples sobre una narración escuchada o leída."
 * - Actividades sugeridas: "Recuento de cuentos con títeres o dibujos; ronda de preguntas de comprensión (qué, quién, dónde, cuándo, por qué)."
 */

window.minigameCuentoZorra = {
  id: 'act-len-2',
  title: 'Teatro de Cuentos: La Zorra y las Uvas',
  subject: 'Lenguaje y Comunicación',
  oaCode: 'LE01 OA 08',
  eje: 'Lectura - Comprensión',
  indicador: 'Extrae información explícita e implícita y responde preguntas sobre una narración escuchada.',
  actividadSugerida: 'Recuento del cuento con títeres animados y ronda de preguntas de comprensión.',

  storyText: "Había una vez una zorra muy hambrienta que caminaba por el bosque. De pronto, vio un racimo de uvas moradas y brillantes en lo alto de una rama. La zorra saltó una, dos y tres veces con todas sus fuerzas, pero no pudo alcanzarlas porque estaban demasiado altas. Finalmente, cansada de saltar, se alejó diciendo: 'Mejor no las como, seguro están verdes'.",

  questions: [
    {
      type: 'explícita',
      q: '¿Qué fruta quería comer la zorra en el bosque? (Información explícita)',
      options: [
        { text: '🍇 Un racimo de uvas moradas en la rama', correct: true },
        { text: '🍎 Unas manzanas rojas caídas al suelo', correct: false },
        { text: '🍌 Un racimo de plátanos en una palmera', correct: false }
      ]
    },
    {
      type: 'implícita',
      q: '¿Por qué la zorra no pudo alcanzar las uvas? (Causa del conflicto)',
      options: [
        { text: '🌾 Estaban demasiado altas y fuera de su alcance', correct: true },
        { text: '😴 Porque le dio sueño y prefirió dormir una siesta', correct: false },
        { text: '🌧️ Porque un trueno la asustó y salió corriendo', correct: false }
      ]
    },
    {
      type: 'moraleja',
      q: '¿Qué dijo la zorra al final para disimular su cansancio? (Moraleja)',
      options: [
        { text: '🦊 Dijo: "Mejor no las como, seguro están verdes"', correct: true },
        { text: '🍯 Dijo: "Están demasiado ricas y dulces para mí"', correct: false },
        { text: '🐾 Dijo: "Volveré con una escalera de madera"', correct: false }
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
    this.tellStory();
  },

  render() {
    const q = this.questions[this.currentIndex];
    const progressPercent = (this.currentIndex / this.questions.length) * 100;

    const optionsHtml = q.options.map((opt, i) => `
      <button 
        type="button" 
        onclick="minigameCuentoZorra.handleAnswer(${i})" 
        class="story-opt-btn"
      >
        <span>${opt.text}</span>
      </button>
    `).join('');

    this.container.innerHTML = `
      <div class="theater-stage">
        
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

        <!-- Escenario de Títeres Animado -->
        <div class="theater-scene-viewport">
          <div class="grape-branch">
            <span class="grape-cluster">🍇</span>
          </div>

          <div id="fox-sprite" class="fox-character">🦊</div>
          <div id="fox-bubble" class="fox-dialogue-bubble">¡Seguro están verdes! 🍇</div>
        </div>

        <!-- Caja de Cuento y Controles -->
        <div class="story-narrator-box">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
            <strong style="color: #9a3412; font-size: 1.05rem;">📖 Fábula con Títeres: La Zorra y las Uvas</strong>
            <button 
              type="button" 
              onclick="minigameCuentoZorra.tellStory()" 
              class="btn-leo-listen" 
              style="padding: 0.4rem 0.9rem; font-size: 0.85rem;"
            >
              🔊 Re-escuchar Narración
            </button>
          </div>
          <p id="story-text-p">${this.storyText}</p>
        </div>

        <!-- Pregunta Interactiva -->
        <div class="story-quiz-question">
          <h4>Pregunta ${this.currentIndex + 1} de ${this.questions.length}: ${q.q}</h4>
          <div class="story-options-list">
            ${optionsHtml}
          </div>
        </div>
      </div>
    `;
  },

  tellStory() {
    const fox = document.getElementById('fox-sprite');
    const bubble = document.getElementById('fox-bubble');

    window.robotLeo.speak(this.storyText, () => {
      if (fox) {
        fox.classList.add('jumping');
        window.soundEngine.playPop();
        setTimeout(() => {
          fox.classList.remove('jumping');
          if (bubble) bubble.style.display = 'block';
        }, 1000);
      }
    });

    setTimeout(() => {
      if (fox) {
        fox.classList.add('jumping');
        window.soundEngine.playPop();
        setTimeout(() => fox.classList.remove('jumping'), 900);
      }
    }, 4500);
  },

  handleAnswer(idx) {
    const q = this.questions[this.currentIndex];
    const chosen = q.options[idx];

    if (chosen.correct) {
      this.score++;
      window.soundEngine.playCorrect();
      window.robotLeo.speak("¡Excelente respuesta! Comprendiste muy bien la narración.");

      if (this.currentIndex + 1 < this.questions.length) {
        this.currentIndex++;
        setTimeout(() => {
          this.render();
          const nextQ = this.questions[this.currentIndex];
          window.robotLeo.speak(nextQ.q);
        }, 1300);
      } else {
        setTimeout(() => this.triggerVictory(), 1000);
      }
    } else {
      window.soundEngine.playRetry();
      window.robotLeo.speak("¡Piénsalo bien! Recuerda lo que escuchamos en la historia.");
    }
  },

  triggerVictory() {
    window.soundEngine.playFanfare();
    window.confettiEngine.burst(85);

    window.app.showVictoryModal({
      title: '¡Comprensión Exitosa (LE01 OA 08)!',
      subtitle: `¡Demostraste comprensión lectora de narraciones extrayendo información explícita e implícita!`,
      stars: 3,
      onReplay: () => this.start(this.container)
    });
  }
};
