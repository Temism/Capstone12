import os
import hashlib
import httpx
from fastapi import APIRouter, HTTPException, Query, Response
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/tts", tags=["Sintesis de Voz TTS"])

ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech"
DEFAULT_VOICE_ID = "IKne3meq5aSn9XLyUdCD"  # Voz activa funcional (Plan Free compatible; ID original Leo: ihKwLOjVUMG4lgUI6meZ)
FALLBACK_VOICE_ID = "IKne3meq5aSn9XLyUdCD"

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE_DIR = os.path.join(BASE_DIR, "audio_cache")
os.makedirs(CACHE_DIR, exist_ok=True)

class TTSRequest(BaseModel):
    text: str
    voice_id: Optional[str] = None

def get_elevenlabs_api_key() -> str:
    """Lee la clave de ElevenLabs desde variable de entorno o desde elevenlabs_secret.txt de forma segura."""
    api_key = os.getenv("ELEVENLABS_API_KEY", "").strip()
    if not api_key:
        secret_path = os.path.join(BASE_DIR, "elevenlabs_secret.txt")
        if os.path.exists(secret_path):
            try:
                with open(secret_path, "r", encoding="utf-8") as f:
                    for line in f:
                        clean = line.strip()
                        if clean and not clean.startswith("#"):
                            api_key = clean
                            break
            except Exception as e:
                print(f"[TTS] Error leyendo elevenlabs_secret.txt: {e}")
    return api_key

def get_cache_file_path(text: str, voice_id: str) -> str:
    """Genera una ruta de archivo unico en cache para ahorrar caracteres y asegurar latencia cero."""
    key = f"{voice_id}_{text.strip()}"
    digest = hashlib.sha256(key.encode("utf-8")).hexdigest()
    return os.path.join(CACHE_DIR, f"{digest}.mp3")

@router.get("/status")
def get_tts_status():
    """Informa si el servicio de voz de Robot Leo esta listo."""
    api_key = get_elevenlabs_api_key()
    configured = bool(api_key and len(api_key) > 10)
    return {
        "status": "ready" if configured else "pending_key",
        "configured": configured,
        "voice_character": "Robot Leo",
        "voice_id": DEFAULT_VOICE_ID
    }

async def generate_tts_audio(text: str, voice_id: Optional[str] = None) -> bytes:
    """Genera el audio en MP3 mediante ElevenLabs, con cache local y fallback inteligente."""
    api_key = get_elevenlabs_api_key()
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="Servicio de voz no configurado. Verifica el archivo elevenlabs_secret.txt."
        )

    target_voice = (voice_id or DEFAULT_VOICE_ID).strip()
    clean_text = text.strip()
    if not clean_text:
        raise HTTPException(status_code=400, detail="El texto a sintetizar no puede estar vacio.")

    # 1. Revisar cache en disco
    cache_path = get_cache_file_path(clean_text, target_voice)
    if os.path.exists(cache_path):
        try:
            with open(cache_path, "rb") as cf:
                return cf.read()
        except Exception:
            pass

    # 2. Consultar ElevenLabs API
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg"
    }

    payload = {
        "text": clean_text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.8
        }
    }

    url = f"{ELEVENLABS_API_URL}/{target_voice}"

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, headers=headers, json=payload)

            # Si ElevenLabs requiere plan de pago para la voz de libreria compartida,
            # utilizar la voz premade asignada para que la experiencia del nino nunca falle
            if resp.status_code == 402 and target_voice != FALLBACK_VOICE_ID:
                print(f"[TTS] Voz de libreria requiere plan de pago en ElevenLabs. Aplicando voz optimizada de respaldo.")
                fallback_cache = get_cache_file_path(clean_text, FALLBACK_VOICE_ID)
                if os.path.exists(fallback_cache):
                    with open(fallback_cache, "rb") as fcf:
                        return fcf.read()

                fallback_url = f"{ELEVENLABS_API_URL}/{FALLBACK_VOICE_ID}"
                resp = await client.post(fallback_url, headers=headers, json=payload)
                if resp.status_code == 200:
                    audio_bytes = resp.content
                    try:
                        with open(fallback_cache, "wb") as fcf:
                            fcf.write(audio_bytes)
                    except Exception:
                        pass
                    return audio_bytes

            if resp.status_code != 200:
                raise HTTPException(
                    status_code=resp.status_code,
                    detail=f"Error en servicio de voz: {resp.text}"
                )

            audio_bytes = resp.content

            # Guardar en cache para reutilizacion instantanea
            try:
                with open(cache_path, "wb") as cf:
                    cf.write(audio_bytes)
            except Exception as e:
                print(f"[TTS Cache Error]: {e}")

            return audio_bytes

    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Fallo de conexion con el servicio de voz: {str(exc)}"
        )

@router.get("/hablar")
async def hablar_get(text: str = Query(..., min_length=1, max_length=1000), voice_id: Optional[str] = None):
    """Endpoint GET para reproducir audio directamente en etiquetas o llamadas web."""
    audio_bytes = await generate_tts_audio(text, voice_id)
    return Response(content=audio_bytes, media_type="audio/mpeg")

@router.post("/hablar")
async def hablar_post(req: TTSRequest):
    """Endpoint POST para generar audio a partir de texto."""
    audio_bytes = await generate_tts_audio(req.text, req.voice_id)
    return Response(content=audio_bytes, media_type="audio/mpeg")
