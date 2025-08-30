#!/bin/bash

# Script para probar las predicciones de IA
# Uso: ./test-predictions.sh

# Cargar configuración común
source "$(dirname "$0")/config.sh"

echo "🔮 INICIANDO PRUEBA DE PREDICCIONES DE IA"
echo "=========================================="
echo "Lead ID: $LEAD_ID"
echo "Conversation ID: $CONVERSATION_ID"
echo ""

# Ejecutar predicciones de IA
echo "📡 Enviando petición de predicciones de IA..."
echo ""

response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X POST "$BASE_URL/api/leads/$LEAD_ID/conversations/$CONVERSATION_ID/analysis/predictions" \
    "${HEADERS[@]}" \
    -d "$SAMPLE_TRANSCRIPT")

# Extraer status code y body
status_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
response_body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')

# Mostrar resultado
show_result "PREDICCIONES DE IA" "$status_code" "$response_body"

# Si fue exitoso, mostrar campos específicos de predicciones
if [ "$status_code" = "200" ]; then
    echo "🔮 DATOS ESPECÍFICOS DE PREDICCIONES:"
    echo "====================================="
    echo "$response_body" | jq -r '
        .data | 
        "Conversion Likelihood: " + (.conversionLikelihood // 0 | tostring) + "%" +
        "\nRecommended Action: " + (.recommendedAction // "N/A") +
        "\nUrgency Level: " + (.urgencyLevel // "N/A") +
        "\nFollow-up Timeline: " + (.followUpTimeline // "N/A") +
        "\nSuccess Probability: " + (.successProbability // 0 | tostring) + "%" +
        "\nRisk Factors: " + ((.riskFactors // []) | join(", ")) +
        "\nOpportunity Score: " + (.opportunityScore // 0 | tostring) + "/10" +
        "\nNext Best Actions: " + ((.nextBestActions // []) | join(", ")) +
        "\nDecision Timeframe: " + (.decisionTimeframe // "N/A")
    ' 2>/dev/null
    echo ""
fi

echo "🔮 PRUEBA DE PREDICCIONES COMPLETADA"