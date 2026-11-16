import html
from datetime import datetime
from typing import Optional
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


class EnviarResumenApoderadoRequest(BaseModel):
    alumno_id: Optional[int] = 5
    student_code: Optional[str] = "alu-102"
    profesor_usuario_id: int = 12
    actividad_titulo: Optional[str] = "Misión Conteo Mágico: Cuenta del 1 al 10 con Robot Leo"
    contenido: str


@router.post("/enviar-resumen-apoderado")
def enviar_resumen_ia_al_apoderado(payload: EnviarResumenApoderadoRequest):
    """
    Envía de forma directa un resumen pedagógico de la actividad al apoderado del alumno
    como un mensaje dentro del canal oficial de mensajería en nombre del profesor.
    """
    contenido_limpio = html.escape((payload.contenido or "").strip())
    if not contenido_limpio:
        raise HTTPException(status_code=400, detail="El contenido del resumen no puede estar vacío")

    # Determinar alumno_id y conversación con el apoderado
    alumno_id = payload.alumno_id or 5
    if payload.student_code:
        code = str(payload.student_code).strip().lower()
        if code in ("alu-103", "6", "sofia", "sofía"):
            alumno_id = 6
        elif code in ("alu-102", "5", "mateo"):
            alumno_id = 5

    # Conversación 1 corresponde a Mateo (1° Básico B) y Conversación 2 a Sofía (2° Básico A) entre Profesora (12) y Apoderada (13)
    conversacion_id = 2 if alumno_id == 6 else 1
    candidate_prof_id = payload.profesor_usuario_id or 12

    # Validar estrictamente en la BD que el remitente sea PROFESOR o ADMIN (nunca Apoderado 13 ni Alumno 14)
    profesor_id = 12
    try:
        role_row = execute_query(
            """SELECT r.nombre AS rol_nombre
               FROM USUARIO_ROL ur
               JOIN ROL r ON ur.rol_id = r.id
               WHERE ur.usuario_id = %s
               LIMIT 1""",
            (candidate_prof_id,),
            fetch_one=True
        )
        if role_row:
            rol_upper = str(role_row.get("rol_nombre") or "").upper()
            if "PROF" in rol_upper or "ADMIN" in rol_upper or "DOCENTE" in rol_upper:
                profesor_id = candidate_prof_id
    except Exception:
        profesor_id = 12

    conv_row = execute_query("SELECT id, asunto FROM CONVERSACION WHERE id = %s", (conversacion_id,), fetch_one=True)
    if not conv_row:
        any_conv = execute_query(
            """SELECT c.id, c.asunto
               FROM CONVERSACION c
               JOIN PARTICIPANTE_CONVERSACION pc ON c.id = pc.conversacion_id
               WHERE pc.usuario_id = %s
               ORDER BY c.id ASC LIMIT 1""",
            (profesor_id,),
            fetch_one=True
        )
        if any_conv:
            conversacion_id = any_conv["id"]

    ahora = datetime.now()
    ahora_str = ahora.strftime("%Y-%m-%d %H:%M:%S")
    hora_str = ahora.strftime("%H:%M")

    res_msg = execute_query(
        """INSERT INTO MENSAJE (conversacion_id, remitente_usuario_id, contenido, fecha_envio, leido)
           VALUES (%s, %s, %s, %s, FALSE)""",
        (conversacion_id, profesor_id, contenido_limpio, ahora_str),
        commit=True
    )

    # También registrar notificación rápida para el apoderado (id=13)
    try:
        titulo_notif = f"Reporte Docente: {html.escape((payload.actividad_titulo or 'Actividad Escolar')[:60])}"
        execute_query(
            """INSERT INTO NOTIFICACION (usuario_id, tipo, titulo, contenido, fecha_creacion, estado)
               VALUES (13, 'academica', %s, %s, %s, 'PENDIENTE')""",
            (titulo_notif, contenido_limpio, ahora_str),
            commit=True
        )
    except Exception:
        pass

    return {
        "success": True,
        "message": "Resumen enviado exitosamente al apoderado en Mensajería",
        "mensaje_id": res_msg["last_id"],
        "conversacion_id": conversacion_id,
        "remitente_usuario_id": profesor_id,
        "apoderado_destinatario": "Carolina Tapia Morales",
        "contenido": payload.contenido.strip(),
        "fecha_envio": ahora_str,
        "hora": hora_str
    }

