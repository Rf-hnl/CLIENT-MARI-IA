#!/bin/bash

# Script para probar el análisis por mensaje
# Uso: ./test-messages.sh

# Cargar configuración común
source "$(dirname "$0")/config.sh"

echo "💬 INICIANDO PRUEBA DE ANÁLISIS POR MENSAJE"
echo "============================================"
echo "Lead ID: $LEAD_ID"
echo "Conversation ID: $CONVERSATION_ID"
echo ""

# Ejecutar análisis por mensaje
echo "📡 Enviando petición de análisis por mensaje..."
echo ""

response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X POST "$BASE_URL/api/leads/$LEAD_ID/conversations/$CONVERSATION_ID/analysis/messages" \
    "${HEADERS[@]}" \
    -d "$SAMPLE_TRANSCRIPT")

# Extraer status code y body
status_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
response_body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')

# Mostrar resultado
show_result "ANÁLISIS POR MENSAJE" "$status_code" "$response_body"

# Si fue exitoso, mostrar campos específicos del análisis de mensajes
if [ "$status_code" = "200" ]; then
    echo "💬 DATOS ESPECÍFICOS DEL ANÁLISIS POR MENSAJE:"
    echo "==============================================="
    echo "$response_body" | jq -r '
        .data | 
        "Total Analyzed Messages: " + ((.messageAnalysis // []) | length | tostring) +
        "\nAgent Messages: " + ([.messageAnalysis[]? | select(.role == "agent")] | length | tostring) +
        "\nClient Messages: " + ([.messageAnalysis[]? | select(.role == "client")] | length | tostring) +
        "\nAverage Sentiment Score: " + (([.messageAnalysis[]?.sentimentScore // 0] | add / length) | tostring) +
        "\nKey Message Patterns: " + ((.patterns // []) | join(", ")) +
        "\nConversation Highlights: " + ((.highlights // []) | join(", "))
    ' 2>/dev/null
    echo ""
    
    # Mostrar análisis de los primeros 3 mensajes como muestra
    echo "📝 MUESTRA DE ANÁLISIS DE MENSAJES (primeros 3):"
    echo "================================================="
    echo "$response_body" | jq -r '
        .data.messageAnalysis[0:3][] | 
        "Mensaje " + (.messageIndex | tostring) + " (" + .role + "): " + 
        (.content[0:50] + "...") + 
        "\n  Sentiment: " + (.sentiment // "N/A") + " (score: " + (.sentimentScore // 0 | tostring) + ")" +
        "\n  Intent: " + (.intent // "N/A") +
        "\n  Key Points: " + ((.keyPoints // []) | join(", ")) +
        "\n"
    ' 2>/dev/null
fi

echo "💬 PRUEBA DE ANÁLISIS POR MENSAJE COMPLETADA"