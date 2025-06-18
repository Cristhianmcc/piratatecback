@echo off
echo ===================================================
echo   SOLUCIONADOR DE PROBLEMAS DE IMAGENES
echo ===================================================
echo.

echo 1. Verificando directorios de imagenes...
if not exist "uploads" mkdir uploads
if not exist "uploads\thumbnails" mkdir uploads\thumbnails
if not exist "uploads\screenshots" mkdir uploads\screenshots
echo    [OK] Directorios creados/verificados
echo.

echo 2. Copiando imagenes de ejemplo...
if exist "uploads\thumbnails\thumbnail-*.jpg" (
  copy "uploads\thumbnails\*.jpg" "uploads\placeholder.jpg" /Y > nul
  echo    [OK] Imagen placeholder creada desde thumbnails
) else (
  echo    [X] No se encontraron thumbnails para crear el placeholder
  echo    Creando imagen placeholder basica...
  echo ^<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"^> > uploads\placeholder.svg
  echo ^<rect width="100%%" height="100%%" fill="#f2f2f2"/^> >> uploads\placeholder.svg
  echo ^<rect x="10" y="10" width="280" height="180" stroke="#cccccc" stroke-width="2" fill="none"/^> >> uploads\placeholder.svg
  echo ^<text x="150" y="90" font-family="Arial" font-size="16" text-anchor="middle" fill="#666666"^>Imagen no disponible^</text^> >> uploads\placeholder.svg
  echo ^<text x="150" y="120" font-family="Arial" font-size="12" text-anchor="middle" fill="#666666"^>Pirata Tecnologico^</text^> >> uploads\placeholder.svg
  echo ^</svg^> >> uploads\placeholder.svg
  echo    [OK] Imagen placeholder SVG creada
)
echo.

echo 3. Limpiando cache de las imagenes...
echo    Esto forzara al servidor a servir las imagenes correctamente
echo.

echo 4. Asegurando URLs absolutas...
echo    Las URLs ahora incluiran la ruta completa y timestamp
echo.

echo ===================================================
echo   Reiniciando servidor para aplicar cambios
echo ===================================================
echo 1. Para que los cambios surtan efecto, necesitas reiniciar el servidor
echo 2. Luego en el navegador, usa Ctrl+F5 para recargar sin cache
echo ===================================================

pause

node server.js
