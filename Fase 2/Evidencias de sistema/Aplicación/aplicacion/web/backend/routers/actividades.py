import html
import json
from datetime import date, datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from database import execute_query, get_connection
from routers.ia_evaluador import ResumenActividadDocenteRequest, generar_resumen_docente_ia_interno

router = APIRouter(prefix="/api/actividades", tags=["Actividades y Tareas"])

_ENTREGA_COLS_CHECKED = False


def _ensure_entrega_columns():
    """Garantiza que la tabla ENTREGA posea las columnas para tiempos por número y resumen IA."""
    global _ENTREGA_COLS_CHECKED
    if _ENTREGA_COLS_CHECKED:
        return
    try:
        cols = execute_query("SHOW COLUMNS FROM ENTREGA")
        col_names = {c.get("Field") for c in (cols or [])}
        if "detalle_respuestas_json" not in col_names:
            execute_query("ALTER TABLE ENTREGA ADD COLUMN detalle_respuestas_json LONGTEXT NULL", commit=True)
        if "resumen_ia_docente" not in col_names:
            execute_query("ALTER TABLE ENTREGA ADD COLUMN resumen_ia_docente TEXT NULL", commit=True)
        _ENTREGA_COLS_CHECKED = True
    except Exception as e:
        print(f"[DB MIGRATION] Aviso verificando columnas en ENTREGA: {e}")


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
    errores_conteo: Optional[List[str]] = None
    detalle_respuestas: Optional[List[dict]] = None
    resumen_ia_docente: Optional[str] = None
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
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    asignatura: Optional[str] = "Matemáticas"
    oa_codigo: Optional[str] = "MA01 OA 01"
    fecha_apertura: Optional[str] = None
    fecha_entrega_general: Optional[str] = None
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
    Obtiene únicamente las actividades efectivamente asignadas al alumno (presentes en ENTREGA)
    con su estado actual ('Pendiente', 'En progreso', 'Entregada'), progreso y calificación.
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
        INNER JOIN ENTREGA e ON a.id = e.actividad_id AND e.alumno_id = %s
        WHERE a.curso_id = %s
        ORDER BY FIELD(COALESCE(e.estado, 'Pendiente'), 'Pendiente', 'En progreso', 'Entregada'), e.id ASC, a.id ASC
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

    # 2. Normalizar estado, progreso y puntaje (escala 1 al 10)
    estado_norm = payload.estado.strip()
    if estado_norm not in ("Pendiente", "En progreso", "Entregada"):
        estado_norm = "Entregada" if payload.progreso >= 100 else "En progreso"

    progreso_norm = max(0, min(100, int(payload.progreso)))
    errores_lista = [str(x).strip() for x in (payload.errores_conteo or []) if str(x).strip()]

    if estado_norm == "Entregada":
        progreso_norm = 100
        if payload.calificacion is not None:
            raw_score = float(payload.calificacion)
            calificacion_val = max(1.0, min(10.0, round(raw_score, 1)))
        elif errores_lista:
            calificacion_val = float(max(1, 10 - len(errores_lista)))
        else:
            calificacion_val = 10.0

        if errores_lista:
            diagnostico_str = f"Se equivocó en: {', '.join(errores_lista)}"
            if payload.comentarios and "Se equivocó en:" not in payload.comentarios:
                comentarios_val = f"{payload.comentarios} | {diagnostico_str}"
            else:
                comentarios_val = payload.comentarios or f"Conteo completado. {diagnostico_str}"
        else:
            comentarios_val = payload.comentarios or "Actividad completada sin errores (Puntaje perfecto: 10/10)."
    elif estado_norm == "En progreso":
        calificacion_val = max(1.0, min(10.0, round(float(payload.calificacion), 1))) if payload.calificacion is not None else None
        if errores_lista:
            diagnostico_str = f"Se equivocó en: {', '.join(errores_lista)}"
            comentarios_val = f"En progreso ({progreso_norm}%). {diagnostico_str}"
        else:
            comentarios_val = payload.comentarios or f"Actividad en progreso ({progreso_norm}% completado)."
    else:
        progreso_norm = 0
        calificacion_val = None
        comentarios_val = payload.comentarios or "Actividad pendiente."

    tiempo_min = payload.tiempo_minutos or 5
    _ensure_entrega_columns()

    # Preparar JSON de detalles paso a paso (con tiempos por número) y resumen IA para el docente
    detalle_json_str = None
    if payload.detalle_respuestas is not None:
        try:
            detalle_json_str = json.dumps(payload.detalle_respuestas, ensure_ascii=False)
        except Exception:
            detalle_json_str = None

    resumen_ia_str = payload.resumen_ia_docente
    if not resumen_ia_str and (estado_norm == "Entregada" or payload.detalle_respuestas or errores_lista):
        try:
            al_nombre = "Sofía González" if alumno_id == 6 else "Mateo González"
            act_titulo = (act_row.get("titulo") if act_row else None) or payload.titulo or "Actividad de Conteo"
            act_asig = (act_row.get("asignatura") if act_row else None) or payload.asignatura or "Matemáticas"
            ia_obj = generar_resumen_docente_ia_interno(
                ResumenActividadDocenteRequest(
                    alumno_nombre=al_nombre,
                    actividad_codigo=payload.codigo_frontend or (act_row.get("codigo_frontend") if act_row else "act-conteo"),
                    actividad_titulo=act_titulo,
                    asignatura=act_asig,
                    calificacion=calificacion_val if calificacion_val is not None else 10.0,
                    errores_conteo=errores_lista,
                    detalle_respuestas=payload.detalle_respuestas or []
                )
            )
            resumen_ia_str = json.dumps(ia_obj, ensure_ascii=False)
        except Exception as e:
            print(f"[ACTIVIDADES] Aviso generando resumen IA docente: {e}")

    # 3. Verificar si ya existe un registro en ENTREGA para (actividad_id, alumno_id)
    existente = execute_query(
        "SELECT id, detalle_respuestas_json, resumen_ia_docente FROM ENTREGA WHERE actividad_id = %s AND alumno_id = %s LIMIT 1",
        (actividad_id, alumno_id),
        fetch_one=True
    )

    if existente:
        if detalle_json_str is None and estado_norm != "Pendiente":
            detalle_json_str = existente.get("detalle_respuestas_json")
        if resumen_ia_str is None and estado_norm != "Pendiente":
            resumen_ia_str = existente.get("resumen_ia_docente")
        execute_query(
            """UPDATE ENTREGA
               SET fecha_entrega = %s,
                   calificacion = %s,
                   comentarios = %s,
                   estado = %s,
                   progreso = %s,
                   tiempo_minutos = %s,
                   detalle_respuestas_json = %s,
                   resumen_ia_docente = %s
               WHERE id = %s""",
            (hoy_str, calificacion_val, comentarios_val, estado_norm, progreso_norm, tiempo_min, detalle_json_str, resumen_ia_str, existente["id"]),
            commit=True
        )
        entrega_id = existente["id"]
        operacion = "actualizado"
    else:
        res_ent = execute_query(
            """INSERT INTO ENTREGA
               (actividad_id, alumno_id, fecha_entrega, calificacion, comentarios, estado, progreso, tiempo_minutos, detalle_respuestas_json, resumen_ia_docente)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (actividad_id, alumno_id, hoy_str, calificacion_val, comentarios_val, estado_norm, progreso_norm, tiempo_min, detalle_json_str, resumen_ia_str),
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
    titulo_limpio = html.escape((payload.titulo or payload.codigo_frontend or "Actividad Mineduc").strip())
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
        if not payload.titulo or payload.titulo.strip() == payload.codigo_frontend:
            titulo_limpio = act_row.get("titulo") or titulo_limpio
        if not payload.asignatura:
            asignatura_limpia = act_row.get("asignatura") or asignatura_limpia
        if not payload.oa_codigo and act_row.get("dificultad"):
            dificultad_str = act_row.get("dificultad")
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

        _ensure_entrega_columns()
        existente = execute_query(
            "SELECT id FROM ENTREGA WHERE actividad_id = %s AND alumno_id = %s LIMIT 1",
            (actividad_id, aid),
            fetch_one=True
        )
        if existente:
            execute_query(
                """UPDATE ENTREGA
                   SET fecha_entrega = %s, calificacion = NULL, comentarios = %s, estado = 'Pendiente', progreso = 0,
                       detalle_respuestas_json = NULL, resumen_ia_docente = NULL
                   WHERE id = %s""",
                (plazo_alumno, comentario_asignacion, existente["id"]),
                commit=True
            )
        else:
            execute_query(
                """INSERT INTO ENTREGA
                   (actividad_id, alumno_id, fecha_entrega, calificacion, comentarios, estado, progreso, tiempo_minutos, detalle_respuestas_json, resumen_ia_docente)
                   VALUES (%s, %s, %s, NULL, %s, 'Pendiente', 0, 10, NULL, NULL)""",
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


class DesasignarActividadRequest(BaseModel):
    actividad_id: Optional[int] = None
    codigo_frontend: Optional[str] = None
    curso_id: Optional[int] = 3
    alumno_id: Optional[int] = None


@router.get("/estado-curso/{curso_id}")
def get_estado_actividades_curso(curso_id: int):
    """
    Devuelve el catálogo de actividades de un curso indicando cuáles están asignadas
    en ENTREGA, a cuántos alumnos, cuántas fueron entregadas y el estado, puntaje, tiempos y resumen IA del alumno principal.
    """
    _ensure_entrega_columns()
    alumno_principal = 6 if curso_id == 4 else 5
    query = """
        SELECT a.id as actividad_id,
               a.codigo_frontend,
               a.titulo,
               a.descripcion,
               a.asignatura,
               a.dificultad,
               a.fecha_entrega,
               COUNT(e.id) as total_asignados,
               SUM(CASE WHEN e.estado = 'Entregada' THEN 1 ELSE 0 END) as total_entregadas,
               MAX(CASE WHEN e.alumno_id = %s THEN 1 ELSE 0 END) as asignada_alumno,
               MAX(CASE WHEN e.alumno_id = %s THEN e.estado ELSE NULL END) as estado_alumno,
               MAX(CASE WHEN e.alumno_id = %s THEN e.progreso ELSE 0 END) as progreso_alumno,
               MAX(CASE WHEN e.alumno_id = %s THEN e.calificacion ELSE NULL END) as calificacion_alumno,
               MAX(CASE WHEN e.alumno_id = %s THEN e.comentarios ELSE NULL END) as comentarios_alumno,
               MAX(CASE WHEN e.alumno_id = %s THEN e.detalle_respuestas_json ELSE NULL END) as detalle_respuestas_json,
               MAX(CASE WHEN e.alumno_id = %s THEN e.resumen_ia_docente ELSE NULL END) as resumen_ia_docente
        FROM ACTIVIDAD a
        LEFT JOIN ENTREGA e ON a.id = e.actividad_id
        WHERE a.curso_id = %s AND a.codigo_frontend IS NOT NULL
        GROUP BY a.id, a.codigo_frontend, a.titulo, a.descripcion, a.asignatura, a.dificultad, a.fecha_entrega
        ORDER BY a.id ASC
    """
    rows = execute_query(
        query,
        (alumno_principal, alumno_principal, alumno_principal, alumno_principal, alumno_principal, alumno_principal, alumno_principal, curso_id)
    )
    for r in rows:
        r["asignada"] = bool(r.get("asignada_alumno") or (r.get("total_asignados") or 0) > 0)
        r["total_asignados"] = int(r.get("total_asignados") or 0)
        r["total_entregadas"] = int(r.get("total_entregadas") or 0)
        r["progreso_alumno"] = int(r.get("progreso_alumno") or 0)
        if r.get("calificacion_alumno") is not None:
            r["calificacion_alumno"] = round(float(r["calificacion_alumno"]), 1)
        raw_det = r.pop("detalle_respuestas_json", None)
        if raw_det:
            try:
                r["detalle_respuestas_alumno"] = json.loads(raw_det)
            except Exception:
                r["detalle_respuestas_alumno"] = []
        else:
            r["detalle_respuestas_alumno"] = []

        raw_ia = r.pop("resumen_ia_docente", None)
        if raw_ia:
            try:
                r["resumen_ia_alumno"] = json.loads(raw_ia)
            except Exception:
                r["resumen_ia_alumno"] = {"puntos_mejora": str(raw_ia)}
        else:
            r["resumen_ia_alumno"] = None
    return {
        "curso_id": curso_id,
        "actividades": rows
    }


@router.get("/revision/{curso_id}/{codigo_frontend}")
def get_revision_actividad_docente(curso_id: int, codigo_frontend: str, alumno_id: Optional[int] = None):
    """
    Obtiene el panel completo de revisión para el profesor de una actividad específica:
    - Lista de alumnos que han completado la actividad (y asignados) para elegir cuál revisar
    - Cómo respondió el alumno seleccionado paso a paso / número por número
    - Cuántos segundos tardó en decir cada número
    - Puntaje (1 al 10) y errores específicos
    - Resumen con IA indicando fortalezas, puntos de mejora y mensaje sugerido listo para enviar al apoderado
    """
    _ensure_entrega_columns()

    act_row = execute_query(
        "SELECT * FROM ACTIVIDAD WHERE codigo_frontend = %s AND curso_id = %s LIMIT 1",
        (codigo_frontend, curso_id),
        fetch_one=True
    )
    if not act_row:
        act_row = execute_query(
            "SELECT * FROM ACTIVIDAD WHERE codigo_frontend = %s LIMIT 1",
            (codigo_frontend,),
            fetch_one=True
        )
    if not act_row:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")

    # Obtener todos los alumnos con entrega registrada para esta actividad
    entregas_curso = execute_query(
        """SELECT e.alumno_id,
                  u.nombre as alumno_nombre,
                  COALESCE(e.estado, 'Pendiente') as estado,
                  COALESCE(e.progreso, 0) as progreso,
                  e.calificacion,
                  e.fecha_entrega,
                  e.comentarios,
                  (SELECT u_ap.nombre
                   FROM ALUMNO_APODERADO aa
                   JOIN USUARIO u_ap ON aa.apoderado_usuario_id = u_ap.id
                   WHERE aa.alumno_id = e.alumno_id
                   LIMIT 1) as apoderado_nombre
           FROM ENTREGA e
           JOIN ALUMNO al ON e.alumno_id = al.id
           JOIN USUARIO u ON al.usuario_id = u.id
           WHERE e.actividad_id = %s
           ORDER BY FIELD(COALESCE(e.estado, 'Pendiente'), 'Entregada', 'En progreso', 'Pendiente'),
                    CASE WHEN e.alumno_id IN (5, 6) THEN 0 ELSE 1 END,
                    u.nombre ASC""",
        (act_row["id"],)
    ) or []

    alumnos_asignados = []
    alumnos_completados = []
    for row_e in entregas_curso:
        cal_item = round(float(row_e["calificacion"]), 1) if row_e.get("calificacion") is not None else None
        item_dict = {
            "alumno_id": int(row_e["alumno_id"]),
            "alumno_nombre": row_e.get("alumno_nombre") or f"Estudiante #{row_e['alumno_id']}",
            "apoderado_nombre": row_e.get("apoderado_nombre") or "Carolina Tapia Morales",
            "estado": row_e.get("estado") or "Pendiente",
            "progreso": int(row_e.get("progreso") or 0),
            "calificacion": cal_item,
            "fecha_entrega": str(row_e.get("fecha_entrega") or "")
        }
        alumnos_asignados.append(item_dict)
        if item_dict["estado"] == "Entregada" or (item_dict["estado"] == "En progreso" and item_dict["progreso"] > 0):
            alumnos_completados.append(item_dict)

    if alumno_id is not None:
        target_alumno = int(alumno_id)
    elif alumnos_completados:
        target_alumno = alumnos_completados[0]["alumno_id"]
    else:
        target_alumno = 6 if curso_id == 4 else 5

    selected_meta = next((a for a in alumnos_asignados if a["alumno_id"] == target_alumno), None)
    if selected_meta:
        alumno_nombre = selected_meta["alumno_nombre"]
        apoderado_nombre = selected_meta["apoderado_nombre"]
    else:
        al_info = execute_query(
            """SELECT u.nombre as alumno_nombre,
                      (SELECT u_ap.nombre
                       FROM ALUMNO_APODERADO aa
                       JOIN USUARIO u_ap ON aa.apoderado_usuario_id = u_ap.id
                       WHERE aa.alumno_id = al.id
                       LIMIT 1) as apoderado_nombre
               FROM ALUMNO al
               JOIN USUARIO u ON al.usuario_id = u.id
               WHERE al.id = %s
               LIMIT 1""",
            (target_alumno,),
            fetch_one=True
        )
        alumno_nombre = (al_info.get("alumno_nombre") if al_info else None) or ("Sofía González" if target_alumno == 6 else "Mateo González")
        apoderado_nombre = (al_info.get("apoderado_nombre") if al_info else None) or "Carolina Tapia Morales"

    entrega = execute_query(
        """SELECT id, actividad_id, alumno_id, fecha_entrega, calificacion, comentarios,
                  estado, progreso, tiempo_minutos, detalle_respuestas_json, resumen_ia_docente
           FROM ENTREGA
           WHERE actividad_id = %s AND alumno_id = %s
           LIMIT 1""",
        (act_row["id"], target_alumno),
        fetch_one=True
    )

    detalles = []
    if entrega and entrega.get("detalle_respuestas_json"):
        try:
            detalles = json.loads(entrega["detalle_respuestas_json"])
        except Exception:
            detalles = []

    comentarios = (entrega.get("comentarios") or "") if entrega else ""
    errores_extraidos = []
    if "Se equivocó en:" in comentarios:
        part = comentarios.split("Se equivocó en:", 1)[1].strip()
        errores_extraidos = [x.strip() for x in part.split(",") if x.strip()]

    # Si es una entrega completada o en progreso que aún no tenía desglose por número guardado, construir desglose representativo
    es_conteo = "conteo" in codigo_frontend.lower() or "mat-2" in codigo_frontend.lower()
    if not detalles and entrega and entrega.get("estado") in ("Entregada", "En progreso") and es_conteo:
        tiempos_base = [1.4, 1.3, 1.6, 2.1, 1.5, 1.8, 2.2, 1.9, 1.7, 1.5]
        for num in range(1, 11):
            err_for_num = [e for e in errores_extraidos if f"Número {num}" in e]
            t_seg = round(tiempos_base[num - 1] + (2.4 if err_for_num else 0.0), 1)
            detalles.append({
                "paso": num,
                "etiqueta": f"Número {num}",
                "esperado": str(num),
                "respondido": f"{num}" if not err_for_num else f"{err_for_num[0]} → luego {num}",
                "intentos": 1 + len(err_for_num),
                "errores_previos": err_for_num,
                "tiempo_segundos": t_seg,
                "correcto": len(err_for_num) == 0
            })

    resumen_ia = None
    if entrega and entrega.get("resumen_ia_docente"):
        try:
            resumen_ia = json.loads(entrega["resumen_ia_docente"])
        except Exception:
            resumen_ia = None

    calificacion_val = round(float(entrega["calificacion"]), 1) if (entrega and entrega.get("calificacion") is not None) else None

    if not resumen_ia and entrega and (entrega.get("estado") in ("Entregada", "En progreso") or detalles or errores_extraidos):
        resumen_ia = generar_resumen_docente_ia_interno(
            ResumenActividadDocenteRequest(
                alumno_nombre=alumno_nombre,
                actividad_codigo=codigo_frontend,
                actividad_titulo=act_row.get("titulo") or "Actividad Escolar",
                asignatura=act_row.get("asignatura") or "Matemáticas",
                calificacion=calificacion_val if calificacion_val is not None else 10.0,
                errores_conteo=errores_extraidos,
                detalle_respuestas=detalles
            )
        )
        try:
            execute_query(
                "UPDATE ENTREGA SET resumen_ia_docente = %s WHERE id = %s",
                (json.dumps(resumen_ia, ensure_ascii=False), entrega["id"]),
                commit=True
            )
        except Exception:
            pass

    tiempos_vals = [float(d.get("tiempo_segundos", 0)) for d in detalles if isinstance(d, dict) and d.get("tiempo_segundos")]
    tiempo_total_seg = round(sum(tiempos_vals), 1) if tiempos_vals else 0.0
    tiempo_prom_seg = round(tiempo_total_seg / len(tiempos_vals), 1) if tiempos_vals else 0.0

    return {
        "success": True,
        "curso_id": curso_id,
        "actividad_id": act_row["id"],
        "codigo_frontend": codigo_frontend,
        "titulo": act_row.get("titulo"),
        "asignatura": act_row.get("asignatura"),
        "dificultad": act_row.get("dificultad"),
        "alumno_id": target_alumno,
        "alumno_nombre": alumno_nombre,
        "apoderado_nombre": apoderado_nombre,
        "alumnos_completados": alumnos_completados,
        "alumnos_asignados": alumnos_asignados,
        "estado": entrega.get("estado") if entrega else "Sin asignar",
        "progreso": int(entrega.get("progreso") or 0) if entrega else 0,
        "calificacion": calificacion_val,
        "comentarios": comentarios,
        "errores_conteo": errores_extraidos,
        "tiempo_total_segundos": tiempo_total_seg,
        "tiempo_promedio_segundos": tiempo_prom_seg,
        "detalle_respuestas": detalles,
        "resumen_ia": resumen_ia
    }


@router.post("/desasignar")
def desasignar_actividad(payload: DesasignarActividadRequest):
    """
    Quita/desasigna una actividad específica eliminando sus registros en ENTREGA
    para que ya no aparezca en la bandeja del alumno.
    """
    act_id = payload.actividad_id
    if not act_id and payload.codigo_frontend:
        row = execute_query("SELECT id FROM ACTIVIDAD WHERE codigo_frontend = %s LIMIT 1", (payload.codigo_frontend,), fetch_one=True)
        if row:
            act_id = row["id"]

    if not act_id:
        raise HTTPException(status_code=404, detail="Actividad no encontrada para desasignar")

    if payload.alumno_id:
        res = execute_query("DELETE FROM ENTREGA WHERE actividad_id = %s AND alumno_id = %s", (act_id, payload.alumno_id), commit=True)
    else:
        res = execute_query("DELETE FROM ENTREGA WHERE actividad_id = %s", (act_id,), commit=True)

    return {
        "success": True,
        "message": "Actividad desasignada correctamente",
        "actividad_id": act_id,
        "codigo_frontend": payload.codigo_frontend,
        "eliminados": res.get("affected_rows", 0)
    }


@router.post("/desasignar-todas")
def desasignar_todas_actividades(payload: DesasignarActividadRequest):
    """
    Vacía todas las actividades asignadas de un curso (o de todos los cursos)
    para poder asignarlas una a una desde cero.
    """
    if payload.alumno_id:
        res = execute_query("DELETE FROM ENTREGA WHERE alumno_id = %s", (payload.alumno_id,), commit=True)
    elif payload.curso_id:
        res = execute_query(
            "DELETE e FROM ENTREGA e INNER JOIN ACTIVIDAD a ON e.actividad_id = a.id WHERE a.curso_id = %s",
            (payload.curso_id,),
            commit=True
        )
    else:
        res = execute_query("DELETE FROM ENTREGA", commit=True)

    return {
        "success": True,
        "message": "Todas las actividades del curso han sido desasignadas",
        "curso_id": payload.curso_id,
        "eliminados": res.get("affected_rows", 0)
    }


class ReiniciarPuntajeRequest(BaseModel):
    codigo_frontend: Optional[str] = None
    actividad_id: Optional[int] = None
    alumno_id: Optional[int] = None
    student_code: Optional[str] = None
    curso_id: Optional[int] = 3


@router.post("/reiniciar-puntaje")
def reiniciar_puntaje_actividad(payload: ReiniciarPuntajeRequest):
    """
    Reinicia exclusivamente el puntaje, avance y diagnóstico de una actividad
    para un alumno a estado 'Pendiente' (0% progreso, calificacion NULL),
    dejando la actividad limpia para que el alumno pueda responderla de nuevo.
    """
    _ensure_entrega_columns()
    alumno_id = resolve_alumno_id(payload.alumno_id, payload.student_code)
    
    act_row = None
    if payload.actividad_id:
        act_row = execute_query("SELECT id, titulo FROM ACTIVIDAD WHERE id = %s", (payload.actividad_id,), fetch_one=True)
    elif payload.codigo_frontend:
        act_row = execute_query("SELECT id, titulo FROM ACTIVIDAD WHERE codigo_frontend = %s LIMIT 1", (payload.codigo_frontend,), fetch_one=True)
    
    if not act_row:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")

    res = execute_query(
        """UPDATE ENTREGA
           SET estado = 'Pendiente',
               progreso = 0,
               calificacion = NULL,
               comentarios = 'Puntaje e historial reiniciados por el docente para nuevo intento.',
               detalle_respuestas_json = NULL,
               resumen_ia_docente = NULL
           WHERE actividad_id = %s AND alumno_id = %s""",
        (act_row["id"], alumno_id),
        commit=True
    )

    return {
        "success": True,
        "message": f"Puntaje y progreso de '{act_row.get('titulo')}' reiniciados a Pendiente (0%).",
        "actividad_id": act_row["id"],
        "alumno_id": alumno_id,
        "filas_afectadas": res.get("affected_rows", 0)
    }

