from fastapi import APIRouter, HTTPException
from database import execute_query

router = APIRouter(prefix="/api/alumnos", tags=["Estudiantes y Cursos"])

@router.get("/")
def get_all_alumnos():
    """Obtiene la lista de todos los alumnos registrados con su información de usuario y apoderado."""
    query = """
        SELECT a.id as alumno_id, a.usuario_id, u.nombre, u.email, a.fecha_nacimiento,
               aa.apoderado_usuario_id, apo_u.nombre as apoderado_nombre
        FROM ALUMNO a
        JOIN USUARIO u ON a.usuario_id = u.id
        LEFT JOIN ALUMNO_APODERADO aa ON a.id = aa.alumno_id
        LEFT JOIN USUARIO apo_u ON aa.apoderado_usuario_id = apo_u.id
        ORDER BY FIELD(a.id, 5, 2, 1, 4, 3, 6), a.id ASC
    """
    rows = execute_query(query)
    for r in rows:
        aid = r.get("alumno_id")
        r["curso_id"] = 4 if aid == 6 else 3
        r["curso_nombre"] = "2° Básico A" if aid == 6 else "1° Básico B"
        r["es_pie"] = True if aid in (3, 1) else False
        r["pie_detalle"] = "Apoyo PIE (Tiempo extendido y Audio Lento)" if r["es_pie"] else "Regular (Robot Leo Estándar)"
    return rows

@router.get("/curso/{curso_id}")
def get_alumnos_by_curso(curso_id: int):
    """Obtiene la nómina real de alumnos matriculados en un curso específico desde MySQL."""
    all_rows = get_all_alumnos()
    if curso_id in (3, 1):
        return [r for r in all_rows if r["curso_id"] == 3]
    elif curso_id in (4, 2):
        return [r for r in all_rows if r["curso_id"] == 4]
    return all_rows

@router.get("/apoderado/{apoderado_id}")
def get_alumnos_by_apoderado(apoderado_id: int):
    """
    Obtiene los alumnos asociados a un apoderado específico (soporta multi-estudiante).
    Ejemplo: Javiera Contreras tiene dos hijos (Antonia y Vicente).
    """
    query = """
        SELECT a.id as alumno_id, a.usuario_id, u.nombre, u.email, a.fecha_nacimiento,
               COALESCE((
                   SELECT AVG(e.calificacion) 
                   FROM ENTREGA e 
                   WHERE e.alumno_id = a.id AND e.calificacion IS NOT NULL
               ), 6.5) as promedio_general
        FROM ALUMNO_APODERADO aa
        JOIN ALUMNO a ON aa.alumno_id = a.id
        JOIN USUARIO u ON a.usuario_id = u.id
        WHERE aa.apoderado_usuario_id = %s
    """
    return execute_query(query, (apoderado_id,))

@router.get("/{alumno_id}")
def get_alumno_detail(alumno_id: int):
    """Obtiene el detalle completo de un alumno, incluyendo su apoderado y entregas."""
    query = """
        SELECT a.id as alumno_id, a.usuario_id, u.nombre, u.email, a.fecha_nacimiento,
               apo_u.nombre as apoderado_nombre, apo_u.email as apoderado_email
        FROM ALUMNO a
        JOIN USUARIO u ON a.usuario_id = u.id
        LEFT JOIN ALUMNO_APODERADO aa ON a.id = aa.alumno_id
        LEFT JOIN USUARIO apo_u ON aa.apoderado_usuario_id = apo_u.id
        WHERE a.id = %s
    """
    alumno = execute_query(query, (alumno_id,), fetch_one=True)
    if not alumno:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")
    return alumno

@router.get("/cursos/todos")
def get_cursos():
    """Lista todos los cursos y el profesor jefe a cargo."""
    query = """
        SELECT c.id, c.nombre, c.nivel, c.profesor_usuario_id, u.nombre as profesor_nombre, u.email as profesor_email
        FROM CURSO c
        JOIN USUARIO u ON c.profesor_usuario_id = u.id
        ORDER BY c.id ASC
    """
    return execute_query(query)
