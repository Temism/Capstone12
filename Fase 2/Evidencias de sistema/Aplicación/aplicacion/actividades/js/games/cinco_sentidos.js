/**
 * Minijuego: "El Laboratorio Sensorial: Los 5 Sentidos"
 * ALINEADO CON EXCEL FASE 1:
 * - Código: CN01 OA 06
 * - Eje: Ciencias de la Vida (Ciencias Naturales)
 * - Objetivo: "Identificar y describir la ubicación y la función de los sentidos proponiendo medidas para protegerlos y para prevenir situaciones de riesgo."
 * - Indicador (métrica): "Identifica los cinco sentidos, su ubicación y función, y propone medidas de cuidado."
 * - Actividades sugeridas: "Estaciones sensoriales (oler, tocar, escuchar); creación de afiches sobre el cuidado de los sentidos."
 */

window.minigameCincoSentidos = {
  id: 'act-ciencias-sentidos',
  title: 'Laboratorio Sensorial: Los 5 Sentidos',
  subject: 'Ciencias Naturales',
  oaCode: 'CN01 OA 06',
  eje: 'Ciencias de la Vida',
  indicador: 'Identifica los 5 sentidos, su órgano, función y medidas de autocuidado y protección.',
  actividadSugerida: 'Estaciones sensoriales de exploración (oír, oler, mirar, tocar y saborear).',

  stations: [
    {
      sense: 'La Vista',
      organ: '👀 Los Ojos',
      prompt: '¿Qué sentido y órgano usamos para ver los colores del arcoíris y leer cuentos?',
      correctSense: 'La Vista (Ojos)',
      careTip: 'Medida de cuidado: No mirar pantallas en la oscuridad ni frotarse los ojos con manos sucias.',
      options: ['👀 La Vista (Ojos)', '👂 El Oído (Orejas)', '👅 El Gusto (Lengua)']
    },
    {
      sense: 'El Oído',
      organ: '👂 Las Orejas / Oídos',
      prompt: '¿Con qué sentido escuchamos el canto de los pajaritos y la voz de Robot Leo?',
      correctSense: 'El Oído (Orejas)',
      careTip: 'Medida de cuidado: Escuchar a volumen moderado y no introducir objetos pequeños en el oído.',
      options: ['👃 El Olfato (Nariz)', '👂 El Oído (Orejas)', '✋ El Tacto (Piel)']
    },
    {
      sense: 'El Olfato',
      organ: '👃 La Nariz',
      prompt: '¿Qué sentido nos permite oler el perfume de una flor o el pan recién horneado?',
      correctSense: 'El Olfato (Nariz)',
      careTip: 'Medida de cuidado: Sonarse suavemente con pañuelo limpio y evitar oler sustancias químicas.',
      options: ['👃 El Olfato (Nariz)', '👀 La Vista (Ojos)', '👅 El Gusto (Lengua)']
    },
    {
      sense: 'El Gusto',
      organ: '👅 La Lengua / Boca',
      prompt: '¿Con qué sentido saboreamos si una manzana está dulce o un limón está ácido?',
      correctSense: 'El Gusto (Lengua)',
      careTip: 'Medida de cuidado: Cepillarse los dientes y lengua después de comer y evitar comidas hirviendo.',
      options: ['👅 El Gusto (Lengua)', '✋ El Tacto (Manos)', '👂 El Oído (Orejas)']
    },
    {
      sense: 'El Tacto',
      organ: '✋ La Piel / Las Manos',
      prompt: '¿Qué sentido nos ayuda a sentir si el hielo está frío o un peluche está suave?',
      correctSense: 'El Tacto (Piel / Manos)',
      careTip: 'Medida de cuidado: Lavarse las manos frecuentemente y usar bloqueador solar para cuidar la piel.',
      options: ['👀 La Vista (Ojos)', '✋ El Tacto (Piel / Manos)', '👃 El Olfato (Nariz)']
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
    const s = this.stations[this.currentIndex];
    const progressPercent = (this.currentIndex / this.stations.length) * 100;

    const optionsHtml = s.options.map((opt) => `
      <button 
        type="button" 
        onclick="minigameCincoSentidos.handleAnswer('${opt}')" 
        class="story-opt-btn"
        style="justify-content: center; font-size: 1.05rem; padding: 1rem;"
      >
        <span>${opt}</span>
      </button>
    `).join('');

    this.container.innerHTML = `
      <div class="forest-clearing" style="background: linear-gradient(180deg, #fef9c3 0%, #fef08a 100%); border-color: #eab308;">
        
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
            <p><strong>Estación Sensorial</strong>: ${s.prompt}</p>
            <span class="speech-hint">🔍 Mineduc CN01 OA 06: Identifica órgano, función y cuidado</span>
          </div>
          <button type="button" class="btn-repeat-voice" onclick="minigameCincoSentidos.speakCurrent()" title="Repetir voz">
            🔊
          </button>
        </div>

        <!-- Vitrina del Sentido -->
        <div style="background: white; border: 4px solid #ca8a04; border-radius: 28px; padding: 1.5rem; text-align: center; max-width: 440px; width: 100%; box-shadow: 0 10px 25px rgba(202, 138, 4, 0.15);">
          <div style="font-size: 4rem; margin-bottom: 0.35rem; animation: gentlePulse 2s infinite;">${s.organ.split(' ')[0]}</div>
          <h3 style="font-size: 1.4rem; font-weight: 900; color: #854d0e;">${s.sense}</h3>
          <p style="font-size: 0.88rem; color: #713f12; font-weight: 700; margin-top: 0.25rem;">${s.organ}</p>
        </div>

        <!-- Opciones -->
        <div style="display: flex; flex-direction: column; gap: 0.75rem; width: 100%; max-width: 480px;">
          ${optionsHtml}
        </div>
      </div>
    `;
  },

  handleAnswer(selected) {
    const s = this.stations[this.currentIndex];

    if (selected.includes(s.sense.split(' ')[1])) {
      this.score++;
      window.soundEngine.playCorrect();
      window.robotLeo.speak(`¡Muy bien! ${s.sense}. ${s.careTip}`);

      if (this.currentIndex + 1 < this.stations.length) {
        this.currentIndex++;
        setTimeout(() => {
          this.render();
          this.speakCurrent();
        }, 1600);
      } else {
        setTimeout(() => this.triggerVictory(), 1000);
      }
    } else {
      window.soundEngine.playRetry();
      window.robotLeo.speak("¡Piénsalo bien! Recuerda qué parte de nuestro cuerpo nos ayuda con esa sensación.");
    }
  },

  speakCurrent() {
    const s = this.stations[this.currentIndex];
    window.robotLeo.speak(s.prompt);
  },

  triggerVictory() {
    window.soundEngine.playFanfare();
    window.confettiEngine.burst(85);

    window.app.showVictoryModal({
      title: '¡Explorador de los Sentidos (CN01 OA 06)!',
      subtitle: `¡Completaste las 5 estaciones sensoriales y sus medidas de autocuidado del Mineduc!`,
      stars: 3,
      onReplay: () => this.start(this.container)
    });
  }
};
