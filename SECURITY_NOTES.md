# Notas de Seguridad - Migración a Agente Estático

## 🔒 Resumen de Mejoras de Seguridad

Esta migración ha eliminado **múltiples vulnerabilidades de seguridad** relacionadas con API keys hardcoded y gestión insegura de credenciales.

## 🚨 API Keys Hardcoded Eliminadas

### Scripts Removidos (Contenían Credenciales Expuestas)
```bash
# ❌ ELIMINADOS - Contenían sk_e482a25076ad433018000633b640343c721c0bb8d608057b
scripts/verify-agent-structure.js
scripts/verify-batch-calling-api.js  
scripts/update-maria-agent.js
scripts/migrate-agent-tools.js
scripts/force-migrate-tools.js
```

### ⚠️ Riesgo Anterior
```javascript
// ❌ ANTES: API key expuesta en código
const ELEVENLABS_API_KEY = "sk_e482a25076ad433018000633b640343c721c0bb8d608057b";
// 🚨 RIESGO: Credencial committeada en Git, accesible por cualquier developer
```

### ✅ Solución Implementada
```javascript
// ✅ DESPUÉS: Credentials desde environment
import { getAgentConfig } from '@/lib/config/agentConfig';
const { apiKey } = getAgentConfig(); // Desde ENV, validado, y protegido
```

## 🔐 Gestión de Credenciales Mejorada

### Antes: Múltiples Puntos de Fallo
- ❌ API keys en scripts de desarrollo
- ❌ Credenciales en base de datos sin cifrado
- ❌ Múltiples agentes = múltiples credentials  
- ❌ No validación central de configuración
- ❌ Posible exposición en logs de debug

### Después: Centralizado y Seguro
- ✅ **Una sola fuente de verdad**: Variables de entorno
- ✅ **Validación centralizada**: `getAgentConfig()` con Zod
- ✅ **Fail-fast**: Aplicación falla si configuración inválida
- ✅ **No persiste credenciales**: Solo en memoria durante ejecución
- ✅ **Logs seguros**: No se loggean credenciales

## 🛡️ Implementación de Seguridad

### Validación Robusta con Zod
```typescript
// lib/config/agentConfig.ts
import { z } from "zod";

const AgentConfigSchema = z.object({
  apiKey: z.string().min(1, "ELEVENLABS_API_KEY is required"),    // ✅ Validado
  agentId: z.string().min(1, "ELEVENLABS_AGENT_ID is required"), // ✅ Validado
  phoneId: z.string().min(1, "ELEVENLABS_PHONE_ID is required"), // ✅ Validado
  apiUrl: z.string().url().default("https://api.elevenlabs.io"), // ✅ URL válida
});

export function getAgentConfig(): AgentConfig {
  try {
    return AgentConfigSchema.parse({
      apiKey: process.env.ELEVENLABS_API_KEY,     // ✅ Solo de ENV
      agentId: process.env.ELEVENLABS_AGENT_ID,   
      phoneId: process.env.ELEVENLABS_PHONE_ID,   
      apiUrl: process.env.ELEVENLABS_API_URL || "https://api.elevenlabs.io"
    });
  } catch (error) {
    // ✅ Falla con mensaje claro pero sin exponer valores
    throw new Error(`Agent configuration invalid: ${error.message}`);
  }
}
```

### Manejo Seguro de Errores
```typescript
// ✅ BUENO: Error messages no exponen credentials
try {
  const config = getAgentConfig();
} catch (error) {
  // Error: "ELEVENLABS_API_KEY is required"
  // 🚫 NO expone: valor actual, attempts, etc.
}

// ✅ BUENO: Logs seguros
console.log('✅ Agent configured:', config.agentId.slice(-8)); // Solo últimos 8 chars
// 🚫 NO loggea: apiKey, phoneId completos
```

## 🔍 Surface de Ataque Reducida

### Antes: Múltiples Vectores de Ataque
- 🚨 **Git History**: API keys committeadas
- 🚨 **Database**: Credenciales en tablas  
- 🚨 **Logs**: Posibles exposiciones en debug
- 🚨 **UI**: Múltiples endpoints de gestión
- 🚨 **Scripts**: Archivos con credentials hardcoded

### Después: Superficie Mínima
- ✅ **Env Variables**: Solo método de configuración
- ✅ **Single Source**: Un punto de validación/acceso  
- ✅ **Fail Safe**: Sin fallbacks inseguros
- ✅ **No Persistence**: No guarda credenciales en DB
- ✅ **Clean Logs**: Sin exposición accidental

## 🔒 Mejores Prácticas Implementadas

### 1. Principio de Menor Privilegio
```bash
# Solo las variables necesarias
ELEVENLABS_API_KEY=sk_xxx    # Requerido
ELEVENLABS_AGENT_ID=agent_xxx # Requerido  
ELEVENLABS_PHONE_ID=phone_xxx # Requerido
# ELEVENLABS_API_URL=...      # Opcional, default seguro
```

