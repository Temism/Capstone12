import html
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import execute_query

router = APIRouter(prefix="/api/mensajeria", tags=["Mensajería Escolar"])

class MensajeCreate(BaseModel):
    conversacion_id: int
    remitente_usuario_id: int
    contenido: str

@router.get("/conversaciones/usuario/{usuario_id}")
def get_conversaciones_usuario(usuario_id: int):
    """
    Lista las conversaciones activas del usuario, enriquecidas con el nombre
    y rol del interlocutor, el último mensaje y la hora para los canales.
    """
    query = """
        SELECT c.id, c.asunto, c.fecha_creacion, c.estado,
               (
                   SELECT m.contenido 
                   FROM MENSAJE m 
                   WHERE m.conversacion_id = c.id 
                   ORDER BY m.fecha_envio DESC 
                   LIMIT 1
               ) as ultimo_mensaje,
               (
                   SELECT DATE_FORMAT(m.fecha_envio, '%H:%i')
                   FROM MENSAJE m 
                   WHERE m.conversacion_id = c.id 
                   ORDER BY m.fecha_envio DESC 
                   LIMIT 1
               ) as ultima_hora,
               (
                   SELECT u.nombre
                   FROM PARTICIPANTE_CONVERSACION pc2
                   JOIN USUARIO u ON pc2.usuario_id = u.id
                   WHERE pc2.conversacion_id = c.id AND pc2.usuario_id != %s
                   LIMIT 1
               ) as otro_participante,
               (
                   SELECT r.nombre
                   FROM PARTICIPANTE_CONVERSACION pc2
                   JOIN USUARIO u ON pc2.usuario_id = u.id
                   JOIN USUARIO_ROL ur ON u.id = ur.usuario_id
                   JOIN ROL r ON ur.rol_id = r.id
                   WHERE pc2.conversacion_id = c.id AND pc2.usuario_id != %s
                   LIMIT 1
               ) as otro_rol,
               (
                   SELECT pc2.usuario_id
                   FROM PARTICIPANTE_CONVERSACION pc2
                   WHERE pc2.conversacion_id = c.id AND pc2.usuario_id != %s
                   LIMIT 1
               ) as otro_id,
               (
                   SELECT COUNT(*)
                   FROM MENSAJE m
                   WHERE m.conversacion_id = c.id 
                     AND m.remitente_usuario_id != %s
                     AND m.leido = FALSE
               ) as no_leidos
        FROM CONVERSACION c
        JOIN PARTICIPANTE_CONVERSACION pc ON c.id = pc.conversacion_id
        WHERE pc.usuario_id = %s
        ORDER BY c.id ASC
    """
    return execute_query(query, (usuario_id, usuario_id, usuario_id, usuario_id, usuario_id))

@router.get("/conversacion/{conversacion_id}/mensajes")
def get_mensajes_conversacion(conversacion_id: int):
    """Obtiene todos los mensajes cronológicos de una conversación."""
    query = """
        SELECT m.id, m.conversacion_id, m.remitente_usuario_id, u.nombre as remitente_nombre,
               m.contenido, m.fecha_envio, DATE_FORMAT(m.fecha_envio, '%H:%i') as hora, m.leido
        FROM MENSAJE m
        JOIN USUARIO u ON m.remitente_usuario_id = u.id
        WHERE m.conversacion_id = %s
        ORDER BY m.fecha_envio ASC
    """
    return execute_query(query, (conversacion_id,))

@router.post("/mensaje")
def enviar_mensaje(msg: MensajeCreate):
    """Envía un nuevo mensaje dentro de una conversación con sanitización contra inyecciones XSS."""
    contenido_limpio = html.escape(msg.contenido.strip())
    if not contenido_limpio:
        raise HTTPException(status_code=400, detail="El contenido del mensaje no puede estar vacío")
    if len(contenido_limpio) > 1000:
        raise HTTPException(status_code=400, detail="El mensaje supera el límite máximo de 1000 caracteres")

    ahora = datetime.now()
    ahora_str = ahora.strftime("%Y-%m-%d %H:%M:%S")
    hora_str = ahora.strftime("%H:%M")

    query = """
        INSERT INTO MENSAJE (conversacion_id, remitente_usuario_id, contenido, fecha_envio, leido)
        VALUES (%s, %s, %s, %s, FALSE)
    """
    result = execute_query(query, (msg.conversacion_id, msg.remitente_usuario_id, contenido_limpio, ahora_str), commit=True)
    return {
        "message": "Mensaje enviado exitosamente",
        "mensaje_id": result["last_id"],
        "conversacion_id": msg.conversacion_id,
        "remitente_usuario_id": msg.remitente_usuario_id,
        "contenido": contenido_limpio,
        "fecha_envio": ahora_str,
        "hora": hora_str
    }
