#!/bin/bash

# Script para probar las acciones inteligentes
# Uso: ./test-actions.sh

# Cargar configuración común
source "$(dirname "$0")/config.sh"

echo "⚡ INICIANDO PRUEBA DE ACCIONES INTELIGENTES"
echo "============================================"
echo "Lead ID: $LEAD_ID"
echo "Conversation ID: $CONVERSATION_ID"
echo ""

# Ejecutar generación de acciones inteligentes
echo "📡 Enviando petición de acciones inteligentes..."
echo ""

response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X POST "$BASE_URL/api/leads/$LEAD_ID/conversations/$CONVERSATION_ID/analysis/actions" \
    "${HEADERS[@]}" \
    -d "$SAMPLE_TRANSCRIPT")

# Extraer status code y body
status_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
response_body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')

# Mostrar resultado
show_result "ACCIONES INTELIGENTES" "$status_code" "$response_body"

# Si fue exitoso, mostrar campos específicos de acciones
if [ "$status_code" = "200" ]; then
    echo "⚡ DATOS ESPECÍFICOS DE ACCIONES INTELIGENTES:"
    echo "=============================================="
    echo "$response_body" | jq -r '
        .data | 
        "Total Actions Generated: " + ((.actions // []) | length | tostring) +
        "\nHigh Priority Actions: " + ([.actions[]? | select(.priority == "high")] | length | tostring) +
        "\nMedium Priority Actions: " + ([.actions[]? | select(.priority == "medium")] | length | tostring) +
        "\nLow Priority Actions: " + ([.actions[]? | select(.priority == "low")] | length | tostring) +
        "\nImmediate Actions: " + ([.actions[]? | select(.timing == "immediate")] | length | tostring) +
        "\nFollow-up Actions: " + ([.actions[]? | select(.timing == "follow-up")] | length | tostring)
    ' 2>/dev/null
    echo ""
    
    # Mostrar las acciones más importantes
    echo "🎯 ACCIONES PRIORITARIAS:"
    echo "========================="
    echo "$response_body" | jq -r '
        .data.actions[]? | select(.priority == "high") | 
        "🔴 " + .title + 
        "\n   Tipo: " + (.type // "N/A") +
        "\n   Descripción: " + (.description // "N/A") +
        "\n   Timing: " + (.timing // "N/A") +
        "\n   Resultado esperado: " + (.expectedOutcome // "N/A") +
        "\n"
    ' 2>/dev/null
    
    echo "📋 TODAS LAS ACCIONES SUGERIDAS:"
    echo "================================="
    echo "$response_body" | jq -r '
        .data.actions[]? | 
        "• " + .title + " (" + (.priority // "N/A") + " priority, " + (.timing // "N/A") + " timing)"
    ' 2>/dev/null
fi

echo "⚡ PRUEBA DE ACCIONES INTELIGENTES COMPLETADA"