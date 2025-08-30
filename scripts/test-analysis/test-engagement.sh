#!/bin/bash

# Script para probar el análisis de engagement
# Uso: ./test-engagement.sh

# Cargar configuración común
source "$(dirname "$0")/config.sh"

echo "🚀 INICIANDO PRUEBA DE ANÁLISIS DE ENGAGEMENT"
echo "============================================="
echo "Lead ID: $LEAD_ID"
echo "Conversation ID: $CONVERSATION_ID"
echo ""

# Ejecutar análisis de engagement
echo "📡 Enviando petición de análisis de engagement..."
echo ""

response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X POST "$BASE_URL/api/leads/$LEAD_ID/conversations/$CONVERSATION_ID/analysis/engagement" \
    "${HEADERS[@]}" \
    -d "$SAMPLE_TRANSCRIPT")

# Extraer status code y body
status_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
response_body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')

# Mostrar resultado
show_result "ANÁLISIS DE ENGAGEMENT" "$status_code" "$response_body"

# Si fue exitoso, mostrar campos específicos de engagement
if [ "$status_code" = "200" ]; then
    echo "🚀 DATOS ESPECÍFICOS DE ENGAGEMENT:"
    echo "==================================="
    echo "$response_body" | jq -r '
        .data | 
        "Engagement Score: " + (.score // 0 | tostring) + "/100" +
        "\nInterest Level: " + (.interestLevel // "N/A") +
        "\nResponse Quality: " + (.responseQuality // "N/A") +
        "\nParticipation Level: " + (.participationLevel // "N/A") +
        "\nQuestion Frequency: " + (.questionFrequency // "N/A") +
        "\nActive Listening Indicators: " + ((.activeListening // []) | join(", ")) +
        "\nEngagement Patterns: " + ((.engagementPatterns // []) | join(", ")) +
        "\nAttention Signals: " + ((.attentionSignals // []) | join(", "))
    ' 2>/dev/null
    echo ""
fi

echo "🚀 PRUEBA DE ENGAGEMENT COMPLETADA"