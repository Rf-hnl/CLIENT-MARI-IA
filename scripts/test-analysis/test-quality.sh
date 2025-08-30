#!/bin/bash

# Script para probar el análisis de calidad
# Uso: ./test-quality.sh

# Cargar configuración común
source "$(dirname "$0")/config.sh"

echo "📊 INICIANDO PRUEBA DE ANÁLISIS DE CALIDAD"
echo "==========================================="
echo "Lead ID: $LEAD_ID"
echo "Conversation ID: $CONVERSATION_ID"
echo ""

# Ejecutar análisis de calidad
echo "📡 Enviando petición de análisis de calidad..."
echo ""

response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X POST "$BASE_URL/api/leads/$LEAD_ID/conversations/$CONVERSATION_ID/analysis/quality" \
    "${HEADERS[@]}" \
    -d "$SAMPLE_TRANSCRIPT")

# Extraer status code y body
status_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
response_body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')

# Mostrar resultado
show_result "ANÁLISIS DE CALIDAD" "$status_code" "$response_body"

# Si fue exitoso, mostrar campos específicos de calidad
if [ "$status_code" = "200" ]; then
    echo "📊 DATOS ESPECÍFICOS DE CALIDAD:"
    echo "================================"
    echo "$response_body" | jq -r '
        .data | 
        "Overall Quality Score: " + (.overall // 0 | tostring) + "/100" +
        "\nAgent Performance: " + (.agentPerformance // 0 | tostring) + "/100" +
        "\nConversation Flow: " + (.conversationFlow // "N/A") +
        "\nSales Techniques Used: " + ((.salesTechniques // []) | join(", ")) +
        "\nStrengths: " + ((.strengths // []) | join(", ")) +
        "\nImprovements: " + ((.improvements // []) | join(", "))
    ' 2>/dev/null
    echo ""
fi

echo "📊 PRUEBA DE CALIDAD COMPLETADA"