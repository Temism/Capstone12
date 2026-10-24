// Global Components: Header Switcher, Multi-Activity Voice AI Interactive Player (Mineduc 1° Basico), and Navigation
const components = {
  // Renders the top bar with Theme Switcher and View Switcher
  renderTopNav(currentView, currentTheme) {
    const views = [
      { id: "reporteria", name: "1. Reportería", role: "Apoderado", icon: "bar-chart-3" },
      { id: "alertas", name: "2. Alertas", role: "Profesora", icon: "bell-ring" },
      { id: "actividades", name: "3. Actividades (Voz IA)", role: "Alumno (1°-2° Básico)", icon: "sparkles", badge: "Niños 6-7 años" },
      { id: "asignar", name: "4. Asignar Actividades", role: "Profesora", icon: "clipboard-check" },
      { id: "mensajeria", name: "5. Mensajería", role: "Familia y Colegio", icon: "message-square" }
    ];

    const themes = [
      { id: "navy", name: "Azul Oxford", icon: "school", desc: "Institucional clásico" },
      { id: "emerald", name: "Nordic Esmeralda", icon: "leaf", desc: "Fresco & EdTech" },
      { id: "violet", name: "Cyber Índigo", icon: "zap", desc: "Lúdico & Moderno" }
    ];

    return `
      <header class="theme-header text-white sticky top-0 z-40 shadow-lg border-b border-white/10 backdrop-blur-md">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <!-- Top Row: Branding & Theme Switcher -->
          <div class="flex items-center justify-between py-2.5 border-b border-white/10 text-xs sm:text-sm">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold text-white shadow-inner">
                <i data-lucide="graduation-cap" class="w-5 h-5"></i>
              </div>
              <div>
                <span class="font-extrabold tracking-tight text-white sm:text-base">EDUCONNECT</span>
                <span class="ml-1 text-white/70 hidden md:inline">| Primer Ciclo Básico (1° y 2° Básico)</span>
              </div>
            </div>

            <!-- Top Right: Layout Switcher & Theme Picker -->
            <div class="flex items-center space-x-2 flex-wrap gap-y-1">
              <!-- Theme Picker -->
              <div class="flex items-center space-x-1.5 bg-black/20 p-1 rounded-xl backdrop-blur-sm border border-white/10">
                <span class="text-white/80 font-medium px-2 hidden sm:inline flex items-center gap-1">
                  <i data-lucide="palette" class="w-3.5 h-3.5 text-amber-300"></i> Paleta:
                </span>
                ${themes.map(t => `
                  <button 
                    onclick="app.setTheme('${t.id}')"
                    class="px-2.5 py-1 rounded-lg font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                      currentTheme === t.id 
                        ? 'bg-white text-slate-900 shadow-sm' 
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }"
                    title="${t.desc}"
                  >
                    <span class="w-2 h-2 rounded-full ${
                      t.id === 'navy' ? 'bg-blue-600' : t.id === 'emerald' ? 'bg-teal-500' : 'bg-purple-600'
                    }"></span>
                    <span>${t.name}</span>
                  </button>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Bottom Row: Navigation Tabs (The 5 Views) -->
          <div class="flex items-center justify-between overflow-x-auto py-2 scrollbar-none gap-2">
            <div class="flex items-center space-x-1 sm:space-x-2">
              ${views.map(v => {
                const isActive = currentView === v.id;
                return `
                  <button 
                    onclick="app.setView('${v.id}')"
                    class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                      isActive 
                        ? 'bg-white text-slate-900 shadow-md font-semibold scale-[1.02]' 
                        : 'text-white/85 hover:bg-white/10 hover:text-white'
                    }"
                  >
                    <i data-lucide="${v.icon}" class="w-4 h-4 ${isActive ? 'text-blue-600' : 'text-white/80'}"></i>
                    <span>${v.name}</span>
                    <span class="text-[10px] px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-slate-100 text-slate-700' : 'bg-white/15 text-white/90'
                    }">
                      ${v.role}
                    </span>
                    ${v.badge ? `<span class="bg-amber-400 text-amber-950 text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider">${v.badge}</span>` : ''}
                  </button>
                `;
              }).join('')}
            </div>

            <!-- Role / Student Info Pill -->
            <div class="hidden lg:flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full text-xs text-white/90 border border-white/10">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>${mockData.currentStudent.name}</span>
              <span class="text-white/40">|</span>
              <span class="font-semibold text-amber-300">${mockData.currentStudent.course}</span>
            </div>
          </div>
        </div>
      </header>
    `;
  },

  // Floating button to trigger Voice AI at any time
  renderVoiceAIFloatingButton() {
    return `
      <div class="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        <div class="hidden md:flex flex-col items-end bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-xl border border-slate-200 text-xs transition-all">
          <span class="font-black text-slate-800 flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Robot Leo (Tutor de Voz)
          </span>
          <span class="text-slate-500 text-[11px]">Lee las preguntas a los niños</span>
        </div>

        <button 
          id="btn-voice-ai"
          onclick="app.openVoiceModal('Misión Conteo Mágico: Cuenta del 1 al 10 con Robot Leo', 'act-conteo')"
          class="ai-pulse-button w-14 h-14 rounded-full theme-primary-bg text-white shadow-2xl flex items-center justify-center transition-transform duration-200 hover:scale-110 active:scale-95 group focus:outline-none focus:ring-4 focus:ring-blue-300"
          aria-label="Abrir Actividad con Tutor de Voz"
          title="Abrir Tutor de Voz que lee preguntas para 1° y 2° Básico"
        >
          <div class="relative flex items-center justify-center">
            <i data-lucide="volume-2" class="w-7 h-7 text-white group-hover:rotate-6 transition-transform"></i>
            <span class="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center">
              <i data-lucide="bot" class="w-2.5 h-2.5 text-amber-950"></i>
            </span>
          </div>
        </button>
      </div>
    `;
  },

  // Lista ludica de elementos para el conteo en espanol del 1 al 20 en 1° Basico (MA01 OA 01)
  countingItems: [
    { num: 1, word: "Uno", icon: "sun", label: "1 Sol", speechPrompt: "Uno" },
    { num: 2, word: "Dos", icon: "apple", label: "2 Manzanas", speechPrompt: "Dos" },
    { num: 3, word: "Tres", icon: "sparkles", label: "3 Estrellitas", speechPrompt: "Tres" },
    { num: 4, word: "Cuatro", icon: "fish", label: "4 Pececitos", speechPrompt: "Cuatro" },
    { num: 5, word: "Cinco", icon: "flower-2", label: "5 Florecitas", speechPrompt: "Cinco" },
    { num: 6, word: "Seis", icon: "gift", label: "6 Regalos", speechPrompt: "Seis" },
    { num: 7, word: "Siete", icon: "heart", label: "7 Corazones", speechPrompt: "Siete" },
    { num: 8, word: "Ocho", icon: "tree-pine", label: "8 Pinitos", speechPrompt: "Ocho" },
    { num: 9, word: "Nueve", icon: "bell", label: "9 Campanitas", speechPrompt: "Nueve" },
    { num: 10, word: "Diez", icon: "trophy", label: "10 Trofeos", speechPrompt: "Diez" },
    { num: 11, word: "Once", icon: "star", label: "11 Estrellas", speechPrompt: "Once" },
    { num: 12, word: "Doce", icon: "cloud", label: "12 Nubes", speechPrompt: "Doce" },
    { num: 13, word: "Trece", icon: "bird", label: "13 Pajaritos", speechPrompt: "Trece" },
    { num: 14, word: "Catorce", icon: "leaf", label: "14 Hojitas", speechPrompt: "Catorce" },
    { num: 15, word: "Quince", icon: "crown", label: "15 Coronas", speechPrompt: "Quince" },
    { num: 16, word: "Dieciséis", icon: "zap", label: "16 Rayos", speechPrompt: "Dieciséis" },
    { num: 17, word: "Diecisiete", icon: "music", label: "17 Notas", speechPrompt: "Diecisiete" },
    { num: 18, word: "Dieciocho", icon: "smile", label: "18 Sonrisas", speechPrompt: "Dieciocho" },
    { num: 19, word: "Diecinueve", icon: "gem", label: "19 Gemas", speechPrompt: "Diecinueve" },
    { num: 20, word: "Veinte", icon: "award", label: "20 Medallas", speechPrompt: "Veinte" }
  ],

  rhythmLevels: [
    { id: 1, title: "Nivel 1", rangeLabel: "1 al 5", maxNum: 5, step: 1, sequence: [1, 2, 3, 4, 5], beatMs: 2100, speedName: "Ritmo Suave" },
    { id: 2, title: "Nivel 2", rangeLabel: "1 al 10", maxNum: 10, step: 1, sequence: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], beatMs: 1650, speedName: "Ritmo Normal" },
    { id: 3, title: "Nivel 3", rangeLabel: "1 al 15", maxNum: 15, step: 1, sequence: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], beatMs: 1350, speedName: "Ritmo Ágil" },
    { id: 4, title: "Nivel 4", rangeLabel: "1 al 20", maxNum: 20, step: 1, sequence: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], beatMs: 1150, speedName: "Ritmo Rápido" }
  ],

  skipCountingLevels: [
    { id: 1, title: "Nivel 1", rangeLabel: "x2 (2 al 10)", maxNum: 10, step: 2, sequence: [2, 4, 6, 8, 10], beatMs: 2100, speedName: "Saltos de 2" },
    { id: 2, title: "Nivel 2", rangeLabel: "x2 (2 al 20)", maxNum: 20, step: 2, sequence: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20], beatMs: 1750, speedName: "Tabla del 2" },
    { id: 3, title: "Nivel 3", rangeLabel: "x5 (5 al 25)", maxNum: 25, step: 5, sequence: [5, 10, 15, 20, 25], beatMs: 1950, speedName: "Saltos de 5" },
    { id: 4, title: "Nivel 4", rangeLabel: "x5 (5 al 50)", maxNum: 50, step: 5, sequence: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50], beatMs: 1650, speedName: "Tabla del 5" }
  ],

  getRhythmLevelsForState(appState) {
    var act = (appState && appState.getActiveActivityObject) ? appState.getActiveActivityObject() : null;
    var type = (act && act.activityType) ? act.activityType : (appState && appState.activeActivityType ? appState.activeActivityType : 'counting');
    return type === 'skip_counting' ? this.skipCountingLevels : this.rhythmLevels;
  },

  getSpanishWordForNumber(num) {
    var words = {
      1: "Uno", 2: "Dos", 3: "Tres", 4: "Cuatro", 5: "Cinco",
      6: "Seis", 7: "Siete", 8: "Ocho", 9: "Nueve", 10: "Diez",
      11: "Once", 12: "Doce", 13: "Trece", 14: "Catorce", 15: "Quince",
      16: "Dieciséis", 17: "Diecisiete", 18: "Dieciocho", 19: "Diecinueve", 20: "Veinte",
      25: "Veinticinco", 30: "Treinta", 35: "Treinta y cinco", 40: "Cuarenta", 45: "Cuarenta y cinco", 50: "Cincuenta"
    };
    return words[num] || String(num);
  },

  // Renderiza todos los niveles y la velocidad en una sola barra horizontal a lo largo
  renderRhythmControls(appState) {
    var levelsList = this.getRhythmLevelsForState(appState);
    var activeLevelId = appState.rhythmLevel || 1;
    var completedLevels = Array.isArray(appState.rhythmCompletedLevels) ? appState.rhythmCompletedLevels : [];
    var speedMode = appState.rhythmSpeedMode || 'normal';
    var isPlaying = appState.rhythmState === 'playing' || appState.rhythmState === 'countdown';

    var levelButtons = levelsList.map(function(lvl) {
      var isSelected = lvl.id === activeLevelId;
      var isDone = completedLevels.indexOf(lvl.id) !== -1;
      var btnClass = isSelected
        ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-xs ring-2 ring-amber-300 font-black'
        : (isDone
          ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100 font-bold'
          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 font-bold');

      var prefixText = lvl.step > 1 ? '' : 'Del ';

      return '<button type="button"'
        + (isPlaying ? ' disabled' : '')
        + ' onclick="app.selectRhythmLevel(' + lvl.id + ')"'
        + ' class="flex-1 min-w-[120px] px-3 py-2 rounded-xl border text-left transition flex items-center justify-between gap-2 ' + (isPlaying ? 'opacity-60 cursor-not-allowed ' : 'cursor-pointer ') + btnClass + '">'
        + '<div class="flex items-center gap-1.5">'
        +   '<span class="text-xs font-black uppercase tracking-tight">' + lvl.title + ':</span>'
        +   '<span class="text-xs sm:text-sm font-black">' + prefixText + lvl.rangeLabel + '</span>'
        + '</div>'
        + '<span class="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ' + (isDone ? 'bg-emerald-500 text-white' : (isSelected ? 'bg-slate-950 text-amber-400' : 'bg-slate-100 text-slate-400')) + '">'
        +   '<i data-lucide="' + (isDone ? 'check' : 'music') + '" class="w-3 h-3"></i>'
        + '</span>'
        + '</button>';
    }).join('');

    var speedOptions = [
      { id: 'slow', label: 'Suave' },
      { id: 'normal', label: 'Normal' },
      { id: 'fast', label: 'Rápido' }
    ];

    var speedHtml = speedOptions.map(function(sp) {
      var active = speedMode === sp.id;
      return '<button type="button"'
        + (isPlaying ? ' disabled' : '')
        + ' onclick="app.setRhythmSpeedMode(\'' + sp.id + '\')"'
        + ' class="px-3 py-1.5 rounded-lg text-xs font-black transition ' + (isPlaying ? 'opacity-60 cursor-not-allowed ' : 'cursor-pointer ') + (active ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-200/70') + '">'
        + sp.label
        + '</button>';
    }).join('');

    return ''
      + '<div class="bg-slate-50 border border-slate-200/90 rounded-2xl p-2.5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">'
      +   '<div class="flex items-center gap-2 flex-1">'
      +     levelButtons
      +   '</div>'
      +   '<div class="flex items-center justify-end gap-1 bg-slate-200/70 p-1 rounded-xl border border-slate-300/60 flex-shrink-0">'
      +     '<span class="text-xs font-bold text-slate-600 px-2">Ritmo:</span>'
      +     speedHtml
      +   '</div>'
      + '</div>';
  },

  // Renderiza la cinta visual de secuencia de numeros o saltos sincronizada con el ritmo
  renderRhythmSequenceStrip(appState, lvl) {
    var seq = (lvl && Array.isArray(lvl.sequence)) ? lvl.sequence : [1, 2, 3, 4, 5];
    var step = (lvl && lvl.step) ? lvl.step : 1;
    var currentBeatNum = appState.rhythmCurrentNumber || seq[0];
    var beatResults = appState.rhythmBeatResults || {};
    var isPlaying = appState.rhythmState === 'playing';

    var nodesHtml = '';
    for (var i = 0; i < seq.length; i++) {
      var n = seq[i];
      var status = beatResults[n];
      var isSpoken = status === 'spoken';
      var isMissed = status === 'missed';
      var isCurrent = isPlaying && n === currentBeatNum;
      var isPastPending = isPlaying && n < currentBeatNum && !isSpoken;

      var pillClass = '';
      if (isCurrent) {
        pillClass = 'bg-amber-400 text-slate-950 border-2 border-slate-950 font-black scale-125 shadow-md z-10 rhythm-ring-active';
      } else if (isSpoken) {
        pillClass = 'bg-emerald-500 text-white border border-emerald-600 font-black shadow-2xs';
      } else if (isMissed) {
        pillClass = 'bg-rose-100 text-rose-800 border border-rose-300 font-black';
      } else if (isPastPending) {
        pillClass = 'bg-amber-100 text-amber-900 border border-amber-300 font-bold';
      } else {
        pillClass = 'bg-white text-slate-600 border border-slate-200 hover:border-amber-400 font-bold';
      }

      nodesHtml += '<button type="button" id="rhythm-seq-pill-' + n + '" onclick="app.speakNumberInSpanish(' + n + ')" title="Escuchar el ' + n + '" class="w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all duration-200 cursor-pointer ' + pillClass + '">'
        + n
        + '</button>';
    }

    var labelPrefix = step > 1 ? ('Saltos de ' + step + ' en ' + step + ':') : ('Tus números (' + seq[0] + ' al ' + seq[seq.length - 1] + '):');

    return ''
      + '<div class="bg-gradient-to-r from-amber-50/80 via-white to-blue-50/80 border border-amber-200/80 rounded-2xl px-4 py-2.5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-2">'
      +   '<div class="flex items-center gap-1.5 text-xs font-black text-slate-700 whitespace-nowrap">'
      +     '<i data-lucide="' + (step > 1 ? 'zap' : 'music') + '" class="w-4 h-4 text-amber-600"></i>'
      +     '<span>' + labelPrefix + '</span>'
      +   '</div>'
      +   '<div class="flex items-center justify-center flex-wrap gap-1.5">'
      +     nodesHtml
      +   '</div>'
      +   '<span class="text-[11px] font-semibold text-slate-500 whitespace-nowrap hidden md:inline">Toca un número si quieres escucharlo</span>'
      + '</div>';
  },

  // Genera iconos pictoricos amigables (incluyendo grupos para multiplicacion x2 y x5)
  renderCopisiHeroIcons(count, iconName, colorKey, groupSize) {
    var bgClass = 'bg-amber-100 text-amber-900 border-amber-300';
    if (colorKey === 'emerald') bgClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    else if (colorKey === 'blue') bgClass = 'bg-blue-100 text-blue-900 border-blue-300';
    else if (colorKey === 'rose') bgClass = 'bg-rose-100 text-rose-800 border-rose-300';
    else if (colorKey === 'purple') bgClass = 'bg-purple-100 text-purple-800 border-purple-300';

    if (groupSize && groupSize > 1) {
      var numGroups = Math.min(10, Math.round(count / groupSize));
      var groupsHtml = '';
      for (var g = 0; g < numGroups; g++) {
        var dots = '';
        for (var d = 0; d < groupSize; d++) {
          dots += '<span class="w-3.5 h-3.5 rounded-full bg-current opacity-85"></span>';
        }
        groupsHtml += '<div class="px-2 py-1.5 rounded-xl border-2 flex items-center gap-1 shadow-2xs ' + bgClass + '" title="Grupo ' + (g + 1) + ' de ' + groupSize + '">'
          + dots
          + '</div>';
      }
      return groupsHtml;
    }

    var sizeClass = count > 10 ? 'w-7 h-7 sm:w-8 sm:h-8 rounded-lg' : 'w-9 h-9 sm:w-10 sm:h-10 rounded-xl';
    var iconSize = count > 10 ? 'w-3.5 h-3.5' : 'w-4 h-4';

    var html = '';
    for (var i = 0; i < count; i++) {
      html += '<span class="' + sizeClass + ' border-2 flex items-center justify-center shadow-2xs ' + bgClass + '">'
        + '<i data-lucide="' + iconName + '" class="' + iconSize + '"></i>'
        + '</span>';
    }
    return html;
  },

  // Escenario Principal para "Cuenta al Ritmo" (1 en 1) y "Salta al Ritmo" (Multiplicacion x2 y x5)
  renderRhythmStage(appState) {
    var levelsList = this.getRhythmLevelsForState(appState);
    var levelId = appState.rhythmLevel || 1;
    var lvl = levelsList.find(function(l) { return l.id === levelId; }) || levelsList[0];
    var seq = lvl.sequence || [1, 2, 3, 4, 5];
    var step = lvl.step || 1;
    var maxNum = lvl.maxNum;
    var rState = appState.rhythmState || 'idle';
    var effectiveBeatMs = appState.getEffectiveRhythmBeatMs ? appState.getEffectiveRhythmBeatMs() : lvl.beatMs;
    var isSkip = step > 1;

    // 1. ESTADO: CUENTA REGRESIVA (3, 2, 1, ¡VAMOS!)
    if (rState === 'countdown') {
      var countVal = appState.rhythmCountdownValue || 3;
      var countLabel = typeof countVal === 'number' && countVal > 0 ? String(countVal) : '¡VAMOS!';
      return ''
        + '<div class="bg-gradient-to-b from-blue-900 to-slate-900 text-white border-2 border-amber-400 rounded-3xl p-6 text-center shadow-lg flex flex-col items-center justify-center min-h-[225px] space-y-3">'
        +   '<span class="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider">'
        +     '<i data-lucide="volume-2" class="w-3.5 h-3.5"></i>'
        +     '<span>¡Atento, que ya empezamos!</span>'
        +   '</span>'
        +   '<div class="w-24 h-24 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center mx-auto font-black ' + (countLabel === '¡VAMOS!' ? 'text-lg px-2' : 'text-5xl') + ' shadow-lg rhythm-beat-pop rhythm-ring-active">'
        +     countLabel
        +   '</div>'
        +   '<p class="text-sm text-amber-200 font-bold">'
        +     (isSkip ? ('Prepárate para saltar de ' + step + ' en ' + step + ' hasta el ' + maxNum) : ('Di fuerte cada número del 1 al ' + maxNum + ' apenas salga en pantalla'))
        +   '</p>'
        + '</div>';
    }

    // 2. ESTADO: JUGANDO AL RITMO
    if (rState === 'playing') {
      var currentNum = appState.rhythmCurrentNumber || seq[0];
      var curIdx = seq.indexOf(currentNum);
      if (curIdx === -1) curIdx = 0;
      var prevNum = curIdx > 0 ? seq[curIdx - 1] : null;
      var nextNum = curIdx < seq.length - 1 ? seq[curIdx + 1] : null;

      var currentWord = this.getSpanishWordForNumber(currentNum);
      var prevWord = prevNum ? this.getSpanishWordForNumber(prevNum) : '';
      var nextWord = nextNum ? this.getSpanishWordForNumber(nextNum) : '';

      var baseItem = this.countingItems[(curIdx) % this.countingItems.length] || this.countingItems[0];
      var voiceHeardNow = Boolean(appState.rhythmVoiceDetectedInBeat && appState.rhythmVoiceDetectedInBeat[currentNum]);
      var paletteCycle = ['amber', 'blue', 'emerald', 'rose', 'purple'];
      var colorKey = paletteCycle[curIdx % paletteCycle.length];

      var copisiIconsHtml = isSkip
        ? this.renderCopisiHeroIcons(currentNum, baseItem.icon, colorKey, step)
        : this.renderCopisiHeroIcons(currentNum, baseItem.icon, colorKey, 1);

      var multFactor = Math.round(currentNum / step);
      var copisiLabel = isSkip
        ? (multFactor + ' ' + (multFactor === 1 ? 'salto' : 'saltos') + ' de ' + step + ' • ' + multFactor + ' × ' + step + ' = ' + currentNum)
        : baseItem.label;

      var cardBorderClass = voiceHeardNow
        ? 'border-emerald-500 ring-4 ring-emerald-300/70 bg-gradient-to-b from-emerald-50/90 via-white to-emerald-50/40'
        : 'border-amber-400 ring-4 ring-amber-200/70 bg-gradient-to-b from-amber-50/80 via-white to-slate-50';

      return ''
        + '<div class="border-2 rounded-3xl p-4 sm:p-5 text-center shadow-md relative overflow-hidden transition-all duration-200 min-h-[225px] flex flex-col justify-between ' + cardBorderClass + '">'
        +   '<div class="flex items-center justify-between text-xs font-black mb-2">'
        +     '<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-amber-400 uppercase tracking-wider">'
        +       '<span class="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>'
        +       '<span>' + (isSkip ? ('Salto ' + (curIdx + 1) + ' de ' + seq.length + ' (' + multFactor + ' × ' + step + ')') : ('¡Dilo tú! • Número ' + (curIdx + 1) + ' de ' + seq.length)) + '</span>'
        +     '</span>'
        +     '<div class="flex items-center gap-2">'
        +       '<span id="rhythm-live-voice-badge" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black transition-all ' + (voiceHeardNow ? 'bg-emerald-500 text-white shadow-xs scale-105' : 'bg-amber-100 text-amber-900 border border-amber-300') + '">'
        +         '<i data-lucide="' + (voiceHeardNow ? 'check-circle' : 'mic') + '" class="w-3.5 h-3.5"></i>'
        +         '<span id="rhythm-live-voice-text">' + (voiceHeardNow ? '¡Voz captada!' : '¡Te estoy escuchando!') + '</span>'
        +       '</span>'
        +       '<button type="button" onclick="app.stopRhythmChallengeManual()" class="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-300 font-bold text-xs transition cursor-pointer">Pausar</button>'
        +     '</div>'
        +   '</div>'
        +   '<div class="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-3 border border-slate-300/60">'
        +     '<div key="beat-bar-' + currentNum + '" class="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-emerald-500 rounded-full rhythm-beat-progress-fill" style="--beat-duration: ' + effectiveBeatMs + 'ms;"></div>'
        +   '</div>'
        +   '<div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center my-1">'
        +     '<div class="lg:col-span-6 flex items-center justify-center gap-4">'
        +       '<div class="hidden sm:flex flex-col items-center justify-center w-16 h-16 rounded-2xl border border-slate-200 bg-slate-100/70 text-slate-400 opacity-60">'
        +         (prevNum ? '<span class="text-xl font-black">' + prevNum + '</span><span class="text-[9px] font-bold uppercase truncate max-w-[56px]">' + prevWord + '</span>' : '<span class="text-[10px] font-bold">Inicio</span>')
        +       '</div>'
        +       '<div class="px-3 rhythm-beat-pop">'
        +         (isSkip ? '<div class="text-xs font-black uppercase text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full inline-block mb-1">' + multFactor + ' × ' + step + '</div>' : '')
        +         '<div class="text-6xl sm:text-7xl font-black text-slate-950 tracking-tight leading-none">' + currentNum + '</div>'
        +         '<div class="text-xl sm:text-2xl font-black uppercase text-blue-700 tracking-wider mt-1">' + currentWord + '</div>'
        +       '</div>'
        +       '<div class="hidden sm:flex flex-col items-center justify-center w-16 h-16 rounded-2xl border border-amber-200 bg-amber-50/60 text-amber-800 opacity-80">'
        +         (nextNum ? '<span class="text-[10px] font-bold uppercase text-amber-600">Viene</span><span class="text-xl font-black">' + nextNum + '</span><span class="text-[9px] font-bold uppercase truncate max-w-[56px]">' + nextWord + '</span>' : '<span class="text-[10px] font-bold">¡Final!</span>')
        +       '</div>'
        +     '</div>'
        +     '<div class="lg:col-span-6 p-3 bg-white/95 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col items-center justify-center">'
        +       '<div class="flex items-center justify-center flex-wrap gap-1.5">'
        +         copisiIconsHtml
        +       '</div>'
        +       '<div class="text-xs font-extrabold text-slate-700 mt-1.5">' + copisiLabel + '</div>'
        +     '</div>'
        +   '</div>'
        + '</div>';
    }

    // 2.5 ESTADO: ESCUCHANDO Y VERIFICANDO LOS NUMEROS DICHOS
    if (rState === 'evaluating') {
      return ''
        + '<div class="bg-gradient-to-b from-blue-50/90 via-white to-amber-50/40 border-2 border-blue-300 rounded-3xl p-6 text-center shadow-md flex flex-col items-center justify-center min-h-[225px] space-y-3">'
        +   '<div class="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm animate-pulse">'
        +     '<i data-lucide="mic" class="w-7 h-7"></i>'
        +   '</div>'
        +   '<h3 class="text-xl sm:text-2xl font-black text-slate-900">Revisando los números que dijiste...</h3>'
        +   '<p class="text-xs sm:text-sm text-slate-600 font-bold">Robot Leo está comprobando tu secuencia</p>'
        + '</div>';
    }

    // 3. ESTADO: FIN DE RONDA
    if (rState === 'round_complete') {
      var summary = appState.rhythmLastRoundSummary || {};
      var spokenCount = summary.spokenCount !== undefined ? summary.spokenCount : (summary.recognizedCount !== undefined ? summary.recognizedCount : 0);
      var totalCount = summary.totalCount !== undefined ? summary.totalCount : seq.length;
      var passed = Boolean(summary.passed);
      var headline = summary.headline || summary.title || (passed ? '¡Qué buen ritmo tienes! Lo hiciste súper bien' : '¡Casi lo tenemos! Faltaron algunos números');
      var subtext = summary.subtext || summary.message || '';
      var transcriptText = summary.transcript || '';
      var hasNextLevel = levelId < levelsList.length;
      var nextLvl = hasNextLevel ? levelsList[levelId] : null;

      var borderAndBg = passed
        ? 'from-emerald-50/90 via-white to-amber-50/40 border-emerald-400'
        : 'from-amber-50/90 via-white to-rose-50/30 border-amber-400';

      var badgeClass = passed
        ? 'bg-emerald-100 text-emerald-900'
        : 'bg-amber-100 text-amber-950';

      return ''
        + '<div class="bg-gradient-to-b ' + borderAndBg + ' border-2 rounded-3xl p-5 text-center shadow-md flex flex-col items-center justify-center min-h-[225px] space-y-2.5">'
        +   '<div class="flex items-center justify-center gap-2.5 flex-wrap">'
        +     '<div class="w-10 h-10 rounded-2xl ' + (passed ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-slate-950') + ' flex items-center justify-center shadow-sm">'
        +       '<i data-lucide="' + (passed ? 'award' : 'rotate-ccw') + '" class="w-5 h-5"></i>'
        +     '</div>'
        +     '<span class="px-3.5 py-1 rounded-full ' + badgeClass + ' font-black text-xs uppercase tracking-wider">'
        +       lvl.title + ' • Dijiste ' + spokenCount + ' de ' + totalCount + ' números (' + (passed ? 'Completado' : 'Incompleto') + ')'
        +     '</span>'
        +   '</div>'
        +   '<div class="space-y-1 max-w-2xl mx-auto">'
        +     '<h3 class="text-xl sm:text-2xl font-black text-slate-900">' + headline + '</h3>'
        +     '<p class="text-xs sm:text-sm text-slate-600 font-bold">' + subtext + '</p>'
        +     (transcriptText
          ? '<p class="text-xs text-slate-500 italic bg-white/80 px-3 py-1 rounded-xl border border-slate-200 inline-block mt-1">Te escuchamos decir: "' + transcriptText + '"</p>'
          : '')
        +   '</div>'
        +   '<div class="flex flex-wrap items-center justify-center gap-3 pt-1">'
        +     '<button type="button" onclick="app.startRhythmChallenge()" class="px-5 py-2.5 rounded-2xl ' + (passed ? 'bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-300' : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md') + ' font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer">'
        +       '<i data-lucide="rotate-ccw" class="w-4 h-4"></i>'
        +       '<span>Intentar de nuevo (' + lvl.rangeLabel + ') (Espacio)</span>'
        +     '</button>'
        +     (passed && hasNextLevel
          ? '<button type="button" onclick="app.advanceToNextRhythmLevel()" class="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer">'
            + '<i data-lucide="arrow-right" class="w-4 h-4"></i>'
            + '<span>Pasar al ' + nextLvl.title + ' (' + nextLvl.rangeLabel + ')</span>'
            + '</button>'
          : '')
        +     (passed && !hasNextLevel
          ? '<button type="button" onclick="app.completeAndCloseVoiceModal()" class="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer">'
            + '<i data-lucide="check-circle" class="w-4 h-4"></i>'
            + '<span>¡Terminar y Guardar Estrellas! (Espacio)</span>'
            + '</button>'
          : '')
        +   '</div>'
        + '</div>';
    }

    // 4. ESTADO POR DEFECTO: IDLE (LISTO PARA EMPEZAR)
    var introTitle = isSkip
      ? ('¿Saltamos de ' + step + ' en ' + step + ' hasta el ' + maxNum + ' siguiendo el ritmo?')
      : ('¿Contamos juntos del 1 al ' + maxNum + ' siguiendo el ritmo?');
    var introDesc = isSkip
      ? ('Iremos dando saltos de ' + step + ' en ' + step + ' (' + seq.slice(0, 3).join(', ') + '...). ¡Di cada resultado en voz alta apenas aparezca!')
      : 'Los números van a ir saliendo solos uno por uno. ¡Dilos fuerte con tu voz apenas aparezcan!';

    return ''
      + '<div class="bg-gradient-to-r from-amber-50/80 via-white to-blue-50/50 border-2 border-amber-300 rounded-3xl p-5 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-5 min-h-[210px]">'
      +   '<div class="space-y-2 text-center lg:text-left flex-1">'
      +     '<div class="flex items-center justify-center lg:justify-start gap-2 flex-wrap">'
      +       '<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-200/90 text-amber-950 font-black text-xs uppercase tracking-wider">'
      +         '<i data-lucide="' + (isSkip ? 'zap' : 'sparkles') + '" class="w-3.5 h-3.5 text-amber-800"></i>'
      +         '<span>' + lvl.title + ' • ' + lvl.rangeLabel + ' (' + lvl.speedName + ')</span>'
      +       '</span>'
      +       '<button type="button" onclick="app.speakCurrentActivityPrompt()" class="px-3 py-1 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-900 text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer">'
      +         '<i data-lucide="volume-2" class="w-3.5 h-3.5 text-blue-700"></i>'
      +         '<span>Escuchar a Leo</span>'
      +       '</button>'
      +     '</div>'
      +     '<h3 class="text-xl sm:text-2xl font-black text-slate-900">' + introTitle + '</h3>'
      +     '<p class="text-xs sm:text-sm text-slate-600 font-semibold max-w-xl">' + introDesc + '</p>'
      +   '</div>'
      +   '<div class="flex flex-col sm:flex-row items-center gap-3 flex-shrink-0">'
      +     '<button type="button" onclick="app.startRhythmChallenge()" class="px-7 py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-950 font-black text-sm sm:text-base shadow-md transition flex items-center justify-center gap-2.5 cursor-pointer">'
      +       '<i data-lucide="play" class="w-5 h-5 fill-slate-950"></i>'
      +       '<span>' + (isSkip ? '¡Empezar a Saltar! (Espacio)' : '¡Vamos a Contar! (Espacio)') + '</span>'
      +     '</button>'
      +   '</div>'
      + '</div>';
  },

  // Renderiza los iconos pictoricos del modelo COPISI para Sumas hasta el 10 (MA01 OA 09)
  renderCopisiGroupIcons(count, iconName, colorKey) {
    var bgClass = 'bg-blue-100 text-blue-700 border-blue-200';
    if (colorKey === 'rose') bgClass = 'bg-rose-100 text-rose-700 border-rose-200';
    else if (colorKey === 'amber') bgClass = 'bg-amber-100 text-amber-800 border-amber-200';
    else if (colorKey === 'emerald') bgClass = 'bg-emerald-100 text-emerald-700 border-emerald-200';
    else if (colorKey === 'purple') bgClass = 'bg-purple-100 text-purple-700 border-purple-200';

    var html = '';
    for (var i = 0; i < count; i++) {
      html += '<span class="w-8 h-8 rounded-xl border flex items-center justify-center shadow-2xs ' + bgClass + '">'
        + '<i data-lucide="' + iconName + '" class="w-4 h-4"></i>'
        + '</span>';
    }
    return html;
  },

  // Renderiza el cuerpo interactivo segun el tipo de actividad oficial Mineduc (diseno ancho sin scroll)
  renderActivityInteractiveBody(act, appState) {
    var type = (act && act.activityType) ? act.activityType : 'counting';

    // TIPO 1 Y 1B: ACTIVIDADES RITMICAS "CUENTA AL RITMO" (MA01 OA 01) Y "SALTA AL RITMO: TABLAS x2 Y x5" (MA02 OA 11)
    if (type === 'counting' || type === 'skip_counting') {
      var levels = this.getRhythmLevelsForState(appState);
      var levelId = appState.rhythmLevel || 1;
      var lvl = levels.find(function(l) { return l.id === levelId; }) || levels[0];
      var controlsHtml = this.renderRhythmControls(appState);
      var stageHtml = this.renderRhythmStage(appState);
      var stripHtml = this.renderRhythmSequenceStrip(appState, lvl);

      return ''
        + '<div class="space-y-2.5">'
        +   controlsHtml
        +   stageHtml
        +   stripHtml
        + '</div>';
    }

    var questions = (act && Array.isArray(act.questions)) ? act.questions : [];
    var qIndex = Math.min(appState.currentQuestionIndex || 0, Math.max(0, questions.length - 1));
    var currentQ = questions[qIndex] || {};

    // Indicadores de pasos (Pills de avance)
    var stepPills = questions.map(function(q, idx) {
      var isDone = idx < appState.completedStepsCount;
      var isCurrent = idx === qIndex && !appState.isCurrentActivityFinished;
      var pillClass = isDone
        ? 'bg-emerald-500 text-white border-emerald-500'
        : (isCurrent ? 'bg-amber-400 text-slate-950 border-amber-500 ring-2 ring-amber-300 font-black' : 'bg-slate-100 text-slate-400 border-slate-200');
      return '<div class="px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1 ' + pillClass + '">'
        + (isDone ? '<i data-lucide="check" class="w-3 h-3"></i>' : '')
        + '<span>Paso ' + (idx + 1) + '</span>'
        + '</div>';
    }).join('');

    // TIPO 2: "ESCALERA DE SUMAS" CON MODELO COPISI (MA01 OA 09 / MA02 OA 09) - Diseno horizontal sin scroll
    if (type === 'addition') {
      var groupA = currentQ.groupA || { count: 2, icon: 'apple', label: '2 elementos', color: 'rose' };
      var groupB = currentQ.groupB || { count: 1, icon: 'apple', label: '1 elemento', color: 'amber' };
      var optionsHtml = (currentQ.options || []).map(function(opt) {
        return '<button type="button" onclick="app.selectStepOption(' + opt.value + ')" class="p-2.5 rounded-2xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 bg-white transition-all flex flex-col items-center justify-center gap-0.5 shadow-2xs active:scale-95 cursor-pointer">'
          + '<span class="text-2xl font-black text-slate-900">' + opt.value + '</span>'
          + '<span class="text-xs font-bold text-slate-600">' + opt.label + '</span>'
          + '</button>';
      }).join('');

      // Pista horizontal "Escalera de Robot Leo" (Peldanos 1 al 5 + Trofeo Dorado)
      var stairStepsHtml = questions.map(function(q, idx) {
        var isDone = idx < appState.completedStepsCount;
        var isCurrent = idx === qIndex && !appState.isCurrentActivityFinished;
        var boxClass = isDone
          ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
          : (isCurrent ? 'bg-amber-400 text-slate-950 border-amber-500 ring-2 ring-amber-300 shadow-sm scale-105' : 'bg-white text-slate-500 border-slate-200');
        return '<div class="flex-1 px-2.5 py-1.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-black transition-all ' + boxClass + '">'
          + '<i data-lucide="' + (isDone ? 'check-circle' : (isCurrent ? 'bot' : 'footprints')) + '" class="w-3.5 h-3.5 flex-shrink-0"></i>'
          + '<span class="truncate">Peldaño ' + (idx + 1) + '</span>'
          + '</div>';
      }).join('<i data-lucide="chevron-right" class="w-3.5 h-3.5 text-slate-400 flex-shrink-0"></i>');

      var trophyUnlocked = appState.isCurrentActivityFinished || (appState.completedStepsCount >= questions.length && questions.length > 0);
      var trophyBadgeHtml = '<div class="px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-black flex-shrink-0 '
        + (trophyUnlocked ? 'bg-amber-400 text-slate-950 border-amber-500 ring-2 ring-amber-300 shadow-sm' : 'bg-slate-100 text-slate-400 border-slate-200') + '">'
        + '<i data-lucide="trophy" class="w-4 h-4"></i>'
        + '<span>Cima Dorada</span>'
        + '</div>';

      return ''
        + '<div class="space-y-2.5">'
        +   '<div class="bg-slate-50 border border-slate-200/90 rounded-2xl px-3.5 py-2 flex items-center justify-between gap-2 overflow-x-auto">'
        +     '<span class="text-[11px] font-black uppercase tracking-wider text-blue-900 flex items-center gap-1 flex-shrink-0"><i data-lucide="trending-up" class="w-3.5 h-3.5 text-blue-600"></i>Escalera de Leo:</span>'
        +     '<div class="flex items-center gap-1.5 flex-1 min-w-[420px]">' + stairStepsHtml + '</div>'
        +     '<i data-lucide="chevron-right" class="w-3.5 h-3.5 text-slate-400 flex-shrink-0"></i>'
        +     trophyBadgeHtml
        +   '</div>'
        +   '<div class="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">'
        +     '<div class="lg:col-span-5 bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3.5 shadow-xs flex flex-col justify-between space-y-2">'
        +       '<div class="space-y-1.5">'
        +         '<div class="flex items-center justify-between gap-2">'
        +           '<span class="text-xs font-black uppercase text-blue-900 flex items-center gap-1.5"><i data-lucide="volume-2" class="w-4 h-4 text-blue-600"></i>' + (currentQ.title || ('Peldaño ' + (qIndex + 1))) + ':</span>'
        +           '<button type="button" onclick="app.speakCurrentActivityPrompt()" class="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><i data-lucide="volume-2" class="w-3.5 h-3.5"></i><span>Escuchar de nuevo</span></button>'
        +         '</div>'
        +         '<p class="text-sm sm:text-base font-bold text-slate-800 leading-snug">' + (currentQ.text || '') + '</p>'
        +       '</div>'
        +       '<div class="bg-white/90 rounded-xl px-3 py-2 border border-blue-200/70 flex items-center justify-between">'
        +         '<span class="text-xs font-bold text-slate-500">Suma del peldaño:</span>'
        +         '<span class="text-blue-700 font-black text-base">' + (currentQ.equation || '') + '</span>'
        +       '</div>'
        +     '</div>'
        +     '<div class="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between space-y-2.5">'
        +       '<div class="grid grid-cols-7 gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-200/70">'
        +         '<div class="col-span-3 flex flex-col items-center gap-1 bg-white p-2 rounded-xl border border-slate-200/80">'
        +           '<div class="flex flex-wrap items-center justify-center gap-1">' + this.renderCopisiGroupIcons(groupA.count, groupA.icon, groupA.color) + '</div>'
        +           '<span class="text-[11px] font-black text-slate-700">' + groupA.label + '</span>'
        +         '</div>'
        +         '<div class="col-span-1 flex items-center justify-center"><span class="w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black text-base flex items-center justify-center shadow-2xs">+</span></div>'
        +         '<div class="col-span-3 flex flex-col items-center gap-1 bg-white p-2 rounded-xl border border-slate-200/80">'
        +           '<div class="flex flex-wrap items-center justify-center gap-1">' + this.renderCopisiGroupIcons(groupB.count, groupB.icon, groupB.color) + '</div>'
        +           '<span class="text-[11px] font-black text-slate-700">' + groupB.label + '</span>'
        +         '</div>'
        +       '</div>'
        +       '<div>'
        +         '<div class="text-xs font-bold text-slate-500 mb-1.5">Dilo con tu voz (<kbd class="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-300 text-[10px]">Espacio</kbd>) o toca el resultado para subir el peldaño:</div>'
        +         '<div class="grid grid-cols-3 gap-2.5">' + optionsHtml + '</div>'
        +       '</div>'
        +     '</div>'
        +   '</div>'
        + '</div>';
    }

    // TIPO 3: "APLAUDE LAS SILABAS Y CAZA DE SONIDOS" (LE01 OA 03 / LE02 OA 21) - Diseno horizontal sin scroll
    if (type === 'phonological') {
      var phOptionsHtml = (currentQ.options || []).map(function(opt) {
        return '<button type="button" onclick="app.selectStepOption(\'' + opt.value + '\')" class="p-3 rounded-2xl border-2 border-slate-200 hover:border-purple-500 hover:bg-purple-50/50 bg-white transition-all flex flex-col items-center justify-center gap-0.5 shadow-2xs active:scale-95 cursor-pointer">'
          + '<span class="text-2xl font-black text-purple-900">' + opt.value + '</span>'
          + '<span class="text-xs font-bold text-slate-600">' + opt.label + '</span>'
          + '</button>';
      }).join('');

      var rawSyllables = (currentQ.syllables || currentQ.word || '').split('-').map(function(s) { return s.trim(); }).filter(Boolean);
      var activeSylIdx = typeof appState.activeSyllableIndex === 'number' ? appState.activeSyllableIndex : -1;
      var syllableDrumsHtml = rawSyllables.map(function(syl, sIdx) {
        var isSylActive = sIdx === activeSylIdx;
        var isFirstSyl = sIdx === 0;
        var drumClass = isSylActive
          ? 'bg-amber-400 text-slate-950 border-amber-500 ring-2 ring-amber-300 scale-110 shadow-md'
          : (isFirstSyl ? 'bg-purple-100 hover:bg-purple-200 text-purple-950 border-purple-300' : 'bg-white hover:bg-purple-50 text-slate-800 border-slate-300');
        return '<button type="button" onclick="app.speakSyllableClap(\'' + syl + '\', ' + sIdx + ')" class="px-4 py-2 rounded-2xl border-2 font-black text-base sm:text-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ' + drumClass + '">'
          + '<i data-lucide="music" class="w-3.5 h-3.5 ' + (isSylActive ? 'text-slate-950' : 'text-purple-600') + '"></i>'
          + '<span>' + syl + '</span>'
          + '</button>';
      }).join('<span class="text-purple-400 font-black text-sm">+</span>');

      return ''
        + '<div class="space-y-2.5">'
        +   '<div class="flex items-center justify-between flex-wrap gap-2">'
        +     '<span class="text-xs font-black uppercase tracking-wider text-purple-900 bg-purple-100 px-3 py-1 rounded-xl border border-purple-200">' + (currentQ.title || ('Palabra ' + (qIndex + 1))) + '</span>'
        +     '<div class="flex items-center gap-1.5">' + stepPills + '</div>'
        +   '</div>'
        +   '<div class="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">'
        +     '<div class="lg:col-span-6 bg-purple-50/70 border border-purple-200/80 rounded-2xl p-3.5 shadow-xs flex flex-col justify-between space-y-2.5">'
        +       '<div class="flex items-center justify-between gap-2 flex-wrap">'
        +         '<span class="text-xs font-black uppercase text-purple-900 flex items-center gap-1.5"><i data-lucide="volume-2" class="w-4 h-4 text-purple-700"></i>1. Aplaude las sílabas:</span>'
        +         '<div class="flex items-center gap-1.5">'
        +           '<button type="button" onclick="app.playWordSyllablesRhythm()" class="px-3 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-2xs cursor-pointer"><i data-lucide="hand-metal" class="w-3.5 h-3.5"></i><span>¡Aplaudir Sílabas!</span></button>'
        +           '<button type="button" onclick="app.speakCurrentActivityPrompt()" class="px-2.5 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"><i data-lucide="volume-2" class="w-3.5 h-3.5"></i><span>Palabra</span></button>'
        +         '</div>'
        +       '</div>'
        +       '<div class="bg-white rounded-2xl p-3 border border-purple-200/80 flex items-center justify-between gap-3 flex-wrap">'
        +         '<div class="flex items-center gap-3">'
        +           '<div class="w-12 h-12 rounded-2xl bg-purple-100 text-purple-800 border border-purple-200 flex items-center justify-center flex-shrink-0">'
        +             '<i data-lucide="' + (currentQ.icon || 'book-open') + '" class="w-6 h-6"></i>'
        +           '</div>'
        +           '<div>'
        +             '<span class="text-xl font-black tracking-widest text-slate-900 block">' + (currentQ.word || '') + '</span>'
        +             '<span class="block text-[11px] font-bold text-purple-700">Toca cada tambor para escuchar su sílaba</span>'
        +           '</div>'
        +         '</div>'
        +         '<div class="flex items-center gap-1.5 flex-wrap">' + syllableDrumsHtml + '</div>'
        +       '</div>'
        +       '<div class="text-xs sm:text-sm font-bold text-slate-700">' + (currentQ.text || '') + '</div>'
        +     '</div>'
        +     '<div class="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-center">'
        +       '<div class="text-xs font-bold text-slate-500 mb-2">2. Di el sonido inicial con tu voz (<kbd class="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-300 text-[10px]">Espacio</kbd>) o toca la letra:</div>'
        +       '<div class="grid grid-cols-3 gap-2.5">' + phOptionsHtml + '</div>'
        +     '</div>'
        +   '</div>'
        + '</div>';
    }

    // TIPO 4: "DETECTIVE DE CUENTOS" - ROMPECABEZAS DE 3 PIEZAS (LE01 OA 18 / LE02 OA 18) - Sin scroll
    var storyText = (act && act.storyText) ? act.storyText : '';
    var storyTitle = (act && act.storyTitle) ? act.storyTitle : 'Cuento para Escuchar';

    var puzzlePiecesHtml = questions.map(function(q, idx) {
      var isUnlocked = idx < appState.completedStepsCount || appState.isCurrentActivityFinished;
      var isCurrent = idx === qIndex && !isUnlocked;
      var pLabel = q.pieceLabel || ('Pieza ' + (idx + 1));
      var pIcon = q.pieceIcon || 'puzzle';
      var cardClass = isUnlocked
        ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
        : (isCurrent ? 'bg-amber-400 text-slate-950 border-amber-500 ring-2 ring-amber-300 font-black' : 'bg-white text-slate-400 border-slate-200');
      return '<div class="flex-1 px-3 py-1.5 rounded-xl border flex items-center justify-between gap-2 text-xs font-bold transition-all ' + cardClass + '">'
        + '<div class="flex items-center gap-1.5 truncate">'
        +   '<i data-lucide="' + (isUnlocked ? 'check-circle' : pIcon) + '" class="w-4 h-4 flex-shrink-0"></i>'
        +   '<span class="truncate">' + pLabel + '</span>'
        + '</div>'
        + '<span class="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-black/10 flex-shrink-0">' + (isUnlocked ? 'Desbloqueada' : (isCurrent ? 'En juego' : 'Oculta')) + '</span>'
        + '</div>';
    }).join('');

    return ''
      + '<div class="space-y-2.5">'
      +   '<div class="bg-purple-50/80 border border-purple-200/90 rounded-2xl px-3.5 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">'
      +     '<span class="text-[11px] font-black uppercase tracking-wider text-purple-950 flex items-center gap-1.5 flex-shrink-0"><i data-lucide="puzzle" class="w-4 h-4 text-purple-700"></i>Rompecabezas del Cuento:</span>'
      +     '<div class="flex items-center gap-2 flex-1">' + puzzlePiecesHtml + '</div>'
      +   '</div>'
      +   '<div class="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">'
      +     '<div class="lg:col-span-7 bg-amber-50/70 border border-amber-200/90 rounded-2xl p-3.5 shadow-xs space-y-2 flex flex-col justify-between">'
      +       '<div class="flex items-center justify-between gap-2 flex-wrap">'
      +         '<span class="text-xs font-black uppercase text-amber-950 flex items-center gap-1.5"><i data-lucide="book-open" class="w-4 h-4 text-amber-700"></i>' + storyTitle + '</span>'
      +         '<button type="button" onclick="app.speakStoryText()" class="px-3 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-2xs cursor-pointer"><i data-lucide="volume-2" class="w-3.5 h-3.5"></i><span>Escuchar Cuento</span></button>'
      +       '</div>'
      +       '<p class="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium bg-white/90 p-3 rounded-xl border border-amber-200/70">' + storyText + '</p>'
      +     '</div>'
      +     '<div class="lg:col-span-5 bg-blue-50/80 border border-blue-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-2">'
      +       '<div class="space-y-2">'
      +         '<div class="flex items-center justify-between gap-2">'
      +           '<span class="text-xs font-black uppercase text-blue-950 flex items-center gap-1.5"><i data-lucide="help-circle" class="w-4 h-4 text-blue-600"></i>' + (currentQ.title || ('Pista ' + (qIndex + 1))) + ':</span>'
      +           '<button type="button" onclick="app.speakCurrentActivityPrompt()" class="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><i data-lucide="volume-2" class="w-3.5 h-3.5"></i><span>Escuchar Pista</span></button>'
      +         '</div>'
      +         '<h4 class="text-base sm:text-lg font-black text-slate-900">' + (currentQ.question || '') + '</h4>'
      +       '</div>'
      +       '<p class="text-xs text-blue-800 font-semibold">Responde con tu voz tocando <kbd class="px-1.5 py-0.5 bg-white rounded border border-blue-300 text-[11px] font-black">Espacio</kbd> para ganar la <strong>' + (currentQ.pieceLabel || ('Pieza ' + (qIndex + 1))) + '</strong>.</p>'
      +     '</div>'
      +   '</div>'
      + '</div>';
  },

  // PANTALLA INTERACTIVA MULTIMODAL DE ACTIVIDADES CON VOZ (Ancho ampliado max-w-5xl sin scroll)
  renderVoiceModal(isOpen, activityTitle) {
    if (!isOpen) return '';
    var act = (window.app && app.getActiveActivityObject) ? app.getActiveActivityObject() : null;
    var titleToRender = (act && act.title) ? act.title : (activityTitle || 'Cuenta al Ritmo: Del 1 al 20 con Robot Leo');
    var oaBadge = (act && act.oaCode) ? act.oaCode : '1° Básico';
    var subjectLabel = (act && act.subject) ? act.subject : 'Matemáticas';
    var type = (act && act.activityType) ? act.activityType : 'counting';
    var isRhythmType = (type === 'counting' || type === 'skip_counting');

    var stage = (window.app && app.voiceModalStage) ? app.voiceModalStage : 'loading';
    var progressInfo = (window.app && app.getActivityProgressSummary)
      ? app.getActivityProgressSummary()
      : { label: 'Progreso: 0 de 10', percent: 0 };

    var loadingStyle = stage === 'loading' ? 'flex' : 'none';
    var welcomeStyle = stage === 'welcome' ? 'flex' : 'none';
    var dStyle = stage === 'disclaimer' ? 'flex' : 'none';
    var aStyle = stage === 'activity' ? 'flex' : 'none';

    var interactiveBodyHtml = this.renderActivityInteractiveBody(act, window.app || {});
    var isCompletedNow = (window.app && app.isActivityCompleted) ? app.isActivityCompleted() : false;

    var recordBtnLabel = isCompletedNow
      ? 'Cerrar Actividad (Espacio)'
      : (isRhythmType ? '¡Vamos al Ritmo! (Espacio)' : 'Hablar Ahora (Espacio)');
    var actionBoxTitle = isCompletedNow
      ? '¡Lo lograste súper bien!'
      : (isRhythmType ? 'Cuenta conmigo siguiendo el ritmo' : (type === 'story_comprehension' ? 'Cuéntame tu respuesta para desbloquear la pieza' : 'Dime tu respuesta por el micrófono'));

    // En las actividades ritmicas el boton principal ya vive en el escenario central, por lo que ocultamos la caja duplicada
    var voiceCardDisplayClass = isRhythmType ? 'hidden' : 'flex';

    return '<div id="voice-ai-modal-backdrop" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fadeIn">'
      + '<div class="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-5xl overflow-hidden flex flex-col max-h-[96vh]">'
      + '<div class="theme-header px-5 py-3 text-white flex items-center justify-between flex-shrink-0">'
      +   '<div class="flex items-center space-x-3">'
      +     '<div class="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center shadow-sm"><i data-lucide="bot" class="w-5 h-5 text-slate-950"></i></div>'
      +     '<div>'
      +       '<div class="flex items-center gap-2 flex-wrap">'
      +         '<h3 class="font-extrabold text-sm sm:text-base text-white">Robot Leo • ' + subjectLabel + '</h3>'
      +         '<span class="bg-amber-400 text-slate-950 text-[11px] font-black px-2 py-0.5 rounded-full uppercase">' + oaBadge + '</span>'
      +       '</div>'
      +       '<p class="text-xs text-white/85 font-medium">' + titleToRender + '</p>'
      +     '</div>'
      +   '</div>'
      +   '<div class="flex items-center gap-3">'
      +     '<span class="hidden sm:inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs px-2.5 py-1 rounded-full font-bold"><span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>Voz Activa</span>'
      +     '<button onclick="app.closeVoiceModal()" class="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"><i data-lucide="x" class="w-5 h-5"></i></button>'
      +   '</div>'
      + '</div>'

      // 1. PANTALLA DE CARGA INICIAL
      + '<div id="counting-loading" class="flex-col items-center justify-center p-10 text-center space-y-4 bg-white" style="display:' + loadingStyle + '">'
      +   '<div class="w-16 h-16 rounded-3xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900 shadow-sm animate-pulse">'
      +     '<i data-lucide="bot" class="w-8 h-8 text-amber-600"></i>'
      +   '</div>'
      +   '<div class="space-y-1 max-w-md">'
      +     '<span class="inline-block bg-blue-50 text-blue-700 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">Ya casi estamos</span>'
      +     '<h3 class="text-xl font-black text-slate-900">Robot Leo se está preparando...</h3>'
      +     '<p id="counting-loading-status" class="text-xs sm:text-sm text-slate-500 font-medium">Dejando todo listo para jugar contigo.</p>'
      +   '</div>'
      +   '<div class="w-56 sm:w-72 h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80">'
      +     '<div id="counting-loading-bar" class="h-full bg-amber-400 rounded-full transition-all duration-300" style="width: 35%"></div>'
      +   '</div>'
      + '</div>'

      // 2. PANTALLA DE BIENVENIDA - Presionar ESPACIO para iniciar y escuchar TTS
      + '<div id="counting-welcome" class="flex-col items-center justify-center p-7 text-center space-y-5 bg-white" style="display:' + welcomeStyle + '">'
      +   '<div class="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-xs">'
      +     '<i data-lucide="volume-2" class="w-7 h-7"></i>'
      +   '</div>'
      +   '<div class="space-y-1.5 max-w-lg mx-auto">'
      +     '<span class="inline-block bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">¡Listos para jugar! • ' + oaBadge + '</span>'
      +     '<h3 class="text-2xl font-black text-slate-900">' + titleToRender + '</h3>'
      +     '<p class="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium"><strong>Robot Leo</strong> te va a contar cómo jugar y te dará un consejo rápido para que el micrófono te escuche súper bien.</p>'
      +   '</div>'
      +   '<div class="pt-1 flex flex-col sm:flex-row items-center justify-center gap-3 w-full">'
      +     '<button onclick="app.startDisclaimerWithVoice()" class="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-950 font-black text-sm shadow-md transition flex items-center justify-center gap-2.5 cursor-pointer">'
      +       '<i data-lucide="play" class="w-4 h-4 text-slate-950"></i>'
      +       '<span>Escuchar a Robot Leo (Espacio)</span>'
      +     '</button>'
      +   '</div>'
      + '</div>'

      // 3. DISCLAIMER E INDICACIONES CON VOZ TTS
      + '<div id="counting-disclaimer" class="flex-col p-6 space-y-4 bg-white" style="display:' + dStyle + '">'
      +   '<div class="bg-blue-50/80 border border-blue-200 rounded-2xl p-3 flex items-center justify-between gap-3">'
      +     '<div class="flex items-center gap-2.5">'
      +       '<div id="disclaimer-tts-indicator" class="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 animate-pulse">'
      +         '<i data-lucide="volume-2" class="w-4 h-4"></i>'
      +       '</div>'
      +       '<div>'
      +         '<span id="disclaimer-tts-status" class="text-xs font-black text-blue-950 block">Robot Leo te está dando unos consejos rápidos...</span>'
      +         '<span class="text-[11px] text-blue-700 font-medium">Así tu voz se escuchará fuerte y clarita</span>'
      +       '</div>'
      +     '</div>'
      +     '<button type="button" onclick="app.playDisclaimerTts()" class="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer">'
      +       '<i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>'
      +       '<span>Escuchar otra vez</span>'
      +     '</button>'
      +   '</div>'
      +   '<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">'
      +     '<div class="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1"><div class="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center mb-1"><i data-lucide="home" class="w-4 h-4 text-blue-700"></i></div><h5 class="text-xs font-black text-slate-900">1. Rincón Tranquilo</h5><p class="text-xs text-slate-500">Busca un lugar donde no haya tanto ruido alrededor.</p></div>'
      +     '<div class="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1"><div class="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center mb-1"><i data-lucide="tv" class="w-4 h-4 text-amber-800"></i></div><h5 class="text-xs font-black text-slate-900">2. Sin Tele ni Música</h5><p class="text-xs text-slate-500">Baja el volumen de la tele o la música mientras jugamos.</p></div>'
      +     '<div class="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1"><div class="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center mb-1"><i data-lucide="mic" class="w-4 h-4 text-emerald-800"></i></div><h5 class="text-xs font-black text-slate-900">3. Tu Voz Fuerte y Clara</h5><p class="text-xs text-slate-500">Habla con ánimo mirando hacia la pantalla.</p></div>'
      +   '</div>'
      +   '<div class="pt-1 flex flex-col sm:flex-row items-center justify-center gap-3">'
      +     '<button onclick="app.acceptNoiseDisclaimer()" class="w-full sm:w-auto px-7 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2.5 cursor-pointer">'
      +       '<i data-lucide="arrow-right" class="w-4 h-4 text-white"></i>'
      +       '<span>¡Listo, Empecemos a Jugar! (Espacio)</span>'
      +     '</button>'
      +     '<button onclick="app.closeVoiceModal()" class="w-full sm:w-auto px-5 py-2.5 rounded-xl text-slate-500 hover:bg-slate-100 font-bold text-xs transition cursor-pointer">Salir</button>'
      +   '</div>'
      + '</div>'

      // 4. PANTALLA PRINCIPAL DE ACTIVIDAD (Compacta y ancha para no requerir scroll)
      + '<div id="counting-activity" class="flex-col overflow-hidden" style="display:' + aStyle + '">'
      + '<div class="bg-amber-50/60 px-5 py-2 border-b border-amber-100 flex items-center justify-between text-xs text-amber-950 font-bold flex-shrink-0">'
      +   '<div class="flex items-center gap-2.5"><span id="counting-progress-text">' + progressInfo.label + '</span><div class="w-28 sm:w-40 h-2 rounded-full bg-slate-200 overflow-hidden"><div id="counting-progress-bar" class="h-full bg-emerald-500 rounded-full transition-all duration-500" style="width:' + progressInfo.percent + '%"></div></div></div>'
      +   '<button onclick="app.showNoiseDisclaimer()" class="text-xs text-blue-700 hover:underline flex items-center gap-1 font-semibold cursor-pointer"><i data-lucide="volume-2" class="w-3.5 h-3.5"></i><span>Consejos de Micrófono</span></button>'
      + '</div>'
      + '<div class="px-5 py-3.5 space-y-2.5 flex-1 bg-gradient-to-b from-white to-slate-50/60">'
      +   '<div id="activity-dynamic-body" class="space-y-2.5">'
      +     interactiveBodyHtml
      +   '</div>'
      +   '<div id="voice-action-card" class="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs flex-col gap-2.5 ' + voiceCardDisplayClass + '">'
      +     '<div class="flex flex-col sm:flex-row items-center justify-between gap-3">'
      +       '<div class="flex items-center gap-3"><div id="voice-mic-icon-box" class="w-10 h-10 rounded-xl ' + (isCompletedNow ? 'bg-emerald-500' : 'bg-amber-400') + ' flex items-center justify-center shadow-xs flex-shrink-0"><i data-lucide="' + (isCompletedNow ? 'award' : 'mic') + '" class="w-5 h-5 ' + (isCompletedNow ? 'text-white' : 'text-slate-950') + '"></i></div>'
      +       '<div><h4 id="voice-action-title" class="font-extrabold text-slate-900 text-sm">' + actionBoxTitle + '</h4><p id="voice-action-subtitle" class="text-xs text-slate-500">Toca <kbd class="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-300 font-bold text-[11px]">Espacio</kbd> o el botón para hablar</p></div></div>'
      +       '<button id="voice-record-btn" onclick="app.handleMainActivityAction()" class="w-full sm:w-auto px-6 py-3 rounded-xl ' + (isCompletedNow ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-amber-400 hover:bg-amber-300 text-slate-950') + ' active:scale-98 font-black text-xs sm:text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"><i data-lucide="' + (isCompletedNow ? 'check-circle' : 'mic') + '" class="w-4 h-4"></i><span id="voice-record-text">' + recordBtnLabel + '</span></button>'
      +     '</div>'
      +     '<div id="voice-transcription-result" class="hidden p-3 rounded-xl border transition-all text-xs"></div>'
      +   '</div>'
      + '</div>'
      + '<div class="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">'
      +   '<button onclick="app.resetCurrentActivityProgress()" class="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/70 transition flex items-center gap-1.5 cursor-pointer"><i data-lucide="rotate-ccw" class="w-3.5 h-3.5 text-slate-500"></i><span>Empezar de Nuevo</span></button>'
      +   '<button id="voice-finish-btn" onclick="app.completeAndCloseVoiceModal()" class="px-5 py-2 rounded-xl text-xs font-black theme-primary-bg text-white shadow-sm hover:opacity-95 transition flex items-center gap-2 cursor-pointer"><span id="voice-finish-text">' + (isCompletedNow ? 'Cerrar y Guardar (Espacio)' : 'Guardar y Salir') + '</span><i data-lucide="check" class="w-4 h-4"></i></button>'
      + '</div>'
      + '</div>'
      + '</div>'
      + '</div>';
  }
};

window.components = components;
