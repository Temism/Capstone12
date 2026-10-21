// Main Application Controller & Layout Router
const app = {
  currentView: 'actividades', // Iniciar en actividades para que vean de inmediato el contexto infantil
  currentTheme: 'navy',
  currentLayout: 'sidebar', // 'sidebar' (Nueva v2) | 'bento' (Nueva v3) | 'topbar' (v1 clásica)
  isVoiceModalOpen: false,
  voiceModalContextTitle: 'El Bosque de los Números: Sumas con Frutas hasta el 10',

  init() {
    // Check URL hash for direct view navigation e.g. #alertas or #actividades
    const hash = window.location.hash.replace('#', '');
    if (['reporteria', 'alertas', 'actividades', 'asignar', 'mensajeria'].includes(hash)) {
      this.currentView = hash;
    }

    // Apply default theme to body/root
    document.documentElement.setAttribute('data-theme', this.currentTheme);

    // Initial render
    this.render();
  },

  setTheme(themeId) {
    this.currentTheme = themeId;
    document.documentElement.setAttribute('data-theme', themeId);
    this.render();
  },

  setLayout(layoutId) {
    this.currentLayout = layoutId;
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  setView(viewId) {
    this.currentView = viewId;
    window.location.hash = viewId;
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  openVoiceModal(activityTitle = 'El Bosque de los Números: Sumas con Frutas hasta el 10') {
    this.voiceModalContextTitle = activityTitle;
    this.isVoiceModalOpen = true;
    this.renderModalContainer();
  },

  closeVoiceModal() {
    this.isVoiceModalOpen = false;
    this.renderModalContainer();
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

  renderCurrentView() {
    this.render();
  },

  render() {
    const appRoot = document.getElementById('app-root');
    if (!appRoot) return;

    // 1. Obtener HTML de la vista activa
    const viewHtml = this.getViewHtml();

    // 2. Renderizar a través del Motor de Layouts seleccionado
    if (this.currentLayout === 'sidebar') {
      appRoot.innerHTML = layouts.renderSidebar(this.currentView, this.currentTheme, this.currentLayout, viewHtml);
    } else if (this.currentLayout === 'bento') {
      appRoot.innerHTML = layouts.renderBento(this.currentView, this.currentTheme, this.currentLayout, viewHtml);
    } else {
      appRoot.innerHTML = layouts.renderTopbar(this.currentView, this.currentTheme, this.currentLayout, viewHtml);
    }

    // 3. Inicializar gráficos si corresponde a Reportería
    if (this.currentView === 'reporteria') {
      reporteriaView.initCharts();
    }

    // 4. Renderizar botón flotante de Robot Leo (en topbar o según layout)
    const floatingContainer = document.getElementById('floating-voice-container');
    if (floatingContainer) {
      if (this.currentLayout === 'topbar') {
        floatingContainer.innerHTML = components.renderVoiceAIFloatingButton();
      } else {
        floatingContainer.innerHTML = ''; // Los layouts 2 y 3 tienen su propio acceso nativo a Robot Leo
      }
    }

    // 5. Renderizar modal si está abierto
    this.renderModalContainer();

    // 6. Refrescar íconos de Lucide en todo el DOM
    lucide.createIcons();
  }
};

// Start app when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
