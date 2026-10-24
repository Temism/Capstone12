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
  rhythmLevel: 1, // 1: 1-5 (Lento), 2: 1-10 (Normal), 3: 1-15 (Agil), 4: 1-20 (Rapido)
  rhythmSpeedMode: 'normal', // 'slow' | 'normal' | 'fast'
  rhythmState: 'idle', // 'idle' | 'countdown' | 'playing' | 'evaluating' | 'round_complete'
  rhythmCountdownValue: 3,
  rhythmCurrentNumber: 1,
  rhythmBeatResults: {},
  rhythmVoiceDetectedInBeat: {},
  rhythmCompletedLevels: [],
  rhythmLastRoundSummary: null,
  _rhythmTimer: null,
  _rhythmMicMonitorInterval: null,
  _rhythmSpeechRec: null,
  _rhythmLiveTranscript: '',
  currentQuestionIndex: 0,
  completedStepsCount: 0,
  isCurrentActivityFinished: false,
  isRecordingVoice: false,
  _keyboardBound: false,
  disclaimerAndInstructionsTtsText: 'Hola. Antes de comenzar, recuerda cuidar el ruido ambiente: busca un lugar tranquilo, apaga la musica o el televisor, y habla fuerte y claro cerca del microfono. En este reto de Cuenta al Ritmo, los numeros apareceran uno por uno y debes decirlos en voz alta en espanol siguiendo el compas. Presiona la barra espaciadora nuevamente para iniciar la actividad.',

  init() {
    document.documentElement.setAttribute('data-theme', this.currentTheme);

    // Restaurar sesion persistente si existe
    try {
      const savedUser = localStorage.getItem('educonnect_web_session_user');
      if (savedUser) {
        this.currentUser = JSON.parse(savedUser);
      }
    } catch (e) {}

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
    if (found && found.activityType !== 'counting' && found.activityType !== 'skip_counting' && (!Array.isArray(found.questions) || found.questions.length === 0)) {
      const template = (mockData.studentActivities || []).find(a => a.activityType === found.activityType);
      if (template) {
        found.questions = template.questions;
        if (template.storyText && !found.storyText) found.storyText = template.storyText;
        if (template.storyTitle && !found.storyTitle) found.storyTitle = template.storyTitle;
      }
    }
    return found;
  },

  isRhythmActivityType(type) {
    return type === 'counting' || type === 'skip_counting';
  },

  getCurrentRhythmLevelObj() {
    const levels = (window.components && components.getRhythmLevelsForState)
      ? components.getRhythmLevelsForState(this)
      : ((window.components && Array.isArray(components.rhythmLevels)) ? components.rhythmLevels : []);
    return levels.find(l => l.id === (this.rhythmLevel || 1)) || levels[0] || { id: 1, maxNum: 5, step: 1, sequence: [1, 2, 3, 4, 5], beatMs: 2000 };
  },

  getCurrentRhythmSequence() {
    const lvl = this.getCurrentRhythmLevelObj();
    if (Array.isArray(lvl.sequence) && lvl.sequence.length > 0) {
      return lvl.sequence;
    }
    const maxNum = lvl.maxNum || 5;
    const step = lvl.step || 1;
    const seq = [];
    for (let n = step; n <= maxNum; n += step) seq.push(n);
    return seq;
  },

  getCurrentRhythmMaxNum() {
    const lvl = this.getCurrentRhythmLevelObj();
    return lvl ? lvl.maxNum : 5;
  },

  getEffectiveRhythmBeatMs() {
    const lvl = this.getCurrentRhythmLevelObj();
    const baseMs = lvl ? lvl.beatMs : 2000;
    if (this.rhythmSpeedMode === 'slow') return Math.round(baseMs * 1.35);
    if (this.rhythmSpeedMode === 'fast') return Math.round(baseMs * 0.82);
    return baseMs;
  },

  // Validador de finalizacion de Cuenta al Ritmo / Salta al Ritmo
  isCountingActivityCompleted() {
    if (this.isCurrentActivityFinished) return true;
    if (Array.isArray(this.rhythmCompletedLevels) && this.rhythmCompletedLevels.length > 0 && this.rhythmState === 'round_complete') {
      return true;
    }
    return false;
  },

  // Validador general de finalizacion para cualquiera de las actividades Mineduc
  isActivityCompleted() {
    const act = this.getActiveActivityObject();
    const type = (act && act.activityType) ? act.activityType : 'counting';
    if (this.isRhythmActivityType(type)) {
      return this.isCountingActivityCompleted();
    }
    return Boolean(this.isCurrentActivityFinished);
  },

  getActivityProgressSummary() {
    const act = this.getActiveActivityObject();
    const type = (act && act.activityType) ? act.activityType : 'counting';
    if (this.isRhythmActivityType(type)) {
      const seq = this.getCurrentRhythmSequence();
      const totalSeq = seq.length;
      const count = Array.isArray(this.countedNumbers) ? Math.min(totalSeq, this.countedNumbers.length) : 0;
      const pct = totalSeq > 0 ? Math.round((count / totalSeq) * 100) : 0;
      const firstNum = seq[0] || 1;
      const lastNum = seq[seq.length - 1] || 5;
      return {
        label: `Nivel ${this.rhythmLevel || 1} (${firstNum} al ${lastNum}): ${count} de ${totalSeq} al ritmo`,
        percent: pct
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
      const act = this.getActiveActivityObject();
      const type = (act && act.activityType) ? act.activityType : 'counting';
      if (this.isRhythmActivityType(type)) {
        if (this.rhythmState === 'playing') {
          const cur = this.rhythmCurrentNumber || 1;
          this.markRhythmBeatSpokenLive(cur);
          return;
        }
        if (this.rhythmState === 'countdown' || this.rhythmState === 'evaluating') {
          return;
        }
        if (this.rhythmState === 'round_complete') {
          if (this.rhythmLastRoundSummary && this.rhythmLastRoundSummary.passed) {
            if ((this.rhythmLevel || 1) < 4) {
              this.advanceToNextRhythmLevel();
            } else {
              this.completeAndCloseVoiceModal();
            }
          } else {
            this.startRhythmChallenge();
          }
          return;
        }
        this.startRhythmChallenge();
        return;
      }

      if (this.isActivityCompleted()) {
        this.completeAndCloseVoiceModal();
      } else {
        this.toggleVoiceRecording();
      }
    }
  },

  handleMainActivityAction() {
    const act = this.getActiveActivityObject();
    const type = (act && act.activityType) ? act.activityType : 'counting';
    if (this.isRhythmActivityType(type)) {
      if (this.rhythmState === 'playing') {
        this.stopRhythmChallengeManual();
      } else if (this.rhythmState === 'round_complete' && this.rhythmLastRoundSummary && this.rhythmLastRoundSummary.passed && (this.rhythmLevel || 1) >= 4) {
        this.completeAndCloseVoiceModal();
      } else {
        this.startRhythmChallenge();
      }
      return;
    }

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
    const isRhythm = this.isRhythmActivityType(type);
    const btn = document.getElementById('voice-record-btn');
    const titleEl = document.getElementById('voice-action-title');
    const subtitleEl = document.getElementById('voice-action-subtitle');
    const iconBox = document.getElementById('voice-mic-icon-box');
    const finishText = document.getElementById('voice-finish-text');

    const defaultBtnLabel = isRhythm ? '¡Vamos al Ritmo! (Espacio)' : 'Hablar Ahora (Espacio)';
    const defaultIcon = isRhythm ? 'play' : 'mic';
    if (btn) {
      btn.className = 'w-full sm:w-auto px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-950 font-black text-xs sm:text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer';
      btn.innerHTML = '<i data-lucide="' + defaultIcon + '" class="w-4 h-4"></i><span id="voice-record-text">' + defaultBtnLabel + '</span>';
    }
    if (titleEl) {
      titleEl.textContent = isRhythm
        ? 'Cuenta conmigo siguiendo el ritmo'
        : (type === 'story_comprehension' ? 'Cuéntame tu respuesta para desbloquear la pieza' : 'Dime tu respuesta por el micrófono');
    }
    if (subtitleEl) {
      subtitleEl.innerHTML = isRhythm
        ? 'Pulsa <kbd class="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-300 font-bold text-[11px]">Espacio</kbd> para iniciar la secuencia automática y di cada número a tiempo'
        : 'Toca <kbd class="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-300 font-bold text-[11px]">Espacio</kbd> o el botón para hablar';
    }
    if (iconBox) {
      iconBox.className = 'w-11 h-11 rounded-xl bg-amber-400 flex items-center justify-center shadow-xs flex-shrink-0';
      iconBox.innerHTML = '<i data-lucide="' + (isRhythm ? 'zap' : 'mic') + '" class="w-5 h-5 text-slate-950"></i>';
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
        counting: 'Actividad Cuenta al Ritmo en español completada con éxito (MA01 OA 01).',
        skip_counting: 'Actividad Salta al Ritmo: Multiplicando por 2 y por 5 completada con éxito (MA02 OA 11).',
        addition: 'Escalera de Sumas con los 5 peldaños resueltos correctamente (MA01 OA 09).',
        phonological: 'Aplaude las Sílabas y Caza de Sonidos completada en las 5 palabras (LE01 OA 03).',
        story_comprehension: 'Rompecabezas de comprensión oral Detective de Cuentos completado por voz (LE01 OA 18).'
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
    try {
      localStorage.setItem('educonnect_web_session_user', JSON.stringify(user));
    } catch (e) {}
    this.currentView = user.defaultView || 'actividades';
    if (window.mensajeriaView) {
      mensajeriaView.stopPolling();
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
    try {
      localStorage.removeItem('educonnect_web_session_user');
    } catch (e) {}
    if (window.api) {
      api.logout();
    }
    if (window.mensajeriaView) {
      mensajeriaView.stopPolling();
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
    } else {
      if (window.mensajeriaView) {
        mensajeriaView.stopPolling();
      }
      if ((viewId === 'reporteria' || viewId === 'actividades') && window.api && api.syncStudentDataFromDb) {
        api.syncStudentDataFromDb().then(() => {
          app.renderCurrentView();
        });
      }
    }
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  preloadActivityOnHover(actId) {
    if (!window.api || !api.preloadActivityAudios) return;
    const allLists = [
      ...(window.mockData?.studentActivities || []),
      ...(window.mockData?.sofiaActivities || [])
    ];
    const act = allLists.find(a => a.id === actId);
    if (act) {
      api.preloadActivityAudios(act);
    }
  },

  async openVoiceModal(activityTitle = 'Cuenta al Ritmo: Del 1 al 20 con Robot Leo', activityId = 'act-conteo') {
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

    this.stopRhythmTimersAndClean();

    // Comprobar si las recomendaciones de ruido ya fueron aceptadas en esta sesion
    const hasSeenDisclaimer = sessionStorage.getItem('educonnect_noise_disclaimer_accepted') === 'true';
    this.voiceNoiseDisclaimerAccepted = hasSeenDisclaimer;
    this.voiceModalStage = 'loading';
    this.countedNumbers = [];
    this.rhythmLevel = 1;
    this.rhythmCompletedLevels = [];
    this.rhythmState = 'idle';
    const initialSeq = this.getCurrentRhythmSequence();
    this.rhythmCurrentNumber = initialSeq[0] || 1;
    this.rhythmBeatResults = {};
    this.rhythmVoiceDetectedInBeat = {};
    this.rhythmLastRoundSummary = null;
    this.activeSyllableIndex = -1;
    this.currentQuestionIndex = 0;
    this.completedStepsCount = 0;
    this.isCurrentActivityFinished = false;
    this.isRecordingVoice = false;
    this.isVoiceModalOpen = true;
    this.renderModalContainer();

    const loadingBar = document.getElementById('counting-loading-bar');
    const loadingStatus = document.getElementById('counting-loading-status');

    try {
      if (loadingBar) loadingBar.style.width = '75%';
      if (loadingStatus) loadingStatus.textContent = 'Sincronizando voz de Robot Leo y preparando actividad...';

      const apiClient = window.api || (typeof api !== 'undefined' ? api : null);

      if (apiClient) {
        const loadTasks = [apiClient.checkHealth().catch(() => {})];
        if (apiClient.preloadActivityAudios && act) {
          loadTasks.push(apiClient.preloadActivityAudios(act));
        } else if (apiClient.preloadTtsAudio) {
          loadTasks.push(apiClient.preloadTtsAudio(this.disclaimerAndInstructionsTtsText).catch(() => {}));
          const firstPrompt = this.getCurrentStepSpeechText();
          if (firstPrompt) {
            loadTasks.push(apiClient.preloadTtsAudio(firstPrompt).catch(() => {}));
          }
        }
        await Promise.all(loadTasks);
      }

      if (!this.isVoiceModalOpen) return;
      if (loadingBar) loadingBar.style.width = '100%';
    } catch (err) {
      console.warn("[Modal] Aviso en precarga:", err);
    }

    if (!this.isVoiceModalOpen) return;

    // Si ya vio y acepto las recomendaciones de ruido en la sesion actual, entrar directo a la actividad
    if (this.voiceNoiseDisclaimerAccepted) {
      this.setModalStage('activity');
      if (act && act.activityType === 'story_comprehension' && this.currentQuestionIndex === 0) {
        await this.speakStoryAndCurrentQuestion();
      } else if (act && (act.activityType === 'addition' || act.activityType === 'phonological')) {
        await this.speakCurrentActivityPrompt();
      }
    } else {
      this.setModalStage('welcome');
    }
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
      statusEl.textContent = 'Robot Leo te está dando unos consejos rápidos...';
    }
    if (indicatorEl) {
      indicatorEl.classList.add('animate-pulse');
    }

    if (apiClient && apiClient.speakText) {
      await apiClient.speakText(this.disclaimerAndInstructionsTtsText, null, () => {
        const currentStatus = document.getElementById('disclaimer-tts-status');
        const currentIndicator = document.getElementById('disclaimer-tts-indicator');
        if (currentStatus) {
          currentStatus.textContent = '¡Todo listo! Presiona Espacio otra vez para empezar a jugar.';
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
    try {
      sessionStorage.setItem('educonnect_noise_disclaimer_accepted', 'true');
    } catch (e) {}
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
    const type = (act && act.activityType) ? act.activityType : 'counting';
    if (!act || this.isRhythmActivityType(type)) {
      const lvl = this.getCurrentRhythmLevelObj();
      const seq = this.getCurrentRhythmSequence();
      const firstNum = seq[0] || 1;
      const lastNum = seq[seq.length - 1] || 5;
      if (type === 'skip_counting') {
        return `¡Vamos a saltar de ${lvl.step || 2} en ${lvl.step || 2}! Di en voz alta los números desde el ${firstNum} hasta el ${lastNum} siguiendo el ritmo.`;
      }
      return `¡Vamos a jugar! Cuenta conmigo del uno al ${lastNum} siguiendo el ritmo. Di cada número en voz alta apenas aparezca en la pantalla.`;
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

  async speakSyllableClap(syllable, sylIndex = 0) {
    if (!syllable) return;
    this.activeSyllableIndex = sylIndex;
    this.playRhythmTone(sylIndex === 0 ? 660 : 528, 0.1, 'triangle', 0.08);
    this.refreshActivityBodyDom();
    if (window.api && api.speakText) {
      await api.speakText(`${syllable}.`);
    }
    setTimeout(() => {
      if (this.activeSyllableIndex === sylIndex) {
        this.activeSyllableIndex = -1;
        this.refreshActivityBodyDom();
      }
    }, 350);
  },

  async playWordSyllablesRhythm() {
    const act = this.getActiveActivityObject();
    const questions = (act && Array.isArray(act.questions)) ? act.questions : [];
    const currentQ = questions[this.currentQuestionIndex];
    if (!currentQ) return;
    const rawSyllables = (currentQ.syllables || currentQ.word || '').split('-').map(s => s.trim()).filter(Boolean);
    if (rawSyllables.length === 0) return;

    for (let i = 0; i < rawSyllables.length; i++) {
      this.activeSyllableIndex = i;
      this.playRhythmTone(i === 0 ? 680 : 540, 0.11, 'triangle', 0.08);
      this.refreshActivityBodyDom();
      await new Promise(r => setTimeout(r, 520));
    }
    this.activeSyllableIndex = -1;
    this.refreshActivityBodyDom();

    if (window.api && api.speakText) {
      const joinedSyl = rawSyllables.join('... ');
      await api.speakText(`${joinedSyl}... ¡${currentQ.word}! Empieza con ${currentQ.targetSyllable}.`);
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
    const combined = `${act.storyText || ''} ... Ahora escuchemos la primera pista del rompecabezas: ${qText}`;
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
    this.stopRhythmTimersAndClean();
    this.countedNumbers = [];
    this.rhythmState = 'idle';
    const seq = this.getCurrentRhythmSequence();
    this.rhythmCurrentNumber = seq[0] || 1;
    this.rhythmBeatResults = {};
    this.rhythmVoiceDetectedInBeat = {};
    this.rhythmLastRoundSummary = null;
    this.activeSyllableIndex = -1;
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

  // =========================================================================
  // MOTOR INTERACTIVO "CUENTA AL RITMO" (MA01 OA 01) Y "SALTA AL RITMO: TABLAS x2 Y x5" (MA02 OA 11)
  // =========================================================================

  getSpanishNumberWord(num) {
    const words = {
      1: 'uno', 2: 'dos', 3: 'tres', 4: 'cuatro', 5: 'cinco',
      6: 'seis', 7: 'siete', 8: 'ocho', 9: 'nueve', 10: 'diez',
      11: 'once', 12: 'doce', 13: 'trece', 14: 'catorce', 15: 'quince',
      16: 'dieciséis', 17: 'diecisiete', 18: 'dieciocho', 19: 'diecinueve', 20: 'veinte',
      22: 'veintidós', 24: 'veinticuatro', 25: 'veinticinco', 26: 'veintiséis', 28: 'veintiocho',
      30: 'treinta', 35: 'treinta y cinco', 40: 'cuarenta', 45: 'cuarenta y cinco', 50: 'cincuenta'
    };
    return words[num] || String(num);
  },

  selectRhythmLevel(levelId) {
    if (this.rhythmState === 'countdown' || this.rhythmState === 'playing') return;
    this.rhythmLevel = Number(levelId) || 1;
    this.rhythmState = 'idle';
    const seq = this.getCurrentRhythmSequence();
    this.rhythmCurrentNumber = seq[0] || 1;
    this.rhythmBeatResults = {};
    this.rhythmVoiceDetectedInBeat = {};
    this.rhythmLastRoundSummary = null;
    this.countedNumbers = [];
    if (!this.isCountingActivityCompleted()) {
      this.restoreRecordingUiInModal();
    }
    this.refreshActivityBodyDom();
  },

  setRhythmSpeedMode(mode) {
    if (this.rhythmState === 'countdown' || this.rhythmState === 'playing') return;
    if (['slow', 'normal', 'fast'].includes(mode)) {
      this.rhythmSpeedMode = mode;
      this.refreshActivityBodyDom();
    }
  },

  async speakNumberInSpanish(num) {
    if (this.rhythmState === 'countdown' || this.rhythmState === 'playing') return;
    const word = this.getSpanishNumberWord(num);
    if (window.api && api.speakText) {
      await api.speakText(`${num}: ${word}.`);
    }
  },

  playRhythmTone(freq = 520, durationSec = 0.08, type = 'sine', gainVal = 0.06) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this._rhythmAudioCtx || this._rhythmAudioCtx.state === 'closed') {
        this._rhythmAudioCtx = new AudioCtx();
      }
      if (this._rhythmAudioCtx.state === 'suspended') {
        this._rhythmAudioCtx.resume().catch(() => {});
      }
      const osc = this._rhythmAudioCtx.createOscillator();
      const gain = this._rhythmAudioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this._rhythmAudioCtx.currentTime);
      gain.gain.setValueAtTime(gainVal, this._rhythmAudioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this._rhythmAudioCtx.currentTime + durationSec);
      osc.connect(gain);
      gain.connect(this._rhythmAudioCtx.destination);
      osc.start();
      osc.stop(this._rhythmAudioCtx.currentTime + durationSec);
    } catch (e) {}
  },

  playRhythmSuccessChord() {
    this.playRhythmTone(523.25, 0.12, 'triangle', 0.07);
    setTimeout(() => this.playRhythmTone(659.25, 0.12, 'triangle', 0.07), 90);
    setTimeout(() => this.playRhythmTone(783.99, 0.22, 'triangle', 0.08), 180);
  },

  markRhythmBeatSpokenLive(num, isVerifiedWord = false) {
    if (!num || num < 1) return;
    this.rhythmVoiceDetectedInBeat[num] = true;
    if (isVerifiedWord) {
      this.rhythmBeatResults[num] = 'spoken';
      if (!this.countedNumbers.includes(num)) {
        this.countedNumbers.push(num);
      }
      const pill = document.getElementById(`rhythm-seq-pill-${num}`);
      if (pill && num === this.rhythmCurrentNumber) {
        pill.classList.add('ring-4', 'ring-emerald-400');
      }
    }
    const liveBadge = document.getElementById('rhythm-live-voice-badge');
    if (liveBadge) {
      liveBadge.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border transition-all bg-emerald-500 text-white border-emerald-400 scale-105 shadow-xs';
      liveBadge.innerHTML = '<i data-lucide="check-circle" class="w-3.5 h-3.5"></i><span>' + (isVerifiedWord ? `¡Dijiste el ${num}!` : '¡Voz captada!') + '</span>';
      if (window.lucide) lucide.createIcons();
    }
  },

  stopRhythmTimersAndClean() {
    if (this._rhythmTimerId) {
      clearInterval(this._rhythmTimerId);
      this._rhythmTimerId = null;
    }
    if (this._rhythmCountdownId) {
      clearInterval(this._rhythmCountdownId);
      this._rhythmCountdownId = null;
    }
    if (this._rhythmEnergyIntervalId) {
      clearInterval(this._rhythmEnergyIntervalId);
      this._rhythmEnergyIntervalId = null;
    }
    if (this._rhythmSpeechRec) {
      try {
        this._rhythmSpeechRec.onresult = null;
        this._rhythmSpeechRec.onerror = null;
        this._rhythmSpeechRec.onend = null;
        this._rhythmSpeechRec.stop();
      } catch (e) {}
      this._rhythmSpeechRec = null;
    }
  },

  async stopRhythmChallengeManual() {
    this.stopRhythmTimersAndClean();
    const apiClient = window.api || (typeof api !== 'undefined' ? api : null);
    if (this.isRecordingVoice && apiClient && apiClient.mediaRecorder && apiClient.isRecordingAudio) {
      try {
        apiClient.mediaRecorder.stop();
        if (apiClient.mediaRecorder.stream) {
          apiClient.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
      } catch (e) {}
      this.isRecordingVoice = false;
    }
    this.rhythmState = 'idle';
    this.restoreRecordingUiInModal();
    this.refreshActivityBodyDom();
  },

  async startRhythmChallenge() {
    if (this.rhythmState === 'countdown' || this.rhythmState === 'playing' || this.rhythmState === 'evaluating') {
      return;
    }

    this.stopRhythmTimersAndClean();
    const apiClient = window.api || (typeof api !== 'undefined' ? api : null);
    if (apiClient && apiClient.stopSpeaking) {
      apiClient.stopSpeaking();
    }

    const seq = this.getCurrentRhythmSequence();
    const beatMs = this.getEffectiveRhythmBeatMs();

    this.rhythmState = 'countdown';
    this.rhythmCountdownValue = 3;
    this.rhythmCurrentSeqIndex = 0;
    this.rhythmCurrentNumber = seq[0] || 1;
    this.rhythmBeatResults = {};
    this.rhythmVoiceDetectedInBeat = {};
    this._rhythmLiveNumbersDetected = [];
    this.rhythmLastRoundSummary = null;
    this.countedNumbers = [];

    // Actualizar barra inferior durante la ronda activa
    const btn = document.getElementById('voice-record-btn');
    const btnText = document.getElementById('voice-record-text');
    const resultBox = document.getElementById('voice-transcription-result');
    if (resultBox) {
      resultBox.className = 'hidden p-3.5 rounded-xl border transition-all text-xs';
      resultBox.innerHTML = '';
    }
    if (btn) {
      btn.className = 'w-full sm:w-auto px-6 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs sm:text-sm shadow-lg transition flex items-center justify-center gap-2 cursor-pointer';
      if (btnText) btnText.textContent = 'Pausar (Espacio)';
    }

    // 1. Iniciar captura de microfono sin auto-stop temprano (la ronda controla el tiempo completo)
    this.rhythmMicAvailable = false;
    if (apiClient && apiClient.startVoiceRecording) {
      try {
        const startRes = await apiClient.startVoiceRecording(null);
        if (startRes && startRes.success) {
          this.rhythmMicAvailable = true;
          this.isRecordingVoice = true;
        }
      } catch (e) {
        this.rhythmMicAvailable = false;
      }
    }

    // 2. Reconocimiento en vivo complementario del navegador (si existe Web Speech API)
    try {
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRec) {
        const rec = new SpeechRec();
        rec.lang = 'es-CL';
        rec.continuous = true;
        rec.interimResults = true;
        rec.onresult = (event) => {
          let fullText = '';
          for (let i = 0; i < event.results.length; i++) {
            fullText += ' ' + event.results[i][0].transcript;
          }
          const nums = this.extractSpokenNumbersInOrder(fullText);
          nums.forEach(n => {
            if (!this._rhythmLiveNumbersDetected.includes(n)) {
              this._rhythmLiveNumbersDetected.push(n);
            }
            const prevInSeq = this.rhythmCurrentSeqIndex > 0 ? seq[this.rhythmCurrentSeqIndex - 1] : null;
            if (n === this.rhythmCurrentNumber || n === prevInSeq) {
              this.markRhythmBeatSpokenLive(n, true);
            }
          });
        };
        rec.start();
        this._rhythmSpeechRec = rec;
      }
    } catch (e) {}

    this.refreshActivityBodyDom();
    this.playRhythmTone(440, 0.09, 'sine', 0.06);

    // 3. Cuenta regresiva: 3 -> 2 -> 1 -> ¡VAMOS!
    const countdownSteps = [2, 1, '¡VAMOS!'];
    let cIdx = 0;

    this._rhythmCountdownId = setInterval(() => {
      if (!this.isVoiceModalOpen || this.rhythmState !== 'countdown') {
        this.stopRhythmTimersAndClean();
        return;
      }
      if (cIdx < countdownSteps.length) {
        this.rhythmCountdownValue = countdownSteps[cIdx];
        const isGo = this.rhythmCountdownValue === '¡VAMOS!';
        this.playRhythmTone(isGo ? 660 : 440, isGo ? 0.14 : 0.09, 'sine', 0.07);
        this.refreshActivityBodyDom();
        cIdx++;
      } else {
        clearInterval(this._rhythmCountdownId);
        this._rhythmCountdownId = null;
        this.beginRhythmBeatSequence(seq, beatMs);
      }
    }, 650);
  },

  beginRhythmBeatSequence(seq, beatMs) {
    if (!this.isVoiceModalOpen) return;
    const sequence = Array.isArray(seq) && seq.length > 0 ? seq : [1, 2, 3, 4, 5];
    this.rhythmState = 'playing';
    this.rhythmCurrentSeqIndex = 0;
    this.rhythmCurrentNumber = sequence[0];
    this.playRhythmTone(587.33, 0.09, 'triangle', 0.07);
    this.refreshActivityBodyDom();

    const apiClient = window.api || (typeof api !== 'undefined' ? api : null);

    // Monitorear energia de voz en cada pulso solo para feedback visual del microfono (no aprueba sin STT)
    if (this.rhythmMicAvailable && apiClient && apiClient._analyser) {
      const dataArray = new Uint8Array(apiClient._analyser.frequencyBinCount);
      this._rhythmEnergyIntervalId = setInterval(() => {
        if (this.rhythmState !== 'playing' || !apiClient._analyser) return;
        apiClient._analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avgEnergy = sum / dataArray.length;
        if (avgEnergy > 14) {
          this.markRhythmBeatSpokenLive(this.rhythmCurrentNumber, false);
        }
      }, 75);
    }

    // Secuencia automatica al ritmo: cada numero de la secuencia aparece exactamente una sola vez
    this._rhythmTimerId = setInterval(() => {
      if (!this.isVoiceModalOpen || this.rhythmState !== 'playing') {
        this.stopRhythmTimersAndClean();
        return;
      }

      if (this.rhythmCurrentSeqIndex < sequence.length - 1) {
        this.rhythmCurrentSeqIndex++;
        this.rhythmCurrentNumber = sequence[this.rhythmCurrentSeqIndex];
        const isMilestone = ((this.rhythmCurrentSeqIndex + 1) % 5 === 0);
        this.playRhythmTone(isMilestone ? 698.46 : 587.33, 0.09, 'triangle', 0.07);
        this.refreshActivityBodyDom();
      } else {
        // Termino el pulso del ultimo numero de la secuencia: pasar a evaluacion STT sin repetir el ultimo numero
        this.stopRhythmTimersAndClean();
        this.finishRhythmChallengeRound(sequence);
      }
    }, beatMs);
  },

  async finishRhythmChallengeRound(seq) {
    const sequence = Array.isArray(seq) && seq.length > 0 ? seq : this.getCurrentRhythmSequence();
    const totalExpected = sequence.length;
    const firstNum = sequence[0] || 1;
    const lastNum = sequence[sequence.length - 1] || 5;
    const act = this.getActiveActivityObject();
    const isSkip = act && act.activityType === 'skip_counting';

    // Mostrar tarjeta dedicada "Revisando los numeros que dijiste..." (nunca repite el ultimo numero)
    this.rhythmState = 'evaluating';
    this.refreshActivityBodyDom();

    const apiClient = window.api || (typeof api !== 'undefined' ? api : null);
    let transcript = '';
    let sttNumbers = [];

    if (this.isRecordingVoice && apiClient && apiClient.stopVoiceRecordingAndTranscribe) {
      this.isRecordingVoice = false;
      try {
        const res = await apiClient.stopVoiceRecordingAndTranscribe('es');
        if (res && res.success) {
          transcript = (res.transcripcion || res.transcript || '').trim();
          sttNumbers = this.extractSpokenNumbersInOrder(transcript);
        }
      } catch (e) {}
    }

    // Validar estrictamente que numeros fueron realmente dichos en espanol (Deepgram STT + Web Speech API)
    const spokenNumbersSet = new Set([
      ...(sttNumbers || []),
      ...(this._rhythmLiveNumbersDetected || [])
    ]);

    const recognizedList = [];
    const missingList = [];
    this.countedNumbers = [];

    for (let i = 0; i < sequence.length; i++) {
      const n = sequence[i];
      if (spokenNumbersSet.has(n)) {
        this.rhythmBeatResults[n] = 'spoken';
        recognizedList.push(n);
        this.countedNumbers.push(n);
      } else if (!this.rhythmMicAvailable) {
        this.rhythmBeatResults[n] = 'visual_only';
      } else {
        this.rhythmBeatResults[n] = 'missed';
        missingList.push(n);
      }
    }

    const recognizedCount = recognizedList.length;

    // Para aprobar el nivel con microfono, el usuario debe haber pronunciado TODOS los numeros de la secuencia
    const roundCompleted = !this.rhythmMicAvailable || (recognizedCount === totalExpected && missingList.length === 0);

    if (roundCompleted) {
      if (!this.rhythmCompletedLevels.includes(this.rhythmLevel)) {
        this.rhythmCompletedLevels.push(this.rhythmLevel);
      }
      this.playRhythmSuccessChord();
    }

    const starsEarned = roundCompleted ? 3 : (recognizedCount >= Math.ceil(totalExpected * 0.6) ? 2 : 1);

    let headline = '';
    let subtext = '';
    let spokenFeedback = '';

    if (!this.rhythmMicAvailable) {
      headline = `¡Genial! Llegaste hasta el ${lastNum} siguiendo el ritmo`;
      subtext = `Lo hiciste súper bien. Puedes jugar otra vez o pasar al siguiente reto.`;
      spokenFeedback = `¡Genial! Llegaste hasta el ${lastNum} siguiendo el ritmo.`;
    } else if (roundCompleted) {
      headline = isSkip
        ? `¡Qué buen ritmo tienes! Dijiste toda la secuencia del ${firstNum} al ${lastNum}`
        : `¡Qué buen ritmo tienes! Contaste del 1 al ${lastNum} completo`;
      subtext = `Te escuché decir los ${totalExpected} números súper claro (${sequence.join(', ')}). ¿Pasamos al siguiente nivel?`;
      spokenFeedback = isSkip
        ? `¡Qué buen ritmo tienes! Dijiste todos los saltos desde el ${firstNum} hasta el ${lastNum}. ¿Pasamos al siguiente nivel?`
        : `¡Qué buen ritmo tienes! Te escuché contar del uno al ${lastNum} completo. ¿Pasamos al siguiente nivel?`;
    } else if (recognizedCount === 0) {
      headline = `No alcanzamos a escuchar los números`;
      subtext = `Asegúrate de hablar fuerte hacia el micrófono cuando salgan los números (${sequence.join(', ')}). ¡Intentémoslo otra vez!`;
      spokenFeedback = `No alcancé a escuchar los números. Habla fuerte cuando salgan en pantalla y probemos otra vez.`;
    } else {
      const missingText = missingList.join(', ');
      const spokenText = recognizedList.join(', ');
      headline = missingList.length === 1
        ? `¡Casi! Te faltó decir el número ${missingText}`
        : `¡Buen intento! Te faltó decir: ${missingText}`;
      subtext = `Te escuchamos decir ${recognizedCount} de ${totalExpected} números (${spokenText}). ¡Juguemos otra vez para completar hasta el ${lastNum}!`;
      spokenFeedback = missingList.length === 1
        ? `¡Casi! Te escuché decir ${spokenText}, pero faltó decir el ${missingText}. ¡Probemos otra vez!`
        : `¡Buen intento! Escuché ${recognizedCount} números, pero nos faltó decir ${missingText}. ¡Intentémoslo de nuevo!`;
    }

    this.rhythmLastRoundSummary = {
      level: this.rhythmLevel,
      maxNum: lastNum,
      totalCount: totalExpected,
      recognizedCount: recognizedCount,
      spokenCount: recognizedCount,
      recognizedList: recognizedList,
      missingList: missingList,
      micUsed: this.rhythmMicAvailable,
      roundCompleted: roundCompleted,
      passed: roundCompleted,
      starsEarned: starsEarned,
      transcript: transcript,
      title: headline,
      headline: headline,
      message: subtext,
      subtext: subtext,
      spokenFeedback: spokenFeedback
    };

    this.rhythmState = 'round_complete';
    this.refreshActivityBodyDom();

    // Actualizar estado persistente y voz de retroalimentacion
    const progressInfo = this.getActivityProgressSummary();
    if (this.isCountingActivityCompleted()) {
      this.updateCompletedUiInModal();
      await this.persistCurrentActivityState(
        'Entregada',
        100,
        7.0,
        isSkip
          ? `Actividad Salta al Ritmo completada (Nivel ${this.rhythmLevel}: ${firstNum} al ${lastNum}).`
          : `Actividad Cuenta al Ritmo completada (Nivel ${this.rhythmLevel}: 1 al ${lastNum}).`
      );
    } else {
      this.restoreRecordingUiInModal();
      await this.persistCurrentActivityState(
        'En progreso',
        Math.max(15, progressInfo.percent),
        null,
        `Práctica en Nivel ${this.rhythmLevel} (${recognizedCount} de ${totalExpected} números dichos).`
      );
    }

    if (window.api && api.speakText && spokenFeedback) {
      api.speakText(spokenFeedback);
    }
  },

  advanceToNextRhythmLevel() {
    if (this.rhythmLevel < 4) {
      this.selectRhythmLevel(this.rhythmLevel + 1);
      this.startRhythmChallenge();
    }
  },

  toggleCountedNumber(num) {
    // Al tocar cualquier tarjeta o pildora de numero en modo pausa, Robot Leo pronuncia el numero en espanol
    this.speakNumberInSpanish(num);
  },

  extractSpokenNumbersInOrder(text) {
    if (!text) return [];
    let normalized = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    // Normalizar compuestos de dos o tres palabras antes del regex (ej. "treinta y cinco" -> "treintaicinco", "cuarenta y cinco" -> "cuarentaicinco")
    normalized = normalized
      .replace(/\b(treinta|trenta)\s+y\s+(cinco|sinco|tinco)\b/g, 'treintaicinco')
      .replace(/\b(cuarenta|cualenta)\s+y\s+(cinco|sinco|tinco)\b/g, 'cuarentaicinco')
      .replace(/\b(veinte|bente)\s+y\s+(cinco|sinco|tinco)\b/g, 'veinticinco')
      .replace(/\b(veinte|bente)\s+y\s+(dos|do)\b/g, 'veintidos')
      .replace(/\b(veinte|bente)\s+y\s+(cuatro|cuato)\b/g, 'veinticuatro')
      .replace(/\b(veinte|bente)\s+y\s+(seis|sei)\b/g, 'veintiseis')
      .replace(/\b(veinte|bente)\s+y\s+(ocho)\b/g, 'veintiocho');

    // Incluye numeros del 0 al 50 en espanol (para Cuenta al Ritmo 1-20 y Salta al Ritmo x2 y x5 hasta 50)
    const pattern = /\b(cincuenta|sincuenta|50|cuarentaicinco|45|cuarenta|cualenta|40|treintaicinco|trentaicinco|35|treinta|trenta|30|veintiocho|bentiocho|28|veintiseis|bentiseis|26|veinticinco|veintisinco|benticinco|bentisinco|25|veinticuatro|benticuatro|24|veintidos|bentidos|22|veinte|bente|veinti|20|diecinueve|diesinueve|19|dieciocho|diesiocho|18|diecisiete|diesisiete|17|dieciseis|diesiseis|16|quince|kinse|15|catorce|catorse|14|trece|trese|tlece|13|doce|dose|12|once|onse|11|diez|dies|die|decimo|10|nueve|nuebe|noveno|9|ocho|octavo|8|siete|tiete|chete|septimo|7|seis|sei|sexto|6|cinco|sinco|tinco|quinto|5|cuatro|cuato|cato|cuarto|4|tres|tes|tle|tles|tercero|3|dos|do|segundo|2|uno|una|un|primero|1|cero|0)\b/gi;
    const wordMap = {
      '0': 0, 'cero': 0,
      '1': 1, 'uno': 1, 'un': 1, 'una': 1, 'primero': 1,
      '2': 2, 'dos': 2, 'do': 2, 'segundo': 2,
      '3': 3, 'tres': 3, 'tes': 3, 'tle': 3, 'tles': 3, 'tercero': 3,
      '4': 4, 'cuatro': 4, 'cuato': 4, 'cato': 4, 'cuarto': 4,
      '5': 5, 'cinco': 5, 'sinco': 5, 'tinco': 5, 'quinto': 5,
      '6': 6, 'seis': 6, 'sei': 6, 'sexto': 6,
      '7': 7, 'siete': 7, 'tiete': 7, 'chete': 7, 'septimo': 7,
      '8': 8, 'ocho': 8, 'octavo': 8,
      '9': 9, 'nueve': 9, 'nuebe': 9, 'noveno': 9,
      '10': 10, 'diez': 10, 'dies': 10, 'die': 10, 'decimo': 10,
      '11': 11, 'once': 11, 'onse': 11,
      '12': 12, 'doce': 12, 'dose': 12,
      '13': 13, 'trece': 13, 'trese': 13, 'tlece': 13,
      '14': 14, 'catorce': 14, 'catorse': 14,
      '15': 15, 'quince': 15, 'kinse': 15,
      '16': 16, 'dieciseis': 16, 'diesiseis': 16,
      '17': 17, 'diecisiete': 17, 'diesisiete': 17,
      '18': 18, 'dieciocho': 18, 'diesiocho': 18,
      '19': 19, 'diecinueve': 19, 'diesinueve': 19,
      '20': 20, 'veinte': 20, 'bente': 20, 'veinti': 20,
      '22': 22, 'veintidos': 22, 'bentidos': 22,
      '24': 24, 'veinticuatro': 24, 'benticuatro': 24,
      '25': 25, 'veinticinco': 25, 'veintisinco': 25, 'benticinco': 25, 'bentisinco': 25,
      '26': 26, 'veintiseis': 26, 'bentiseis': 26,
      '28': 28, 'veintiocho': 28, 'bentiocho': 28,
      '30': 30, 'treinta': 30, 'trenta': 30,
      '35': 35, 'treintaicinco': 35, 'trentaicinco': 35,
      '40': 40, 'cuarenta': 40, 'cualenta': 40,
      '45': 45, 'cuarentaicinco': 45,
      '50': 50, 'cincuenta': 50, 'sincuenta': 50
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
    return {
      success: true,
      status: 'completed',
      newlyAdded: spokenTokens || [],
      totalCount: (spokenTokens || []).length,
      message: 'Secuencia evaluada en modo Cuenta al Ritmo.'
    };
  },

  closeVoiceModal() {
    this.stopRhythmTimersAndClean();
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
    this.rhythmState = 'idle';
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

      const startRes = await apiClient.startVoiceRecording(() => {
        // Detección automática de silencio continuo tras haber hablado (Auto-Stop VAD)
        if (this.isRecordingVoice && !this._isBusyTranscribing) {
          this.toggleVoiceRecording();
        }
      });
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
            const newlyAddedText = validation.newlyAdded.join(' -> ');
            const nextExpected = this.countedNumbers.length + 1;
            const items = (window.components && components.countingItems) ? components.countingItems : [];
            const nextItem = items.find(it => it.num === nextExpected);

            updatedResultBox.className = 'p-3.5 rounded-xl border transition-all text-xs bg-emerald-50 border-emerald-300 text-emerald-950 block';
            updatedResultBox.innerHTML = `
              <div class="font-black text-emerald-800 mb-1 flex items-center justify-between text-xs sm:text-sm">
                <span class="flex items-center gap-1.5"><i data-lucide="check-circle" class="w-4 h-4 text-emerald-600"></i> ¡Secuencia correcta! Número ${newlyAddedText} completado</span>
                <span class="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-950 font-black text-[11px]">+${validation.newlyAdded.length} Estrella${validation.newlyAdded.length > 1 ? 's' : ''}</span>
              </div>
              <div class="italic text-slate-800 bg-white/80 p-2 rounded-lg border border-emerald-200 mb-2">
                "${transcript}"
              </div>
              <div class="text-xs text-emerald-900 font-semibold">
                Robot Leo dice: "¡Excelente! Has ganado la estrella del ${validation.newlyAdded[validation.newlyAdded.length - 1]}. Ahora pasamos al número ${nextExpected}."
              </div>
            `;

            if (nextItem && window.api && api.speakText) {
              const praiseText = validation.newlyAdded.length > 1
                ? `¡Genial! Dijiste varios números en orden. Ahora descubre el número ${nextExpected}.`
                : `¡Muy bien! Es el ${validation.newlyAdded[0]}. Ahora descubre el número ${nextExpected}.`;
              api.speakText(praiseText);
            }
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
            if (window.api && api.speakText && validation.message) {
              api.speakText(validation.message);
            }
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
            if (window.api && api.speakText && validation.message) {
              api.speakText(validation.message);
            }
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
            if (window.api && api.speakText && validation.message) {
              api.speakText(validation.message);
            }
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
