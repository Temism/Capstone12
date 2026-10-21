// Main Application Controller & Router (Bento Dock Layout + Demo Authentication + 4 Actividades Mineduc con Voz)
const app = {
  currentUser: null, // Inicia en null para mostrar la pantalla de Login
  currentView: 'actividades',
  currentTheme: 'navy',
  isVoiceModalOpen: false,
  voiceModalStage: 'loading', // 'loading' | 'welcome' | 'disclaimer' | 'activity'
  voiceModalContextTitle: 'Misión Conteo Mágico: Cuenta del 1 al 10 con Robot Leo',
  activeActivityId: 'act-conteo',
  activeActivityType: 'counting', // 'counting' | 'addition' | 'phonological' | 'story_comprehension'
  voiceNoiseDisclaimerAccepted: false,
  countedNumbers: [],
  currentQuestionIndex: 0,
  completedStepsCount: 0,
  isCurrentActivityFinished: false,
  isRecordingVoice: false,
  _keyboardBound: false,
  disclaimerAndInstructionsTtsText: 'Hola. Antes de comenzar, recuerda cuidar el ruido ambiente: busca un lugar tranquilo, apaga la musica o el televisor, y habla fuerte y claro cerca del microfono. En esta actividad debes contar en voz alta y en orden del uno al diez: uno, dos, tres, cuatro, cinco, seis, siete, ocho, nueve y diez. Presiona la barra espaciadora nuevamente para iniciar la actividad.',

  init() {
    document.documentElement.setAttribute('data-theme', this.currentTheme);

    const hash = window.location.hash.replace('#', '');
    if (['reporteria', 'alertas', 'actividades', 'asignar', 'mensajeria'].includes(hash)) {
      this.currentView = hash;
    }

    if (window.api) {
      api.checkHealth().then(() => {
        if (api.syncStudentDataFromDb) {
          api.syncStudentDataFromDb().then(() => {
            if (this.currentUser) this.renderCurrentView();
          });
        }
      });
    }

    this.bindKeyboardShortcuts();
    this.render();
  },

  bindKeyboardShortcuts() {
    if (this._keyboardBound) return;
    this._keyboardBound = true;
    window.addEventListener('keydown', (e) => {
      if (!this.isVoiceModalOpen) return;
      const tag = (e.target && e.target.tagName) ? e.target.tagName.toUpperCase() : '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        if (e.repeat) return;
        if (document.activeElement && typeof document.activeElement.blur === 'function') {
          document.activeElement.blur();
        }
        this.handleModalSpacebar();
      }
    });
  },

  // Obtiene la definicion completa de la actividad activa desde mockData
  getActiveActivityObject() {
    if (!window.mockData) return null;
    const allLists = [
      ...(mockData.studentActivities || []),
      ...(mockData.sofiaActivities || [])
    ];
    let found = allLists.find(a => a.id === this.activeActivityId);
    if (!found && this.voiceModalContextTitle) {
      const targetTitle = this.voiceModalContextTitle.trim().toLowerCase();
      found = allLists.find(a => (a.title || '').trim().toLowerCase() === targetTitle);
    }
    if (!found) {
      found = (mockData.studentActivities || [])[0] || null;
    }
    // Si una actividad de 2° Basico no tiene arreglo propio de preguntas, heredar plantilla equivalente de 1° Basico
    if (found &&found.activityType !== 'counting' && (!Array.isArray(found.questions) || found.questions.length === 0)) {
      const template = (mockData.studentActivities || []).find(a => a.activityType === found.activityType);
      if (template) {
        found.questions = template.questions;
        if (template.storyText && !found.storyText) found.storyText = template.storyText;
        if (template.storyTitle && !found.storyTitle) found.storyTitle = template.storyTitle;
      }
    }
    return found;
  },

  // Validador de finalizacion del conteo secuencial del 1 al 10
  isCountingActivityCompleted() {
    if (!Array.isArray(this.countedNumbers) || this.countedNumbers.length !== 10) {
      return false;
    }
    for (let i = 0; i < 10; i++) {
      if (this.countedNumbers[i] !== i + 1) {
        return false;
      }
    }
    return true;
  },

  // Validador general de finalizacion para cualquiera de las 4 actividades Mineduc
  isActivityCompleted() {
    const act = this.getActiveActivityObject();
    const type = (act && act.activityType) ? act.activityType : 'counting';
    if (type === 'counting') {
      return this.isCountingActivityCompleted();
    }
    return Boolean(this.isCurrentActivityFinished);
  },

  getActivityProgressSummary() {
    const act = this.getActiveActivityObject();
    const type = (act && act.activityType) ? act.activityType : 'counting';
    if (type === 'counting') {
      const count = Array.isArray(this.countedNumbers) ? this.countedNumbers.length : 0;
      return {
        label: `Progreso: ${count} de 10 números`,
        percent: count * 10
      };
    }
    const total = (act && Array.isArray(act.questions) && act.questions.length > 0) ? act.questions.length : 5;
    const done = Math.min(total, this.completedStepsCount || 0);
    const pct = Math.round((done / total) * 100);
    return {
      label: `Progreso: ${done} de ${total} desafíos`,
      percent: pct
    };
  },

  handleModalSpacebar() {
    if (!this.isVoiceModalOpen) return;
    if (this.voiceModalStage === 'loading') {
      return;
    } else if (this.voiceModalStage === 'welcome') {
      this.startDisclaimerWithVoice();
    } else if (this.voiceModalStage === 'disclaimer') {
      this.acceptNoiseDisclaimer();
    } else if (this.voiceModalStage === 'activity') {
      // Validador: cuando se ha terminado la actividad y se presiona la barra espaciadora, se cierra la actividad
      if (this.isActivityCompleted()) {
        this.completeAndCloseVoiceModal();
      } else {
        this.toggleVoiceRecording();
      }
    }
  },

  handleMainActivityAction() {
    if (this.isActivityCompleted()) {
      this.completeAndCloseVoiceModal();
    } else {
      this.toggleVoiceRecording();
    }
  },

  async persistCurrentActivityState(estado, progreso, calificacion = null, comentarios = null) {
    const student = (window.mockData && mockData.getSelectedStudent) ? mockData.getSelectedStudent() : { id: 'alu-102' };
    const studentId = student.id || 'alu-102';
    const act = this.getActiveActivityObject();
    const actCode = (act && act.id) ? act.id : (this.activeActivityId || 'act-conteo');
    const actTitle = (act && act.title) ? act.title : (this.voiceModalContextTitle || 'Misión Conteo Mágico: Cuenta del 1 al 10 con Robot Leo');
    const actSubject = (act && act.subject) ? act.subject : 'Matemáticas';

    if (window.mockData) {
      const list = studentId === 'alu-103' ? mockData.sofiaActivities : mockData.studentActivities;
      const actObj = (list || []).find(a => a.id === actCode || (a.title && a.title.toLowerCase() === actTitle.toLowerCase()));
      if (actObj) {
        actObj.status = estado;
        actObj.progressPercent = progreso;
        if (estado === 'Entregada') {
          const gradeVal = calificacion !== null ? Number(calificacion).toFixed(1) : '7.0';
          actObj.score = `${gradeVal} / 7.0`;
          actObj.gradeValue = Number(gradeVal);
          actObj.urgent = false;
        }
        if (comentarios) {
          actObj.comments = comentarios;
        }
      }
    }

    const apiClient = window.api || (typeof api !== 'undefined' ? api : null);
    if (apiClient && apiClient.updateActivityState) {
      await apiClient.updateActivityState({
        student_code: studentId,
        codigo_frontend: actCode,
        titulo: actTitle,
        asignatura: actSubject,
        estado: estado,
        progreso: progreso,
        calificacion: calificacion,
        comentarios: comentarios,
        tiempo_minutos: 8
      });
      if (apiClient.syncStudentDataFromDb) {
        await apiClient.syncStudentDataFromDb(studentId);
      }
    }
  },

  updateCompletedUiInModal() {
    const btn = document.getElementById('voice-record-btn');
    const titleEl = document.getElementById('voice-action-title');
    const subtitleEl = document.getElementById('voice-action-subtitle');
    const iconBox = document.getElementById('voice-mic-icon-box');
    const finishText = document.getElementById('voice-finish-text');

    if (btn) {
      btn.className = 'w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer';
      btn.innerHTML = '<i data-lucide="check-circle" class="w-4 h-4"></i><span id="voice-record-text">Cerrar Actividad (Espacio)</span>';
    }
    if (titleEl) {
      titleEl.textContent = '¡Actividad Completada con Éxito!';
    }
    if (subtitleEl) {
      subtitleEl.innerHTML = 'Pulsa <kbd class="px-1.5 py-0.5 bg-emerald-100 text-emerald-900 rounded border border-emerald-300 font-bold text-[11px]">Espacio</kbd> para guardar y cerrar la actividad';
    }
    if (iconBox) {
      iconBox.className = 'w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center shadow-xs flex-shrink-0';
      iconBox.innerHTML = '<i data-lucide="award" class="w-5 h-5 text-white"></i>';
    }
    if (finishText) {
      finishText.textContent = 'Cerrar Actividad (Espacio)';
    }
    if (window.lucide) lucide.createIcons();
  },

  restoreRecordingUiInModal() {
    const act = this.getActiveActivityObject();
    const type = (act && act.activityType) ? act.activityType : 'counting';
    const btn = document.getElementById('voice-record-btn');
    const titleEl = document.getElementById('voice-action-title');
    const subtitleEl = document.getElementById('voice-action-subtitle');
    const iconBox = document.getElementById('voice-mic-icon-box');
    const finishText = document.getElementById('voice-finish-text');

    const defaultBtnLabel = type === 'counting' ? 'Presionar para Contar (Espacio)' : 'Responder con Voz (Espacio)';
    if (btn) {
      btn.className = 'w-full sm:w-auto px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-950 font-black text-xs sm:text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer';
      btn.innerHTML = '<i data-lucide="mic" class="w-4 h-4"></i><span id="voice-record-text">' + defaultBtnLabel + '</span>';
    }
    if (titleEl) {
      titleEl.textContent = type === 'story_comprehension' ? 'Responde la Pregunta con tu Voz' : 'Habla con Robot Leo por el Micrófono';
    }
    if (subtitleEl) {
      subtitleEl.innerHTML = 'Pulsa <kbd class="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-300 font-bold text-[11px]">Espacio</kbd> o el botón para hablar';
    }
    if (iconBox) {
      iconBox.className = 'w-11 h-11 rounded-xl bg-amber-400 flex items-center justify-center shadow-xs flex-shrink-0';
      iconBox.innerHTML = '<i data-lucide="mic" class="w-5 h-5 text-slate-950"></i>';
    }
    if (finishText) {
      finishText.textContent = 'Guardar y Salir';
    }
    if (window.lucide) lucide.createIcons();
  },

  async completeAndCloseVoiceModal() {
    const act = this.getActiveActivityObject();
    const type = (act && act.activityType) ? act.activityType : 'counting';
    const isCompleted = this.isActivityCompleted();
    const progressInfo = this.getActivityProgressSummary();

    if (isCompleted) {
      const commentByType = {
        counting: 'Conteo del 1 al 10 en orden completado correctamente con voz (MA01 OA 01).',
        addition: 'Los 5 problemas de suma hasta el 10 fueron resueltos correctamente (MA01 OA 09).',
        phonological: 'Las 5 palabras de sonido inicial fueron identificadas correctamente (LE01 OA 03).',
        story_comprehension: 'Comprensión oral del relato La Zorra y las Uvas completada por voz (LE01 OA 18).'
      };
      await this.persistCurrentActivityState(
        'Entregada',
        100,
        7.0,
        commentByType[type] || 'Actividad completada correctamente con voz.'
      );
    } else if (progressInfo.percent > 0) {
      await this.persistCurrentActivityState(
        'En progreso',
        progressInfo.percent,
        null,
        `Avance parcial guardado (${progressInfo.percent}% completado).`
      );
    }

    this.closeVoiceModal();
    this.renderCurrentView();
  },

  login(user) {
    this.currentUser = user;
    this.currentView = user.defaultView || 'actividades';
    if (window.mensajeriaView) {
      mensajeriaView.hasLoaded = false;
      mensajeriaView.conversations = [];
      mensajeriaView.messages = [];
    }
    if (window.api && api.syncStudentDataFromDb) {
      api.syncStudentDataFromDb().then(() => {
        this.renderCurrentView();
      });
    }
    window.location.hash = this.currentView;
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  logout() {
    this.currentUser = null;
    if (window.api) {
      api.logout();
    }
    if (window.mensajeriaView) {
      mensajeriaView.hasLoaded = false;
      mensajeriaView.conversations = [];
      mensajeriaView.messages = [];
    }
    window.location.hash = '';
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  setTheme(themeId) {
    this.currentTheme = themeId;
    document.documentElement.setAttribute('data-theme', themeId);
    this.render();
  },

  setView(viewId) {
    this.currentView = viewId;
    window.location.hash = viewId;
    if (viewId === 'mensajeria' && window.mensajeriaView) {
      mensajeriaView.initData().then(() => {
        app.renderCurrentView();
        mensajeriaView.scrollToBottom();
      });
    } else if ((viewId === 'reporteria' || viewId === 'actividades') && window.api && api.syncStudentDataFromDb) {
      api.syncStudentDataFromDb().then(() => {
        app.renderCurrentView();
      });
    }
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  async openVoiceModal(activityTitle = 'Misión Conteo Mágico: Cuenta del 1 al 10 con Robot Leo', activityId = 'act-conteo') {
    this.voiceModalContextTitle = activityTitle;
    this.activeActivityId = activityId || 'act-conteo';

    const act = this.getActiveActivityObject();
    if (act) {
      this.activeActivityId = act.id;
      this.voiceModalContextTitle = act.title;
      this.activeActivityType = act.activityType || 'counting';
      this.disclaimerAndInstructionsTtsText = act.disclaimerTtsText || 'Hola. Antes de comenzar, busca un lugar tranquilo sin ruido ambiente y habla fuerte y claro cerca del microfono. Presiona la barra espaciadora nuevamente para iniciar la actividad.';
    } else {
      this.activeActivityType = 'counting';
    }

    this.voiceNoiseDisclaimerAccepted = false;
    this.voiceModalStage = 'loading';
    this.countedNumbers = [];
    this.currentQuestionIndex = 0;
    this.completedStepsCount = 0;
    this.isCurrentActivityFinished = false;
    this.isRecordingVoice = false;
    this.isVoiceModalOpen = true;
    this.renderModalContainer();

    const loadingBar = document.getElementById('counting-loading-bar');
    const loadingStatus = document.getElementById('counting-loading-status');

    try {
      if (loadingBar) loadingBar.style.width = '65%';
      if (loadingStatus) loadingStatus.textContent = 'Sincronizando voz de Robot Leo y preparando indicaciones...';

      const apiClient = window.api || (typeof api !== 'undefined' ? api : null);
      const preloadPromises = [new Promise(r => setTimeout(r, 550))];

      if (apiClient) {
        preloadPromises.push(apiClient.checkHealth().catch(() => {}));
        if (apiClient.preloadTtsAudio) {
          preloadPromises.push(apiClient.preloadTtsAudio(this.disclaimerAndInstructionsTtsText).catch(() => {}));
          const firstPrompt = this.getCurrentStepSpeechText();
          if (firstPrompt) {
            preloadPromises.push(apiClient.preloadTtsAudio(firstPrompt).catch(() => {}));
          }
        }
      }

      await Promise.all(preloadPromises);

      if (!this.isVoiceModalOpen) return;
      if (loadingBar) loadingBar.style.width = '100%';
      await new Promise(r => setTimeout(r, 150));
    } catch (err) {
      console.warn("[Modal] Aviso en precarga:", err);
    }

    if (!this.isVoiceModalOpen) return;
    this.setModalStage('welcome');
  },

  setModalStage(stage) {
    this.voiceModalStage = stage;
    const loadingEl = document.getElementById('counting-loading');
    const welcomeEl = document.getElementById('counting-welcome');
    const disclaimerEl = document.getElementById('counting-disclaimer');
    const activityEl = document.getElementById('counting-activity');

    if (loadingEl && welcomeEl && disclaimerEl && activityEl) {
      loadingEl.style.display = stage === 'loading' ? 'flex' : 'none';
      welcomeEl.style.display = stage === 'welcome' ? 'flex' : 'none';
      disclaimerEl.style.display = stage === 'disclaimer' ? 'flex' : 'none';
      activityEl.style.display = stage === 'activity' ? 'flex' : 'none';
      if (window.lucide) lucide.createIcons();
    } else {
      this.renderModalContainer();
    }
  },

  async startDisclaimerWithVoice() {
    this.setModalStage('disclaimer');
    await this.playDisclaimerTts();
  },

  async playDisclaimerTts() {
    const apiClient = window.api || (typeof api !== 'undefined' ? api : null);
    const statusEl = document.getElementById('disclaimer-tts-status');
    const indicatorEl = document.getElementById('disclaimer-tts-indicator');

    if (statusEl) {
      statusEl.textContent = 'Robot Leo está leyendo las indicaciones y consejos de ruido ambiente...';
    }
    if (indicatorEl) {
      indicatorEl.classList.add('animate-pulse');
    }

    if (apiClient && apiClient.speakText) {
      await apiClient.speakText(this.disclaimerAndInstructionsTtsText, null, () => {
        const currentStatus = document.getElementById('disclaimer-tts-status');
        const currentIndicator = document.getElementById('disclaimer-tts-indicator');
        if (currentStatus) {
          currentStatus.textContent = 'Indicaciones listas. Presiona ESPACIO nuevamente para iniciar la actividad.';
        }
        if (currentIndicator) {
          currentIndicator.classList.remove('animate-pulse');
        }
      });
    }
  },

  async acceptNoiseDisclaimer() {
    const apiClient = window.api || (typeof api !== 'undefined' ? api : null);
    if (apiClient && apiClient.stopSpeaking) {
      apiClient.stopSpeaking();
    }
    this.voiceNoiseDisclaimerAccepted = true;
    this.setModalStage('activity');

    // Al entrar a las actividades de preguntas o relato, leer automaticamente el primer desafio
    const act = this.getActiveActivityObject();
    if (act && act.activityType === 'story_comprehension' && this.currentQuestionIndex === 0) {
      await this.speakStoryAndCurrentQuestion();
    } else if (act && (act.activityType === 'addition' || act.activityType === 'phonological')) {
      await this.speakCurrentActivityPrompt();
    }
  },

  showNoiseDisclaimer() {
    this.voiceNoiseDisclaimerAccepted = false;
    this.startDisclaimerWithVoice();
  },

  getCurrentStepSpeechText() {
    const act = this.getActiveActivityObject();
    if (!act || act.activityType === 'counting') {
      return 'Presiona el botón del micrófono y cuenta en voz alta: uno, dos, tres, cuatro, cinco, seis, siete, ocho, nueve, diez. Debes decirlos en orden secuencial para encender las estrellas.';
    }
    const questions = Array.isArray(act.questions) ? act.questions : [];
    const q = questions[this.currentQuestionIndex] || questions[0];
    return q ? (q.speechAudioText || q.question || q.text || '') : '';
  },

  async speakCurrentActivityPrompt() {
    const text = this.getCurrentStepSpeechText();
    if (text && window.api && api.speakText) {
      await api.speakText(text);
    }
  },

  async speakStoryText() {
    const act = this.getActiveActivityObject();
    if (act && act.storyText && window.api && api.speakText) {
      await api.speakText(act.storyText);
    }
  },

  async speakStoryAndCurrentQuestion() {
    const act = this.getActiveActivityObject();
    if (!act || !window.api || !api.speakText) return;
    const qText = this.getCurrentStepSpeechText();
    const combined = `${act.storyText || ''} ... Ahora escuchemos la primera pregunta: ${qText}`;
    await api.speakText(combined);
  },

  refreshActivityBodyDom() {
    const act = this.getActiveActivityObject();
    const bodyEl = document.getElementById('activity-dynamic-body');
    const progressText = document.getElementById('counting-progress-text');
    const progressBar = document.getElementById('counting-progress-bar');
    const progressInfo = this.getActivityProgressSummary();

    if (bodyEl && window.components && components.renderActivityInteractiveBody) {
      bodyEl.innerHTML = components.renderActivityInteractiveBody(act, this);
    }
    if (progressText) progressText.textContent = progressInfo.label;
    if (progressBar) progressBar.style.width = `${progressInfo.percent}%`;
    if (window.lucide) lucide.createIcons();
  },

  resetCurrentActivityProgress() {
    this.countedNumbers = [];
    this.currentQuestionIndex = 0;
    this.completedStepsCount = 0;
    this.isCurrentActivityFinished = false;
    this.restoreRecordingUiInModal();
    this.persistCurrentActivityState('En progreso', 0, null, 'Actividad reiniciada por el estudiante.');
    this.refreshActivityBodyDom();
    const resultBox = document.getElementById('voice-transcription-result');
    if (resultBox) {
      resultBox.className = 'hidden p-3.5 rounded-xl border transition-all text-xs';
      resultBox.innerHTML = '';
    }
  },

  resetCountedNumbers() {
    this.resetCurrentActivityProgress();
  },

  // Permite responder tocando una opcion en Sumas (MA01 OA 09) o Conciencia Fonologica (LE01 OA 03)
  async selectStepOption(selectedVal) {
    if (this.isCurrentActivityFinished) return;
    const act = this.getActiveActivityObject();
    if (!act) return;

    if (act.activityType === 'addition') {
      await this.evaluateAdditionStep(Number(selectedVal), `Opción seleccionada: ${selectedVal}`);
    } else if (act.activityType === 'phonological') {
      await this.evaluatePhonologicalStep(String(selectedVal), `Letra seleccionada: ${selectedVal}`);
    }
  },

  // Evaluador para Actividad 2 de Matematica: Sumas hasta el 10 (MA01 OA 09 - Modelo COPISI)
  async evaluateAdditionStep(spokenNum, rawTranscript) {
    const act = this.getActiveActivityObject();
    const questions = (act && Array.isArray(act.questions)) ? act.questions : [];
    const currentQ = questions[this.currentQuestionIndex];
    if (!currentQ) return;

    const resultBox = document.getElementById('voice-transcription-result');
    const isCorrect = Number(spokenNum) === Number(currentQ.correctNumber);

    if (isCorrect) {
      this.completedStepsCount = this.currentQuestionIndex + 1;
      const isLast = this.completedStepsCount >= questions.length;

      if (isLast) {
        this.isCurrentActivityFinished = true;
        this.refreshActivityBodyDom();
        this.updateCompletedUiInModal();
        const msgDone = '¡Extraordinario! Resolviste las cinco sumas del Bosque de los Números. Presiona la barra espaciadora para guardar y cerrar.';
        if (window.api && api.speakText) api.speakText(msgDone);
        await this.persistCurrentActivityState(
          'Entregada',
          100,
          7.0,
          `Los 5 problemas de adición hasta el 10 (MA01 OA 09) fueron resueltos correctamente.`
        );
        if (resultBox) {
          resultBox.className = 'p-3.5 rounded-xl border transition-all text-xs bg-emerald-50 border-emerald-300 text-emerald-950 block';
          resultBox.innerHTML = `
            <div class="font-black text-emerald-800 mb-1 flex items-center gap-1.5 text-sm">
              <i data-lucide="award" class="w-5 h-5 text-emerald-600"></i>
              ¡Cinco de Cinco Sumas Completadas!
            </div>
            <div class="font-bold text-emerald-900 mb-2">
              Respuesta correcta: <strong>${currentQ.correctNumber} (${currentQ.correctWord})</strong>. Has completado toda la misión de adiciones.
            </div>
            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-900 font-black">
              <kbd class="px-2 py-0.5 rounded bg-white border border-emerald-300 text-slate-900 text-[11px]">Espacio</kbd>
              <span>Presiona la barra espaciadora para cerrar y guardar la actividad</span>
            </div>
          `;
        }
      } else {
        this.currentQuestionIndex++;
        const nextQ = questions[this.currentQuestionIndex];
        const progressPct = Math.round((this.completedStepsCount / questions.length) * 100);
        this.refreshActivityBodyDom();
        await this.persistCurrentActivityState(
          'En progreso',
          progressPct,
          null,
          `Avance en Sumas hasta el 10 (${this.completedStepsCount} de ${questions.length} resueltas).`
        );
        if (resultBox) {
          resultBox.className = 'p-3.5 rounded-xl border transition-all text-xs bg-emerald-50 border-emerald-300 text-emerald-950 block';
          resultBox.innerHTML = `
            <div class="font-black text-emerald-800 mb-1 flex items-center gap-1.5">
              <i data-lucide="check-circle" class="w-4 h-4 text-emerald-600"></i>
              ¡Muy bien! El resultado era ${currentQ.correctNumber} (${currentQ.correctWord}).
            </div>
            <div class="text-xs text-emerald-800 font-semibold">
              Avanzamos al <strong>Problema ${this.currentQuestionIndex + 1} de ${questions.length}</strong>. Escucha a Robot Leo.
            </div>
          `;
        }
        if (nextQ && nextQ.speechAudioText && window.api && api.speakText) {
          api.speakText(`¡Muy bien! El resultado es ${currentQ.correctWord}. Ahora: ${nextQ.speechAudioText}`);
        }
      }
    } else {
      const feedbackText = spokenNum !== null
        ? `Escuchamos el número ${spokenNum}. Observa los dibujos de ambos grupos, cuéntalos todos juntos y vuelve a decir el resultado.`
        : `No escuchamos un número claro. Cuenta los dibujos en pantalla y di el resultado en voz alta.`;
      if (resultBox) {
        resultBox.className = 'p-3.5 rounded-xl border transition-all text-xs bg-amber-50 border-amber-300 text-amber-950 block';
        resultBox.innerHTML = `
          <div class="font-black text-amber-900 mb-1 flex items-center gap-1.5">
            <i data-lucide="help-circle" class="w-4 h-4 text-amber-600"></i>
            Intentémoslo otra vez
          </div>
          <div class="italic text-slate-700 bg-white/80 p-2 rounded-lg border border-amber-200 mb-1.5">
            "${rawTranscript || '(Sin respuesta numérica)'}"
          </div>
          <div class="text-xs text-amber-900 font-semibold">${feedbackText}</div>
        `;
      }
      if (window.api && api.speakText) {
        api.speakText(feedbackText);
      }
    }
    if (window.lucide) lucide.createIcons();
  },

  // Evaluador para Actividad 1 de Lenguaje: Conciencia Fonologica (LE01 OA 03)
  async evaluatePhonologicalStep(spokenText, rawTranscript) {
    const act = this.getActiveActivityObject();
    const questions = (act && Array.isArray(act.questions)) ? act.questions : [];
    const currentQ = questions[this.currentQuestionIndex];
    if (!currentQ) return;

    const clean = (spokenText || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ").trim();
    const words = clean.split(/\s+/).filter(Boolean);
    const accepted = (currentQ.acceptedTokens || []).map(t => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
    const targetLetter = (currentQ.targetLetter || '').toLowerCase();
    const targetSyllable = (currentQ.targetSyllable || '').toLowerCase();

    const isCorrect = accepted.includes(clean) ||
      words.includes(targetLetter) ||
      words.includes(targetSyllable) ||
      accepted.some(tok => tok.length >= 2 && clean.includes(tok));

    const resultBox = document.getElementById('voice-transcription-result');

    if (isCorrect) {
      this.completedStepsCount = this.currentQuestionIndex + 1;
      const isLast = this.completedStepsCount >= questions.length;

      if (isLast) {
        this.isCurrentActivityFinished = true;
        this.refreshActivityBodyDom();
        this.updateCompletedUiInModal();
        const msgDone = '¡Excelente trabajo! Identificaste el sonido inicial de las cinco palabras. Presiona la barra espaciadora para cerrar.';
        if (window.api && api.speakText) api.speakText(msgDone);
        await this.persistCurrentActivityState(
          'Entregada',
          100,
          7.0,
          `Las 5 palabras de conciencia fonológica (LE01 OA 03) fueron completadas correctamente.`
        );
        if (resultBox) {
          resultBox.className = 'p-3.5 rounded-xl border transition-all text-xs bg-emerald-50 border-emerald-300 text-emerald-950 block';
          resultBox.innerHTML = `
            <div class="font-black text-emerald-800 mb-1 flex items-center gap-1.5 text-sm">
              <i data-lucide="award" class="w-5 h-5 text-emerald-600"></i>
              ¡Caza de Sonidos Completada con Éxito!
            </div>
            <div class="font-bold text-emerald-900 mb-2">
              ¡Muy bien! <strong>${currentQ.word}</strong> comienza con la letra <strong>${currentQ.targetLetter} (${currentQ.targetSyllable})</strong>.
            </div>
            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-900 font-black">
              <kbd class="px-2 py-0.5 rounded bg-white border border-emerald-300 text-slate-900 text-[11px]">Espacio</kbd>
              <span>Presiona la barra espaciadora para cerrar y guardar la actividad</span>
            </div>
          `;
        }
      } else {
        this.currentQuestionIndex++;
        const nextQ = questions[this.currentQuestionIndex];
        const progressPct = Math.round((this.completedStepsCount / questions.length) * 100);
        this.refreshActivityBodyDom();
        await this.persistCurrentActivityState(
          'En progreso',
          progressPct,
          null,
          `Avance en Caza de Sonidos (${this.completedStepsCount} de ${questions.length} palabras).`
        );
        if (resultBox) {
          resultBox.className = 'p-3.5 rounded-xl border transition-all text-xs bg-emerald-50 border-emerald-300 text-emerald-950 block';
          resultBox.innerHTML = `
            <div class="font-black text-emerald-800 mb-1 flex items-center gap-1.5">
              <i data-lucide="check-circle" class="w-4 h-4 text-emerald-600"></i>
              ¡Correcto! ${currentQ.word} comienza con ${currentQ.targetLetter} (${currentQ.targetSyllable}).
            </div>
            <div class="text-xs text-emerald-800 font-semibold">
              Pasamos a la <strong>Palabra ${this.currentQuestionIndex + 1} de ${questions.length}</strong>.
            </div>
          `;
        }
        if (nextQ && nextQ.speechAudioText && window.api && api.speakText) {
          api.speakText(`¡Correcto! Ahora: ${nextQ.speechAudioText}`);
        }
      }
    } else {
      const hint = `Escucha el primer sonido de la palabra ${currentQ.word}: empieza con la sílaba ${currentQ.targetSyllable}, de la letra ${currentQ.targetLetter}. Inténtalo de nuevo.`;
      if (resultBox) {
        resultBox.className = 'p-3.5 rounded-xl border transition-all text-xs bg-amber-50 border-amber-300 text-amber-950 block';
        resultBox.innerHTML = `
          <div class="font-black text-amber-900 mb-1 flex items-center gap-1.5">
            <i data-lucide="volume-2" class="w-4 h-4 text-amber-600"></i>
            Escuchemos el sonido inicial otra vez
          </div>
          <div class="italic text-slate-700 bg-white/80 p-2 rounded-lg border border-amber-200 mb-1.5">
            "${rawTranscript || '(No se detectó la letra inicial)'}"
          </div>
          <div class="text-xs text-amber-900 font-semibold">${hint}</div>
        `;
      }
      if (window.api && api.speakText) {
        api.speakText(hint);
      }
    }
    if (window.lucide) lucide.createIcons();
  },

  // Evaluador con IA (Booleano es_correcto) para Actividad 2 de Lenguaje: Comprension Oral (LE01 OA 18)
  async evaluateStoryComprehensionStep(transcript) {
    const act = this.getActiveActivityObject();
    const questions = (act && Array.isArray(act.questions)) ? act.questions : [];
    const currentQ = questions[this.currentQuestionIndex];
    if (!currentQ) return;

    const resultBox = document.getElementById('voice-transcription-result');
    if (resultBox) {
      resultBox.className = 'p-3.5 rounded-xl border transition-all text-xs bg-blue-50 border-blue-300 text-blue-900 block';
      resultBox.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>
          <span class="font-bold">Robot Leo está revisando tu respuesta sobre el cuento...</span>
        </div>
      `;
    }

    const apiClient = window.api || (typeof api !== 'undefined' ? api : null);
    const evalRes = await apiClient.evaluateStoryAnswerWithAi({
      actividad_codigo: act.id || 'act-len-2',
      pregunta_numero: currentQ.number || (this.currentQuestionIndex + 1),
      relato_contexto: act.storyText || '',
      pregunta: currentQ.question || '',
      criterio_correcto: currentQ.criterio || '',
      palabras_clave_respaldo: currentQ.keywords || [],
      transcripcion_alumno: transcript
    });

    const esCorrecto = Boolean(evalRes && evalRes.es_correcto === true);
    const retroalimentacion = (evalRes && evalRes.retroalimentacion)
      ? evalRes.retroalimentacion
      : (esCorrecto ? '¡Muy bien dicho! Tu respuesta demuestra comprensión de la historia.' : (currentQ.hintText || 'Escucha nuevamente la pregunta e inténtalo otra vez.'));

    if (esCorrecto) {
      this.completedStepsCount = this.currentQuestionIndex + 1;
      const isLast = this.completedStepsCount >= questions.length;

      if (isLast) {
        this.isCurrentActivityFinished = true;
        this.refreshActivityBodyDom();
        this.updateCompletedUiInModal();
        const finalSpeech = `${retroalimentacion} ¡Felicitaciones! Respondiste correctamente las tres preguntas del cuento. Presiona la barra espaciadora para cerrar la actividad.`;
        if (apiClient && apiClient.speakText) apiClient.speakText(finalSpeech);

        await this.persistCurrentActivityState(
          'Entregada',
          100,
          7.0,
          `Comprensión oral de relato (LE01 OA 18) completada por voz (3/3 respuestas validadas como correctas).`
        );

        if (resultBox) {
          resultBox.className = 'p-3.5 rounded-xl border transition-all text-xs bg-emerald-50 border-emerald-300 text-emerald-950 block';
          resultBox.innerHTML = `
            <div class="flex items-center justify-between flex-wrap gap-2 mb-1.5">
              <div class="font-black text-emerald-800 flex items-center gap-1.5 text-sm">
                <i data-lucide="award" class="w-5 h-5 text-emerald-600"></i>
                ¡Comprensión del Cuento Completada!
              </div>
              <span class="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[11px] uppercase">Respuesta Correcta</span>
            </div>
            <div class="italic text-slate-800 bg-white/80 p-2 rounded-lg border border-emerald-200 mb-2">
              Tu respuesta: "${transcript}"
            </div>
            <div class="font-bold text-emerald-900 mb-2">
              Robot Leo dice: "${retroalimentacion}"
            </div>
            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-900 font-black">
              <kbd class="px-2 py-0.5 rounded bg-white border border-emerald-300 text-slate-900 text-[11px]">Espacio</kbd>
              <span>Presiona la barra espaciadora para cerrar y guardar la actividad</span>
            </div>
          `;
        }
      } else {
        this.currentQuestionIndex++;
        const nextQ = questions[this.currentQuestionIndex];
        const progressPct = Math.round((this.completedStepsCount / questions.length) * 100);
        this.refreshActivityBodyDom();

        await this.persistCurrentActivityState(
          'En progreso',
          progressPct,
          null,
          `Avance en comprensión oral (${this.completedStepsCount} de ${questions.length} preguntas respondidas por voz).`
        );

        if (resultBox) {
          resultBox.className = 'p-3.5 rounded-xl border transition-all text-xs bg-emerald-50 border-emerald-300 text-emerald-950 block';
          resultBox.innerHTML = `
            <div class="flex items-center justify-between flex-wrap gap-2 mb-1.5">
              <div class="font-black text-emerald-800 flex items-center gap-1.5">
                <i data-lucide="check-circle" class="w-4 h-4 text-emerald-600"></i>
                ¡Excelente comprensión de la historia!
              </div>
              <span class="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[11px] uppercase">Respuesta Correcta</span>
            </div>
            <div class="italic text-slate-800 bg-white/80 p-2 rounded-lg border border-emerald-200 mb-1.5">
              Tu respuesta: "${transcript}"
            </div>
            <div class="text-xs text-emerald-900 font-semibold">
              Robot Leo dice: "${retroalimentacion}" • Avanzamos a la <strong>Pregunta ${this.currentQuestionIndex + 1} de ${questions.length}</strong>.
            </div>
          `;
        }
        if (nextQ && nextQ.speechAudioText && apiClient && apiClient.speakText) {
          apiClient.speakText(`${retroalimentacion} ... Siguiente pregunta: ${nextQ.speechAudioText}`);
        }
      }
    } else {
      if (resultBox) {
        resultBox.className = 'p-3.5 rounded-xl border transition-all text-xs bg-amber-50 border-amber-300 text-amber-950 block';
        resultBox.innerHTML = `
          <div class="flex items-center justify-between flex-wrap gap-2 mb-1.5">
            <div class="font-black text-amber-900 flex items-center gap-1.5">
              <i data-lucide="rotate-ccw" class="w-4 h-4 text-amber-600"></i>
              Pensemos juntos en el cuento
            </div>
            <span class="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950 font-black text-[11px] uppercase">Intentar de Nuevo</span>
          </div>
          <div class="italic text-slate-800 bg-white/80 p-2 rounded-lg border border-amber-200 mb-1.5">
            Tu respuesta: "${transcript}"
          </div>
          <div class="text-xs text-amber-900 font-semibold">
            Robot Leo dice: "${retroalimentacion}"
          </div>
        `;
      }
      if (apiClient && apiClient.speakText) {
        apiClient.speakText(retroalimentacion);
      }
    }
    if (window.lucide) lucide.createIcons();
  },

  toggleCountedNumber(num) {
    const numberWords = {
      1: "uno", 2: "dos", 3: "tres", 4: "cuatro", 5: "cinco",
      6: "seis", 7: "siete", 8: "ocho", 9: "nueve", 10: "diez"
    };
    const nextExpected = this.countedNumbers.length + 1;
    const resultBox = document.getElementById('voice-transcription-result');

    if (num === nextExpected) {
      this.countedNumbers.push(num);
      const isComplete = this.isCountingActivityCompleted();
      if (isComplete) {
        this.updateCompletedUiInModal();
        this.speakCountCompleted();
        this.persistCurrentActivityState(
          'Entregada',
          100,
          7.0,
          'Conteo del 1 al 10 en orden completado correctamente (10/10).'
        );
      } else {
        this.persistCurrentActivityState(
          'En progreso',
          this.countedNumbers.length * 10,
          null,
          `Avance de conteo en orden (${this.countedNumbers.length} de 10 numeros).`
        );
      }
      if (resultBox) {
        resultBox.classList.remove('hidden');
        if (isComplete) {
          resultBox.className = 'p-3.5 rounded-xl border transition-all text-xs bg-emerald-50 border-emerald-300 text-emerald-950 block';
          resultBox.innerHTML = `
            <div class="font-black text-emerald-800 mb-1 flex items-center gap-1.5 text-sm">
              <i data-lucide="award" class="w-5 h-5 text-emerald-600"></i>
              ¡Conteo 1 al 10 Completado en Orden!
            </div>
            <div class="font-bold text-emerald-800 mb-1.5">
              Robot Leo dice: "¡Excelente! Llegaste al 10 en orden paso a paso y ganaste tus 10 estrellas."
            </div>
            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-900 font-black">
              <kbd class="px-2 py-0.5 rounded bg-white border border-emerald-300 text-slate-900 text-[11px]">Espacio</kbd>
              <span>Presiona la barra espaciadora para cerrar la actividad</span>
            </div>
          `;
        } else {
          const next = this.countedNumbers.length + 1;
          resultBox.className = 'p-3 rounded-xl border transition-all text-xs bg-emerald-50 border-emerald-300 text-emerald-900 block';
          resultBox.innerHTML = `
            <div class="font-bold text-emerald-800 flex items-center gap-1.5">
              <i data-lucide="check" class="w-4 h-4 text-emerald-600"></i>
              ¡Correcto! Marcaste el ${num} (${numberWords[num]}).
            </div>
            <div class="text-xs text-emerald-700 mt-0.5">
              Siguiente número en orden: <strong>${next} (${numberWords[next]})</strong>.
            </div>
          `;
        }
      }
    } else if (this.countedNumbers.length > 0 && num === this.countedNumbers[this.countedNumbers.length - 1]) {
      this.countedNumbers.pop();
      this.restoreRecordingUiInModal();
      const next = this.countedNumbers.length + 1;
      if (resultBox) {
        resultBox.classList.remove('hidden');
        resultBox.className = 'p-3 rounded-xl border transition-all text-xs bg-slate-50 border-slate-300 text-slate-800 block';
        resultBox.innerHTML = `
          <div class="font-bold">Paso deshecho:</div>
          <div class="text-xs text-slate-600">Tu siguiente número en la secuencia es el ${next} (${numberWords[next]}).</div>
        `;
      }
    } else if (num > nextExpected) {
      if (resultBox) {
        resultBox.classList.remove('hidden');
        resultBox.className = 'p-3 rounded-xl border transition-all text-xs bg-amber-50 border-amber-300 text-amber-950 block';
        resultBox.innerHTML = `
          <div class="font-black text-amber-900 flex items-center gap-1.5">
            <i data-lucide="alert-triangle" class="w-4 h-4 text-amber-600"></i>
            ¡Recuerda seguir el orden!
          </div>
          <div class="text-xs text-amber-800 mt-0.5">
            Tocaste el ${num}, pero ibas en el ${this.countedNumbers[this.countedNumbers.length - 1] || 'inicio'}. Primero debes marcar o decir el <strong>${nextExpected} (${numberWords[nextExpected]})</strong>.
          </div>
        `;
      }
    } else {
      if (resultBox) {
        resultBox.classList.remove('hidden');
        resultBox.className = 'p-3 rounded-xl border transition-all text-xs bg-blue-50 border-blue-200 text-blue-900 block';
        resultBox.innerHTML = `
          <div class="font-bold">El ${num} (${numberWords[num]}) ya está listo.</div>
          <div class="text-xs text-blue-800">Tu turno actual es el número <strong>${nextExpected} (${numberWords[nextExpected]})</strong>.</div>
        `;
      }
    }

    this.refreshActivityBodyDom();
  },

  extractSpokenNumbersInOrder(text) {
    if (!text) return [];
    const normalized = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const pattern = /\b(diez|decimo|10|nueve|noveno|9|ocho|octavo|8|siete|septimo|7|seis|sexto|6|cinco|quinto|5|cuatro|cuarto|4|tres|tercero|3|dos|segundo|2|uno|primero|una|un|1|cero|0)\b/gi;
    const wordMap = {
      '0': 0, 'cero': 0,
      '1': 1, 'uno': 1, 'un': 1, 'una': 1, 'primero': 1,
      '2': 2, 'dos': 2, 'segundo': 2,
      '3': 3, 'tres': 3, 'tercero': 3,
      '4': 4, 'cuatro': 4, 'cuarto': 4,
      '5': 5, 'cinco': 5, 'quinto': 5,
      '6': 6, 'seis': 6, 'sexto': 6,
      '7': 7, 'siete': 7, 'septimo': 7,
      '8': 8, 'ocho': 8, 'octavo': 8,
      '9': 9, 'nueve': 9, 'noveno': 9,
      '10': 10, 'diez': 10, 'decimo': 10
    };
    const results = [];
    let match;
    while ((match = pattern.exec(normalized)) !== null) {
      const val = wordMap[match[0].toLowerCase()];
      if (val !== undefined) {
        results.push(val);
      }
    }
    return results;
  },

  validateSequentialCounting(spokenTokens) {
    const numberWords = {
      1: "uno", 2: "dos", 3: "tres", 4: "cuatro", 5: "cinco",
      6: "seis", 7: "siete", 8: "ocho", 9: "nueve", 10: "diez"
    };

    const validTokens = (spokenTokens || []).filter(n => n >= 1 && n <= 10);
    if (!validTokens || validTokens.length === 0) {
      const nextExpected = this.countedNumbers.length + 1;
      return {
        success: false,
        status: 'no_numbers',
        newlyAdded: [],
        nextExpected: nextExpected,
        message: `No escuchamos ningún número claro. Tu siguiente número es el ${nextExpected} (${numberWords[nextExpected] || ''}). Presiona el micrófono y dilo con voz firme.`
      };
    }

    const currentCompleted = [...this.countedNumbers];
    let nextExpected = currentCompleted.length + 1;

    let tokens = [...validTokens];
    if (currentCompleted.length > 0 && tokens[0] === currentCompleted[currentCompleted.length - 1] && tokens.length > 1) {
      tokens.shift();
    }

    const newlyAdded = [];
    let orderError = null;

    for (let i = 0; i < tokens.length; i++) {
      const num = tokens[i];
      if (nextExpected > 10) break;

      if (num === nextExpected) {
        newlyAdded.push(num);
        currentCompleted.push(num);
        nextExpected++;
      } else {
        orderError = {
          expected: nextExpected,
          spoken: num,
          tokenIndex: i
        };
        break;
      }
    }

    if (newlyAdded.length > 0) {
      this.countedNumbers = currentCompleted;
    }

    const totalCount = this.countedNumbers.length;
    const isCompleted = totalCount === 10;

    if (isCompleted) {
      return {
        success: true,
        status: 'completed',
        newlyAdded: newlyAdded,
        totalCount: 10,
        message: '¡EXTRAORDINARIO! Has completado el conteo del 1 al 10 en orden perfecto. Robot Leo te entrega tus 10 estrellas doradas.'
      };
    }

    if (newlyAdded.length > 0 && !orderError) {
      return {
        success: true,
        status: 'advanced',
        newlyAdded: newlyAdded,
        nextExpected: nextExpected,
        totalCount: totalCount,
        message: `¡Muy bien! Dijiste ${newlyAdded.join(', ')} en orden correcto. Tu siguiente número es el ${nextExpected} (${numberWords[nextExpected]}).`
      };
    }

    if (newlyAdded.length > 0 && orderError) {
      const expWord = numberWords[orderError.expected];
      return {
        success: true,
        status: 'partial_with_error',
        newlyAdded: newlyAdded,
        nextExpected: orderError.expected,
        totalCount: totalCount,
        message: `¡Avanzaste con ${newlyAdded.join(', ')}! Pero luego escuchamos el ${orderError.spoken}. Recuerda el orden: te falta decir el ${orderError.expected} (${expWord}).`
      };
    }

    if (orderError) {
      const expWord = numberWords[orderError.expected];
      if (orderError.spoken > orderError.expected) {
        return {
          success: false,
          status: 'skipped',
          nextExpected: orderError.expected,
          spoken: orderError.spoken,
          message: `¡Cuidado con el orden! Escuchamos el ${orderError.spoken}, pero te saltaste el ${orderError.expected} (${expWord}). Ibas en el ${orderError.expected - 1 || 'inicio'}. Di en voz alta: "${expWord}".`
        };
      } else if (orderError.spoken === orderError.expected - 1) {
        return {
          success: false,
          status: 'repeated',
          nextExpected: orderError.expected,
          spoken: orderError.spoken,
          message: `El ${orderError.spoken} ya está completado con su estrella. Ahora te toca decir el ${orderError.expected} (${expWord}). ¡Inténtalo!`
        };
      } else {
        return {
          success: false,
          status: 'out_of_order',
          nextExpected: orderError.expected,
          spoken: orderError.spoken,
          message: `Ese número no corresponde al orden. El siguiente que debes decir es el ${orderError.expected} (${expWord}). Di en voz alta: "${expWord}".`
        };
      }
    }

    return {
      success: false,
      status: 'unknown',
      nextExpected: nextExpected,
      message: `Recuerda decir el número ${nextExpected} (${numberWords[nextExpected]}).`
    };
  },

  closeVoiceModal() {
    const apiClient = window.api || (typeof api !== 'undefined' ? api : null);
    if (apiClient && apiClient.stopSpeaking) {
      apiClient.stopSpeaking();
    }
    if (this.isRecordingVoice && apiClient && apiClient.mediaRecorder && apiClient.isRecordingAudio) {
      try {
        apiClient.mediaRecorder.stop();
        if (apiClient.mediaRecorder.stream) {
          apiClient.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
      } catch (e) {
        console.warn("[Voz] Error deteniendo grabador al cerrar modal:", e);
      }
      this.isRecordingVoice = false;
    }
    this.isVoiceModalOpen = false;
    this.renderModalContainer();
  },

  async toggleVoiceRecording() {
    if (this._isBusyTranscribing) return;

    const act = this.getActiveActivityObject();
    const type = (act && act.activityType) ? act.activityType : 'counting';
    const btn = document.getElementById('voice-record-btn');
    const btnText = document.getElementById('voice-record-text');
    const resultBox = document.getElementById('voice-transcription-result');
    const apiClient = window.api || (typeof api !== 'undefined' ? api : null);

    if (!apiClient) {
      alert('Servicio no disponible.');
      return;
    }

    if (apiClient.stopSpeaking) {
      apiClient.stopSpeaking();
    }

    const defaultBtnLabel = type === 'counting' ? 'Presionar para Contar (Espacio)' : 'Responder con Voz (Espacio)';

    if (!this.isRecordingVoice) {
      const listeningPrompts = {
        counting: 'Escuchando... Di los números en voz alta: uno, dos, tres... (Pulsa Espacio al terminar)',
        addition: 'Escuchando... Di en voz alta el resultado de la suma (Pulsa Espacio al terminar)',
        phonological: 'Escuchando... Di la letra o sílaba con que empieza la palabra (Pulsa Espacio al terminar)',
        story_comprehension: 'Escuchando tu respuesta sobre el cuento... Habla con claridad (Pulsa Espacio al terminar)'
      };
      if (resultBox) {
        resultBox.className = 'p-3.5 rounded-xl border transition-all text-xs bg-amber-50 border-amber-300 text-amber-900 block';
        resultBox.innerHTML = `
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            <span class="font-bold">${listeningPrompts[type] || listeningPrompts.counting}</span>
          </div>
        `;
      }

      if (btn) {
        btn.className = 'w-full sm:w-auto px-6 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs sm:text-sm shadow-lg transition flex items-center justify-center gap-2 animate-pulse cursor-pointer';
        if (btnText) btnText.textContent = 'Detener y Enviar (Espacio)';
      }

      const startRes = await apiClient.startVoiceRecording();
      if (!startRes.success) {
        this.isRecordingVoice = false;
        if (btn) {
          btn.className = 'w-full sm:w-auto px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-950 font-black text-xs sm:text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer';
          if (btnText) btnText.textContent = defaultBtnLabel;
        }
        if (resultBox) {
          resultBox.className = 'p-3.5 rounded-xl border transition-all text-xs bg-rose-50 border-rose-300 text-rose-800 block';
          resultBox.innerHTML = `
            <div class="font-bold">Aviso del micrófono:</div>
            <div>${startRes.error || 'No se pudo iniciar la captura de audio.'}</div>
          `;
        }
        return;
      }
      this.isRecordingVoice = true;
    } else {
      this._isBusyTranscribing = true;
      if (btn) {
        btn.className = 'w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-500 text-white font-black text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 cursor-wait';
        if (btnText) btnText.textContent = 'Escuchando tu respuesta...';
      }
      if (resultBox) {
        resultBox.className = 'p-3.5 rounded-xl border transition-all text-xs bg-blue-50 border-blue-300 text-blue-900 block';
        resultBox.innerHTML = `
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping"></span>
            <span class="font-bold">Robot Leo está procesando tu voz...</span>
          </div>
        `;
      }

      const res = await apiClient.stopVoiceRecordingAndTranscribe('es');
      this.isRecordingVoice = false;
      this._isBusyTranscribing = false;

      if (btn) {
        btn.className = 'w-full sm:w-auto px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-950 font-black text-xs sm:text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer';
        if (btnText) btnText.textContent = defaultBtnLabel;
      }

      if (res && res.success) {
        const transcript = (res.transcripcion || res.transcript || '').trim();

        // Despachar según el tipo de actividad oficial Mineduc
        if (type === 'addition') {
          const nums = this.extractSpokenNumbersInOrder(transcript);
          const lastNum = nums.length > 0 ? nums[nums.length - 1] : null;
          await this.evaluateAdditionStep(lastNum, transcript);
          return;
        }

        if (type === 'phonological') {
          await this.evaluatePhonologicalStep(transcript, transcript);
          return;
        }

        if (type === 'story_comprehension') {
          await this.evaluateStoryComprehensionStep(transcript);
          return;
        }

        // Por defecto: Actividad 1 de Matematica (Conteo 1 al 10 - MA01 OA 01)
        const spokenTokens = this.extractSpokenNumbersInOrder(transcript);
        const validation = this.validateSequentialCounting(spokenTokens);

        this.refreshActivityBodyDom();

        const updatedResultBox = document.getElementById('voice-transcription-result');
        if (updatedResultBox) {
          updatedResultBox.classList.remove('hidden');

          if (validation.status === 'completed') {
            this.updateCompletedUiInModal();
            this.speakCountCompleted();
            this.persistCurrentActivityState(
              'Entregada',
              100,
              7.0,
              `Conteo del 1 al 10 en orden completado correctamente con voz: "${transcript}"`
            );
            updatedResultBox.className = 'p-3.5 rounded-xl border transition-all text-xs bg-emerald-50 border-emerald-300 text-emerald-950 block';
            updatedResultBox.innerHTML = `
              <div class="font-black text-emerald-800 mb-1 flex items-center gap-1.5 text-sm">
                <i data-lucide="award" class="w-5 h-5 text-emerald-600"></i>
                ¡EXTRAORDINARIO! Conteo del 1 al 10 completado en orden perfecto
              </div>
              <div class="italic text-slate-800 bg-white/80 p-2 rounded-lg border border-emerald-200 mb-2">
                "${transcript}"
              </div>
              <div class="font-bold text-emerald-800 mb-2">
                Robot Leo dice: "¡Excelente pronunciación y memoria! Dijiste todos los números en su orden exacto. ¡Has ganado las 10 estrellas doradas!"
              </div>
              <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-900 font-black">
                <kbd class="px-2 py-0.5 rounded bg-white border border-emerald-300 text-slate-900 text-[11px]">Espacio</kbd>
                <span>Presiona la barra espaciadora para cerrar y guardar la actividad</span>
              </div>
            `;
          } else if (validation.status === 'advanced') {
            this.persistCurrentActivityState(
              'En progreso',
              this.countedNumbers.length * 10,
              null,
              `Avance de conteo por voz (${this.countedNumbers.length} de 10 numeros).`
            );
            updatedResultBox.className = 'p-3.5 rounded-xl border transition-all text-xs bg-emerald-50 border-emerald-300 text-emerald-950 block';
            updatedResultBox.innerHTML = `
              <div class="font-black text-emerald-800 mb-1 flex items-center gap-1.5 text-xs sm:text-sm">
                <i data-lucide="check-circle" class="w-4 h-4 text-emerald-600"></i>
                ¡Secuencia correcta! Números validados: <strong>${validation.newlyAdded.join(' -> ')}</strong>
              </div>
              <div class="italic text-slate-800 bg-white/80 p-2 rounded-lg border border-emerald-200 mb-2">
                "${transcript}"
              </div>
              <div class="text-xs text-emerald-900 font-semibold">
                Robot Leo dice: "${validation.message}"
              </div>
            `;
          } else if (validation.status === 'partial_with_error') {
            this.persistCurrentActivityState(
              'En progreso',
              this.countedNumbers.length * 10,
              null,
              `Avance parcial de conteo por voz (${this.countedNumbers.length} de 10 numeros).`
            );
            updatedResultBox.className = 'p-3.5 rounded-xl border transition-all text-xs bg-amber-50 border-amber-300 text-amber-950 block';
            updatedResultBox.innerHTML = `
              <div class="font-black text-amber-900 mb-1 flex items-center gap-1.5 text-xs sm:text-sm">
                <i data-lucide="alert-triangle" class="w-4 h-4 text-amber-600"></i>
                ¡Avanzaste parte de la secuencia! Pero hubo un salto en el orden
              </div>
              <div class="italic text-slate-800 bg-white/80 p-2 rounded-lg border border-amber-200 mb-2">
                "${transcript}"
              </div>
              <div class="text-xs text-amber-900 font-medium">
                Robot Leo dice: "${validation.message}"
              </div>
            `;
          } else if (validation.status === 'skipped') {
            updatedResultBox.className = 'p-3.5 rounded-xl border transition-all text-xs bg-amber-50 border-amber-300 text-amber-950 block';
            updatedResultBox.innerHTML = `
              <div class="font-black text-amber-900 mb-1 flex items-center gap-1.5 text-xs sm:text-sm">
                <i data-lucide="alert-circle" class="w-4 h-4 text-amber-600"></i>
                ¡Cuidado con el orden de los números!
              </div>
              <div class="italic text-slate-800 bg-white/80 p-2 rounded-lg border border-amber-200 mb-2">
                "${transcript}"
              </div>
              <div class="text-xs text-amber-900 font-semibold">
                Robot Leo dice: "${validation.message}"
              </div>
            `;
          } else if (validation.status === 'out_of_order' || validation.status === 'repeated') {
            updatedResultBox.className = 'p-3.5 rounded-xl border transition-all text-xs bg-rose-50 border-rose-300 text-rose-950 block';
            updatedResultBox.innerHTML = `
              <div class="font-black text-rose-900 mb-1 flex items-center gap-1.5 text-xs sm:text-sm">
                <i data-lucide="rotate-ccw" class="w-4 h-4 text-rose-600"></i>
                Orden incorrecto detectado
              </div>
              <div class="italic text-slate-800 bg-white/80 p-2 rounded-lg border border-rose-200 mb-2">
                "${transcript}"
              </div>
              <div class="text-xs text-rose-900 font-semibold">
                Robot Leo dice: "${validation.message}"
              </div>
            `;
          } else {
            updatedResultBox.className = 'p-3.5 rounded-xl border transition-all text-xs bg-blue-50 border-blue-300 text-blue-950 block';
            updatedResultBox.innerHTML = `
              <div class="font-black text-blue-800 mb-1 flex items-center gap-1.5">
                <i data-lucide="volume-2" class="w-4 h-4 text-blue-600"></i>
                Robot Leo escuchó:
              </div>
              <div class="italic text-slate-800 bg-white/80 p-2 rounded-lg border border-blue-200 mb-2">
                "${transcript || '(No se detectó voz clara)'}"
              </div>
              <div class="text-xs text-blue-800 font-semibold">
                Robot Leo dice: "${validation.message}"
              </div>
            `;
          }
          lucide.createIcons();
        }
      } else {
        const updatedResultBox = document.getElementById('voice-transcription-result');
        if (updatedResultBox) {
          updatedResultBox.className = 'p-3.5 rounded-xl border transition-all text-xs bg-rose-50 border-rose-300 text-rose-800 block';
          updatedResultBox.innerHTML = `
            <div class="font-bold text-rose-800 mb-1 flex items-center gap-1.5">
              <i data-lucide="alert-circle" class="w-4 h-4 text-rose-600"></i>
              No pudimos escuchar tu voz:
            </div>
            <div class="text-xs text-rose-700">
              ${res.error || 'Por favor habla cerca del micrófono y vuelve a intentar.'}
            </div>
          `;
          lucide.createIcons();
        }
      }
    }
  },

  renderModalContainer() {
    const modalContainer = document.getElementById('modal-container');
    if (modalContainer) {
      modalContainer.innerHTML = components.renderVoiceModal(this.isVoiceModalOpen, this.voiceModalContextTitle);
      lucide.createIcons();
    }
  },

  getViewHtml() {
    switch (this.currentView) {
      case 'reporteria':
        return reporteriaView.render();
      case 'alertas':
        return alertasView.render();
      case 'actividades':
        return actividadesView.render();
      case 'asignar':
        return asignarView.render();
      case 'mensajeria':
        return mensajeriaView.render();
      default:
        return actividadesView.render();
    }
  },

  async speakHeroGreeting(name, course) {
    const studentName = name || (this.currentUser ? this.currentUser.name : 'amiguito');
    const text = `¡Hola ${studentName}! Toca el botón amarillo grande para jugar conmigo a las actividades escolares. ¡Vamos, tú puedes ganar estrellas hoy!`;
    const btn = document.getElementById('btn-hero-speak');
    if (btn) btn.classList.add('ring-2', 'ring-amber-300', 'animate-pulse');
    if (window.api && api.speakText) {
      await api.speakText(text);
    }
    if (btn) btn.classList.remove('ring-2', 'ring-amber-300', 'animate-pulse');
  },

  async speakLeoInstructions() {
    await this.speakCurrentActivityPrompt();
  },

  async speakCountCompleted() {
    const text = '¡Extraordinario! Dijiste todos los números en su orden exacto. ¡Has ganado las 10 estrellas doradas!';
    if (window.api && api.speakText) {
      await api.speakText(text);
    }
  },

  renderCurrentView() {
    this.render();
  },

  render() {
    const appRoot = document.getElementById('app-root');
    if (!appRoot) return;

    if (!this.currentUser) {
      appRoot.innerHTML = loginView.render();
      const floatingContainer = document.getElementById('floating-voice-container');
      if (floatingContainer) floatingContainer.innerHTML = '';
      this.renderModalContainer();
      lucide.createIcons();
      return;
    }

    const viewHtml = this.getViewHtml();
    appRoot.innerHTML = layouts.renderBento(this.currentUser, this.currentView, this.currentTheme, viewHtml);

    if (this.currentView === 'reporteria') {
      reporteriaView.initCharts();
    }

    this.renderModalContainer();
    lucide.createIcons();
  }
};

window.app = app;

document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