### 2. Validación Temprana (Fail-Fast)
```typescript
// ✅ Validar al inicio de la aplicación
export async function validateEnvironment() {
  try {
    getAgentConfig();
    console.log('✅ Agent configuration valid');
  } catch (error) {
    console.error('❌ STARTUP FAILED:', error.message);
    process.exit(1); // ✅ Fail-fast, no partial functionality
  }
}
```

### 3. Logging Seguro
```typescript
// ✅ BUENO: Log outcomes, not credentials
console.log('🚀 [LEAD CALL] Using ENV agent:', agentConfig.agentId);
console.log('✅ [LEAD CALL] Agent info from ElevenLabs:', agentInfo.name);

// 🚫 NUNCA: 
// console.log('API Key:', agentConfig.apiKey); // ❌
// console.log('Full config:', agentConfig);    // ❌
```

### 4. Error Handling Defensivo
```typescript
// ✅ Errores informativos pero seguros
catch (error) {
  if (error instanceof z.ZodError) {
    const missingFields = error.errors.map(e => e.message).join(', ');
    throw new Error(`Agent configuration invalid: ${missingFields}`);
    // ✅ Dice QUÉ falta, NO cuáles son los valores actuales
  }
  throw error;
}
```

## 🔧 Configuración Segura del Entorno

### Variables de Entorno de Producción
```bash
# ✅ En production/staging - usar secret management
ELEVENLABS_API_KEY=$(vault kv get -field=api_key secret/elevenlabs)
ELEVENLABS_AGENT_ID=$(vault kv get -field=agent_id secret/elevenlabs)  
ELEVENLABS_PHONE_ID=$(vault kv get -field=phone_id secret/elevenlabs)

# ✅ O usando herramientas como Docker secrets, K8s secrets, etc.
```

### Variables de Desarrollo
```bash
# .env.local (gitignored)
ELEVENLABS_API_KEY=sk_development_key_here
ELEVENLABS_AGENT_ID=agent_development_id_here
ELEVENLABS_PHONE_ID=phone_development_id_here
```

## ⚠️ Alertas de Seguridad

### Monitorear por Intentos de Acceso Legacy
```bash
# Buscar logs de agents API que ya no existen (posibles ataques)
grep -i "GET.*\/api\/agents" /var/log/app.log | head -20
```

### Verificar No Exposición de Credenciales
```bash
# Verificar que no se loggean credentials
grep -i "sk_" /var/log/app.log    # No debe encontrar nada
grep -i "api.*key" /var/log/app.log # Solo logs seguros
```

## 🧪 Testing de Seguridad

### Test de Configuración Faltante
```typescript
test('should fail securely without config', async () => {
  // Remove env vars temporarily
  const originalKey = process.env.ELEVENLABS_API_KEY;
  delete process.env.ELEVENLABS_API_KEY;
  
  expect(() => getAgentConfig()).toThrow('ELEVENLABS_API_KEY is required');
  // ✅ Error claro pero sin exponer información
  
  // Restore
  process.env.ELEVENLABS_API_KEY = originalKey;
});
```

### Test de Logs Seguros
```typescript
test('should not log sensitive information', async () => {
  const logSpy = jest.spyOn(console, 'log');
  
  const config = getAgentConfig();
  expect(logSpy).not.toHaveBeenCalledWith(
    expect.stringContaining(config.apiKey)
  );
  // ✅ API key nunca debe aparecer en logs
});
```

## 📋 Checklist de Seguridad

### Pre-Deploy
- [ ] ✅ Todas las API keys hardcoded eliminadas
- [ ] ✅ Variables de entorno configuradas en production
- [ ] ✅ Tests de seguridad pasando
- [ ] ✅ No credentials en Git history
- [ ] ✅ Error handling no expone información sensible

### Post-Deploy  
- [ ] ✅ Logs no muestran credenciales
- [ ] ✅ Endpoints obsoletos retornan 404
- [ ] ✅ Configuración valida correctamente
- [ ] ✅ No información sensible en responses de error
- [ ] ✅ Monitoreo configurado para intentos de acceso legacy

## 🚨 Incidentes de Seguridad Resueltos

### Credenciales Expuestas en Git
```bash
# ❌ ANTES: API key commiteada múltiples veces
git log --grep="sk_e482a25076ad433018000633b640343c721c0bb8d608057b"

# ✅ DESPUÉS: Credenciales solo en environment
# 📝 RECOMENDACIÓN: Rotar API key expuesta si aún está activa
```

### Múltiples Puntos de Gestión
- ❌ ANTES: Scripts, DB, UI, APIs con diferentes niveles de seguridad
- ✅ DESPUÉS: Un solo punto controlado y validado

---

**🔒 Nota Final**: Esta migración elimina significativamente la superficie de ataque relacionada con gestión de credenciales de ElevenLabs, centralizando toda la configuración en variables de entorno con validación robusta.