@echo off
echo ===================================================
echo  REINICIO COMPLETO DEL SERVIDOR
echo ===================================================
echo.

echo 1. Deteniendo el servidor...
taskkill /IM node.exe /F 2>nul
echo    [OK] Servidor detenido
echo.

echo 2. Limpiando cache del navegador y sistema...
echo    (Recuerda usar Ctrl+F5 en el navegador tambien)
del /Q /F /S "%TEMP%\node-*" 2>nul
echo    [OK] Cache limpiada
echo.

echo 3. Creando estructuras de directorios necesarias...
if not exist uploads mkdir uploads
if not exist uploads\thumbnails mkdir uploads\thumbnails
if not exist uploads\screenshots mkdir uploads\screenshots
if not exist uploads\programs mkdir uploads\programs
echo    [OK] Directorios verificados
echo.

echo 4. Asegurando permisos de directorios...
icacls "uploads" /grant Everyone:(OI)(CI)F /T
echo    [OK] Permisos establecidos
echo.

echo 5. Inicializando el servidor...
echo    El servidor se iniciara ahora. Presiona Ctrl+C para detenerlo cuando termines.
echo.

echo ===================================================
echo  SERVIDOR INICIADO
echo ===================================================
echo Recuerda:
echo 1. Usar Ctrl+F5 en el navegador para recargar sin cache
echo 2. Verificar las URLs de las imagenes en el inspector web
echo ===================================================
echo.

npm run dev
