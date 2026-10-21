import os
import json
import unicodedata
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional, List

try:
    from google import genai
except ImportError:
    genai = None

router = APIRouter(prefix="/api/ia", tags=["Evaluador Pedagógico con IA"])


class ResultadoBooleanoIA(BaseModel):
    es_correcto: bool = Field(
        description="True si la respuesta hablada por el estudiante de 1° Básico responde correctamente al sentido de la pregunta según el cuento; False en caso contrario."
    )
    retroalimentacion: str = Field(
        description="Breve frase cálida, alentadora y sin tecnicismos (máximo 20 palabras) que el narrador leerá en voz alta al niño o niña."
    )


class EvaluarRespuestaRequest(BaseModel):
    actividad_codigo: Optional[str] = "act-len-2"
    pregunta_numero: int = 1
    relato_contexto: str
    pregunta: str
    criterio_correcto: str
    palabras_clave_respaldo: Optional[List[str]] = None
    transcripcion_alumno: str


def _normalize_text(text: str) -> str:
    if not text:
        return ""
    norm = unicodedata.normalize("NFD", text.lower().strip())
    return "".join(c for c in norm if unicodedata.category(c) != "Mn")


def get_gemini_config():
    """Obtiene la API Key de Gemini desde variable de entorno o backend/gemini_api_key.txt."""
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    placeholders = {"", "pega_aqui_tu_api_key", "tu_gemini_api_key_aqui"}

    if api_key.lower() in placeholders:
        key_file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "gemini_api_key.txt")
        if os.path.exists(key_file_path):
            try:
                with open(key_file_path, "r", encoding="utf-8") as kf:
                    for line in kf:
                        clean_line = line.strip()
                        if clean_line and not clean_line.startswith("#") and clean_line.lower() not in placeholders:
                            api_key = clean_line
                            break
            except Exception:
                pass

    is_configured = bool(api_key and api_key.lower() not in placeholders)
    return {
        "api_key": api_key,
        "model": "gemini-3.8-flash",
        "is_configured": is_configured,
    }


def evaluar_respuesta_respaldo_semantico(payload: EvaluarRespuestaRequest) -> ResultadoBooleanoIA:
    """
    Evaluador semántico pedagógico determinista para 1° Básico cuando aún no se ha pegado
    la API Key en backend/gemini_api_key.txt o se excede la cuota gratuita.
    Garantiza siempre el retorno del booleano `es_correcto`.
    """
    spoken = _normalize_text(payload.transcripcion_alumno)
    if not spoken or len(spoken) < 2:
        return ResultadoBooleanoIA(
            es_correcto=False,
            retroalimentacion="No logré escuchar bien tu respuesta. Presiona el micrófono y cuéntame con voz fuerte y clara."
        )

    # Palabras clave definidas en la pregunta o por número de pregunta del cuento La Zorra y las Uvas
    keywords = [_normalize_text(k) for k in (payload.palabras_clave_respaldo or []) if k]

    if not keywords:
        if payload.pregunta_numero == 1:
            keywords = ["uva", "uvas", "racimo", "morada", "moradas"]
        elif payload.pregunta_numero == 2:
            keywords = ["alta", "altas", "alto", "arriba", "lejos", "alcanzaba", "alcanzar", "llegaba", "llegar"]
        elif payload.pregunta_numero == 3:
            keywords = ["verde", "verdes", "madura", "maduras", "no las como", "no queria", "acida", "acidas"]
        else:
            criterio_words = [w for w in _normalize_text(payload.criterio_correcto).split() if len(w) >= 4]
            keywords = criterio_words

    es_correcto = any(kw in spoken for kw in keywords)

    if es_correcto:
        mensajes_exito = {
            1: "Excelente respuesta. La zorra quería comer las deliciosas uvas moradas del bosque.",
            2: "Muy bien dicho. Las uvas estaban demasiado altas en la rama y por eso no las alcanzó.",
            3: "Extraordinario. La zorra dijo que estaban verdes cuando se cansó de saltar.",
        }
        return ResultadoBooleanoIA(
            es_correcto=True,
            retroalimentacion=mensajes_exito.get(
                payload.pregunta_numero,
                "Muy bien, tu respuesta sobre el cuento es totalmente correcta."
            ),
        )
    else:
        pistas = {
            1: "Escucha otra vez esa parte: era una fruta pequeña y morada que crecía en un racimo. Inténtalo de nuevo.",
            2: "Piensa en dónde colgaban las uvas: la zorra saltaba mucho porque estaban muy arriba. Dilo con tus palabras.",
            3: "Recuerda qué color dijo la zorra al final para consolarse antes de irse. Vuelve a intentarlo.",
        }
        return ResultadoBooleanoIA(
            es_correcto=False,
            retroalimentacion=pistas.get(
                payload.pregunta_numero,
                "Casi lo tienes. Recuerda lo que pasó en la historia y vuelve a responder con tu voz."
            ),
        )


