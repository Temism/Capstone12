from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from database import execute_query

router = APIRouter(prefix="/api/alertas", tags=["Alertas y Notificaciones"])

class NotificacionCreate(BaseModel):
    usuario_id: int
    tipo: str  # 'calificacion', 'plazo_proximo', 'nueva_tarea', 'urgente'
    titulo: str
    contenido: Optional[str] = None

@router.get("/usuario/{usuario_id}")
def get_alertas_usuario(usuario_id: int):
    """Obtiene las alertas y notificaciones dirigidas a un usuario."""
    query = """
        SELECT id, usuario_id, tipo, titulo, contenido, fecha_creacion, fecha_lectura, estado
        FROM NOTIFICACION
        WHERE usuario_id = %s
        ORDER BY fecha_creacion DESC
    """
    return execute_query(query, (usuario_id,))

@router.put("/{notificacion_id}/leer")
def marcar_alerta_leida(notificacion_id: int):
    """Marca una alerta o notificación como leída."""
    ahora = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    query = """
        UPDATE NOTIFICACION
        SET estado = 'LEIDA', fecha_lectura = %s
        WHERE id = %s
    """
    result = execute_query(query, (ahora, notificacion_id), commit=True)
    if result["affected_rows"] == 0:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    return {"message": "Notificación marcada como leída"}

@router.post("/")
def crear_alerta(alerta: NotificacionCreate):
    """Emite una nueva alerta o notificación a un usuario."""
    ahora = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    query = """
        INSERT INTO NOTIFICACION (usuario_id, tipo, titulo, contenido, fecha_creacion, estado)
        VALUES (%s, %s, %s, %s, %s, 'PENDIENTE')
    """
    result = execute_query(query, (alerta.usuario_id, alerta.tipo, alerta.titulo, alerta.contenido, ahora), commit=True)
    return {"message": "Alerta creada exitosamente", "alerta_id": result["last_id"]}
