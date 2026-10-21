from fastapi import APIRouter, HTTPException
from database import execute_query

router = APIRouter(prefix="/api/alumnos", tags=["Estudiantes y Cursos"])

@router.get("/")
def get_all_alumnos():
    """Obtiene la lista de todos los alumnos registrados con su información de usuario."""
    query = """
        SELECT a.id as alumno_id, a.usuario_id, u.nombre, u.email, a.fecha_nacimiento
        FROM ALUMNO a
        JOIN USUARIO u ON a.usuario_id = u.id
        ORDER BY a.id ASC
    """
    return execute_query(query)

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
