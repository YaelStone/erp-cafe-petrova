@echo off
rem Levanta todo el ERP Cafe Petrova Line con doble clic:
rem MySQL de XAMPP, backend (3200), frontend (4200) y abre el navegador.
cd /D %~dp0
title ERP Cafe Petrova Line

echo.
echo  ===  ERP CAFE PETROVA LINE  ===
echo.

rem 1. MySQL (solo si no esta prendido)
netstat -ano | findstr ":3306 " | findstr "LISTENING" >nul
if errorlevel 1 (
  echo [1/3] Prendiendo MySQL de XAMPP...
  start "MySQL - no cerrar" /min C:\xampp\mysql_start.bat
  timeout /t 6 /nobreak >nul
) else (
  echo [1/3] MySQL ya estaba prendido.
)

rem 2. Backend
netstat -ano | findstr ":3200 " | findstr "LISTENING" >nul
if errorlevel 1 (
  echo [2/3] Prendiendo backend en http://localhost:3200 ...
  start "Backend - no cerrar" cmd /k "cd /D %~dp0backend && node server.js"
  timeout /t 3 /nobreak >nul
) else (
  echo [2/3] El backend ya estaba prendido.
)

rem 3. Frontend
netstat -ano | findstr ":4200 " | findstr "LISTENING" >nul
if errorlevel 1 (
  echo [3/3] Prendiendo frontend en http://localhost:4200 ...
  start "Frontend - no cerrar" cmd /k "cd /D %~dp0frontend && npx ng serve"
  echo       Esperando a que compile Angular...
  timeout /t 25 /nobreak >nul
) else (
  echo [3/3] El frontend ya estaba prendido.
)

start http://localhost:4200
echo.
echo  Listo. Usuario: comandante@petrova.com   Contrasena: petrova123
echo  Para apagar todo, cierra las ventanas "Backend", "Frontend" y "MySQL".
echo.
pause
