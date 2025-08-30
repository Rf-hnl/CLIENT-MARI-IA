#!/bin/bash

# Test simple para verificar si el servidor está funcionando y el problema de cuota

echo "🧪 PRUEBA SIMPLE DE DIAGNÓSTICO"
echo "==============================="
echo ""

# Verificar que el servidor esté corriendo
echo "1. ✅ VERIFICANDO SERVIDOR..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)
if [ "$response" = "200" ] || [ "$response" = "404" ]; then
    echo "   ✅ Servidor funcionando (HTTP $response)"
else
    echo "   ❌ Servidor no responde o no está corriendo"
    echo "   💡 Ejecuta: npm run dev"
    exit 1
fi

echo ""

# Verificar endpoint de health check básico
echo "2. 🔍 VERIFICANDO API DE ANÁLISIS..."

# Test con datos mínimos para confirmar el error de cuota
curl -s -X POST "http://localhost:3000/api/leads/test-id/conversations/test-conv/analysis/sentiment" \
-H "Content-Type: application/json" \
-d '{
  "transcript": {
    "messages": [
      {"role": "agent", "content": "Test message", "timestamp": 1634567890}
    ],
    "duration": 10,
    "totalWords": 2,
    "participantCount": 2
  }
}' | python3 -m json.tool 2>/dev/null || echo "Response not valid JSON"

echo ""
echo "3. 📋 DIAGNÓSTICO RESULTADO:"
echo "   Si ves 'insufficient_quota' = Problema de OpenAI API"
echo "   Si ves 'unauthorized' = Problema de token"
echo "   Si ves otros errores = Revisar logs del servidor"
echo ""
echo "💡 PRÓXIMOS PASOS:"
echo "   - Si es cuota: Renovar OpenAI API"
echo "   - Si es token: Obtener nuevo JWT desde browser"
echo "   - Si es otro: Revisar logs del servidor"