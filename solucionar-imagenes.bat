@echo off
echo ===================================================
echo  SOLUCION PARA IMAGENES EN BLANCO
echo ===================================================
echo.

echo Esta herramienta intentara solucionar el problema de imagenes
echo que no se muestran correctamente en el frontend.
echo.

echo 1. Deteniendo el servidor...
taskkill /IM node.exe /F 2>nul
echo    [OK] Servidor detenido
echo.

echo 2. Limpiando cache...
echo    Esto eliminara archivos temporales que pueden estar causando problemas
del /Q %TEMP%\node-* 2>nul
echo    [OK] Cache limpiada
echo.

echo 3. Verificando archivos de imagen...
if not exist uploads\thumbnails\*.* (
  echo    [AVISO] No hay imagenes en la carpeta thumbnails
) else (
  echo    [OK] Imagenes de thumbnails encontradas
)

if not exist uploads\screenshots\*.* (
  echo    [AVISO] No hay imagenes en la carpeta screenshots
) else (
  echo    [OK] Imagenes de screenshots encontradas
)
echo.

echo 4. Corrigiendo permisos de archivos...
icacls uploads /grant Everyone:(OI)(CI)RX /T
echo    [OK] Permisos corregidos
echo.

echo 5. Creando imagen de prueba...
echo ^<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"^> > uploads\test.svg
echo ^<rect width="100%%" height="100%%" fill="#f2f2f2"/^> >> uploads\test.svg
echo ^<rect x="10" y="10" width="280" height="180" stroke="#cccccc" stroke-width="2" fill="none"/^> >> uploads\test.svg
echo ^<text x="150" y="90" font-family="Arial" font-size="16" text-anchor="middle" fill="#666666"^>Imagen de prueba^</text^> >> uploads\test.svg
echo ^<text x="150" y="120" font-family="Arial" font-size="12" text-anchor="middle" fill="#666666"^>Pirata Tecnologico^</text^> >> uploads\test.svg
echo ^</svg^> >> uploads\test.svg
echo    [OK] Imagen de prueba creada
echo.

echo 6. Generando pagina de diagnostico...
echo ^<!DOCTYPE html^> > public\test-images.html
echo ^<html^>^<head^> >> public\test-images.html
echo ^<title^>Test de Imagenes^</title^> >> public\test-images.html
echo ^</head^>^<body^> >> public\test-images.html
echo ^<h1^>Prueba de Imagenes^</h1^> >> public\test-images.html
echo ^<p^>Si puedes ver la imagen abajo, el problema esta resuelto:^</p^> >> public\test-images.html
echo ^<img src="/uploads/test.svg" alt="Imagen de prueba"^> >> public\test-images.html
echo ^</body^>^</html^> >> public\test-images.html
echo    [OK] Pagina de diagnostico generada
echo.

echo ===================================================
echo  SOLUCION COMPLETADA
echo ===================================================
echo Para verificar si la solucion funciono:
echo 1. Inicia el servidor:    node server.js
echo 2. Abre en tu navegador:  http://localhost:8080/test-images.html
echo 3. Si ves la imagen, el problema esta resuelto
echo 4. Prueba luego con tus imagenes reales
echo.
echo ¿Quieres iniciar el servidor ahora? (S/N)
choice /C SN /M "Iniciar servidor ahora"
if errorlevel 2 goto :end
if errorlevel 1 goto :start

:start
echo.
echo Iniciando servidor...
start node server.js
echo Abriendo navegador...
start http://localhost:8080/test-images.html
goto :end

:end
echo.
echo ¡Gracias por usar el solucionador de problemas de imagenes!
echo.
