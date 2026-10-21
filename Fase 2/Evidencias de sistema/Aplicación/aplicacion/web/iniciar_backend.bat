@echo off
title Servidor EDUCONNECT API - FastAPI
echo Swagger UI disponible en: http://localhost:8000/docs
echo API Base URL en:         http://localhost:8000/api
echo.
cd /d "%~dp0backend"
set PYTHON_PATH=%LOCALAPPDATA%\Programs\Python\Python312\python.exe

if exist "%PYTHON_PATH%" (
    "%PYTHON_PATH%" -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
) else (
    python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
)
pause
