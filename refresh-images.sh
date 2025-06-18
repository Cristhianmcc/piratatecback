#!/bin/bash

echo "==================================================="
echo "  Limpieza de caché de imágenes para el frontend"
echo "==================================================="
echo ""

# Verificar directorios
echo "1. Verificando directorios de uploads..."
mkdir -p uploads/thumbnails uploads/screenshots uploads/programs
echo "   [OK] Directorios verificados"
echo ""

# Renombrar imágenes para forzar actualización en el frontend
echo "2. Agregando sufijo de timestamp a las imágenes..."

# Renombrar thumbnails
for img in uploads/thumbnails/*; do
  if [[ -f "$img" && ! "$img" == *"_refreshed_"* ]]; then
    filename=$(basename -- "$img")
    extension="${filename##*.}"
    filename="${filename%.*}"
    timestamp=$(date +%s)
    mv "$img" "uploads/thumbnails/${filename}_refreshed_${timestamp}.${extension}"
    echo "   [OK] Renombrado: $img -> ${filename}_refreshed_${timestamp}.${extension}"
  fi
done

# Renombrar screenshots
for img in uploads/screenshots/*; do
  if [[ -f "$img" && ! "$img" == *"_refreshed_"* ]]; then
    filename=$(basename -- "$img")
    extension="${filename##*.}"
    filename="${filename%.*}"
    timestamp=$(date +%s)
    mv "$img" "uploads/screenshots/${filename}_refreshed_${timestamp}.${extension}"
    echo "   [OK] Renombrado: $img -> ${filename}_refreshed_${timestamp}.${extension}"
  fi
done

echo ""
echo "3. Actualizando base de datos con nuevos nombres..."
echo "   NOTA: Esto requiere ejecutar manualmente un script de migración"
echo ""

echo "4. Reiniciando servidor..."
echo "   [INFO] El servidor se reiniciará para aplicar los cambios"
echo ""

echo "==================================================="
echo "  Proceso completado"
echo "==================================================="
echo "Ahora debes:"
echo "1. Ejecutar 'npm run dev' para reiniciar el servidor"
echo "2. En el navegador, usar Ctrl+F5 para recargar sin caché"
echo "==================================================="
