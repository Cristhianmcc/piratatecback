#!/bin/bash

echo "===== Iniciando el servidor de Pirata Tech ====="
echo ""
echo "Puerto: 8080"
echo "URL de la aplicación: http://localhost:8080/admin/"
echo ""
echo "Presiona Ctrl+C para detener el servidor"
echo ""

cd "$(dirname "$0")"
node server.js
