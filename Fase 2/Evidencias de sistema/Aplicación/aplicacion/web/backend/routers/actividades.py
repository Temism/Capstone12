import html
from datetime import date, datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from database import execute_query, get_connection

router = APIRouter(prefix="/api/actividades", tags=["Actividades y Tareas"])

class ActividadCreate(BaseModel):
    curso_id: int
    profesor_usuario_id: int
    titulo: str
    descripcion: Optional[str] = None
    fecha_entrega: str
    ponderacion: float = 20.0
    asignatura: Optional[str] = "Matemáticas"
    codigo_frontend: Optional[str] = None

class EstadoActividadUpdate(BaseModel):
    alumno_id: Optional[int] = None
    student_code: Optional[str] = None
    actividad_id: Optional[int] = None
    codigo_frontend: Optional[str] = None
    titulo: Optional[str] = None
    asignatura: Optional[str] = "Matemáticas"
    estado: str  # 'Pendiente' | 'En progreso' | 'Entregada'
    progreso: int = 0
    calificacion: Optional[float] = None
    comentarios: Optional[str] = None
    tiempo_minutos: Optional[int] = 5


def ensure_activity_states_schema():
    """
    Asegura que las tablas ACTIVIDAD y ENTREGA cuenten con las columnas necesarias
    para persistir estados ('Pendiente', 'En progreso', 'Entregada'), progreso y asignatura,
    y sincroniza el catalogo base de actividades de 1° y 2° Basico en MySQL.
    """
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)

        # 1. Verificar columnas en ACTIVIDAD
        cur.execute("SHOW COLUMNS FROM ACTIVIDAD")
        act_cols = {row["Field"].lower() for row in cur.fetchall()}

        if "asignatura" not in act_cols:
            cur.execute("ALTER TABLE ACTIVIDAD ADD COLUMN asignatura VARCHAR(80) NOT NULL DEFAULT 'Matemáticas'")
        if "codigo_frontend" not in act_cols:
            cur.execute("ALTER TABLE ACTIVIDAD ADD COLUMN codigo_frontend VARCHAR(50) NULL")
        if "dificultad" not in act_cols:
            cur.execute("ALTER TABLE ACTIVIDAD ADD COLUMN dificultad VARCHAR(60) NOT NULL DEFAULT '1° Básico • Inicial'")
        if "tiempo_estimado" not in act_cols:
            cur.execute("ALTER TABLE ACTIVIDAD ADD COLUMN tiempo_estimado VARCHAR(30) NOT NULL DEFAULT '10 min'")
        if "cantidad_preguntas" not in act_cols:
            cur.execute("ALTER TABLE ACTIVIDAD ADD COLUMN cantidad_preguntas INT NOT NULL DEFAULT 5")
        if "urgente" not in act_cols:
            cur.execute("ALTER TABLE ACTIVIDAD ADD COLUMN urgente BOOLEAN NOT NULL DEFAULT FALSE")

        # 2. Verificar columnas en ENTREGA
        cur.execute("SHOW COLUMNS FROM ENTREGA")
        ent_cols = {row["Field"].lower() for row in cur.fetchall()}

        if "estado" not in ent_cols:
            cur.execute("ALTER TABLE ENTREGA ADD COLUMN estado VARCHAR(30) NOT NULL DEFAULT 'Entregada'")
        if "progreso" not in ent_cols:
            cur.execute("ALTER TABLE ENTREGA ADD COLUMN progreso INT NOT NULL DEFAULT 100")
        if "tiempo_minutos" not in ent_cols:
            cur.execute("ALTER TABLE ENTREGA ADD COLUMN tiempo_minutos INT NOT NULL DEFAULT 12")

        conn.commit()

        # 3. Obtener IDs de cursos y alumnos de 1° y 2° Basico
        cur.execute("SELECT id, nombre FROM CURSO WHERE nombre LIKE '%1%Básico%' ORDER BY id ASC LIMIT 1")
        row_c1 = cur.fetchone()
        curso_1b_id = row_c1["id"] if row_c1 else 3

        cur.execute("SELECT id, nombre FROM CURSO WHERE nombre LIKE '%2%Básico%' ORDER BY id ASC LIMIT 1")
        row_c2 = cur.fetchone()
        curso_2a_id = row_c2["id"] if row_c2 else 4

        cur.execute("SELECT id FROM USUARIO WHERE email = 'profesora@sanandres.cl' LIMIT 1")
        row_prof = cur.fetchone()
        profe_id = row_prof["id"] if row_prof else 12

        cur.execute("SELECT a.id FROM ALUMNO a JOIN USUARIO u ON a.usuario_id = u.id WHERE u.email = 'alumno@sanandres.cl' LIMIT 1")
        row_mateo = cur.fetchone()
        mateo_id = row_mateo["id"] if row_mateo else 5

        cur.execute("SELECT a.id FROM ALUMNO a JOIN USUARIO u ON a.usuario_id = u.id WHERE u.email = 'sofia@sanandres.cl' LIMIT 1")
        row_sofia = cur.fetchone()
        sofia_id = row_sofia["id"] if row_sofia else 6

        # 4. Migrar codigos previos de 1° Basico al catalogo oficial de 4 actividades Mineduc (2 Matematicas + 2 Lenguaje)
        cur.execute("UPDATE ACTIVIDAD SET codigo_frontend = 'act-mat-2' WHERE codigo_frontend = 'act-1'")
        cur.execute("UPDATE ACTIVIDAD SET codigo_frontend = 'act-len-1' WHERE codigo_frontend = 'act-2'")
        cur.execute("UPDATE ACTIVIDAD SET codigo_frontend = 'act-len-2' WHERE codigo_frontend = 'act-4'")
        cur.execute("UPDATE ACTIVIDAD SET codigo_frontend = NULL WHERE codigo_frontend = 'act-3'")

        # Catalogo oficial de actividades de Mateo (1° Basico B: 2 Matematicas y 2 Lenguaje) y Sofia (2° Basico A)
        catalogo = [
            # Mateo (1° Basico B - 4 Actividades Oficiales Mineduc)
            {
                "codigo": "act-conteo",
                "curso_id": curso_1b_id,
                "alumno_id": mateo_id,
                "asignatura": "Matemáticas",
                "titulo": "Misión Conteo Mágico: Cuenta del 1 al 10 con Robot Leo",
                "descripcion": "Desafío interactivo de voz (Mineduc MA01 OA 01). Cuenta en voz alta y en orden ascendente del uno al diez para iluminar tus tarjetas.",
                "fecha_entrega": "2026-10-16",
                "ponderacion": 25.0,
                "dificultad": "1° Básico • MA01 OA 01",
                "tiempo_estimado": "5 min",
                "cantidad_preguntas": 10,
                "urgente": True,
                "estado_inicial": "Pendiente",
                "progreso_inicial": 0,
                "calificacion_inicial": None,
                "comentarios_inicial": "Actividad de conteo secuencial pendiente de realizar.",
                "tiempo_minutos": 5
            },
            {
                "codigo": "act-mat-2",
                "curso_id": curso_1b_id,
                "alumno_id": mateo_id,
                "asignatura": "Matemáticas",
                "titulo": "El Bosque de los Números: Sumas hasta el 10 con Voz",
                "descripcion": "Adiciones progresivas hasta el 10 con apoyo pictórico y simbólico (Mineduc MA01 OA 09 - Modelo COPISI). Escucha cada problema y responde con tu voz.",
                "fecha_entrega": "2026-10-18",
                "ponderacion": 25.0,
                "dificultad": "1° Básico • MA01 OA 09",
                "tiempo_estimado": "8 min",
                "cantidad_preguntas": 5,
                "urgente": True,
                "estado_inicial": "Pendiente",
                "progreso_inicial": 0,
                "calificacion_inicial": None,
                "comentarios_inicial": "Actividad de adición hasta el 10 pendiente de realizar.",
                "tiempo_minutos": 8
            },
            {
                "codigo": "act-len-1",
                "curso_id": curso_1b_id,
                "alumno_id": mateo_id,
                "asignatura": "Lenguaje y Comunicación",
                "titulo": "Caza de Sonidos: Sonido Inicial con M, P, L y S",
                "descripcion": "Conciencia fonológica e identificación de fonemas y sílabas iniciales (Mineduc LE01 OA 03 - Leo Primero). Escucha y responde hablando.",
                "fecha_entrega": "2026-10-19",
                "ponderacion": 25.0,
                "dificultad": "1° Básico • LE01 OA 03",
                "tiempo_estimado": "8 min",
                "cantidad_preguntas": 5,
                "urgente": False,
                "estado_inicial": "Pendiente",
                "progreso_inicial": 0,
                "calificacion_inicial": None,
                "comentarios_inicial": "Actividad de conciencia fonológica pendiente de realizar.",
                "tiempo_minutos": 8
            },
            {
                "codigo": "act-len-2",
                "curso_id": curso_1b_id,
                "alumno_id": mateo_id,
                "asignatura": "Lenguaje y Comunicación",
                "titulo": "Cuentos que Hablan: La Zorra y las Uvas",
                "descripcion": "Comprensión oral de textos narrados (Mineduc LE01 OA 18). Escucha la fábula y responde con tus propias palabras a través del micrófono.",
                "fecha_entrega": "2026-10-20",
                "ponderacion": 25.0,
                "dificultad": "1° Básico • LE01 OA 18",
                "tiempo_estimado": "10 min",
                "cantidad_preguntas": 3,
                "urgente": False,
                "estado_inicial": "Pendiente",
                "progreso_inicial": 0,
                "calificacion_inicial": None,
                "comentarios_inicial": "Actividad de comprensión oral de relatos pendiente de realizar.",
                "tiempo_minutos": 10
            },
            # Sofia (2° Basico A)
            {
                "codigo": "act-sofia-1",
                "curso_id": curso_2a_id,
                "alumno_id": sofia_id,
                "asignatura": "Lenguaje y Comunicación",
                "titulo": "Fábulas Clásicas: La Zorra y las Uvas (Comprensión con Voz)",
                "descripcion": "Escucha la narración hablada de la fábula y descubre la enseñanza de la historia respondiendo por voz.",
                "fecha_entrega": "2026-10-17",
                "ponderacion": 25.0,
                "dificultad": "2° Básico • LE02 OA 18",
                "tiempo_estimado": "10 min",
                "cantidad_preguntas": 3,
                "urgente": True,
                "estado_inicial": "Pendiente",
                "progreso_inicial": 0,
                "calificacion_inicial": None,
                "comentarios_inicial": "Pendiente de realizar.",
                "tiempo_minutos": 10
            },
            {
                "codigo": "act-sofia-2",
                "curso_id": curso_2a_id,
                "alumno_id": sofia_id,
                "asignatura": "Matemáticas",
                "titulo": "El Reino de las Tablas: Multiplicando por 2 y por 5",
                "descripcion": "Practica el conteo reiterado y las primeras tablas de multiplicar con preguntas habladas.",
                "fecha_entrega": "2026-10-18",
                "ponderacion": 25.0,
                "dificultad": "2° Básico • MA02 OA 11",
                "tiempo_estimado": "12 min",
                "cantidad_preguntas": 5,
                "urgente": False,
                "estado_inicial": "Pendiente",
                "progreso_inicial": 0,
                "calificacion_inicial": None,
                "comentarios_inicial": "Pendiente de realizar.",
                "tiempo_minutos": 12
            },
            {
                "codigo": "act-sofia-3",
                "curso_id": curso_2a_id,
                "alumno_id": sofia_id,
                "asignatura": "Lenguaje y Comunicación",
                "titulo": "Lectura de Oraciones y Reglas de Puntuación",
                "descripcion": "Identificación de mayúsculas al inicio y punto final al terminar una idea.",
                "fecha_entrega": "2026-10-19",
                "ponderacion": 25.0,
                "dificultad": "2° Básico • LE02 OA 21",
                "tiempo_estimado": "12 min",
                "cantidad_preguntas": 5,
                "urgente": False,
                "estado_inicial": "En progreso",
                "progreso_inicial": 60,
                "calificacion_inicial": None,
                "comentarios_inicial": "En desarrollo por la alumna (60%).",
                "tiempo_minutos": 12
            },
            {
                "codigo": "act-sofia-4",
                "curso_id": curso_2a_id,
                "alumno_id": sofia_id,
                "asignatura": "Matemáticas",
                "titulo": "Resolución de Problemas: Sumas con Reserva hasta el 50",
                "descripcion": "Ejercicios guiados de cálculo mental y sumas con canje hasta el número 50.",
                "fecha_entrega": "2026-10-11",
                "ponderacion": 25.0,
                "dificultad": "2° Básico • MA02 OA 09",
                "tiempo_estimado": "14 min",
                "cantidad_preguntas": 5,
                "urgente": False,
                "estado_inicial": "Entregada",
                "progreso_inicial": 100,
                "calificacion_inicial": 6.4,
                "comentarios_inicial": "Ejercicios completados correctamente.",
                "tiempo_minutos": 14
            }
        ]

        for item in catalogo:
            # Buscar por codigo_frontend o por titulo
            cur.execute(
                "SELECT id FROM ACTIVIDAD WHERE codigo_frontend = %s OR LOWER(titulo) = LOWER(%s) LIMIT 1",
                (item["codigo"], item["titulo"])
            )
            act_row = cur.fetchone()
            if act_row:
                act_id = act_row["id"]
                cur.execute(
                    """UPDATE ACTIVIDAD
                       SET titulo = %s, descripcion = %s, codigo_frontend = %s, asignatura = %s, dificultad = %s,
                           tiempo_estimado = %s, cantidad_preguntas = %s, ponderacion = %s
                       WHERE id = %s""",
                    (
                        item["titulo"], item["descripcion"], item["codigo"], item["asignatura"], item["dificultad"],
                        item["tiempo_estimado"], item["cantidad_preguntas"], item["ponderacion"],
                        act_id
                    )
                )
            else:
                cur.execute(
                    """INSERT INTO ACTIVIDAD
                       (curso_id, profesor_usuario_id, titulo, descripcion, fecha_entrega, ponderacion,
                        asignatura, codigo_frontend, dificultad, tiempo_estimado, cantidad_preguntas, urgente)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                    (
                        item["curso_id"], profe_id, item["titulo"], item["descripcion"],
                        item["fecha_entrega"], item["ponderacion"], item["asignatura"],
                        item["codigo"], item["dificultad"], item["tiempo_estimado"],
                        item["cantidad_preguntas"], item["urgente"]
                    )
                )
                act_id = cur.lastrowid

            # Asegurar registro de estado en ENTREGA para el alumno si no existe
            cur.execute(
                "SELECT id, estado FROM ENTREGA WHERE actividad_id = %s AND alumno_id = %s LIMIT 1",
                (act_id, item["alumno_id"])
            )
            ent_row = cur.fetchone()
            if not ent_row:
                cur.execute(
                    """INSERT INTO ENTREGA
                       (actividad_id, alumno_id, fecha_entrega, calificacion, comentarios, estado, progreso, tiempo_minutos)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                    (
                        act_id, item["alumno_id"], item["fecha_entrega"],
                        item["calificacion_inicial"], item["comentarios_inicial"],
                        item["estado_inicial"], item["progreso_inicial"], item["tiempo_minutos"]
                    )
                )

        # Asegurar asignatura en actividades antiguas (ej. id 5 'La Casa de las Letras')
        cur.execute("UPDATE ACTIVIDAD SET asignatura = 'Lenguaje y Comunicación' WHERE titulo LIKE '%Letras%' OR titulo LIKE '%Lectura%' OR titulo LIKE '%Fábulas%' OR titulo LIKE '%Cuentos%' OR titulo LIKE '%Sonidos%'")

        conn.commit()
        cur.close()
    except Exception as e:
        print(f"[DB SYNC] Aviso sincronizando esquema de estados de actividades: {e}")
    finally:
        if conn and conn.is_connected():
            conn.close()


