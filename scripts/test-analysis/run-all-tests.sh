#!/bin/bash

# Script maestro para ejecutar todos los análisis individuales
# Uso: ./run-all-tests.sh

# Cargar configuración común
source "$(dirname "$0")/config.sh"

echo "🧪 INICIANDO SUITE COMPLETA DE PRUEBAS DE ANÁLISIS"
echo "==================================================="
echo "Lead ID: $LEAD_ID"
echo "Conversation ID: $CONVERSATION_ID"
echo "Base URL: $BASE_URL"
echo ""
echo "⏱️  Este proceso puede tomar varios minutos debido al rate limiting..."
echo ""

# Array con todos los tipos de análisis
analysis_types=(
    "sentiment:🎭:Análisis de Sentiment"
    "quality:📊:Análisis de Calidad"
    "insights:💡:Extracción de Insights"
    "engagement:🚀:Análisis de Engagement"
    "predictions:🔮:Predicciones de IA"
    "metrics:📈:Métricas de Conversación"
    "messages:💬:Análisis por Mensaje"
    "actions:⚡:Acciones Inteligentes"
)

# Contadores para estadísticas
total_tests=${#analysis_types[@]}
successful_tests=0
failed_tests=0
rate_limited_tests=0

echo "📊 RESUMEN DE PRUEBAS A EJECUTAR:"
echo "================================="
for item in "${analysis_types[@]}"; do
    IFS=':' read -r type emoji name <<< "$item"
    echo "$emoji $name"
done
echo ""
echo "Total: $total_tests análisis"
echo ""

# Función para actualizar estadísticas
update_stats() {
    local status_code=$1
    case $status_code in
        200)
            ((successful_tests++))
            ;;
        429)
            ((rate_limited_tests++))
            ;;
        *)
            ((failed_tests++))
            ;;
    esac
}

# Ejecutar todos los análisis
for i in "${!analysis_types[@]}"; do
    item="${analysis_types[$i]}"
    IFS=':' read -r type emoji name <<< "$item"
    
    current=$((i + 1))
    echo ""
    echo "▶️  EJECUTANDO PRUEBA $current/$total_tests"
    echo "============================================"
    echo "$emoji $name"
    echo ""
    
    # Ejecutar análisis específico
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -X POST "$BASE_URL/api/leads/$LEAD_ID/conversations/$CONVERSATION_ID/analysis/$type" \
        "${HEADERS[@]}" \
        -d "$SAMPLE_TRANSCRIPT")
    
    # Extraer status code y body
    status_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    response_body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')
    
    # Actualizar estadísticas
    update_stats "$status_code"
    
    # Mostrar resultado resumido
    case $status_code in
        200)
            echo "✅ ÉXITO: $name completado"
            echo "📄 Response: $(echo "$response_body" | jq -r '.analysisType // "N/A"') - $(echo "$response_body" | jq -r '.success // false')"
            ;;
        429)
            echo "⚠️  RATE LIMIT: $name - esperando más tiempo"
            ;;
        401)
            echo "🔐 AUTH ERROR: $name - token inválido"
            ;;
        500)
            echo "❌ SERVER ERROR: $name"
            echo "Error: $(echo "$response_body" | jq -r '.error // "Unknown"')"
            ;;
        *)
            echo "⚠️  ERROR $status_code: $name"
            ;;
    esac
    
    # Esperar entre pruebas (excepto en la última)
    if [ $current -lt $total_tests ]; then
        case $status_code in
            429)
                echo "⏳ Esperando 10 segundos extra por rate limit..."
                wait_for_rate_limit 10
                ;;
            *)
                wait_for_rate_limit 5
                ;;
        esac
    fi
done

# Mostrar estadísticas finales
echo ""
echo "🏁 RESULTADOS FINALES DE LA SUITE DE PRUEBAS"
echo "============================================="
echo "Total de pruebas ejecutadas: $total_tests"
echo "✅ Exitosas: $successful_tests"
echo "❌ Fallidas: $failed_tests"
echo "⚠️  Rate Limited: $rate_limited_tests"
echo ""

# Calcular porcentaje de éxito
if [ $total_tests -gt 0 ]; then
    success_rate=$((successful_tests * 100 / total_tests))
    echo "📊 Tasa de éxito: $success_rate%"
else
    echo "📊 Tasa de éxito: 0%"
fi

echo ""
if [ $successful_tests -eq $total_tests ]; then
    echo "🎉 ¡TODAS LAS PRUEBAS PASARON!"
elif [ $successful_tests -gt 0 ]; then
    echo "✅ PRUEBAS COMPLETADAS CON ALGUNOS ÉXITOS"
else
    echo "❌ TODAS LAS PRUEBAS FALLARON"
fi

echo ""
echo "🧪 SUITE DE PRUEBAS COMPLETADA"