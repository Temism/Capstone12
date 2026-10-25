/**
 * Minijuego 6: "El Detective Constructor de Oraciones: Mayúsculas y Puntos"
 * ALINEADO CON EXCEL FASE 1:
 * - Código: LE01 OA 14 (y LE02 OA 21)
 * - Eje: Escritura
 * - Objetivo: "Escribir oraciones completas para transmitir mensajes."
 * - Indicador (métrica): "Escribe oraciones completas con sentido que inician con mayúscula y terminan con punto final."
 * - Actividades sugeridas: "Construcción de oraciones a partir de imágenes; uso de tarjetas de palabras; revisión de mayúscula y punto."
 */

window.minigameDetectiveOraciones = {
  id: 'act-len-escritura',
  title: 'El Detective de las Oraciones: Mayúscula y Punto',
  subject: 'Lenguaje y Comunicación',
  oaCode: 'LE01 OA 14',
  eje: 'Escritura',
  indicador: 'Escribe oraciones completas iniciando con mayúscula y cerrando con punto final.',
  actividadSugerida: 'Revisión y ensamblado de oraciones con sellos de puntuación y mayúsculas.',

  cases: [
    {
      title: 'Caso 1: Nombre propio y comienzo de oración',
      prompt: 'Un buen detective sabe que toda oración y nombre comienza con MAYÚSCULA. ¿Qué sello corresponde?',
      initialSlot: '?',
      sentenceRest: 'ateo juega en la plaza con su pelota',
      endSlot: '.',
      correctLetter: 'M',
      options: ['M', 'm', 'P']
    },
    {
      title: 'Caso 2: El artículo al inicio del relato',
      prompt: 'Al iniciar la oración debemos estampar la letra mayúscula correcta. ¿Cuál es?',
      initialSlot: '?',
      sentenceRest: 'a zorra saltó tres veces en el bosque',
      endSlot: '.',
      correctLetter: 'L',
      options: ['l', 'L', 'S']
    },
    {
      title: 'Caso 3: La niña y la lectura escolar',
      prompt: 'El nombre Sofía inicia la oración. ¿Cuál de estos sellos es la mayúscula correcta?',
      initialSlot: '?',
      sentenceRest: 'ofía lee su libro favorito junto a Robot Leo',
      endSlot: '.',
      correctLetter: 'S',
      options: ['S', 's', 'Z']
    },
    {
      title: 'Caso 4: El signo de cierre obligatorio',
      prompt: '¿Qué signo o punto debemos estampar al TERMINAR de escribir una oración completa?',
      initialSlot: 'L',
      sentenceRest: 'os niños aprenden felices en la escuela',
      endSlot: '❓',
      correctPunctuation: '.',
      isPunctuationQuestion: true,
      options: ['. (Punto final)', ', (Coma)', '- (Guión)']
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
    const c = this.cases[this.currentIndex];
    const progressPercent = (this.currentIndex / this.cases.length) * 100;

    const stampsHtml = c.options.map((opt) => `
      <button 
        type="button" 
        onclick="minigameDetectiveOraciones.handleAnswer('${opt}')" 
        class="stamp-btn"
      >
        <span>${opt}</span>
      </button>
    `).join('');

    this.container.innerHTML = `
      <div class="detective-board">
        
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
            ${window.robotLeo.getSvgMarkup('thinking', 54)}
          </div>
          <div class="stage-leo-bubble">
            <p><strong>${c.title}</strong>: ${c.prompt}</p>
            <span class="speech-hint">🔍 Mineduc LE01 OA 14: Estructura de la oración completa</span>
          </div>
          <button type="button" class="btn-repeat-voice" onclick="minigameDetectiveOraciones.speakCurrent()" title="Repetir voz">
            🔊
          </button>
        </div>

        <!-- Tablero de Oración con Casilla Faltante -->
        <div class="detective-sentence-box">
          <span class="detective-slot ${c.isPunctuationQuestion ? 'filled' : ''}">${c.initialSlot}</span>
          <span>${c.sentenceRest}</span>
          <span class="detective-slot ${c.isPunctuationQuestion ? '' : 'filled'}">${c.endSlot}</span>
        </div>

        <!-- Sellos de Opciones -->
        <div style="text-align: center; font-weight: 800; color: #64748b; font-size: 0.95rem;">
          Toca el sello que completa la regla de oro:
        </div>
        <div class="detective-stamps-tray">
          ${stampsHtml}
        </div>
      </div>
    `;
  },

  handleAnswer(selected) {
    const c = this.cases[this.currentIndex];
    let isCorrect = false;

    if (c.isPunctuationQuestion) {
      isCorrect = selected.startsWith('.');
    } else {
      isCorrect = selected === c.correctLetter;
    }

    if (isCorrect) {
      this.score++;
      window.soundEngine.playCorrect();
      window.robotLeo.speak("¡Excelente ojo de detective! Has aplicado la regla de escritura perfectamente.");

      if (this.currentIndex + 1 < this.cases.length) {
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
      window.robotLeo.speak("¡Revisa con tu lupa! Recuerda: mayúscula al inicio y punto al final.");
    }
  },

  speakCurrent() {
    const c = this.cases[this.currentIndex];
    window.robotLeo.speak(c.prompt);
  },

  triggerVictory() {
    window.soundEngine.playFanfare();
    window.confettiEngine.burst(85);

    window.app.showVictoryModal({
      title: '¡Gran Escritor (LE01 OA 14)!',
      subtitle: `¡Demostraste el dominio de mayúsculas iniciales y puntos finales en oraciones completas!`,
      stars: 3,
      onReplay: () => this.start(this.container)
    });
  }
};
