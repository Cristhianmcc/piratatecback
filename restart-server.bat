@echo off
echo ========================================
echo  Reiniciando Servidor Pirata Tecnologico
echo ========================================
echo.

echo 1. Deteniendo el servidor Node.js...
taskkill /IM node.exe /F 2>nul
if %ERRORLEVEL% EQU 0 (
  echo    [OK] Procesos Node.js detenidos.
) else (
  echo    [INFO] No se encontraron procesos Node.js en ejecucion.
)
echo.

echo 2. Verificando directorios de uploads...
if not exist "uploads" (
  mkdir uploads
  echo    [CREADO] Directorio de uploads
)

if not exist "uploads\thumbnails" (
  mkdir uploads\thumbnails
  echo    [CREADO] Directorio de thumbnails
)

if not exist "uploads\screenshots" (
  mkdir uploads\screenshots
  echo    [CREADO] Directorio de screenshots
)

if not exist "uploads\programs" (
  mkdir uploads\programs
  echo    [CREADO] Directorio de programas
)

echo    [OK] Directorios verificados.
echo.

echo 3. Limpiando cache de imagenes (opcional)...
choice /C SN /M "Desea borrar todas las imagenes en cache (S/N)?"
if %ERRORLEVEL% EQU 1 (
  echo    Eliminando archivos de cache...
  del /Q uploads\thumbnails\* 2>nul
  del /Q uploads\screenshots\* 2>nul
  echo    [OK] Cache de imagenes limpiada.
) else (
  echo    [INFO] Omitiendo limpieza de cache.
)
echo.

echo 4. Iniciando el servidor...
echo    Ejecutando: npm run dev
echo.
echo ========================================
echo  El servidor se esta iniciando...
echo  Presiona Ctrl+C para detener el servidor
echo ========================================
echo.

npm run dev
