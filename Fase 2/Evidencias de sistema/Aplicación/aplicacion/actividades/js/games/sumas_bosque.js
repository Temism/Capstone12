/**
 * Minijuego 2: "El Bosque Mágico de Sumas y Restas"
 * ALINEADO CON EXCEL FASE 1:
 * - Código: MA01 OA 09
 * - Eje: Números y operaciones
 * - Objetivo: "Demostrar que comprenden la adición y la sustracción de números del 0 al 20 progresivamente, usando lenguaje cotidiano, material concreto y pictórico, forma simbólica, resolución de problemas y creación de problemas propios."
 * - Indicador (métrica): "Resuelve y crea problemas de adición y sustracción hasta 20 usando estrategias concretas, pictóricas y simbólicas."
 * - Actividades sugeridas: "Problemas contextualizados (comprar/vender, repartir); dramatización de situaciones cotidianas; los estudiantes inventan y resuelven sus propios problemas."
 */

window.minigameSumasBosque = {
  id: 'act-mat-2',
  title: 'El Bosque de los Números: Sumas y Restas (COPISI)',
  subject: 'Matemática',
  oaCode: 'MA01 OA 09',
  eje: 'Números y operaciones',
  indicador: 'Resuelve problemas de adición y sustracción hasta 20 usando estrategias concretas y pictóricas.',
  actividadSugerida: 'Problemas contextualizados de repartir y recolectar con soporte pictórico.',

  questions: [
    {
      num: 1,
      type: 'add',
      title: 'Problema 1: Canasta de Manzanas',
      story: 'En el árbol hay 2 manzanas rojas y caen a la canasta 1 manzana más.',
      countA: 2,
      countB: 1,
      op: '+',
      icon: '🍎',
      labelA: '2 Manzanas',
      labelB: '1 Manzana más',
      correct: 3,
      options: [2, 3, 4]
    },
    {
      num: 2,
      type: 'add',
      title: 'Problema 2: Estrellitas Mágicas',
      story: 'En el cielo brillan 3 estrellitas y aparecen 2 estrellitas más.',
      countA: 3,
      countB: 2,
      op: '+',
      icon: '⭐',
      labelA: '3 Estrellitas',
      labelB: '2 Estrellitas más',
      correct: 5,
      options: [4, 5, 6]
    },
    {
      num: 3,
      type: 'sub',
      title: 'Problema 3: Pececitos en el Arroyo (Sustracción)',
      story: 'Había 6 pececitos nadando juntos y 2 pececitos se fueron a jugar al fondo.',
      countA: 6,
      countB: 2,
      op: '-',
      icon: '🐟',
      labelA: '6 Pececitos iniciales',
      labelB: 'Se van 2 pececitos',
      correct: 4,
      options: [3, 4, 5]
    },
    {
      num: 4,
      type: 'add',
      title: 'Problema 4: Flores del Jardín Silvestre',
      story: 'En el prado brotaron 5 flores silvestres y luego florecieron 3 más.',
      countA: 5,
      countB: 3,
      op: '+',
      icon: '🌸',
      labelA: '5 Flores',
      labelB: '3 Flores más',
      correct: 8,
      options: [7, 8, 9]
    },
    {
      num: 5,
      type: 'sub',
      title: 'Problema 5: Pinitos del Bosque (Sustracción)',
      story: 'Había 10 piñas en la colina y el conejito se llevó 3 piñas para su madriguera.',
      countA: 10,
      countB: 3,
      op: '-',
      icon: '🌲',
      labelA: '10 Piñas en la colina',
      labelB: 'Se lleva 3 piñas',
      correct: 7,
      options: [6, 7, 8]
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
    const q = this.questions[this.currentIndex];
    const progressPercent = ((this.currentIndex) / this.questions.length) * 100;

    let itemsHtmlA = '';
    for (let i = 0; i < q.countA; i++) {
      itemsHtmlA += `<span class="copisi-fruit-item" onclick="soundEngine.playPop()">${q.icon}</span>`;
    }

    let itemsHtmlB = '';
    for (let i = 0; i < q.countB; i++) {
      const crossed = q.op === '-' ? 'opacity: 0.6; filter: grayscale(80%);' : '';
      itemsHtmlB += `<span class="copisi-fruit-item" style="${crossed}" onclick="soundEngine.playPop()">${q.icon}</span>`;
    }

    const optionsHtml = q.options.map(opt => `
      <button 
        type="button" 
        onclick="minigameSumasBosque.handleAnswer(${opt})" 
        class="math-opt-btn"
      >
        <span>${opt}</span>
        <span class="label">${opt} resultado</span>
      </button>
    `).join('');

    this.container.innerHTML = `
      <div class="forest-clearing">
        
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

        <!-- Diálogo Leo -->
        <div class="stage-leo-dialogue" style="width: 100%;">
          <div class="stage-leo-mini-avatar leo-avatar-slot" data-size="54">
            ${window.robotLeo.getSvgMarkup('happy', 54)}
          </div>
          <div class="stage-leo-bubble">
            <p>${q.story} ¿Cuántos quedan en total?</p>
            <span class="speech-hint">💡 Modelo COPISI: Cuenta las figuras pictóricas</span>
          </div>
          <button type="button" class="btn-repeat-voice" onclick="minigameSumasBosque.speakCurrent()" title="Repetir voz">
            🔊
          </button>
        </div>

        <!-- Ecuación Visual COPISI -->
        <div class="equation-display-bubble">
          <span>${q.countA}</span>
          <span>${q.op}</span>
          <span>${q.countB}</span>
          <span>=</span>
          <span>❓</span>
        </div>

        <!-- Canastas Pictóricas Concretas -->
        <div class="copisi-baskets-row">
          <div class="copisi-basket">
            <span class="basket-title">${q.labelA}</span>
            <div class="basket-items-display">
              ${itemsHtmlA}
            </div>
          </div>

          <div class="copisi-plus-sign" style="${q.op === '-' ? 'background: #ef4444;' : ''}">${q.op}</div>

          <div class="copisi-basket">
            <span class="basket-title">${q.labelB}</span>
            <div class="basket-items-display">
              ${itemsHtmlB}
            </div>
          </div>
        </div>

        <!-- Opciones de Respuesta -->
        <div class="math-options-grid">
          ${optionsHtml}
        </div>
      </div>
    `;
  },

  handleAnswer(selected) {
    const q = this.questions[this.currentIndex];

    if (selected === q.correct) {
      this.score++;
      window.soundEngine.playCorrect();
      const opWord = q.op === '+' ? 'más' : 'menos';
      window.robotLeo.speak(`¡Excelente! ${q.countA} ${opWord} ${q.countB} es igual a ${q.correct}.`);

      if (this.currentIndex + 1 < this.questions.length) {
        this.currentIndex++;
        setTimeout(() => {
          this.render();
          this.speakCurrent();
        }, 1200);
      } else {
        setTimeout(() => this.triggerVictory(), 1000);
      }
    } else {
      window.soundEngine.playRetry();
      window.robotLeo.speak(`¡Inténtalo de nuevo! Cuenta despacito las figuras de apoyo.`);
    }
  },

  speakCurrent() {
    const q = this.questions[this.currentIndex];
    const opWord = q.op === '+' ? 'más' : 'menos';
    window.robotLeo.speak(`${q.story} ¿Cuánto es ${q.countA} ${opWord} ${q.countB}? Toca la respuesta correcta.`);
  },

  triggerVictory() {
    window.soundEngine.playFanfare();
    window.confettiEngine.burst(85);

    window.app.showVictoryModal({
      title: '¡Misión Cumplida (MA01 OA 09)!',
      subtitle: `¡Resolviste problemas de adición y sustracción COPISI con el estándar oficial de 1° Básico!`,
      stars: 3,
      onReplay: () => this.start(this.container)
    });
  }
};
