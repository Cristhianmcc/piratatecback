@echo off
echo ===================================================
echo  SOLUCIONADOR DE PROBLEMAS DE IMAGENES
echo ===================================================
echo.

echo Esta herramienta solucionara los problemas de visualizacion
echo de imagenes en el frontend de Pirata Tecnologico
echo.

echo 1. Deteniendo el servidor...
taskkill /IM node.exe /F 2>nul
echo    [OK] Servidor detenido
echo.

echo 2. Asegurando que MongoDB este funcionando...
echo    Si MongoDB no esta funcionando, ejecutalo ahora y presiona Enter
pause
echo    [OK] MongoDB deberia estar funcionando
echo.

echo 3. Diagnosticando el problema...
node diagnose-images.js
echo.

echo 4. Creando imagenes placeholder...
node create-placeholders.js
echo.

echo 5. Corrigiendo URLs de imagenes en la base de datos...
node fix-image-urls.js
echo.

echo 6. Reemplazando imagenes faltantes con placeholders...
node replace-missing-images.js
echo.

echo 7. Limpieza completa...
del /q %TEMP%\node-* 2>nul
echo    [OK] Limpieza completada
echo.

echo ===================================================
echo  SOLUCION COMPLETADA
echo ===================================================
echo Para verificar que todo funciona correctamente:
echo 1. El servidor se reiniciara automaticamente
echo 2. Visita tu frontend y verifica las imagenes
echo 3. Usa Ctrl+F5 para recargar sin cache
echo.

echo Presiona Enter para reiniciar el servidor...
pause > nul

echo Iniciando servidor...
node server.js
