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

  // Lista ludica de elementos para el conteo del 1 al 10 en 1° Basico (MA01 OA 01)
  countingItems: [
    { num: 1, word: "Uno", icon: "sun", label: "1 Sol" },
    { num: 2, word: "Dos", icon: "apple", label: "2 Manzanas" },
    { num: 3, word: "Tres", icon: "sparkles", label: "3 Estrellitas" },
    { num: 4, word: "Cuatro", icon: "fish", label: "4 Pececitos" },
    { num: 5, word: "Cinco", icon: "flower-2", label: "5 Florecitas" },
    { num: 6, word: "Seis", icon: "gift", label: "6 Regalos" },
    { num: 7, word: "Siete", icon: "heart", label: "7 Corazones" },
    { num: 8, word: "Ocho", icon: "tree-pine", label: "8 Pinitos" },
    { num: 9, word: "Nueve", icon: "bell", label: "9 Campanitas" },
    { num: 10, word: "Diez", icon: "trophy", label: "10 Trofeos" }
  ],

  // Genera HTML de las 10 tarjetas de conteo destacando el orden secuencial (MA01 OA 01)
  renderCountingCards(counted) {
    var nextExpected = counted.length + 1;
    return this.countingItems.map(function(item) {
      var isDetected = counted.indexOf(item.num) !== -1;
      var isNext = !isDetected && item.num === nextExpected;

      var cardClass = '';
      var numClass = '';
      var badgeClass = '';
      var badgeContent = '';
      var iconWrapClass = '';
      var wordClass = '';
      var labelClass = '';

      if (isDetected) {
        cardClass = 'bg-emerald-500 text-white border-emerald-400 shadow-sm ring-1 ring-emerald-300 scale-102';
        numClass = 'text-white';
        badgeClass = 'bg-white text-emerald-700';
        badgeContent = '<i data-lucide="check" class="w-3.5 h-3.5"></i>';
        iconWrapClass = 'bg-white/20 text-white';
        wordClass = 'text-emerald-50';
        labelClass = 'text-emerald-100';
      } else if (isNext) {
        cardClass = 'bg-white border-amber-400 text-slate-900 shadow-md ring-2 ring-amber-400/60 scale-[1.03] animate-pulse';
        numClass = 'text-amber-950 font-black';
        badgeClass = 'bg-amber-400 text-slate-950 font-black';
        badgeContent = '<i data-lucide="arrow-right" class="w-3.5 h-3.5 text-slate-950"></i>';
        iconWrapClass = 'bg-amber-100 text-amber-900';
        wordClass = 'text-amber-900 font-black';
        labelClass = 'text-amber-800 font-bold';
      } else {
        cardClass = 'bg-slate-50 border-slate-200 text-slate-400 opacity-80 hover:opacity-100 hover:bg-white hover:border-slate-300';
        numClass = 'text-slate-500';
        badgeClass = 'bg-slate-200/70 text-slate-500';
        badgeContent = item.num;
        iconWrapClass = 'bg-slate-100 text-slate-400';
        wordClass = 'text-slate-500';
        labelClass = 'text-slate-400';
      }

      return '<button'
        + ' id="card-num-' + item.num + '"'
        + ' onclick="app.toggleCountedNumber(' + item.num + ')"'
        + ' class="p-3 rounded-2xl border transition-all duration-200 flex flex-col items-center justify-center gap-1 active:scale-95 text-center relative cursor-pointer ' + cardClass + '">'
        + '<div class="flex items-center justify-between w-full px-1">'
        + '<span class="text-2xl font-black leading-none ' + numClass + '">' + item.num + '</span>'
        + '<span class="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black ' + badgeClass + '">' + badgeContent + '</span>'
        + '</div>'
        + '<div class="w-8 h-8 rounded-xl flex items-center justify-center my-0.5 ' + iconWrapClass + '">'
        + '<i data-lucide="' + item.icon + '" class="w-4 h-4"></i>'
        + '</div>'
        + '<span class="text-xs font-black uppercase tracking-wide ' + wordClass + '">' + item.word + '</span>'
        + '<span class="text-xs ' + labelClass + '">' + item.label + '</span>'
        + '</button>';
    }).join('');
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

  // Renderiza el cuerpo interactivo segun el tipo de actividad oficial Mineduc
  renderActivityInteractiveBody(act, appState) {
    var type = (act && act.activityType) ? act.activityType : 'counting';

    // TIPO 1: CONTEO SECUENCIAL 1 AL 10 (MA01 OA 01)
    if (type === 'counting') {
      var counted = Array.isArray(appState.countedNumbers) ? appState.countedNumbers : [];
      var cardsHtml = this.renderCountingCards(counted);
      return ''
        + '<div class="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 shadow-xs">'
        +   '<div class="flex items-center justify-between mb-1.5">'
        +     '<div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span><span class="text-xs font-black uppercase text-blue-900 flex items-center gap-1"><i data-lucide="volume-2" class="w-4 h-4 text-blue-600"></i>Robot Leo te enseña a contar (MA01 OA 01):</span></div>'
        +     '<button id="btn-speak-instructions" type="button" onclick="app.speakCurrentActivityPrompt()" class="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer"><i data-lucide="volume-2" class="w-3.5 h-3.5 text-white"></i><span>Escuchar</span></button>'
        +   '</div>'
        +   '<p class="text-sm font-bold text-slate-800 leading-relaxed">Presiona el micrófono amarillo (o la tecla <kbd class="px-1.5 py-0.5 bg-white rounded border border-blue-200 text-xs">Espacio</kbd>) y cuenta en voz alta y en orden: <strong class="text-blue-700">uno, dos, tres, cuatro, cinco, seis, siete, ocho, nueve, diez.</strong></p>'
        + '</div>'
        + '<div>'
        +   '<div class="flex items-center justify-between text-xs mb-2"><span class="font-black uppercase tracking-wider text-slate-700 flex items-center gap-1"><i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-500"></i>Tus 10 Números Mágicos:</span><span class="text-slate-400">Habla o toca en orden del 1 al 10</span></div>'
        +   '<div id="counting-cards-grid" class="grid grid-cols-2 sm:grid-cols-5 gap-2.5">' + cardsHtml + '</div>'
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

    // TIPO 2: ADICIONES HASTA EL 10 CON MODELO COPISI (MA01 OA 09)
    if (type === 'addition') {
      var groupA = currentQ.groupA || { count: 2, icon: 'apple', label: '2 elementos', color: 'rose' };
      var groupB = currentQ.groupB || { count: 1, icon: 'apple', label: '1 elemento', color: 'amber' };
      var optionsHtml = (currentQ.options || []).map(function(opt) {
        return '<button type="button" onclick="app.selectStepOption(' + opt.value + ')" class="p-3.5 rounded-2xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 bg-white transition-all flex flex-col items-center justify-center gap-1 shadow-2xs active:scale-95 cursor-pointer">'
          + '<span class="text-2xl font-black text-slate-900">' + opt.value + '</span>'
          + '<span class="text-xs font-bold text-slate-600">' + opt.label + '</span>'
          + '</button>';
      }).join('');

      return ''
        + '<div class="flex items-center justify-between flex-wrap gap-2">'
        +   '<span class="text-xs font-black uppercase tracking-wider text-blue-900 bg-blue-100 px-3 py-1 rounded-xl border border-blue-200">' + (currentQ.title || ('Problema ' + (qIndex + 1))) + '</span>'
        +   '<div class="flex items-center gap-1.5">' + stepPills + '</div>'
        + '</div>'
        + '<div class="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 shadow-xs space-y-2">'
        +   '<div class="flex items-center justify-between">'
        +     '<span class="text-xs font-black uppercase text-blue-900 flex items-center gap-1.5"><i data-lucide="volume-2" class="w-4 h-4 text-blue-600"></i>Historia de Suma con Robot Leo:</span>'
        +     '<button type="button" onclick="app.speakCurrentActivityPrompt()" class="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><i data-lucide="volume-2" class="w-3.5 h-3.5"></i><span>Escuchar Problema</span></button>'
        +   '</div>'
        +   '<p class="text-sm sm:text-base font-bold text-slate-800 leading-relaxed">' + (currentQ.text || '') + '</p>'
        + '</div>'
        + '<div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">'
        +   '<div class="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">'
        +     '<span>Representación Pictórica y Simbólica (COPISI)</span>'
        +     '<span class="text-blue-700 font-black text-sm">' + (currentQ.equation || '') + '</span>'
        +   '</div>'
        +   '<div class="grid grid-cols-1 sm:grid-cols-7 gap-2 items-center bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">'
        +     '<div class="sm:col-span-3 flex flex-col items-center gap-1.5 bg-white p-2.5 rounded-xl border border-slate-200/80">'
        +       '<div class="flex flex-wrap items-center justify-center gap-1.5">' + this.renderCopisiGroupIcons(groupA.count, groupA.icon, groupA.color) + '</div>'
        +       '<span class="text-xs font-black text-slate-700">' + groupA.label + '</span>'
        +     '</div>'
        +     '<div class="sm:col-span-1 flex items-center justify-center"><span class="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black text-lg flex items-center justify-center shadow-2xs">+</span></div>'
        +     '<div class="sm:col-span-3 flex flex-col items-center gap-1.5 bg-white p-2.5 rounded-xl border border-slate-200/80">'
        +       '<div class="flex flex-wrap items-center justify-center gap-1.5">' + this.renderCopisiGroupIcons(groupB.count, groupB.icon, groupB.color) + '</div>'
        +       '<span class="text-xs font-black text-slate-700">' + groupB.label + '</span>'
        +     '</div>'
        +   '</div>'
        +   '<div>'
        +     '<div class="text-xs font-bold text-slate-500 mb-2">Di el resultado con tu voz (presionando <kbd class="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-300 text-[11px]">Espacio</kbd>) o toca la tarjeta correcta:</div>'
        +     '<div class="grid grid-cols-3 gap-3">' + optionsHtml + '</div>'
        +   '</div>'
        + '</div>';
    }

    // TIPO 3: CONCIENCIA FONOLOGICA Y SONIDO INICIAL (LE01 OA 03)
    if (type === 'phonological') {
      var phOptionsHtml = (currentQ.options || []).map(function(opt) {
        return '<button type="button" onclick="app.selectStepOption(\'' + opt.value + '\')" class="p-3.5 rounded-2xl border-2 border-slate-200 hover:border-purple-500 hover:bg-purple-50/50 bg-white transition-all flex flex-col items-center justify-center gap-1 shadow-2xs active:scale-95 cursor-pointer">'
          + '<span class="text-2xl font-black text-purple-900">' + opt.value + '</span>'
          + '<span class="text-xs font-bold text-slate-600">' + opt.label + '</span>'
          + '</button>';
      }).join('');

      return ''
        + '<div class="flex items-center justify-between flex-wrap gap-2">'
        +   '<span class="text-xs font-black uppercase tracking-wider text-purple-900 bg-purple-100 px-3 py-1 rounded-xl border border-purple-200">' + (currentQ.title || ('Palabra ' + (qIndex + 1))) + '</span>'
        +   '<div class="flex items-center gap-1.5">' + stepPills + '</div>'
        + '</div>'
        + '<div class="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-4 shadow-xs space-y-3">'
        +   '<div class="flex items-center justify-between">'
        +     '<span class="text-xs font-black uppercase text-purple-900 flex items-center gap-1.5"><i data-lucide="volume-2" class="w-4 h-4 text-purple-700"></i>Conciencia Fonológica (Leo Primero):</span>'
        +     '<button type="button" onclick="app.speakCurrentActivityPrompt()" class="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><i data-lucide="volume-2" class="w-3.5 h-3.5"></i><span>Escuchar Palabra</span></button>'
        +   '</div>'
        +   '<div class="bg-white rounded-2xl p-4 border border-purple-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">'
        +     '<div class="flex items-center gap-3.5">'
        +       '<div class="w-14 h-14 rounded-2xl bg-purple-100 text-purple-800 border border-purple-200 flex items-center justify-center flex-shrink-0">'
        +         '<i data-lucide="' + (currentQ.icon || 'book-open') + '" class="w-7 h-7"></i>'
        +       '</div>'
        +       '<div>'
        +         '<span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Palabra Destacada</span>'
        +         '<span class="text-2xl font-black tracking-widest text-slate-900">' + (currentQ.word || '') + '</span>'
        +         '<span class="block text-xs font-extrabold text-purple-700 mt-0.5">Sílabas: ' + (currentQ.syllables || '') + '</span>'
        +       '</div>'
        +     '</div>'
        +     '<div class="text-xs sm:text-sm font-bold text-slate-700 max-w-xs">' + (currentQ.text || '') + '</div>'
        +   '</div>'
        + '</div>'
        + '<div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">'
        +   '<div class="text-xs font-bold text-slate-500 mb-2">Di la letra o sílaba inicial por el micrófono (<kbd class="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-300 text-[11px]">Espacio</kbd>) o selecciónala aquí:</div>'
        +   '<div class="grid grid-cols-3 gap-3">' + phOptionsHtml + '</div>'
        + '</div>';
    }

    // TIPO 4: COMPRENSION ORAL DE RELATOS CON EVALUADOR BOOLEANO IA (LE01 OA 18)
    var storyText = (act && act.storyText) ? act.storyText : '';
    var storyTitle = (act && act.storyTitle) ? act.storyTitle : 'Relato para Escuchar';

    return ''
      + '<div class="flex items-center justify-between flex-wrap gap-2">'
      +   '<span class="text-xs font-black uppercase tracking-wider text-purple-900 bg-purple-100 px-3 py-1 rounded-xl border border-purple-200">' + (currentQ.title || ('Pregunta ' + (qIndex + 1) + ' de ' + questions.length)) + '</span>'
      +   '<div class="flex items-center gap-1.5">' + stepPills + '</div>'
      + '</div>'
      + '<div class="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-4 shadow-xs space-y-2">'
      +   '<div class="flex items-center justify-between gap-2 flex-wrap">'
      +     '<span class="text-xs font-black uppercase text-amber-950 flex items-center gap-1.5"><i data-lucide="book-open" class="w-4 h-4 text-amber-700"></i>' + storyTitle + '</span>'
      +     '<button type="button" onclick="app.speakStoryText()" class="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-2xs cursor-pointer"><i data-lucide="volume-2" class="w-3.5 h-3.5"></i><span>Escuchar Cuento Completo</span></button>'
      +   '</div>'
      +   '<p class="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium bg-white/90 p-3 rounded-xl border border-amber-200/70">' + storyText + '</p>'
      + '</div>'
      + '<div class="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 shadow-xs space-y-2">'
      +   '<div class="flex items-center justify-between gap-2">'
      +     '<span class="text-xs font-black uppercase text-blue-950 flex items-center gap-1.5"><i data-lucide="help-circle" class="w-4 h-4 text-blue-600"></i>Pregunta Abierta por Voz:</span>'
      +     '<button type="button" onclick="app.speakCurrentActivityPrompt()" class="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><i data-lucide="volume-2" class="w-3.5 h-3.5"></i><span>Escuchar Pregunta</span></button>'
      +   '</div>'
      +   '<h4 class="text-base sm:text-lg font-black text-slate-900">' + (currentQ.question || '') + '</h4>'
      +   '<p class="text-xs text-blue-800 font-semibold">Responde hablando con tus propias palabras. Presiona <kbd class="px-1.5 py-0.5 bg-white rounded border border-blue-300 text-[11px] font-black">Espacio</kbd> para hablar y vuelve a presionar <kbd class="px-1.5 py-0.5 bg-white rounded border border-blue-300 text-[11px] font-black">Espacio</kbd> al terminar tu respuesta.</p>'
      + '</div>';
  },

  // PANTALLA INTERACTIVA MULTIMODAL DE ACTIVIDADES CON VOZ (1° y 2° Basico)
  renderVoiceModal(isOpen, activityTitle) {
    if (!isOpen) return '';
    var act = (window.app && app.getActiveActivityObject) ? app.getActiveActivityObject() : null;
    var titleToRender = (act && act.title) ? act.title : (activityTitle || 'Misión Conteo Mágico: Cuenta del 1 al 10 con Robot Leo');
    var oaBadge = (act && act.oaCode) ? act.oaCode : '1° Básico';
    var subjectLabel = (act && act.subject) ? act.subject : 'Matemáticas';
    var type = (act && act.activityType) ? act.activityType : 'counting';

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
      : (type === 'counting' ? 'Presionar para Contar (Espacio)' : 'Responder con Voz (Espacio)');
    var actionBoxTitle = isCompletedNow
      ? '¡Actividad Completada con Éxito!'
      : (type === 'story_comprehension' ? 'Responde la Pregunta con tu Voz' : 'Habla con Robot Leo por el Micrófono');

    return '<div id="voice-ai-modal-backdrop" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fadeIn">'
      + '<div class="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">'
      + '<div class="theme-header p-4 sm:p-5 text-white flex items-center justify-between flex-shrink-0">'
      +   '<div class="flex items-center space-x-3">'
      +     '<div class="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center shadow-sm"><i data-lucide="bot" class="w-6 h-6 text-slate-950"></i></div>'
      +     '<div>'
      +       '<div class="flex items-center gap-2 flex-wrap">'
      +         '<h3 class="font-extrabold text-base sm:text-lg text-white">Robot Leo • ' + subjectLabel + '</h3>'
      +         '<span class="bg-amber-400 text-slate-950 text-xs font-black px-2 py-0.5 rounded-full uppercase">' + oaBadge + '</span>'
      +       '</div>'
      +       '<p class="text-xs text-white/80 font-medium">' + titleToRender + '</p>'
      +     '</div>'
      +   '</div>'
      +   '<div class="flex items-center gap-2">'
      +     '<span class="hidden sm:inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs px-2.5 py-1 rounded-full font-bold"><span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>Voz Activa</span>'
      +     '<button onclick="app.closeVoiceModal()" class="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"><i data-lucide="x" class="w-5 h-5"></i></button>'
      +   '</div>'
      + '</div>'

      // 1. PANTALLA DE CARGA INICIAL
      + '<div id="counting-loading" class="flex-col items-center justify-center p-10 sm:p-14 text-center space-y-5 bg-white" style="display:' + loadingStyle + '">'
      +   '<div class="relative flex items-center justify-center">'
      +     '<div class="w-20 h-20 rounded-3xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900 shadow-sm animate-pulse">'
      +       '<i data-lucide="bot" class="w-10 h-10 text-amber-600"></i>'
      +     '</div>'
      +   '</div>'
      +   '<div class="space-y-1.5 max-w-md">'
      +     '<span class="inline-block bg-blue-50 text-blue-700 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">Preparando Actividad</span>'
      +     '<h3 class="text-xl font-black text-slate-900">Conectando con Robot Leo...</h3>'
      +     '<p id="counting-loading-status" class="text-xs sm:text-sm text-slate-500 font-medium">Cargando voz e indicaciones para comenzar sin interrupciones.</p>'
      +   '</div>'
      +   '<div class="w-56 sm:w-72 h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80">'
      +     '<div id="counting-loading-bar" class="h-full bg-amber-400 rounded-full transition-all duration-300" style="width: 35%"></div>'
      +   '</div>'
      + '</div>'

      // 2. PANTALLA DE BIENVENIDA - Presionar ESPACIO para iniciar y escuchar TTS
      + '<div id="counting-welcome" class="flex-col items-center justify-center p-8 sm:p-10 text-center space-y-6 bg-white" style="display:' + welcomeStyle + '">'
      +   '<div class="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-xs">'
      +     '<i data-lucide="volume-2" class="w-8 h-8"></i>'
      +   '</div>'
      +   '<div class="space-y-2 max-w-lg mx-auto">'
      +     '<span class="inline-block bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">Todo Listo • ' + oaBadge + '</span>'
      +     '<h3 class="text-2xl font-black text-slate-900">' + titleToRender + '</h3>'
      +     '<p class="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">Al iniciar, <strong>Robot Leo</strong> te leerá en voz alta las recomendaciones de ruido ambiente y las instrucciones de esta actividad.</p>'
      +   '</div>'
      +   '<div class="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-4 max-w-md w-full mx-auto flex items-center justify-center gap-3 text-xs text-amber-950 font-bold">'
      +     '<kbd class="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-slate-900 font-black shadow-xs uppercase tracking-wider">Espacio</kbd>'
      +     '<span>Presiona la barra espaciadora para comenzar</span>'
      +   '</div>'
      +   '<div class="pt-1 flex flex-col sm:flex-row items-center justify-center gap-3 w-full">'
      +     '<button onclick="app.startDisclaimerWithVoice()" class="w-full sm:w-auto px-8 py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-950 font-black text-sm shadow-md transition flex items-center justify-center gap-2.5 cursor-pointer">'
      +       '<i data-lucide="play" class="w-4 h-4 text-slate-950"></i>'
      +       '<span>Iniciar y Escuchar a Robot Leo (Espacio)</span>'
      +     '</button>'
      +   '</div>'
      + '</div>'

      // 3. DISCLAIMER E INDICACIONES CON VOZ TTS
      + '<div id="counting-disclaimer" class="overflow-y-auto flex-col p-6 sm:p-7 space-y-5 bg-white" style="display:' + dStyle + '">'
      +   '<div class="bg-blue-50/80 border border-blue-200 rounded-2xl p-3.5 flex items-center justify-between gap-3">'
      +     '<div class="flex items-center gap-2.5">'
      +       '<div id="disclaimer-tts-indicator" class="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 animate-pulse">'
      +         '<i data-lucide="volume-2" class="w-4 h-4"></i>'
      +       '</div>'
      +       '<div>'
      +         '<span id="disclaimer-tts-status" class="text-xs font-black text-blue-950 block">Robot Leo está leyendo las indicaciones y consejos...</span>'
      +         '<span class="text-[11px] text-blue-700 font-medium">Escucha con atención antes de comenzar</span>'
      +       '</div>'
      +     '</div>'
      +     '<button type="button" onclick="app.playDisclaimerTts()" class="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer">'
      +       '<i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>'
      +       '<span>Repetir Voz</span>'
      +     '</button>'
      +   '</div>'
      +   '<div class="text-center max-w-lg mx-auto space-y-1.5">'
      +     '<span class="inline-block bg-amber-100 text-amber-900 text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">Cuidado del Ruido Ambiente e Indicaciones</span>'
      +     '<h3 class="text-lg sm:text-xl font-black text-slate-900">Prepara un Espacio Tranquilo para tu Voz</h3>'
      +     '<p class="text-xs text-slate-600 leading-relaxed font-medium">Para que Robot Leo escuche tus respuestas con claridad, sigue estas recomendaciones:</p>'
      +   '</div>'
      +   '<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">'
      +     '<div class="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1"><div class="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center mb-1"><i data-lucide="home" class="w-4 h-4 text-blue-700"></i></div><h5 class="text-xs font-black text-slate-900">1. Lugar Tranquilo</h5><p class="text-xs text-slate-500">Sin conversaciones ni ruidos fuertes alrededor.</p></div>'
      +     '<div class="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1"><div class="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center mb-1"><i data-lucide="tv" class="w-4 h-4 text-amber-800"></i></div><h5 class="text-xs font-black text-slate-900">2. Apagar Sonidos</h5><p class="text-xs text-slate-500">Sin música ni televisión encendida de fondo.</p></div>'
      +     '<div class="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1"><div class="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center mb-1"><i data-lucide="mic" class="w-4 h-4 text-emerald-800"></i></div><h5 class="text-xs font-black text-slate-900">3. Hablar Claro</h5><p class="text-xs text-slate-500">Responde con voz firme y clara hacia el micrófono.</p></div>'
      +   '</div>'
      +   '<div class="pt-1 flex flex-col sm:flex-row items-center justify-center gap-3">'
      +     '<button onclick="app.acceptNoiseDisclaimer()" class="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2.5 cursor-pointer">'
      +       '<i data-lucide="arrow-right" class="w-4 h-4 text-white"></i>'
      +       '<span>Presiona ESPACIO nuevamente para Iniciar Actividad</span>'
      +     '</button>'
      +     '<button onclick="app.closeVoiceModal()" class="w-full sm:w-auto px-5 py-3 rounded-xl text-slate-500 hover:bg-slate-100 font-bold text-xs transition cursor-pointer">Cancelar</button>'
      +   '</div>'
      + '</div>'

      // 4. PANTALLA PRINCIPAL DE ACTIVIDAD (Soporta las 4 actividades Mineduc)
      + '<div id="counting-activity" class="flex-col overflow-hidden" style="display:' + aStyle + '">'
      + '<div class="bg-amber-50/60 px-5 py-2.5 border-b border-amber-100 flex items-center justify-between text-xs text-amber-950 font-bold flex-shrink-0">'
      +   '<div class="flex items-center gap-2.5"><span id="counting-progress-text">' + progressInfo.label + '</span><div class="w-24 sm:w-36 h-2 rounded-full bg-slate-200 overflow-hidden"><div id="counting-progress-bar" class="h-full bg-emerald-500 rounded-full transition-all duration-500" style="width:' + progressInfo.percent + '%"></div></div></div>'
      +   '<button onclick="app.showNoiseDisclaimer()" class="text-xs text-blue-700 hover:underline flex items-center gap-1 font-semibold cursor-pointer"><i data-lucide="volume-2" class="w-3.5 h-3.5"></i><span>Recomendaciones de Ruido</span></button>'
      + '</div>'
      + '<div class="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 bg-gradient-to-b from-white to-slate-50/60">'
      +   '<div id="activity-dynamic-body" class="space-y-4">'
      +     interactiveBodyHtml
      +   '</div>'
      +   '<div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col gap-3">'
      +     '<div class="flex flex-col sm:flex-row items-center justify-between gap-4">'
      +       '<div class="flex items-center gap-3"><div id="voice-mic-icon-box" class="w-11 h-11 rounded-xl ' + (isCompletedNow ? 'bg-emerald-500' : 'bg-amber-400') + ' flex items-center justify-center shadow-xs flex-shrink-0"><i data-lucide="' + (isCompletedNow ? 'award' : 'mic') + '" class="w-5 h-5 ' + (isCompletedNow ? 'text-white' : 'text-slate-950') + '"></i></div>'
      +       '<div><h4 id="voice-action-title" class="font-extrabold text-slate-900 text-sm">' + actionBoxTitle + '</h4><p id="voice-action-subtitle" class="text-xs text-slate-500">Pulsa <kbd class="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-300 font-bold text-[11px]">Espacio</kbd> o el botón para hablar</p></div></div>'
      +       '<button id="voice-record-btn" onclick="app.handleMainActivityAction()" class="w-full sm:w-auto px-6 py-3.5 rounded-xl ' + (isCompletedNow ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-amber-400 hover:bg-amber-300 text-slate-950') + ' active:scale-98 font-black text-xs sm:text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"><i data-lucide="' + (isCompletedNow ? 'check-circle' : 'mic') + '" class="w-4 h-4"></i><span id="voice-record-text">' + recordBtnLabel + '</span></button>'
      +     '</div>'
      +     '<div id="voice-transcription-result" class="hidden p-3.5 rounded-xl border transition-all text-xs"></div>'
      +   '</div>'
      + '</div>'
      + '<div class="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">'
      +   '<button onclick="app.resetCurrentActivityProgress()" class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/70 transition flex items-center gap-1.5 cursor-pointer"><i data-lucide="rotate-ccw" class="w-3.5 h-3.5 text-slate-500"></i><span>Reiniciar Actividad</span></button>'
      +   '<button id="voice-finish-btn" onclick="app.completeAndCloseVoiceModal()" class="px-5 py-2.5 rounded-xl text-xs font-black theme-primary-bg text-white shadow-sm hover:opacity-95 transition flex items-center gap-2 cursor-pointer"><span id="voice-finish-text">' + (isCompletedNow ? 'Cerrar Actividad (Espacio)' : 'Guardar y Salir') + '</span><i data-lucide="check" class="w-4 h-4"></i></button>'
      + '</div>'
      + '</div>'
      + '</div>'
      + '</div>';
  }
};

window.components = components;
