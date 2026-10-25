/**
 * Minijuego: "El Laboratorio de los Amigos del 10 (Parte-Parte-Todo)"
 * ALINEADO CON EXCEL FASE 1:
 * - Código: MA01 OA 06
 * - Eje: Números y operaciones
 * - Objetivo: "Componer y descomponer números del 0 a 20 de manera aditiva, en forma concreta, pictórica y simbólica."
 * - Indicador (métrica): "Compone y descompone un número hasta 20 de más de una forma, usando material concreto y notación simbólica."
 * - Actividades sugeridas: "Tableros parte-parte-todo; descomposición con dados y fichas; juegos de 'amigos del 10'."
 */

window.minigameAmigosDiez = {
  id: 'act-mat-descomposicion',
  title: 'Los Amigos del 10: Descomposición Parte-Parte-Todo',
  subject: 'Matemática',
  oaCode: 'MA01 OA 06',
  eje: 'Números y operaciones',
  indicador: 'Compone y descompone números hasta 20 usando tableros parte-parte-todo y fichas concretas.',
  actividadSugerida: 'Tableros parte-parte-todo y juego de los amigos del 10.',

  puzzles: [
    {
      total: 10,
      partA: 7,
      partB: null,
      correct: 3,
      icon: '💎',
      story: 'Queremos formar el número 10. Si en una parte tenemos 7 gemas, ¿cuántas gemas faltan en la otra parte?',
      options: [2, 3, 4]
    },
    {
      total: 10,
      partA: 5,
      partB: null,
      correct: 5,
      icon: '⭐',
      story: 'Amigos del 10: Tenemos 5 estrellitas doradas. ¿Cuál es su pareja gemela para llegar a 10?',
      options: [4, 5, 6]
    },
    {
      total: 10,
      partA: 8,
      partB: null,
      correct: 2,
      icon: '🍎',
      story: 'La canasta meta es de 10 manzanas. Ya pusimos 8 manzanas. ¿Cuántas faltan?',
      options: [1, 2, 3]
    },
    {
      total: 10,
      partA: 1,
      partB: null,
      correct: 9,
      icon: '🪙',
      story: 'Tenemos solo 1 moneda. ¿Cuántas monedas necesitamos para completar las 10 monedas?',
      options: [8, 9, 10]
    },
    {
      total: 20,
      partA: 15,
      partB: null,
      correct: 5,
      icon: '🚀',
      story: 'Desafío mayor hasta 20: El total es 20 cohetes. Una parte tiene 15 cohetes. ¿Cuántos hay en la otra parte?',
      options: [5, 6, 7]
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
    const p = this.puzzles[this.currentIndex];
    const progressPercent = (this.currentIndex / this.puzzles.length) * 100;

    let tokensA = '';
    for (let i = 0; i < p.partA; i++) {
      tokensA += `<span class="copisi-fruit-item" onclick="soundEngine.playPop()">${p.icon}</span>`;
    }

    const optionsHtml = p.options.map(opt => `
      <button 
        type="button" 
        onclick="minigameAmigosDiez.handleAnswer(${opt})" 
        class="math-opt-btn"
      >
        <span>${opt}</span>
        <span class="label">Faltan ${opt}</span>
      </button>
    `).join('');

    this.container.innerHTML = `
      <div class="forest-clearing" style="background: linear-gradient(180deg, #ecfdf5 0%, #d1fae5 100%); border-color: #10b981;">
        
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
            <p>${p.story}</p>
            <span class="speech-hint">🧩 Tablero Parte-Parte-Todo: Descomposición aditiva</span>
          </div>
          <button type="button" class="btn-repeat-voice" onclick="minigameAmigosDiez.speakCurrent()" title="Repetir voz">
            🔊
          </button>
        </div>

        <!-- Tablero Parte-Parte-Todo Visual -->
        <div class="parte-todo-board">
          <!-- TODO (Total) -->
          <div class="todo-circle">
            <span style="font-size: 0.8rem; font-weight: 800; color: #065f46; text-transform: uppercase;">TODO (TOTAL)</span>
            <span style="font-size: 2.2rem; font-weight: 900; color: #047857;">${p.total}</span>
          </div>

          <div style="font-size: 2rem; color: #059669; margin: -5px 0;">⬇️ ⬇️</div>

          <!-- PARTES -->
          <div class="partes-row">
            <div class="parte-box">
              <span class="parte-badge">PARTE 1: ${p.partA}</span>
              <div class="parte-tokens">${tokensA}</div>
            </div>

            <div class="copisi-plus-sign" style="width: 38px; height: 38px; font-size: 1.4rem;">+</div>

            <div class="parte-box" style="border-style: dashed; border-color: #059669;">
              <span class="parte-badge">PARTE 2: ❓</span>
              <div class="parte-tokens" style="min-height: 48px; display: flex; align-items: center; justify-content: center; font-size: 2rem; color: #059669;">
                ❓
              </div>
            </div>
          </div>
        </div>

        <!-- Opciones -->
        <div style="font-weight: 800; color: #065f46; font-size: 0.95rem; margin-top: 0.5rem;">
          ¿Qué número es el amigo que completa el ${p.total}?
        </div>
        <div class="math-options-grid" style="align-self: center;">
          ${optionsHtml}
        </div>
      </div>
    `;
  },

  handleAnswer(selected) {
    const p = this.puzzles[this.currentIndex];

    if (selected === p.correct) {
      this.score++;
      window.soundEngine.playCorrect();
      window.robotLeo.speak(`¡Exacto! ${p.partA} más ${p.correct} forman el todo: ${p.total}.`);

      if (this.currentIndex + 1 < this.puzzles.length) {
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
      window.robotLeo.speak(`¡Casi! Piensa cuánto le falta al ${p.partA} para llegar a ${p.total}.`);
    }
  },

  speakCurrent() {
    const p = this.puzzles[this.currentIndex];
    window.robotLeo.speak(`${p.story} Toca el número que completa el total.`);
  },

  triggerVictory() {
    window.soundEngine.playFanfare();
    window.confettiEngine.burst(85);

    window.app.showVictoryModal({
      title: '¡Experto en Descomposición (MA01 OA 06)!',
      subtitle: `¡Completaste todos los tableros Parte-Parte-Todo y los Amigos del 10 del Mineduc!`,
      stars: 3,
      onReplay: () => this.start(this.container)
    });
  }
};
