# Aplicación Móvil EduConnect (APK) - Colegio San Andrés

## 1. Descripción del Módulo Móvil
Aplicación móvil ligera y autónoma desarrollada para **Profesor** y **Apoderado** del Colegio San Andrés, construida sobre arquitectura híbrida de alto rendimiento con **Capacitor 7** y **Tailwind CSS**.

### Alcance Funcional:
1. **Autenticación y Selección de Rol:**
   - **Profesor:** Gestión pedagógica del curso asignado (1° Básico B), nómina de apoderados y emisión de alertas.
   - **Apoderado:** Seguimiento con selector de pupilo (Mateo González 1° Básico B / Sofía González 2° Básico A).
2. **Bandeja de Alertas con Acuse de Recibo:**
   - Clasificación por prioridad (Urgente / Informativa).
   - Botón formal de **"Acuse de recibo"** que persiste el estado en la base de datos MySQL (`NOTIFICACION.estado = 'LEIDA'`).
   - Tablero del profesor con **porcentaje de confirmación** en tiempo real de las familias del curso.
3. **Mensajería Escolar:**
   - **Canal Grupal:** Comunicados oficiales unidireccionales de la profesora jefe a todo el curso con confirmación de lectura.
   - **Chat Individual:** Conversación bidireccional cronológica con verificación de entrega y lectura.
4. **Resiliencia y Modo Offline:**
   - Si el servidor backend no está encendido o no hay conexión a internet durante la evaluación, la app opera de manera transparente usando caché local (`LocalStorage`) y colas de sincronización automática.

---

## 2. Estructura de Archivos del Proyecto Móvil

```
app/
├── www/                         # Código fuente web empaquetado (HTML, JS, CSS)
│   ├── index.html               # Vista móvil optimizada para pantallas táctiles
│   ├── manifest.json            # Manifiesto PWA para instalación directa
│   ├── service-worker.js        # Caché y resiliencia offline de assets estáticos
│   ├── css/
│   │   └── styles.css           # Estilos institucionales de la plataforma
│   └── js/
│       ├── app.js               # Controlador reactivo móvil (Roles, Alertas, Chat)
│       ├── mobile-api.js        # Cliente API REST con colas offline
│       └── data.js              # Datos semilla y réplica de cursos
├── android/                     # Proyecto nativo Gradle generado por Capacitor
│   ├── app/
│   │   └── src/main/
│   │       ├── AndroidManifest.xml # Configuración de permisos e Internet
│   │       └── assets/public/      # Espejo de assets web sincronizados
│   ├── build.gradle
│   └── gradlew.bat              # Script Gradle Wrapper para compilación
├── capacitor.config.json        # Configuración nativa (ID: cl.duoc.educonnect)
└── package.json                 # Dependencias npm de Capacitor
```

---

## 3. Guía de Ejecución y Pruebas

### A. Prueba Inmediata en Navegador (Vista Móvil)
1. Abrir el archivo `app/www/index.html` en Google Chrome o Microsoft Edge.
2. Presionar `F12` y luego `Ctrl + Shift + M` para activar la simulación de pantalla de teléfono móvil.
3. Se puede ingresar directamente utilizando los botones de acceso rápido:
   - **Docente:** Tía Marcela Soto (`profesora@sanandres.cl` / `profe123`)
   - **Apoderado:** Carolina Tapia (`apoderado@sanandres.cl` / `apoderado123`)

### B. Compilación del Archivo APK (`EduConnect.apk`)
El proyecto está completamente preparado con Gradle Wrapper:
1. Abrir una terminal en la carpeta `app/android/`:
   ```bash
   cd app/android
   ```
2. Ejecutar la compilación en modo depuración:
   ```bash
   .\gradlew.bat assembleDebug
   ```
   *(O bien abrir la carpeta `app/android` directamente en Android Studio y seleccionar `Build > Build Bundle(s) / APK(s) > Build APK(s)`)*.
3. El archivo binario generado se ubicará en:
   `app/android/app/build/outputs/apk/debug/app-debug.apk`
   y podrá ser renombrado como `EduConnect.apk`.