@router.get("/status")
def get_ia_status():
    """Verifica el estado de configuración del evaluador con IA sin exponer credenciales."""
    cfg = get_gemini_config()
    return {
        "configured": cfg["is_configured"],
        "model": cfg["model"],
        "sdk_installed": genai is not None,
        "status": "ready" if cfg["is_configured"] else "fallback_active",
    }


@router.post("/evaluar-respuesta")
def evaluar_respuesta_comprension(payload: EvaluarRespuestaRequest):
    """
    Evalúa la respuesta hablada de un estudiante de 1° Básico (LE01 OA 18 - Comprensión Oral)
    utilizando Gemini (gemini-3.8-flash con google-genai y JSON Schema) y retorna un booleano `es_correcto`.
    """
    spoken_clean = (payload.transcripcion_alumno or "").strip()
    if not spoken_clean:
        return {
            "success": True,
            "es_correcto": False,
            "retroalimentacion": "No escuchamos tu respuesta. Presiona el micrófono y cuéntanos con tu voz.",
            "transcripcion_evaluada": "",
        }

    cfg = get_gemini_config()

    if cfg["is_configured"] and genai is not None:
        prompt = (
            "Eres un evaluador pedagógico experto en 1° Básico de Chile (6 a 7 años), "
            "evaluando el Objetivo de Aprendizaje LE01 OA 18 (Comprensión Oral de relatos).\n"
            f"Relato escuchado por el estudiante: \"{payload.relato_contexto}\"\n"
            f"Pregunta formulada: \"{payload.pregunta}\"\n"
            f"Criterio de respuesta correcta esperada: \"{payload.criterio_correcto}\"\n"
            f"Transcripción de lo que respondió el niño o niña por micrófono: \"{spoken_clean}\"\n\n"
            "Instrucciones de evaluación:\n"
            "1. Los niños de 6 años responden con frases cortas, lenguaje cotidiano o sinónimos sencillos. "
            "Sé flexible con errores menores de transcripción fonética si la idea central coincide con el criterio esperado.\n"
            "2. Devuelve `es_correcto: true` si la respuesta demuestra comprensión de la pregunta según el relato, "
            "o `es_correcto: false` si es incorrecta o no responde a la pregunta.\n"
            "3. En `retroalimentacion`, redacta una frase breve, afectuosa y motivadora en español chileno neutro "
            "(máximo 20 palabras, sin emojis ni términos técnicos) dirigida directamente al niño o niña."
        )

        try:
            client = genai.Client(api_key=cfg["api_key"])
            interaction = client.interactions.create(
                model="gemini-3.8-flash",
                input=prompt,
                response_format={
                    "type": "text",
                    "mime_type": "application/json",
                    "schema": ResultadoBooleanoIA.model_json_schema(),
                },
            )
            resultado = ResultadoBooleanoIA.model_validate_json(interaction.output_text)
            return {
                "success": True,
                "es_correcto": bool(resultado.es_correcto),
                "retroalimentacion": resultado.retroalimentacion.strip(),
                "transcripcion_evaluada": spoken_clean,
            }
        except Exception as e:
            print(f"[IA EVALUADOR] Aviso al invocar Gemini interactions API ({e}), aplicando evaluador de respaldo.")

    # Evaluador semántico de respaldo (cuando aún no se pega la API Key o no hay cuota disponible)
    respaldo = evaluar_respuesta_respaldo_semantico(payload)
    return {
        "success": True,
        "es_correcto": bool(respaldo.es_correcto),
        "retroalimentacion": respaldo.retroalimentacion,
        "transcripcion_evaluada": spoken_clean,
    }
