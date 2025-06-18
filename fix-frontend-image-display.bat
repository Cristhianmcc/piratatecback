@echo off
echo ===================================================
echo  SOLUCIONAR PROBLEMA DE IMAGENES EN FRONTEND
echo ===================================================
echo.

echo 1. Verificando MongoDB...
echo    Por favor asegurate que MongoDB esta activo.
pause
echo.

echo 2. Deteniendo servidor Node.js actual...
taskkill /IM node.exe /F 2>nul
echo    Servidor detenido.
echo.

echo 3. Actualizando las URLs de las imagenes en la base de datos...
echo    Esto asegura que se use la URL base correcta (http://localhost:8080)
node fix-frontend-images.js
echo.

echo 4. Verificando archivos de imagenes...
node verify-images.js
echo.

echo 5. Iniciando servidor con la configuracion actualizada...
echo    Presiona Ctrl+C cuando quieras detener el servidor.
echo.

echo ===================================================
echo  IMPORTANTE: En tu navegador frontend (React)
echo ===================================================
echo  1. Usa Ctrl+F5 para recargar sin cache
echo  2. Verifica la consola del navegador (F12)
echo  3. Si sigues sin ver las imagenes, verifica que:
echo     - El servidor backend este corriendo (este)
echo     - El frontend este corriendo (React)
echo     - Las URLs sean correctas
echo ===================================================

npm run dev