# Ejecutar sincronizacion al cargar el modulo
ensure_activity_states_schema()


def resolve_alumno_id(alumno_id: Optional[int], student_code: Optional[str]) -> int:
    if alumno_id:
        return int(alumno_id)
    if student_code:
        code = str(student_code).strip().lower()
        if code in ("alu-102", "5", "mateo"):
            return 5
        if code in ("alu-103", "6", "sofia", "sofía"):
            return 6
        if code.isdigit():
            return int(code)
    return 5


@router.get("/")
def get_actividades():
    """Lista todas las actividades con información de su curso y profesor."""
    query = """
        SELECT a.id, a.curso_id, c.nombre as curso_nombre, a.profesor_usuario_id,
               u.nombre as profesor_nombre, a.titulo, a.descripcion, a.fecha_entrega, a.ponderacion,
               a.asignatura, a.codigo_frontend, a.dificultad, a.tiempo_estimado, a.cantidad_preguntas, a.urgente,
               (SELECT COUNT(*) FROM PREGUNTA p WHERE p.actividad_id = a.id) as total_preguntas
        FROM ACTIVIDAD a
        JOIN CURSO c ON a.curso_id = c.id
        JOIN USUARIO u ON a.profesor_usuario_id = u.id
        ORDER BY a.fecha_entrega DESC
    """
    return execute_query(query)

