#!/bin/bash

# Test del Multi-AI Provider con fallback automático
# Este script prueba OpenAI → Gemini fallback

echo "🧪 TESTING MULTI-AI PROVIDER CON FALLBACK"
echo "========================================"
echo ""

# Configuración
BASE_URL="http://localhost:3000"
LEAD_ID="e2966ef7-c52a-468e-9faf-91c29521e8a8"
CONVERSATION_ID="conv_0701k3a38ks2etmbjkpd3ad3ry0c"

# Headers
HEADERS=(
    -H "Content-Type: application/json" 
    -H "Accept: application/json"
)

# Transcript de prueba pequeño
SAMPLE_TRANSCRIPT='{
  "transcript": {
    "messages": [
      {
        "role": "agent",
        "content": "Hola, te contacto para ofrecerte nuestro sistema de facturación.",
        "timestamp": 1634567890
      },
      {
        "role": "client",
        "content": "Me interesa, pero tengo presupuesto limitado.",
        "timestamp": 1634567900
      }
    ],
    "duration": 30,
    "totalWords": 15,
    "participantCount": 2
  },
  "agentId": null
}'

echo "🔧 CONFIGURACIÓN:"
echo "Base URL: $BASE_URL"
echo "Lead ID: $LEAD_ID"
echo "Conversation ID: $CONVERSATION_ID"
echo ""

# Función para mostrar resultado
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
    
    # Detectar qué proveedor se usó
    if echo "$response_body" | grep -q '"provider"'; then
        provider=$(echo "$response_body" | jq -r '.usedAgent // .agentName // "Unknown"' 2>/dev/null)
        echo "🤖 Proveedor usado: $provider"
    fi
    
    if [ "$status_code" = "200" ]; then
        echo "✅ ÉXITO: Análisis completado"
    elif [ "$status_code" = "429" ]; then
        echo "⚠️  RATE LIMIT: Demasiadas peticiones"
    elif [ "$status_code" = "401" ]; then
        echo "🔐 AUTH ERROR: Token inválido o expirado"  
    elif [ "$status_code" = "500" ]; then
        echo "❌ ERROR SERVER: Problema interno"
        echo "    Revisar logs del servidor para detalles"
    else
        echo "⚠️  STATUS: $status_code"
    fi
    echo ""
}

echo "🧪 PRUEBA 1: ANÁLISIS DE SENTIMENT (Multi-AI Fallback)"
echo "===================================================="
echo "Intentando análisis de sentiment..."
echo "Expectativa: OpenAI fallará → Gemini tomará el control"
echo ""

response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X POST "$BASE_URL/api/leads/$LEAD_ID/conversations/$CONVERSATION_ID/analysis/sentiment" \
    "${HEADERS[@]}" \
    -d "$SAMPLE_TRANSCRIPT")

# Extraer status code y body
status_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
response_body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')

show_result "SENTIMENT con Multi-AI" "$status_code" "$response_body"

echo "⏳ Esperando 3 segundos antes de la siguiente prueba..."
sleep 3

echo "🧪 PRUEBA 2: ANÁLISIS DE QUALITY (Multi-AI Fallback)"
echo "=================================================="
echo ""

response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X POST "$BASE_URL/api/leads/$LEAD_ID/conversations/$CONVERSATION_ID/analysis/quality" \
    "${HEADERS[@]}" \
    -d "$SAMPLE_TRANSCRIPT")

# Extraer status code y body
status_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
response_body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')

show_result "QUALITY con Multi-AI" "$status_code" "$response_body"

echo "🏁 RESUMEN DEL TEST MULTI-AI"
echo "============================="
echo ""
echo "✅ Tests completados con sistema Multi-AI Provider"
echo ""
echo "🔍 QUÉ BUSCAR EN LOS RESULTADOS:"
echo ""
echo "1. **Si OpenAI funciona:**"
echo "   - Proveedor usado: 'Openai Fallback'"
echo "   - Status: 200"
echo ""
echo "2. **Si OpenAI falla y Gemini funciona:**" 
echo "   - Proveedor usado: 'Gemini Fallback'"
echo "   - Status: 200"
echo "   - ✅ ÉXITO: Fallback funcionando!"
echo ""
echo "3. **Si ambos fallan:**"
echo "   - Status: 500"
echo "   - Error: 'All AI providers failed'"
echo "   - Necesitas configurar al menos una API key válida"
echo ""
echo "📖 CONFIGURACIÓN:"
echo "- OpenAI: Edita OPENAI_API_KEY en .env.local"
echo "- Gemini: Edita GEMINI_API_KEY en .env.local" 
echo "- Documentación: Lee GEMINI_SETUP.md"
echo ""
echo "🚀 PARA OBTENER GEMINI API KEY GRATIS:"
echo "   https://makersuite.google.com/app/apikey"