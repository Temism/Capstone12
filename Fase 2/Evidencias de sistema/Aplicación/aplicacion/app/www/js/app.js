// Controlador Móvil EduConnect (Alumno, Profesor y Apoderado)
// Implementa [REQ-01] a [REQ-07]: Conectividad LAN, Rol Alumno, Avatar Robot Leo Central (60-65%),
// Cero Texto / Números 28pt-36pt+, y Botón Semicircular Inferior 100% por Voz.

const app = {
  currentUser: null,
  currentTab: 'mensajeria', // 'mensajeria' | 'alertas' | 'dashboard' | 'config' | 'actividades_alumno'
  currentRoleKey: 'apoderado', // 'alumno' | 'apoderado' | 'profesora'
  selectedPupilIndex: 0, // 0: Mateo (1° Básico), 1: Sofía (2° Básico)
  errorMessage: '',
  showServerModal: false,
  showPhotoModal: false,
  photoModalError: '',
  photoModalStatus: '',
  isMobileAssignModalOpen: false,
  mobileModalSelectedCodes: [],
  mobileAssignModalError: '',
  isMobileAssigning: false,
  reporteriaData: null,
  isLoadingReporteria: false,

  // [REQ-01] Estado de Prueba de Conexión LAN
  testServerConnectionMessage: '',
  testServerConnectionStatus: '', // 'success' | 'error' | 'testing' | ''
  isTestingConnection: false,

  // [REQ-02] Estado del Rol Alumno y Bandeja de Actividades
  studentActivitiesList: [],
  activeChildActivity: null, // Objeto de actividad activa cuando el niño está jugando
  currentExerciseIndex: 0,
  completedExercises: [],
  isActivityCompletedCelebration: false,
  studentActivityFilter: 'all', // 'all' | 'mat' | 'len'

  // [REQ-03 / REQ-05] Estado Interactivo del Avatar Robot Leo y Reconocimiento de Voz (STT)
  robotState: 'guiding', // 'speaking' | 'listening' | 'celebrating' | 'guiding'
  isRecordingVoice: false,
  lastSpokenTranscript: '',
  _recognition: null,
  _onManualVoiceStop: null,
  _androidSttSilenceTimer: null,
  _mediaRecorder: null,
  _audioChunks: [],
  _silenceTimer: null,
  _recordingFallbackTimer: null,

  // Estado de Mensajería
  chatMode: 'grupal', // 'grupal' | 'individual'
  activeConversacionId: 1,
  mensajesPorConversacion: {},
  isSendingMobileMsg: false,
  mobileComSuccessMsg: '',
  _pollTimer: null,

  // Estado de Alertas
  filterAlertas: 'todas',
  alertasLocales: [],
  acuseStatus: {},
  isSendingMobileAlert: false,
  mobileAlertSuccessMsg: '',

  // Nómina de apoderados del curso (Tablero del Profesor)
  apoderadosCurso: [
    { id: 13, apoderado: 'Carolina Tapia', alumno: 'Mateo González', rut: '19.452.120-K', confirmado: false, fechaAcuse: 'Sin alertas activas' },
    { id: 4, apoderado: 'Daniela Soto', alumno: 'Benjamín Soto', rut: '18.992.301-4', confirmado: false, fechaAcuse: 'Sin alertas activas' },
    { id: 5, apoderado: 'Rodrigo Fuentes', alumno: 'Martina Fuentes', rut: '20.104.887-2', confirmado: false, fechaAcuse: 'Sin alertas activas' },
    { id: 6, apoderado: 'Javiera Contreras', alumno: 'Vicente Contreras', rut: '19.821.554-9', confirmado: false, fechaAcuse: 'Sin alertas activas' },
    { id: 7, apoderado: 'Gonzalo Morales', alumno: 'Ignacio Morales', rut: '19.330.114-1', confirmado: false, fechaAcuse: 'Sin alertas activas' }
  ],

  comunicadosGrupales: [],

  async init() {
    this.restoreSession();
    this.initDefaultAlertas();
    this.initStudentActivitiesCatalog();
    this.render();

    if (window.mobileApi) {
      const h = await mobileApi.checkHealth();
      if (h && h.success) {
        this.testServerConnectionStatus = 'success';
        this.testServerConnectionMessage = `Conectado con éxito al servidor (${h.host || mobileApi.getServerHostUrl()})`;
      }
      this.render();
      mobileApi.syncOfflineQueues();
    }

    if (this.currentUser) {
      this.cargarDatosUsuario().catch(() => {});
    }
    this.startPolling();
  },

  getDefaultAvatarUrl(userOrRole) {
    if (userOrRole && typeof userOrRole === 'object') {
      if (userOrRole.defaultAvatar) return userOrRole.defaultAvatar;
      if (window.firebaseDb && typeof window.firebaseDb.getDefaultAvatarForUser === 'function') {
        return window.firebaseDb.getDefaultAvatarForUser(userOrRole.id || userOrRole.role);
      }
    }
    if (window.firebaseDb && typeof window.firebaseDb.getDefaultAvatarForUser === 'function') {
      return window.firebaseDb.getDefaultAvatarForUser(userOrRole);
    }
    return 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80';
  },

  getUserAvatarUrl(user) {
    if (!user) return this.getDefaultAvatarUrl('apoderado');
    const custom = (user.id && window.firebaseDb && typeof window.firebaseDb.getCustomAvatar === 'function')
      ? window.firebaseDb.getCustomAvatar(user.id)
      : null;
    return custom || user.avatar || this.getDefaultAvatarUrl(user);
  },

  canEditProfilePhoto() {
    return Boolean(this.currentUser && ['apoderado', 'profesora', 'admin'].includes(this.currentUser.role));
  },

  openMobilePhotoModal() {
    if (!this.canEditProfilePhoto()) return;
    this.photoModalError = '';
    this.photoModalStatus = '';
    this.showPhotoModal = true;
    this.render();
  },

  closeMobilePhotoModal() {
    this.showPhotoModal = false;
    this.photoModalError = '';
    this.photoModalStatus = '';
    this.render();
  },

  compressMobileImageFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('No se pudo leer la imagen seleccionada.'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('El archivo no es una imagen válida.'));
        img.onload = () => {
          const maxSize = 220;
          let width = img.width || maxSize;
          let height = img.height || maxSize;
          if (width > height && width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('No se pudo procesar la imagen.'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          let out = canvas.toDataURL('image/jpeg', 0.78);
          if (out.length > 140000) {
            out = canvas.toDataURL('image/jpeg', 0.58);
          }
          resolve(out);
        };
        img.src = String(reader.result || '');
      };
      reader.readAsDataURL(file);
    });
  },

  async applyMobileCustomAvatar(newAvatarUrlOrNull) {
    if (!this.canEditProfilePhoto()) return;
    this.photoModalError = '';
    this.photoModalStatus = 'Guardando foto de perfil...';
    this.render();

    const defaultUrl = this.getDefaultAvatarUrl(this.currentUser);
    const resolved = newAvatarUrlOrNull || defaultUrl;

    if (window.firebaseDb && typeof window.firebaseDb.saveCustomAvatar === 'function') {
      await window.firebaseDb.saveCustomAvatar(this.currentUser.id, newAvatarUrlOrNull || null);
    }

    this.currentUser = {
      ...this.currentUser,
      defaultAvatar: defaultUrl,
      avatar: resolved
    };

    try {
      sessionStorage.setItem('educonnect_session_user', JSON.stringify(this.currentUser));
      localStorage.setItem('educonnect_session_user', JSON.stringify(this.currentUser));
    } catch (e) {}

    this.photoModalStatus = newAvatarUrlOrNull ? '¡Foto actualizada correctamente!' : 'Foto por defecto restaurada.';
    setTimeout(() => {
      if (this.showPhotoModal) {
        this.showPhotoModal = false;
        this.photoModalStatus = '';
        this.render();
      }
    }, 650);
    this.render();
  },

  async handleMobilePhotoFile(inputEl) {
    const file = inputEl && inputEl.files && inputEl.files[0];
    if (!file) return;
    if (!String(file.type || '').startsWith('image/')) {
      this.photoModalError = 'Selecciona un archivo de imagen válido (JPG, PNG o WebP).';
      this.render();
      return;
    }
    try {
      const dataUrl = await this.compressMobileImageFile(file);
      if (dataUrl.length > 148000) {
        this.photoModalError = 'La imagen es demasiado pesada. Elige una foto más liviana.';
        this.render();
        return;
      }
      await this.applyMobileCustomAvatar(dataUrl);
    } catch (err) {
      this.photoModalError = (err && err.message) ? err.message : 'No se pudo procesar la foto seleccionada.';
      this.render();
    }
  },

  async saveMobilePhotoUrl() {
    const input = document.getElementById('mobile-photo-url-input');
    const url = input ? input.value.trim() : '';
    if (!url) {
      this.photoModalError = 'Ingresa una URL válida de imagen (https://...).';
      this.render();
      return;
    }
    if (!/^https?:\/\//i.test(url) && !/^data:image\//i.test(url)) {
      this.photoModalError = 'La URL debe comenzar con https:// o http://.';
      this.render();
      return;
    }
    if (/[<>"'\s]/.test(url)) {
      this.photoModalError = 'La URL contiene caracteres no válidos.';
      this.render();
      return;
    }
    if (url.length > 148000) {
      this.photoModalError = 'La URL excede el tamaño máximo permitido.';
      this.render();
      return;
    }
    await this.applyMobileCustomAvatar(url);
  },

  async restoreDefaultMobilePhoto() {
    await this.applyMobileCustomAvatar(null);
  },

  restoreSession() {
    try {
      const saved = sessionStorage.getItem('educonnect_session_user') || localStorage.getItem('educonnect_session_user');
      if (saved) {
        const u = JSON.parse(saved);
        if (u && u.role) {
          if (u.role === 'alumno' && (u.id === 14 || (u.name && u.name.includes('Naomi')))) {
            u.name = 'Mateo González Tapia';
          }
          u.defaultAvatar = u.defaultAvatar || this.getDefaultAvatarUrl(u);
          u.avatar = this.getUserAvatarUrl(u);
          sessionStorage.setItem('educonnect_session_user', JSON.stringify(u));
          this.currentUser = u;
          this.currentRoleKey = u.role;
          if (u.role === 'alumno') {
            this.currentTab = 'actividades_alumno';
          } else if (this.currentTab === 'asignar' && u.role !== 'profesora' && u.role !== 'admin') {
            this.currentTab = 'mensajeria';
          }
        }
      }
    } catch (e) {}
  },

  // Catálogo pedagógico enriquecido para que cada actividad del alumno tenga 5 ejercicios visuales y auditivos
  initStudentActivitiesCatalog() {
    const baseActivities = (window.mockData && Array.isArray(mockData.studentActivities)) ? mockData.studentActivities : [];
    this.studentActivitiesList = [
      {
        id: 'act-conteo',
        actividad_id: 7,
        subject: 'Matemáticas',
        oaCode: 'MA01 OA 01',
        oaSummary: 'Contar números del 1 al 10 de 1 en 1 en orden secuencial diciendo cada número que aparece en pantalla.',
        activityType: 'counting',
        title: 'Misión Conteo Mágico: Cuenta del 1 al 10 con Robot Leo',
        status: 'Pendiente',
        exercises: [
          {
            number: 1,
            displayBigNumber: '1',
            targetNumber: 1,
            speechPrompt: '¡Hola! Soy Robot Leo. Vamos a contar del uno al diez.',
            repeatPrompt: '¡Hola! Soy Robot Leo. Vamos a contar del uno al diez.',
            hintSpeech: 'Presiona el botón del micrófono y cuenta en voz alta: uno, dos, tres, cuatro, cinco, seis, siete, ocho, nueve, diez. Debes decirlos en orden secuencial para encender las estrellas.',
            successSpeech: 'Uno',
            keywords: ['1', 'uno', 'un', 'una']
          },
          {
            number: 2,
            displayBigNumber: '2',
            targetNumber: 2,
            speechPrompt: 'Dos',
            repeatPrompt: 'Dos',
            hintSpeech: 'Presiona el botón del micrófono y cuenta en voz alta: uno, dos, tres, cuatro, cinco, seis, siete, ocho, nueve, diez. Debes decirlos en orden secuencial para encender las estrellas.',
            successSpeech: 'Dos',
            keywords: ['2', 'dos']
          },
          {
            number: 3,
            displayBigNumber: '3',
            targetNumber: 3,
            speechPrompt: 'Tres',
            repeatPrompt: 'Tres',
            hintSpeech: 'Presiona el botón del micrófono y cuenta en voz alta: uno, dos, tres, cuatro, cinco, seis, siete, ocho, nueve, diez. Debes decirlos en orden secuencial para encender las estrellas.',
            successSpeech: 'Tres',
            keywords: ['3', 'tres']
          },
          {
            number: 4,
            displayBigNumber: '4',
            targetNumber: 4,
            speechPrompt: 'Cuatro',
            repeatPrompt: 'Cuatro',
            hintSpeech: 'Presiona el botón del micrófono y cuenta en voz alta: uno, dos, tres, cuatro, cinco, seis, siete, ocho, nueve, diez. Debes decirlos en orden secuencial para encender las estrellas.',
            successSpeech: 'Cuatro',
            keywords: ['4', 'cuatro']
          },
          {
            number: 5,
            displayBigNumber: '5',
            targetNumber: 5,
            speechPrompt: 'Cinco',
            repeatPrompt: 'Cinco',
            hintSpeech: 'Presiona el botón del micrófono y cuenta en voz alta: uno, dos, tres, cuatro, cinco, seis, siete, ocho, nueve, diez. Debes decirlos en orden secuencial para encender las estrellas.',
            successSpeech: 'Cinco',
            keywords: ['5', 'cinco']
          },
          {
            number: 6,
            displayBigNumber: '6',
            targetNumber: 6,
            speechPrompt: 'Seis',
            repeatPrompt: 'Seis',
            hintSpeech: 'Presiona el botón del micrófono y cuenta en voz alta: uno, dos, tres, cuatro, cinco, seis, siete, ocho, nueve, diez. Debes decirlos en orden secuencial para encender las estrellas.',
            successSpeech: 'Seis',
            keywords: ['6', 'seis']
          },
          {
            number: 7,
            displayBigNumber: '7',
            targetNumber: 7,
            speechPrompt: 'Siete',
            repeatPrompt: 'Siete',
            hintSpeech: 'Presiona el botón del micrófono y cuenta en voz alta: uno, dos, tres, cuatro, cinco, seis, siete, ocho, nueve, diez. Debes decirlos en orden secuencial para encender las estrellas.',
            successSpeech: 'Siete',
            keywords: ['7', 'siete']
          },
          {
            number: 8,
            displayBigNumber: '8',
            targetNumber: 8,
            speechPrompt: 'Ocho',
            repeatPrompt: 'Ocho',
            hintSpeech: 'Presiona el botón del micrófono y cuenta en voz alta: uno, dos, tres, cuatro, cinco, seis, siete, ocho, nueve, diez. Debes decirlos en orden secuencial para encender las estrellas.',
            successSpeech: 'Ocho',
            keywords: ['8', 'ocho']
          },
          {
            number: 9,
            displayBigNumber: '9',
            targetNumber: 9,
            speechPrompt: 'Nueve',
            repeatPrompt: 'Nueve',
            hintSpeech: 'Presiona el botón del micrófono y cuenta en voz alta: uno, dos, tres, cuatro, cinco, seis, siete, ocho, nueve, diez. Debes decirlos en orden secuencial para encender las estrellas.',
            successSpeech: 'Nueve',
            keywords: ['9', 'nueve']
          },
          {
            number: 10,
            displayBigNumber: '10',
            targetNumber: 10,
            speechPrompt: 'Diez',
            repeatPrompt: 'Diez',
            hintSpeech: 'Presiona el botón del micrófono y cuenta en voz alta: uno, dos, tres, cuatro, cinco, seis, siete, ocho, nueve, diez. Debes decirlos en orden secuencial para encender las estrellas.',
            successSpeech: '¡Extraordinario! Dijiste todos los números en su orden exacto. ¡Has ganado las 10 estrellas doradas!',
            keywords: ['10', 'diez']
          }
        ]
      },
      {
        id: 'act-mat-2',
        actividad_id: 4,
        subject: 'Matemáticas',
        oaCode: 'MA01 OA 09',
        oaSummary: 'Demostrar que comprenden la adición y la sustracción de números del 0 al 20 progresivamente.',
        activityType: 'addition',
        title: 'El Bosque de los Números: Sumas hasta el 10 con Voz',
        status: 'Pendiente',
        exercises: [
          {
            number: 1,
            displayBigNumber: '2 + 1',
            targetNumber: 3,
            leftCount: 2,
            rightCount: 1,
            itemType: 'apple',
            speechPrompt: 'Problema número uno: En una rama hay dos manzanas, y luego aparece una manzana más. Si las juntamos, ¿cuántas manzanas hay en total? Dilo con tu voz.',
            repeatPrompt: 'Problema número uno: En una rama hay dos manzanas, y luego aparece una manzana más. Si las juntamos, ¿cuántas manzanas hay en total? Dilo con tu voz.',
            hintSpeech: 'No escuchamos un número claro. Cuenta los dibujos en pantalla y di el resultado en voz alta.',
            successSpeech: 'Tres',
            keywords: ['3', 'tres']
          },
          {
            number: 2,
            displayBigNumber: '3 + 2',
            targetNumber: 5,
            leftCount: 3,
            rightCount: 2,
            itemType: 'star',
            speechPrompt: '¡Muy bien! El resultado es tres. Ahora: Problema número dos: En el cielo brillan tres soles y se unen dos estrellas. ¿Cuántos son tres más dos en total? Responde en voz alta.',
            repeatPrompt: '¡Muy bien! El resultado es tres. Ahora: Problema número dos: En el cielo brillan tres soles y se unen dos estrellas. ¿Cuántos son tres más dos en total? Responde en voz alta.',
            hintSpeech: 'No escuchamos un número claro. Cuenta los dibujos en pantalla y di el resultado en voz alta.',
            successSpeech: 'Cinco',
            keywords: ['5', 'cinco']
          },
          {
            number: 3,
            displayBigNumber: '4 + 3',
            targetNumber: 7,
            leftCount: 4,
            rightCount: 3,
            itemType: 'balloon',
            speechPrompt: '¡Muy bien! El resultado es cinco. Ahora: Problema número tres: En la laguna nadan cuatro pececitos y llegan tres pececitos más. ¿Cuánto es cuatro más tres?',
            repeatPrompt: '¡Muy bien! El resultado es cinco. Ahora: Problema número tres: En la laguna nadan cuatro pececitos y llegan tres pececitos más. ¿Cuánto es cuatro más tres?',
            hintSpeech: 'No escuchamos un número claro. Cuenta los dibujos en pantalla y di el resultado en voz alta.',
            successSpeech: 'Siete',
            keywords: ['7', 'siete']
          },
          {
            number: 4,
            displayBigNumber: '5 + 3',
            targetNumber: 8,
            leftCount: 5,
            rightCount: 3,
            itemType: 'orange',
            speechPrompt: '¡Muy bien! El resultado es siete. Ahora: Problema número cuatro: En el jardín hay cinco flores abiertas y florecen tres flores más. ¿Cuánto es cinco más tres?',
            repeatPrompt: '¡Muy bien! El resultado es siete. Ahora: Problema número cuatro: En el jardín hay cinco flores abiertas y florecen tres flores más. ¿Cuánto es cinco más tres?',
            hintSpeech: 'No escuchamos un número claro. Cuenta los dibujos en pantalla y di el resultado en voz alta.',
            successSpeech: 'Ocho',
            keywords: ['8', 'ocho']
          },
          {
            number: 5,
            displayBigNumber: '6 + 4',
            targetNumber: 10,
            leftCount: 6,
            rightCount: 4,
            itemType: 'gem',
            speechPrompt: '¡Muy bien! El resultado es ocho. Ahora: Último desafío de suma: En la colina hay seis pinitos altos y plantamos cuatro pinitos más. ¿Cuánto es seis más cuatro?',
            repeatPrompt: '¡Muy bien! El resultado es ocho. Ahora: Último desafío de suma: En la colina hay seis pinitos altos y plantamos cuatro pinitos más. ¿Cuánto es seis más cuatro?',
            hintSpeech: 'No escuchamos un número claro. Cuenta los dibujos en pantalla y di el resultado en voz alta.',
            successSpeech: '¡Extraordinario! Resolviste todas las sumas del Bosque de los Números. ¡Has ganado tus estrellas doradas!',
            keywords: ['10', 'diez']
          }
        ]
      },
      {
        id: 'act-len-1',
        actividad_id: 8,
        subject: 'Lenguaje y Comunicación',
        oaCode: 'LE01 OA 03',
        oaSummary: 'Identificar los sonidos que componen las palabras (conciencia fonológica), reconociendo sílabas y fonemas iniciales.',
        activityType: 'phonological',
        title: 'Caza de Sonidos: Sonido Inicial con M, P, L y S',
        status: 'Pendiente',
        exercises: [
          {
            number: 1,
            displayBigNumber: '2',
            letterBig: 'M',
            wordLabel: 'MA - NO',
            itemType: 'hand',
            speechPrompt: 'Escuchemos la primera palabra por sílabas: MA... NO... Mano. ¿Con qué letra o sílaba empieza Mano? Dímelo con tu voz.',
            repeatPrompt: 'Escuchemos la primera palabra por sílabas: MA... NO... Mano. ¿Con qué letra o sílaba empieza Mano? Dímelo con tu voz.',
            hintSpeech: 'Escucha el primer sonido de la palabra MANO: empieza con la sílaba MA, de la letra M. Inténtalo de nuevo.',
            successSpeech: '¡Excelente! Empieza con MA.',
            keywords: ['ma', 'mano', 'eme', 'm']
          },
          {
            number: 2,
            displayBigNumber: '2',
            letterBig: 'P',
            wordLabel: 'PA - TO',
            itemType: 'ball',
            speechPrompt: '¡Correcto! Ahora: Segunda palabra: PA... TO... Pato. ¿Con qué letra o sílaba empieza Pato?',
            repeatPrompt: 'Segunda palabra: PA... TO... Pato. ¿Con qué letra o sílaba empieza Pato?',
            hintSpeech: 'Escucha el primer sonido de la palabra PATO: empieza con la sílaba PA, de la letra P. Inténtalo de nuevo.',
            successSpeech: '¡Excelente! Empieza con PA.',
            keywords: ['pa', 'pato', 'pe', 'p']
          },
          {
            number: 3,
            displayBigNumber: '2',
            letterBig: 'L',
            wordLabel: 'LU - NA',
            itemType: 'moon',
            speechPrompt: '¡Correcto! Ahora: Tercera palabra: LU... NA... Luna. ¿Con qué letra o sílaba empieza Luna?',
            repeatPrompt: 'Tercera palabra: LU... NA... Luna. ¿Con qué letra o sílaba empieza Luna?',
            hintSpeech: 'No escuchamos tu respuesta. Presiona el micrófono y cuéntanos con tu voz.',
            successSpeech: '¡Brillante! Empieza con LU.',
            keywords: ['lu', 'luna', 'ele', 'l']
          },
          {
            number: 4,
            displayBigNumber: '2',
            letterBig: 'S',
            wordLabel: 'SA - PO',
            itemType: 'sun',
            speechPrompt: '¡Correcto! Ahora: Cuarta palabra: SA... PO... Sapo. ¿Con qué letra o sílaba empieza Sapo?',
            repeatPrompt: 'Cuarta palabra: SA... PO... Sapo. ¿Con qué letra o sílaba empieza Sapo?',
            hintSpeech: 'No escuchamos tu respuesta. Presiona el micrófono y cuéntanos con tu voz.',
            successSpeech: '¡Súper bien! Empieza con SA.',
            keywords: ['sa', 'sapo', 'ese', 's']
          },
          {
            number: 5,
            displayBigNumber: '2',
            letterBig: 'M',
            wordLabel: 'ME - SA',
            itemType: 'hand',
            speechPrompt: '¡Correcto! Ahora: Última palabra: ME... SA... Mesa. ¿Con qué letra o sílaba empieza Mesa?',
            repeatPrompt: 'Última palabra: ME... SA... Mesa. ¿Con qué letra o sílaba empieza Mesa?',
            hintSpeech: 'No escuchamos tu respuesta. Presiona el micrófono y cuéntanos con tu voz.',
            successSpeech: '¡Extraordinario! Dijiste todos los números en su orden exacto. ¡Has ganado las 10 estrellas doradas!',
            keywords: ['me', 'mesa', 'eme', 'm']
          }
        ]
      },
      {
        id: 'act-len-2',
        actividad_id: 10,
        subject: 'Lenguaje y Comunicación',
        oaCode: 'LE01 OA 18',
        oaSummary: 'Comprender textos orales (relatos y fábulas) formulando y respondiendo preguntas oralmente.',
        activityType: 'story_comprehension',
        title: 'Detective de Cuentos: El Conejo y las Uvas',
        status: 'Pendiente',
        exercises: [
          {
            number: 1,
            displayBigNumber: '1',
            itemType: 'grapes_purple',
            speechPrompt: 'Escucha este cuento corto: Había una vez un conejo muy hambriento en el bosque que vio un racimo de uvas moradas en lo alto de una rama. Saltó tres veces, pero estaban muy altas. Al final se fue diciendo: seguro están verdes. Primera pregunta: ¿Qué fruta quería comer el conejo en el bosque?',
            hintSpeech: 'Eran pequeñas, moradas y colgaban en un racimo. ¡Dime uvas por el micrófono!',
            successSpeech: '¡Muy bien Detective! ¡El conejo quería comer las deliciosas uvas!',
            criterio: 'El estudiante menciona que el conejo quería comer uvas o un racimo de uvas moradas.',
            keywords: ['uva', 'uvas', 'racimo', 'morada', 'moradas', 'fruta']
          },
          {
            number: 2,
            displayBigNumber: '2',
            itemType: 'branch_high',
            speechPrompt: '¡Pregunta número dos! ¿Por qué el conejo no pudo alcanzar las uvas aunque saltó tres veces con todas sus fuerzas?',
            hintSpeech: 'Mira mi pecho: las uvas colgaban muy arriba en la rama. ¡Di que estaban muy altas!',
            successSpeech: '¡Excelente respuesta! ¡No las alcanzó porque estaban demasiado altas!',
            criterio: 'El estudiante explica que las uvas estaban muy altas o muy arriba en la rama.',
            keywords: ['alta', 'altas', 'alto', 'arriba', 'lejos', 'alcanzaba', 'alcanzar', 'llegaba']
          },
          {
            number: 3,
            displayBigNumber: '3',
            itemType: 'grapes_green',
            speechPrompt: '¡Última pregunta número tres! ¿Qué dijo el conejo sobre las uvas al final cuando se cansó de saltar?',
            repeatPrompt: '¡Última pregunta número tres! ¿Qué dijo el conejo sobre las uvas al final cuando se cansó de saltar?',
            hintSpeech: 'Mira el color en mi pecho: dijo que seguro todavía estaban de color verde. ¡Di que estaban verdes!',
            successSpeech: '¡Extraordinario Mateo! ¡Dijo que estaban verdes! ¡Completaste todo el cuento!',
            criterio: 'El estudiante menciona que el conejo dijo que estaban verdes o no maduras.',
            keywords: ['verde', 'verdes', 'madura', 'maduras', 'no las como', 'acida']
          }
        ]
      },
      {
        id: 'act-db-5',
        actividad_id: 5,
        subject: 'Lenguaje y Comunicación',
        oaCode: 'LE01 OA 03',
        oaSummary: 'Actividad fónica auditiva guiada por voz para reforzar el reconocimiento del sonido inicial M.',
        activityType: 'phonological',
        title: 'La Casa de las Letras: Identifica el sonido inicial M',
        status: 'Pendiente',
        exercises: [
          {
            number: 1,
            displayBigNumber: '2',
            letterBig: 'M',
            wordLabel: 'MA - NO',
            itemType: 'hand',
            speechPrompt: 'Escuchemos la primera palabra por sílabas: MA... NO... Mano. ¿Con qué letra o sílaba empieza Mano? Dímelo con tu voz.',
            repeatPrompt: 'Escuchemos la primera palabra por sílabas: MA... NO... Mano. ¿Con qué letra o sílaba empieza Mano? Dímelo con tu voz.',
            hintSpeech: 'Escucha el primer sonido de la palabra MANO: empieza con la sílaba MA, de la letra M. Inténtalo de nuevo.',
            successSpeech: '¡Excelente! Empieza con MA.',
            keywords: ['ma', 'mano', 'eme', 'm']
          },
          {
            number: 2,
            displayBigNumber: '2',
            letterBig: 'M',
            wordLabel: 'ME - SA',
            itemType: 'hand',
            speechPrompt: '¡Correcto! Ahora: Última palabra: ME... SA... Mesa. ¿Con qué letra o sílaba empieza Mesa?',
            repeatPrompt: 'Última palabra: ME... SA... Mesa. ¿Con qué letra o sílaba empieza Mesa?',
            hintSpeech: 'No escuchamos tu respuesta. Presiona el micrófono y cuéntanos con tu voz.',
            successSpeech: '¡Excelente! Empieza con ME.',
            keywords: ['me', 'mesa', 'eme', 'm']
          },
          {
            number: 3,
            displayBigNumber: '2',
            letterBig: 'M',
            wordLabel: 'MO - NO',
            itemType: 'monkey',
            speechPrompt: 'Escucha con mucha atención la palabra: MO... NO... Mono. ¿Con qué sílaba empieza Mono? Dilo en voz alta.',
            repeatPrompt: 'Escucha con mucha atención la palabra: MO... NO... Mono. ¿Con qué sílaba empieza Mono? Dilo en voz alta.',
            hintSpeech: 'No escuchamos tu respuesta. Presiona el micrófono y cuéntanos con tu voz.',
            successSpeech: '¡Muy bien! Empieza con MO.',
            keywords: ['mo', 'mono', 'eme', 'm']
          },
          {
            number: 4,
            displayBigNumber: '2',
            letterBig: 'M',
            wordLabel: 'MI - EL',
            itemType: 'sun',
            speechPrompt: 'Siguiente palabra con la letra M: MI... EL... Miel. ¿Con qué sílaba empieza Miel?',
            repeatPrompt: 'Siguiente palabra con la letra M: MI... EL... Miel. ¿Con qué sílaba empieza Miel?',
            hintSpeech: 'No escuchamos tu respuesta. Presiona el micrófono y cuéntanos con tu voz.',
            successSpeech: '¡Súper bien! Empieza con MI.',
            keywords: ['mi', 'miel', 'eme', 'm']
          },
          {
            number: 5,
            displayBigNumber: '2',
            letterBig: 'M',
            wordLabel: 'MA - MÁ',
            itemType: 'hand',
            speechPrompt: 'Última palabra de la Casa de las Letras: MA... MÁ... Mamá. ¿Con qué sílaba empieza Mamá?',
            repeatPrompt: 'Última palabra de la Casa de las Letras: MA... MÁ... Mamá. ¿Con qué sílaba empieza Mamá?',
            hintSpeech: 'Escucha el primer sonido de la palabra MANO: empieza con la sílaba MA, de la letra M. Inténtalo de nuevo.',
            successSpeech: '¡Extraordinario! Dijiste todos los números en su orden exacto. ¡Has ganado las 10 estrellas doradas!',
            keywords: ['ma', 'mama', 'eme', 'm']
          }
        ]
      },
      {
        id: 'act-db-9',
        actividad_id: 9,
        subject: 'Matemáticas',
        oaCode: 'MA01 OA 09',
        oaSummary: 'Practica quitar cantidades pequeñas con apoyo visual y responde el resultado con tu voz.',
        activityType: 'subtraction',
        title: 'Restas con Juguetes y Animalitos hasta el 10',
        status: 'Pendiente',
        exercises: [
          {
            number: 1,
            displayBigNumber: '3 - 1',
            targetNumber: 2,
            leftCount: 3,
            rightCount: 1,
            itemType: 'apple',
            speechPrompt: 'Primera resta: Si tenemos tres manzanas y quitamos una manzana, ¿cuántas manzanas quedan? Dilo con tu voz.',
            repeatPrompt: 'Primera resta: Si tenemos tres manzanas y quitamos una manzana, ¿cuántas manzanas quedan? Dilo con tu voz.',
            hintSpeech: 'No escuchamos un número claro. Cuenta los dibujos en pantalla y di el resultado en voz alta.',
            successSpeech: 'Dos',
            keywords: ['2', 'dos']
          },
          {
            number: 2,
            displayBigNumber: '5 - 2',
            targetNumber: 3,
            leftCount: 5,
            rightCount: 2,
            itemType: 'star',
            speechPrompt: '¡Muy bien! Quedan dos.Segunda resta: Tenemos cinco estrellas y quitamos dos estrellas. ¿Cuánto es cinco menos dos?',
            repeatPrompt: 'Segunda resta: Tenemos cinco estrellas y quitamos dos estrellas. ¿Cuánto es cinco menos dos?',
            hintSpeech: 'No escuchamos un número claro. Cuenta los dibujos en pantalla y di el resultado en voz alta.',
            successSpeech: 'Tres',
            keywords: ['3', 'tres']
          },
          {
            number: 3,
            displayBigNumber: '6 - 2',
            targetNumber: 4,
            leftCount: 6,
            rightCount: 2,
            itemType: 'balloon',
            speechPrompt: '¡Excelente! Quedan tres. Tercera resta: Tenemos seis globos y se vuelan dos globos. ¿Cuánto es seis menos dos?',
            repeatPrompt: 'Tercera resta: Tenemos seis globos y se vuelan dos globos. ¿Cuánto es seis menos dos?',
            hintSpeech: 'No escuchamos un número claro. Cuenta los dibujos en pantalla y di el resultado en voz alta.',
            successSpeech: 'Cuatro',
            keywords: ['4', 'cuatro']
          },
          {
            number: 4,
            displayBigNumber: '8 - 3',
            targetNumber: 5,
            leftCount: 8,
            rightCount: 3,
            itemType: 'orange',
            speechPrompt: '¡Súper bien! Quedan cuatro. Cuarta resta: Tenemos ocho naranjas y comemos tres naranjas. ¿Cuánto es ocho menos tres?',
            repeatPrompt: 'Cuarta resta: Tenemos ocho naranjas y comemos tres naranjas. ¿Cuánto es ocho menos tres?',
            hintSpeech: 'No escuchamos un número claro. Cuenta los dibujos en pantalla y di el resultado en voz alta.',
            successSpeech: 'Cinco',
            keywords: ['5', 'cinco']
          },
          {
            number: 5,
            displayBigNumber: '10 - 4',
            targetNumber: 6,
            leftCount: 10,
            rightCount: 4,
            itemType: 'gem',
            speechPrompt: '¡Muy bien! Quedan cinco. Última resta: Tenemos diez gemas y guardamos cuatro gemas. ¿Cuánto es diez menos cuatro?',
            repeatPrompt: 'Última resta: Tenemos diez gemas y guardamos cuatro gemas. ¿Cuánto es diez menos cuatro?',
            hintSpeech: 'No escuchamos un número claro. Cuenta los dibujos en pantalla y di el resultado en voz alta.',
            successSpeech: '¡Extraordinario! Resolviste todas las restas con animalitos y juguetes. ¡Has ganado tus estrellas doradas!',
            keywords: ['6', 'seis']
          }
        ]
      }
    ];

    // Sincronizar estados iniciales si vienen en mockData
    baseActivities.forEach(b => {
      const target = this.studentActivitiesList.find(x => x.id === b.id);
      if (target && b.status) {
        target.status = b.status;
      }
    });

    // Guardar copia maestra del catálogo completo de plantillas interactivas
    this.studentActivitiesTemplates = JSON.parse(JSON.stringify(this.studentActivitiesList));
    this.teacherCatalogStatus = [];
  },

  startPolling() {
    if (this._pollTimer) return;
    this._pollTimer = setInterval(async () => {
      if (document.hidden || !this.currentUser || this.activeChildActivity || this.activeTeacherReview || this.showServerModal || this.isMobileAssignModalOpen) return;
      const activeEl = document.activeElement;
      if (activeEl && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName)) return;

      if (window.mobileApi) {
        if (this.currentUser.role === 'alumno') {
          const prevSnap = JSON.stringify(this.studentActivitiesList || []);
          await this.sincronizarActividadesAlumno();
          const nextSnap = JSON.stringify(this.studentActivitiesList || []);
          if (prevSnap !== nextSnap) this.render();
        } else if (this.currentTab === 'mensajeria' && this.chatMode === 'individual') {
          await this.cargarMensajesConversacion(this.activeConversacionId, true);
        } else if (this.currentTab === 'mensajeria' && this.chatMode === 'grupal') {
          await this.cargarAlertasMovil(true);
        } else if (this.currentTab === 'asignar' && this.isMobileTeacherAuthorized()) {
          const prevSnap = JSON.stringify(this.teacherCatalogStatus || []);
          await this.cargarEstadoActividadesCursoMovil(true);
          const nextSnap = JSON.stringify(this.teacherCatalogStatus || []);
          if (prevSnap !== nextSnap) this.render();
        } else if (this.currentTab === 'dashboard' && this.currentUser.role === 'apoderado') {
          const prevSnap = JSON.stringify(this.reporteriaData || {});
          await this.cargarReporteriaAlumno();
          const nextSnap = JSON.stringify(this.reporteriaData || {});
          if (prevSnap !== nextSnap) this.render();
        } else if (this.currentTab === 'alertas' && (this.currentUser.role === 'apoderado' || this.isMobileTeacherAuthorized())) {
          await this.cargarAlertasMovil(true);
        }
      }
    }, 3500);
  },

  initDefaultAlertas() {
    this.alertasLocales = [];
  },

  // -------------------------------------------------------------
  // [REQ-02] Autenticación y Selector de Rol (Alumno, Profesor, Apoderado)
  // -------------------------------------------------------------
  loginDemo(roleKey) {
    if (roleKey === 'alumno') {
      this.currentUser = {
        id: 14,
        alumnoId: 5,
        name: 'Mateo González Tapia',
        email: 'alumno@sanandres.cl',
        role: 'alumno',
        curso: '1° Básico B',
        rolLabel: 'Estudiante • 1° Básico B'
      };
      this.currentRoleKey = 'alumno';
      this.currentTab = 'actividades_alumno';
    } else if (roleKey === 'profesora') {
      this.currentUser = {
        id: 12,
        name: 'Marcela Soto Valenzuela',
        email: 'profesora@sanandres.cl',
        role: 'profesora',
        curso: '1° Básico B',
        rolLabel: 'Profesora Jefe 1° Básico B'
      };
      this.currentRoleKey = 'profesora';
      this.currentTab = 'mensajeria';
      this.activeConversacionId = 1;
    } else if (roleKey === 'admin') {
      this.currentUser = {
        id: 11,
        name: 'Rodrigo Valenzuela Lagos',
        email: 'admin@sanandres.cl',
        role: 'admin',
        curso: 'Colegio San Andrés',
        rolLabel: 'Director Académico'
      };
      this.currentRoleKey = 'admin';
      this.currentTab = 'mensajeria';
      this.activeConversacionId = 1;
    } else {
      this.currentUser = {
        id: 13,
        name: 'Carolina Tapia Morales',
        email: 'apoderado@sanandres.cl',
        role: 'apoderado',
        pupils: ['Mateo González (1° Básico B)', 'Sofía González (2° Básico A)'],
        rolLabel: 'Apoderada Titular'
      };
      this.currentRoleKey = 'apoderado';
      this.currentTab = 'mensajeria';
      this.activeConversacionId = 1;
    }

    this.currentUser.defaultAvatar = this.getDefaultAvatarUrl(this.currentUser);
    this.currentUser.avatar = this.getUserAvatarUrl(this.currentUser);
    this.activeChildActivity = null;
    this.activeTeacherReview = null;
    this.errorMessage = '';
    try {
      sessionStorage.setItem('educonnect_session_user', JSON.stringify(this.currentUser));
      localStorage.setItem('educonnect_session_user', JSON.stringify(this.currentUser));
    } catch (e) {}
    this.cargarDatosUsuario();
    this.render();
  },

  async handleLoginForm(e) {
    if (e && e.preventDefault) e.preventDefault();
    const emailEl = document.getElementById('mob-email');
    const passEl = document.getElementById('mob-password');
    if (!emailEl || !passEl) return;

    const email = emailEl.value.trim().toLowerCase();
    const pass = passEl.value.trim();

    if (!email || !pass) {
      this.errorMessage = 'Ingresa tu correo y contraseña institucional.';
      this.render();
      return;
    }

    if (window.mobileApi) {
      const authRes = await mobileApi.login(email, pass);
      if (authRes.success && authRes.data) {
        const u = authRes.data;
        const rol = (u.rol_principal || '').toUpperCase();
        if (rol.includes('ALUM') || email === 'alumno@sanandres.cl') {
          this.loginDemo('alumno');
          return;
        }
        if (rol.includes('ADMIN') || email === 'admin@sanandres.cl') {
          this.loginDemo('admin');
          return;
        }
        const mappedRole = rol.includes('PROF') ? 'profesora' : 'apoderado';
        const defaultAvatar = u.defaultAvatar || this.getDefaultAvatarUrl({ id: u.id, role: mappedRole });
        this.currentUser = {
          id: u.id,
          name: u.nombre,
          email: u.email,
          role: mappedRole,
          curso: mappedRole === 'profesora' ? '1° Básico B' : null,
          pupils: mappedRole === 'apoderado' ? ['Mateo González (1° Básico B)', 'Sofía González (2° Básico A)'] : null,
          rolLabel: mappedRole === 'profesora' ? 'Profesora Jefe 1° Básico B' : 'Apoderada Titular',
          defaultAvatar,
          avatar: u.avatar || this.getUserAvatarUrl({ id: u.id, role: mappedRole, defaultAvatar })
        };
        this.currentRoleKey = mappedRole;
        this.currentTab = 'mensajeria';
        this.activeConversacionId = this.selectedPupilIndex === 1 ? 2 : 1;
        this.activeTeacherReview = null;
        this.errorMessage = '';
        this.mobileAlertSuccessMsg = '';
        this.mobileComSuccessMsg = '';
        try {
          sessionStorage.setItem('educonnect_session_user', JSON.stringify(this.currentUser));
          localStorage.setItem('educonnect_session_user', JSON.stringify(this.currentUser));
        } catch (e) {}
        this.cargarDatosUsuario();
        this.render();
        return;
      } else if (authRes.detail) {
        this.errorMessage = authRes.detail;
        this.render();
        return;
      }
    }

    // Respaldo criptográfico local (verificando únicamente hashes SHA-256)
    const inputHash = (window.firebaseDb && firebaseDb.hashPassword) ? firebaseDb.hashPassword(pass) : '';
    const usersMap = (window.mockData && mockData.demoUsers) ? mockData.demoUsers : {};
    const matchedRole = Object.keys(usersMap).find(
      rk => usersMap[rk].email.toLowerCase() === email && usersMap[rk].password_hash === inputHash
    );

    if (matchedRole) {
      this.loginDemo(matchedRole);
    } else {
      this.errorMessage = 'Credenciales incorrectas. Verifica tu correo y contraseña institucional.';
      this.render();
    }
  },

  logout() {
    this.detenerActividadInfantil();
    this.currentUser = null;
    this.activeTeacherReview = null;
    this.isMobileAssignModalOpen = false;
    this.currentTab = 'mensajeria';
    this.errorMessage = '';
    this.mobileAlertSuccessMsg = '';
    this.mobileComSuccessMsg = '';
    try {
      sessionStorage.removeItem('educonnect_session_user');
      localStorage.removeItem('educonnect_session_user');
    } catch (e) {}
    this.render();
  },

  async cargarDatosUsuario() {
    if (!this.currentUser) return;

    if (this.currentUser.role === 'alumno') {
      await this.sincronizarActividadesAlumno();
      this.render();
      return;
    }

    if (window.mobileApi) {
      await this.cargarAlertasMovil(true);
      await this.cargarMensajesConversacion(this.activeConversacionId);
      await this.cargarReporteriaAlumno();
      if (this.isMobileTeacherAuthorized()) {
        await this.cargarEstadoActividadesCursoMovil(true);
      }
    }
    this.render();
  },

  async sincronizarActividadesAlumno() {
    if (!window.mobileApi) return;
    const dbActs = await mobileApi.getActividadesAlumno(5);
    if (!Array.isArray(dbActs)) return;

    const templates = (Array.isArray(this.studentActivitiesTemplates) && this.studentActivitiesTemplates.length > 0)
      ? this.studentActivitiesTemplates
      : this.studentActivitiesList;

    const assignedActivities = [];
    dbActs.forEach(dbItem => {
      const dbTitle = (dbItem.titulo || '').toLowerCase();
      let template = templates.find(a =>
        (dbItem.actividad_id && Number(a.actividad_id) === Number(dbItem.actividad_id)) ||
        (dbItem.codigo_frontend && a.id === dbItem.codigo_frontend) ||
        (dbTitle && a.title.toLowerCase() === dbTitle)
      );

      if (!template) {
        template = templates[0];
        if (dbTitle.includes('resta')) {
          template = templates.find(x => x.activityType === 'subtraction') || template;
        } else if (dbTitle.includes('suma') || dbTitle.includes('bosque')) {
          template = templates.find(x => x.activityType === 'addition') || template;
        } else if (dbTitle.includes('cuento') || dbTitle.includes('conejo') || dbTitle.includes('uvas')) {
          template = templates.find(x => x.activityType === 'story_comprehension') || template;
        } else if (dbTitle.includes('casa de las letras') || dbTitle.includes('letra m')) {
          template = templates.find(x => x.id === 'act-db-5') || template;
        } else if (dbTitle.includes('sonido') || dbTitle.includes('silaba') || dbTitle.includes('sílaba') || (dbItem.asignatura || '').toLowerCase().includes('lenguaje')) {
          template = templates.find(x => x.id === 'act-len-1') || template;
        }
      }

      if (template) {
        let oaCode = template.oaCode;
        if (dbItem.dificultad && dbItem.dificultad.includes('OA')) {
          const parts = dbItem.dificultad.split('•');
          oaCode = (parts[1] || parts[0]).trim();
        }
        assignedActivities.push({
          ...JSON.parse(JSON.stringify(template)),
          id: dbItem.codigo_frontend || template.id || `act-db-${dbItem.actividad_id}`,
          actividad_id: dbItem.actividad_id || template.actividad_id,
          subject: dbItem.asignatura || template.subject,
          oaCode: oaCode,
          oaSummary: dbItem.descripcion || template.oaSummary,
          title: dbItem.titulo || template.title,
          status: dbItem.estado || 'Pendiente'
        });
      }
    });

    this.studentActivitiesList = assignedActivities;
  },

  async cargarEstadoActividadesCursoMovil(silent = false) {
    if (!window.mobileApi) return;
    const statusList = await mobileApi.getEstadoActividadesCurso(3);
    if (Array.isArray(statusList)) {
      this.teacherCatalogStatus = statusList;
      if (!silent) this.render();
    }
  },

  async asignarActividadMovil(code) {
    if (!window.mobileApi) return;
    const templates = this.studentActivitiesTemplates || [];
    const tpl = templates.find(t => t.id === code);
    const dbRow = (this.teacherCatalogStatus || []).find(r => r.codigo_frontend === code);

    await mobileApi.asignarActividad({
      curso_id: 3,
      codigo_frontend: code,
      titulo: (dbRow && dbRow.titulo) || (tpl && tpl.title) || code,
      descripcion: (dbRow && dbRow.descripcion) || (tpl && tpl.oaSummary) || '',
      asignatura: (dbRow && dbRow.asignatura) || (tpl && tpl.subject) || 'Matemáticas',
      oa_code: (tpl && tpl.oaCode) || 'MA01 OA 01'
    });
    await this.cargarEstadoActividadesCursoMovil();
    await this.sincronizarActividadesAlumno();
    this.render();
  },

  async desasignarActividadMovil(code) {
    if (!window.mobileApi) return;
    const dbRow = (this.teacherCatalogStatus || []).find(r => r.codigo_frontend === code);
    await mobileApi.desasignarActividad({
      curso_id: 3,
      codigo_frontend: code,
      actividad_id: dbRow ? dbRow.actividad_id : null
    });
    await this.cargarEstadoActividadesCursoMovil();
    await this.sincronizarActividadesAlumno();
    this.render();
  },

  async vaciarActividadesMovil() {
    if (!window.mobileApi) return;
    await mobileApi.desasignarTodasActividades(3);
    await this.cargarEstadoActividadesCursoMovil();
    await this.sincronizarActividadesAlumno();
    this.render();
  },

  async asignarTodasActividadesMovil() {
    if (!window.mobileApi) return;
    const codes = ['act-conteo', 'act-mat-2', 'act-db-9', 'act-len-1', 'act-db-5', 'act-len-2'];
    for (const code of codes) {
      await this.asignarActividadMovil(code);
    }
  },

  abrirModalAsignarActividadMovil() {
    if (!this.isMobileTeacherAuthorized() || this.isMobileAssigning) return;
    const templates = Array.isArray(this.studentActivitiesTemplates) ? this.studentActivitiesTemplates : [];
    const statusMap = {};
    (this.teacherCatalogStatus || []).forEach(r => {
      if (r.codigo_frontend) statusMap[r.codigo_frontend] = r;
    });
    const unassigned = templates.filter(t => !(statusMap[t.id] && statusMap[t.id].asignada));
    if (this.mobileModalSelectedCodes.length === 0) {
      if (unassigned.length > 0) {
        this.mobileModalSelectedCodes = [unassigned[0].id];
      } else if (templates.length > 0) {
        this.mobileModalSelectedCodes = [templates[0].id];
      }
    }
    this.mobileAssignModalError = '';
    this.isMobileAssignModalOpen = true;
    this.render();
    setTimeout(() => this.ensureMobileAssignDialogShown(), 0);
  },

  cerrarModalAsignarActividadMovil() {
    if (this.isMobileAssigning) return;
    this.isMobileAssignModalOpen = false;
    this.mobileAssignModalError = '';
    const dlg = document.getElementById('mobile-assign-activities-dialog');
    if (dlg && dlg.open && typeof dlg.close === 'function') {
      dlg.close();
    } else {
      this.render();
    }
  },

  ensureMobileAssignDialogShown() {
    const dlg = document.getElementById('mobile-assign-activities-dialog');
    if (!dlg || !this.isMobileAssignModalOpen) return;

    if (!dlg.dataset.boundClose) {
      dlg.dataset.boundClose = '1';
      dlg.addEventListener('close', () => {
        dlg.returnValue = '';
        if (this.isMobileAssignModalOpen) {
          this.isMobileAssignModalOpen = false;
          this.mobileAssignModalError = '';
          this.render();
        }
      });
      if (!('closedBy' in HTMLDialogElement.prototype)) {
        const isOutside = (e, dialogEl) => {
          const r = dialogEl.getBoundingClientRect();
          return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
        };
        let pressedOutside = false;
        dlg.addEventListener('pointerdown', (e) => {
          pressedOutside = isOutside(e, dlg);
        });
        dlg.addEventListener('pointerup', (e) => {
          if (pressedOutside && isOutside(e, dlg) && !this.isMobileAssigning) {
            dlg.close();
          }
        });
      }
    }

    if (typeof dlg.showModal === 'function' && !dlg.open) {
      dlg.showModal();
    }
  },

  refreshMobileAssignModalBody(focusId = null) {
    const body = document.getElementById('mobile-assign-modal-body');
    if (!body) return;
    const activeId = focusId || (document.activeElement && document.activeElement.id ? document.activeElement.id : null);
    body.innerHTML = this.renderMobileAssignModalInner();
    if (window.lucide) {
      lucide.createIcons();
    }
    if (activeId) {
      const el = document.getElementById(activeId);
      if (el && typeof el.focus === 'function') {
        el.focus({ preventScroll: true });
      }
    }
  },

  toggleActividadModalMovil(code, checked) {
    const set = new Set(Array.isArray(this.mobileModalSelectedCodes) ? this.mobileModalSelectedCodes : []);
    if (checked) {
      set.add(code);
    } else {
      set.delete(code);
    }
    this.mobileModalSelectedCodes = Array.from(set);
    this.mobileAssignModalError = '';
    this.refreshMobileAssignModalBody(`mobile-modal-act-${code}`);
  },

  seleccionarTodasModalMovil() {
    const templates = Array.isArray(this.studentActivitiesTemplates) ? this.studentActivitiesTemplates : [];
    this.mobileModalSelectedCodes = templates.map(t => t.id);
    this.mobileAssignModalError = '';
    this.refreshMobileAssignModalBody();
  },

  limpiarSeleccionModalMovil() {
    this.mobileModalSelectedCodes = [];
    this.mobileAssignModalError = '';
    this.refreshMobileAssignModalBody();
  },

  async confirmarAsignarSeleccionMovil(event) {
    if (event && event.preventDefault) event.preventDefault();
    if (!this.isMobileTeacherAuthorized() || this.isMobileAssigning || !window.mobileApi) return;

    const templates = Array.isArray(this.studentActivitiesTemplates) ? this.studentActivitiesTemplates : [];
    const selectedTemplates = templates.filter(t => this.mobileModalSelectedCodes.includes(t.id));
    if (selectedTemplates.length === 0) {
      this.mobileAssignModalError = 'Selecciona al menos una actividad para asignar.';
      const firstId = templates.length > 0 ? `mobile-modal-act-${templates[0].id}` : null;
      this.refreshMobileAssignModalBody(firstId);
      return;
    }

    this.isMobileAssigning = true;
    this.mobileAssignModalError = '';
    this.refreshMobileAssignModalBody();

    for (const tpl of selectedTemplates) {
      const dbRow = (this.teacherCatalogStatus || []).find(r => r.codigo_frontend === tpl.id);
      await mobileApi.asignarActividad({
        curso_id: 3,
        codigo_frontend: tpl.id,
        titulo: (dbRow && dbRow.titulo) || tpl.title || tpl.id,
        descripcion: (dbRow && dbRow.descripcion) || tpl.oaSummary || '',
        asignatura: (dbRow && dbRow.asignatura) || tpl.subject || 'Matemáticas',
        oa_code: tpl.oaCode || 'MA01 OA 01'
      });
    }

    await this.cargarEstadoActividadesCursoMovil(true);
    await this.sincronizarActividadesAlumno();

    this.isMobileAssigning = false;
    this.isMobileAssignModalOpen = false;

    const dlg = document.getElementById('mobile-assign-activities-dialog');
    if (dlg && dlg.open && typeof dlg.close === 'function') {
      dlg.close();
    }
    this.render();
  },

  isMobileTeacherAuthorized() {
    return Boolean(this.currentUser && (this.currentUser.role === 'profesora' || this.currentUser.role === 'admin'));
  },

  async abrirRevisionActividadMovil(code, alumnoId = 5) {
    if (!this.isMobileTeacherAuthorized()) return;
    this.teacherReviewSentSuccess = false;
    this.teacherReviewMessageDraft = undefined;
    if (window.mobileApi) {
      const rev = await mobileApi.getRevisionActividad(3, code, alumnoId);
      if (rev && rev.success) {
        this.activeTeacherReview = rev;
        if (rev.resumen_ia && rev.resumen_ia.mensaje_apoderado) {
          this.teacherReviewMessageDraft = rev.resumen_ia.mensaje_apoderado;
        }
        this.render();
        return;
      }
    }
    const dbRow = (this.teacherCatalogStatus || []).find(r => r.codigo_frontend === code) || {};
    const completados = (dbRow.estado_alumno === 'Entregada' || (Array.isArray(dbRow.detalle_respuestas_alumno) && dbRow.detalle_respuestas_alumno.length > 0))
      ? [{
          alumno_id: 5,
          alumno_nombre: 'Mateo González',
          apoderado_nombre: 'Carolina Tapia Morales',
          estado: dbRow.estado_alumno || 'Entregada',
          calificacion: dbRow.calificacion_alumno != null ? dbRow.calificacion_alumno : 10,
          progreso: 100
        }]
      : [];
    this.activeTeacherReview = {
      codigo_frontend: code,
      titulo: dbRow.titulo || 'Actividad Escolar',
      asignatura: dbRow.asignatura || 'Matemáticas',
      alumno_id: alumnoId || 5,
      alumno_nombre: 'Mateo González',
      apoderado_nombre: 'Carolina Tapia Morales',
      estado: dbRow.estado_alumno || 'Pendiente',
      calificacion: dbRow.calificacion_alumno != null ? dbRow.calificacion_alumno : null,
      detalle_respuestas: Array.isArray(dbRow.detalle_respuestas_alumno) ? dbRow.detalle_respuestas_alumno : [],
      resumen_ia: dbRow.resumen_ia_alumno || null,
      alumnos_completados: completados,
      alumnos_asignados: [{
        alumno_id: 5,
        alumno_nombre: 'Mateo González',
        apoderado_nombre: 'Carolina Tapia Morales',
        estado: dbRow.estado_alumno || 'Pendiente',
        calificacion: dbRow.calificacion_alumno != null ? dbRow.calificacion_alumno : null,
        progreso: dbRow.progreso_alumno || 0
      }]
    };
    this.render();
  },

  async seleccionarAlumnoRevisionMovil(code, alumnoId) {
    if (!this.isMobileTeacherAuthorized()) return;
    await this.abrirRevisionActividadMovil(code, Number(alumnoId) || 5);
  },

  cerrarRevisionActividadMovil() {
    this.activeTeacherReview = null;
    this.teacherReviewMessageDraft = undefined;
    this.teacherReviewSentSuccess = false;
    this.render();
  },

  async reiniciarPuntajeActividadMovil(code) {
    if (!this.isMobileTeacherAuthorized()) return;
    if (window.mobileApi && mobileApi.reiniciarPuntajeActividad) {
      await mobileApi.reiniciarPuntajeActividad({
        curso_id: 3,
        codigo_frontend: code,
        alumno_id: 5
      });
    }

    if (this.activeTeacherReview && this.activeTeacherReview.codigo_frontend === code) {
      this.activeTeacherReview.estado = 'Pendiente';
      this.activeTeacherReview.progreso = 0;
      this.activeTeacherReview.calificacion = null;
      this.activeTeacherReview.detalle_respuestas = [];
      this.activeTeacherReview.errores_conteo = [];
      this.activeTeacherReview.tiempo_promedio_segundos = 0;
      this.activeTeacherReview.tiempo_total_segundos = 0;
    }

    await this.cargarEstadoActividadesCursoMovil(true);
    await this.sincronizarActividadesAlumno();
    await this.cargarReporteriaAlumno();
    this.render();
  },

  async regenerarResumenIaMovil() {
    if (!this.isMobileTeacherAuthorized() || !this.activeTeacherReview || !window.mobileApi) return;
    const rev = this.activeTeacherReview;
    const iaRes = await mobileApi.generarResumenDocenteIa({
      alumno_nombre: rev.alumno_nombre || 'Mateo González',
      actividad_codigo: rev.codigo_frontend || 'act-conteo',
      actividad_titulo: rev.titulo || 'Actividad Escolar',
      asignatura: rev.asignatura || 'Matemáticas',
      calificacion: rev.calificacion != null ? rev.calificacion : 10,
      errores_conteo: rev.errores_conteo || [],
      detalle_respuestas: rev.detalle_respuestas || []
    });
    if (iaRes && iaRes.success) {
      this.activeTeacherReview.resumen_ia = iaRes;
      this.teacherReviewMessageDraft = iaRes.mensaje_apoderado;
      this.render();
    }
  },

  async enviarResumenApoderadoMovil() {
    if (!this.isMobileTeacherAuthorized() || !this.activeTeacherReview) {
      alert('Solo el docente a cargo puede enviar reportes pedagógicos al apoderado.');
      return;
    }
    const textarea = document.getElementById('mobile-teacher-ia-msg');
    const msgText = (textarea ? textarea.value : (this.teacherReviewMessageDraft || '')).trim();
    if (!msgText) {
      alert('El mensaje para el apoderado no puede estar vacío.');
      return;
    }

    const rev = this.activeTeacherReview;
    const validTeacherId = (this.currentUser && (this.currentUser.id === 12 || this.currentUser.id === 11)) ? this.currentUser.id : 12;
    if (window.mobileApi) {
      await mobileApi.enviarResumenApoderado({
        alumno_id: rev.alumno_id || 5,
        student_code: 'alu-102',
        profesor_usuario_id: validTeacherId,
        actividad_titulo: rev.titulo || 'Actividad Escolar',
        contenido: msgText
      });
    }

    // Actualizar también la lista local de mensajes de la conversación 1 (Mateo)
    const convId = 1;
    if (!this.mensajesPorConversacion[convId]) {
      this.mensajesPorConversacion[convId] = [];
    }
    this.mensajesPorConversacion[convId].push({
      id: Date.now(),
      remitenteId: validTeacherId,
      remitenteNombre: 'Marcela Soto Valenzuela',
      texto: msgText,
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      leido: false,
      esMio: true
    });

    await this.cargarMensajesConversacion(convId);
    this.teacherReviewSentSuccess = true;
    this.render();
  },

  // -------------------------------------------------------------
  // [REQ-03, REQ-04, REQ-05] Flujo de Actividad Infantil con Robot Leo
  // -------------------------------------------------------------
  async iniciarActividadInfantil(actId) {
    // Limpiar cualquier grabación, temporizador o audio de una actividad previa
    this.detenerGrabacionVoz();
    this._isProcessingVoiceAnswer = false;
    if (this._silenceTimer) {
      clearTimeout(this._silenceTimer);
      this._silenceTimer = null;
    }
    if (window.mobileApi) {
      mobileApi.stopSpeaking();
    }

    const act = this.studentActivitiesList.find(a => a.id === actId) || this.studentActivitiesList[0];
    if (!act) return;

    this.activeChildActivity = act;
    this.currentExerciseIndex = 0;
    this.completedExercises = [];
    this.countingMistakes = [];
    this.stepResponseDetails = [];
    this._currentStepMistakes = [];
    this._stepStartTimeMs = Date.now();
    this.activityMistakeCount = 0;
    this.isActivityCompletedCelebration = false;
    this.isRecordingVoice = false;
    this.lastSpokenTranscript = '';
    this.countingNumberAnimActive = false;
    this.lastCompletedCountingNumber = null;
    this._countingCooldownUntil = 0;
    this._countingConsumedUtterance = null;
    this._countingConsumedCount = 0;
    this._countingCooldownTranscript = '';
    if (this._countingAnimTimer) {
      clearTimeout(this._countingAnimTimer);
      this._countingAnimTimer = null;
    }
    this.robotState = 'speaking';
    this.render();

    await this.reproducirPreguntaActual(false, false);
  },

  detenerActividadInfantil() {
    this.detenerGrabacionVoz();
    this._isProcessingVoiceAnswer = false;
    this.countingNumberAnimActive = false;
    this.lastCompletedCountingNumber = null;
    this._countingCooldownUntil = 0;
    this._countingConsumedUtterance = null;
    this._countingConsumedCount = 0;
    this._countingCooldownTranscript = '';
    if (this._countingAnimTimer) {
      clearTimeout(this._countingAnimTimer);
      this._countingAnimTimer = null;
    }
    if (this._silenceTimer) {
      clearTimeout(this._silenceTimer);
      this._silenceTimer = null;
    }
    if (window.mobileApi) {
      mobileApi.stopSpeaking();
    }
    this.activeChildActivity = null;
    this.isActivityCompletedCelebration = false;
    this.robotState = 'guiding';
    this.render();
  },

  getCurrentExercise() {
    if (!this.activeChildActivity || !Array.isArray(this.activeChildActivity.exercises)) return null;
    return this.activeChildActivity.exercises[this.currentExerciseIndex] || this.activeChildActivity.exercises[0];
  },

  async reproducirPreguntaActual(isRepeat = false, startCelebrating = false) {
    const ex = this.getCurrentExercise();
    if (!ex || !window.mobileApi || !this.activeChildActivity) return;

    if (this._silenceTimer) {
      clearTimeout(this._silenceTimer);
      this._silenceTimer = null;
    }

    const isCountingActivity = this.activeChildActivity.activityType === 'counting';
    // En la actividad de Conteo (1 al 10), Robot Leo solo da la instrucción al inicio (o si el niño toca el botón de parlante)
    if (isCountingActivity && this.currentExerciseIndex > 0 && !isRepeat) {
      this.robotState = this.isRecordingVoice ? 'listening' : 'guiding';
      this.render();
      return;
    }

    const promptToSpeak = isCountingActivity
      ? '¡Hola! Soy Robot Leo. Vamos a contar del uno al diez.'
      : ((isRepeat && ex.repeatPrompt) ? ex.repeatPrompt : ex.speechPrompt);

    await mobileApi.speakText(
      promptToSpeak,
      () => {
        if (startCelebrating) {
          this.robotState = 'celebrating';
          this.render();
          setTimeout(() => {
            if (this.activeChildActivity && !this.isRecordingVoice && !this.isActivityCompletedCelebration) {
              this.robotState = 'speaking';
              this.render();
            }
          }, 1300);
        } else {
          this.robotState = 'speaking';
          this.render();
        }
      },
      () => {
        if (!this.isRecordingVoice && this.activeChildActivity && !this.isActivityCompletedCelebration) {
          if (isCountingActivity) {
            // En la actividad de Conteo, activar automáticamente la escucha en vivo apenas Robot Leo termina de dar la instrucción inicial
            this.iniciarEscuchaConteoContinuo();
            return;
          }
          this.robotState = 'guiding';
          this.render();
          // Si hay silencio prolongado (10s), Robot Leo señala amablemente su pecho
          this._silenceTimer = setTimeout(() => {
            if (this.activeChildActivity && !this.isRecordingVoice && !this.isActivityCompletedCelebration) {
              this.robotState = 'guiding';
              this.render();
            }
          }, 10000);
        }
      }
    );
  },

  // [REQ-04.3] Botón de parlante junto al robot para "Volver a escuchar la pregunta"
  async repetirPreguntaVoz() {
    if (!this.activeChildActivity) return;
    if (this.isRecordingVoice) {
      this.detenerGrabacionVoz();
    }
    this._isProcessingVoiceAnswer = false;
    await this.reproducirPreguntaActual(true, false);
  },

  // [REQ-05] Botón Semicircular Inferior de Micrófono (STT + Evaluación IA)
  async toggleGrabacionVozInfantil() {
    if (!this.activeChildActivity) return;
    if (this.isActivityCompletedCelebration) {
      this.detenerActividadInfantil();
      return;
    }

    if (this.isRecordingVoice) {
      // Si ya estaba escuchando y el niño vuelve a tocar el botón, detener grabación y evaluar lo hablado
      this.finalizarEscuchaManual();
      return;
    }

    // Permitir siempre activar el micrófono incluso si Leo estaba hablando
    this._isProcessingVoiceAnswer = false;
    if (window.mobileApi) {
      mobileApi.stopSpeaking();
    }
    if (this._silenceTimer) {
      clearTimeout(this._silenceTimer);
      this._silenceTimer = null;
    }

    const isCountingActivity = this.activeChildActivity.activityType === 'counting';
    if (isCountingActivity) {
      await this.iniciarEscuchaConteoContinuo();
      return;
    }

    this.isRecordingVoice = true;
    this.robotState = 'listening';
    this.render();

    let handled = false;
    const finishWithTranscript = async (transcriptText) => {
      if (handled) return;
      handled = true;
      this.detenerGrabacionVoz();
      await this.procesarRespuestaNino(transcriptText);
    };

    const isCloudOrNativeMode = !window.mobileApi || !mobileApi._localServerActive;
    const hasNativeAndroidStt = typeof window !== 'undefined' &&
      window.AndroidVoiceBridge &&
      typeof window.AndroidVoiceBridge.hasNativeStt === 'function' &&
      window.AndroidVoiceBridge.hasNativeStt();

    const startBrowserSpeechFallback = () => {
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRec) {
        this._recordingFallbackTimer = setTimeout(() => {
          finishWithTranscript('');
        }, 500);
        return;
      }
      try {
        const recognition = new SpeechRec();
        this._recognition = recognition;
        recognition.lang = 'es-CL';
        recognition.continuous = true;
        recognition.interimResults = true;
        let latestTranscript = '';

        this._onManualVoiceStop = () => finishWithTranscript(latestTranscript);

        recognition.onresult = (ev) => {
          if (handled || !this.isRecordingVoice) return;
          const parts = [];
          for (let i = 0; i < ev.results.length; i++) {
            const t = ev.results[i] && ev.results[i][0] && ev.results[i][0].transcript;
            if (t) parts.push(t);
          }
          const combined = parts.join(' ').trim();
          if (combined) latestTranscript = combined;

          if (latestTranscript && this.esTranscripcionValidaParaEjercicio(latestTranscript)) {
            finishWithTranscript(latestTranscript);
            return;
          }

          if (this._androidSttSilenceTimer) clearTimeout(this._androidSttSilenceTimer);
          const lastRes = ev.results && ev.results[ev.results.length - 1];
          const delayMs = (lastRes && lastRes.isFinal && latestTranscript) ? 250 : 1200;
          this._androidSttSilenceTimer = setTimeout(() => {
            if (!handled && this.isRecordingVoice && latestTranscript) {
              finishWithTranscript(latestTranscript);
            }
          }, delayMs);
        };

        recognition.onerror = () => {
          if (!handled) finishWithTranscript(latestTranscript);
        };
        recognition.onend = () => {
          if (!handled && this.isRecordingVoice) {
            finishWithTranscript(latestTranscript);
          }
        };

        recognition.start();
        this._recordingFallbackTimer = setTimeout(() => {
          if (this.isRecordingVoice && !handled) {
            finishWithTranscript(latestTranscript);
          }
        }, 4800);
      } catch (e) {
        finishWithTranscript('');
      }
    };

    if (isCloudOrNativeMode) {
      if (hasNativeAndroidStt) {
        let latestTranscript = '';
        this._onManualVoiceStop = () => finishWithTranscript(latestTranscript);

        window._onAndroidSttResult = (text, isFinal) => {
          if (handled || !this.isRecordingVoice) return;
          const clean = String(text || '').trim();
          if (clean) latestTranscript = clean;

          if (latestTranscript && this.esTranscripcionValidaParaEjercicio(latestTranscript)) {
            finishWithTranscript(latestTranscript);
            return;
          }
          if (isFinal && latestTranscript) {
            if (this._androidSttSilenceTimer) clearTimeout(this._androidSttSilenceTimer);
            this._androidSttSilenceTimer = setTimeout(() => {
              if (!handled && this.isRecordingVoice) {
                finishWithTranscript(latestTranscript);
              }
            }, 150);
          }
        };

        window._onAndroidSttEnd = () => {
          if (!handled && this.isRecordingVoice) {
            finishWithTranscript(latestTranscript);
          }
        };

        window._onAndroidSttError = (errCode) => {
          if (handled || !this.isRecordingVoice) return;
          if (errCode === 'speech_unavailable') {
            window._onAndroidSttResult = null;
            window._onAndroidSttEnd = null;
            window._onAndroidSttError = null;
            startBrowserSpeechFallback();
            return;
          }
          finishWithTranscript(latestTranscript);
        };

        try {
          window.AndroidVoiceBridge.startListening(false);
        } catch (e) {
          startBrowserSpeechFallback();
          return;
        }

        this._recordingFallbackTimer = setTimeout(() => {
          if (this.isRecordingVoice && !handled) {
            finishWithTranscript(latestTranscript);
          }
        }, 5000);
        return;
      }

      startBrowserSpeechFallback();
      return;
    }

    // 1. Usar MediaRecorder para capturar audio hacia /api/stt/transcribir (Deepgram Nova-2)
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!this.isRecordingVoice || handled || !this.activeChildActivity) {
          try { stream.getTracks().forEach(t => t.stop()); } catch (e) {}
          return;
        }
        this._audioStream = stream;
        this._audioChunks = [];

        let options = { mimeType: 'audio/webm' };
        if (!MediaRecorder.isTypeSupported('audio/webm')) {
          if (MediaRecorder.isTypeSupported('audio/mp4')) options = { mimeType: 'audio/mp4' };
          else if (MediaRecorder.isTypeSupported('audio/aac')) options = { mimeType: 'audio/aac' };
          else options = undefined;
        }

        const recorder = options ? new MediaRecorder(stream, options) : new MediaRecorder(stream);
        this._mediaRecorder = recorder;

        recorder.ondataavailable = (ev) => {
          if (ev.data && ev.data.size > 0) {
            this._audioChunks.push(ev.data);
          }
        };

        recorder.onstop = async () => {
          try {
            stream.getTracks().forEach(t => t.stop());
          } catch (e) {}
          if (handled) return;

          let spokenText = '';
          if (this._audioChunks.length > 0 && window.mobileApi) {
            const mimeType = (recorder.mimeType || 'audio/webm');
            const blob = new Blob(this._audioChunks, { type: mimeType });
            const sttRes = await mobileApi.transcribeAudio(blob);
            if (sttRes && sttRes.success && typeof sttRes.text === 'string') {
              spokenText = sttRes.text.trim();
            }
          }
          await finishWithTranscript(spokenText);
        };

        recorder.start(250);
      } catch (err) {
        console.warn('[STT] getUserMedia error, recurriendo a Web Speech API:', err);
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRec) {
          try {
            const recognition = new SpeechRec();
            this._recognition = recognition;
            recognition.lang = 'es-CL';
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.onresult = (ev) => {
              const res = ev.results && ev.results[0] && ev.results[0][0];
              finishWithTranscript(res && res.transcript ? res.transcript : '');
            };
            recognition.onerror = () => {
              finishWithTranscript('');
            };
            recognition.start();
          } catch (e) {
            finishWithTranscript('');
          }
        } else {
          finishWithTranscript('');
        }
      }
    } else {
      finishWithTranscript('');
    }

    // Temporizador automático de captura (4.0 segundos para dar tiempo al niño)
    this._recordingFallbackTimer = setTimeout(() => {
      if (this.isRecordingVoice && !handled) {
        if (this._mediaRecorder && this._mediaRecorder.state === 'recording') {
          try { this._mediaRecorder.stop(); } catch (e) {}
        } else {
          finishWithTranscript('');
        }
      }
    }, 4000);
  },

  // Escucha EN VIVO en tiempo real (WebSocket /api/stt/live + respaldo de bloques) para la Actividad de Conteo (1 al 10):
  // Analiza en vivo lo que dice el niño y avanza automáticamente de a UN número a la vez con animación, sin voz de Leo entre números.
  async iniciarEscuchaConteoContinuo() {
    this.detenerGrabacionVoz();
    this.isRecordingVoice = true;
    this.robotState = 'listening';
    this._countingManualStopRequested = false;
    this._stepStartTimeMs = Date.now();
    this._currentStepMistakes = [];
    this.render();

    const isCloudOrNativeMode = !window.mobileApi || !mobileApi._localServerActive;
    const hasNativeAndroidStt = typeof window !== 'undefined' &&
      window.AndroidVoiceBridge &&
      typeof window.AndroidVoiceBridge.hasNativeStt === 'function' &&
      window.AndroidVoiceBridge.hasNativeStt();

    if (isCloudOrNativeMode && hasNativeAndroidStt) {
      window._onAndroidSttResult = async (text, isFinal) => {
        if (!this.isRecordingVoice || !this.activeChildActivity || this.activeChildActivity.activityType !== 'counting' || this.isActivityCompletedCelebration) {
          return;
        }
        if (text && String(text).trim()) {
          await this.procesarNumerosContadosEnPantalla(String(text).trim(), {
            start: 'android_live',
            is_final: !!isFinal
          });
        }
      };
      window._onAndroidSttEnd = () => {};
      window._onAndroidSttError = (errCode) => {
        if (errCode === 'permission_denied' || errCode === 'speech_unavailable') {
          this.detenerGrabacionVoz();
          if (this.activeChildActivity && !this.isActivityCompletedCelebration) {
            this.robotState = 'guiding';
            this.render();
          }
        }
      };
      try {
        window.AndroidVoiceBridge.startListening(true);
        return;
      } catch (e) {}
    }

    if (isCloudOrNativeMode || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRec) {
        try {
          const recognition = new SpeechRec();
          this._recognition = recognition;
          recognition.lang = 'es-CL';
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.onresult = (ev) => {
            if (!this.isRecordingVoice || !this.activeChildActivity || this.activeChildActivity.activityType !== 'counting' || this.isActivityCompletedCelebration) return;
            for (let i = ev.resultIndex; i < ev.results.length; i++) {
              const transcript = ev.results[i][0] && ev.results[i][0].transcript;
              if (transcript) {
                this.procesarNumerosContadosEnPantalla(transcript, { start: i, is_final: !!ev.results[i].isFinal });
              }
            }
          };
          recognition.onerror = (err) => {
            if (err && (err.error === 'not-allowed' || err.error === 'service-not-allowed')) {
              this.detenerGrabacionVoz();
              if (this.activeChildActivity && !this.isActivityCompletedCelebration) {
                this.robotState = 'guiding';
                this.render();
              }
            }
          };
          recognition.onend = () => {
            if (
              this._recognition === recognition &&
              this.isRecordingVoice &&
              !this._countingManualStopRequested &&
              !this.isActivityCompletedCelebration &&
              this.activeChildActivity &&
              this.activeChildActivity.activityType === 'counting'
            ) {
              try { recognition.start(); } catch (e) {}
            }
          };
          recognition.start();
        } catch (e) {}
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!this.isRecordingVoice || !this.activeChildActivity || this.activeChildActivity.activityType !== 'counting') {
        try { stream.getTracks().forEach(t => t.stop()); } catch (e) {}
        return;
      }
      this._audioStream = stream;

      let options = { mimeType: 'audio/webm' };
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) options = { mimeType: 'audio/mp4' };
        else if (MediaRecorder.isTypeSupported('audio/aac')) options = { mimeType: 'audio/aac' };
        else options = undefined;
      }

      // Canal primario: Streaming WebSocket en vivo (/api/stt/live -> Deepgram Live interim_results=true, latencia ~200ms)
      let wsConnected = false;
      const hostUrl = window.mobileApi ? mobileApi.getServerHostUrl() : '';
      const wsUrl = hostUrl ? (hostUrl.replace(/^http/i, 'ws') + '/api/stt/live') : '';

      const startSliceFallback = () => {
        if (wsConnected || !this.isRecordingVoice || !this.activeChildActivity || this.activeChildActivity.activityType !== 'counting' || this.isActivityCompletedCelebration) {
          return;
        }
        try {
          const chunks = [];
          const sliceRecorder = options ? new MediaRecorder(stream, options) : new MediaRecorder(stream);
          this._mediaRecorder = sliceRecorder;

          sliceRecorder.ondataavailable = (ev) => {
            if (ev.data && ev.data.size > 0) {
              chunks.push(ev.data);
            }
          };

          sliceRecorder.onstop = async () => {
            const wasManualStop = this._countingManualStopRequested;
            if (!wasManualStop && !wsConnected && this.isRecordingVoice && this.activeChildActivity && this.activeChildActivity.activityType === 'counting' && !this.isActivityCompletedCelebration) {
              startSliceFallback();
            }
            if (chunks.length > 0 && window.mobileApi && this.activeChildActivity && this.activeChildActivity.activityType === 'counting') {
              const mimeType = sliceRecorder.mimeType || 'audio/webm';
              const blob = new Blob(chunks, { type: mimeType });
              const sttRes = await mobileApi.transcribeAudio(blob);
              if (sttRes && sttRes.success && sttRes.text && sttRes.text.trim()) {
                await this.procesarNumerosContadosEnPantalla(sttRes.text.trim());
              }
            }
            if (wasManualStop) {
              this.detenerGrabacionVoz();
              if (this.activeChildActivity && !this.isActivityCompletedCelebration) {
                this.robotState = 'guiding';
                this.render();
              }
            }
          };

          sliceRecorder.start();
          this._recordingFallbackTimer = setTimeout(() => {
            if (sliceRecorder && sliceRecorder.state === 'recording') {
              try { sliceRecorder.stop(); } catch (e) {}
            }
          }, 1250);
        } catch (err) {
          console.warn('[Conteo Slice Error]:', err);
        }
      };

      try {
        const ws = new WebSocket(wsUrl);
        this._liveSttSocket = ws;

        const wsConnectTimeout = setTimeout(() => {
          if (!wsConnected && this.isRecordingVoice) {
            try { ws.close(); } catch (e) {}
            startSliceFallback();
          }
        }, 1800);

        ws.onmessage = async (event) => {
          if (!this.isRecordingVoice || !this.activeChildActivity || this.activeChildActivity.activityType !== 'counting') {
            return;
          }
          try {
            const data = JSON.parse(event.data);
            if (data.ready && !wsConnected) {
              wsConnected = true;
              clearTimeout(wsConnectTimeout);
              const liveRecorder = options ? new MediaRecorder(stream, options) : new MediaRecorder(stream);
              this._mediaRecorder = liveRecorder;
              liveRecorder.ondataavailable = (ev) => {
                if (ev.data && ev.data.size > 0 && ws.readyState === WebSocket.OPEN) {
                  ws.send(ev.data);
                }
              };
              // Emitir fragmentos de audio en vivo cada 180ms hacia el WebSocket
              liveRecorder.start(180);
              return;
            }
            if (data.transcript) {
              await this.procesarNumerosContadosEnPantalla(data.transcript, {
                start: data.start,
                is_final: data.is_final,
                speech_final: data.speech_final
              });
            }
          } catch (e) {}
        };

        ws.onerror = () => {
          clearTimeout(wsConnectTimeout);
          if (!wsConnected && this.isRecordingVoice) {
            startSliceFallback();
          }
        };

        ws.onclose = () => {
          clearTimeout(wsConnectTimeout);
          if (!wsConnected && this.isRecordingVoice && !this._countingManualStopRequested && !this.isActivityCompletedCelebration) {
            startSliceFallback();
          }
        };
      } catch (wsErr) {
        startSliceFallback();
      }
    } catch (err) {
      console.warn('[Conteo getUserMedia Error]:', err);
      this.detenerGrabacionVoz();
      this.robotState = 'guiding';
      this.render();
    }
  },

  async procesarNumerosContadosEnPantalla(rawSpoken, meta = {}) {
    if (!this.activeChildActivity || this.activeChildActivity.activityType !== 'counting' || this.isActivityCompletedCelebration) {
      return;
    }
    const cleanSpoken = this.normalizeSpoken(rawSpoken);
    if (!cleanSpoken) return;

    const spokenNums = this.extractSpokenNumbers(cleanSpoken);
    if (spokenNums.length === 0) return;

    const now = Date.now();
    const utteranceStart = (meta && meta.start !== undefined && meta.start !== null) ? Number(meta.start) : null;

    // 1. Si estamos dentro de la ventana de animación de cambio de número (900ms),
    // registrar y absorber todas las palabras residuales de la emisión anterior para impedir saltos de números.
    if (this._countingCooldownUntil && now < this._countingCooldownUntil) {
      if (utteranceStart !== null) {
        this._countingConsumedUtterance = utteranceStart;
      }
      this._countingConsumedCount = Math.max(this._countingConsumedCount || 0, spokenNums.length);
      this._countingCooldownTranscript = cleanSpoken;
      return;
    }

    // 2. Ignorar paquetes tardíos (is_final) que repitan exactamente la misma frase absorbida durante el cooldown
    if (this._countingCooldownTranscript && cleanSpoken === this._countingCooldownTranscript) {
      return;
    }

    // 3. Si es la continuación del mismo segmento de voz en Deepgram, exigir que se haya dicho una palabra NUEVA tras el cooldown
    let candidateNums = spokenNums;
    if (utteranceStart !== null && this._countingConsumedUtterance !== null && Math.abs(utteranceStart - this._countingConsumedUtterance) < 0.08) {
      const consumed = this._countingConsumedCount || 0;
      if (spokenNums.length <= consumed) {
        return;
      }
      candidateNums = spokenNums.slice(consumed);
    } else if (utteranceStart !== null) {
      this._countingConsumedUtterance = utteranceStart;
      this._countingConsumedCount = 0;
    }

    if (candidateNums.length === 0) return;

    const currentEx = this.getCurrentExercise();
    if (!currentEx) return;
    const expectedNum = Number(currentEx.targetNumber);
    const totalEx = this.activeChildActivity.exercises.length;

    // 4. Evaluar únicamente el último número pronunciado y avanzar ESTRICTAMENTE DE A UN NÚMERO A LA VEZ
    const lastSpokenNum = candidateNums[candidateNums.length - 1];
    if (lastSpokenNum !== expectedNum) {
      // Ignorar si es simplemente eco residual del número anterior recién completado
      if (this.lastCompletedCountingNumber !== null && lastSpokenNum === this.lastCompletedCountingNumber) {
        return;
      }

      // Se detectó que el alumno dijo un número equivocado: restar 1 punto del máximo (10) y registrar qué número falló
      this._countingCooldownUntil = now + 800;
      if (utteranceStart !== null) {
        this._countingConsumedUtterance = utteranceStart;
      }
      this._countingConsumedCount = spokenNums.length;
      this._countingCooldownTranscript = cleanSpoken;

      if (!Array.isArray(this.countingMistakes)) {
        this.countingMistakes = [];
      }
      const mistakeEntry = `Número ${expectedNum} (dijo ${lastSpokenNum})`;
      this.countingMistakes.push(mistakeEntry);
      if (!Array.isArray(this._currentStepMistakes)) {
        this._currentStepMistakes = [];
      }
      this._currentStepMistakes.push(`Dijo ${lastSpokenNum}`);

      // Al alumno NO se le muestra ni menciona el descuento de puntaje; Robot Leo solo guía amablemente
      this.robotState = 'guiding';
      this.render();

      if (window.mobileApi) {
        const currentScore = Math.max(1, 10 - this.countingMistakes.length);
        const pctNow = Math.round((this.completedExercises.length / totalEx) * 100);
        mobileApi.actualizarEstadoActividad({
          alumno_id: 5,
          student_code: 'alu-102',
          actividad_id: this.activeChildActivity.actividad_id,
          codigo_frontend: this.activeChildActivity.id,
          titulo: this.activeChildActivity.title,
          asignatura: this.activeChildActivity.subject,
          estado: 'En progreso',
          progreso: pctNow,
          calificacion: currentScore,
          errores_conteo: this.countingMistakes,
          detalle_respuestas: this.stepResponseDetails,
          comentarios: `En progreso (${pctNow}%). Se equivocó en: ${this.countingMistakes.join(', ')}`,
          tiempo_minutos: 3
        });
      }
      return;
    }

    // Bloquear inmediatamente por 900ms mientras ocurre la animación de transición al siguiente número
    const elapsedSec = Math.max(0.5, Number(((now - (this._stepStartTimeMs || now)) / 1000).toFixed(1)));
    const prevMistakesForNum = Array.isArray(this._currentStepMistakes) ? [...this._currentStepMistakes] : [];
    if (!Array.isArray(this.stepResponseDetails)) {
      this.stepResponseDetails = [];
    }
    this.stepResponseDetails.push({
      paso: expectedNum,
      etiqueta: `Número ${expectedNum}`,
      esperado: String(expectedNum),
      respondido: prevMistakesForNum.length > 0
        ? `${prevMistakesForNum.join(', ')} → luego dijo ${lastSpokenNum}`
        : `Dijo ${lastSpokenNum} ("${cleanSpoken || expectedNum}")`,
      intentos: 1 + prevMistakesForNum.length,
      errores_previos: prevMistakesForNum,
      tiempo_segundos: elapsedSec,
      correcto: prevMistakesForNum.length === 0
    });
    this._currentStepMistakes = [];
    this._stepStartTimeMs = now;

    this._countingCooldownUntil = now + 900;
    if (utteranceStart !== null) {
      this._countingConsumedUtterance = utteranceStart;
    }
    this._countingConsumedCount = spokenNums.length;
    this._countingCooldownTranscript = cleanSpoken;

    if (!this.completedExercises.includes(this.currentExerciseIndex)) {
      this.completedExercises.push(this.currentExerciseIndex);
    }

    if (this.currentExerciseIndex >= totalEx - 1) {
      // ¡Dijo el último número (10)! Completar actividad y felicitar por voz (sin mencionar jamás el puntaje al alumno)
      if (this._countingAnimTimer) {
        clearTimeout(this._countingAnimTimer);
        this._countingAnimTimer = null;
      }
      this.countingNumberAnimActive = false;
      this.detenerGrabacionVoz();
      this.isActivityCompletedCelebration = true;
      this.activeChildActivity.status = 'Entregada';
      this.robotState = 'celebrating';
      this.render();

      const mistakesList = Array.isArray(this.countingMistakes) ? this.countingMistakes : [];
      const finalScore = Math.max(1, 10 - mistakesList.length);
      const teacherDiagnosticComment = mistakesList.length > 0
        ? `Conteo del 1 al 10 completado. Se equivocó en: ${mistakesList.join(', ')}`
        : 'Conteo del 1 al 10 completado sin errores en el primer intento (10/10 pts).';

      if (window.mobileApi) {
        await mobileApi.speakText(
          '¡Extraordinario! Dijiste todos los números en su orden exacto. ¡Has ganado las 10 estrellas doradas!',
          () => {
            this.robotState = 'celebrating';
            this.render();
          },
          () => {}
        );
        await mobileApi.actualizarEstadoActividad({
          alumno_id: 5,
          student_code: 'alu-102',
          actividad_id: this.activeChildActivity.actividad_id,
          codigo_frontend: this.activeChildActivity.id,
          titulo: this.activeChildActivity.title,
          asignatura: this.activeChildActivity.subject,
          estado: 'Entregada',
          progreso: 100,
          calificacion: finalScore,
          errores_conteo: mistakesList,
          detalle_respuestas: this.stepResponseDetails,
          comentarios: teacherDiagnosticComment,
          tiempo_minutos: 5
        });
      }
      return;
    }

    // Avanzar exactamente 1 número con animación interactiva (destello esmeralda, rebote 3D del nuevo número y celebración breve de Leo)
    this.lastCompletedCountingNumber = expectedNum;
    this.currentExerciseIndex += 1;
    this.countingNumberAnimActive = true;
    this.robotState = 'celebrating';

    const pct = Math.round((this.completedExercises.length / totalEx) * 100);
    this.activeChildActivity.status = 'En progreso';
    this.render();

    if (this._countingAnimTimer) {
      clearTimeout(this._countingAnimTimer);
    }
    this._countingAnimTimer = setTimeout(() => {
      this.countingNumberAnimActive = false;
      if (this.activeChildActivity && !this.isActivityCompletedCelebration) {
        this.robotState = this.isRecordingVoice ? 'listening' : 'guiding';
        this.render();
      }
    }, 620);

    if (window.mobileApi) {
      const mistakesList = Array.isArray(this.countingMistakes) ? this.countingMistakes : [];
      const currentScore = Math.max(1, 10 - mistakesList.length);
      mobileApi.actualizarEstadoActividad({
        alumno_id: 5,
        student_code: 'alu-102',
        actividad_id: this.activeChildActivity.actividad_id,
        codigo_frontend: this.activeChildActivity.id,
        titulo: this.activeChildActivity.title,
        asignatura: this.activeChildActivity.subject,
        estado: 'En progreso',
        progreso: pct,
        calificacion: currentScore,
        errores_conteo: mistakesList,
        detalle_respuestas: this.stepResponseDetails,
        comentarios: mistakesList.length > 0
          ? `En progreso (${pct}%). Se equivocó en: ${mistakesList.join(', ')}`
          : `Actividad en progreso (${pct}% completado).`,
        tiempo_minutos: 3
      });
    }
  },

  finalizarEscuchaManual() {
    if (this._recordingFallbackTimer) {
      clearTimeout(this._recordingFallbackTimer);
      this._recordingFallbackTimer = null;
    }
    if (this.activeChildActivity && this.activeChildActivity.activityType === 'counting') {
      this._countingManualStopRequested = true;
      if (this._mediaRecorder && this._mediaRecorder.state === 'recording') {
        try {
          this._mediaRecorder.stop();
          return;
        } catch (e) {}
      }
      this.detenerGrabacionVoz();
      this.robotState = 'guiding';
      this.render();
      return;
    }
    if (this._mediaRecorder && this._mediaRecorder.state === 'recording') {
      try {
        this._mediaRecorder.stop();
        return;
      } catch (e) {}
    }
    if (this._onManualVoiceStop) {
      const stopCb = this._onManualVoiceStop;
      this._onManualVoiceStop = null;
      stopCb();
      return;
    }
    if (this._recognition) {
      try {
        this._recognition.stop();
        return;
      } catch (e) {}
    }
    this.detenerGrabacionVoz();
    this.procesarRespuestaNino('');
  },

  detenerGrabacionVoz() {
    this.isRecordingVoice = false;
    this._countingManualStopRequested = false;
    this._onManualVoiceStop = null;
    if (this._androidSttSilenceTimer) {
      clearTimeout(this._androidSttSilenceTimer);
      this._androidSttSilenceTimer = null;
    }
    if (this._recordingFallbackTimer) {
      clearTimeout(this._recordingFallbackTimer);
      this._recordingFallbackTimer = null;
    }
    if (typeof window !== 'undefined') {
      window._onAndroidSttResult = null;
      window._onAndroidSttEnd = null;
      window._onAndroidSttError = null;
      if (window.AndroidVoiceBridge && typeof window.AndroidVoiceBridge.stopListening === 'function') {
        try { window.AndroidVoiceBridge.stopListening(); } catch (e) {}
      }
    }
    if (this._liveSttSocket) {
      try {
        this._liveSttSocket.onmessage = null;
        this._liveSttSocket.onerror = null;
        this._liveSttSocket.onclose = null;
        this._liveSttSocket.close();
      } catch (e) {}
      this._liveSttSocket = null;
    }
    if (this._mediaRecorder && this._mediaRecorder.state === 'recording') {
      try {
        this._mediaRecorder.ondataavailable = null;
        this._mediaRecorder.onstop = null;
        this._mediaRecorder.stop();
      } catch (e) {}
    }
    this._mediaRecorder = null;
    if (this._audioStream) {
      try {
        this._audioStream.getTracks().forEach(t => t.stop());
      } catch (e) {}
      this._audioStream = null;
    }
    if (this._recognition) {
      try { this._recognition.abort(); } catch (e) {}
      this._recognition = null;
    }
  },

  normalizeSpoken(str) {
    return String(str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .trim();
  },

  extractSpokenNumbers(cleanSpoken) {
    if (!cleanSpoken) return [];
    const wordMap = {
      '0': 0, 'cero': 0,
      '1': 1, 'uno': 1, 'un': 1, 'una': 1, 'primero': 1,
      '2': 2, 'dos': 2, 'do': 2, 'tos': 2, 'segundo': 2,
      '3': 3, 'tres': 3, 'tes': 3, 'tle': 3, 'tles': 3, 'res': 3, 'crees': 3, 'tren': 3, 'tercero': 3,
      '4': 4, 'cuatro': 4, 'cuato': 4, 'cato': 4, 'cuarto': 4,
      '5': 5, 'cinco': 5, 'sinco': 5, 'tinco': 5, 'quinto': 5,
      '6': 6, 'seis': 6, 'sei': 6, 'sexto': 6,
      '7': 7, 'siete': 7, 'tiete': 7, 'chete': 7, 'siente': 7, 'septimo': 7,
      '8': 8, 'ocho': 8, 'octavo': 8,
      '9': 9, 'nueve': 9, 'nuebe': 9, 'noveno': 9,
      '10': 10, 'diez': 10, 'dies': 10, 'die': 10, 'decimo': 10
    };
    const tokens = cleanSpoken.split(/\s+/).filter(Boolean);
    const nums = [];
    for (const tk of tokens) {
      if (wordMap[tk] !== undefined) {
        nums.push(wordMap[tk]);
      }
    }
    return nums;
  },

  esTranscripcionValidaParaEjercicio(rawSpoken) {
    const ex = this.getCurrentExercise();
    if (!ex || !this.activeChildActivity) return false;
    const cleanSpoken = this.normalizeSpoken(rawSpoken);
    if (!cleanSpoken) return false;

    const actType = this.activeChildActivity.activityType || 'addition';
    if (actType === 'addition' || actType === 'subtraction') {
      const targetNum = Number(ex.targetNumber);
      const spokenNums = this.extractSpokenNumbers(cleanSpoken);
      return spokenNums.includes(targetNum);
    }

    const rawKeywords = (ex.keywords || []).map(k => this.normalizeSpoken(k)).filter(Boolean);
    const words = cleanSpoken.split(/\s+/).filter(Boolean);
    if (actType === 'phonological') {
      const targetSyllable = rawKeywords[0] || '';
      return words.some(w => rawKeywords.includes(w) || (targetSyllable.length >= 2 && w.startsWith(targetSyllable)));
    }

    return rawKeywords.some(kw => words.includes(kw) || (kw.length >= 4 && cleanSpoken.includes(kw)));
  },

  async procesarRespuestaNino(rawSpoken) {
    if (this._isProcessingVoiceAnswer) return;
    const ex = this.getCurrentExercise();
    if (!ex || !this.activeChildActivity) return;

    if (this.activeChildActivity.activityType === 'counting') {
      await this.procesarNumerosContadosEnPantalla(rawSpoken);
      return;
    }

    this._isProcessingVoiceAnswer = true;
    let esCorrecto = false;
    let feedbackVoz = ex.hintSpeech || 'No escuchamos tu respuesta. Presiona el micrófono y cuéntanos con tu voz.';
    const actType = this.activeChildActivity.activityType || 'addition';

    try {
      const cleanSpoken = this.normalizeSpoken(rawSpoken);
      this.lastSpokenTranscript = rawSpoken || '';
      const rawKeywords = (ex.keywords || []).map(k => this.normalizeSpoken(k)).filter(Boolean);

      // 1. Si no se capturó voz inteligible (silencio o ruido vacío), reprobar intento y orientar
      if (!cleanSpoken) {
        esCorrecto = false;
        feedbackVoz = (actType === 'addition' || actType === 'subtraction')
          ? 'No escuchamos un número claro. Cuenta los dibujos en pantalla y di el resultado en voz alta.'
          : 'No escuchamos tu respuesta. Presiona el micrófono y cuéntanos con tu voz.';
      } else if (actType === 'addition' || actType === 'subtraction') {
        // 2. Evaluación estricta de adición y sustracción por número pronunciado
        const targetNum = Number(ex.targetNumber);
        const spokenNums = this.extractSpokenNumbers(cleanSpoken);
        const lastNum = spokenNums.length > 0 ? spokenNums[spokenNums.length - 1] : null;
        esCorrecto = spokenNums.includes(targetNum);

        if (!esCorrecto) {
          if (lastNum === 4 || lastNum === 9) {
            feedbackVoz = `Escuchamos el número ${lastNum}. Observa los dibujos de ambos grupos, cuéntalos todos juntos y vuelve a decir el resultado.`;
          } else {
            feedbackVoz = ex.hintSpeech || 'No escuchamos un número claro. Cuenta los dibujos en pantalla y di el resultado en voz alta.';
          }
        }
      } else if (actType === 'phonological') {
        // 3. Evaluación estricta de conciencia fonológica (letra o sílaba inicial)
        const words = cleanSpoken.split(/\s+/).filter(Boolean);
        const targetSyllable = rawKeywords[0] || '';
        esCorrecto = words.some(w => rawKeywords.includes(w) || (targetSyllable.length >= 2 && w.startsWith(targetSyllable)));
        if (!esCorrecto) {
          feedbackVoz = ex.hintSpeech || 'No escuchamos tu respuesta. Presiona el micrófono y cuéntanos con tu voz.';
        }
      } else {
        // 4. Comprensión de cuentos: palabras clave + Evaluador Pedagógico IA (/api/ia/evaluar-respuesta)
        const words = cleanSpoken.split(/\s+/).filter(Boolean);
        esCorrecto = rawKeywords.some(kw => words.includes(kw) || (kw.length >= 4 && cleanSpoken.includes(kw)));

        if (window.mobileApi) {
          const iaRes = await mobileApi.evaluarRespuestaIA({
            actividad_codigo: this.activeChildActivity.id,
            pregunta_numero: ex.number,
            relato_contexto: ex.speechPrompt || this.activeChildActivity.title,
            pregunta: ex.speechPrompt,
            criterio_correcto: ex.criterio || `El estudiante menciona ${rawKeywords.join(' o ')}`,
            palabras_clave_respaldo: rawKeywords,
            transcripcion_alumno: String(rawSpoken || '')
          });
          if (iaRes && typeof iaRes.es_correcto === 'boolean') {
            esCorrecto = iaRes.es_correcto;
            if (!esCorrecto && iaRes.retroalimentacion) {
              feedbackVoz = iaRes.retroalimentacion;
            }
          }
        }
      }
    } finally {
      // Liberar el bloqueo ANTES de reproducir el audio de retroalimentación para que el botón de micrófono nunca quede bloqueado
      this._isProcessingVoiceAnswer = false;
    }

    if (!this.activeChildActivity) return;

    if (esCorrecto) {
      // [REQ-03.3] Estado Celebrando: Sonrisa amplia, brazos arriba y estrellas
      const nowMs = Date.now();
      const elapsedSec = Math.max(0.6, Number(((nowMs - (this._stepStartTimeMs || nowMs)) / 1000).toFixed(1)));
      const prevMistakesStep = Array.isArray(this._currentStepMistakes) ? [...this._currentStepMistakes] : [];
      if (!Array.isArray(this.stepResponseDetails)) {
        this.stepResponseDetails = [];
      }
      const stepNum = this.currentExerciseIndex + 1;
      const stepLabelName = (ex && ex.targetNumber !== undefined)
        ? `Ejercicio ${stepNum} (Resultado: ${ex.targetNumber})`
        : ((ex && ex.word) ? `Palabra ${stepNum} (${ex.word})` : `Pregunta ${stepNum}`);
      this.stepResponseDetails.push({
        paso: stepNum,
        etiqueta: stepLabelName,
        esperado: ex && ex.targetNumber !== undefined ? String(ex.targetNumber) : (ex && ex.targetLetter ? ex.targetLetter : 'Respuesta correcta'),
        respondido: String(rawSpoken || '').trim() || 'Respuesta correcta',
        intentos: 1 + prevMistakesStep.length,
        errores_previos: prevMistakesStep,
        tiempo_segundos: elapsedSec,
        correcto: prevMistakesStep.length === 0
      });
      this._currentStepMistakes = [];
      this._stepStartTimeMs = Date.now();

      if (!this.completedExercises.includes(this.currentExerciseIndex)) {
        this.completedExercises.push(this.currentExerciseIndex);
      }

      const totalEx = this.activeChildActivity.exercises.length;
      const isLastExercise = this.currentExerciseIndex >= totalEx - 1;

      if (isLastExercise) {
        this.isActivityCompletedCelebration = true;
        this.activeChildActivity.status = 'Entregada';
        this.robotState = 'celebrating';
        this.render();

        if (window.mobileApi) {
          await mobileApi.speakText(
            ex.successSpeech || '¡Extraordinario! Dijiste todos los números en su orden exacto. ¡Has ganado las 10 estrellas doradas!',
            () => {
              this.robotState = 'celebrating';
              this.render();
            },
            () => {}
          );
          if (this.activeChildActivity) {
            const finalScore = Math.max(1, 10 - (this.activityMistakeCount || 0));
            const mistakesList = Array.isArray(this.countingMistakes) ? this.countingMistakes : [];
            const commentText = mistakesList.length > 0
              ? `Actividad completada por voz. Se equivocó en: ${mistakesList.join(', ')}`
              : `Actividad completada 100% por voz sin errores ("${rawSpoken}").`;
            await mobileApi.actualizarEstadoActividad({
              alumno_id: 5,
              student_code: 'alu-102',
              actividad_id: this.activeChildActivity.actividad_id,
              codigo_frontend: this.activeChildActivity.id,
              titulo: this.activeChildActivity.title,
              asignatura: this.activeChildActivity.subject,
              estado: 'Entregada',
              progreso: 100,
              calificacion: finalScore,
              errores_conteo: mistakesList,
              detalle_respuestas: this.stepResponseDetails,
              comentarios: commentText,
              tiempo_minutos: 6
            });
          }
        }
      } else {
        // [REQ-05.6] Avanzar automáticamente al siguiente ejercicio al acertar con UN SOLO audio continuo (sin sobreposición)
        this.currentExerciseIndex += 1;
        this._stepStartTimeMs = Date.now();
        const pct = Math.round((this.completedExercises.length / totalEx) * 100);
        this.activeChildActivity.status = 'En progreso';
        this.robotState = 'celebrating';
        this.render();

        if (window.mobileApi) {
          mobileApi.actualizarEstadoActividad({
            alumno_id: 5,
            student_code: 'alu-102',
            actividad_id: this.activeChildActivity.actividad_id,
            codigo_frontend: this.activeChildActivity.id,
            titulo: this.activeChildActivity.title,
            asignatura: this.activeChildActivity.subject,
            estado: 'En progreso',
            progreso: pct,
            detalle_respuestas: this.stepResponseDetails,
            tiempo_minutos: 3
          });
        }

        await this.reproducirPreguntaActual(false, true);
      }
    } else {
      if (rawSpoken && String(rawSpoken).trim()) {
        this.activityMistakeCount = (this.activityMistakeCount || 0) + 1;
        if (!Array.isArray(this.countingMistakes)) {
          this.countingMistakes = [];
        }
        const stepLabel = ex && ex.targetNumber !== undefined
          ? `Ejercicio ${this.currentExerciseIndex + 1} [esperado ${ex.targetNumber}, dijo "${String(rawSpoken).trim()}"]`
          : `Pregunta ${this.currentExerciseIndex + 1} (dijo "${String(rawSpoken).trim()}")`;
        this.countingMistakes.push(stepLabel);
        if (!Array.isArray(this._currentStepMistakes)) {
          this._currentStepMistakes = [];
        }
        this._currentStepMistakes.push(`Dijo "${String(rawSpoken).trim()}"`);
      }
      // [REQ-03.3] Estado Orientando / Pistas: Expresión amable señalando el pecho
      this.robotState = 'guiding';
      this.render();
      if (window.mobileApi) {
        await mobileApi.speakText(
          feedbackVoz,
          () => {
            this.robotState = 'speaking';
            this.render();
          },
          () => {
            if (!this.isRecordingVoice && this.activeChildActivity) {
              this.robotState = 'guiding';
              this.render();
            }
          }
        );
      }
    }
  },

  async cargarReporteriaAlumno() {
    if (!this.currentUser || this.currentUser.role !== 'apoderado') return;
    this.isLoadingReporteria = true;
    const pupilId = this.selectedPupilIndex === 0 ? 5 : 6;
    if (window.mobileApi) {
      const rep = await mobileApi.getReporteria(pupilId);
      if (rep) {
        this.reporteriaData = rep;
      }
    }
    this.isLoadingReporteria = false;
  },

  syncComunicadosYAcusesDesdeAlertas() {
    const alertas = Array.isArray(this.alertasLocales) ? this.alertasLocales : [];
    this.comunicadosGrupales = alertas.map(a => ({
      id: a.id,
      remitenteNombre: 'Marcela Soto Valenzuela (Profesora Jefe)',
      curso: '1° Básico B',
      fecha: a.fecha_creacion || 'Hoy',
      titulo: a.titulo,
      contenido: a.contenido || a.mensaje || '',
      tipo: a.tipo || 'informativa',
      estado: a.estado || 'PENDIENTE',
      fechaLectura: a.fecha_lectura || null,
      confirmado: a.estado === 'LEIDA' || Boolean(this.acuseStatus[a.id])
    }));

    const carolina = this.apoderadosCurso.find(x => x.id === 13);
    if (carolina) {
      if (alertas.length === 0) {
        carolina.confirmado = false;
        carolina.fechaAcuse = 'Sin alertas activas';
      } else {
        const readList = alertas.filter(a => a.estado === 'LEIDA' || Boolean(this.acuseStatus[a.id]));
        if (readList.length === alertas.length) {
          carolina.confirmado = true;
          carolina.fechaAcuse = readList[0].fecha_lectura || 'Confirmada';
        } else if (readList.length > 0) {
          carolina.confirmado = false;
          carolina.fechaAcuse = `${readList.length}/${alertas.length} leídas`;
        } else {
          carolina.confirmado = false;
          carolina.fechaAcuse = 'Pendiente';
        }
      }
    }
  },

  async cargarAlertasMovil(silent = false) {
    if (!window.mobileApi || !mobileApi.getAlertasUsuario) return;
    try {
      const alertasApi = await mobileApi.getAlertasUsuario(13);
      if (Array.isArray(alertasApi)) {
        const prevSnap = JSON.stringify(this.alertasLocales || []);
        this.alertasLocales = alertasApi.map(a => ({
          ...a,
          alumno: a.alumno || (this.selectedPupilIndex === 0 ? 'Mateo González (1° Básico B)' : 'Sofía González (2° Básico A)')
        }));
        this.syncComunicadosYAcusesDesdeAlertas();
        const nextSnap = JSON.stringify(this.alertasLocales || []);
        if (!silent || prevSnap !== nextSnap) {
          this.render();
        }
      }
    } catch (e) {
      console.warn('[Mobile] Error cargando alertas:', e);
    }
  },

  async cargarMensajesConversacion(convId, isBackground = false) {
    if (!window.mobileApi) return;
    const msgs = await mobileApi.getMensajes(convId);
    if (Array.isArray(msgs)) {
      const prevSnap = JSON.stringify(this.mensajesPorConversacion[convId] || []);
      const mapped = msgs.map(m => ({
        id: m.id,
        remitenteId: m.remitente_usuario_id,
        remitenteNombre: m.remitente_nombre,
        texto: m.contenido,
        hora: m.hora || 'Hoy',
        leido: Boolean(m.leido),
        esMio: this.currentUser ? Number(m.remitente_usuario_id) === Number(this.currentUser.id) : false
      }));
      this.mensajesPorConversacion[convId] = mapped;

      if (isBackground && prevSnap !== JSON.stringify(mapped)) {
        this.render();
        setTimeout(() => {
          const stream = document.getElementById('chat-stream');
          if (stream) stream.scrollTop = stream.scrollHeight;
        }, 40);
      }
    }
  },

  // -------------------------------------------------------------
  // Navegación
  // -------------------------------------------------------------
  setTab(tab) {
    this.currentTab = tab;
    this._resetScrollOnNextRender = true;
    this.mobileAlertSuccessMsg = '';
    this.mobileComSuccessMsg = '';
    if (tab === 'asignar' && this.isMobileTeacherAuthorized()) {
      this.cargarEstadoActividadesCursoMovil(true).then(() => this.render());
    } else if (tab === 'mensajeria') {
      this.cargarMensajesConversacion(this.activeConversacionId, true).then(() => this.render());
      this.cargarAlertasMovil(true);
    } else if (tab === 'alertas') {
      this.cargarAlertasMovil(false);
    }
    this.render();
  },

  setChatMode(mode) {
    this.chatMode = mode;
    this.mobileComSuccessMsg = '';
    this.render();
    if (mode === 'individual') {
      this.cargarMensajesConversacion(this.activeConversacionId, true).then(() => {
        const stream = document.getElementById('chat-stream');
        if (stream) stream.scrollTop = stream.scrollHeight;
      });
    } else if (mode === 'grupal') {
      this.cargarAlertasMovil(true);
    }
  },

  async selectMobileConversation(convId) {
    this.activeConversacionId = Number(convId) || 1;
    await this.cargarMensajesConversacion(this.activeConversacionId);
    this.render();
    setTimeout(() => {
      const stream = document.getElementById('chat-stream');
      if (stream) stream.scrollTop = stream.scrollHeight;
    }, 40);
  },

  async setPupil(index) {
    this.selectedPupilIndex = index;
    this.activeConversacionId = index === 0 ? 1 : 2;
    await this.cargarMensajesConversacion(this.activeConversacionId);
    await this.cargarReporteriaAlumno();
    this.render();
  },

  // -------------------------------------------------------------
  // Acciones de Alertas y Mensajería
  // -------------------------------------------------------------
  async confirmarAlerta(alertaId) {
    this.acuseStatus[alertaId] = true;
    const horaAhora = 'Hoy ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const a = this.alertasLocales.find(x => Number(x.id) === Number(alertaId));
    if (a) {
      a.estado = 'LEIDA';
      a.fecha_lectura = horaAhora;
    }
    this.syncComunicadosYAcusesDesdeAlertas();
    this.render();

    if (window.mobileApi) {
      await mobileApi.confirmarAlerta(alertaId);
      await this.cargarAlertasMovil(true);
    }
    this.render();
  },

  async emitirAvisoReforzamiento(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (this.isSendingMobileAlert) return;

    const tituloInput = document.getElementById('aviso-titulo');
    const descInput = document.getElementById('aviso-desc');
    const tipoSelect = document.getElementById('aviso-tipo');

    if (!tituloInput || !descInput) return;
    const titulo = tituloInput.value.trim();
    const contenido = descInput.value.trim();
    const tipo = tipoSelect ? tipoSelect.value : 'urgente';

    if (!titulo || !contenido) {
      alert('Por favor completa el título y la descripción del aviso.');
      return;
    }

    this.isSendingMobileAlert = true;
    this.mobileAlertSuccessMsg = '';
    this.render();

    try {
      if (window.mobileApi) {
        await mobileApi.emitirAlerta(13, tipo, titulo, contenido);
        await this.cargarAlertasMovil(true);
      }
      this.mobileAlertSuccessMsg = `Alerta "${titulo}" emitida y visible en la bandeja del apoderado.`;
    } catch (err) {
      console.warn('[Mobile] Error emitiendo alerta:', err);
    } finally {
      this.isSendingMobileAlert = false;
      this.render();
    }
  },

  async vaciarAlertasMovil() {
    if (!this.isMobileTeacherAuthorized() || !window.mobileApi) return;
    await mobileApi.limpiarAlertas();
    this.acuseStatus = {};
    await this.cargarAlertasMovil(true);
    this.mobileAlertSuccessMsg = 'Historial de alertas vaciado correctamente.';
    this.render();
  },

  async enviarMensajeDirecto(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (this.isSendingMobileMsg) return;

    const input = document.getElementById('chat-directo-input');
    if (!input || !input.value.trim()) return;

    const texto = input.value.trim();
    input.value = '';

    const convId = this.activeConversacionId || 1;
    if (!this.mensajesPorConversacion[convId]) {
      this.mensajesPorConversacion[convId] = [];
    }

    const nuevoMsg = {
      id: Date.now(),
      remitenteId: this.currentUser.id,
      remitenteNombre: this.currentUser.name,
      texto: texto,
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      leido: false,
      esMio: true
    };
    this.mensajesPorConversacion[convId].push(nuevoMsg);
    this.isSendingMobileMsg = true;
    this.render();

    try {
      if (window.mobileApi) {
        await mobileApi.enviarMensaje(convId, this.currentUser.id, texto);
        await this.cargarMensajesConversacion(convId);
      }
    } finally {
      this.isSendingMobileMsg = false;
      this.render();
      setTimeout(() => {
        const stream = document.getElementById('chat-stream');
        if (stream) stream.scrollTop = stream.scrollHeight;
      }, 50);
    }
  },

  async confirmarLecturaComunicado(comunicadoId) {
    await this.confirmarAlerta(comunicadoId);
  },

  async publicarComunicadoGrupal(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (this.isSendingMobileAlert) return;

    const titEl = document.getElementById('comunicado-titulo');
    const contEl = document.getElementById('comunicado-contenido');
    if (!titEl || !contEl) return;

    const tit = titEl.value.trim();
    const cont = contEl.value.trim();
    if (!tit || !cont) {
      alert('Ingresa el título y contenido del comunicado.');
      return;
    }

    this.isSendingMobileAlert = true;
    this.mobileComSuccessMsg = '';
    this.render();

    try {
      if (window.mobileApi) {
        await mobileApi.emitirAlerta(13, 'informativa', tit, cont);
        await this.cargarAlertasMovil(true);
      }
      this.mobileComSuccessMsg = `Comunicado "${tit}" publicado en la nube para todo el curso.`;
    } catch (err) {
      console.warn('[Mobile] Error publicando comunicado:', err);
    } finally {
      this.isSendingMobileAlert = false;
      this.render();
    }
  },

  // -------------------------------------------------------------
  // [REQ-01] Configuración Dinámica de Endpoint y Prueba de Conexión LAN
  // -------------------------------------------------------------
  getActiveServerInputValue() {
    const modalInput = document.getElementById('cfg-api-url-modal');
    if (modalInput && modalInput.value && modalInput.value.trim()) {
      return modalInput.value.trim();
    }
    const tabInput = document.getElementById('cfg-api-url-tab');
    if (tabInput && tabInput.value && tabInput.value.trim()) {
      return tabInput.value.trim();
    }
    const legacyInput = document.getElementById('cfg-api-url');
    if (legacyInput && legacyInput.value && legacyInput.value.trim()) {
      return legacyInput.value.trim();
    }
    return window.mobileApi ? mobileApi.getServerHostUrl() : 'https://educonnect-capstone-2026-8f776.web.app';
  },

  async testConnection(candidateUrl) {
    let rawUrl = candidateUrl ? String(candidateUrl).trim() : this.getActiveServerInputValue();
    
    // Auto-sanitización de URL
    if (rawUrl) {
      rawUrl = rawUrl.trim();
      if (!/^https?:\/\//i.test(rawUrl)) {
        rawUrl = 'https://' + rawUrl;
      }
    }

    if (window.mobileApi && rawUrl) {
      mobileApi.setBaseUrl(rawUrl);
    }

    this.isTestingConnection = true;
    this.testServerConnectionStatus = 'testing';
    this.testServerConnectionMessage = 'Probando conexión con la nube...';
    this.render();

    try {
      const result = await Promise.race([
        mobileApi.checkHealth(rawUrl),
        new Promise((resolve) => setTimeout(() => resolve({ success: false, error: 'Timeout' }), 4200))
      ]);

      this.isTestingConnection = false;

      if (result && result.success) {
        const activeHost = result.host || (window.mobileApi ? mobileApi.getServerHostUrl() : rawUrl);
        this.testServerConnectionStatus = 'success';
        this.testServerConnectionMessage = `Conectado con éxito (${activeHost})`;
        this.render();

        if (this.currentUser) {
          this.cargarDatosUsuario().catch(() => {});
        }
        return;
      } else {
        this.testServerConnectionStatus = 'error';
        this.testServerConnectionMessage = 'Error de conexión: verifique su conexión a internet';
      }
    } catch (err) {
      this.isTestingConnection = false;
      this.testServerConnectionStatus = 'error';
      this.testServerConnectionMessage = 'Error de conexión: verifique su conexión a internet';
    }
    this.render();
  },

  async saveServerUrl(e) {
    if (e && e.preventDefault) e.preventDefault();
    const url = this.getActiveServerInputValue();
    if (window.mobileApi && url) {
      mobileApi.setBaseUrl(url);
      await this.testConnection(url);
    }
  },

  async selectHostPreset(url) {
    const modalInput = document.getElementById('cfg-api-url-modal');
    if (modalInput) modalInput.value = url;
    const tabInput = document.getElementById('cfg-api-url-tab');
    if (tabInput) tabInput.value = url;
    if (window.mobileApi) {
      mobileApi.setBaseUrl(url);
    }
    await this.testConnection(url);
  },

  async responderConTextoManual(txt) {
    this.detenerGrabacionVoz();
    await this.procesarRespuestaNino(txt);
  },

  // -------------------------------------------------------------
  // Render Principal de la Aplicación Móvil
  // -------------------------------------------------------------
  render() {
    const root = document.getElementById('mobile-root');
    if (!root) return;

    const prevMain = root.querySelector('main');
    const prevMainScroll = prevMain ? prevMain.scrollTop : 0;
    const prevWinScroll = window.scrollY || document.documentElement.scrollTop || 0;
    const prevChatStream = document.getElementById('chat-stream');
    const prevChatScroll = prevChatStream ? prevChatStream.scrollTop : null;
    const prevModalBody = document.getElementById('mobile-review-modal-body');
    const prevModalScroll = prevModalBody ? prevModalBody.scrollTop : null;

    if (!this.currentUser) {
      root.innerHTML = this.renderLoginView();
    } else if (this.currentUser.role === 'alumno' && this.activeChildActivity) {
      // [REQ-03, REQ-04, REQ-05] Pantalla de Actividad Infantil 100% por Voz con Robot Leo Central
      root.innerHTML = this.renderPantallaActividadInfantil();
    } else if (this.currentUser.role === 'alumno') {
      // [REQ-02] Bandeja de Actividades Asignadas al Estudiante
      root.innerHTML = `
        ${this.renderHeader()}
        <main class="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-10">
          ${this.renderBandejaActividadesAlumno()}
        </main>
      `;
    } else {
      if (this.currentTab === 'asignar' && !this.isMobileTeacherAuthorized()) {
        this.currentTab = 'mensajeria';
        this.activeTeacherReview = null;
        this.isMobileAssignModalOpen = false;
      }
      root.innerHTML = `
        ${this.renderHeader()}
        <main class="flex-1 overflow-y-auto px-4 py-3 space-y-3 pb-24">
          ${this.currentTab === 'mensajeria' ? this.renderMensajeriaTab() : ''}
          ${this.currentTab === 'asignar' && this.isMobileTeacherAuthorized() ? this.renderAsignarTab() : ''}
          ${this.currentTab === 'alertas' ? this.renderAlertasTab() : ''}
          ${this.currentTab === 'dashboard' ? this.renderDashboardTab() : ''}
          ${this.currentTab === 'config' ? this.renderConfigTab() : ''}
        </main>
        ${this.renderBottomNavigation()}
      `;
    }

    if (this.showServerModal) {
      root.insertAdjacentHTML('beforeend', this.renderServerModal());
    }

    if (this.showPhotoModal && this.canEditProfilePhoto()) {
      root.insertAdjacentHTML('beforeend', this.renderMobilePhotoModal());
    }

    if (window.lucide) {
      lucide.createIcons();
    }

    if (this.isMobileAssignModalOpen && this.isMobileTeacherAuthorized()) {
      setTimeout(() => this.ensureMobileAssignDialogShown(), 0);
    }

    if (this._resetScrollOnNextRender) {
      this._resetScrollOnNextRender = false;
      const nextMain = root.querySelector('main');
      if (nextMain) nextMain.scrollTop = 0;
      window.scrollTo(0, 0);
    } else {
      const nextMain = root.querySelector('main');
      if (nextMain && prevMainScroll > 0) {
        nextMain.scrollTop = prevMainScroll;
      }
      if (prevWinScroll > 0) {
        window.scrollTo(0, prevWinScroll);
      }
      const nextChatStream = document.getElementById('chat-stream');
      if (nextChatStream && prevChatScroll !== null) {
        nextChatStream.scrollTop = prevChatScroll;
      }
      const nextModalBody = document.getElementById('mobile-review-modal-body');
      if (nextModalBody && prevModalScroll !== null) {
        nextModalBody.scrollTop = prevModalScroll;
      }
    }
  },

  // -------------------------------------------------------------
  // [REQ-01 & REQ-02] Pantalla de Bienvenida (Login) con Engranaje y Acceso Alumno
  // -------------------------------------------------------------
  renderLoginView() {
    const isOnline = window.mobileApi && mobileApi.isOnline;
    return `
      <div class="flex-1 flex flex-col justify-between p-6 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white safe-top-padding">
        <div class="space-y-5 pt-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-lg">
                <i data-lucide="bot" class="w-7 h-7"></i>
              </div>
              <div>
                <h1 class="font-black text-xl text-white tracking-tight">EduConnect</h1>
                <p class="text-[11px] text-amber-300 font-bold uppercase tracking-wider">Colegio San Andrés • 1° y 2° Básico</p>
              </div>
            </div>
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black ${isOnline ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'}">
              <span class="w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}"></span>
              ${isOnline ? 'En línea' : 'Respaldo'}
            </span>
          </div>

          <div class="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
            <h2 class="text-sm font-black text-white">Acceso Institucional Seguro</h2>
            <p class="text-xs text-slate-300 leading-relaxed">Ingresa con tu correo y contraseña institucional de estudiante, apoderado o docente.</p>
          </div>

          ${this.errorMessage ? `
            <div class="p-3.5 rounded-xl bg-rose-500/20 border border-rose-400/30 text-rose-200 text-xs font-semibold flex items-center gap-2">
              <i data-lucide="alert-circle" class="w-4 h-4 flex-shrink-0 text-rose-400"></i>
              <span>${this.errorMessage}</span>
            </div>
          ` : ''}

          <!-- Formulario Credenciales Institucionales -->
          <form onsubmit="app.handleLoginForm(event)" class="space-y-3.5 pt-2">
            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1.5">Correo Institucional</label>
              <input id="mob-email" type="email" required autocomplete="username" placeholder="usuario@sanandres.cl" class="w-full px-3.5 py-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 placeholder-slate-500 transition">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1.5">Contraseña</label>
              <input id="mob-password" type="password" required autocomplete="current-password" placeholder="••••••••" class="w-full px-3.5 py-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 placeholder-slate-500 transition">
            </div>
            <button type="submit" class="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition flex items-center justify-center gap-2 cursor-pointer">
              <i data-lucide="log-in" class="w-4 h-4"></i>
              <span>Iniciar Sesión</span>
            </button>
          </form>
        </div>

        <div class="pt-3 text-center text-[11px] text-slate-500">
          EduConnect • Plataforma Escolar Segura
        </div>
      </div>
    `;
  },

  renderHeader() {
    const isOnline = window.mobileApi && mobileApi.isOnline;
    const isProf = this.currentUser.role === 'profesora';
    const isAdmin = this.currentUser.role === 'admin';
    const isAlumno = this.currentUser.role === 'alumno';
    const badgeColor = isAlumno
      ? 'bg-amber-400/20 text-amber-300 border-amber-400/30'
      : (isProf
        ? 'bg-blue-500/20 text-blue-300 border-blue-400/30'
        : (isAdmin ? 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'));
    const roleChipLabel = isProf ? 'Docente' : (isAdmin ? 'Director' : 'Apoderado');
    const firstName = (this.currentUser && this.currentUser.name) ? this.currentUser.name.split(' ')[0] : 'Mateo';
    const avatarUrl = !isAlumno ? this.getUserAvatarUrl(this.currentUser) : '';
    const defaultAvatarUrl = !isAlumno ? this.getDefaultAvatarUrl(this.currentUser) : '';

    return `
      <header class="bg-slate-900 text-white px-4 py-3 border-b border-slate-800 sticky top-0 z-30 flex-shrink-0 shadow-md safe-top-padding">
        <div class="flex items-center justify-between gap-3">
          ${isAlumno ? `
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 min-w-[48px] min-h-[48px] rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md flex-shrink-0">
                <i data-lucide="bot" class="w-7 h-7"></i>
              </div>
              <div>
                <h2 class="font-black text-lg text-white tracking-wide leading-none">${firstName}</h2>
              </div>
            </div>
          ` : `
            <div class="flex items-center gap-2.5">
              <button
                type="button"
                onclick="app.openMobilePhotoModal()"
                title="Cambiar foto de perfil"
                class="relative w-11 h-11 rounded-xl overflow-visible flex-shrink-0 cursor-pointer transition active:scale-95 group"
              >
                <img
                  src="${avatarUrl}"
                  alt="${this.currentUser.name}"
                  onerror="this.src='${defaultAvatarUrl}'"
                  class="w-11 h-11 rounded-xl object-cover border-2 border-slate-700 group-hover:border-amber-400 shadow-xs"
                />
                <span class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-400 text-slate-950 border-2 border-slate-900 flex items-center justify-center shadow-xs">
                  <i data-lucide="camera" class="w-2.5 h-2.5"></i>
                </span>
              </button>
              <div>
                <div class="flex items-center gap-1.5 flex-wrap">
                  <h2 class="font-black text-sm text-white">${this.currentUser.name}</h2>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${badgeColor}">
                    ${roleChipLabel}
                  </span>
                </div>
                <p class="text-[11px] text-slate-400 font-medium">${this.currentUser.rolLabel}</p>
              </div>
            </div>
          `}
          <div class="flex items-center gap-2">
            <button 
              type="button"
              onclick="app.showServerModal = true; app.render();" 
              title="Configurar Servidor LAN" 
              class="w-12 h-12 min-w-[48px] min-h-[48px] rounded-2xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition active:scale-95 cursor-pointer shadow-sm flex-shrink-0"
            >
              <i data-lucide="settings" class="w-5 h-5 ${isOnline ? 'text-emerald-400' : 'text-amber-400'}"></i>
            </button>
            <button 
              type="button"
              onclick="app.logout()" 
              title="Cerrar Sesión" 
              class="w-12 h-12 min-w-[48px] min-h-[48px] rounded-2xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-rose-400 flex items-center justify-center transition active:scale-95 cursor-pointer shadow-sm flex-shrink-0"
            >
              <i data-lucide="log-out" class="w-5 h-5"></i>
            </button>
          </div>
        </div>

        ${this.currentUser.role === 'apoderado' && Array.isArray(this.currentUser.pupils) ? `
          <div class="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <span class="text-slate-400 text-[11px] font-bold">Estudiante activo:</span>
            <div class="flex items-center gap-1.5">
              <button onclick="app.setPupil(0)" class="px-3 py-1.5 min-h-[40px] rounded-xl text-xs font-bold transition flex items-center ${this.selectedPupilIndex === 0 ? 'bg-amber-400 text-slate-950 font-black shadow-xs' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">
                Mateo (1° B)
              </button>
              <button onclick="app.setPupil(1)" class="px-3 py-1.5 min-h-[40px] rounded-xl text-xs font-bold transition flex items-center ${this.selectedPupilIndex === 1 ? 'bg-amber-400 text-slate-950 font-black shadow-xs' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">
                Sofía (2° A)
              </button>
            </div>
          </div>
        ` : ''}
      </header>
    `;
  },

  // -------------------------------------------------------------
  // [REQ-02] Bandeja de Actividades Asignadas al Estudiante (Mateo)
  // Menú Visual e Infantil: Ahorro máximo de textos, íconos grandes interactivos.
  // -------------------------------------------------------------
  getActivityCardVisual(act) {
    const id = act.id || '';
    const type = act.activityType || '';
    const isMath = (act.subject || '').toLowerCase().includes('matem');

    let shortTitle = act.title;
    let iconContent = '';
    let iconBgClass = 'bg-amber-400 text-slate-950';
    let borderClass = 'border-amber-300';
    let starsCount = 5;

    if (id === 'act-conteo' || type === 'counting') {
      shortTitle = 'Contar del 1 al 10';
      starsCount = 10;
      iconBgClass = 'bg-gradient-to-tr from-amber-400 via-amber-300 to-yellow-300 text-slate-950 border-2 border-white shadow-inner';
      borderClass = 'border-amber-300 hover:border-amber-400';
      iconContent = `
        <div class="w-7 h-7 flex items-center justify-center font-black text-xs tracking-tight select-none">
          1 2 3
        </div>
      `;
    } else if (id === 'act-mat-2' || (type === 'addition')) {
      shortTitle = 'Sumas hasta 10';
      iconBgClass = 'bg-gradient-to-tr from-blue-500 via-blue-600 to-indigo-500 text-white border-2 border-white shadow-inner';
      borderClass = 'border-blue-300 hover:border-blue-400';
      iconContent = `
        <div class="w-7 h-7 flex items-center justify-center font-black text-2xl leading-none select-none">
          +
        </div>
      `;
    } else if (id === 'act-db-9' || (type === 'subtraction')) {
      shortTitle = 'Restas hasta 10';
      iconBgClass = 'bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-400 text-white border-2 border-white shadow-inner';
      borderClass = 'border-rose-300 hover:border-rose-400';
      iconContent = `
        <div class="w-7 h-7 flex items-center justify-center font-black text-2xl leading-none select-none">
          −
        </div>
      `;
    } else if (id === 'act-len-1') {
      shortTitle = 'Sílabas MA • PA';
      iconBgClass = 'bg-gradient-to-tr from-purple-500 via-purple-600 to-violet-500 text-white border-2 border-white shadow-inner';
      borderClass = 'border-purple-300 hover:border-purple-400';
      iconContent = `
        <div class="w-7 h-7 flex items-center justify-center font-black text-xs leading-none select-none tracking-tight">
          MA
        </div>
      `;
    } else if (id === 'act-len-2' || type === 'story_comprehension') {
      shortTitle = 'Cuento del Conejo';
      starsCount = 3;
      iconBgClass = 'bg-gradient-to-tr from-emerald-500 via-teal-500 to-emerald-400 text-white border-2 border-white shadow-inner';
      borderClass = 'border-emerald-300 hover:border-emerald-400';
      iconContent = `
        <div class="w-7 h-7 flex items-center justify-center">
          <i data-lucide="book-open" class="w-7 h-7"></i>
        </div>
      `;
    } else if (id === 'act-db-5') {
      shortTitle = 'Sonido Letra M';
      iconBgClass = 'bg-gradient-to-tr from-indigo-500 via-indigo-600 to-sky-400 text-white border-2 border-white shadow-inner';
      borderClass = 'border-indigo-300 hover:border-indigo-400';
      iconContent = `
        <div class="w-7 h-7 flex items-center justify-center font-black text-xl leading-none select-none">
          M
        </div>
      `;
    } else {
      iconBgClass = 'bg-amber-400 text-slate-950 border-2 border-white';
      iconContent = `
        <div class="w-7 h-7 flex items-center justify-center">
          <i data-lucide="sparkles" class="w-7 h-7"></i>
        </div>
      `;
    }

    const subjectBadge = isMath
      ? `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-100 text-blue-900 border border-blue-200"><i data-lucide="calculator" class="w-3.5 h-3.5"></i> Matemáticas</span>`
      : `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-purple-100 text-purple-900 border border-purple-200"><i data-lucide="book-open" class="w-3.5 h-3.5"></i> Lenguaje</span>`;

    return {
      shortTitle,
      iconContent,
      iconBgClass,
      borderClass,
      subjectBadge,
      starsCount,
      isMath
    };
  },

  renderBandejaActividadesAlumno() {
    const filter = this.studentActivityFilter || 'all';
    const filteredList = this.studentActivitiesList.filter(act => {
      if (filter === 'mat') return (act.subject || '').toLowerCase().includes('matem');
      if (filter === 'len') return !(act.subject || '').toLowerCase().includes('matem');
      return true;
    });
    const firstName = (this.currentUser && this.currentUser.name) ? this.currentUser.name.split(' ')[0] : 'Mateo';

    return `
      <div class="space-y-4">
        <!-- Saludo Visual con Avatar Robot Leo Destacado y Prominente -->
        <div class="p-4 rounded-3xl bg-gradient-to-r from-indigo-800 via-blue-700 to-indigo-800 text-white shadow-md flex items-center justify-between gap-3 border border-indigo-500/40">
          <div class="flex items-center gap-3.5">
            <!-- Avatar Robot Leo de gran tamaño y prominencia (64x64 px) -->
            <div class="w-16 h-16 min-w-[64px] min-h-[64px] rounded-3xl bg-gradient-to-tr from-amber-400 via-amber-300 to-yellow-300 text-slate-950 flex items-center justify-center flex-shrink-0 shadow-lg ring-4 ring-amber-400/30">
              <i data-lucide="bot" class="w-10 h-10"></i>
            </div>
            <div>
              <h3 class="text-lg font-black text-white leading-tight">¡Hola ${firstName}!</h3>
              <p class="text-xs text-blue-200 font-medium pt-0.5">Toca para jugar conmigo</p>
            </div>
          </div>

          <!-- Botón de Audio Accesible (mínimo 48x48 px) -->
          <button 
            type="button"
            onclick="event.stopPropagation(); if (window.mobileApi) mobileApi.speakText('¡Hola ${firstName}! Toca cualquier tarjeta para jugar conmigo.');"
            title="Escuchar saludo"
            class="w-12 h-12 min-w-[48px] min-h-[48px] rounded-2xl bg-amber-400/20 hover:bg-amber-400 text-amber-300 hover:text-slate-950 border border-amber-400/30 flex items-center justify-center transition active:scale-95 cursor-pointer shadow-xs flex-shrink-0"
          >
            <i data-lucide="volume-2" class="w-6 h-6"></i>
          </button>
        </div>

        <!-- Barra Homogénea de Filtros (Todos, Matemáticas, Lenguaje) con Dimensiones Proporcionales sin Desbordes -->
        <div class="grid grid-cols-[0.85fr_1.3fr_1.05fr] gap-1.5 bg-slate-200/90 p-1 rounded-2xl border border-slate-300 shadow-inner">
          <button 
            type="button"
            onclick="app.studentActivityFilter = 'all'; app.render();" 
            title="Todas las actividades"
            class="h-11 min-h-[44px] min-w-0 px-2 rounded-xl text-[11px] font-black transition flex items-center justify-center gap-1 active:scale-95 cursor-pointer ${filter === 'all' ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300' : 'bg-white/70 text-slate-700 hover:bg-white hover:text-slate-900'}"
          >
            <i data-lucide="layout-grid" class="w-4 h-4 flex-shrink-0"></i>
            <span class="tracking-tight whitespace-nowrap">Todos</span>
          </button>
          <button 
            type="button"
            onclick="app.studentActivityFilter = 'mat'; app.render();" 
            title="Matemáticas"
            class="h-11 min-h-[44px] min-w-0 px-2 rounded-xl text-[11px] font-black transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer ${filter === 'mat' ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300' : 'bg-white/70 text-slate-700 hover:bg-white hover:text-slate-900'}"
          >
            <i data-lucide="calculator" class="w-4 h-4 flex-shrink-0"></i>
            <span class="tracking-tight whitespace-nowrap">Matemáticas</span>
          </button>
          <button 
            type="button"
            onclick="app.studentActivityFilter = 'len'; app.render();" 
            title="Lenguaje"
            class="h-11 min-h-[44px] min-w-0 px-2 rounded-xl text-[11px] font-black transition flex items-center justify-center gap-1 active:scale-95 cursor-pointer ${filter === 'len' ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300' : 'bg-white/70 text-slate-700 hover:bg-white hover:text-slate-900'}"
          >
            <i data-lucide="book-open" class="w-4 h-4 flex-shrink-0"></i>
            <span class="tracking-tight whitespace-nowrap">Lenguaje</span>
          </button>
        </div>

        <!-- Lista de Tarjetas de Actividades con Contenedores Estandarizados (56x56 px) y Cero Códigos Administrativos -->
        <div class="space-y-3">
          ${filteredList.length === 0 ? `
            <div class="p-6 rounded-3xl bg-white border-2 border-dashed border-slate-300 text-center space-y-3 shadow-xs">
              <div class="w-16 h-16 mx-auto rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-inner">
                <i data-lucide="sparkles" class="w-8 h-8"></i>
              </div>
              <div class="space-y-1">
                <h4 class="font-black text-base text-slate-900">Aún no tienes tareas asignadas</h4>
                <p class="text-xs text-slate-600 font-medium leading-relaxed">
                  Tu profesora irá asignando las actividades una a una para jugar con Robot Leo.
                </p>
              </div>
              <button
                type="button"
                onclick="app.sincronizarActividadesAlumno().then(() => app.render())"
                class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-sm transition active:scale-95 cursor-pointer"
              >
                <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                <span>Actualizar Bandeja</span>
              </button>
            </div>
          ` : filteredList.map(act => {
            const visual = this.getActivityCardVisual(act);
            const isDone = act.status === 'Entregada';

            return `
              <div 
                onclick="app.iniciarActividadInfantil('${act.id}')"
                class="w-full p-3.5 rounded-3xl bg-white border-2 ${isDone ? 'border-emerald-400 bg-emerald-50/25' : visual.borderClass} shadow-xs hover:shadow-md active:scale-98 transition flex items-center justify-between gap-3 cursor-pointer"
              >
                <!-- Contenedor temático unificado exactamente a 56x56 px con glifo óptico 28x28 px -->
                <div class="w-14 h-14 min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px] rounded-2xl ${visual.iconBgClass} flex items-center justify-center flex-shrink-0 shadow-sm">
                  ${visual.iconContent}
                </div>

                <!-- Título corto e insignias visuales (cero códigos curriculares) -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1.5 mb-1">
                    ${visual.subjectBadge}
                    ${isDone ? `
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <i data-lucide="check" class="w-3 h-3"></i> Listo
                      </span>
                    ` : ''}
                  </div>
                  <h4 class="font-black text-base text-slate-900 leading-snug truncate">${visual.shortTitle}</h4>
                  
                  <!-- Estrellas visuales según cantidad de ejercicios -->
                  <div class="flex items-center gap-1 text-amber-400 pt-0.5">
                    ${Array.from({ length: Math.min(visual.starsCount, 5) }).map(() => `
                      <i data-lucide="star" class="w-3.5 h-3.5 ${isDone ? 'fill-amber-400 text-amber-500' : 'text-slate-300 fill-slate-200'}"></i>
                    `).join('')}
                    ${visual.starsCount > 5 ? `<span class="text-[10px] font-black text-amber-600 pl-0.5">x10</span>` : ''}
                  </div>
                </div>

                <!-- Contenedor de acción a la derecha estandarizado a 56x56 px (mismo tamaño y altura que ícono temático) -->
                <div class="w-14 h-14 min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px] rounded-2xl ${isDone ? 'bg-emerald-600 text-white' : 'bg-amber-400 text-slate-950'} flex items-center justify-center flex-shrink-0 shadow-md active:scale-95 transition">
                  <div class="w-7 h-7 flex items-center justify-center">
                    <i data-lucide="${isDone ? 'award' : 'play'}" class="w-6 h-6 fill-current ${isDone ? '' : 'ml-0.5'}"></i>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  // -------------------------------------------------------------
  // [REQ-03, REQ-04, REQ-05] Pantalla de Actividad Infantil 100% por Voz
  // Cero instrucciones escritas, Números extragrandes (28pt-36pt+),
  // Robot Leo ocupando 60-65% central, y Botón Semicircular Inferior (rounded-t-full)
  // -------------------------------------------------------------
  renderPantallaActividadInfantil() {
    const act = this.activeChildActivity;
    const exercises = (act && Array.isArray(act.exercises)) ? act.exercises : [];
    const total = exercises.length || 5;
    const currentEx = this.getCurrentExercise() || { number: 1, displayBigNumber: '1', itemType: 'apple', itemCount: 3 };
    const activeNum = this.currentExerciseIndex + 1;
    const isMicActive = Boolean(this.isRecordingVoice || this.robotState === 'listening');
    const stageBgClasses = isMicActive
      ? 'bg-gradient-to-b from-indigo-600 via-sky-100 to-white text-slate-900'
      : 'bg-gradient-to-b from-slate-800 via-indigo-800 to-blue-800 text-white';

    return `
      <div class="flex-1 flex flex-col justify-between ${stageBgClasses} transition-colors duration-500 h-full overflow-hidden relative select-none safe-top-padding">
        
        <!-- [REQ-04.5] Indicador Superior de Avance Numérico y Visual (Círculos/Estrellas con número activo en grande) -->
        <div class="px-4 pt-2 pb-1 flex items-center justify-between z-20">
          <button 
            type="button"
            onclick="app.detenerActividadInfantil()" 
            aria-label="Salir"
            class="w-12 h-12 min-w-[48px] min-h-[48px] rounded-2xl bg-slate-900/80 border border-white/25 text-white hover:bg-slate-900 flex items-center justify-center shadow-md active:scale-95 cursor-pointer flex-shrink-0"
          >
            <i data-lucide="arrow-left" class="w-6 h-6"></i>
          </button>

          <!-- Indicador numérico de progreso con números destacados -->
          <div class="flex items-center ${exercises.length > 5 ? 'gap-1' : 'gap-2'}">
            ${exercises.map((exItem, idx) => {
              const stepNum = idx + 1;
              const isCurrent = idx === this.currentExerciseIndex && !this.isActivityCompletedCelebration;
              const isCompleted = this.completedExercises.includes(idx) || this.isActivityCompletedCelebration;
              const sizeClasses = exercises.length > 5
                ? (isCurrent ? 'w-8 h-8 bg-amber-400 text-slate-950 text-base ring-2 ring-amber-300/60 shadow-lg scale-110' : (isCompleted ? 'w-6 h-6 bg-emerald-500 text-white text-xs shadow-xs' : 'w-6 h-6 bg-slate-800 text-slate-400 border border-slate-700 text-xs'))
                : (isCurrent ? 'w-12 h-12 bg-amber-400 text-slate-950 text-2xl ring-4 ring-amber-300/50 shadow-lg scale-110' : (isCompleted ? 'w-9 h-9 bg-emerald-500 text-white text-base shadow-sm' : 'w-9 h-9 bg-slate-800 text-slate-400 border border-slate-700 text-base'));
              return `
                <div class="flex items-center justify-center rounded-full font-black transition-all ${sizeClasses}">
                  ${stepNum}
                </div>
              `;
            }).join('')}
          </div>

          <!-- [REQ-04.3] Botón Visible con Ícono de Parlante junto al Robot para "Volver a escuchar la pregunta" -->
          <button 
            type="button"
            onclick="app.repetirPreguntaVoz()" 
            aria-label="Volver a escuchar la pregunta"
            title="Volver a escuchar la pregunta"
            class="w-12 h-12 min-w-[48px] min-h-[48px] rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center shadow-lg ring-2 ring-amber-200 active:scale-95 transition cursor-pointer flex-shrink-0"
          >
            <i data-lucide="volume-2" class="w-7 h-7"></i>
          </button>
        </div>

        <!-- [REQ-03.1] Área Central Dominante (60% a 65% vertical) con Avatar "Robot Leo" y Proyección en el Pecho -->
        <div class="h-[64vh] min-h-[410px] max-h-[560px] w-full flex flex-col items-center justify-center relative px-2 z-10">
          ${this.renderRobotLeoSvgWithStimulus(currentEx)}
        </div>

        <!-- [REQ-05.1, 05.2, 05.3, 05.4, 05.5] Botón Semicircular Inferior (rounded-t-full) 100% por Voz -->
        <div class="w-full pt-2 flex flex-col items-center justify-end z-20">
          <button 
            type="button"
            onclick="app.toggleGrabacionVozInfantil()"
            aria-label="Responder con voz"
            class="w-full h-28 rounded-t-full ${
              this.isActivityCompletedCelebration
                ? 'bg-amber-400 hover:bg-amber-300'
                : (this.isRecordingVoice
                  ? 'bg-emerald-500 hover:bg-emerald-600 ring-8 ring-emerald-400/40'
                  : 'bg-blue-600 hover:bg-blue-700')
            } shadow-[0_-10px_30px_rgba(37,99,235,0.35)] transition-all active:scale-95 flex flex-col items-center justify-center relative overflow-hidden cursor-pointer border-t-4 border-white/30"
          >
            ${this.isRecordingVoice ? `
              <!-- [REQ-05.5] Pulso visual de grabación activo -->
              <span class="absolute w-24 h-24 rounded-full bg-white/30 animate-ping"></span>
              <span class="absolute w-36 h-36 rounded-full bg-white/15 animate-pulse"></span>
            ` : ''}

            <div class="relative z-10 w-16 h-16 rounded-full ${this.isActivityCompletedCelebration ? 'bg-slate-950 text-amber-400' : 'bg-white/20 text-white'} flex items-center justify-center shadow-inner">
              <i data-lucide="${this.isActivityCompletedCelebration ? 'check' : 'mic'}" class="w-10 h-10 ${this.isActivityCompletedCelebration ? 'text-amber-400' : 'text-white'}"></i>
            </div>
          </button>
        </div>

      </div>
    `;
  },

  // Renderiza el Avatar "Robot Leo" en estilo Duolingo Flat 2.5D con ojos expresivos, estrellas y estímulo en su pecho
  renderRobotLeoSvgWithStimulus(currentEx) {
    const state = this.robotState || 'guiding';
    const isSpeaking = state === 'speaking';
    const isListening = state === 'listening';
    const isCelebrating = state === 'celebrating' || this.isActivityCompletedCelebration;
    const isGuiding = state === 'guiding';

    const stateClass = `leo-state-${isCelebrating ? 'celebrating' : state}`;
    const antennaBulbColor = isListening ? '#58cc02' : (isCelebrating ? '#ffc800' : '#1cb0f6');

    // Brazos estilo Duolingo con guantes redondeados amarillos
    let armsSvg = '';
    if (isCelebrating) {
      // Brazos arriba celebrando con emoción
      armsSvg = `
        <path d="M 66 226 Q 22 160 42 108" fill="none" stroke="#1cb0f6" stroke-width="20" stroke-linecap="round" />
        <circle cx="42" cy="106" r="16" fill="#ffc800" stroke="#0f172a" stroke-width="4.5" />
        <path d="M 334 226 Q 378 160 358 108" fill="none" stroke="#1cb0f6" stroke-width="20" stroke-linecap="round" />
        <circle cx="358" cy="106" r="16" fill="#ffc800" stroke="#0f172a" stroke-width="4.5" />
      `;
    } else if (isGuiding) {
      // Manos amables señalando hacia el pecho
      armsSvg = `
        <path d="M 66 232 Q 26 268 82 292" fill="none" stroke="#1cb0f6" stroke-width="20" stroke-linecap="round" />
        <circle cx="86" cy="294" r="15" fill="#ffc800" stroke="#0f172a" stroke-width="4.5" />
        <path d="M 334 232 Q 374 268 318 292" fill="none" stroke="#1cb0f6" stroke-width="20" stroke-linecap="round" />
        <circle cx="314" cy="294" r="15" fill="#ffc800" stroke="#0f172a" stroke-width="4.5" />
      `;
    } else {
      // Postura atenta / reposo a los lados
      armsSvg = `
        <path d="M 66 232 Q 28 252 40 294" fill="none" stroke="#1cb0f6" stroke-width="20" stroke-linecap="round" />
        <circle cx="40" cy="298" r="15" fill="#ffc800" stroke="#0f172a" stroke-width="4.5" />
        <path d="M 334 232 Q 372 252 360 294" fill="none" stroke="#1cb0f6" stroke-width="20" stroke-linecap="round" />
        <circle cx="360" cy="298" r="15" fill="#ffc800" stroke="#0f172a" stroke-width="4.5" />
      `;
    }

    // Boca expresiva estilo Duolingo
    let mouthSvg = '';
    if (isSpeaking) {
      mouthSvg = `
        <g class="leo-mouth-anim" style="transform-box: fill-box; transform-origin: center;">
          <path d="M 166 138 Q 200 168 234 138 Z" fill="#7f1d1d" stroke="#0f172a" stroke-width="3.5" />
          <path d="M 172 138 L 228 138 Q 200 148 172 138" fill="#ffffff" />
          <path d="M 184 156 Q 200 148 216 156 Q 200 168 184 156" fill="#ff86a8" />
        </g>
      `;
    } else if (isCelebrating) {
      // Gran sonrisa abierta con dientes y lengua alegre
      mouthSvg = `
        <path d="M 162 134 Q 200 176 238 134 Z" fill="#7f1d1d" stroke="#0f172a" stroke-width="4" />
        <path d="M 168 134 L 232 134 Q 200 146 168 134" fill="#ffffff" />
        <path d="M 180 156 Q 200 144 220 156 Q 200 174 180 156" fill="#ff86a8" />
      `;
    } else if (isListening) {
      // Boquita atenta 'o'
      mouthSvg = `
        <circle cx="200" cy="148" r="11" fill="#0f172a" stroke="#ffffff" stroke-width="3" />
      `;
    } else {
      // Sonrisa amable de confianza estilo Duolingo
      mouthSvg = `
        <path d="M 172 140 Q 200 162 228 140" fill="none" stroke="#38bdf8" stroke-width="5.5" stroke-linecap="round" />
      `;
    }

    // Ojos estilo Duolingo: Con ojos de estrellas multicolores al celebrar (inspirados en Zari)
    let eyesSvg = '';
    if (isCelebrating) {
      // Ojos de estrellas multicolores (inspirados directamente en la imagen de Duolingo)
      eyesSvg = `
        <!-- Ojo Izquierdo Celebrando: Remolino de color y estrella central -->
        <circle cx="154" cy="108" r="24" fill="#ff9600" stroke="#0f172a" stroke-width="4.5" />
        <circle cx="154" cy="108" r="17" fill="#ff4b4b" />
        <circle cx="154" cy="108" r="11" fill="#ffc800" />
        <!-- Estrella blanca resplandeciente central ✦ -->
        <polygon points="154,97 156,105 165,108 156,111 154,119 152,111 143,108 152,105" fill="#ffffff" />
        <circle cx="162" cy="101" r="2.5" fill="#ffffff" />

        <!-- Ojo Derecho Celebrando: Remolino de color y estrella central -->
        <circle cx="246" cy="108" r="24" fill="#1cb0f6" stroke="#0f172a" stroke-width="4.5" />
        <circle cx="246" cy="108" r="17" fill="#58cc02" />
        <circle cx="246" cy="108" r="11" fill="#7928ca" />
        <!-- Estrella blanca resplandeciente central ✦ -->
        <polygon points="246,97 248,105 257,108 248,111 246,119 244,111 235,108 244,105" fill="#ffffff" />
        <circle cx="254" cy="101" r="2.5" fill="#ffffff" />
      `;
    } else {
      // Ojos grandes, expresivos y caricaturescos con destello de estrella estilo Duolingo
      const pupilShiftX = isListening ? -2 : 0;
      const pupilShiftY = isListening ? -2 : 0;
      eyesSvg = `
        <!-- Ojo Izquierdo -->
        <circle cx="154" cy="108" r="24" fill="#ffffff" stroke="#0f172a" stroke-width="4.5" />
        <circle cx="${154 + pupilShiftX}" cy="${108 + pupilShiftY}" r="16" fill="#1cb0f6" />
        <circle cx="${154 + pupilShiftX}" cy="${108 + pupilShiftY}" r="10" fill="#0f172a" />
        <!-- Brillo estelar característico ✦ -->
        <polygon points="${150 + pupilShiftX},${102 + pupilShiftY} ${152 + pupilShiftX},${105 + pupilShiftY} ${155 + pupilShiftX},${106 + pupilShiftY} ${152 + pupilShiftX},${107 + pupilShiftY} ${150 + pupilShiftX},${110 + pupilShiftY} ${148 + pupilShiftX},${107 + pupilShiftY} ${145 + pupilShiftX},${106 + pupilShiftY} ${148 + pupilShiftX},${105 + pupilShiftY}" fill="#ffffff" />
        <circle cx="${158 + pupilShiftX}" cy="${113 + pupilShiftY}" r="3.5" fill="#ffffff" />

        <!-- Ojo Derecho -->
        <circle cx="246" cy="108" r="24" fill="#ffffff" stroke="#0f172a" stroke-width="4.5" />
        <circle cx="${246 + pupilShiftX}" cy="${108 + pupilShiftY}" r="16" fill="#1cb0f6" />
        <circle cx="${246 + pupilShiftX}" cy="${108 + pupilShiftY}" r="10" fill="#0f172a" />
        <!-- Brillo estelar característico ✦ -->
        <polygon points="${242 + pupilShiftX},${102 + pupilShiftY} ${244 + pupilShiftX},${105 + pupilShiftY} ${247 + pupilShiftX},${106 + pupilShiftY} ${244 + pupilShiftX},${107 + pupilShiftY} ${242 + pupilShiftX},${110 + pupilShiftY} ${240 + pupilShiftX},${107 + pupilShiftY} ${237 + pupilShiftX},${106 + pupilShiftY} ${240 + pupilShiftX},${105 + pupilShiftY}" fill="#ffffff" />
        <circle cx="${250 + pupilShiftX}" cy="${113 + pupilShiftY}" r="3.5" fill="#ffffff" />
      `;
    }

    return `
      <div class="w-full h-full flex items-center justify-center relative ${stateClass}">
        <svg viewBox="0 0 400 470" class="w-full h-full max-w-[390px] max-h-[530px] drop-shadow-2xl overflow-visible">
          
          <!-- Ondas de sonido al hablar -->
          ${isSpeaking ? `
            <circle cx="200" cy="115" r="110" fill="none" stroke="#1cb0f6" stroke-width="5" opacity="0.6" class="leo-wave-ring" />
            <circle cx="200" cy="115" r="135" fill="none" stroke="#ffc800" stroke-width="4" opacity="0.4" class="leo-wave-ring" style="animation-delay: 0.35s" />
          ` : ''}

          <!-- Estrellas flotantes de celebración estilo Duolingo -->
          ${isCelebrating ? `
            <g class="leo-star-burst">
              <polygon points="45,55 52,70 68,72 56,83 59,98 45,90 31,98 34,83 22,72 38,70" fill="#ffc800" stroke="#0f172a" stroke-width="3" />
              <polygon points="355,55 362,70 378,72 366,83 369,98 355,90 341,98 344,83 332,72 348,70" fill="#ffc800" stroke="#0f172a" stroke-width="3" />
              <circle cx="82" cy="32" r="8" fill="#58cc02" stroke="#0f172a" stroke-width="3" />
              <circle cx="318" cy="32" r="8" fill="#1cb0f6" stroke="#0f172a" stroke-width="3" />
            </g>
          ` : ''}

          <!-- Grupo Cabeza Robot Leo (Estilo Duolingo) -->
          <g class="leo-head-group">
            <!-- Antena Superior con Luz -->
            <line x1="200" y1="56" x2="200" y2="28" stroke="#1899d6" stroke-width="9" stroke-linecap="round" />
            <line x1="200" y1="56" x2="200" y2="28" stroke="#0f172a" stroke-width="13" stroke-linecap="round" style="z-index:-1" />
            <circle cx="200" cy="22" r="15" fill="${antennaBulbColor}" stroke="#0f172a" stroke-width="4.5" class="leo-antenna-bulb" />
            <circle cx="196" cy="18" r="4" fill="#ffffff" opacity="0.8" />
            ${isListening ? `
              <circle cx="200" cy="22" r="26" fill="none" stroke="#58cc02" stroke-width="3.5" opacity="0.8" class="animate-ping" />
            ` : ''}

            <!-- Orejas laterales redondeadas estilo cápsula Duolingo -->
            <g>
              <rect x="70" y="86" width="22" height="50" rx="11" fill="#ffc800" stroke="#0f172a" stroke-width="4.5" />
              <rect x="73" y="112" width="16" height="20" rx="8" fill="#e5a500" />
              <rect x="308" y="86" width="22" height="50" rx="11" fill="#ffc800" stroke="#0f172a" stroke-width="4.5" />
              <rect x="311" y="112" width="16" height="20" rx="8" fill="#e5a500" />
            </g>

            <!-- Casco / Cabeza con curvas suaves y sombra 2.5D -->
            <rect x="88" y="52" width="224" height="128" rx="44" fill="#1cb0f6" stroke="#0f172a" stroke-width="5" />
            <!-- Sombra inferior de la cabeza estilo Duolingo -->
            <path d="M 94 150 Q 200 178 306 150 L 306 154 A 44 44 0 0 1 268 180 L 132 180 A 44 44 0 0 1 94 154 Z" fill="#1899d6" />

            <!-- Pantalla Facial oscura con esquinas redondeadas -->
            <rect x="106" y="66" width="188" height="96" rx="30" fill="#111827" stroke="#0f172a" stroke-width="4" />

            <!-- Mejillas sonrosadas Duolingo -->
            <rect x="118" y="132" width="22" height="10" rx="5" fill="#ff86a8" />
            <rect x="260" y="132" width="22" height="10" rx="5" fill="#ff86a8" />

            <!-- Ojos Expresivos -->
            ${eyesSvg}

            <!-- Boca Dinámica -->
            ${mouthSvg}
          </g>

          <!-- Cuello -->
          <rect x="174" y="174" width="52" height="16" rx="8" fill="#ffc800" stroke="#0f172a" stroke-width="4.5" />

          <!-- Brazos Interactivos -->
          ${armsSvg}

          <!-- Torso / Cuerpo de Robot Leo -->
          <rect x="58" y="180" width="284" height="258" rx="44" fill="#1cb0f6" stroke="#0f172a" stroke-width="5" />
          <!-- Sombra 2.5D inferior del cuerpo -->
          <path d="M 64 404 Q 200 444 336 404 L 336 408 A 44 44 0 0 1 298 438 L 102 438 A 44 44 0 0 1 64 408 Z" fill="#1899d6" />

          <!-- Pantalla del Pecho de Robot Leo con Marco Dorado Duolingo -->
          <rect x="70" y="190" width="260" height="236" rx="32" fill="#ffc800" stroke="#0f172a" stroke-width="5" />
          <!-- Sombra inferior del marco -->
          <path d="M 74 396 Q 200 428 326 396 L 326 400 A 32 32 0 0 1 298 426 L 102 426 A 32 32 0 0 1 74 400 Z" fill="#e5a500" />
          
          <!-- Pantalla Interior Blanca -->
          <rect x="78" y="198" width="244" height="220" rx="22" fill="#ffffff" stroke="#e5a500" stroke-width="3" />

          <!-- Contenido Proyectado en el Pecho -->
          <foreignObject x="80" y="200" width="240" height="216">
            <div xmlns="http://www.w3.org/1999/xhtml" class="w-full h-full flex flex-col items-center justify-center p-1 text-slate-900 overflow-hidden">
              ${this.renderChestStimulusHtml(currentEx)}
            </div>
          </foreignObject>

          <!-- Patitas redondeadas tipo coleccionable Duolingo -->
          <rect x="115" y="432" width="62" height="26" rx="13" fill="#ffc800" stroke="#0f172a" stroke-width="4.5" />
          <path d="M 118 446 L 174 446 A 13 13 0 0 1 164 458 L 128 458 A 13 13 0 0 1 118 446 Z" fill="#e5a500" />
          <rect x="223" y="432" width="62" height="26" rx="13" fill="#ffc800" stroke="#0f172a" stroke-width="4.5" />
          <path d="M 226 446 L 282 446 A 13 13 0 0 1 272 458 L 236 458 A 13 13 0 0 1 226 446 Z" fill="#e5a500" />
        </svg>
      </div>
    `;
  },

  // [REQ-03.4 & REQ-04.4] Proyección del estímulo en el pecho del robot con números extragrandes y ajuste perfecto sin desbordes
  renderChestStimulusHtml(ex) {
    if (this.isActivityCompletedCelebration) {
      return `
        <div class="w-full h-full flex flex-col items-center justify-center bg-amber-50 rounded-2xl p-2 select-none">
          <div class="flex items-center gap-1 text-amber-500 mb-1">
            <svg class="w-12 h-12 fill-amber-400 stroke-amber-600" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg class="w-14 h-14 fill-amber-400 stroke-amber-600" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <svg class="w-12 h-12 fill-amber-400 stroke-amber-600" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <div style="font-size: 54px; line-height: 1;" class="font-black text-emerald-600 tracking-tight">10 / 10</div>
        </div>
      `;
    }

    const actType = (this.activeChildActivity && this.activeChildActivity.activityType) || 'counting';

    // 1. Actividad de Sumas o Restas (MA01 OA 09) con diseño responsivo que NUNCA desborda
    if (actType === 'addition' || actType === 'subtraction') {
      const leftCount = ex.leftCount || 2;
      const rightCount = ex.rightCount || 1;
      const maxCount = Math.max(leftCount, rightCount);

      // Calculamos columnas estables por inline-grid para garantizar disposición horizontal compacta
      const getCols = (c) => {
        if (c <= 2) return c;
        if (c <= 4) return 2;
        if (c <= 6) return 3;
        return 5;
      };

      const leftCols = getCols(leftCount);
      const rightCols = getCols(rightCount);

      // Si el grupo tiene más de 5 objetos (como 10 en sumas/restas), usamos iconos de 17px para máxima holgura
      const itemSize = maxCount > 5 ? 'w-4 h-4' : 'w-5.5 h-5.5';

      const leftIcons = Array.from({ length: leftCount }).map(() => this.renderMiniItemSvg(ex.itemType, itemSize)).join('');
      const rightIcons = Array.from({ length: rightCount }).map(() => this.renderMiniItemSvg(ex.itemType, itemSize)).join('');

      const operatorSymbol = actType === 'subtraction' ? '−' : '+';
      return `
        <div class="w-full h-full flex flex-col items-center justify-center p-1 select-none">
          <!-- Número de la operación en tipografía extragrande destacada -->
          <div style="font-size: 28px; line-height: 1;" class="font-black text-slate-950 tracking-tight bg-amber-100 px-4 py-1 rounded-xl border-2 border-amber-300 shadow-xs mb-2 flex-shrink-0">
            ${ex.displayBigNumber}
          </div>
          <!-- Representación pictórica de los grupos con cuadrícula matemática segura sin desborde -->
          <div class="flex items-center justify-center gap-1.5 max-w-full">
            <div style="display: grid; grid-template-columns: repeat(${leftCols}, minmax(0, 1fr)); gap: 3px;" class="bg-blue-50/95 p-1.5 rounded-xl border border-blue-200 justify-items-center shadow-xs">
              ${leftIcons}
            </div>
            <span style="font-size: 24px; line-height: 1;" class="font-black ${actType === 'subtraction' ? 'text-rose-600' : 'text-blue-700'} px-0.5 flex-shrink-0">
              ${operatorSymbol}
            </span>
            <div style="display: grid; grid-template-columns: repeat(${rightCols}, minmax(0, 1fr)); gap: 3px;" class="${actType === 'subtraction' ? 'bg-rose-50/95 border-rose-200' : 'bg-emerald-50/95 border-emerald-200'} p-1.5 rounded-xl border justify-items-center shadow-xs">
              ${rightIcons}
            </div>
          </div>
        </div>
      `;
    }

    // 2. Actividad Fonológica / Sonido Inicial (LE01 OA 03)
    if (actType === 'phonological') {
      return `
        <div class="w-full h-full flex flex-col items-center justify-around py-1">
          <div class="flex items-center justify-center gap-3">
            <!-- Letra y Número de Sílabas en tipografía extragrande (48px-54px) -->
            <span style="font-size: 52px; line-height: 1;" class="font-black text-purple-700 bg-purple-100 px-3.5 py-1 rounded-2xl border-2 border-purple-300">${ex.letterBig || 'M'}</span>
            <span style="font-size: 46px; line-height: 1;" class="font-black text-amber-600 bg-amber-100 px-3 py-1 rounded-2xl border-2 border-amber-300">${ex.displayBigNumber || '2'}</span>
          </div>
          <div class="flex items-center justify-center">
            ${this.renderLargePhonologicalSvg(ex.itemType)}
          </div>
          <div style="font-size: 28px; line-height: 1;" class="font-black text-slate-900 tracking-wider">${ex.wordLabel || ''}</div>
        </div>
      `;
    }

    // 3. Actividad Comprensión de Cuento: El Conejo y las Uvas (LE01 OA 18)
    if (actType === 'story_comprehension') {
      return `
        <div class="w-full h-full flex flex-col items-center justify-around py-1">
          <div style="font-size: 48px; line-height: 1;" class="font-black text-indigo-900 bg-amber-200 px-4 py-1 rounded-2xl border-2 border-amber-400">
            ${ex.displayBigNumber}
          </div>
          <div class="flex items-center justify-center">
            ${this.renderStorySceneSvg(ex.itemType)}
          </div>
        </div>
      `;
    }

    // 4. Actividad de Conteo (MA01 OA 01): Solamente el Número en Tipografía Gigante (112px) de Alto Contraste con Animación al Cambiar
    const isAnim = Boolean(this.countingNumberAnimActive);
    return `
      <div class="w-full h-full flex items-center justify-center p-2 relative">
        ${isAnim && this.lastCompletedCountingNumber ? `
          <div class="absolute top-2.5 right-3 z-20 px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-xs font-black shadow-md counting-badge-anim flex items-center gap-1">
            <span>+${this.lastCompletedCountingNumber}</span>
          </div>
        ` : ''}
        <div style="font-size: 112px; line-height: 1;" class="w-full h-full flex items-center justify-center font-black text-slate-950 bg-amber-200 rounded-3xl border-4 border-amber-400 shadow-inner ${isAnim ? 'counting-card-anim' : ''}">
          <span class="${isAnim ? 'counting-number-pop' : ''}">${ex.displayBigNumber}</span>
        </div>
      </div>
    `;
  },

  renderMiniItemSvg(type, sizeClass = 'w-8 h-8') {
    if (type === 'star') {
      return `<svg class="${sizeClass}" viewBox="0 0 36 36"><polygon points="18,2 23,13 35,14 26,22 28,34 18,28 8,34 10,22 1,14 13,13" fill="#facc15" stroke="#ca8a04" stroke-width="2.5"/></svg>`;
    }
    if (type === 'balloon') {
      return `<svg class="${sizeClass}" viewBox="0 0 36 36"><ellipse cx="18" cy="15" rx="11" ry="13" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2.5"/><path d="M18 28 L18 35" stroke="#64748b" stroke-width="2"/></svg>`;
    }
    if (type === 'orange') {
      return `<svg class="${sizeClass}" viewBox="0 0 36 36"><circle cx="18" cy="19" r="13" fill="#f97316" stroke="#c2410c" stroke-width="2.5"/><path d="M18 6 Q23 2 25 7" fill="none" stroke="#16a34a" stroke-width="3" stroke-linecap="round"/></svg>`;
    }
    if (type === 'gem') {
      return `<svg class="${sizeClass}" viewBox="0 0 36 36"><polygon points="18,3 32,14 26,32 10,32 4,14" fill="#10b981" stroke="#047857" stroke-width="2.5"/></svg>`;
    }
    // Por defecto: Manzana roja ('apple')
    return `<svg class="${sizeClass}" viewBox="0 0 36 36"><circle cx="18" cy="20" r="12" fill="#ef4444" stroke="#b91c1c" stroke-width="2.5"/><path d="M18 8 Q22 3 25 7" fill="none" stroke="#16a34a" stroke-width="3.5" stroke-linecap="round"/></svg>`;
  },

  renderLargePhonologicalSvg(type) {
    if (type === 'ball') {
      return `<svg class="w-16 h-16" viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" fill="#3b82f6" stroke="#1e3a8a" stroke-width="4"/><path d="M10 24 Q32 38 54 24" fill="none" stroke="#facc15" stroke-width="5"/><circle cx="32" cy="32" r="7" fill="#ffffff"/></svg>`;
    }
    if (type === 'moon') {
      return `<svg class="w-16 h-16" viewBox="0 0 64 64"><path d="M42 10 A22 22 0 1 0 54 46 A18 18 0 1 1 42 10 Z" fill="#facc15" stroke="#ca8a04" stroke-width="4"/></svg>`;
    }
    if (type === 'sun') {
      return `<svg class="w-16 h-16" viewBox="0 0 64 64"><circle cx="32" cy="32" r="16" fill="#facc15" stroke="#ea580c" stroke-width="4"/><line x1="32" y1="4" x2="32" y2="12" stroke="#f59e0b" stroke-width="5" stroke-linecap="round"/><line x1="32" y1="52" x2="32" y2="60" stroke="#f59e0b" stroke-width="5" stroke-linecap="round"/><line x1="4" y1="32" x2="12" y2="32" stroke="#f59e0b" stroke-width="5" stroke-linecap="round"/><line x1="52" y1="32" x2="60" y2="32" stroke="#f59e0b" stroke-width="5" stroke-linecap="round"/></svg>`;
    }
    if (type === 'hand') {
      return `<svg class="w-16 h-16" viewBox="0 0 64 64"><rect x="18" y="26" width="28" height="28" rx="10" fill="#fbbf24" stroke="#b45309" stroke-width="3.5"/><rect x="18" y="10" width="6" height="20" rx="3" fill="#fbbf24" stroke="#b45309" stroke-width="2.5"/><rect x="26" y="8" width="6" height="22" rx="3" fill="#fbbf24" stroke="#b45309" stroke-width="2.5"/><rect x="34" y="10" width="6" height="20" rx="3" fill="#fbbf24" stroke="#b45309" stroke-width="2.5"/><rect x="42" y="14" width="6" height="16" rx="3" fill="#fbbf24" stroke="#b45309" stroke-width="2.5"/></svg>`;
    }
    // Monkey ('monkey')
    return `<svg class="w-16 h-16" viewBox="0 0 64 64"><circle cx="14" cy="32" r="9" fill="#92400e"/><circle cx="50" cy="32" r="9" fill="#92400e"/><circle cx="32" cy="32" r="20" fill="#b45309" stroke="#78350f" stroke-width="3.5"/><ellipse cx="32" cy="38" rx="13" ry="10" fill="#fde68a"/><circle cx="25" cy="27" r="3.5" fill="#0f172a"/><circle cx="39" cy="27" r="3.5" fill="#0f172a"/><path d="M26 40 Q32 45 38 40" fill="none" stroke="#78350f" stroke-width="3" stroke-linecap="round"/></svg>`;
  },

  renderStorySceneSvg(sceneType) {
    if (sceneType === 'branch_high') {
      // Conejo mirando la rama alta
      return `
        <svg class="w-28 h-24" viewBox="0 0 120 90">
          <path d="M10 18 Q60 12 110 20" stroke="#78350f" stroke-width="7" stroke-linecap="round" fill="none"/>
          <circle cx="80" cy="28" r="7" fill="#9333ea"/><circle cx="90" cy="28" r="7" fill="#9333ea"/><circle cx="85" cy="37" r="7" fill="#9333ea"/>
          <!-- Conejo abajo -->
          <ellipse cx="35" cy="52" rx="5" ry="13" fill="#cbd5e1" stroke="#475569" stroke-width="2"/>
          <ellipse cx="45" cy="52" rx="5" ry="13" fill="#cbd5e1" stroke="#475569" stroke-width="2"/>
          <circle cx="40" cy="70" r="14" fill="#f1f5f9" stroke="#475569" stroke-width="2.5"/>
          <circle cx="44" cy="67" r="2.5" fill="#0f172a"/>
        </svg>
      `;
    }
    if (sceneType === 'grapes_green') {
      // Racimo de uvas verdes
      return `
        <svg class="w-24 h-24" viewBox="0 0 90 90">
          <path d="M45 8 L45 22" stroke="#15803d" stroke-width="5" stroke-linecap="round"/>
          <circle cx="33" cy="32" r="11" fill="#4ade80" stroke="#15803d" stroke-width="2.5"/>
          <circle cx="57" cy="32" r="11" fill="#4ade80" stroke="#15803d" stroke-width="2.5"/>
          <circle cx="45" cy="46" r="11" fill="#22c55e" stroke="#15803d" stroke-width="2.5"/>
          <circle cx="35" cy="60" r="11" fill="#4ade80" stroke="#15803d" stroke-width="2.5"/>
          <circle cx="55" cy="60" r="11" fill="#4ade80" stroke="#15803d" stroke-width="2.5"/>
          <circle cx="45" cy="74" r="11" fill="#22c55e" stroke="#15803d" stroke-width="2.5"/>
        </svg>
      `;
    }
    // Racimo de uvas moradas ('grapes_purple')
    return `
      <svg class="w-24 h-24" viewBox="0 0 90 90">
        <path d="M45 8 L45 22" stroke="#16a34a" stroke-width="5" stroke-linecap="round"/>
        <circle cx="33" cy="32" r="11" fill="#9333ea" stroke="#581c87" stroke-width="2.5"/>
        <circle cx="57" cy="32" r="11" fill="#9333ea" stroke="#581c87" stroke-width="2.5"/>
        <circle cx="45" cy="46" r="11" fill="#a855f7" stroke="#581c87" stroke-width="2.5"/>
        <circle cx="35" cy="60" r="11" fill="#9333ea" stroke="#581c87" stroke-width="2.5"/>
        <circle cx="55" cy="60" r="11" fill="#9333ea" stroke="#581c87" stroke-width="2.5"/>
        <circle cx="45" cy="74" r="11" fill="#a855f7" stroke="#581c87" stroke-width="2.5"/>
      </svg>
    `;
  },

  // -------------------------------------------------------------
  // PESTAÑA: MENSAJERÍA ESCOLAR (Profesor y Apoderado)
  // -------------------------------------------------------------
  renderMensajeriaTab() {
    return `
      <div class="space-y-3">
        <div class="grid grid-cols-2 p-1 rounded-2xl bg-slate-200/80 border border-slate-300 text-xs font-black">
          <button onclick="app.setChatMode('grupal')" class="py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${this.chatMode === 'grupal' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}">
            <i data-lucide="radio" class="w-3.5 h-3.5 text-blue-600"></i>
            <span>Canal Grupal</span>
          </button>
          <button onclick="app.setChatMode('individual')" class="py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${this.chatMode === 'individual' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}">
            <i data-lucide="message-circle" class="w-3.5 h-3.5 text-emerald-600"></i>
            <span>Chat Individual</span>
          </button>
        </div>

        ${this.chatMode === 'grupal' ? this.renderCanalGrupalView() : this.renderChatIndividualView()}
      </div>
    `;
  },

  renderCanalGrupalView() {
    const isProf = this.isMobileTeacherAuthorized();
    return `
      <div class="space-y-3">
        <div class="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-950 flex items-start gap-2.5">
          <i data-lucide="info" class="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5"></i>
          <div>
            <span class="font-black block">Canal Oficial de Comunicados (1° Básico B)</span>
            <span class="text-blue-800">Canal sincronizado en la nube. Los comunicados oficiales y alertas aparecen en tiempo real y permiten confirmar lectura.</span>
          </div>
        </div>

        ${this.mobileComSuccessMsg ? `
          <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
            <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600 flex-shrink-0"></i>
            <span>${this.mobileComSuccessMsg}</span>
          </div>
        ` : ''}

        ${isProf ? `
          <div class="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
            <div class="flex items-center gap-1.5 text-xs font-black text-slate-900">
              <i data-lucide="send" class="w-4 h-4 text-blue-600"></i>
              <span>Publicar Comunicado al Curso</span>
            </div>
            <form onsubmit="app.publicarComunicadoGrupal(event)" class="space-y-2">
              <input id="comunicado-titulo" type="text" placeholder="Título del comunicado oficial..." class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500">
              <textarea id="comunicado-contenido" rows="2" placeholder="Redacta las indicaciones oficiales para las familias del curso..." class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500"></textarea>
              <button type="submit" ${this.isSendingMobileAlert ? 'disabled' : ''} class="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60">
                <i data-lucide="send" class="w-3.5 h-3.5"></i>
                <span>${this.isSendingMobileAlert ? 'Publicando...' : 'Emitir Comunicado a Todo el Curso'}</span>
              </button>
            </form>
          </div>
        ` : ''}

        <div class="space-y-2.5">
          ${this.comunicadosGrupales.length === 0 ? `
            <div class="p-6 rounded-2xl bg-white border border-dashed border-slate-300 text-center space-y-1.5">
              <i data-lucide="inbox" class="w-6 h-6 text-slate-400 mx-auto"></i>
              <p class="text-xs font-bold text-slate-600">No hay comunicados publicados en el canal grupal</p>
              <p class="text-[11px] text-slate-400">Cuando la profesora emita un comunicado o alerta oficial aparecerá aquí.</p>
            </div>
          ` : this.comunicadosGrupales.map(com => `
            <div class="p-3.5 rounded-2xl bg-white border ${!com.confirmado && com.tipo === 'urgente' ? 'border-rose-300' : 'border-slate-200'} shadow-xs space-y-2">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${com.tipo === 'urgente' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}">
                      ${com.tipo === 'urgente' ? 'Urgente' : 'Comunicado'}
                    </span>
                    <span class="text-[10px] font-black uppercase text-slate-500 tracking-wider">${com.curso} • ${com.fecha}</span>
                  </div>
                  <h4 class="font-black text-xs text-slate-900 leading-snug mt-1">${com.titulo}</h4>
                </div>
                <span class="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                  <i data-lucide="bell" class="w-4 h-4"></i>
                </span>
              </div>
              ${com.contenido ? `<p class="text-xs text-slate-700 leading-relaxed">${com.contenido}</p>` : ''}
              <div class="pt-1 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span class="text-slate-500 font-medium">${com.remitenteNombre}</span>
                ${isProf ? `
                  <span class="inline-flex items-center gap-1 font-bold ${com.confirmado ? 'text-emerald-700' : 'text-amber-700'}">
                    <i data-lucide="${com.confirmado ? 'check-check' : 'clock'}" class="w-3.5 h-3.5"></i>
                    <span>${com.confirmado ? 'Leído por Apoderado' : 'Pendiente de Acuse'}</span>
                  </span>
                ` : `
                  ${com.confirmado ? `
                    <span class="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                      <i data-lucide="check" class="w-3 h-3"></i>
                      <span>Lectura Confirmada</span>
                    </span>
                  ` : `
                    <button onclick="app.confirmarLecturaComunicado(${com.id})" class="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] shadow-2xs transition flex items-center gap-1 cursor-pointer">
                      <i data-lucide="check" class="w-3 h-3"></i>
                      <span>Confirmar Lectura</span>
                    </button>
                  `}
                `}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  renderChatIndividualView() {
    const isProf = this.isMobileTeacherAuthorized();
    const convId = this.activeConversacionId || 1;
    const msgs = this.mensajesPorConversacion[convId] || [];

    const interlocutor = isProf
      ? (convId === 2 ? 'Carolina Tapia (Apoderada de Sofía 2° A)' : 'Carolina Tapia (Apoderada de Mateo 1° B)')
      : 'Tía Marcela Soto (Profesora Jefe 1° B)';

    return `
      <div class="flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden h-[460px]">
        ${isProf ? `
          <div class="px-3 pt-2.5 pb-2 bg-slate-100 border-b border-slate-200 flex items-center gap-1.5">
            <span class="text-[10px] font-black uppercase text-slate-500 mr-1">Canal:</span>
            <button
              type="button"
              onclick="app.selectMobileConversation(1)"
              class="px-2.5 py-1 rounded-lg text-[11px] font-black transition cursor-pointer ${convId === 1 ? 'bg-blue-600 text-white shadow-2xs' : 'bg-white text-slate-700 border border-slate-200'}"
            >
              Mateo (1° B)
            </button>
            <button
              type="button"
              onclick="app.selectMobileConversation(2)"
              class="px-2.5 py-1 rounded-lg text-[11px] font-black transition cursor-pointer ${convId === 2 ? 'bg-blue-600 text-white shadow-2xs' : 'bg-white text-slate-700 border border-slate-200'}"
            >
              Sofía (2° A)
            </button>
          </div>
        ` : ''}
        <div class="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full ${isProf ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'} flex items-center justify-center font-bold text-xs">
              ${isProf ? 'CT' : 'MS'}
            </div>
            <div>
              <h4 class="font-black text-xs text-slate-900">${interlocutor}</h4>
              <span class="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Chat Directo Activo</span>
              </span>
            </div>
          </div>
          <span class="text-[10px] text-slate-500 font-semibold bg-white px-2 py-0.5 rounded-md border border-slate-200">
            ${convId === 2 ? '2° Básico A' : '1° Básico B'}
          </span>
        </div>

        <div id="chat-stream" class="flex-1 p-3 overflow-y-auto space-y-2.5 bg-slate-50/50">
          ${msgs.length === 0 ? `
            <div class="h-full flex flex-col items-center justify-center text-center p-4 space-y-1.5 text-slate-400">
              <i data-lucide="message-square" class="w-7 h-7 text-slate-300"></i>
              <p class="text-xs font-bold text-slate-600">Sin mensajes en esta conversación (0 mensajes)</p>
              <p class="text-[11px] text-slate-400">Escribe un mensaje abajo para iniciar el diálogo.</p>
            </div>
          ` : msgs.map(m => `
            <div class="flex flex-col ${m.esMio ? 'items-end' : 'items-start'}">
              <div class="max-w-[82%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed shadow-2xs ${m.esMio ? 'bg-blue-600 text-white rounded-br-xs' : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs'}">
                <span class="block text-[10px] font-black mb-0.5 ${m.esMio ? 'text-blue-100' : 'text-slate-500'}">${m.remitenteNombre}</span>
                <p>${m.texto}</p>
              </div>
              <div class="flex items-center gap-1 mt-0.5 px-1 text-[10px] text-slate-400">
                <span>${m.hora}</span>
              </div>
            </div>
          `).join('')}
        </div>

        <form onsubmit="app.enviarMensajeDirecto(event)" class="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2">
          <input id="chat-directo-input" type="text" placeholder="Escribe un mensaje a ${isProf ? 'la apoderada' : 'la profesora'}..." class="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500">
          <button type="submit" ${this.isSendingMobileMsg ? 'disabled' : ''} class="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer shadow-xs disabled:opacity-60">
            <i data-lucide="send" class="w-4 h-4"></i>
          </button>
        </form>
      </div>
    `;
  },

  // -------------------------------------------------------------
  // PESTAÑA: GESTIÓN DE ALERTAS
  // -------------------------------------------------------------
  renderAlertasTab() {
    const isProf = this.isMobileTeacherAuthorized();
    return isProf ? this.renderTableroProfesorAlertas() : this.renderBandejaApoderadoAlertas();
  },

  renderBandejaApoderadoAlertas() {
    const filtradas = this.alertasLocales.filter(a => {
      if (this.filterAlertas === 'urgente') return a.tipo === 'urgente';
      if (this.filterAlertas === 'informativa') return a.tipo !== 'urgente';
      return true;
    });

    const pendientesCount = this.alertasLocales.filter(a => a.estado === 'PENDIENTE').length;

    return `
      <div class="space-y-3">
        <div class="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-xs flex items-center justify-between">
          <div>
            <span class="text-[10px] font-black uppercase tracking-wider text-slate-900">Bandeja Oficial de Alertas</span>
            <h3 class="text-base font-black text-slate-950">
              ${pendientesCount > 0 ? `${pendientesCount} alerta(s) requieren tu acuse` : 'Todas las alertas al día'}
            </h3>
            <p class="text-xs text-slate-900 font-medium">Revisa las notificaciones del progreso de tu pupilo.</p>
          </div>
          <div class="w-10 h-10 rounded-xl bg-white/30 flex items-center justify-center font-black">
            <i data-lucide="bell" class="w-5 h-5 text-slate-950"></i>
          </div>
        </div>

        <div class="flex items-center gap-1.5 text-xs font-bold">
          <button onclick="app.filterAlertas = 'todas'; app.render();" class="px-3 py-1.5 rounded-xl border transition ${this.filterAlertas === 'todas' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}">
            Todas (${this.alertasLocales.length})
          </button>
          <button onclick="app.filterAlertas = 'urgente'; app.render();" class="px-3 py-1.5 rounded-xl border transition ${this.filterAlertas === 'urgente' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-rose-700 border-slate-200'}">
            Urgentes
          </button>
          <button onclick="app.filterAlertas = 'informativa'; app.render();" class="px-3 py-1.5 rounded-xl border transition ${this.filterAlertas === 'informativa' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-700 border-slate-200'}">
            Informativas
          </button>
        </div>

        <div class="space-y-2.5">
          ${filtradas.length === 0 ? `
            <div class="p-6 rounded-2xl bg-white border border-dashed border-slate-300 text-center space-y-1.5">
              <i data-lucide="bell-off" class="w-6 h-6 text-slate-400 mx-auto"></i>
              <p class="text-xs font-bold text-slate-600">No tienes alertas registradas (0 alertas)</p>
              <p class="text-[11px] text-slate-400">Las alertas emitidas por la profesora aparecerán aquí.</p>
            </div>
          ` : filtradas.map(a => {
            const esUrgente = a.tipo === 'urgente';
            const yaLeida = a.estado === 'LEIDA' || this.acuseStatus[a.id];
            return `
              <div class="p-3.5 rounded-2xl bg-white border ${esUrgente && !yaLeida ? 'border-rose-300 ring-1 ring-rose-200 shadow-sm' : 'border-slate-200'} shadow-xs space-y-2">
                <div class="flex items-start justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${esUrgente ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}">
                      ${esUrgente ? 'Urgente' : 'Informativa'}
                    </span>
                    <span class="text-[11px] text-slate-400 font-bold">${a.fecha_creacion}</span>
                  </div>
                  <span class="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    ${a.alumno}
                  </span>
                </div>

                <div>
                  <h4 class="font-black text-xs text-slate-900 leading-snug">${a.titulo}</h4>
                  <p class="text-xs text-slate-600 mt-1 leading-relaxed">${a.contenido}</p>
                </div>

                <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div class="text-[11px]">
                    ${yaLeida ? `
                      <span class="inline-flex items-center gap-1 text-emerald-700 font-bold">
                        <i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-600"></i>
                        <span>Acuse de recibo registrado</span>
                      </span>
                    ` : `
                      <span class="inline-flex items-center gap-1 text-amber-700 font-bold">
                        <i data-lucide="clock" class="w-3.5 h-3.5 text-amber-600"></i>
                        <span>Pendiente de confirmación</span>
                      </span>
                    `}
                  </div>

                  ${!yaLeida ? `
                    <button onclick="app.confirmarAlerta(${a.id})" class="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer active:scale-95">
                      <i data-lucide="check" class="w-3.5 h-3.5"></i>
                      <span>Acuse de recibo</span>
                    </button>
                  ` : `
                    <span class="text-[10px] text-slate-400 font-semibold">Confirmado</span>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  renderTableroProfesorAlertas() {
    const totalApos = this.apoderadosCurso.length;
    const confirmados = this.apoderadosCurso.filter(a => a.confirmado).length;
    const pct = Math.round((confirmados / totalApos) * 100);

    return `
      <div class="space-y-3">
        <div class="p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xs space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black uppercase tracking-wider text-blue-200">Monitoreo Oficial 1° Básico B</span>
            <span class="px-2 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-black">${confirmados} de ${totalApos} Apoderados</span>
          </div>
          <div>
            <h3 class="text-xl font-black text-white">${pct}% de Acuses Confirmados</h3>
            <p class="text-xs text-blue-100">Porcentaje de recepción y lectura de las alertas emitidas al curso.</p>
          </div>
          <div class="w-full h-2.5 rounded-full bg-blue-900/60 overflow-hidden">
            <div class="h-full bg-amber-400 rounded-full transition-all duration-500" style="width: ${pct}%"></div>
          </div>
        </div>

        <div class="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5 text-xs font-black text-slate-900">
              <i data-lucide="plus-circle" class="w-4 h-4 text-rose-600"></i>
              <span>Emitir Alerta de Reforzamiento al Curso</span>
            </div>
            <span class="text-[10px] font-bold text-slate-400">Escuela -> Apoderado</span>
          </div>

          <form onsubmit="app.emitirAvisoReforzamiento(event)" class="space-y-2">
            ${this.mobileAlertSuccessMsg ? `
              <div class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-1.5">
                <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600 flex-shrink-0"></i>
                <span>${this.mobileAlertSuccessMsg}</span>
              </div>
            ` : ''}
            <div>
              <label class="block text-[11px] font-bold text-slate-600 mb-0.5">Tipo de Prioridad</label>
              <select id="aviso-tipo" class="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 focus:outline-none">
                <option value="urgente">Urgente (Rezago en Objetivo de Aprendizaje)</option>
                <option value="informativa">Informativa (Recordatorio escolar)</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-600 mb-0.5">Título del Aviso</label>
              <input id="aviso-titulo" type="text" value="Aviso de Refuerzo: Adiciones y Conteo Rítmico" class="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-500">
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-600 mb-0.5">Descripción para los Apoderados</label>
              <textarea id="aviso-desc" rows="2" class="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500">Estimados apoderados: Se solicita reforzar en casa la secuencia de adiciones con material pictórico y las dinámicas rítmicas antes de la evaluación del viernes.</textarea>
            </div>
            <button type="submit" ${this.isSendingMobileAlert ? 'disabled' : ''} class="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60">
              <i data-lucide="send" class="w-3.5 h-3.5"></i>
              <span>${this.isSendingMobileAlert ? 'Enviando...' : 'Emitir Alerta y Solicitar Acuse de Recibo'}</span>
            </button>
          </form>
        </div>

        <div class="space-y-1.5">
          <div class="flex items-center justify-between px-1">
            <span class="block text-[11px] font-black uppercase tracking-wider text-slate-500">
              Historial de Alertas Emitidas (${(this.alertasLocales || []).length})
            </span>
            ${(this.alertasLocales || []).length > 0 ? `
              <button
                type="button"
                onclick="app.vaciarAlertasMovil()"
                class="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-black cursor-pointer"
              >
                Vaciar Historial
              </button>
            ` : ''}
          </div>

          ${(this.alertasLocales || []).length === 0 ? `
            <div class="p-4 rounded-2xl bg-white border border-dashed border-slate-300 text-center text-xs text-slate-500 font-semibold">
              No hay alertas emitidas registradas todavía.
            </div>
          ` : `
            <div class="space-y-2">
              ${(this.alertasLocales || []).map(al => {
                const isRead = al.estado === 'LEIDA' || Boolean(this.acuseStatus[al.id]);
                return `
                  <div class="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1.5">
                    <div class="flex items-center justify-between gap-2">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${al.tipo === 'urgente' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}">
                        ${al.tipo === 'urgente' ? 'Urgente' : 'Informativa'}
                      </span>
                      <span class="text-[10px] text-slate-400 font-bold">${al.fecha_creacion || 'Hoy'}</span>
                    </div>
                    <h4 class="font-black text-xs text-slate-900 leading-snug">${al.titulo}</h4>
                    ${al.contenido ? `<p class="text-[11px] text-slate-600 leading-relaxed">${al.contenido}</p>` : ''}
                    <div class="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px]">
                      <span class="text-slate-500 font-semibold">${al.alumno || '1° Básico B'}</span>
                      <span class="inline-flex items-center gap-1 font-black ${isRead ? 'text-emerald-700' : 'text-amber-700'}">
                        <i data-lucide="${isRead ? 'check-circle-2' : 'clock'}" class="w-3 h-3"></i>
                        <span>${isRead ? 'Confirmada por Apoderado' : 'Pendiente de Lectura'}</span>
                      </span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>

        <div class="space-y-1.5">
          <span class="block text-[11px] font-black uppercase tracking-wider text-slate-500 px-1">Estado de Confirmación por Apoderado</span>
          <div class="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
            ${this.apoderadosCurso.map(apo => `
              <div class="p-3 flex items-center justify-between text-xs">
                <div>
                  <span class="font-black text-slate-900 block">${apo.apoderado}</span>
                  <span class="text-[11px] text-slate-500">Pupilo: ${apo.alumno}</span>
                </div>
                <div class="text-right">
                  ${apo.confirmado ? `
                    <span class="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 text-[11px]">
                      <i data-lucide="check" class="w-3 h-3"></i>
                      <span>Acuse: ${apo.fechaAcuse}</span>
                    </span>
                  ` : `
                    <span class="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 text-[11px]">
                      <i data-lucide="clock" class="w-3 h-3"></i>
                      <span>Sin Confirmar</span>
                    </span>
                  `}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  // -------------------------------------------------------------
  // PESTAÑA: PANEL DASHBOARD (Apoderado - Puntajes del 1 al 10)
  // -------------------------------------------------------------
  renderDashboardTab() {
    const pupilName = this.selectedPupilIndex === 0 ? 'Mateo González' : 'Sofía González';
    const pupilCourse = this.selectedPupilIndex === 0 ? '1° Básico B' : '2° Básico A';

    const data = this.reporteriaData || {
      overall_grade: 0,
      math_grade: 0,
      math_status: 'Sin entregas',
      math_tasks: '0 actividades',
      language_grade: 0,
      language_status: 'Sin entregas',
      language_tasks: '0 actividades',
      pending_count: 0,
      completed_activities_month: 0,
      completion_rate: 0,
      actividades: [],
      next_pending_task: null
    };

    const overall = data.overall_grade !== undefined && data.overall_grade !== null ? Number(data.overall_grade) : 0;
    const mathScore = data.math_grade !== undefined && data.math_grade !== null ? Number(data.math_grade) : 0;
    const langScore = data.language_grade !== undefined && data.language_grade !== null ? Number(data.language_grade) : 0;
    const assignedActivities = Array.isArray(data.actividades) ? data.actividades : [];

    return `
      <div class="space-y-3">
        <div class="p-4 rounded-2xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 text-white shadow-xs space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black uppercase tracking-wider text-indigo-200">Panel de Puntajes del Pupilo</span>
            <span class="px-2 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-black">${pupilCourse}</span>
          </div>
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-black text-white">${pupilName}</h3>
              <p class="text-xs text-indigo-100">Puntajes en escala del 1 al 10 (exclusivo Apoderado)</p>
            </div>
            <div class="text-right">
              <span class="text-2xl font-black text-amber-300">${overall.toFixed ? overall.toFixed(1) : overall} <span class="text-xs text-indigo-200">/ 10</span></span>
              <span class="block text-[10px] font-bold text-indigo-200">Puntaje Promedio</span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2.5">
          <div class="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div class="flex items-center justify-between">
              <span class="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
                <i data-lucide="calculator" class="w-4 h-4"></i>
              </span>
              <span class="text-lg font-black text-blue-700">${mathScore} <span class="text-[10px] text-slate-400">/ 10</span></span>
            </div>
            <div>
              <h4 class="font-black text-xs text-slate-900">Matemáticas</h4>
              <p class="text-[11px] text-emerald-600 font-bold">Puntaje: ${data.math_status || 'Excelente'}</p>
              <p class="text-[10px] text-slate-400 mt-0.5">${data.math_tasks || 'Al día'}</p>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div class="flex items-center justify-between">
              <span class="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
                <i data-lucide="book-open" class="w-4 h-4"></i>
              </span>
              <span class="text-lg font-black text-purple-700">${langScore} <span class="text-[10px] text-slate-400">/ 10</span></span>
            </div>
            <div>
              <h4 class="font-black text-xs text-slate-900">Lenguaje</h4>
              <p class="text-[11px] text-emerald-600 font-bold">Puntaje: ${data.language_status || 'Excelente'}</p>
              <p class="text-[10px] text-slate-400 mt-0.5">${data.language_tasks || 'Al día'}</p>
            </div>
          </div>
        </div>

        <div class="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="text-xs font-black text-slate-900">Puntajes por Actividad (1 al 10)</span>
            <span class="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">Escala 1 a 10 pts</span>
          </div>
          ${assignedActivities.length === 0 ? `
            <p class="text-xs text-slate-500 py-2">No hay actividades asignadas en este momento.</p>
          ` : `
            <div class="divide-y divide-slate-100">
              ${assignedActivities.map(act => {
                const isDone = act.estado === 'Entregada';
                const hasScore = act.calificacion !== null && act.calificacion !== undefined;
                const scoreVal = hasScore ? Math.round(Number(act.calificacion)) : (isDone ? 10 : null);
                return `
                  <div class="py-2 flex items-center justify-between gap-2 text-xs">
                    <div class="min-w-0">
                      <span class="font-black text-slate-800 block truncate">${act.titulo}</span>
                      <span class="text-[10px] text-slate-500">${act.asignatura} • ${act.estado}</span>
                    </div>
                    <div class="flex-shrink-0 text-right">
                      ${scoreVal !== null ? `
                        <span class="px-2.5 py-1 rounded-xl font-black text-xs ${scoreVal >= 9 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : (scoreVal >= 7 ? 'bg-blue-100 text-blue-800 border border-blue-300' : 'bg-amber-100 text-amber-900 border border-amber-300')}">
                          ${scoreVal} / 10 pts
                        </span>
                      ` : `
                        <span class="text-[11px] font-bold text-slate-400">Pendiente</span>
                      `}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>

        <div class="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5 text-xs font-black text-slate-900">
              <i data-lucide="check-circle" class="w-4 h-4 text-emerald-600"></i>
              <span>Cumplimiento de Tareas</span>
            </div>
            <span class="text-xs font-black text-emerald-700">${data.completion_rate !== undefined ? data.completion_rate : 0}%</span>
          </div>
          <div class="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div class="h-full bg-emerald-500 rounded-full transition-all duration-500" style="width: ${data.completion_rate !== undefined ? data.completion_rate : 0}%"></div>
          </div>
          <div class="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Pendientes: <strong class="text-rose-600">${data.pending_count || 0}</strong></span>
            <span>Completadas: <strong class="text-emerald-600">${data.completed_activities_month !== undefined ? data.completed_activities_month : 0}</strong></span>
          </div>
        </div>

        <button onclick="app.loginDemo('alumno')" class="w-full p-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-sm transition flex items-center justify-between cursor-pointer">
          <div class="flex items-center gap-2.5">
            <i data-lucide="bot" class="w-5 h-5"></i>
            <span>Abrir Modo Alumno para Mateo (Jugar con Robot Leo)</span>
          </div>
          <i data-lucide="arrow-right" class="w-4 h-4"></i>
        </button>
      </div>
    `;
  },

  // -------------------------------------------------------------
  // [REQ-01] PESTAÑA Y MODAL DE CONFIGURACIÓN DE SERVIDOR LAN
  // -------------------------------------------------------------
  renderConfigTab() {
    const isOnline = window.mobileApi && mobileApi.isOnline;
    const canEditPhoto = this.canEditProfilePhoto();
    const avatarUrl = canEditPhoto ? this.getUserAvatarUrl(this.currentUser) : '';
    const defaultUrl = canEditPhoto ? this.getDefaultAvatarUrl(this.currentUser) : '';

    return `
      <div class="space-y-3">
        ${canEditPhoto ? `
          <div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div class="flex items-center gap-3">
              <img
                src="${avatarUrl}"
                alt="${this.currentUser.name}"
                onerror="this.src='${defaultUrl}'"
                class="w-14 h-14 rounded-2xl object-cover border-2 border-slate-200 shadow-xs flex-shrink-0"
              />
              <div class="min-w-0 flex-1">
                <h3 class="font-black text-sm text-slate-900 truncate">${this.currentUser.name}</h3>
                <p class="text-xs text-slate-500">${this.currentUser.rolLabel || 'Perfil Institucional'}</p>
              </div>
            </div>
            <button
              type="button"
              onclick="app.openMobilePhotoModal()"
              class="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <i data-lucide="camera" class="w-4 h-4"></i>
              <span>Cambiar Foto de Perfil</span>
            </button>
          </div>
        ` : ''}

        <div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <i data-lucide="shield-check" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="font-black text-sm text-slate-900">Estado de la Plataforma</h3>
              <p class="text-xs text-slate-500">Sincronización en la nube y seguridad de sesión.</p>
            </div>
          </div>

          <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span class="font-bold text-slate-700">Estado de sincronización:</span>
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black ${isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
              <span class="w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
              ${isOnline ? 'Conectado en la Nube' : 'Modo Respaldo Local'}
            </span>
          </div>

          <div class="pt-1">
            <button type="button" onclick="app.logout()" class="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer">
              <i data-lucide="log-out" class="w-4 h-4"></i>
              <span>Cerrar Sesión Institucional</span>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  renderMobilePhotoModal() {
    if (!this.canEditProfilePhoto()) return '';
    const avatarUrl = this.getUserAvatarUrl(this.currentUser);
    const defaultUrl = this.getDefaultAvatarUrl(this.currentUser);
    const isUsingCustom = avatarUrl !== defaultUrl;
    const currentUrlInput = /^https?:\/\//i.test(avatarUrl) && avatarUrl !== defaultUrl ? avatarUrl : '';

    return `
      <div
        id="mobile-photo-modal-backdrop"
        onclick="if (event.target.id === 'mobile-photo-modal-backdrop') app.closeMobilePhotoModal()"
        class="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      >
        <div class="w-full max-w-md rounded-3xl bg-white text-slate-900 p-5 shadow-2xl border border-slate-200 space-y-4 my-auto">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div class="flex items-center gap-2">
              <div class="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <i data-lucide="camera" class="w-5 h-5"></i>
              </div>
              <div>
                <h3 class="font-black text-sm text-slate-900">Foto de Perfil</h3>
                <p class="text-[11px] text-slate-500">${this.currentUser.name}</p>
              </div>
            </div>
            <button
              type="button"
              onclick="app.closeMobilePhotoModal()"
              class="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
            >
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <div class="flex items-center gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <img
              src="${avatarUrl}"
              alt="${this.currentUser.name}"
              onerror="this.src='${defaultUrl}'"
              class="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md flex-shrink-0"
            />
            <div class="space-y-1">
              <p class="text-xs font-black text-slate-800">${isUsingCustom ? 'Foto personalizada activa' : 'Usando foto por defecto'}</p>
              <p class="text-[11px] text-slate-500 leading-snug">Puedes subir una imagen desde tu dispositivo, pegar un enlace o restaurar tu foto original.</p>
            </div>
          </div>

          ${this.photoModalError ? `
            <div class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
              ${this.photoModalError}
            </div>
          ` : ''}

          ${this.photoModalStatus ? `
            <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              ${this.photoModalStatus}
            </div>
          ` : ''}

          <div class="space-y-3">
            <label class="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer active:scale-95">
              <i data-lucide="upload" class="w-4 h-4"></i>
              <span>Elegir foto desde galería o archivo</span>
              <input
                type="file"
                accept="image/*"
                class="hidden"
                onchange="app.handleMobilePhotoFile(this)"
              />
            </label>

            <div class="space-y-1.5">
              <label class="text-[11px] font-bold text-slate-600">O usar enlace de imagen (URL):</label>
              <div class="flex gap-2">
                <input
                  id="mobile-photo-url-input"
                  type="url"
                  value="${currentUrlInput}"
                  placeholder="https://ejemplo.com/mi-foto.jpg"
                  class="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onclick="app.saveMobilePhotoUrl()"
                  class="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </div>

            ${isUsingCustom ? `
              <button
                type="button"
                onclick="app.restoreDefaultMobilePhoto()"
                class="w-full py-2.5 px-4 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-black text-xs border border-amber-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
                <span>Restaurar Foto por Defecto</span>
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  },

  renderServerModal() {
    return '';
  },

  renderModalRevisionDocenteMovil() {
    if (!this.isMobileTeacherAuthorized() || !this.activeTeacherReview) return '';
    const rev = this.activeTeacherReview;
    const detalles = Array.isArray(rev.detalle_respuestas) ? rev.detalle_respuestas : [];
    const ia = rev.resumen_ia || {};
    const puntajeVal = rev.calificacion !== null && rev.calificacion !== undefined ? Math.round(Number(rev.calificacion)) : 10;
    const draftMsg = this.teacherReviewMessageDraft !== undefined
      ? this.teacherReviewMessageDraft
      : (ia.mensaje_apoderado || `Hola Carolina, te comparto el resumen de la actividad "${rev.titulo}" de ${rev.alumno_nombre || 'Mateo'} (Puntaje: ${puntajeVal}/10 pts).`);

    const alumnosCompletados = Array.isArray(rev.alumnos_completados) ? rev.alumnos_completados : [];
    const selectedAlumnoId = Number(rev.alumno_id || 5);

    return `
      <div
        id="mobile-teacher-review-modal-backdrop"
        onclick="if (event.target.id === 'mobile-teacher-review-modal-backdrop') app.cerrarRevisionActividadMovil()"
        class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2.5 overflow-y-auto"
      >
        <div
          id="mobile-review-modal-body"
          class="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-900 text-white p-4 shadow-2xl border-2 border-indigo-500/40 space-y-3.5 my-auto"
        >
          <div class="flex items-center justify-between gap-2 flex-wrap border-b border-slate-800 pb-3">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 flex items-center gap-1">
                <i data-lucide="sparkles" class="w-3 h-3"></i>
                <span>Revisión Docente + IA</span>
              </span>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Alumno: ${rev.alumno_nombre || 'Mateo González'}
              </span>
            </div>
            <div class="flex items-center gap-1.5">
              <button
                type="button"
                onclick="app.reiniciarPuntajeActividadMovil('${rev.codigo_frontend || 'act-conteo'}')"
                class="px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs"
              >
                <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                <span>Reiniciar</span>
              </button>
              <button
                type="button"
                onclick="app.cerrarRevisionActividadMovil()"
                class="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] border border-slate-700 flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <i data-lucide="x" class="w-3.5 h-3.5"></i>
                <span>Cerrar</span>
              </button>
            </div>
          </div>

          <div>
            <span class="text-[11px] font-bold text-amber-300 block">${rev.asignatura || 'Matemáticas'}</span>
            <h3 class="font-black text-sm text-white leading-snug mt-0.5">${rev.titulo || 'Actividad Escolar'}</h3>
          </div>

          <!-- Selector de Alumnos que han completado la actividad -->
          <div class="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/80 space-y-2">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-1.5">
                <i data-lucide="users" class="w-3.5 h-3.5 text-emerald-400"></i>
                <span class="text-[11px] font-black uppercase tracking-wider text-slate-200">
                  Alumnos que han completado la actividad (${alumnosCompletados.length})
                </span>
              </div>
              <span class="text-[10px] text-slate-400 font-medium">Elige alumno</span>
            </div>

            ${alumnosCompletados.length === 0 ? `
              <div class="p-2.5 rounded-xl bg-slate-900/70 border border-slate-700/70 text-[11px] text-slate-300 flex items-center justify-between gap-2">
                <span>Ningún alumno ha completado aún esta actividad. Mostrando vista de <strong>${rev.alumno_nombre || 'Mateo González'}</strong>.</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 flex-shrink-0">Pendiente</span>
              </div>
            ` : `
              <div class="flex flex-wrap gap-1.5">
                ${alumnosCompletados.map(al => {
                  const isSelected = Number(al.alumno_id) === selectedAlumnoId;
                  const scoreChip = al.calificacion !== null && al.calificacion !== undefined
                    ? `${Math.round(Number(al.calificacion))}/10 pts`
                    : 'Completada';
                  return `
                    <button
                      type="button"
                      onclick="app.seleccionarAlumnoRevisionMovil('${rev.codigo_frontend || 'act-conteo'}', ${al.alumno_id})"
                      class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                          : 'bg-slate-900/80 text-slate-200 border-slate-700'
                      }"
                    >
                      <span class="w-5 h-5 rounded-full ${isSelected ? 'bg-white text-indigo-700' : 'bg-emerald-500/20 text-emerald-300'} flex items-center justify-center text-[10px] font-black">
                        ${(al.alumno_nombre || 'A').charAt(0)}
                      </span>
                      <span>${al.alumno_nombre}</span>
                      <span class="px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                        isSelected ? 'bg-indigo-800 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                      }">
                        ${scoreChip}
                      </span>
                    </button>
                  `;
                }).join('')}
              </div>
            `}
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div class="p-2.5 rounded-xl bg-white/10 border border-white/10 text-center">
              <span class="block text-[10px] text-slate-300 font-bold uppercase">Puntaje</span>
              <span class="text-sm font-black text-amber-300">${rev.estado === 'Entregada' || rev.calificacion != null ? `${puntajeVal} / 10 pts` : 'En curso'}</span>
            </div>
            <div class="p-2.5 rounded-xl bg-white/10 border border-white/10 text-center">
              <span class="block text-[10px] text-slate-300 font-bold uppercase">T. Promedio</span>
              <span class="text-sm font-black text-sky-300">${rev.tiempo_promedio_segundos ? `${rev.tiempo_promedio_segundos}s` : '0.0s'} / núm</span>
            </div>
            <div class="p-2.5 rounded-xl bg-white/10 border border-white/10 text-center">
              <span class="block text-[10px] text-slate-300 font-bold uppercase">Tiempo Total</span>
              <span class="text-sm font-black text-emerald-300">${rev.tiempo_total_segundos ? `${rev.tiempo_total_segundos}s` : '0.0s'}</span>
            </div>
          </div>

          <!-- Desglose de Cómo Respondió y Cuánto Tardó en Cada Número -->
          <div class="p-3.5 rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-xs space-y-2.5">
            <div class="flex items-center justify-between">
              <h4 class="font-black text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <i data-lucide="timer" class="w-4 h-4 text-blue-600"></i>
                <span>Cómo Respondió y Tiempo por Número</span>
              </h4>
              <span class="text-[10px] font-bold text-slate-500">${detalles.length} registros</span>
            </div>

            ${detalles.length === 0 ? `
              <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 font-semibold">
                El alumno aún no registra respuestas grabadas en esta actividad (Estado: ${rev.estado || 'Pendiente'}).
              </div>
            ` : `
              <div class="space-y-2">
                ${detalles.map(d => {
                  const errPrev = Array.isArray(d.errores_previos) ? d.errores_previos : [];
                  const hasErr = !d.correcto || errPrev.length > 0;
                  const tSeg = Number(d.tiempo_segundos || 1.5).toFixed(1);
                  const isSlow = Number(tSeg) >= 3.2;
                  return `
                    <div class="p-2.5 rounded-xl border ${
                      hasErr
                        ? 'bg-rose-50/70 border-rose-200'
                        : (isSlow ? 'bg-amber-50/70 border-amber-200' : 'bg-emerald-50/40 border-emerald-200')
                    } flex items-center justify-between gap-2">
                      <div class="min-w-0 flex-1 space-y-1">
                        <div class="flex items-center gap-1.5 flex-wrap">
                          <span class="font-black text-xs text-slate-900">${d.etiqueta || ('Número ' + d.paso)}</span>
                          ${hasErr ? `
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white">
                              Se equivocó (${errPrev.join(', ') || 'error'})
                            </span>
                          ` : `
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                              Correcto al 1° intento
                            </span>
                          `}
                        </div>
                        <p class="text-[11px] text-slate-700 font-semibold mt-0.5 leading-relaxed break-words">
                          Respuesta: <strong>${d.respondido || d.esperado}</strong>
                        </p>
                      </div>
                      <div class="text-right flex-shrink-0">
                        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black ${
                          hasErr ? 'bg-rose-100 text-rose-900' : (isSlow ? 'bg-amber-200 text-amber-950' : 'bg-slate-900 text-amber-300')
                        }">
                          <i data-lucide="clock" class="w-3 h-3"></i>
                          <span>${tSeg} s</span>
                        </span>
                        <span class="block text-[9px] font-bold text-slate-500 mt-0.5">
                          ${isSlow ? 'Más lento' : 'Fluido'}
                        </span>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          </div>

          <!-- Resumen Pedagógico con IA y Puntos de Mejora + Envío Rápido al Apoderado -->
          <div class="p-3.5 rounded-2xl bg-indigo-50 text-slate-900 border-2 border-indigo-200 shadow-xs space-y-3">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-1.5">
                <div class="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <i data-lucide="sparkles" class="w-4 h-4"></i>
                </div>
                <div>
                  <h4 class="font-black text-xs text-indigo-950 uppercase tracking-wider">Resumen con IA y Puntos de Mejora</h4>
                  <span class="text-[10px] text-indigo-700 font-semibold">Análisis automático de precisión y velocidad por número</span>
                </div>
              </div>
              <button
                type="button"
                onclick="app.regenerarResumenIaMovil()"
                class="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-black text-[10px] flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <i data-lucide="refresh-cw" class="w-3 h-3"></i>
                <span>Regenerar IA</span>
              </button>
            </div>

            <div class="space-y-2 text-xs">
              <div class="p-2.5 rounded-xl bg-white border border-emerald-200">
                <span class="font-black text-[10px] uppercase text-emerald-700 block mb-0.5">Fortalezas Detectadas:</span>
                <p class="text-slate-700 font-semibold leading-snug">${ia.fortalezas || 'El estudiante completó la secuencia siguiendo las instrucciones auditivas de Robot Leo.'}</p>
              </div>
              <div class="p-2.5 rounded-xl bg-white border border-amber-300">
                <span class="font-black text-[10px] uppercase text-amber-800 block mb-0.5">Puntos de Mejora (IA):</span>
                <p class="text-slate-800 font-bold leading-snug">${ia.puntos_mejora || 'Practicar la fluidez en los números donde presentó mayor tiempo de respuesta.'}</p>
              </div>
            </div>

            <!-- Botón de acceso rápido y mensaje editable para enviar al apoderado como la profesora -->
            <div class="pt-2 border-t border-indigo-200/80 space-y-2">
              <label class="block text-[11px] font-black text-indigo-950">
                Mensaje listo para enviar a ${rev.apoderado_nombre || 'Carolina Tapia'} (como Profesora Marcela Soto):
              </label>
              <textarea
                id="mobile-teacher-ia-msg"
                rows="4"
                oninput="app.teacherReviewMessageDraft = this.value"
                class="w-full rounded-xl border border-indigo-300 bg-white p-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >${draftMsg}</textarea>

              ${this.teacherReviewSentSuccess ? `
                <div class="p-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black flex items-center justify-between gap-2">
                  <div class="flex items-center gap-1.5">
                    <i data-lucide="check-circle-2" class="w-4 h-4"></i>
                    <span>¡Mensaje enviado al chat del apoderado!</span>
                  </div>
                  <button
                    type="button"
                    onclick="app.cerrarRevisionActividadMovil(); app.setTab('mensajeria');"
                    class="px-2.5 py-1 rounded-lg bg-white text-emerald-900 font-black text-[10px] cursor-pointer"
                  >
                    Ver en Chat
                  </button>
                </div>
              ` : ''}

              <button
                type="button"
                onclick="app.enviarResumenApoderadoMovil()"
                class="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <i data-lucide="send" class="w-4 h-4"></i>
                <span>Enviar Resumen al Apoderado por Mensaje</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderMobileAssignModalInner() {
    const templates = Array.isArray(this.studentActivitiesTemplates) ? this.studentActivitiesTemplates : [];
    const statusMap = {};
    (this.teacherCatalogStatus || []).forEach(row => {
      if (row.codigo_frontend) statusMap[row.codigo_frontend] = row;
    });
    const selectedSet = new Set(Array.isArray(this.mobileModalSelectedCodes) ? this.mobileModalSelectedCodes : []);
    const selectedCount = templates.filter(t => selectedSet.has(t.id)).length;

    return `
      <form
        id="mobile-assign-activities-form"
        method="POST"
        action="#mobile-assign-activities"
        onsubmit="app.confirmarAsignarSeleccionMovil(event)"
        class="flex flex-col max-h-[86vh]"
        novalidate
      >
        <div class="p-4 border-b border-slate-200 flex items-start justify-between gap-3 bg-slate-50 rounded-t-3xl">
          <div class="space-y-0.5">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-900">
              1° Básico B • Mateo González
            </span>
            <h2 id="mobile-assign-modal-title" class="text-base font-black text-slate-900">
              Seleccionar Actividades a Asignar
            </h2>
            <p class="text-[11px] text-slate-600">Elige una o más actividades para enviar al dispositivo del alumno.</p>
          </div>
          <button
            type="button"
            onclick="app.cerrarModalAsignarActividadMovil()"
            ${this.isMobileAssigning ? 'disabled' : ''}
            aria-label="Cerrar ventana"
            class="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 cursor-pointer"
          >
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <div class="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between gap-2 bg-white">
          <button
            type="button"
            onclick="app.seleccionarTodasModalMovil()"
            class="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-black cursor-pointer"
          >
            Seleccionar todas (${templates.length})
          </button>
          <button
            type="button"
            onclick="app.limpiarSeleccionModalMovil()"
            class="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold cursor-pointer"
          >
            Limpiar
          </button>
        </div>

        <div class="p-4 overflow-y-auto space-y-2.5 flex-1 bg-slate-50/40">
          <fieldset class="space-y-2">
            <legend class="sr-only">Actividades disponibles para asignar</legend>
            ${templates.map((tpl, idx) => {
              const isChecked = selectedSet.has(tpl.id);
              const dbRow = statusMap[tpl.id];
              const isAssigned = Boolean(dbRow && dbRow.asignada);
              const isMath = (tpl.subject || '').toLowerCase().includes('matem');
              return `
                <label
                  for="mobile-modal-act-${tpl.id}"
                  class="flex items-start gap-3 p-3 rounded-2xl border-2 cursor-pointer min-h-[44px] ${
                    isChecked ? 'bg-blue-50/80 border-blue-500' : 'bg-white border-slate-200'
                  }"
                >
                  <input
                    type="checkbox"
                    id="mobile-modal-act-${tpl.id}"
                    name="mobile_activity_codes"
                    value="${tpl.id}"
                    ${isChecked ? 'checked' : ''}
                    ${idx === 0 ? 'autofocus' : ''}
                    ${this.isMobileAssigning ? 'disabled' : ''}
                    onchange="app.toggleActividadModalMovil('${tpl.id}', this.checked)"
                    style="accent-color: #1e3a8a;"
                    class="w-5 h-5 mt-0.5 rounded flex-shrink-0 cursor-pointer"
                  >
                  <div class="min-w-0 flex-1 space-y-1">
                    <div class="flex items-center justify-between gap-1.5 flex-wrap">
                      <span class="px-2 py-0.5 rounded-md text-[10px] font-black ${isMath ? 'bg-blue-100 text-blue-900' : 'bg-purple-100 text-purple-900'}">
                        ${tpl.subject} • ${tpl.oaCode}
                      </span>
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-black ${isAssigned ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}">
                        ${isAssigned ? 'Asignada' : 'No asignada'}
                      </span>
                    </div>
                    <span class="block font-black text-xs text-slate-900 leading-snug">${tpl.title}</span>
                  </div>
                </label>
              `;
            }).join('')}
          </fieldset>

          <div role="status" aria-live="polite" class="${this.mobileAssignModalError ? 'p-2.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-bold flex items-center gap-1.5' : 'hidden'}">
            <i data-lucide="alert-circle" class="w-4 h-4 text-rose-600 flex-shrink-0"></i>
            <span>${this.mobileAssignModalError || ''}</span>
          </div>
        </div>

        <div class="p-4 border-t border-slate-200 bg-slate-50 rounded-b-3xl flex items-center justify-between gap-2">
          <span class="text-xs font-bold text-slate-600">${selectedCount} seleccionada(s)</span>
          <div class="flex items-center gap-2">
            <button
              type="button"
              onclick="app.cerrarModalAsignarActividadMovil()"
              ${this.isMobileAssigning ? 'disabled' : ''}
              class="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              ${this.isMobileAssigning ? 'disabled' : ''}
              class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
              <span>${this.isMobileAssigning ? 'Asignando...' : `Asignar (${selectedCount})`}</span>
            </button>
          </div>
        </div>
      </form>
    `;
  },

  renderModalAsignarActividadMovil() {
    if (!this.isMobileTeacherAuthorized() || !this.isMobileAssignModalOpen) return '';
    return `
      <dialog
        id="mobile-assign-activities-dialog"
        aria-labelledby="mobile-assign-modal-title"
        closedby="any"
        class="w-[calc(100%-1.5rem)] max-w-md rounded-3xl p-0 bg-white text-slate-900 shadow-2xl border border-slate-200 m-auto"
      >
        <div id="mobile-assign-modal-body">
          ${this.renderMobileAssignModalInner()}
        </div>
      </dialog>
    `;
  },

  renderAsignarTab() {
    const templates = (Array.isArray(this.studentActivitiesTemplates) && this.studentActivitiesTemplates.length > 0)
      ? this.studentActivitiesTemplates
      : [];
    const statusMap = {};
    (this.teacherCatalogStatus || []).forEach(row => {
      if (row.codigo_frontend) {
        statusMap[row.codigo_frontend] = row;
      }
    });

    const assignedCount = templates.filter(t => statusMap[t.id] && statusMap[t.id].asignada).length;

    return `
      <div class="space-y-3">
        ${this.activeTeacherReview ? this.renderModalRevisionDocenteMovil() : ''}
        ${this.isMobileAssignModalOpen ? this.renderModalAsignarActividadMovil() : ''}
        <div class="p-4 rounded-2xl bg-slate-900 text-white shadow-sm space-y-3">
          <div class="flex items-center justify-between gap-2">
            <div>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30">
                1° Básico B • Mateo González
              </span>
              <h3 class="font-black text-sm text-white mt-1">Asignar y Revisar Actividades</h3>
              <p class="text-[11px] text-slate-300">Asigna actividades una a una, revisa cuánto tardó en cada número y envía el resumen IA al apoderado.</p>
            </div>
            <div class="text-right flex-shrink-0">
              <span class="block text-lg font-black text-amber-400 leading-none">${assignedCount}/${templates.length}</span>
              <span class="text-[10px] text-slate-400 font-bold">Asignadas</span>
            </div>
          </div>

          <div class="space-y-2 pt-1">
            <button
              type="button"
              onclick="app.abrirModalAsignarActividadMovil()"
              class="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-sm"
            >
              <i data-lucide="check-circle" class="w-4 h-4"></i>
              <span>Asignar actividad</span>
            </button>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                onclick="app.vaciarActividadesMovil()"
                class="py-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-rose-200 font-black text-[11px] transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                <span>Vaciar Bandeja</span>
              </button>
              <button
                type="button"
                onclick="app.asignarTodasActividadesMovil()"
                class="py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <i data-lucide="check-check" class="w-3.5 h-3.5"></i>
                <span>Asignar Todas</span>
              </button>
            </div>
          </div>
        </div>

        <div class="space-y-2.5">
          ${templates.map(tpl => {
            const dbRow = statusMap[tpl.id];
            const isAssigned = Boolean(dbRow && dbRow.asignada);
            const studentState = (dbRow && dbRow.estado_alumno) ? dbRow.estado_alumno : 'Sin asignar';
            const studentScore = (dbRow && dbRow.calificacion_alumno !== null && dbRow.calificacion_alumno !== undefined)
              ? Math.round(Number(dbRow.calificacion_alumno))
              : null;
            const rawComment = (dbRow && dbRow.comentarios_alumno) ? String(dbRow.comentarios_alumno) : '';
            const hasMistakes = rawComment.includes('Se equivocó en:');
            const mistakeDetail = hasMistakes ? rawComment.substring(rawComment.indexOf('Se equivocó en:')) : '';
            const isMath = (tpl.subject || '').toLowerCase().includes('matem');

            return `
              <div class="p-3.5 rounded-2xl bg-white border-2 ${isAssigned ? 'border-emerald-500/60 bg-emerald-50/20' : 'border-slate-200'} shadow-xs space-y-2.5">
                <div class="flex items-start justify-between gap-2">
                  <div class="space-y-1 min-w-0">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span class="px-2 py-0.5 rounded-md text-[10px] font-black ${isMath ? 'bg-blue-100 text-blue-900' : 'bg-purple-100 text-purple-900'}">
                        ${tpl.subject}
                      </span>
                      <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                        ${tpl.oaCode}
                      </span>
                      ${studentScore !== null ? `
                        <span class="px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-100 text-indigo-900 border border-indigo-200">
                          Puntaje: ${studentScore} / 10 pts
                        </span>
                      ` : ''}
                    </div>
                    <h4 class="font-black text-xs text-slate-900 leading-snug">${tpl.title}</h4>
                  </div>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-black flex-shrink-0 ${
                    isAssigned
                      ? (studentState === 'Entregada' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300')
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }">
                    ${isAssigned ? (studentState === 'Entregada' ? 'Completada' : 'Asignada') : 'No asignada'}
                  </span>
                </div>

                ${isAssigned && (hasMistakes || studentState === 'Entregada') ? `
                  <div class="p-2.5 rounded-xl text-[11px] font-bold border ${
                    hasMistakes
                      ? 'bg-rose-50 text-rose-900 border-rose-200'
                      : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  } flex items-start gap-1.5">
                    <i data-lucide="${hasMistakes ? 'alert-triangle' : 'check-circle-2'}" class="w-4 h-4 flex-shrink-0 mt-0.5 ${hasMistakes ? 'text-rose-600' : 'text-emerald-600'}"></i>
                    <div>
                      <span class="block font-black uppercase text-[10px] ${hasMistakes ? 'text-rose-700' : 'text-emerald-700'}">Diagnóstico Docente (Exclusivo Profesora):</span>
                      <span>${hasMistakes ? mistakeDetail : 'Secuencia completada sin errores en ningún número (10/10 pts).'}</span>
                    </div>
                  </div>
                ` : ''}

                <div class="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-slate-100">
                  ${isAssigned ? `
                    <button
                      type="button"
                      onclick="app.abrirRevisionActividadMovil('${tpl.id}')"
                      class="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-xs"
                    >
                      <i data-lucide="sparkles" class="w-4 h-4"></i>
                      <span>Revisar Respuestas, Tiempos y Resumen IA</span>
                    </button>
                    <button
                      type="button"
                      onclick="app.reiniciarPuntajeActividadMovil('${tpl.id}')"
                      class="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] transition flex items-center gap-1 active:scale-95 cursor-pointer shadow-xs"
                    >
                      <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                      <span>Reiniciar Puntaje</span>
                    </button>
                    <button
                      type="button"
                      onclick="app.desasignarActividadMovil('${tpl.id}')"
                      class="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-[11px] transition flex items-center gap-1 active:scale-95 cursor-pointer"
                    >
                      <i data-lucide="x" class="w-3.5 h-3.5"></i>
                      <span>Quitar</span>
                    </button>
                  ` : `
                    <button
                      type="button"
                      onclick="app.asignarActividadMovil('${tpl.id}')"
                      class="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-xs"
                    >
                      <i data-lucide="plus-circle" class="w-4 h-4"></i>
                      <span>Asignar a Mateo</span>
                    </button>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  renderBottomNavigation() {
    const isProf = this.currentUser.role === 'profesora' || this.currentUser.role === 'admin';
    return `
      <nav class="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2 flex items-center justify-around z-30 shadow-lg">
        <button onclick="app.setTab('mensajeria')" class="flex flex-col items-center gap-1 transition ${this.currentTab === 'mensajeria' ? 'text-blue-600 font-black' : 'text-slate-400 hover:text-slate-600 font-bold'}">
          <i data-lucide="message-square" class="w-5 h-5"></i>
          <span class="text-[10px]">Mensajería</span>
        </button>

        ${isProf ? `
          <button onclick="app.setTab('asignar')" class="flex flex-col items-center gap-1 transition ${this.currentTab === 'asignar' ? 'text-amber-600 font-black' : 'text-slate-400 hover:text-slate-600 font-bold'}">
            <i data-lucide="list-ordered" class="w-5 h-5"></i>
            <span class="text-[10px]">Asignar</span>
          </button>
        ` : ''}

        <button onclick="app.setTab('alertas')" class="flex flex-col items-center gap-1 transition ${this.currentTab === 'alertas' ? 'text-rose-600 font-black' : 'text-slate-400 hover:text-slate-600 font-bold'}">
          <div class="relative">
            <i data-lucide="bell" class="w-5 h-5"></i>
            ${!isProf ? `
              <span class="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-rose-500"></span>
            ` : ''}
          </div>
          <span class="text-[10px]">${isProf ? 'Acuses Curso' : 'Alertas'}</span>
        </button>

        ${!isProf ? `
          <button onclick="app.setTab('dashboard')" class="flex flex-col items-center gap-1 transition ${this.currentTab === 'dashboard' ? 'text-indigo-600 font-black' : 'text-slate-400 hover:text-slate-600 font-bold'}">
            <i data-lucide="layout-dashboard" class="w-5 h-5"></i>
            <span class="text-[10px]">Dashboard</span>
          </button>
        ` : ''}

        <button onclick="app.setTab('config')" class="flex flex-col items-center gap-1 transition ${this.currentTab === 'config' ? 'text-slate-900 font-black' : 'text-slate-400 hover:text-slate-600 font-bold'}">
          <i data-lucide="sliders" class="w-5 h-5"></i>
          <span class="text-[10px]">Ajustes</span>
        </button>
      </nav>
    `;
  }
};

window.app = app;
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
