# EDUCONNECT - Plataforma Escolar y Asistente de Voz IA (1° y 2° Básico)

Documentación técnica, funcional y de arquitectura para la presentación de los mockups interactivos de alta fidelidad del proyecto EDUCONNECT (Colegio San Andrés).

---

## 1. Ficha Técnica del Proyecto

| Parámetro | Detalle Técnico |
|---|---|
| **Proyecto** | EDUCONNECT - Plataforma de Aprendizaje y Gestión Escolar |
| **Nivel Educativo** | 1° y 2° Básico (Educación Primaria Inicial chilena, 6 a 7 años) |
| **Materias Troncales** | Lenguaje y Comunicación & Matemáticas (Exclusivas) |
| **Backend REST API** | Python 3.12 con FastAPI, Uvicorn y CORS middleware |
| **Motor de Base de Datos** | MySQL 8.4 LTS (`plataforma_educativa`, puerto 3306) |
| **Arquitectura Frontend** | Single Page Application (SPA) Vanilla Modular basada en componentes |
| **Modo de Operación** | Dual Mode (Conexión en vivo a MySQL vía FastAPI con fallback offline resiliente) |
| **Paradigma de Diseño** | Bento Grid Canvas con Dock Flotante Inferior (Desktop) + Native Bottom Tabs (Móvil) |
| **Agente de Voz** | "Robot Leo" (Lectura automática de enunciados para evitar barrera lectora en niños) |
| **Iconografía** | Lucide Icons (SVG vectorial accesible, 0% emojis) |
| **Gráficos** | Chart.js (Curvas temporales y desglose de aciertos) |

---

## 2. Stack Tecnológico y Decisiones de Ingeniería

### ¿Qué tecnologías utilizamos?

1. **HTML5 Semántico + ES6+ JavaScript (Vanilla):**
   - Toda la interactividad, el enrutamiento de vistas, la gestión de sesiones por roles y la inyección de componentes se programó con **JavaScript estándar moderno (ES6+)** utilizando funciones flecha, desestructuración y *template literals*.
   - **Ventaja técnica:** No requiere servidores intermedios de desarrollo ni entornos pesados (Node.js, npm, Webpack o Vite). El proyecto se ejecuta de forma inmediata haciendo doble clic en `index.html` o `mobile.html`.

2. **Tailwind CSS (CDN v3):**
   - Framework CSS *utility-first* que permite construir interfaces altamente estilizadas, responsivas y con espaciados precisos mediante clases atómicas.
   - Integra transiciones suaves, elevaciones con sombras (`shadow-sm`, `shadow-xl`) y estados activos (`active:scale-95`, `hover:`).

