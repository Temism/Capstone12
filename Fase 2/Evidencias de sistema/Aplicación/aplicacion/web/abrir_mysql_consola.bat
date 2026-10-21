@echo off
title Consola MySQL - plataforma_educativa
echo Conectando a la base de datos local plataforma_educativa...
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -u root -p --default-character-set=utf8mb4 plataforma_educativa
pause
