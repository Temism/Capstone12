// View 5: Mensajería (Actor: Apoderado / Profesor)
// Diseñado con la familiaridad de WhatsApp para que cualquier apoderado (sin importar su edad o nivel técnico) sepa usarlo de inmediato.
const mensajeriaView = {
  activeChannelId: "ch-2",

  render() {
    const channels = mockData.chatChannels;
    const messages = mockData.activeMessages;
    const activeChannel = channels.find(c => c.id === this.activeChannelId) || channels[1];

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
                <span class="text-xs text-slate-500">Apoderado ↔ Colegio</span>
              </div>
              <h1 class="text-xl font-bold text-slate-900 mt-0.5">Mensajería con Profesores</h1>
              <p class="text-xs text-slate-500">Comunícate de forma directa y segura con los docentes de tu pupilo</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="alert('Iniciando nueva conversación...')" class="px-4 py-2 rounded-xl text-xs font-bold theme-primary-bg text-white shadow hover:opacity-95 transition flex items-center gap-1.5">
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>Nuevo Mensaje</span>
            </button>
          </div>
        </div>

        <!-- AYUDA VISUAL ACCESIBLE (Orientada a apoderados con poca experiencia digital) -->
        <div class="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-900">
          <div class="flex items-center gap-2.5">
            <span class="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
              💬
            </span>
            <span>
              <strong>Canal Oficial de Mensajería:</strong> Puedes escribirle tus consultas directamente al profesor y adjuntar justificativos médicos o fotos de certificados.
            </span>
          </div>
          <span class="text-blue-700 font-semibold whitespace-nowrap bg-white px-2.5 py-1 rounded-lg border border-blue-200 self-end sm:self-center">
            Horario: Lun a Vie 08:30 a 17:00
          </span>
        </div>

        <!-- 2 Column Messaging Layout -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[600px]">
          
          <!-- Left Column (4 cols): Channel & Chat List -->
          <div class="md:col-span-5 lg:col-span-4 border-r border-slate-200 flex flex-col">
            
            <!-- Search bar -->
            <div class="p-3.5 border-b border-slate-100">
              <div class="relative">
                <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-2.5"></i>
                <input 
                  type="text" 
                  placeholder="Buscar profesor o curso..."
                  class="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
              </div>
            </div>

            <!-- Conversations List -->
            <div class="divide-y divide-slate-100 overflow-y-auto flex-1">
              ${channels.map(ch => {
                const isActive = ch.id === this.activeChannelId;
                return `
                  <div 
                    onclick="mensajeriaView.selectChannel('${ch.id}')"
                    class="p-4 cursor-pointer transition-colors flex items-start space-x-3 ${isActive ? 'bg-blue-50/70 border-l-4 theme-primary-border' : 'hover:bg-slate-50'}"
                  >
                    <div class="w-11 h-11 rounded-xl ${ch.avatarBg} text-white font-bold flex items-center justify-center flex-shrink-0 text-sm shadow-xs">
                      ${ch.initials}
                    </div>

                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between mb-0.5">
                        <h4 class="font-bold text-xs text-slate-900 truncate">${ch.name}</h4>
                        <span class="text-[10px] text-slate-400 flex-shrink-0">${ch.lastTime}</span>
                      </div>
                      <p class="text-xs text-slate-500 truncate">${ch.lastMsg}</p>
                      <div class="mt-1.5 flex items-center justify-between">
                        <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          ch.type === 'Canal' ? 'bg-slate-100 text-slate-600' :
                          ch.type === 'Directo' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-purple-50 text-purple-700'
                        }">
                          ${ch.type === 'Directo' ? 'Profesor Jefe' : ch.type}
                        </span>
                        ${ch.unread > 0 ? `
                          <span class="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold flex items-center justify-center animate-pulse">
                            1 nuevo
                          </span>
                        ` : ''}
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

          </div>

          <!-- Right Column (7-8 cols): Active Chat Conversation -->
          <div class="md:col-span-7 lg:col-span-8 flex flex-col justify-between bg-slate-50/40">
            
            <!-- Chat Header -->
            <div class="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 rounded-xl ${activeChannel.avatarBg} text-white font-bold flex items-center justify-center text-sm shadow">
                  ${activeChannel.initials}
                </div>
                <div>
                  <h3 class="font-bold text-slate-900 text-sm">${activeChannel.name}</h3>
                  <div class="flex items-center gap-2 text-xs text-slate-500">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                    <span class="text-emerald-700 font-semibold">Profesor conectado</span>
                    <span class="text-slate-300">•</span>
                    <span>Responde en el día</span>
                  </div>
                </div>
              </div>

              <div class="flex items-center space-x-2 text-slate-400">
                <button onclick="alert('Abriendo certificados y justificaciones médicas compartidas...')" class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition flex items-center gap-1" title="Ver archivos compartidos">
                  <i data-lucide="paperclip" class="w-3.5 h-3.5"></i>
                  <span class="hidden sm:inline">Archivos</span>
                </button>
              </div>
            </div>

            <!-- Messages Stream Area -->
            <div class="p-5 space-y-4 overflow-y-auto flex-1">
              
              <!-- Date separator -->
              <div class="text-center">
                <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200">
                  Ayer
                </span>
              </div>

              ${messages.map(msg => `
                <div class="flex flex-col ${msg.isSelf ? 'items-end' : 'items-start'}">
                  <div class="flex items-baseline gap-2 mb-1">
                    <span class="text-xs font-bold text-slate-800">${msg.sender}</span>
                    <span class="text-[10px] text-slate-400">${msg.time}</span>
                  </div>

                  <div class="max-w-md p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                    msg.isSelf 
                      ? 'theme-primary-bg text-white rounded-br-none' 
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                  }">
                    ${msg.text}
                  </div>

                  ${msg.readStatus ? `
                    <div class="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                      <i data-lucide="check-check" class="w-3.5 h-3.5"></i>
                      <span>${msg.readStatus}</span>
                    </div>
                  ` : ''}
                </div>
              `).join('')}

            </div>

            <!-- Message Input Composer (Texto y adjuntos) -->
            <div class="p-4 bg-white border-t border-slate-200">
              <form onsubmit="event.preventDefault(); alert('Mensaje enviado al profesor.');" class="flex items-center gap-2">
                <button type="button" class="p-3 rounded-xl hover:bg-slate-100 text-slate-500 transition border border-slate-200" title="Adjuntar certificado o foto">
                  <i data-lucide="paperclip" class="w-5 h-5"></i>
                </button>
                
                <input 
                  type="text" 
                  placeholder="Escribe un mensaje aquí para el profesor..."
                  class="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >

                <button 
                  type="submit" 
                  class="px-5 py-3 rounded-xl text-xs sm:text-sm font-bold theme-primary-bg text-white shadow hover:opacity-95 transition flex items-center gap-2"
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
  },

  selectChannel(channelId) {
    this.activeChannelId = channelId;
    app.renderCurrentView();
  }
};
