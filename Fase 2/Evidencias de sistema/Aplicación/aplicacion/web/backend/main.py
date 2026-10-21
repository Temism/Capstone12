import os
import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from database import check_db_health, DB_HOST, DB_PORT, DB_NAME
from routers import auth, alumnos, actividades, calificaciones, mensajeria, alertas, stt, tts, ia_evaluador

app = FastAPI(
    title="EDUCONNECT API - Plataforma Educativa",
    description="Backend oficial en Python (FastAPI) conectado a MySQL para el sistema escolar 1° y 2° Básico.",
    version="1.0.0"
)

# Configuración de CORS segura para clientes web (Escritorio y Móvil)
cors_origins_env = os.getenv("CORS_ORIGINS", "*")
origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()] if cors_origins_env != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Middleware para inyección de cabeceras de seguridad HTTP
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

# Registrar Routers de la aplicacion
app.include_router(auth.router)
app.include_router(alumnos.router)
app.include_router(actividades.router)
app.include_router(calificaciones.router)
app.include_router(mensajeria.router)
app.include_router(alertas.router)
app.include_router(stt.router)
app.include_router(tts.router)
app.include_router(ia_evaluador.router)

# Servir archivos estaticos del frontend para pruebas locales con soporte completo de microfono
from fastapi.staticfiles import StaticFiles
frontend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if os.path.exists(os.path.join(frontend_dir, "index.html")):
    app.mount("/app", StaticFiles(directory=frontend_dir, html=True), name="frontend")


@app.get("/")
def root():
    """Ruta raíz de bienvenida e información del servidor."""
    db_ok = check_db_health()
    return {
        "sistema": "EDUCONNECT API",
        "version": "1.0.0",
        "estado": "ONLINE",
        "seguridad": "JWT + Bcrypt + CORS + Security Headers",
        "mysql_status": "CONECTADO" if db_ok else "DESCONECTADO (Verificar servicio MySQL local)",
        "mysql_host": f"{DB_HOST}:{DB_PORT}",
        "mysql_database": DB_NAME,
        "docs_url": "http://localhost:8000/docs"
    }

@app.get("/api/health")
def health_check():
    """Endpoint de comprobación de salud para el frontend."""
    db_ok = check_db_health()
    return {
        "status": "healthy" if db_ok else "degraded",
        "database_connected": db_ok,
        "database_name": DB_NAME,
        "environment": "production-ready"
    }

if __name__ == "__main__":
    print("[SERVER] Iniciando servidor FastAPI en http://localhost:8000")
    print("[DOCS] Documentación interactiva Swagger disponible en http://localhost:8000/docs")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