@router.get("/curso/{curso_id}")
def get_actividades_por_curso(curso_id: int):
    """Obtiene las actividades de un curso específico."""
    query = """
        SELECT a.id, a.titulo, a.descripcion, a.fecha_entrega, a.ponderacion,
               a.asignatura, a.codigo_frontend, a.dificultad, a.tiempo_estimado, a.cantidad_preguntas, a.urgente,
               (SELECT COUNT(*) FROM PREGUNTA p WHERE p.actividad_id = a.id) as total_preguntas
        FROM ACTIVIDAD a
        WHERE a.curso_id = %s
        ORDER BY a.fecha_entrega DESC
    """
    return execute_query(query, (curso_id,))

@router.get("/alumno/{student_ref}")
def get_actividades_alumno_con_estado(student_ref: str):
    """
    Obtiene todas las actividades asignadas al alumno con su estado actual
    ('Pendiente', 'En progreso', 'Entregada'), progreso y calificacion desde MySQL.
    """
    alumno_id = resolve_alumno_id(None, student_ref)
    curso_id = 4 if alumno_id == 6 else 3

    query = """
        SELECT a.id as actividad_id, a.codigo_frontend, a.titulo, a.descripcion,
               a.asignatura, a.fecha_entrega, a.ponderacion, a.dificultad,
               a.tiempo_estimado, a.cantidad_preguntas, a.urgente,
               COALESCE(e.estado, 'Pendiente') as estado,
               COALESCE(e.progreso, 0) as progreso,
               e.calificacion,
               e.comentarios,
               e.fecha_entrega as fecha_registro,
               COALESCE(e.tiempo_minutos, 10) as tiempo_minutos
        FROM ACTIVIDAD a
        LEFT JOIN ENTREGA e ON a.id = e.actividad_id AND e.alumno_id = %s
        WHERE a.curso_id = %s AND a.codigo_frontend IS NOT NULL
        ORDER BY FIELD(COALESCE(e.estado, 'Pendiente'), 'Pendiente', 'En progreso', 'Entregada'), a.id ASC
    """
    rows = execute_query(query, (alumno_id, curso_id))
    return {
        "alumno_id": alumno_id,
        "curso_id": curso_id,
        "actividades": rows
    }

