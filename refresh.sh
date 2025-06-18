#!/bin/bash

echo "Limpiando cache de imágenes..."
rm -rf uploads/thumbnails/* uploads/screenshots/* uploads/programs/* 2>/dev/null

echo "Creando directorios de uploads..."
mkdir -p uploads/thumbnails uploads/screenshots uploads/programs

echo "Reiniciando el servidor..."
npm run dev
