/**
 * Minijuego: "El Safari Científico: Seres Vivos vs Cosas No Vivas"
 * ALINEADO CON EXCEL FASE 1:
 * - Código: CN01 OA 01
 * - Eje: Ciencias de la Vida (Ciencias Naturales)
 * - Objetivo: "Reconocer y observar, por medio de la exploración, que los seres vivos crecen, responden a estímulos del medio, se reproducen y necesitan agua, alimento y aire para vivir, comparándolos con las cosas no vivas."
 * - Indicador (métrica): "Explica, a partir de la observación, que los seres vivos crecen, se reproducen y necesitan agua, alimento y aire, diferenciándolos de objetos no vivos."
 * - Actividades sugeridas: "Cultivo de plantas en el aula; observación de una mascota o animal del entorno escolar; clasificación de tarjetas 'vivo / no vivo'."
 */

window.minigameSeresVivos = {
  id: 'act-ciencias-seres-vivos',
  title: 'Safari Científico: Seres Vivos vs Cosas No Vivas',
  subject: 'Ciencias Naturales',
  oaCode: 'CN01 OA 01',
  eje: 'Ciencias de la Vida',
  indicador: 'Diferencia seres vivos de cosas no vivas y reconoce que necesitan agua, alimento y aire.',
  actividadSugerida: 'Clasificación interactiva de tarjetas "vivo / no vivo" y necesidades vitales.',

  challenges: [
    {
      item: '🐶 Perrito Cachorro',
      icon: '🐶',
      prompt: '¿El perrito es un SER VIVO o una COSA NO VIVA?',
      isLiving: true,
      explanation: '¡El perrito es un ser vivo! Nace, crece, respira y necesita agua y comida.',
      options: ['🌱 Ser Vivo (Nace y crece)', '🪨 Cosa No Viva (Inerte)']
    },
    {
      item: '⚽ Pelota de Fútbol',
      icon: '⚽',
      prompt: '¿La pelota es un SER VIVO o una COSA NO VIVA?',
      isLiving: false,
      explanation: '¡La pelota es una cosa no viva! No respira, no come y no crece sola.',
      options: ['🌱 Ser Vivo (Nace y crece)', '🪨 Cosa No Viva (Inerte)']
    },
    {
      item: '🌻 Girasol en el Jardín',
      icon: '🌻',
      prompt: '¿La planta de girasol es un SER VIVO o una COSA NO VIVA?',
      isLiving: true,
      explanation: '¡La planta es un ser vivo! Crece desde una semillita, toma agua y necesita luz del sol.',
      options: ['🌱 Ser Vivo (Nace y crece)', '🪨 Cosa No Viva (Inerte)']
    },
    {
      item: '🚗 Auto de Juguete',
      icon: '🚗',
      prompt: '¿El auto de juguete es un SER VIVO o una COSA NO VIVA?',
      isLiving: false,
      explanation: '¡Es una cosa no viva! Está hecho de plástico y metal, no tiene vida propia.',
      options: ['🌱 Ser Vivo (Nace y crece)', '🪨 Cosa No Viva (Inerte)']
    },
    {
      item: '💧 Necesidad Vital',
      icon: '💧',
      prompt: '¿Qué elemento indispensable necesita un gatito para poder vivir?',
      isLiving: true,
      explanation: '¡Exacto! El agua limpia, el aire y el alimento son indispensables para todo ser vivo.',
      options: ['💧 Agua limpia y alimento', '📱 Un teléfono celular', '🪙 Monedas de oro']
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

    const optionsHtml = c.options.map((opt, i) => `
      <button 
        type="button" 
        onclick="minigameSeresVivos.handleAnswer(${i})" 
        class="story-opt-btn"
        style="justify-content: center; font-size: 1.1rem; padding: 1.1rem;"
      >
        <span>${opt}</span>
      </button>
    `).join('');

    this.container.innerHTML = `
      <div class="forest-clearing" style="background: linear-gradient(180deg, #ecfdf5 0%, #dcfce7 100%); border-color: #34d399;">
        
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
            <p><strong>Safari de Ciencias</strong>: ${c.prompt}</p>
            <span class="speech-hint">🔬 Mineduc CN01 OA 01: Exploración del entorno natural</span>
          </div>
          <button type="button" class="btn-repeat-voice" onclick="minigameSeresVivos.speakCurrent()" title="Repetir voz">
            🔊
          </button>
        </div>

        <!-- Tarjeta de Observación Científica -->
        <div style="background: white; border: 4px solid #10b981; border-radius: 28px; padding: 1.5rem; text-align: center; max-width: 420px; width: 100%; box-shadow: 0 10px 25px rgba(16, 185, 129, 0.15);">
          <div style="font-size: 4.5rem; margin-bottom: 0.5rem; animation: floatMascot 2.5s infinite;">${c.icon}</div>
          <h3 style="font-size: 1.5rem; font-weight: 900; color: #065f46;">${c.item}</h3>
        </div>

        <!-- Opciones -->
        <div style="display: flex; flex-direction: column; gap: 0.85rem; width: 100%; max-width: 480px;">
          ${optionsHtml}
        </div>
      </div>
    `;
  },

  handleAnswer(idx) {
    const c = this.challenges[this.currentIndex];
    let isCorrect = false;

    if (this.currentIndex === 4) {
      isCorrect = idx === 0;
    } else {
      isCorrect = (c.isLiving && idx === 0) || (!c.isLiving && idx === 1);
    }

    if (isCorrect) {
      this.score++;
      window.soundEngine.playCorrect();
      window.robotLeo.speak(`¡Excelente observación científica! ${c.explanation}`);

      if (this.currentIndex + 1 < this.challenges.length) {
        this.currentIndex++;
        setTimeout(() => {
          this.render();
          this.speakCurrent();
        }, 1500);
      } else {
        setTimeout(() => this.triggerVictory(), 1000);
      }
    } else {
      window.soundEngine.playRetry();
      window.robotLeo.speak("¡Pensemos como científicos! ¿Este objeto nace, respira y crece, o no tiene vida propia?");
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
      title: '¡Pequeño Científico Natural (CN01 OA 01)!',
      subtitle: `¡Diferenciaste con precisión los seres vivos de las cosas no vivas según el currículum Mineduc!`,
      stars: 3,
      onReplay: () => this.start(this.container)
    });
  }
};
