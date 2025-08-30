#!/bin/bash

# Script para probar las métricas de conversación
# Uso: ./test-metrics.sh

# Cargar configuración común
source "$(dirname "$0")/config.sh"

echo "📈 INICIANDO PRUEBA DE MÉTRICAS DE CONVERSACIÓN"
echo "==============================================="
echo "Lead ID: $LEAD_ID"
echo "Conversation ID: $CONVERSATION_ID"
echo ""

# Ejecutar cálculo de métricas
echo "📡 Enviando petición de métricas de conversación..."
echo ""

response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X POST "$BASE_URL/api/leads/$LEAD_ID/conversations/$CONVERSATION_ID/analysis/metrics" \
    "${HEADERS[@]}" \
    -d "$SAMPLE_TRANSCRIPT")

# Extraer status code y body
status_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
response_body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')

# Mostrar resultado
show_result "MÉTRICAS DE CONVERSACIÓN" "$status_code" "$response_body"

# Si fue exitoso, mostrar campos específicos de métricas
if [ "$status_code" = "200" ]; then
    echo "📈 DATOS ESPECÍFICOS DE MÉTRICAS:"
    echo "================================="
    echo "$response_body" | jq -r '
        .data | 
        "Total Messages: " + (.totalMessages // 0 | tostring) +
        "\nQuestions Asked: " + (.questionsAsked // 0 | tostring) +
        "\nQuestions Answered: " + (.questionsAnswered // 0 | tostring) +
        "\nInterruption Count: " + (.interruptionCount // 0 | tostring) +
        "\nTalk Time Ratio (Agent:Client): " + (.talkTimeRatio // "N/A") +
        "\nAverage Response Time: " + (.averageResponseTime // "N/A") +
        "\nConversation Pace: " + (.conversationPace // "N/A") +
        "\nTopic Switches: " + (.topicSwitches // 0 | tostring) +
        "\nSilence Periods: " + (.silencePeriods // 0 | tostring) +
        "\nOverall Flow Score: " + (.overallFlowScore // 0 | tostring) + "/10"
    ' 2>/dev/null
    echo ""
fi

echo "📈 PRUEBA DE MÉTRICAS COMPLETADA"