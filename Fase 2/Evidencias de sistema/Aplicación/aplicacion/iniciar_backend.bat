@echo off
title EduConnect - Servidor Backend FastAPI
cd /d "%~dp0web\backend"

echo ========================================================
echo        EDUCONNECT - PLATAFORMA EDUCATIVA BACKEND
echo ========================================================
echo  Directorio de trabajo: %CD%
echo  Host: 0.0.0.0 (accesible localmente y por red Wi-Fi)
echo  Puerto: 8000
echo  Documentacion interactiva Swagger: http://localhost:8000/docs
echo ========================================================
echo.

python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] No se pudo iniciar el servidor.
    echo Asegurate de tener Python instalado y las dependencias de requirements.txt instaladas:
    echo    pip install -r requirements.txt
    echo.
    pause
)
