#!/bin/bash

# Script para probar el análisis de sentiment
# Uso: ./test-sentiment.sh

# Cargar configuración común
source "$(dirname "$0")/config.sh"

echo "🎭 INICIANDO PRUEBA DE ANÁLISIS DE SENTIMENT"
echo "=============================================="
echo "Lead ID: $LEAD_ID"
echo "Conversation ID: $CONVERSATION_ID"
echo ""

# Ejecutar análisis de sentiment
echo "📡 Enviando petición de análisis de sentiment..."
echo ""

response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X POST "$BASE_URL/api/leads/$LEAD_ID/conversations/$CONVERSATION_ID/analysis/sentiment" \
    "${HEADERS[@]}" \
    -d "$SAMPLE_TRANSCRIPT")

# Extraer status code y body
status_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
response_body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')

# Mostrar resultado
show_result "ANÁLISIS DE SENTIMENT" "$status_code" "$response_body"

# Si fue exitoso, mostrar campos específicos del sentiment
if [ "$status_code" = "200" ]; then
    echo "📊 DATOS ESPECÍFICOS DEL SENTIMENT:"
    echo "=================================="
    echo "$response_body" | jq -r '
        .data | 
        "Overall Sentiment: " + (.overall // "N/A") + 
        "\nSentiment Score: " + (.score // 0 | tostring) + 
        "\nConfidence: " + (.confidence // 0 | tostring) + 
        "\nDominant Emotion: " + (.summary.dominantEmotion // "N/A") +
        "\nEmotional Journey: " + (.summary.emotionalJourney // "N/A")
    ' 2>/dev/null
    echo ""
fi

echo "🎭 PRUEBA DE SENTIMENT COMPLETADA"