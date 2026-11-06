import os
import hashlib
import urllib.parse
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

async def generate_edge_tts_fallback(clean_text: str) -> Optional[bytes]:
    """Sintetiza voz masculina natural en español chileno (LorenzoNeural) cuando ElevenLabs no tiene cuota activa."""
    try:
        import edge_tts
        communicate = edge_tts.Communicate(clean_text, "es-CL-LorenzoNeural", rate="-5%", pitch="-2Hz")
        audio_chunks = []
        async for chunk in communicate.stream():
            if chunk.get("type") == "audio" and chunk.get("data"):
                audio_chunks.append(chunk["data"])
        if audio_chunks:
            return b"".join(audio_chunks)
    except Exception as e:
        print(f"[TTS Edge Neural Warning]: {e}")

    try:
        chunks = []
        raw_parts = [p.strip() for p in clean_text.replace("!", "!|").replace("?", "?|").replace(".", ".|").split("|") if p.strip()]
        if not raw_parts:
            raw_parts = [clean_text[:190]]
        current = ""
        for part in raw_parts:
            if len(current) + len(part) + 1 <= 185:
                current = f"{current} {part}".strip()
            else:
                if current:
                    chunks.append(current)
                current = part[:185]
        if current:
            chunks.append(current)

        audio_parts = []
        async with httpx.AsyncClient(timeout=15.0) as client:
            for ch in chunks:
                encoded = urllib.parse.quote(ch)
                g_url = f"https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=es&q={encoded}"
                r = await client.get(g_url, headers={"User-Agent": "Mozilla/5.0"})
                if r.status_code == 200 and r.content:
                    audio_parts.append(r.content)
        if audio_parts:
            return b"".join(audio_parts)
    except Exception as e:
        print(f"[TTS Fallback Error]: {e}")
    return None

async def generate_tts_audio(text: str, voice_id: Optional[str] = None) -> bytes:
    """Genera el audio en MP3 mediante ElevenLabs, con cache local y fallback inteligente."""
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

    api_key = get_elevenlabs_api_key()

    # 2. Consultar ElevenLabs API si existe clave
    if api_key:
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
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.post(url, headers=headers, json=payload)

                if resp.status_code == 402 and target_voice != FALLBACK_VOICE_ID:
                    fallback_cache = get_cache_file_path(clean_text, FALLBACK_VOICE_ID)
                    if os.path.exists(fallback_cache):
                        with open(fallback_cache, "rb") as fcf:
                            return fcf.read()

                    fallback_url = f"{ELEVENLABS_API_URL}/{FALLBACK_VOICE_ID}"
                    resp = await client.post(fallback_url, headers=headers, json=payload)

                if resp.status_code == 200 and resp.content:
                    audio_bytes = resp.content
                    try:
                        with open(cache_path, "wb") as cf:
                            cf.write(audio_bytes)
                    except Exception as e:
                        print(f"[TTS Cache Error]: {e}")
                    return audio_bytes
        except Exception as e:
            print(f"[TTS ElevenLabs Warning]: {e}")

    # 3. Fallback automatico y transparente con sintesis neuronal masculina en español
    fallback_bytes = await generate_edge_tts_fallback(clean_text)
    if fallback_bytes:
        try:
            with open(cache_path, "wb") as cf:
                cf.write(fallback_bytes)
        except Exception:
            pass
        return fallback_bytes

    raise HTTPException(
        status_code=503,
        detail="No fue posible sintetizar el audio en este momento."
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
