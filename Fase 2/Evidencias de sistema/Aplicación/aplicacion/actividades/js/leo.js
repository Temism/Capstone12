/**
 * Robot Leo - Mascota Guía y Motor de Voz Interactiva (Web Speech API)
 * Proporciona el avatar animado SVG y la locución adaptada para 1° y 2° Básico.
 */

class RobotLeoController {
  constructor() {
    this.synth = window.speechSynthesis || null;
    this.currentUtterance = null;
    this.isSpeaking = false;
    this.voiceEnabled = true;
    this.expression = 'happy'; // 'happy' | 'talking' | 'thinking' | 'celebrating'
  }

  /**
   * Genera el SVG animado de Robot Leo con diferentes expresiones
   */
  getSvgMarkup(expression = this.expression, size = 120) {
    let eyeLeft = `<circle cx="48" cy="48" r="8" fill="#38bdf8" class="leo-eye" />`;
    let eyeRight = `<circle cx="72" cy="48" r="8" fill="#38bdf8" class="leo-eye" />`;
    let mouth = `<path d="M 46 68 Q 60 78 74 68" stroke="#38bdf8" stroke-width="4" stroke-linecap="round" fill="none" />`;
    let antennaGlow = `#f59e0b`;

    if (expression === 'talking') {
      mouth = `<ellipse cx="60" cy="70" rx="9" ry="7" fill="#38bdf8" />`;
      antennaGlow = `#10b981`;
    } else if (expression === 'celebrating') {
      eyeLeft = `<path d="M 42 50 Q 48 42 54 50" stroke="#38bdf8" stroke-width="4" stroke-linecap="round" fill="none" />`;
      eyeRight = `<path d="M 66 50 Q 72 42 78 50" stroke="#38bdf8" stroke-width="4" stroke-linecap="round" fill="none" />`;
      mouth = `<path d="M 44 66 Q 60 84 76 66 Z" fill="#38bdf8" />`;
      antennaGlow = `#ec4899`;
    } else if (expression === 'thinking') {
      eyeLeft = `<circle cx="48" cy="46" r="6" fill="#38bdf8" />`;
      eyeRight = `<circle cx="72" cy="50" r="9" fill="#38bdf8" />`;
      mouth = `<line x1="50" y1="70" x2="70" y2="70" stroke="#38bdf8" stroke-width="4" stroke-linecap="round" />`;
      antennaGlow = `#8b5cf6`;
    }

    return `
      <svg width="${size}" height="${size}" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" class="leo-avatar-svg">
        <defs>
          <filter id="leo-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <!-- Sombra en el suelo -->
        <ellipse cx="60" cy="112" rx="36" ry="6" fill="rgba(0,0,0,0.18)" />

        <!-- Antena con esfera brillante -->
        <line x1="60" y1="12" x2="60" y2="24" stroke="#94a3b8" stroke-width="4" stroke-linecap="round" />
        <circle cx="60" cy="10" r="7" fill="${antennaGlow}" filter="url(#leo-glow)" />

        <!-- Orejas / Audífonos -->
        <rect x="22" y="42" width="8" height="24" rx="4" fill="#6366f1" />
        <rect x="90" y="42" width="8" height="24" rx="4" fill="#6366f1" />

        <!-- Cabeza del Robot (Bordes redondeados amigables) -->
        <rect x="28" y="24" width="64" height="60" rx="20" fill="#1e1b4b" stroke="#6366f1" stroke-width="3" />
        
        <!-- Pantalla facial -->
        <rect x="34" y="32" width="52" height="44" rx="14" fill="#0f172a" />

        <!-- Ojos y Boca -->
        ${eyeLeft}
        ${eyeRight}
        ${mouth}

        <!-- Cuello -->
        <rect x="52" y="84" width="16" height="8" rx="3" fill="#cbd5e1" />

        <!-- Cuerpo del Robot -->
        <rect x="36" y="90" width="48" height="20" rx="10" fill="#4338ca" />
        <!-- Luz de corazón de energía en el pecho -->
        <circle cx="60" cy="100" r="5" fill="#f59e0b" filter="url(#leo-glow)" />
      </svg>
    `;
  }

  /**
   * Lee en voz alta un texto utilizando Web Speech API con entonación empática para niños
   */
  speak(text, onEndCallback = null) {
    if (!this.synth || !this.voiceEnabled) {
      if (onEndCallback) onEndCallback();
      return;
    }

    this.synth.cancel();

    // Eliminar tags HTML si vienen en el texto
    const cleanText = text.replace(/<[^>]*>?/gm, '');

    const utter = new SpeechSynthesisUtterance(cleanText);
    utter.lang = 'es-CL';
    utter.rate = 0.95; // Velocidad pausada para 1° y 2° básico
    utter.pitch = 1.15; // Tono ligeramente animado y dulce

    // Buscar una voz en español
    const voices = this.synth.getVoices();
    const esVoice = voices.find(v => v.lang.includes('es-CL') || v.lang.includes('es-419') || v.lang.includes('es-ES') || v.lang.startsWith('es'));
    if (esVoice) {
      utter.voice = esVoice;
    }

    this.isSpeaking = true;
    this.updateSvgExpression('talking');

    utter.onend = () => {
      this.isSpeaking = false;
      this.updateSvgExpression('happy');
      if (onEndCallback) onEndCallback();
    };

    utter.onerror = () => {
      this.isSpeaking = false;
      this.updateSvgExpression('happy');
      if (onEndCallback) onEndCallback();
    };

    this.currentUtterance = utter;
    this.synth.speak(utter);
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
      this.updateSvgExpression('happy');
    }
  }

  updateSvgExpression(exp) {
    this.expression = exp;
    document.querySelectorAll('.leo-avatar-slot').forEach(container => {
      const size = parseInt(container.getAttribute('data-size') || '120', 10);
      container.innerHTML = this.getSvgMarkup(exp, size);
    });
  }
}

window.robotLeo = new RobotLeoController();
