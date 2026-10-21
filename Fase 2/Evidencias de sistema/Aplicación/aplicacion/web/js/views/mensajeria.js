// View 5: Mensajería Institucional Conectada a la API REST y MySQL
// Soporta múltiples canales, historial en tiempo real y sincronización bidireccional.
const mensajeriaView = {
  conversations: [],
  activeConversationId: 1,
  messages: [],
  hasLoaded: false,
  currentUserId: null,
  isLoadingMessages: false,

  // Inicializar y cargar datos desde la API
  async initData() {
    const userId = (app.currentUser && app.currentUser.id) ? app.currentUser.id : 13;
    this.currentUserId = userId;

    if (window.api && api.isOnline) {
      try {
        const convs = await api.getConversations(userId);
        if (Array.isArray(convs) && convs.length > 0) {
          this.conversations = convs;
          // Si no hay conversación activa válida, seleccionar la primera
          if (!this.conversations.find(c => c.id === this.activeConversationId)) {
            this.activeConversationId = this.conversations[0].id;
          }
          await this.loadMessages(this.activeConversationId);
          this.hasLoaded = true;
          return;
        }
      } catch (err) {
        console.warn("[Mensajería] Error cargando conversaciones de la API:", err);
      }
    }

    // Fallback local si el backend no está disponible
    this.conversations = mockData.chatChannels.map(ch => ({
      id: ch.id === "ch-2" ? 1 : (ch.id === "ch-1" ? 2 : 3),
      asunto: ch.name,
      otro_participante: ch.name,
      otro_rol: ch.type === "Directo" ? "PROFESOR" : "ADMINISTRADOR",
      ultimo_mensaje: ch.lastMsg,
      ultima_hora: ch.lastTime,
      no_leidos: ch.unread || 0
    }));
    this.messages = mockData.activeMessages;
    this.hasLoaded = true;
  },

  async loadMessages(conversationId) {
    this.isLoadingMessages = true;
    if (window.api && api.isOnline) {
      try {
        const msgs = await api.getMessages(conversationId);
        if (Array.isArray(msgs)) {
          this.messages = msgs;
        }
      } catch (err) {
        console.warn("[Mensajería] Error cargando mensajes:", err);
      }
    }
    this.isLoadingMessages = false;
  },

  async selectConversation(conversationId) {
    this.activeConversationId = Number(conversationId);
    await this.loadMessages(this.activeConversationId);
    app.renderCurrentView();
    this.scrollToBottom();
  },

  async handleSendMessage(e) {
    e.preventDefault();
    const input = document.getElementById('chat-text-input');
    if (!input || !input.value.trim()) return;

    const text = input.value.trim();
    input.value = '';

    const senderId = (app.currentUser && app.currentUser.id) ? app.currentUser.id : 13;
    const convId = this.activeConversationId || 1;

    if (window.api && api.isOnline) {
      try {
        // Enviar a la API REST de FastAPI (guarda en MySQL)
        await api.sendMessage(convId, senderId, text);
        // Recargar mensajes actualizados desde MySQL
        await this.loadMessages(convId);
        // Actualizar último mensaje en la lista de conversaciones
        const conv = this.conversations.find(c => c.id === convId);
        if (conv) {
          conv.ultimo_mensaje = text;
          conv.ultima_hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
      } catch (err) {
        console.warn("[Mensajería] Error enviando mensaje a la API:", err);
      }
    } else {
      // Fallback local
      this.messages.push({
        id: Date.now(),
        conversacion_id: convId,
        remitente_usuario_id: senderId,
        remitente_nombre: app.currentUser ? app.currentUser.name : "Usuario",
        contenido: text,
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        leido: false,
        isSelf: true
      });
    }

    app.renderCurrentView();
    this.scrollToBottom();
  },

  scrollToBottom() {
    setTimeout(() => {
      const stream = document.getElementById('desktop-chat-stream');
      if (stream) stream.scrollTop = stream.scrollHeight;
    }, 50);
  },

  render() {
    const userId = (app.currentUser && app.currentUser.id) ? app.currentUser.id : 13;

    // Disparar carga de API si no ha cargado o si cambió el usuario activo
    if (!this.hasLoaded || this.currentUserId !== userId) {
      this.initData().then(() => {
        app.renderCurrentView();
        this.scrollToBottom();
      });
    }

    const conversationsList = this.conversations.length > 0 ? this.conversations : [
      {
        id: 1,
        asunto: "Seguimiento pedagógico de Mateo (1° Básico B)",
        otro_participante: "Marcela Soto Valenzuela",
        otro_rol: "PROFESOR",
        ultimo_mensaje: "Cargando mensajes...",
        ultima_hora: "Hoy",
        no_leidos: 0
      }
    ];

    const activeConv = conversationsList.find(c => c.id === this.activeConversationId) || conversationsList[0];
    const messagesList = this.messages;

    return `
      <div class="space-y-6 animate-fadeIn pb-12">
        <!-- Header Banner -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center space-x-4">
            <div class="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
              <i data-lucide="message-square" class="w-6 h-6"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">Canal de Comunicación Oficial</span>
                <span class="text-xs text-slate-400">•</span>
                <span class="text-xs font-bold text-emerald-700">Comunicaciones Activas</span>
              </div>
              <h1 class="text-xl font-bold text-slate-900 mt-0.5">Mensajería Institucional</h1>
              <p class="text-xs text-slate-500">Comunícate de forma directa y trazable entre docentes y familias.</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <div class="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <i data-lucide="message-square" class="w-3.5 h-3.5 text-indigo-600"></i>
              <span>Canal Oficial</span>
            </div>
          </div>
        </div>

        <!-- Ayuda Visual Accesible -->
        <div class="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-900">
          <div class="flex items-center gap-2.5">
            <span class="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
              <i data-lucide="shield-check" class="w-4 h-4 text-white"></i>
            </span>
            <span>
              <strong>Registro Oficial del Colegio:</strong> Todas las comunicaciones quedan respaldadas institucionalmente con fecha y hora.
            </span>
          </div>
          <span class="text-blue-700 font-semibold whitespace-nowrap bg-white px-2.5 py-1 rounded-lg border border-blue-200 self-end sm:self-center">
            Horario: Lun a Vie 08:30 a 17:00
          </span>
        </div>

        <!-- 2 Column Messaging Layout -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[620px]">
          
          <!-- Left Column: Lista de Conversaciones (Canales) -->
          <div class="md:col-span-5 lg:col-span-4 border-r border-slate-200 flex flex-col">
            
            <!-- Barra de Búsqueda -->
            <div class="p-3.5 border-b border-slate-100">
              <div class="relative">
                <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-2.5"></i>
                <input 
                  type="text" 
                  placeholder="Buscar conversación..."
                  class="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
              </div>
            </div>

            <!-- Listado Dinámico de Conversaciones -->
            <div class="divide-y divide-slate-100 overflow-y-auto flex-1">
              ${conversationsList.map(ch => {
                const isActive = ch.id === this.activeConversationId;
                const interlocutor = ch.otro_participante || ch.asunto;
                const rolLabel = (ch.otro_rol || '').includes('PROF') ? 'Profesor Jefe' :
                                 (ch.otro_rol || '').includes('ADMIN') ? 'Dirección' : 'Apoderado';
                const avatarBg = (ch.otro_rol || '').includes('PROF') ? 'bg-emerald-600' :
                                 (ch.otro_rol || '').includes('ADMIN') ? 'bg-purple-600' : 'bg-blue-600';
                const initials = interlocutor.split(' ').map(n => n[0]).slice(0, 2).join('');

                return `
                  <div 
                    onclick="mensajeriaView.selectConversation(${ch.id})"
                    class="p-4 cursor-pointer transition-colors flex items-start space-x-3 ${
                      isActive ? 'bg-blue-50/70 border-l-4 theme-primary-border' : 'hover:bg-slate-50'
                    }"
                  >
                    <div class="w-11 h-11 rounded-xl ${avatarBg} text-white font-bold flex items-center justify-center flex-shrink-0 text-sm shadow-xs">
                      ${initials || 'EC'}
                    </div>

                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between mb-0.5">
                        <h4 class="font-bold text-xs text-slate-900 truncate">${interlocutor}</h4>
                        <span class="text-[10px] text-slate-400 flex-shrink-0">${ch.ultima_hora || 'Hoy'}</span>
                      </div>
                      <p class="text-xs text-slate-500 truncate">${ch.ultimo_mensaje || ch.asunto}</p>
                      <div class="mt-1.5 flex items-center justify-between">
                        <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          rolLabel === 'Profesor Jefe' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          rolLabel === 'Dirección' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                          'bg-blue-50 text-blue-700 border border-blue-200'
                        }">
                          ${rolLabel}
                        </span>
                        ${ch.no_leidos > 0 ? `
                          <span class="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold flex items-center justify-center">
                            ${ch.no_leidos} nuevo
                          </span>
                        ` : ''}
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

          </div>

          <!-- Right Column: Conversación Activa -->
          <div class="md:col-span-7 lg:col-span-8 flex flex-col justify-between bg-slate-50/40">
            
            <!-- Chat Header -->
            <div class="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow">
                  ${(activeConv.otro_participante || activeConv.asunto || 'EC').split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <h3 class="font-bold text-slate-900 text-sm">${activeConv.otro_participante || activeConv.asunto}</h3>
                  <div class="flex items-center gap-2 text-xs text-slate-500">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                    <span class="text-emerald-700 font-semibold">${activeConv.asunto}</span>
                    <span class="text-slate-300">•</span>
                    <span>En línea</span>
                  </div>
                </div>
              </div>

              <div class="flex items-center space-x-2 text-slate-400">
                <button 
                  onclick="mensajeriaView.selectConversation(${activeConv.id})"
                  class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition flex items-center gap-1"
                  title="Actualizar mensajes"
                >
                  <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
                  <span class="hidden sm:inline">Actualizar</span>
                </button>
              </div>
            </div>

            <!-- Messages Stream Area -->
            <div id="desktop-chat-stream" class="p-5 space-y-4 overflow-y-auto flex-1 max-h-[460px]">
              
              <!-- Separador de fecha -->
              <div class="text-center">
                <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-xs">
                  Registro Oficial de Conversación
                </span>
              </div>

              ${messagesList.length === 0 ? `
                <div class="text-center py-12 text-slate-400 text-xs">
                  <i data-lucide="message-square" class="w-8 h-8 mx-auto mb-2 opacity-40"></i>
                  <p>No hay mensajes en esta conversación todavía.</p>
                  <p class="text-[11px] mt-1">Escribe abajo para iniciar el diálogo.</p>
                </div>
              ` : messagesList.map(msg => {
                // Determinar si el mensaje es del usuario actual
                const isSelf = msg.remitente_usuario_id === userId || msg.isSelf === true;
                const senderName = msg.remitente_nombre || msg.sender || (isSelf ? 'Tú' : 'Docente');
                const timeText = msg.hora || msg.time || 'Ahora';
                const textContent = msg.contenido || msg.text || '';

                return `
                  <div class="flex flex-col ${isSelf ? 'items-end' : 'items-start'}">
                    <div class="flex items-baseline gap-2 mb-1">
                      <span class="text-xs font-bold text-slate-800">${senderName}</span>
                      <span class="text-[10px] text-slate-400">${timeText}</span>
                    </div>

                    <div class="max-w-md p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                      isSelf 
                        ? 'theme-primary-bg text-white rounded-br-none' 
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                    }">
                      ${textContent}
                    </div>

                    <div class="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                      <i data-lucide="check-check" class="w-3.5 h-3.5"></i>
                      <span>Entregado</span>
                    </div>
                  </div>
                `;
              }).join('')}

            </div>

            <!-- Message Input Composer -->
            <div class="p-4 bg-white border-t border-slate-200">
              <form onsubmit="mensajeriaView.handleSendMessage(event)" class="flex items-center gap-2">
                <button 
                  type="button" 
                  onclick="alert('El repositorio de justificativos médicos y archivos adjuntos está disponible para el canal de la profesora jefe.')" 
                  class="p-3 rounded-xl hover:bg-slate-100 text-slate-500 transition border border-slate-200" 
                  title="Adjuntar justificativo o documento"
                >
                  <i data-lucide="paperclip" class="w-5 h-5"></i>
                </button>
                
                <input 
                  type="text" 
                  id="chat-text-input"
                  required
                  placeholder="Escribe un mensaje..."
                  class="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >

                <button 
                  type="submit" 
                  class="px-5 py-3 rounded-xl text-xs sm:text-sm font-bold theme-primary-bg text-white shadow hover:opacity-95 transition flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <span>Enviar</span>
                  <i data-lucide="send" class="w-4 h-4"></i>
                </button>
              </form>
            </div>

          </div>

        </div>
      </div>
    `;
  }
};
