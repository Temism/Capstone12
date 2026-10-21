# EDUCONNECT - Mockups Interactivos de Plataforma Escolar

Este proyecto contiene **5 mockups de alta fidelidad** interactivos diseñados para evaluar layouts, experiencia de usuario, orden de elementos y combinaciones de colores antes de la implementación final.

---

## 🚀 ¿Cómo Abrir los Mockups?

No requiere instalación de Node, npm ni ningún paquete.

1. Abre el explorador de archivos en la carpeta:
   `c:\Users\gusta\OneDrive\Escritorio\Capstone\Mockups`
2. Haz **doble clic** sobre el archivo **`index.html`** (se abrirá de inmediato en Google Chrome, Microsoft Edge o cualquier navegador).

---

## 📐 3 Versiones de Diseño y Navegación ("Layout Switcher")

Para comparar distintas formas de estructurar la plataforma y encontrar la que mejor se adapte a niños, docentes y familias, puedes alternar entre **3 filosofías de navegación y orden en vivo**:

| # | Diseño | Filosofía de Navegación | Estructura & Orden |
|---|---|---|---|
| **1** | **Barra Clásica** | Navegación horizontal tradicional | Menú superior con pestañas y contenedor centrado clásico (`max-w-7xl`). |
| **2** | **Sidebar Dashboard (★ Recomendado)** | Plataforma SaaS profesional (estilo Slack / Google Classroom / Notion) | **Barra lateral izquierda fija** con selector de cursos, perfil con avatar, navegación vertical agrupada por roles (*Estudiante, Familia, Docencia*) y widget permanente de Robot Leo en la esquina inferior izquierda. Deja el área de trabajo limpia con breadcrumbs y búsqueda. |
| **3** | **Bento + Dock Lúdico** | Diseño minimalista moderno (estilo Apple / Duolingo for Kids / Canvas) | Sin barras laterales pesadas. Cuenta con una **Isla flotante superior** y un **Dock flotante inferior (estilo macOS/iPad)** con iconos grandes y táctiles, ideal para pantallas táctiles y tablets. |

*Puedes alternar entre las 3 versiones con un solo clic en el selector `Diseño: [ 1. Clásico ] [ 2. Sidebar ★ ] [ 3. Bento Dock ]`.*

---

## 🎨 Comparador de Colores en Tiempo Real ("Sorpréndeme")

En la barra de controles encontrarás un selector interactivo con 3 paletas diseñadas para el proyecto:

1. **🎓 Azul Oxford (Academic):** Paleta institucional formal, azul marino profundo con toques dorados.
2. **🌿 Nordic Esmeralda (EdTech):** Paleta fresca y moderna, con verde esmeralda y menta.
3. **🔮 Cyber Índigo (NextGen):** Paleta tecnológica futurista, con índigo profundo y acentos fucsia.

---

## 🖥️ Las 5 Vistas Implementadas (Adaptadas a 1° y 2° Básico)

| # | Vista | Rol / Actor | Características Principales |
|---|---|---|---|
| **1** | **Reportería** | **Apoderado** | • **Modo Resumen Fácil (por defecto):** Para apoderados sin experiencia digital (diagnóstico en lenguaje natural, sello visual de nota `6.4` con recordatorio de que 4.0 es aprobación, 3 dudas cotidianas resueltas y semáforo de asignaturas).<br>• **Modo Analítico:** Curva semanal en Chart.js, desglose de aciertos/errores y tabla con tiempos. |
| **2** | **Alertas** | **Profesora** | • **Selector de curso:** Alterna entre los cursos asignados (1° Básico B, 1° Básico A, 2° Básico A).<br>• Redactor de alertas con niveles de urgencia (*🚨 Urgente, 📚 Académica, etc.*) y vista previa push.<br>• Tasa de confirmación de lectura de apoderados (*26 de 28 leídos*). |
| **3** | **Actividades (Voz IA)** | **Alumno (6-7 años)** | • **Agente de Voz IA ("Robot Leo 🤖"):** La IA lee las preguntas habladas por defecto al entrar a la tarea para niños en etapa de lectoescritura inicial.<br>• Botón *"🔊 Repetir la pregunta en voz alta"* y doble modalidad de respuesta (por micrófono o tocando tarjetas grandes). |
| **4** | **Asignar Actividades** | **Profesora** | • Programación de fechas y horas de entrega de actividades Mineduc.<br>• **Switch Curricular:** *"Agente de Voz IA por Defecto"* para asegurar que los niños tengan preguntas habladas y soporte sonoro.<br>• Matriz de habilitación de alumnos con soporte PIE. |
| **5** | **Mensajería** | **Familia / Colegio** | • Canal oficial de comunicación 100% escrito.<br>• Chat con la Profesora Jefe, confirmación de lectura (*"Visto por la profesora ✓✓"*) y adjuntos de justificativos médicos. |

---

## 📁 Estructura del Proyecto

```
Mockups/
├── index.html              # Archivo principal ejecutable con app-root dinámico
├── css/
│   └── styles.css          # Estilos de temas, onda sonora, floating dock y bento cards
├── js/
│   ├── data.js             # Mock data para 1° y 2° básico (notas 1-7, Robot Leo, alertas)
│   ├── components.js       # Reproductor interactivo de Robot Leo y barra superior
│   ├── layouts.js          # Motor con las 3 versiones de navegación (Topbar, Sidebar, Bento)
│   ├── views/
│   │   ├── reporteria.js   # Vista 1: Modo Fácil y Avanzado
│   │   ├── alertas.js      # Vista 2: Emisión y confirmación de alertas
│   │   ├── actividades.js  # Vista 3: Portal del alumno + preguntas habladas
│   │   ├── asignar.js      # Vista 4: Habilitación docente de actividades
│   │   └── mensajeria.js   # Vista 5: Chat oficial escrito con adjuntos
│   └── app.js              # Enrutador de layouts y vistas
└── README.md
```
