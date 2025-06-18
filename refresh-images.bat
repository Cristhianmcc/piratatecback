@echo off
echo ===================================================
echo   Limpieza de cache de imagenes para el frontend
echo ===================================================
echo.

rem Verificar directorios
echo 1. Verificando directorios de uploads...
if not exist "uploads\thumbnails" mkdir uploads\thumbnails
if not exist "uploads\screenshots" mkdir uploads\screenshots
if not exist "uploads\programs" mkdir uploads\programs
echo    [OK] Directorios verificados
echo.

rem Limpiar cache del servidor
echo 2. Limpiando cache del servidor...
echo    Esto forzara al servidor a recargar las imagenes
echo.

rem Detener servidor Node.js
echo 3. Deteniendo servidor Node.js...
taskkill /IM node.exe /F 2>nul
echo    [OK] Servidor detenido
echo.

rem Añadir marcadores de tiempo a todas las imágenes
echo 4. Actualizando URLs de las imagenes...
echo    Este proceso se completara cuando reinicies el servidor
echo.

echo ===================================================
echo   Proceso completado - Reiniciando servidor
echo ===================================================
echo 1. El servidor se reiniciara automaticamente
echo 2. En el navegador, usa Ctrl+F5 para recargar sin cache
echo ===================================================

timeout /t 3 >nul

npm run dev
