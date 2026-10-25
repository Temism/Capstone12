/**
 * Minijuego 1: "El Cohete Espacial del Conteo Mágico"
 * ALINEADO CON EXCEL FASE 1:
 * - Código: MA01 OA 01
 * - Eje: Números y operaciones
 * - Objetivo: "Contar números del 0 al 100 de 1 en 1, de 2 en 2, de 5 en 5 y de 10 en 10, hacia adelante y hacia atrás, empezando por cualquier número menor que 100."
 * - Indicador (métrica): "Cuenta oralmente en distintos saltos (1, 2, 5 y 10) hacia adelante y hacia atrás hasta 100, iniciando desde números distintos de 0."
 * - Actividades sugeridas: "Cadenas de conteo oral y saltos físicos con conos; uso de banda numérica y recta numérica; conteo de colecciones de objetos agrupándolos de 2, 5 y 10."
 */

window.minigameConteo = {
  id: 'act-conteo',
  title: 'Misión Conteo Mágico: El Cohete Espacial',
  subject: 'Matemática',
  oaCode: 'MA01 OA 01',
  eje: 'Números y operaciones',
  indicador: 'Cuenta oralmente en distintos saltos (1, 2, 5 y 10) hacia adelante y hacia atrás hasta 100.',
  actividadSugerida: 'Cadenas de conteo oral con banda numérica y colecciones de objetos.',

  modes: [
    {
      id: 'step1_forward',
      name: 'De 1 en 1 hacia adelante (1 al 10)',
      targetSequence: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      items: [
        { num: 1, word: 'Uno', icon: '☀️', label: '1 Sol' },
        { num: 2, word: 'Dos', icon: '🍎', label: '2 Manzanas' },
        { num: 3, word: 'Tres', icon: '⭐', label: '3 Estrellitas' },
        { num: 4, word: 'Cuatro', icon: '🐟', label: '4 Pececitos' },
        { num: 5, word: 'Cinco', icon: '🌸', label: '5 Flores' },
        { num: 6, word: 'Seis', icon: '🎁', label: '6 Regalos' },
        { num: 7, word: 'Siete', icon: '❤️', label: '7 Corazones' },
        { num: 8, word: 'Ocho', icon: '🌲', label: '8 Pinos' },
        { num: 9, word: 'Nueve', icon: '🔔', label: '9 Campanas' },
        { num: 10, word: 'Diez', icon: '🏆', label: '10 Trofeos' }
      ]
    },
    {
      id: 'step2_forward',
      name: 'De 2 en 2 (Saltos de 2)',
      targetSequence: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20],
      items: [
        { num: 2, word: 'Dos', icon: '🍒', label: '2 Guindas' },
        { num: 4, word: 'Cuatro', icon: '🍀', label: '4 Tréboles' },
        { num: 6, word: 'Seis', icon: '🎲', label: '6 Dados' },
        { num: 8, word: 'Ocho', icon: '🎸', label: '8 Guitarras' },
        { num: 10, word: 'Diez', icon: '💎', label: '10 Diamantes' },
        { num: 12, word: 'Doce', icon: '🚀', label: '12 Naves' },
        { num: 14, word: 'Catorce', icon: '🎈', label: '14 Globos' },
        { num: 16, word: 'Dieciséis', icon: '⚡', label: '16 Rayos' },
        { num: 18, word: 'Dieciocho', icon: '🎨', label: '18 Paletas' },
        { num: 20, word: 'Veinte', icon: '👑', label: '20 Coronas' }
      ]
    },
    {
      id: 'step5_forward',
      name: 'De 5 en 5 (Grupos de 5)',
      targetSequence: [5, 10, 15, 20, 25, 30],
      items: [
        { num: 5, word: 'Cinco', icon: '🖐️', label: '5 Dedos' },
        { num: 10, word: 'Diez', icon: '👐', label: '10 Dedos' },
        { num: 15, word: 'Quince', icon: '🍬', label: '15 Dulces' },
        { num: 20, word: 'Veinte', icon: '🪙', label: '20 Monedas' },
        { num: 25, word: 'Veinticinco', icon: '🏵️', label: '25 Flores' },
        { num: 30, word: 'Treinta', icon: '🌟', label: '30 Estrellas' }
      ]
    },
    {
      id: 'step1_backward',
      name: 'Cuenta Regresiva (Hacia atrás: 10 a 1)',
      targetSequence: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
      items: [
        { num: 10, word: 'Diez', icon: '🔟', label: '10' },
        { num: 9, word: 'Nueve', icon: '9️⃣', label: '9' },
        { num: 8, word: 'Ocho', icon: '8️⃣', label: '8' },
        { num: 7, word: 'Siete', icon: '7️⃣', label: '7' },
        { num: 6, word: 'Seis', icon: '6️⃣', label: '6' },
        { num: 5, word: 'Cinco', icon: '5️⃣', label: '5' },
        { num: 4, word: 'Cuatro', icon: '4️⃣', label: '4' },
        { num: 3, word: 'Tres', icon: '3️⃣', label: '3' },
        { num: 2, word: 'Dos', icon: '2️⃣', label: '2' },
        { num: 1, word: 'Uno', icon: '1️⃣', label: '1' }
      ]
    }
  ],

  currentModeIndex: 0,
  counted: [],
  nextExpectedIndex: 0,

  start(container) {
    this.container = container;
    this.currentModeIndex = 0;
    this.initRound();
  },

  initRound() {
    this.counted = [];
    this.nextExpectedIndex = 0;
    this.render();

    const mode = this.modes[this.currentModeIndex];
    window.robotLeo.speak(`¡Misión ${this.oaCode} del Mineduc! Vamos a contar ${mode.name}. Toca cada tarjeta en el orden correcto.`);
  },

  render() {
    const mode = this.modes[this.currentModeIndex];
    const totalSteps = mode.targetSequence.length;
    const isCompleted = this.counted.length === totalSteps;
    const progressPercent = (this.counted.length / totalSteps) * 100;
    const expectedNum = mode.targetSequence[this.nextExpectedIndex];

    let fuelCellsHtml = '';
    for (let i = 0; i < totalSteps; i++) {
      const active = i < this.counted.length ? 'active' : '';
      fuelCellsHtml += `<div class="fuel-cell ${active}">${mode.targetSequence[i]}</div>`;
    }

    let cardsHtml = mode.items.map(item => {
      const isDone = this.counted.includes(item.num);
      const isNext = item.num === expectedNum && !isDone;
      const cardClass = isDone ? 'completed' : (isNext ? 'next-expected' : '');

      return `
        <button 
          type="button" 
          onclick="minigameConteo.handleSelect(${item.num})" 
          class="counting-item-card ${cardClass}"
          title="${item.label}"
        >
          <div class="counting-card-num">${item.num}</div>
          <div class="counting-card-icon">${item.icon}</div>
          <div class="counting-card-word">${item.word}</div>
        </button>
      `;
    }).join('');

    const modeButtonsHtml = this.modes.map((m, idx) => `
      <button 
        type="button" 
        onclick="minigameConteo.switchMode(${idx})" 
        class="filter-chip ${idx === this.currentModeIndex ? 'active' : ''}"
        style="padding: 0.35rem 0.8rem; font-size: 0.82rem;"
      >
        ${m.name}
      </button>
    `).join('');

    this.container.innerHTML = `
      <div class="rocket-game-layout">
        
        <!-- Ficha Técnica Mineduc (Excel Fase 1) -->
        <div class="mineduc-curriculum-pill">
          <div class="curriculum-tag">
            <span class="badge-mineduc">MINEDUC OFICIAL</span>
            <strong>${this.oaCode}</strong> • Eje: ${this.eje}
          </div>
          <div class="curriculum-desc">
            <strong>Métrica observable:</strong> ${this.indicador}
          </div>
        </div>

        <!-- Selector de Desafío de Conteo -->
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center; width: 100%;">
          ${modeButtonsHtml}
        </div>

        <!-- Barra de Progreso Superior -->
        <div class="stage-progress-bar-wrap" style="width: 100%;">
          <div class="stage-progress-fill" style="width: ${progressPercent}%;"></div>
        </div>

        <!-- Diálogo con Robot Leo -->
        <div class="stage-leo-dialogue" style="width: 100%;">
          <div class="stage-leo-mini-avatar leo-avatar-slot" data-size="54">
            ${window.robotLeo.getSvgMarkup('happy', 54)}
          </div>
          <div class="stage-leo-bubble">
            <p id="conteo-dialogue-text">
              ${isCompleted 
                ? '¡Extraordinario! ¡El cohete tiene energía total y despegó hacia las estrellas!' 
                : `Busca y toca el número <strong>${expectedNum}</strong> para continuar la secuencia.`}
            </p>
            <span class="speech-hint">🚀 Mineduc MA01 OA 01: Saltos hacia adelante y atrás</span>
          </div>
          <button type="button" class="btn-repeat-voice" onclick="minigameConteo.repeatPrompt()" title="Repetir voz">
            🔊
          </button>
        </div>

        <!-- Escenario Espacial con Cohete y Batería de Células -->
        <div class="space-skyline">
          <div class="rocket-vessel-wrap">
            <div id="rocket-sprite" class="rocket-vessel ${isCompleted ? 'launching' : ''}">🚀</div>
          </div>
          <div class="fuel-meter-container">
            <div class="fuel-meter-header">
              <span>🔋 BATERÍA: ${mode.name}</span>
              <span>${this.counted.length} / ${totalSteps} Pasos</span>
            </div>
            <div class="fuel-cells-grid" style="grid-template-columns: repeat(${totalSteps}, 1fr);">
              ${fuelCellsHtml}
            </div>
          </div>
        </div>

        <!-- Grilla de Tarjetas -->
        <div class="counting-cards-grid">
          ${cardsHtml}
        </div>
      </div>
    `;
  },

  switchMode(index) {
    this.currentModeIndex = index;
    window.soundEngine.playPop();
    this.initRound();
  },

  handleSelect(num) {
    const mode = this.modes[this.currentModeIndex];
    const expectedNum = mode.targetSequence[this.nextExpectedIndex];

    if (this.counted.includes(num)) {
      window.soundEngine.playPop();
      return;
    }

    if (num === expectedNum) {
      this.counted.push(num);
      this.nextExpectedIndex++;
      window.soundEngine.playCountingNote(this.nextExpectedIndex);

      if (this.counted.length === mode.targetSequence.length) {
        this.triggerVictory();
      } else {
        this.render();
        const nextNum = mode.targetSequence[this.nextExpectedIndex];
        window.robotLeo.speak(`¡Bien! Ahora el ${nextNum}.`);
      }
    } else {
      window.soundEngine.playRetry();
      window.robotLeo.speak(`¡Casi! Sigue el número ${expectedNum}.`);
      const dlg = document.getElementById('conteo-dialogue-text');
      if (dlg) {
        dlg.innerHTML = `¡Ánimo! El siguiente en la secuencia es el <strong>${expectedNum}</strong>.`;
      }
    }
  },

  repeatPrompt() {
    const mode = this.modes[this.currentModeIndex];
    if (this.counted.length === mode.targetSequence.length) {
      window.robotLeo.speak("¡Misión cumplida! Toda la secuencia está completa.");
    } else {
      const expectedNum = mode.targetSequence[this.nextExpectedIndex];
      window.robotLeo.speak(`Debes encontrar y tocar el número ${expectedNum} para continuar el conteo.`);
    }
  },

  triggerVictory() {
    this.render();
    window.soundEngine.playRocket();

    setTimeout(() => {
      window.soundEngine.playFanfare();
      window.confettiEngine.burst(90);

      window.app.showVictoryModal({
        title: '¡Despegue Exitoso (MA01 OA 01)!',
        subtitle: `¡Demostraste el conteo según el estándar Mineduc de 1° Básico! (${this.modes[this.currentModeIndex].name})`,
        stars: 3,
        onReplay: () => this.initRound()
      });
    }, 1200);
  }
};
