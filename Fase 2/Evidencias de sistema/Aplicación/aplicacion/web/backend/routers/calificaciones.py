from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import execute_query

router = APIRouter(prefix="/api/calificaciones", tags=["Calificaciones y Entregas"])

class EntregaCreate(BaseModel):
    actividad_id: int
    alumno_id: int
    fecha_entrega: str
    calificacion: Optional[float] = None
    comentarios: Optional[str] = None
    estado: Optional[str] = "Entregada"
    progreso: Optional[int] = 100


def _resolve_alumno_id(student_ref: str) -> int:
    ref = str(student_ref).strip().lower()
    if ref in ("alu-102", "5", "mateo"):
        return 5
    if ref in ("alu-103", "6", "sofia", "sofía"):
        return 6
    if ref.isdigit():
        return int(ref)
    return 5


def _extract_diagnostico_profesor(comentarios: Optional[str]) -> Optional[str]:
    if not comentarios:
        return None
    text = str(comentarios)
    if "Se equivocó en:" in text:
        idx = text.find("Se equivocó en:")
        return text[idx:].strip()
    return None


@router.get("/reporteria/{student_ref}")
def get_reporteria_alumno(student_ref: str):
    """
    Obtiene el resumen integral de Reporteria y estados de actividades de un estudiante
    desde la base de datos MySQL (Pendiente, En progreso, Entregada, notas por asignatura y promedio).
    """
    alumno_id = _resolve_alumno_id(student_ref)
    curso_id = 4 if alumno_id == 6 else 3
    student_code = "alu-103" if alumno_id == 6 else "alu-102"

    # 1. Consultar todas las actividades del catalogo del curso con el estado del alumno
    query_acts = """
        SELECT a.id as actividad_id,
               a.codigo_frontend,
               a.titulo,
               a.descripcion,
               COALESCE(a.asignatura, 'Matemáticas') as asignatura,
               a.fecha_entrega,
               a.ponderacion,
               COALESCE(a.dificultad, '1° Básico • Inicial') as dificultad,
               COALESCE(a.tiempo_estimado, '10 min') as tiempo_estimado,
               COALESCE(a.cantidad_preguntas, 5) as cantidad_preguntas,
               COALESCE(a.urgente, FALSE) as urgente,
               COALESCE(e.estado, 'Pendiente') as estado,
               COALESCE(e.progreso, 0) as progreso,
               e.calificacion,
               e.comentarios,
               e.fecha_entrega as fecha_registro,
               COALESCE(e.tiempo_minutos, 12) as tiempo_minutos
        FROM ACTIVIDAD a
        INNER JOIN ENTREGA e ON a.id = e.actividad_id AND e.alumno_id = %s
        WHERE a.curso_id = %s
        ORDER BY CASE WHEN a.codigo_frontend = 'act-conteo' THEN 0 ELSE 1 END, e.id ASC, a.id ASC
    """
    actividades = execute_query(query_acts, (alumno_id, curso_id))

    # 2. Consultar todas las entregas con calificacion del alumno (incluyendo historicas)
    query_entregas = """
        SELECT e.id, e.actividad_id, a.titulo as actividad_titulo,
               COALESCE(a.asignatura, 'Matemáticas') as asignatura,
               a.codigo_frontend, a.ponderacion,
               e.fecha_entrega, e.calificacion, e.comentarios,
               COALESCE(e.estado, 'Entregada') as estado,
               COALESCE(e.progreso, 100) as progreso,
               COALESCE(e.tiempo_minutos, 12) as tiempo_minutos,
               c.nombre as curso_nombre
        FROM ENTREGA e
        JOIN ACTIVIDAD a ON e.actividad_id = a.id
        JOIN CURSO c ON a.curso_id = c.id
        WHERE e.alumno_id = %s
        ORDER BY e.fecha_entrega DESC, e.id DESC
    """
    entregas = execute_query(query_entregas, (alumno_id,))

    # 3. Enriquecer actividades y entregas con puntaje (1 al 10) y diagnóstico docente separado
    for act in actividades:
        if act.get("calificacion") is not None:
            act["calificacion"] = max(1.0, min(10.0, round(float(act["calificacion"]), 1)))
        diag = _extract_diagnostico_profesor(act.get("comentarios"))
        act["diagnostico_profesor"] = diag

    for ent in entregas:
        if ent.get("calificacion") is not None:
            ent["calificacion"] = max(1.0, min(10.0, round(float(ent["calificacion"]), 1)))
        ent["diagnostico_profesor"] = _extract_diagnostico_profesor(ent.get("comentarios"))

    pending_list = [a for a in actividades if a["estado"] == "Pendiente"]
    in_progress_list = [a for a in actividades if a["estado"] == "En progreso"]
    completed_list = [a for a in actividades if a["estado"] == "Entregada"]

    total_acts = len(actividades)
    pending_count = len(pending_list)
    in_progress_count = len(in_progress_list)
    completed_count = len(completed_list)

    # 4. Calcular puntajes promedio por asignatura y general (Escala 1 al 10; 0 si no hay actividades evaluadas)
    notas_todas = [float(e["calificacion"]) for e in entregas if e["calificacion"] is not None]
    notas_mat = [float(e["calificacion"]) for e in entregas if e["calificacion"] is not None and "matem" in (e["asignatura"] or "").lower()]
    notas_len = [float(e["calificacion"]) for e in entregas if e["calificacion"] is not None and "lenguaje" in (e["asignatura"] or "").lower()]

    overall_grade = round(sum(notas_todas) / len(notas_todas), 1) if notas_todas else 0.0
    math_grade = round(sum(notas_mat) / len(notas_mat), 1) if notas_mat else 0.0
    lang_grade = round(sum(notas_len) / len(notas_len), 1) if notas_len else 0.0

    # Tareas por asignatura en el catalogo activo
    acts_mat = [a for a in actividades if "matem" in (a["asignatura"] or "").lower()]
    acts_mat_done = [a for a in acts_mat if a["estado"] == "Entregada"]
    acts_len = [a for a in actividades if "lenguaje" in (a["asignatura"] or "").lower()]
    acts_len_done = [a for a in acts_len if a["estado"] == "Entregada"]

    math_tasks_text = f"{len(acts_mat_done)} de {len(acts_mat)} tareas completadas" if acts_mat else "0 de 0 tareas completadas"
    lang_tasks_text = f"{len(acts_len_done)} de {len(acts_len)} tareas completadas" if acts_len else "0 de 0 tareas completadas"

    # Siguiente tarea pendiente o en progreso
    next_task = None
    if pending_list:
        next_task = pending_list[0]
    elif in_progress_list:
        next_task = in_progress_list[0]

    completed_month = completed_count
    completion_rate = min(100, round((completed_count / total_acts) * 100)) if total_acts > 0 else 0

    def _status_label(score: float) -> str:
        if score <= 0:
            return "Sin puntajes"
        if score >= 9.0:
            return "Excelente"
        if score >= 7.0:
            return "Muy Bien"
        return "En Refuerzo"

    return {
        "alumno_id": alumno_id,
        "student_code": student_code,
        "overall_grade": overall_grade,
        "math_grade": math_grade,
        "math_status": _status_label(math_grade),
        "math_tasks": math_tasks_text,
        "language_grade": lang_grade,
        "language_status": _status_label(lang_grade),
        "language_tasks": lang_tasks_text,
        "pending_count": pending_count,
        "in_progress_count": in_progress_count,
        "completed_count": completed_count,
        "total_activities": total_acts,
        "completed_activities_month": completed_month,
        "completion_rate": completion_rate,
        "next_pending_task": {
            "codigo_frontend": next_task["codigo_frontend"] if next_task else None,
            "titulo": next_task["titulo"] if next_task else ("Sin actividades asignadas" if total_acts == 0 else "Todas las actividades completadas"),
            "estado": next_task["estado"] if next_task else ("Sin asignar" if total_acts == 0 else "Entregada"),
            "progreso": next_task["progreso"] if next_task else 0
        },
        "actividades": actividades,
        "entregas": entregas
    }


