#!/bin/bash

# Configuración común para todos los scripts de prueba de análisis
# Este archivo debe ser sourced por otros scripts

# URLs y configuración
BASE_URL="http://localhost:3000"
LEAD_ID="e2966ef7-c52a-468e-9faf-91c29521e8a8"
CONVERSATION_ID="conv_0701k3a38ks2etmbjkpd3ad3ry0c"

# Token de autenticación (actualizado con token válido)
AUTH_TOKEN="eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiI1ZjE3NDY3ZS0yMDFhLTQxMjEtOTc5OC1lYWE1ZWIzNTMwOTAiLCJlbWFpbCI6InJhdWxlZmR6QGdtYWlsLmNvbSIsInRlbmFudElkIjoiOTkxMzRlNTYtNWI4Zi00OWZhLTg4OWUtZmVlNDkyM2M1OTZlIiwib3JnYW5pemF0aW9uSWQiOiJiNzBkOGFlMy0wMWEwLTQ2NzgtYjhiZS02NjhiZWExMTE0ZmYiLCJyb2xlcyI6WyJURU5BTlRfQURNSU4iXSwiaWF0IjoxNzU1OTA2Nzk5LCJleHAiOjE7NTU5OTMxOTl9.EqnTAkwoPtaeiuFBtcwn0fuboV-GDSH_FNXOffF_AmM"

# Headers comunes
HEADERS=(
    -H "Content-Type: application/json"
    -H "Authorization: Bearer $AUTH_TOKEN"
    -H "Accept: application/json"
)

# Transcript de muestra para pruebas
SAMPLE_TRANSCRIPT='{
  "transcript": {
    "messages": [
      {
        "role": "agent",
        "content": "¡Hola! Soy María de Antares Tech. ¿Cómo está todo por allí?",
        "timestamp": 1634567890
      },
      {
        "role": "client", 
        "content": "Hola María, todo bien por aquí. ¿En qué te puedo ayudar?",
        "timestamp": 1634567900
      },
      {
        "role": "agent",
        "content": "Te contacto porque veo que tienes un negocio y quería contarte sobre nuestras soluciones de Jaiopos para facturación y gestión de inventario. ¿Actualmente tienes algún sistema?",
        "timestamp": 1634567910
      },
      {
        "role": "client",
        "content": "La verdad es que no tenemos nada automatizado. Todo lo llevamos manual y con presupuesto limitado.",
        "timestamp": 1634567920
      },
      {
        "role": "agent",
        "content": "Perfecto, entiendo. Nuestro sistema está diseñado para negocios como el tuyo. ¿Te parece si programamos una demo para el lunes por la mañana?",
        "timestamp": 1634567930
      },
      {
        "role": "client",
        "content": "Sí, me parece bien. ¿Podrías enviarme más información por email?",
        "timestamp": 1634567940
      }
    ],
    "duration": 155,
    "totalWords": 95,
    "participantCount": 2
  },
  "agentId": null
}'

# Función para mostrar resultados
show_result() {
    local test_name=$1
    local status_code=$2
    local response_body=$3
    
    echo "================================"
    echo "📊 RESULTADO: $test_name"
    echo "================================"
    echo "Status Code: $status_code"
    echo ""
    echo "Response Body:"
    echo "$response_body" | jq . 2>/dev/null || echo "$response_body"
    echo ""
    
    if [ "$status_code" = "200" ]; then
        echo "✅ ÉXITO: Análisis completado"
    elif [ "$status_code" = "429" ]; then
        echo "⚠️  RATE LIMIT: Demasiadas peticiones"
    elif [ "$status_code" = "401" ]; then
        echo "🔐 AUTH ERROR: Token inválido o expirado"
    elif [ "$status_code" = "500" ]; then
        echo "❌ ERROR SERVER: Problema interno"
    else
        echo "⚠️  STATUS: $status_code"
    fi
    echo ""
}

# Función para esperar entre pruebas
wait_for_rate_limit() {
    local seconds=${1:-5}
    echo "⏳ Esperando $seconds segundos para evitar rate limit..."
    sleep $seconds
}