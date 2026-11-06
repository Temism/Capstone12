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


class AlumnoAsignacionItem(BaseModel):
    alumno_id: int
    habilitado: bool = True
    fecha_entrega_especial: Optional[str] = None
    es_pie: Optional[bool] = False
    modo_voz: Optional[str] = "Activo (Robot Leo)"


class AsignarActividadRequest(BaseModel):
    curso_id: int = 3
    profesor_usuario_id: int = 12
    actividad_id: Optional[int] = None
    codigo_frontend: Optional[str] = None
    titulo: str
    descripcion: Optional[str] = None
    asignatura: Optional[str] = "Matemáticas"
    oa_codigo: Optional[str] = "MA01 OA 01"
    fecha_apertura: Optional[str] = None
    fecha_entrega_general: str
    fecha_entrega_pie: Optional[str] = None
    agente_voz_activo: bool = True
    alumnos: Optional[List[AlumnoAsignacionItem]] = None


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
        WHERE a.curso_id = %s AND (a.codigo_frontend IS NOT NULL OR e.id IS NOT NULL)
        ORDER BY FIELD(COALESCE(e.estado, 'Pendiente'), 'Pendiente', 'En progreso', 'Entregada'), a.urgente DESC, a.id ASC
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


@router.post("/asignar")
def asignar_actividad_curso(payload: AsignarActividadRequest):
    """
    Asigna una actividad del catálogo MINEDUC a los alumnos seleccionados del curso:
    1. Crea o actualiza el registro en ACTIVIDAD.
    2. Crea o reinicia los registros en ENTREGA con estado 'Pendiente' (y plazo diferenciado PIE si corresponde).
    3. Dispara automáticamente registros en NOTIFICACION para que los apoderados reciban la alerta en la app móvil.
    """
    titulo_limpio = html.escape(payload.titulo.strip())
    asignatura_limpia = html.escape((payload.asignatura or "Matemáticas").strip())
    oa_limpio = html.escape((payload.oa_codigo or "MA01 OA 01").strip())
    descripcion_limpia = html.escape(payload.descripcion.strip()) if payload.descripcion else f"Actividad oficial Mineduc ({oa_limpio}) con Agente de Voz IA Robot Leo."
    fecha_gen = (payload.fecha_entrega_general or date.today().strftime("%Y-%m-%d"))[:10]
    fecha_pie = (payload.fecha_entrega_pie or fecha_gen)[:10]
    curso_id = payload.curso_id or 3
    profesor_id = payload.profesor_usuario_id or 12

    # 1. Localizar o crear la actividad en la tabla ACTIVIDAD
    act_row = None
    if payload.actividad_id:
        act_row = execute_query("SELECT * FROM ACTIVIDAD WHERE id = %s", (payload.actividad_id,), fetch_one=True)
    if not act_row and payload.codigo_frontend:
        act_row = execute_query("SELECT * FROM ACTIVIDAD WHERE codigo_frontend = %s", (payload.codigo_frontend,), fetch_one=True)
    if not act_row:
        act_row = execute_query(
            "SELECT * FROM ACTIVIDAD WHERE LOWER(titulo) = LOWER(%s) AND curso_id = %s LIMIT 1",
            (titulo_limpio, curso_id),
            fetch_one=True
        )

    nivel_label = "2° Básico" if curso_id == 4 else "1° Básico"
    dificultad_str = f"{nivel_label} • {oa_limpio}"
    codigo_fe = payload.codigo_frontend or (act_row["codigo_frontend"] if act_row and act_row.get("codigo_frontend") else "act-conteo")

    if act_row:
        actividad_id = act_row["id"]
        execute_query(
            """UPDATE ACTIVIDAD
               SET fecha_entrega = %s, asignatura = %s, dificultad = %s, urgente = TRUE, codigo_frontend = COALESCE(codigo_frontend, %s)
               WHERE id = %s""",
            (fecha_gen, asignatura_limpia, dificultad_str, codigo_fe, actividad_id),
            commit=True
        )
    else:
        res_act = execute_query(
            """INSERT INTO ACTIVIDAD
               (curso_id, profesor_usuario_id, titulo, descripcion, fecha_entrega, ponderacion,
                asignatura, codigo_frontend, dificultad, tiempo_estimado, cantidad_preguntas, urgente)
               VALUES (%s, %s, %s, %s, %s, 20.0, %s, %s, %s, '10 min', 5, TRUE)""",
            (curso_id, profesor_id, titulo_limpio, descripcion_limpia, fecha_gen, asignatura_limpia, codigo_fe, dificultad_str),
            commit=True
        )
        actividad_id = res_act["last_id"]

    # 2. Determinar nómina de alumnos a asignar
    alumnos_items = payload.alumnos or []
    if not alumnos_items:
        rows_al = execute_query("SELECT id FROM ALUMNO")
        alumnos_items = [
            AlumnoAsignacionItem(alumno_id=r["id"], habilitado=True, es_pie=(r["id"] in (3, 1)))
            for r in rows_al
        ]

    entregas_creadas = 0
    notificaciones_creadas = 0
    apoderados_notificados = set()
    ahora_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    for item in alumnos_items:
        if not item.habilitado:
            continue

        aid = int(item.alumno_id)
        plazo_alumno = (item.fecha_entrega_especial or (fecha_pie if item.es_pie else fecha_gen))[:10]
        comentario_asignacion = (
            f"Asignada con adecuación PIE (Plazo diferenciado: {plazo_alumno}) • {item.modo_voz or 'Audio Lento'}"
            if item.es_pie else
            f"Asignada por docente • Plazo: {plazo_alumno} • {item.modo_voz or 'Activo (Robot Leo)'}"
        )

        existente = execute_query(
            "SELECT id FROM ENTREGA WHERE actividad_id = %s AND alumno_id = %s LIMIT 1",
            (actividad_id, aid),
            fetch_one=True
        )
        if existente:
            execute_query(
                """UPDATE ENTREGA
                   SET fecha_entrega = %s, calificacion = NULL, comentarios = %s, estado = 'Pendiente', progreso = 0
                   WHERE id = %s""",
                (plazo_alumno, comentario_asignacion, existente["id"]),
                commit=True
            )
        else:
            execute_query(
                """INSERT INTO ENTREGA
                   (actividad_id, alumno_id, fecha_entrega, calificacion, comentarios, estado, progreso, tiempo_minutos)
                   VALUES (%s, %s, %s, NULL, %s, 'Pendiente', 0, 10)""",
                (actividad_id, aid, plazo_alumno, comentario_asignacion),
                commit=True
            )
        entregas_creadas += 1

        # 3. Buscar apoderado(s) del alumno y crear registro en NOTIFICACION
        apo_rows = execute_query(
            """SELECT aa.apoderado_usuario_id, u.nombre as alumno_nombre
               FROM ALUMNO a
               JOIN USUARIO u ON a.usuario_id = u.id
               LEFT JOIN ALUMNO_APODERADO aa ON a.id = aa.alumno_id
               WHERE a.id = %s""",
            (aid,)
        )
        for apo in apo_rows:
            apo_id = apo.get("apoderado_usuario_id")
            al_nombre = apo.get("alumno_nombre") or "su pupilo"
            if apo_id:
                notif_titulo = f"Nueva Actividad Asignada: {titulo_limpio}"
                notif_contenido = (
                    f"La profesora jefe ha asignado la actividad '{titulo_limpio}' ({asignatura_limpia} • {oa_limpio}) "
                    f"para {al_nombre}. Fecha límite de entrega: {plazo_alumno}. Disponible con el tutor de voz Robot Leo."
                )
                execute_query(
                    """INSERT INTO NOTIFICACION (usuario_id, tipo, titulo, contenido, fecha_creacion, estado)
                       VALUES (%s, 'urgente', %s, %s, %s, 'PENDIENTE')""",
                    (apo_id, notif_titulo, notif_contenido, ahora_str),
                    commit=True
                )
                notificaciones_creadas += 1
                apoderados_notificados.add(apo_id)

    # Garantizar que el apoderado demo titular (Carolina Tapia, id=13) reciba la alerta si no estaba en la lista
    if 13 not in apoderados_notificados and entregas_creadas > 0:
        notif_titulo = f"Nueva Actividad Asignada: {titulo_limpio}"
        notif_contenido = (
            f"La profesora jefe ha asignado la actividad '{titulo_limpio}' ({asignatura_limpia} • {oa_limpio}) "
            f"para Mateo González. Fecha límite de entrega: {fecha_gen}. Disponible con el tutor de voz Robot Leo."
        )
        execute_query(
            """INSERT INTO NOTIFICACION (usuario_id, tipo, titulo, contenido, fecha_creacion, estado)
               VALUES (13, 'urgente', %s, %s, %s, 'PENDIENTE')""",
            (notif_titulo, notif_contenido, ahora_str),
            commit=True
        )
        notificaciones_creadas += 1

    return {
        "success": True,
        "message": "Actividad asignada y notificaciones enviadas exitosamente a los apoderados",
        "actividad_id": actividad_id,
        "codigo_frontend": codigo_fe,
        "titulo": titulo_limpio,
        "asignatura": asignatura_limpia,
        "oa_codigo": oa_limpio,
        "fecha_entrega_general": fecha_gen,
        "fecha_entrega_pie": fecha_pie,
        "entregas_creadas": entregas_creadas,
        "notificaciones_enviadas": notificaciones_creadas
    }