@router.get("/alumno/{alumno_id}")
def get_entregas_alumno(alumno_id: int):
    """
    Obtiene el historial de puntajes y entregas de un estudiante (escala 1 al 10).
    Alimenta directamente la vista de Semáforo y Reportería del Apoderado y Profesor.
    """
    query = """
        SELECT e.id, e.actividad_id, a.titulo as actividad_titulo,
               COALESCE(a.asignatura, 'Matemáticas') as asignatura,
               a.codigo_frontend, a.ponderacion,
               e.fecha_entrega, e.calificacion, e.comentarios,
               COALESCE(e.estado, 'Entregada') as estado,
               COALESCE(e.progreso, 100) as progreso,
               c.nombre as curso_nombre
        FROM ENTREGA e
        JOIN ACTIVIDAD a ON e.actividad_id = a.id
        JOIN CURSO c ON a.curso_id = c.id
        WHERE e.alumno_id = %s
        ORDER BY e.fecha_entrega DESC, e.id DESC
    """
    entregas = execute_query(query, (alumno_id,))
    for ent in entregas:
        if ent.get("calificacion") is not None:
            ent["calificacion"] = max(1.0, min(10.0, round(float(ent["calificacion"]), 1)))
        ent["diagnostico_profesor"] = _extract_diagnostico_profesor(ent.get("comentarios"))

    # Calcular puntaje promedio en base a las entregas con puntaje (escala 1 al 10; 0.0 si no hay entregas)
    notas_validas = [float(e["calificacion"]) for e in entregas if e["calificacion"] is not None]
    promedio = round(sum(notas_validas) / len(notas_validas), 1) if notas_validas else 0.0

    return {
        "alumno_id": alumno_id,
        "promedio_general": promedio,
        "total_entregas": len(entregas),
        "entregas": entregas
    }

