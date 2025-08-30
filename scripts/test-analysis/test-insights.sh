#!/bin/bash

# Script para probar la extracción de insights
# Uso: ./test-insights.sh

# Cargar configuración común
source "$(dirname "$0")/config.sh"

echo "💡 INICIANDO PRUEBA DE EXTRACCIÓN DE INSIGHTS"
echo "=============================================="
echo "Lead ID: $LEAD_ID"
echo "Conversation ID: $CONVERSATION_ID"
echo ""

# Ejecutar extracción de insights
echo "📡 Enviando petición de extracción de insights..."
echo ""

response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X POST "$BASE_URL/api/leads/$LEAD_ID/conversations/$CONVERSATION_ID/analysis/insights" \
    "${HEADERS[@]}" \
    -d "$SAMPLE_TRANSCRIPT")

# Extraer status code y body
status_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
response_body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')

# Mostrar resultado
show_result "EXTRACCIÓN DE INSIGHTS" "$status_code" "$response_body"

# Si fue exitoso, mostrar campos específicos de insights
if [ "$status_code" = "200" ]; then
    echo "💡 DATOS ESPECÍFICOS DE INSIGHTS:"
    echo "================================="
    echo "$response_body" | jq -r '
        .data | 
        "Key Topics: " + ((.keyTopics // []) | join(", ")) +
        "\nPain Points: " + ((.painPoints // []) | join(", ")) +
        "\nBuying Signals: " + ((.buyingSignals // []) | join(", ")) +
        "\nObjections: " + ((.objections // []) | join(", ")) +
        "\nOpportunities: " + ((.opportunities // []) | join(", ")) +
        "\nNext Steps: " + ((.nextSteps // []) | join(", ")) +
        "\nClient Priority: " + (.clientPriority // "N/A") +
        "\nDecision Timeline: " + (.decisionTimeline // "N/A")
    ' 2>/dev/null
    echo ""
fi

echo "💡 PRUEBA DE INSIGHTS COMPLETADA"