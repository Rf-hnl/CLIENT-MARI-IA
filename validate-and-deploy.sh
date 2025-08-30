#!/bin/bash

set -e

echo "🔍 Validando configuración de Docker..."

# Verificar que Docker esté corriendo
if ! docker ps >/dev/null 2>&1; then
    echo "❌ Docker no está corriendo. Por favor inicia Docker Desktop."
    exit 1
fi

# Verificar archivos necesarios
echo "📁 Verificando archivos de Docker..."

if [ ! -f "Dockerfile" ]; then
    echo "❌ No se encontró Dockerfile"
    exit 1
fi

if [ ! -f "docker-compose.yml" ]; then
    echo "❌ No se encontró docker-compose.yml"
    exit 1
fi

if [ ! -f ".env.prod" ]; then
    echo "❌ No se encontró .env.prod"
    exit 1
fi

# Verificar que el endpoint de health existe
if [ ! -f "app/api/health/route.ts" ]; then
    echo "❌ No se encontró el endpoint /api/health"
    exit 1
fi

echo "✅ Validación completada exitosamente"

# Construir y levantar Docker
echo "🐳 Construyendo imagen Docker..."
docker-compose build --progress=plain

echo "🚀 Levantando contenedores..."
docker-compose up -d

echo "⏳ Esperando que la aplicación esté lista..."
sleep 5

# Verificar que la aplicación responde
echo "🏥 Verificando healthcheck..."
for i in {1..30}; do
    if curl -f --connect-timeout 3 --max-time 5 http://localhost:3000/api/health >/dev/null 2>&1; then
        echo "✅ Aplicación funcionando correctamente en http://localhost:3000"
        echo "🏥 Health endpoint: http://localhost:3000/api/health"
        docker-compose logs --tail=10 client-mar-ia
        break
    else
        if [ $i -le 5 ]; then
            echo "⏳ Intento $i/30 - Esperando que la aplicación responda..."
            sleep 1
        else
            echo "⏳ Intento $i/30 - Esperando que la aplicación responda..."
            sleep 2
        fi
    fi
    
    if [ $i -eq 30 ]; then
        echo "❌ La aplicación no responde después de 60 segundos"
        echo "📋 Logs del contenedor:"
        docker-compose logs client-mar-ia
        exit 1
    fi
done

echo ""
echo "🎉 ¡Despliegue exitoso!"
echo "📱 Aplicación: http://localhost:3000"
echo "🏥 Health: http://localhost:3000/api/health"
echo ""
echo "Para detener: docker-compose down"