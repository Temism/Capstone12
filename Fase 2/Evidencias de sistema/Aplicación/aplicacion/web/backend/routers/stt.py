import os
import httpx
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional

router = APIRouter(prefix="/api/stt", tags=["Reconocimiento de Voz STT"])

DEEPGRAM_API_URL = "https://api.deepgram.com/v1/listen"

def get_deepgram_config():
    """Obtiene la configuracion de Deepgram de forma segura desde variables de entorno o archivo dedicado."""
    api_key = os.getenv("DEEPGRAM_API_KEY", "").strip()
    if not api_key or api_key == "tu_deepgram_api_key_aqui":
        # Revisar si el usuario ingreso la clave en backend/deepgram_api_key.txt
        key_file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "deepgram_api_key.txt")
        if os.path.exists(key_file_path):
            try:
                with open(key_file_path, "r", encoding="utf-8") as kf:
                    for line in kf:
                        clean_line = line.strip()
                        if clean_line and not clean_line.startswith("#") and clean_line != "PEGA_AQUI_TU_API_KEY" and clean_line != "tu_deepgram_api_key_aqui":
                            api_key = clean_line
                            break
            except Exception:
                pass

    model = os.getenv("DEEPGRAM_MODEL", "nova-2").strip()
    language = os.getenv("DEEPGRAM_LANGUAGE", "es").strip()
    is_configured = bool(api_key and api_key != "tu_deepgram_api_key_aqui" and api_key != "PEGA_AQUI_TU_API_KEY")
    return {
        "api_key": api_key,
        "model": model,
        "language": language,
        "is_configured": is_configured
    }

@router.get("/status")
def get_stt_status():
    """
    Informa el estado del servicio STT sin exponer nunca la clave de la API.
    Cumple los estándares mínimos de seguridad de no divulgación de credenciales.
    """
    config = get_deepgram_config()
    return {
        "provider": "Deepgram",
        "configured": config["is_configured"],
        "model": config["model"],
        "language": config["language"],
        "status": "ready" if config["is_configured"] else "pending_api_key",
        "message": (
            "Servicio STT listo y autenticado mediante servidor seguro."
            if config["is_configured"]
            else "Falta configurar tu DEEPGRAM_API_KEY en el archivo backend/.env."
        )
    }

@router.post("/transcribir")
async def transcribir_audio(
    audio: UploadFile = File(...),
    language: Optional[str] = Form(None)
):
    """
    Recibe un blob o archivo de audio desde el micrófono del frontend,
    adjunta la clave de Deepgram de forma segura en el servidor,
    y retorna la transcripción textual al cliente.
    """
    config = get_deepgram_config()

    if not config["is_configured"]:
        raise HTTPException(
            status_code=503,
            detail="El servicio STT de Deepgram no está configurado. Agrega tu API Key en backend/.env."
        )

    # Leer bytes del audio
    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="El archivo de audio está vacío.")

    target_language = language or config["language"]
    target_model = config["model"]

    # Parámetros optimizados para español escolar (1° y 2° básico)
    params = {
        "model": target_model,
        "language": target_language,
        "smart_format": "true",
        "punctuate": "true"
    }

    content_type = audio.content_type or "audio/webm"

    headers = {
        "Authorization": f"Token {config['api_key']}",
        "Content-Type": content_type
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                DEEPGRAM_API_URL,
                params=params,
                headers=headers,
                content=audio_bytes
            )

        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Error en Deepgram API: {response.text}"
            )

        data = response.json()
        
        # Extraer transcripción más probable
        channels = data.get("results", {}).get("channels", [])
        transcript = ""
        confidence = 0.0

        if channels and len(channels) > 0:
            alternatives = channels[0].get("alternatives", [])
            if alternatives and len(alternatives) > 0:
                transcript = alternatives[0].get("transcript", "").strip()
                confidence = round(alternatives[0].get("confidence", 0.0), 3)

        return {
            "success": True,
            "transcript": transcript,
            "transcripcion": transcript,
            "confidence": confidence,
            "confianza": confidence,
            "model": target_model,
            "language": target_language,
            "provider": "Deepgram"
        }

    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Fallo de conexión hacia los servidores de Deepgram: {str(exc)}"
        )
