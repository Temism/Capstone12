# Contrato Oficial de API Backend (Base de Datos Local) — Plataforma EDUCONNECT

Este documento especifica **exclusivamente los endpoints y métodos HTTP que interactúan con la base de datos local (MySQL)**, junto con sus parámetros de entrada y estructuras exactas de respuesta (`Response JSON`) esperadas por el frontend (`js/api.js`, `js/app.js` y las vistas en `js/views/`).

Si el backend respeta exactamente estas rutas, nombres de propiedades y tipos de datos, **la plataforma mantendrá el 100% de su funcionamiento actual sin requerir modificaciones en el frontend**.

---

## 1. Configuración General del Servidor

- **URL Base esperada por el Frontend ([js/api.js](file:///c:/Users/gusta/OneDrive/Escritorio/Capstone/Mockups/js/api.js)):**
  ```text
  http://localhost:8000/api
  ```
- **CORS:** Permitir orígenes web (`*` en entorno local), métodos `GET, POST, PUT, DELETE, OPTIONS` y cabeceras `Authorization, Content-Type`.
- **Autenticación:** Token JWT enviado en la cabecera `Authorization: Bearer <access_token>`.
- **Formato estándar de errores HTTP (400, 401, 403, 404, 500):**
  El frontend lee siempre la propiedad `detail` cuando una respuesta devuelve error:
  ```json
  {
    "detail": "Descripción legible del error"
  }
  ```

---

## 2. Reglas de Compatibilidad de Datos con el Frontend

Para que las vistas de **Actividades**, **Reportería**, **Mensajería**, **Alertas** y **Asignación** funcionen sin alteraciones, los datos devueltos desde la base de datos deben cumplir estas 4 reglas:

1. **Identificadores de Estudiantes (`student_ref` / `student_code`):**
   El frontend puede consultar un alumno enviando su código string (`"alu-102"`, `"alu-103"`) o su `id` numérico de la tabla `ALUMNO`:
   - `"alu-102"`, `"5"` o `"mateo"` -> **Mateo González Tapia** (`alumno_id = 5`, `usuario_id = 14`, `curso_id = 3` — 1° Básico B).
   - `"alu-103"`, `"6"` o `"sofia"` -> **Sofía González Tapia** (`alumno_id = 6`, `usuario_id = 15`, `curso_id = 4` — 2° Básico A).

2. **Códigos de Vinculación de Actividades (`codigo_frontend` en tabla `ACTIVIDAD`):**
   La función `api.syncStudentDataFromDb()` enlaza los registros de la base de datos con las actividades del frontend mediante el campo `codigo_frontend`:
   - **1° Básico B (`curso_id = 3`):**
     - `"act-conteo"`: *Misión Conteo Mágico: Cuenta del 1 al 10 con Robot Leo* (`Matemáticas` — MA01 OA 01)
     - `"act-mat-2"`: *El Bosque de los Números: Sumas hasta el 10 con Voz* (`Matemáticas` — MA01 OA 09)
     - `"act-len-1"`: *Caza de Sonidos: Sonido Inicial con M, P, L y S* (`Lenguaje y Comunicación` — LE01 OA 03)
     - `"act-len-2"`: *Cuentos que Hablan: La Zorra y las Uvas* (`Lenguaje y Comunicación` — LE01 OA 18)
   - **2° Básico A (`curso_id = 4`):**
     - `"act-sofia-1"`, `"act-sofia-2"`, `"act-sofia-3"`, `"act-sofia-4"`.

3. **Valores Exactos de Estado (`estado` en tabla `ENTREGA`):**
   Deben respetarse exactamente estos tres strings:
   - `"Pendiente"` (`progreso = 0`, `calificacion = null`)
   - `"En progreso"` (`progreso = 1..99`, `calificacion = null`)
   - `"Entregada"` (`progreso = 100`, `calificacion = 1.0..7.0`, por defecto `7.0`)

4. **Valores Exactos de Asignatura (`asignatura` en tabla `ACTIVIDAD`):**
   - `"Matemáticas"`
   - `"Lenguaje y Comunicación"`

---

## 3. Catálogo de Endpoints de Base de Datos

---

### MÓDULO 1: Salud de la Base de Datos

#### 1.1 `GET /api/health`
- **Consumido por:** `api.checkHealth()` al iniciar la aplicación.
- **Tablas involucradas:** `SELECT 1` sobre la conexión activa a MySQL.
- **Descripción:** Indica al frontend si el backend tiene conexión activa a la base de datos (`api.isOnline = true`).
- **Response esperado (`200 OK` - `application/json`):**
  ```json
  {
    "status": "healthy",
    "database_connected": true,
    "database_name": "educonnect_db",
    "environment": "production-ready"
  }
  ```
  *(Nota: El frontend valida `data.database_connected === true || data.status === "healthy"`).*

#### 1.2 `GET /`
- **Descripción:** Ruta raíz informativa del estado del servidor y conexión a la base de datos.
- **Response esperado (`200 OK` - `application/json`):**
  ```json
  {
    "sistema": "EDUCONNECT API",
    "version": "1.0.0",
    "estado": "ONLINE",
    "seguridad": "JWT + Bcrypt + CORS + Security Headers",
    "mysql_status": "CONECTADO",
    "mysql_host": "localhost:3306",
    "mysql_database": "educonnect_db",
    "docs_url": "http://localhost:8000/docs"
  }
  ```

---

### MÓDULO 2: Autenticación y Usuarios (`/api/auth`)

#### 2.1 `POST /api/auth/login`
- **Consumido por:** `loginView.handleSubmit()` y `api.login(email, password)`.
- **Tablas involucradas:** `USUARIO`, `USUARIO_ROL`, `ROL`.
- **Request Body (`application/json`):**
  ```json
  {
    "email": "apoderado@sanandres.cl",
    "password": "apoderado123"
  }
  ```
- **Response esperado (`200 OK` - `application/json`):**
  ```json
  {
    "id": 13,
    "nombre": "Carolina Tapia Morales",
    "email": "apoderado@sanandres.cl",
    "estado": "ACTIVO",
    "roles": ["APODERADO"],
    "rol_principal": "APODERADO",
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer"
  }
  ```
  *(Nota crítica: El frontend evalúa `rol_principal` para definir la vista inicial: si contiene `"ADMIN"` asigna rol `admin`, `"PROFE"` -> `profesora`, `"ALUM"` -> `alumno`, `"APODERADO"` -> `apoderado`).*
- **Respuestas de error esperadas:**
  - `404`: `{"detail": "Usuario no encontrado en los registros escolares"}`
  - `403`: `{"detail": "La cuenta se encuentra inactiva o suspendida"}`
  - `401`: `{"detail": "Contraseña incorrecta"}`

#### 2.2 `GET /api/auth/verificar`
- **Descripción:** Valida el token JWT enviado en la cabecera `Authorization: Bearer <token>`.
- **Headers requeridos:** `Authorization: Bearer <token>`
- **Response esperado (`200 OK` - `application/json`):**
  ```json
  {
    "valid": true,
    "usuario": {
      "id": "13",
      "email": "apoderado@sanandres.cl",
      "nombre": "Carolina Tapia Morales",
      "rol_principal": "APODERADO",
      "roles": ["APODERADO"]
    }
  }
  ```

#### 2.3 `GET /api/auth/usuarios`
- **Tablas involucradas:** `USUARIO`, `USUARIO_ROL`, `ROL`.
- **Descripción:** Lista los usuarios del sistema con sus roles concatenados, sin exponer hashes de contraseñas.
- **Response esperado (`200 OK` - `application/json`):**
  ```json
  [
    {
      "id": 12,
      "nombre": "Marcela Soto Valenzuela",
      "email": "profesora@sanandres.cl",
      "estado": "ACTIVO",
      "roles_str": "PROFESOR"
    },
    {
      "id": 13,
      "nombre": "Carolina Tapia Morales",
      "email": "apoderado@sanandres.cl",
      "estado": "ACTIVO",
      "roles_str": "APODERADO"
    }
  ]
  ```

---

### MÓDULO 3: Estudiantes y Cursos (`/api/alumnos`)

#### 3.1 `GET /api/alumnos/`
- **Tablas involucradas:** `ALUMNO`, `USUARIO`.
- **Descripción:** Lista todos los estudiantes registrados.
- **Response esperado (`200 OK` - `application/json`):**
  ```json
  [
    {
      "alumno_id": 5,
      "usuario_id": 14,
      "nombre": "Mateo González Tapia",
      "email": "alumno@sanandres.cl",
      "fecha_nacimiento": "2019-05-14"
    },
    {
      "alumno_id": 6,
      "usuario_id": 15,
      "nombre": "Sofía González Tapia",
      "email": "sofia@sanandres.cl",
      "fecha_nacimiento": "2018-08-22"
    }
  ]
  ```

#### 3.2 `GET /api/alumnos/apoderado/{apoderado_id}`
- **Consumido por:** `api.getStudentsByParent(parentId)`.
- **Tablas involucradas:** `ALUMNO_APODERADO`, `ALUMNO`, `USUARIO`, `ENTREGA`.
- **Parámetros de ruta:** `apoderado_id` (int, ej. `13`).
- **Response esperado (`200 OK` - `application/json`):**
  ```json
  [
    {
      "alumno_id": 5,
      "usuario_id": 14,
      "nombre": "Mateo González Tapia",
      "email": "alumno@sanandres.cl",
      "fecha_nacimiento": "2019-05-14",
      "promedio_general": 6.6
    },
    {
      "alumno_id": 6,
      "usuario_id": 15,
      "nombre": "Sofía González Tapia",
      "email": "sofia@sanandres.cl",
      "fecha_nacimiento": "2018-08-22",
      "promedio_general": 6.5
    }
  ]
  ```

#### 3.3 `GET /api/alumnos/{alumno_id}`
- **Tablas involucradas:** `ALUMNO`, `USUARIO`, `ALUMNO_APODERADO`.
- **Parámetros de ruta:** `alumno_id` (int, ej. `5`).
- **Response esperado (`200 OK` - `application/json`):**
  ```json
  {
    "alumno_id": 5,
    "usuario_id": 14,
    "nombre": "Mateo González Tapia",
    "email": "alumno@sanandres.cl",
    "fecha_nacimiento": "2019-05-14",
    "apoderado_nombre": "Carolina Tapia Morales",
    "apoderado_email": "apoderado@sanandres.cl"
  }
  ```

#### 3.4 `GET /api/alumnos/cursos/todos`
- **Tablas involucradas:** `CURSO`, `USUARIO`.
- **Descripción:** Lista todos los cursos y los datos del profesor jefe a cargo.
- **Response esperado (`200 OK` - `application/json`):**
  ```json
  [
    {
      "id": 3,
      "nombre": "1° Básico B",
      "nivel": "1° Básico",
      "profesor_usuario_id": 12,
      "profesor_nombre": "Marcela Soto Valenzuela",
      "profesor_email": "profesora@sanandres.cl"
    },
    {
      "id": 4,
      "nombre": "2° Básico A",
      "nivel": "2° Básico",
      "profesor_usuario_id": 12,
      "profesor_nombre": "Marcela Soto Valenzuela",
      "profesor_email": "profesora@sanandres.cl"
    }
  ]
  ```

---

### MÓDULO 4: Actividades y Estados (`/api/actividades`)

#### 4.1 `POST /api/actividades/estado`  *(ENDPOINT CRÍTICO)*
- **Consumido por:** `api.updateActivityState(payload)` y `app.persistCurrentActivityState()`.
- **Tablas involucradas:** `ACTIVIDAD`, `ENTREGA`, `INTERACCION_ACTIVIDAD`, `ALUMNO`.
- **Descripción:** Inserta o actualiza (`UPSERT`) en la tabla `ENTREGA` el estado de una actividad para un alumno (`Pendiente`, `En progreso`, `Entregada`), su porcentaje de avance (`0..100`), su calificación (`7.0` al completarse) y registra la trazabilidad en `INTERACCION_ACTIVIDAD`. Si `estado == "Entregada"`, actualiza `urgente = FALSE` en `ACTIVIDAD`.
- **Request Body (`application/json`):**
  ```json
  {
    "alumno_id": null,
    "student_code": "alu-102",
    "actividad_id": null,
    "codigo_frontend": "act-conteo",
    "titulo": "Misión Conteo Mágico: Cuenta del 1 al 10 con Robot Leo",
    "asignatura": "Matemáticas",
    "estado": "Entregada",
    "progreso": 100,
    "calificacion": 7.0,
    "comentarios": "Conteo del 1 al 10 en orden completado correctamente (MA01 OA 01).",
    "tiempo_minutos": 8
  }
  ```
- **Response esperado (`200 OK` - `application/json`):**
  ```json
  {
    "success": true,
    "operacion": "actualizado",
    "entrega_id": 12,
    "actividad_id": 7,
    "alumno_id": 5,
    "estado": "Entregada",
    "progreso": 100,
    "calificacion": 7.0,
    "fecha_entrega": "2026-10-17"
  }
  ```

#### 4.2 `GET /api/actividades/alumno/{student_ref}`
- **Tablas involucradas:** `ACTIVIDAD`, `ENTREGA`.
- **Parámetros de ruta:** `student_ref` (string, ej. `"alu-102"` o `"5"`).
- **Descripción:** Obtiene todas las actividades asignadas al curso del alumno con su estado actual desde `ENTREGA`.
- **Response esperado (`200 OK` - `application/json`):**
  ```json
  {
    "alumno_id": 5,
    "curso_id": 3,
    "actividades": [
      {
        "actividad_id": 7,
        "codigo_frontend": "act-conteo",
        "titulo": "Misión Conteo Mágico: Cuenta del 1 al 10 con Robot Leo",
        "descripcion": "Desafío interactivo de voz (Mineduc MA01 OA 01). Cuenta en voz alta y en orden ascendente del uno al diez para iluminar tus tarjetas.",
        "asignatura": "Matemáticas",
        "fecha_entrega": "2026-10-16",
        "ponderacion": 25.0,
        "dificultad": "1° Básico • MA01 OA 01",
        "tiempo_estimado": "5 min",
        "cantidad_preguntas": 10,
        "urgente": true,
        "estado": "Pendiente",
        "progreso": 0,
        "calificacion": null,
        "comentarios": "Actividad de conteo secuencial pendiente de realizar.",
        "fecha_registro": "2026-10-16",
        "tiempo_minutos": 5
      }
    ]
  }
  ```

#### 4.3 `GET /api/actividades/`
- **Tablas involucradas:** `ACTIVIDAD`, `CURSO`, `USUARIO`, `PREGUNTA`.
- **Descripción:** Lista todas las actividades registradas en el sistema.
- **Response esperado (`200 OK` - `application/json`):**
  ```json
  [
    {
      "id": 7,
      "curso_id": 3,
      "curso_nombre": "1° Básico B",
      "profesor_usuario_id": 12,
      "profesor_nombre": "Marcela Soto Valenzuela",
      "titulo": "Misión Conteo Mágico: Cuenta del 1 al 10 con Robot Leo",
      "descripcion": "Desafío interactivo de voz (Mineduc MA01 OA 01)...",
      "fecha_entrega": "2026-10-16",
      "ponderacion": 25.0,
      "asignatura": "Matemáticas",
      "codigo_frontend": "act-conteo",
      "dificultad": "1° Básico • MA01 OA 01",
      "tiempo_estimado": "5 min",
      "cantidad_preguntas": 10,
      "urgente": true,
      "total_preguntas": 10
    }
  ]
  ```

#### 4.4 `GET /api/actividades/curso/{curso_id}`
- **Consumido por:** `api.getActivitiesByCourse(courseId)`.
- **Tablas involucradas:** `ACTIVIDAD`, `PREGUNTA`.
- **Parámetros de ruta:** `curso_id` (int, ej. `3`).
- **Response esperado (`200 OK` - `application/json`):**
  ```json
  [
    {
      "id": 7,
      "titulo": "Misión Conteo Mágico: Cuenta del 1 al 10 con Robot Leo",
      "descripcion": "Desafío interactivo de voz (Mineduc MA01 OA 01)...",
      "fecha_entrega": "2026-10-16",
      "ponderacion": 25.0,
      "asignatura": "Matemáticas",
      "codigo_frontend": "act-conteo",
      "dificultad": "1° Básico • MA01 OA 01",
      "tiempo_estimado": "5 min",
      "cantidad_preguntas": 10,
      "urgente": true,
      "total_preguntas": 10
    }
  ]
  ```

#### 4.5 `GET /api/actividades/{actividad_id}`
- **Tablas involucradas:** `ACTIVIDAD`, `CURSO`, `USUARIO`, `PREGUNTA`.
- **Parámetros de ruta:** `actividad_id` (int).
- **Response esperado (`200 OK` - `application/json`):**
  ```json
  {
    "id": 7,
    "curso_id": 3,
    "curso_nombre": "1° Básico B",
    "profesor_usuario_id": 12,
    "profesor_nombre": "Marcela Soto Valenzuela",
    "titulo": "Misión Conteo Mágico: Cuenta del 1 al 10 con Robot Leo",
    "descripcion": "Desafío interactivo de voz...",
    "fecha_entrega": "2026-10-16",
    "ponderacion": 25.0,
    "asignatura": "Matemáticas",
    "codigo_frontend": "act-conteo",
    "preguntas": [
      {
        "id": 1,
        "actividad_id": 7,
        "enunciado": "Cuenta del 1 al 10 en voz alta",
        "tipo": "voz",
        "opciones": null,
        "respuesta_correcta": "1,2,3,4,5,6,7,8,9,10",
        "puntaje": 10.0
      }
    ]
  }
  ```

#### 4.6 `POST /api/actividades/`
- **Tablas involucradas:** `ACTIVIDAD`.
- **Request Body (`application/json`):**
  ```json
  {
    "curso_id": 3,
    "profesor_usuario_id": 12,
    "titulo": "El Bosque de los Números: Sumas hasta el 10 con Voz",
    "descripcion": "Adiciones progresivas hasta el 10 con apoyo pictórico y simbólico.",
    "fecha_entrega": "2026-10-18",
    "ponderacion": 25.0,
    "asignatura": "Matemáticas",
    "codigo_frontend": "act-mat-2"
  }
  ```
- **Response esperado (`200 OK` - `application/json`):**
  ```json
  {
    "message": "Actividad creada exitosamente",
    "actividad_id": 8
  }
  ```

---

### MÓDULO 5: Calificaciones y Reportería (`/api/calificaciones`)

#### 5.1 `GET /api/calificaciones/reporteria/{student_ref}`  *(ENDPOINT CRÍTICO)*
- **Consumido por:** `api.getReporteriaSummary(studentId)` y `api.syncStudentDataFromDb(studentId)`.
- **Tablas involucradas:** `ACTIVIDAD`, `ENTREGA`, `CURSO`.
- **Descripción:** Sincroniza en tiempo real la vista **1. Reportería** y la vista **3. Actividades**. Devuelve los promedios general y por asignatura, contadores de tareas (`pending_count`, `in_progress_count`, `completed_count`), la próxima tarea pendiente, el listado de actividades con su estado actual y el historial completo de entregas.
- **Parámetros de ruta:** `student_ref` (string, ej. `"alu-102"` o `"alu-103"`).
- **Response esperado (`200 OK` - `application/json`):**
  ```json
  {
    "alumno_id": 5,
    "student_code": "alu-102",
    "overall_grade": 6.6,
    "math_grade": 6.8,
    "math_status": "Excelente",
    "math_tasks": "1 de 2 tareas completadas",
    "language_grade": 6.5,
    "language_status": "Excelente",
    "language_tasks": "1 de 2 tareas completadas",
    "pending_count": 2,
    "in_progress_count": 0,
    "completed_count": 2,
    "total_activities": 4,
    "completed_activities_month": 11,
    "completion_rate": 75,
    "next_pending_task": {
      "codigo_frontend": "act-conteo",
      "titulo": "Misión Conteo Mágico: Cuenta del 1 al 10 con Robot Leo",
      "estado": "Pendiente",
      "progreso": 0
    },
    "actividades": [
      {
        "actividad_id": 7,
        "codigo_frontend": "act-conteo",
        "titulo": "Misión Conteo Mágico: Cuenta del 1 al 10 con Robot Leo",
        "descripcion": "Desafío interactivo de voz (Mineduc MA01 OA 01)...",
        "asignatura": "Matemáticas",
        "fecha_entrega": "2026-10-16",
        "ponderacion": 25.0,
        "dificultad": "1° Básico • MA01 OA 01",
        "tiempo_estimado": "5 min",
        "cantidad_preguntas": 10,
        "urgente": true,
        "estado": "Pendiente",
        "progreso": 0,
        "calificacion": null,
        "comentarios": "Actividad de conteo secuencial pendiente de realizar.",
        "fecha_registro": "2026-10-16",
        "tiempo_minutos": 5
      },
      {
        "actividad_id": 8,
        "codigo_frontend": "act-mat-2",
        "titulo": "El Bosque de los Números: Sumas hasta el 10 con Voz",
        "descripcion": "Adiciones progresivas hasta el 10 con apoyo pictórico y simbólico...",
        "asignatura": "Matemáticas",
        "fecha_entrega": "2026-10-18",
        "ponderacion": 25.0,
        "dificultad": "1° Básico • MA01 OA 09",
        "tiempo_estimado": "8 min",
        "cantidad_preguntas": 5,
        "urgente": true,
        "estado": "Pendiente",
        "progreso": 0,
        "calificacion": null,
        "comentarios": "Actividad de adición hasta el 10 pendiente de realizar.",
        "fecha_registro": "2026-10-18",
        "tiempo_minutos": 8
      },
      {
        "actividad_id": 9,
        "codigo_frontend": "act-len-1",
        "titulo": "Caza de Sonidos: Sonido Inicial con M, P, L y S",
        "descripcion": "Conciencia fonológica e identificación de fonemas y sílabas iniciales...",
        "asignatura": "Lenguaje y Comunicación",
        "fecha_entrega": "2026-10-19",
        "ponderacion": 25.0,
        "dificultad": "1° Básico • LE01 OA 03",
        "tiempo_estimado": "8 min",
        "cantidad_preguntas": 5,
        "urgente": false,
        "estado": "Pendiente",
        "progreso": 0,
        "calificacion": null,
        "comentarios": "Actividad de conciencia fonológica pendiente de realizar.",
        "fecha_registro": "2026-10-19",
        "tiempo_minutos": 8
      },
      {
        "actividad_id": 10,
        "codigo_frontend": "act-len-2",
        "titulo": "Cuentos que Hablan: La Zorra y las Uvas",
        "descripcion": "Comprensión oral de textos narrados (Mineduc LE01 OA 18)...",
        "asignatura": "Lenguaje y Comunicación",
        "fecha_entrega": "2026-10-20",
        "ponderacion": 25.0,
        "dificultad": "1° Básico • LE01 OA 18",
        "tiempo_estimado": "10 min",
        "cantidad_preguntas": 3,
        "urgente": false,
        "estado": "Pendiente",
        "progreso": 0,
        "calificacion": null,
        "comentarios": "Actividad de comprensión oral de relatos pendiente de realizar.",
        "fecha_registro": "2026-10-20",
        "tiempo_minutos": 10
      }
    ],
    "entregas": [
      {
        "id": 1,
        "actividad_id": 7,
        "actividad_titulo": "Misión Conteo Mágico: Cuenta del 1 al 10 con Robot Leo",
        "asignatura": "Matemáticas",
        "codigo_frontend": "act-conteo",
        "ponderacion": 25.0,
        "fecha_entrega": "2026-10-17",
        "calificacion": 7.0,
        "comentarios": "Conteo del 1 al 10 en orden completado correctamente.",
        "estado": "Entregada",
        "progreso": 100,
        "tiempo_minutos": 5,
        "curso_nombre": "1° Básico B"
      }
    ]
  }
  ```

#### 5.2 `GET /api/calificaciones/alumno/{alumno_id}`
- **Consumido por:** `api.getStudentGrades(studentId)`.
- **Tablas involucradas:** `ENTREGA`, `ACTIVIDAD`, `CURSO`.
- **Parámetros de ruta:** `alumno_id` (int, ej. `5`).
- **Response esperado (`200 OK` - `application/json`):**
  ```json
  {
    "alumno_id": 5,
    "promedio_general": 6.6,
    "total_entregas": 4,
    "entregas": [
      {
        "id": 1,
        "actividad_id": 7,
        "actividad_titulo": "Misión Conteo Mágico: Cuenta del 1 al 10 con Robot Leo",
        "asignatura": "Matemáticas",
        "codigo_frontend": "act-conteo",
        "ponderacion": 25.0,
        "fecha_entrega": "2026-10-17",
        "calificacion": 7.0,
        "comentarios": "Completada con éxito.",
        "estado": "Entregada",
        "progreso": 100,
        "curso_nombre": "1° Básico B"
      }
    ]
  }
  ```

#### 5.3 `GET /api/calificaciones/curso/{curso_id}`
- **Tablas involucradas:** `ALUMNO`, `USUARIO`, `ENTREGA`.
- **Parámetros de ruta:** `curso_id` (int, ej. `3`).
- **Response esperado (`200 OK` - `application/json`):**
  ```json
  [
    {
      "alumno_id": 5,
      "alumno_nombre": "Mateo González Tapia",
      "tareas_entregadas": 4,
      "promedio_alumno": 6.6
    }
  ]
  ```

#### 5.4 `POST /api/calificaciones/entrega`
- **Tablas involucradas:** `ENTREGA`.
- **Request Body (`application/json`):**
  ```json
  {
    "actividad_id": 7,
    "alumno_id": 5,
    "fecha_entrega": "2026-10-17",
    "calificacion": 7.0,
    "comentarios": "Excelente desempeño.",
    "estado": "Entregada",
    "progreso": 100
  }
  ```
- **Response esperado (`200 OK` - `application/json`):**
  ```json
  {
    "message": "Entrega actualizada con éxito",
    "entrega_id": 1
  }
  ```

---

### MÓDULO 6: Mensajería Escolar (`/api/mensajeria`)

#### 6.1 `GET /api/mensajeria/conversaciones/usuario/{usuario_id}`
- **Consumido por:** `api.getConversations(userId)` y `mensajeriaView.initData()`.
- **Tablas involucradas:** `CONVERSACION`, `PARTICIPANTE_CONVERSACION`, `MENSAJE`, `USUARIO`, `USUARIO_ROL`, `ROL`.
- **Parámetros de ruta:** `usuario_id` (int, ej. `13`).
- **Response esperado (`200 OK` - `application/json`):**
  ```json
  [
    {
      "id": 1,
      "asunto": "Seguimiento Pedagógico 1° Básico B",
      "fecha_creacion": "2026-10-01T09:00:00",
      "estado": "ACTIVA",
      "ultimo_mensaje": "Hola Carolina, Mateo respondió muy contento las sumas...",
      "ultima_hora": "17:18",
      "otro_participante": "Marcela Soto Valenzuela",
      "otro_rol": "PROFESOR",
      "otro_id": 12,
      "no_leidos": 1
    }
  ]
  ```

#### 6.2 `GET /api/mensajeria/conversacion/{conversacion_id}/mensajes`
- **Consumido por:** `api.getMessages(conversationId)` y `mensajeriaView.loadMessages()`.
- **Tablas involucradas:** `MENSAJE`, `USUARIO`.
- **Parámetros de ruta:** `conversacion_id` (int, ej. `1`).
- **Response esperado (`200 OK` - `application/json`):**
  ```json
  [
    {
      "id": 10,
      "conversacion_id": 1,
      "remitente_usuario_id": 12,
      "remitente_nombre": "Marcela Soto Valenzuela",
      "contenido": "Estimada Carolina, buenas tardes. Mateo hoy realizó su actividad.",
      "fecha_envio": "2026-10-16T16:10:00",
      "hora": "16:10",
      "leido": true
    },
    {
      "id": 11,
      "conversacion_id": 1,
      "remitente_usuario_id": 13,
      "remitente_nombre": "Carolina Tapia Morales",
      "contenido": "Muchas gracias profesora Marcela.",
      "fecha_envio": "2026-10-16T17:05:00",
      "hora": "17:05",
      "leido": true
    }
  ]
  ```

#### 6.3 `POST /api/mensajeria/mensaje`
- **Consumido por:** `api.sendMessage(conversationId, senderId, text)` y `mensajeriaView.handleSendMessage()`.
- **Tablas involucradas:** `MENSAJE`.
- **Request Body (`application/json`):**
  ```json
  {
    "conversacion_id": 1,
    "remitente_usuario_id": 13,
    "contenido": "Muchas gracias profesora, practicaremos en casa."
  }
  ```
- **Response esperado (`200 OK` - `application/json`):**
  ```json
  {
    "message": "Mensaje enviado exitosamente",
    "mensaje_id": 12,
    "conversacion_id": 1,
    "remitente_usuario_id": 13,
    "contenido": "Muchas gracias profesora, practicaremos en casa.",
    "fecha_envio": "2026-10-17 15:00:00",
    "hora": "15:00"
  }
  ```

---

### MÓDULO 7: Alertas y Notificaciones (`/api/alertas`)

#### 7.1 `GET /api/alertas/usuario/{usuario_id}`
- **Tablas involucradas:** `NOTIFICACION`.
- **Parámetros de ruta:** `usuario_id` (int, ej. `13`).
- **Response esperado (`200 OK` - `application/json`):**
  ```json
  [
    {
      "id": 1,
      "usuario_id": 13,
      "tipo": "urgente",
      "titulo": "Uso de audífonos para actividades en el aula",
      "contenido": "Mañana realizaremos la actividad interactiva de sumas.",
      "fecha_creacion": "2026-10-15T10:15:00",
      "fecha_lectura": null,
      "estado": "PENDIENTE"
    }
  ]
  ```

#### 7.2 `PUT /api/alertas/{notificacion_id}/leer`
- **Tablas involucradas:** `NOTIFICACION`.
- **Parámetros de ruta:** `notificacion_id` (int).
- **Response esperado (`200 OK` - `application/json`):**
  ```json
  {
    "message": "Notificación marcada como leída"
  }
  ```

#### 7.3 `POST /api/alertas/`
- **Tablas involucradas:** `NOTIFICACION`.
- **Request Body (`application/json`):**
  ```json
  {
    "usuario_id": 13,
    "tipo": "nueva_tarea",
    "titulo": "Nueva actividad asignada en Matemáticas",
    "contenido": "Se ha habilitado la actividad de Sumas hasta el 10."
  }
  ```
- **Response esperado (`200 OK` - `application/json`):**
  ```json
  {
    "message": "Alerta creada exitosamente",
    "alerta_id": 5
  }
  ```

---

## 4. Tabla Resumen de los 25 Endpoints de Base de Datos Local

| # | Método | Ruta Exacta | Tablas MySQL Principales | Función en Frontend (`js/api.js`) |
|---|---|---|---|---|
| 1 | `GET` | `/` | Conexión BD | Verificación general del servidor |
| 2 | `GET` | `/api/health` | Conexión BD | `api.checkHealth()` |
| 3 | `POST` | `/api/auth/login` | `USUARIO`, `USUARIO_ROL`, `ROL` | `loginView.handleSubmit()` / `api.login()` |
| 4 | `GET` | `/api/auth/verificar` | Sesiones / JWT | Validación de sesión activa |
| 5 | `GET` | `/api/auth/usuarios` | `USUARIO`, `USUARIO_ROL`, `ROL` | Listado de usuarios registrados |
| 6 | `GET` | `/api/alumnos/` | `ALUMNO`, `USUARIO` | Listado general de estudiantes |
| 7 | `GET` | `/api/alumnos/apoderado/{apoderado_id}` | `ALUMNO_APODERADO`, `ALUMNO`, `ENTREGA` | `api.getStudentsByParent()` |
| 8 | `GET` | `/api/alumnos/{alumno_id}` | `ALUMNO`, `USUARIO`, `ALUMNO_APODERADO` | Ficha detallada del estudiante |
| 9 | `GET` | `/api/alumnos/cursos/todos` | `CURSO`, `USUARIO` | Listado de cursos y profesores jefe |
| 10 | `GET` | `/api/actividades/` | `ACTIVIDAD`, `CURSO`, `USUARIO`, `PREGUNTA` | Catálogo general de actividades |
| 11 | `GET` | `/api/actividades/curso/{curso_id}` | `ACTIVIDAD`, `PREGUNTA` | `api.getActivitiesByCourse()` |
| 12 | `GET` | `/api/actividades/alumno/{student_ref}` | `ACTIVIDAD`, `ENTREGA` | Actividades del alumno con estado |
| 13 | `POST` | `/api/actividades/estado` | `ACTIVIDAD`, `ENTREGA`, `INTERACCION_ACTIVIDAD` | `api.updateActivityState()` |
| 14 | `GET` | `/api/actividades/{actividad_id}` | `ACTIVIDAD`, `PREGUNTA` | Detalle de actividad y sus preguntas |
| 15 | `POST` | `/api/actividades/` | `ACTIVIDAD` | Creación de nueva actividad |
| 16 | `GET` | `/api/calificaciones/reporteria/{student_ref}` | `ACTIVIDAD`, `ENTREGA`, `CURSO` | `api.getReporteriaSummary()` / `api.syncStudentDataFromDb()` |
| 17 | `GET` | `/api/calificaciones/alumno/{alumno_id}` | `ENTREGA`, `ACTIVIDAD`, `CURSO` | `api.getStudentGrades()` |
| 18 | `GET` | `/api/calificaciones/curso/{curso_id}` | `ALUMNO`, `USUARIO`, `ENTREGA` | Promedios y entregas por curso |
| 19 | `POST` | `/api/calificaciones/entrega` | `ENTREGA` | Registro o actualización de entrega |
| 20 | `GET` | `/api/mensajeria/conversaciones/usuario/{usuario_id}` | `CONVERSACION`, `PARTICIPANTE_CONVERSACION`, `MENSAJE` | `api.getConversations()` |
| 21 | `GET` | `/api/mensajeria/conversacion/{conversacion_id}/mensajes` | `MENSAJE`, `USUARIO` | `api.getMessages()` |
| 22 | `POST` | `/api/mensajeria/mensaje` | `MENSAJE` | `api.sendMessage()` |
| 23 | `GET` | `/api/alertas/usuario/{usuario_id}` | `NOTIFICACION` | Listado de alertas de un usuario |
| 24 | `PUT` | `/api/alertas/{notificacion_id}/leer` | `NOTIFICACION` | Marcar notificación como leída |
| 25 | `POST` | `/api/alertas/` | `NOTIFICACION` | Crear nueva alerta o notificación |