@router.post("/estado")
def actualizar_o_insertar_estado_actividad(payload: EstadoActividadUpdate):
    """
    Actualiza o inserta en la base de datos el estado de una actividad para un alumno
    ('Pendiente', 'En progreso', 'Entregada'), su porcentaje de avance, su calificacion
    y registra la trazabilidad en INTERACCION_ACTIVIDAD.
    """
    alumno_id = resolve_alumno_id(payload.alumno_id, payload.student_code)
    curso_id = 4 if alumno_id == 6 else 3

    alumno_row = execute_query("SELECT id, usuario_id FROM ALUMNO WHERE id = %s", (alumno_id,), fetch_one=True)
    usuario_id = alumno_row["usuario_id"] if alumno_row else (15 if alumno_id == 6 else 14)

    # 1. Localizar la actividad por ID, codigo_frontend o titulo
    act_row = None
    if payload.actividad_id:
        act_row = execute_query("SELECT * FROM ACTIVIDAD WHERE id = %s", (payload.actividad_id,), fetch_one=True)
    if not act_row and payload.codigo_frontend:
        act_row = execute_query("SELECT * FROM ACTIVIDAD WHERE codigo_frontend = %s", (payload.codigo_frontend,), fetch_one=True)
    if not act_row and payload.titulo:
        act_row = execute_query(
            "SELECT * FROM ACTIVIDAD WHERE LOWER(titulo) = LOWER(%s) LIMIT 1",
            (payload.titulo.strip(),),
            fetch_one=True
        )
        if not act_row and "conteo" in payload.titulo.lower():
            act_row = execute_query("SELECT * FROM ACTIVIDAD WHERE codigo_frontend = 'act-conteo' LIMIT 1", fetch_one=True)

    hoy_str = date.today().strftime("%Y-%m-%d")

    if not act_row:
        # Insertar nueva actividad si no existia en el catalogo
        titulo_nuevo = html.escape((payload.titulo or "Actividad Escolar con Voz").strip())
        asignatura_nueva = payload.asignatura or "Matemáticas"
        codigo_nuevo = payload.codigo_frontend or f"act-custom-{int(datetime.now().timestamp())}"
        res_act = execute_query(
            """INSERT INTO ACTIVIDAD
               (curso_id, profesor_usuario_id, titulo, descripcion, fecha_entrega, ponderacion,
                asignatura, codigo_frontend, dificultad, tiempo_estimado, cantidad_preguntas, urgente)
               VALUES (%s, 12, %s, %s, %s, 20.0, %s, %s, '1° Básico • Inicial', '10 min', 10, FALSE)""",
            (curso_id, titulo_nuevo, "Actividad interactiva guiada por voz.", hoy_str, asignatura_nueva, codigo_nuevo),
            commit=True
        )
        actividad_id = res_act["last_id"]
    else:
        actividad_id = act_row["id"]

    # 2. Normalizar estado, progreso y calificacion
    estado_norm = payload.estado.strip()
    if estado_norm not in ("Pendiente", "En progreso", "Entregada"):
        estado_norm = "Entregada" if payload.progreso >= 100 else "En progreso"

    progreso_norm = max(0, min(100, int(payload.progreso)))
    if estado_norm == "Entregada":
        progreso_norm = 100
        calificacion_val = payload.calificacion if payload.calificacion is not None else 7.0
        comentarios_val = payload.comentarios or "Actividad completada en orden correcto con voz."
    elif estado_norm == "En progreso":
        calificacion_val = payload.calificacion
        comentarios_val = payload.comentarios or f"Actividad en progreso ({progreso_norm}% completado)."
    else:
        progreso_norm = 0
        calificacion_val = None
        comentarios_val = payload.comentarios or "Actividad pendiente."

    tiempo_min = payload.tiempo_minutos or 5

    # 3. Verificar si ya existe un registro en ENTREGA para (actividad_id, alumno_id)
    existente = execute_query(
        "SELECT id FROM ENTREGA WHERE actividad_id = %s AND alumno_id = %s LIMIT 1",
        (actividad_id, alumno_id),
        fetch_one=True
    )

    if existente:
        execute_query(
            """UPDATE ENTREGA
               SET fecha_entrega = %s,
                   calificacion = %s,
                   comentarios = %s,
                   estado = %s,
                   progreso = %s,
                   tiempo_minutos = %s
               WHERE id = %s""",
            (hoy_str, calificacion_val, comentarios_val, estado_norm, progreso_norm, tiempo_min, existente["id"]),
            commit=True
        )
        entrega_id = existente["id"]
        operacion = "actualizado"
    else:
        res_ent = execute_query(
            """INSERT INTO ENTREGA
               (actividad_id, alumno_id, fecha_entrega, calificacion, comentarios, estado, progreso, tiempo_minutos)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
            (actividad_id, alumno_id, hoy_str, calificacion_val, comentarios_val, estado_norm, progreso_norm, tiempo_min),
            commit=True
        )
        entrega_id = res_ent["last_id"]
        operacion = "insertado"

    # Si se completo, desmarcar urgencia en ACTIVIDAD
    if estado_norm == "Entregada":
        execute_query("UPDATE ACTIVIDAD SET urgente = FALSE WHERE id = %s", (actividad_id,), commit=True)

    # 4. Registrar interaccion en INTERACCION_ACTIVIDAD
    tipo_int = "actividad_completada" if estado_norm == "Entregada" else ("en_progreso" if estado_norm == "En progreso" else "reinicio_actividad")
    ahora_dt = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    execute_query(
        """INSERT INTO INTERACCION_ACTIVIDAD (actividad_id, usuario_id, tipo_interaccion, detalle, fecha_hora)
           VALUES (%s, %s, %s, %s, %s)""",
        (actividad_id, usuario_id, tipo_int, comentarios_val, ahora_dt),
        commit=True
    )

    return {
        "success": True,
        "operacion": operacion,
        "entrega_id": entrega_id,
        "actividad_id": actividad_id,
        "alumno_id": alumno_id,
        "estado": estado_norm,
        "progreso": progreso_norm,
        "calificacion": calificacion_val,
        "fecha_entrega": hoy_str
    }

@router.get("/{actividad_id}")
def get_actividad_con_preguntas(actividad_id: int):
    """Obtiene el detalle de una actividad y todas sus preguntas interactivas."""
    query_actividad = """
        SELECT a.id, a.curso_id, c.nombre as curso_nombre, a.profesor_usuario_id,
               u.nombre as profesor_nombre, a.titulo, a.descripcion, a.fecha_entrega, a.ponderacion,
               a.asignatura, a.codigo_frontend
        FROM ACTIVIDAD a
        JOIN CURSO c ON a.curso_id = c.id
        JOIN USUARIO u ON a.profesor_usuario_id = u.id
        WHERE a.id = %s
    """
    actividad = execute_query(query_actividad, (actividad_id,), fetch_one=True)
    if not actividad:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")

    query_preguntas = """
        SELECT id, actividad_id, enunciado, tipo, opciones, respuesta_correcta, puntaje
        FROM PREGUNTA
        WHERE actividad_id = %s
        ORDER BY id ASC
    """
    preguntas = execute_query(query_preguntas, (actividad_id,))
    actividad["preguntas"] = preguntas
    return actividad

@router.post("/")
def create_actividad(nueva: ActividadCreate):
    """Crea una nueva actividad asignada a un curso con sanitización contra inyecciones."""
    titulo_limpio = html.escape(nueva.titulo.strip())
    descripcion_limpia = html.escape(nueva.descripcion.strip()) if nueva.descripcion else None
    asignatura_limpia = html.escape((nueva.asignatura or "Matemáticas").strip())

    query = """
        INSERT INTO ACTIVIDAD (curso_id, profesor_usuario_id, titulo, descripcion, fecha_entrega, ponderacion, asignatura, codigo_frontend)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """
    result = execute_query(
        query,
        (nueva.curso_id, nueva.profesor_usuario_id, titulo_limpio, descripcion_limpia, nueva.fecha_entrega, nueva.ponderacion, asignatura_limpia, nueva.codigo_frontend),
        commit=True
    )
    return {"message": "Actividad creada exitosamente", "actividad_id": result["last_id"]}
