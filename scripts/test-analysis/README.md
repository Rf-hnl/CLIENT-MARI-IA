# Scripts de Prueba para Análisis Individual

Este directorio contiene scripts de bash para probar cada endpoint de análisis individual del sistema de análisis de conversaciones.

## 📁 Estructura de Archivos

```
test-analysis/
├── config.sh              # Configuración común (URLs, tokens, datos de prueba)
├── run-all-tests.sh       # Script maestro que ejecuta todos los análisis
├── test-sentiment.sh      # Prueba análisis de sentiment
├── test-quality.sh        # Prueba análisis de calidad
├── test-insights.sh       # Prueba extracción de insights
├── test-engagement.sh     # Prueba análisis de engagement
├── test-predictions.sh    # Prueba predicciones de IA
├── test-metrics.sh        # Prueba métricas de conversación
├── test-messages.sh       # Prueba análisis por mensaje
├── test-actions.sh        # Prueba acciones inteligentes
└── README.md              # Esta documentación
```

## 🔧 Configuración Inicial

### 1. Hacer Scripts Ejecutables
```bash
cd scripts/test-analysis
chmod +x *.sh
```

### 2. Actualizar Configuración
Edita `config.sh` y actualiza:

- `AUTH_TOKEN`: Token JWT válido (obtén uno nuevo desde las DevTools del navegador)
- `LEAD_ID`: ID del lead que quieres probar
- `CONVERSATION_ID`: ID de la conversación específica
- `BASE_URL`: URL base del servidor (por defecto: http://localhost:3000)

### 3. Verificar Dependencias
Asegúrate de tener instalado:
- `curl` (para hacer las peticiones HTTP)
- `jq` (para formatear JSON) - instalar con: `brew install jq`

## 🚀 Uso de Scripts

### Ejecutar Todos los Análisis (Recomendado)
```bash
./run-all-tests.sh
```

Este script ejecutará todos los análisis de forma secuencial con delays apropiados para evitar rate limiting.

### Ejecutar Análisis Individuales
```bash
./test-sentiment.sh      # Análisis de sentiment
./test-quality.sh        # Análisis de calidad  
./test-insights.sh       # Extracción de insights
./test-engagement.sh     # Análisis de engagement
./test-predictions.sh    # Predicciones de IA
./test-metrics.sh        # Métricas de conversación
./test-messages.sh       # Análisis por mensaje
./test-actions.sh        # Acciones inteligentes
```

## 📊 Interpretación de Resultados

### Códigos de Estado
- **✅ 200**: Análisis completado exitosamente
- **⚠️ 429**: Rate limit alcanzado (normal, espera y reintenta)
- **🔐 401**: Token de autenticación inválido o expirado
- **❌ 500**: Error interno del servidor

### Estructura de Respuesta Exitosa
```json
{
  "success": true,
  "analysisType": "sentiment",
  "data": {
    // Datos específicos del análisis
  },
  "processingTime": 1234567890,
  "usedAgent": "OpenAI Fallback",
  "model": "gpt-4o-mini",
  "savedToDatabase": true
}
```

## 🔍 Tipos de Análisis

### 🎭 Sentiment Analysis
Analiza emociones y actitudes del cliente:
- `overall`: sentiment general (positive/negative/neutral/mixed)
- `score`: puntuación numérica (-1.0 a 1.0)
- `confidence`: nivel de confianza (0.0 a 1.0)
- `emotions`: emociones detectadas
- `messageAnalysis`: análisis por mensaje individual

### 📊 Quality Analysis  
Evalúa calidad de la conversación:
- `overall`: puntuación general de calidad (0-100)
- `agentPerformance`: rendimiento del agente (0-100)
- `conversationFlow`: flujo de conversación (excellent/good/fair/poor)
- `salesTechniques`: técnicas de ventas utilizadas
- `strengths` y `improvements`: fortalezas y mejoras

### 💡 Insights Extraction
Extrae insights clave:
- `keyTopics`: temas principales mencionados
- `painPoints`: puntos de dolor del cliente
- `buyingSignals`: señales de compra detectadas
- `objections`: objeciones identificadas
- `opportunities`: oportunidades identificadas
- `nextSteps`: próximos pasos sugeridos

### 🚀 Engagement Analysis
Mide nivel de compromiso:
- `score`: puntuación de engagement (0-100)
- `interestLevel`: nivel de interés del cliente
- `responseQuality`: calidad de respuestas
- `participationLevel`: nivel de participación
- `attentionSignals`: señales de atención

### 🔮 AI Predictions
Predicciones basadas en IA:
- `conversionLikelihood`: probabilidad de conversión (%)
- `recommendedAction`: acción recomendada
- `urgencyLevel`: nivel de urgencia (high/medium/low)
- `followUpTimeline`: cronograma de seguimiento
- `riskFactors`: factores de riesgo
- `nextBestActions`: mejores próximas acciones

### 📈 Conversation Metrics
Métricas cuantitativas:
- `totalMessages`: total de mensajes
- `questionsAsked/Answered`: preguntas hechas/respondidas
- `interruptionCount`: número de interrupciones
- `talkTimeRatio`: proporción de tiempo hablando
- `averageResponseTime`: tiempo promedio de respuesta

### 💬 Message Analysis
Análisis mensaje por mensaje:
- `messageAnalysis`: análisis individual de cada mensaje
- `patterns`: patrones identificados en la conversación
- `highlights`: momentos destacados
- `sentimentProgression`: progresión del sentiment

### ⚡ Intelligent Actions
Acciones sugeridas por IA:
- `actions`: lista de acciones recomendadas
- `priority`: nivel de prioridad (high/medium/low)
- `timing`: cuando ejecutar (immediate/follow-up/long-term)
- `expectedOutcome`: resultado esperado
- `type`: tipo de acción

## ⚠️ Notas Importantes

### Rate Limiting
Los scripts incluyen delays automáticos entre peticiones para evitar rate limiting. Si recibes errores 429:
- Espera algunos segundos antes de reintentar
- Los scripts manejan esto automáticamente
- El script maestro incluye delays apropiados

### Autenticación
- Los tokens JWT expiran después de cierto tiempo
- Si recibes errores 401, obtén un nuevo token desde las DevTools del navegador
- Actualiza `AUTH_TOKEN` en `config.sh`

### Datos de Prueba
- Los scripts usan un transcript de muestra definido en `config.sh`
- Puedes modificar `SAMPLE_TRANSCRIPT` para usar diferentes datos
- Asegúrate de que el `LEAD_ID` y `CONVERSATION_ID` existan en tu base de datos

## 🐛 Troubleshooting

### Error: "command not found: jq"
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# CentOS/RHEL
sudo yum install jq
```

### Error: "Permission denied"
```bash
chmod +x *.sh
```

### Error 401: "Invalid or expired token"
1. Abre las DevTools del navegador (F12)
2. Ve a Application/Storage → Cookies
3. Copia el valor de `auth_token`
4. Actualiza `AUTH_TOKEN` en `config.sh`

### Error 404: "Lead not found"
Verifica que `LEAD_ID` y `CONVERSATION_ID` en `config.sh` correspondan a datos existentes en tu base de datos.

## 📝 Logs y Debugging

Los scripts muestran información detallada incluyendo:
- Status HTTP de cada petición
- Tiempo de respuesta
- Datos extraídos del análisis
- Errores específicos si ocurren

Para debugging adicional, puedes agregar `-v` a los comandos curl en los scripts para obtener más información detallada.