@router.get("/curso/{curso_id}")
def get_calificaciones_curso(curso_id: int):
    """Obtiene el resumen de rendimiento y calificaciones para los profesores de un curso."""
    query = """
        SELECT a.id as alumno_id, u.nombre as alumno_nombre,
               COUNT(e.id) as tareas_entregadas,
               ROUND(AVG(e.calificacion), 1) as promedio_alumno
        FROM ALUMNO a
        JOIN USUARIO u ON a.usuario_id = u.id
        LEFT JOIN ENTREGA e ON a.id = e.alumno_id
        GROUP BY a.id, u.nombre
    """
    return execute_query(query)

@router.post("/entrega")
def registrar_entrega(entrega: EntregaCreate):
    """Registra o actualiza la entrega de una actividad por parte de un alumno."""
    existente = execute_query(
        "SELECT id FROM ENTREGA WHERE actividad_id = %s AND alumno_id = %s LIMIT 1",
        (entrega.actividad_id, entrega.alumno_id),
        fetch_one=True
    )
    estado_val = entrega.estado or "Entregada"
    progreso_val = entrega.progreso if entrega.progreso is not None else 100

    if existente:
        execute_query(
            """UPDATE ENTREGA
               SET fecha_entrega = %s, calificacion = %s, comentarios = %s, estado = %s, progreso = %s
               WHERE id = %s""",
            (entrega.fecha_entrega, entrega.calificacion, entrega.comentarios, estado_val, progreso_val, existente["id"]),
            commit=True
        )
        return {"message": "Entrega actualizada con éxito", "entrega_id": existente["id"]}

    query = """
        INSERT INTO ENTREGA (actividad_id, alumno_id, fecha_entrega, calificacion, comentarios, estado, progreso)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    result = execute_query(
        query,
        (entrega.actividad_id, entrega.alumno_id, entrega.fecha_entrega, entrega.calificacion, entrega.comentarios, estado_val, progreso_val),
        commit=True
    )
    return {"message": "Entrega registrada con éxito", "entrega_id": result["last_id"]}