3. **Paleta Institucional Unificada y Tokens CSS:**
   - En [`css/styles.css`](file:///c:/Users/gusta/OneDrive/Escritorio/Capstone/Mockups/css/styles.css) se definen los tokens cromáticos corporativos centrados en la paleta *Azul Oxford* institucional, garantizando un alto contraste, legibilidad óptima para familias y docentes, y una identidad visual sobria y libre de distractores.

4. **Lucide Icons (Biblioteca SVG Vectorial):**
   - Integrada vía CDN (`lucide.js`). Sustituye el 100% de los emojis por iconos SVG limpios, nítidos en pantallas Retina y con soporte semántico de accesibilidad.

5. **Chart.js:**
   - Librería de renderizado en canvas HTML5 para métricas analíticas de reportería (curva de avance acumulado semana a semana y gráfico doughnut de respuestas correctas vs. corregidas).

---

### ¿Se utilizó alguna plantilla (template) externa prediseñada?

**No. El proyecto fue diseñado y construido 100% desde cero (*from scratch*).**

#### ¿Por qué decidimos no usar plantillas comerciales?

1. **Sobrepeso y Código Basura (*Bloatware*):** Las plantillas prediseñadas tipo Bootstrap o dashboards genéricos de internet contienen miles de líneas de código redundante, plugins desactualizados y dependencias de terceros que ralentizan la carga y dificultan el mantenimiento.
2. **Falta de Adaptación Pedagógica Inicial (6-7 años):** Ningún template comercial contempla los requisitos de accesibilidad cognitiva de niños de primer ciclo básico que aún están aprendiendo a leer (enunciados leídos por voz por defecto, botones de respuesta táctil sobredimensionados de 48px+ y animaciones de sonido).
3. **Incompatibilidad con el Modelo de Simplicidad para Apoderados:** Las plantillas estándar ofrecen dashboards con sobrecarga de métricas complejas. Nuestro diseño requería un enfoque centrado en la **simplicidad y lenguaje natural**: diagnóstico comprensible para cualquier apoderado sin tecnicismos ni sobrecargas innecesarias.
4. **Control Total del Layout Bento Dock:** La estructura Bento Grid con Dock Flotante (inspirada en iPadOS, Linear y macOS) requería un desarrollo CSS a medida para garantizar su posicionamiento flotante con efecto *glassmorphism* (`backdrop-blur-xl`).

---

## 3. Arquitectura del Software (Patrón Modular)

La arquitectura sigue una variante del patrón **MVC (Modelo-Vista-Controlador)** adaptada a Single Page Applications sin librerías:

```
Mockups/
├── index.html                  # Punto de entrada de la versión Desktop
├── mobile.html                 # Punto de entrada de la versión Móvil (Ctrl+Shift+C)
├── iniciar_backend.bat         # Lanzador de 1 clic para el servidor FastAPI
├── plataforma_educativa.sql    # Script SQL completo de creación y datos semilla
├── bd.txt                      # Definición original de la base de datos
├── usuarios.txt                # Credenciales y perfiles de demostración
├── backend/                    # Servidor REST API en Python
│   ├── main.py                 # Aplicación FastAPI con CORS y endpoints de salud
│   ├── database.py             # Pool de conexiones y utilidades para MySQL
│   ├── requirements.txt        # Dependencias (fastapi, uvicorn, mysql-connector, etc.)
│   ├── .env                    # Configuración de host, puerto y credenciales
│   └── routers/                # Controladores modulares por entidad
│       ├── auth.py             # Login y roles de usuario
│       ├── alumnos.py          # Alumnos, familias y cursos
│       ├── actividades.py      # Tareas y preguntas interactivas
│       ├── calificaciones.py   # Notas y registro de entregas
│       ├── mensajeria.py       # Conversaciones y chat escolar
│       └── alertas.py          # Notificaciones push y citaciones
├── css/
│   └── styles.css              # Variables de tema institucional y utilidades
├── js/
│   ├── api.js                  # [CLIENTE API] Comunicación HTTP con FastAPI y fallback
│   ├── data.js                 # [MODELO] Base de datos mock reactiva de respaldo
│   ├── components.js           # [COMPONENTES] Modal interactivo de Voz IA ("Robot Leo")
│   ├── layouts.js              # [LAYOUT] Bento Canvas, Isla superior y Dock adaptativo
│   ├── app.js                  # [CONTROLADOR DESKTOP] Router, estado global y autenticación
│   ├── mobile.js               # [CONTROLADOR MÓVIL] Lógica y vistas dedicadas para smartphone
│   └── views/                  # [VISTAS DESKTOP]
│       ├── login.js            # Pantalla de Login institucional y selector rápido de roles
│       ├── reporteria.js       # Vista 1: Informe y Semáforo en lenguaje natural
│       ├── alertas.js          # Vista 2: Emisión y confirmación de avisos urgentes
│       ├── actividades.js      # Vista 3: Misiones del alumno con preguntas habladas
│       ├── asignar.js          # Vista 4: Planificador docente con switch de voz Mineduc
│       └── mensajeria.js       # Vista 5: Chat oficial escrito con soporte de adjuntos
└── README.md
```

### Flujo de Datos y Renderizado:
1. El usuario inicia sesión manual o mediante los botones de **1 Clic**.
2. El controlador (`app.js` o `mobile.js`) actualiza el estado `currentUser` y define la vista por defecto.
3. El motor de layout inyecta la cabecera (Isla), el cuerpo del módulo y el Dock Flotante.
4. Al terminar el ciclo de renderizado, la función `lucide.createIcons()` hidrata el DOM convirtiendo las etiquetas `<i data-lucide="...">` en vectores SVG optimizados.

---

## 4. Detalle de las Vistas Desarrolladas

### 4.1 Versión de Escritorio (`index.html`)

#### 1. Login Institucional (`js/views/login.js`)
- Formulario de autenticación con validación de credenciales.
- **Acceso Rápido Demo (1 Clic):** 4 tarjetas intuitivas para ingresar de inmediato como *Administrador*, *Profesora*, *Apoderado* o *Alumno*.
- Enlace directo a la versión móvil y recordatorio de credenciales disponibles en `usuarios.txt`.

#### 2. Bento Dock & Header Island (`js/layouts.js`)
- **Isla Superior:** Identifica al usuario activo con su avatar (con fallback automático anti-caídas), nombre, rol formal y curso. Integra enlace a la versión móvil y botón de cierre de sesión / cambio de rol.
- **Dock Flotante Inferior:** Barra táctil flotante con iconos vectoriales que se adapta dinámicamente según el rol autenticado:
  - *Alumno:* Misiones con Voz, Mi Semáforo, Mis Mensajes.
  - *Apoderado:* Informe y Semáforo, Tareas (etiqueta generalizada), Mensajería Docente.
  - *Profesora / Admin:* Asignar Tareas, Alertas al Curso, Mensajería, Rendimiento.

#### 3. Reportería de Desempeño (`js/views/reporteria.js`)
- **Filtro Multi-Estudiante para Familias:** Selector dinámico que permite a apoderados con más de un pupilo alternar instantáneamente entre sus hijos (ej. Mateo en 1° Básico B y Sofía en 2° Básico A) actualizando diagnósticos y métricas en tiempo real.
- **Diseño Inclusivo y Accesible:**
  - Diagnóstico en lenguaje natural (*"Mateo va muy bien este semestre"* o *"Sofía va muy bien este semestre"*).
  - Sello destacado de nota promedio sobre escala de 1.0 a 7.0 recordando que 4.0 es la nota mínima de aprobación.
  - 3 tarjetas de respuesta inmediata a dudas cotidianas (*Tareas de la semana*, *Ritmo de estudio*, *Comunicación con el docente jefe*).
  - Semáforo visual claro por asignatura centrado exclusivamente en **Matemáticas** y **Lenguaje y Comunicación**.
  - Guía pedagógica para apoyar el aprendizaje en el hogar personalizada para cada nivel escolar.

#### 4. Alertas al Curso (`js/views/alertas.js`)
- Selector de cursos para profesores con más de un nivel asignado (*1° Básico B, 1° Básico A, 2° Básico A*).
- Redactor con categorías de prioridad (*Urgente, Académica, Citación, Informativa*).
- Previsualización en vivo de la notificación push móvil y métricas de tasa de lectura confirmada de apoderados (*26 de 28 leídos*).

#### 5. Actividades con Voz IA para Alumnos (`js/views/actividades.js` y `js/components.js`)
- **Selector de Estudiante:** Permite filtrar las misiones correspondientes a cada estudiante (1° Básico o 2° Básico).
- Misiones interactivas con **Agente de Voz IA ("Robot Leo")** activado por defecto para superar la barrera de lectoescritura inicial.
- **Modal de Ejercitación por Voz:**
  - Onda sonora animada que simula el habla del robot.
  - Botón *"Repetir la pregunta en voz alta"*.
  - Doble modalidad de respuesta: por micrófono infantil o tocando tarjetas grandes de opción múltiple con feedback de aprobación inmediato.

#### 6. Asignación Curricular Docente (`js/views/asignar.js`)
- Programación de tareas vinculadas al currículum Mineduc exclusivamente en **Matemáticas** y **Lenguaje y Comunicación**.
- Switch pedagógico obligatorio: *"Agente de Voz IA por Defecto (1° y 2° Básico)"*.
- Matriz individualizada de alumnos para aplicar adecuaciones de ritmo o soporte PIE.

#### 7. Mensajería Oficial Escolar (`js/views/mensajeria.js`)
- Canal formal de comunicación escrito entre apoderados y profesores (sin audios para garantizar trazabilidad).
- Soporte para adjuntar justificativos médicos o certificados oficiales, confirmación de lectura (*"Visto por la profesora"*) y horarios de atención docente.

---

### 4.2 Versión Móvil (`mobile.html`) - Diseñada para `Ctrl + Shift + C`

La versión móvil está optimizada para la resolución de smartphones (375px a 430px) y diseñada para evaluarse mediante las herramientas de desarrollo del navegador.

#### Reglas de Acceso y Funcionalidades Móviles:
- **Acceso Restringido:** Habilitado exclusivamente para **Profesor** y **Apoderado**. Los roles de Alumno y Administrador se derivan a la versión de escritorio.
- **Diferenciación de Permisos por Rol:**
  - **Apoderado en Móvil (3 pestañas inferiores):**
    1. `Mensajes`: Chat táctil con la profesora jefe y subida de justificativos.
    2. `Reporte`: Semáforo vertical de notas de Mateo en Lenguaje y Matemáticas.
    3. `Alertas`: Visualización y confirmación de lectura de avisos escolares.
  - **Profesor en Móvil (2 pestañas inferiores):**
    1. `Mensajes`: Chat directo con apoderados del curso.
    2. `Reporte`: Promedio global y avance del curso 1° Básico B.
    - **REGLA ESTRICTA:** **La pestaña de Alertas no existe en la versión móvil del profesor.** La gestión y emisión de alertas queda reservada exclusivamente a la versión de escritorio.

---

## 5. Restricción Curricular: Lenguaje y Matemáticas

Siguiendo las directrices pedagógicas para 1° y 2° básico de la educación chilena, se removieron todas las asignaturas adicionales. La plataforma gestiona únicamente:

1. **Lenguaje y Comunicación:**
   - Lectoescritura inicial, fonética de las primeras consonantes (M, P, L, S), comprensión auditiva de cuentos y reconocimiento de vocales y rimas.
2. **Matemáticas:**
   - Conteo lúdico, cálculo mental inicial, resolución de problemas contextualizados con frutas y animales, y sumas y restas hasta el número 10.

---

## 6. Credenciales de Prueba (`usuarios.txt`)

| Rol | Nombre | Correo Electrónico | Contraseña | Plataformas Disponibles |
|---|---|---|---|---|
| **Administrador** | Rodrigo Valenzuela | `admin@sanandres.cl` | `admin123` | Exclusivo Escritorio |
| **Profesora** | Marcela Soto | `profesora@sanandres.cl` | `profe123` | Escritorio y Móvil (sin alertas en móvil) |
| **Apoderado** | Carolina Tapia | `apoderado@sanandres.cl` | `apoderado123` | Escritorio y Móvil (con alertas) |
| **Alumno** | Mateo González (1°B) | `alumno@sanandres.cl` | `alumno123` | Exclusivo Escritorio (Misiones de Voz) |

---

## 7. Instrucciones para la Presentación / Defensa

1. **Para mostrar la Versión de Escritorio:**
   - Haz doble clic sobre [`index.html`](file:///c:/Users/gusta/OneDrive/Escritorio/Capstone/Mockups/index.html).
   - Utiliza los botones de acceso rápido de 1 clic para demostrar cómo cambia el Dock inferior y los permisos entre Alumno, Apoderado, Profesora y Administrador.
   - Demuestra el modal interactivo de voz de Robot Leo en la vista de Actividades.
   - En el rol de **Apoderado**, muestra el **Filtro de Estudiantes** en Reportería y Tareas para alternar entre Mateo (1° Básico) y Sofía (2° Básico).

2. **Para mostrar la Versión Móvil:**
   - Haz doble clic sobre [`mobile.html`](file:///c:/Users/gusta/OneDrive/Escritorio/Capstone/Mockups/mobile.html) (o pulsa *"Versión Móvil"* desde la barra superior de escritorio).
   - Abre las herramientas de desarrollo de Chrome/Edge pulsando <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>C</kbd> (o <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>M</kbd>).
   - Selecciona un dispositivo táctil (ejemplo: *iPhone 14 Pro* o *Pixel 7* a 390px).
   - Ingresa primero como **Apoderada**: destaca las 3 pestañas inferiores (*Mensajes, Reporte, Alertas*) y la confirmación de lectura de avisos.
   - Cierra sesión e ingresa como **Profesora**: resalta que **la pestaña de Alertas desaparece**, manteniendo únicamente Mensajes y Reporte según las especificaciones de seguridad y rol.
