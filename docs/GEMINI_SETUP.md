# 🤖 Configuración de Google Gemini como Fallback

## 📋 Resumen

Google Gemini se ha configurado como proveedor alternativo automático cuando OpenAI falle por cuota agotada o rate limits.

### 🎯 **Beneficios de Gemini:**
- ✅ **GRATIS**: Hasta 15 requests/minuto y 1 millón tokens/mes
- ✅ **Rápido**: Gemini 1.5 Flash es muy veloz
- ✅ **Inteligente**: Capacidades similares a GPT-4
- ✅ **Sin cuotas**: No necesita tarjeta de crédito para comenzar

## 🔧 **Configuración Paso a Paso**

### **1. Obtener API Key de Google**

1. **Ve a Google AI Studio:** https://makersuite.google.com/app/apikey

2. **Inicia sesión** con tu cuenta Google

3. **Crea nueva API Key:**
   - Click en "Create API Key"
   - Selecciona un proyecto existente o crea uno nuevo
   - La key se generará automáticamente

4. **Copia la API Key** (formato: `AIza...`)

### **2. Configurar Variables de Entorno**

Edita tu archivo `.env.local`:

```bash
# ===== GOOGLE GEMINI API CONFIGURATION (FALLBACK) =====
GEMINI_API_KEY=AIzaSyC_TU_API_KEY_AQUI
GEMINI_MODEL=gemini-1.5-flash
GEMINI_MAX_TOKENS=2048

# ===== FALLBACK CONFIGURATION =====
AI_FALLBACK_ENABLED=true
AI_PRIMARY_PROVIDER=openai
AI_SECONDARY_PROVIDER=gemini
```

### **3. Verificar Configuración**

El sistema funcionará automáticamente:

1. **Intenta OpenAI primero**
2. **Si falla** → Automáticamente usa Gemini
3. **Si ambos fallan** → Muestra error user-friendly

## 📊 **Cómo Funciona el Fallback**

```
🔄 Flujo de Análisis:

1. Usuario solicita análisis
   ↓
2. Sistema intenta OpenAI
   ↓
3. OpenAI falla (cuota agotada) ❌
   ↓
4. Automáticamente switch a Gemini ✅
   ↓
5. Análisis completado exitosamente
```

## 🎛️ **Configuración Avanzada**

### **Modelos Disponibles:**
- `gemini-1.5-flash` - **Recomendado**: Rápido y eficiente
- `gemini-1.5-pro` - Más potente pero más lento
- `gemini-pro` - Versión anterior

### **Límites de Gemini:**
```
Tier Gratuito:
- 15 requests por minuto
- 1 millón tokens por mes
- 32,000 tokens por request

Tier Pago:
- 360 requests por minuto  
- Hasta 2 millones tokens por mes
```

### **Personalizar Temperature:**
```typescript
// En multiAIProvider.ts puedes ajustar:
temperature: 0.3  // Más consistente (0.0-1.0)
temperature: 0.7  // Más creativo
```

## ⚡ **Ventajas del Sistema Multi-AI**

### **🔄 Disponibilidad 99.9%**
- Si OpenAI falla → Gemini continúa
- Si Gemini falla → Mensaje profesional (no "error de la app")
- Fallback transparente para el usuario

### **💰 Ahorro de Costos**
- Gemini es gratis para uso moderado
- Reduce dependencia de OpenAI pagado
- Balancea carga entre proveedores

### **🚀 Performance**
- Gemini Flash es muy rápido
- Respuestas en español excelentes  
- Análisis de calidad similar a GPT-4

## 🧪 **Testing**

### **Probar Fallback Manualmente:**
1. Deshabilita temporalmente OpenAI:
   ```bash
   # En .env.local
   OPENAI_API_KEY=invalid_key
   ```

2. Ejecuta un análisis

3. Deberías ver en logs:
   ```
   🔄 Intentando con openai (gpt-4o-mini)
   ❌ openai falló: Invalid API key
   🔄 Intentando con gemini (gemini-1.5-flash)  
   ✅ Éxito con gemini: 1250 caracteres
   ```

### **Scripts de Prueba:**
```bash
cd scripts/test-analysis
./test-simple.sh  # Probará automáticamente el fallback
```

## 🔍 **Logs y Debugging**

El sistema muestra logs detallados:

```bash
✅ OpenAI provider initialized
✅ Gemini provider initialized
🔧 MultiAI initialized with 2 providers: openai(gpt-4o-mini), gemini(gemini-1.5-flash)

🔄 Intentando con openai (gpt-4o-mini)
❌ openai falló: You exceeded your current quota
⚠️ openai sin cuota, marcando como no disponible temporalmente
🔄 Intentando con gemini (gemini-1.5-flash)
✅ Éxito con gemini: 1450 caracteres
✅ [ANALYZER] Multi-AI successful using gemini (gemini-1.5-flash)
```

## 🎯 **Siguiente Paso**

**¡Solo necesitas obtener tu Gemini API Key!**

1. Ve a: https://makersuite.google.com/app/apikey
2. Crea tu API key gratuita  
3. Pégala en `.env.local`
4. ¡Listo! El fallback funcionará automáticamente

El sistema está completamente configurado y funcionará transparentemente para tus usuarios.