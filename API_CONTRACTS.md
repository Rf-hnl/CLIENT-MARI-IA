# Contratos de API - Antes vs Después de la Migración

## 📝 Resumen de Cambios

La migración a agente estático elimina el parámetro `agentId` de todos los endpoints de llamadas, simplificando significativamente los contratos de API.

## 🔧 Endpoint Principal: POST /api/leads/[id]/call

### ❌ ANTES (Sistema Dinámico)
```typescript
// Request Body
interface CallRequest {
  agentId: string;        // ⚠️ REQUERIDO - ID del agente seleccionado
  callType?: string;      // opcional, default: 'prospecting'  
  notes?: string;         // opcional
}

// Ejemplo de uso
const response = await fetch('/api/leads/123/call', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agentId: 'agent_abc123',  // ⚠️ Usuario debía seleccionar
    callType: 'prospecting',
    notes: 'Follow up call'
  })
});
```

### ✅ DESPUÉS (Sistema Estático)
```typescript
// Request Body  
interface CallRequest {
  // agentId: ELIMINADO ❌
  callType?: string;      // opcional, default: 'prospecting'
  notes?: string;         // opcional
}

// Ejemplo de uso
const response = await fetch('/api/leads/123/call', {
  method: 'POST', 
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    // No más agentId ✅
    callType: 'prospecting',
    notes: 'Follow up call'
  })
});
```

## 🔄 Comportamiento de Compatibilidad

### Requests Legacy con `agentId`
```typescript
// ⚠️ Request legacy - aún funciona pero se ignora
const legacyRequest = {
  agentId: 'agent_old_123',  // 🟡 Se IGNORA y se loggea warning
  callType: 'prospecting',
  notes: 'Call notes'
};

// ✅ Resultado: La llamada se ejecuta normalmente usando el agente de ENV
// 📝 Log: "Client-sent agentId ignored, using ENV agent"
```

## 📊 Response Bodies (Sin Cambios)

### Llamada Exitosa
```json
{
  "success": true,
  "callLog": {
    "id": "call-log-uuid",
    "leadId": "lead-uuid", 
    "agentId": "agent_from_env",      // ✅ Siempre del ENV ahora
    "agentName": "Agent Name from ElevenLabs",
    "status": "initiating",
    "callType": "prospecting",
    "elevenLabsBatchId": "batch-123"
  },
  "elevenLabsResponse": {
    "batchId": "batch-123",
    "status": "pending",
    "totalCalls": 1,
    "agentName": "Agent Name"
  }
}
```

### Errores Nuevos
```json
// ❌ Error por configuración faltante
{
  "error": "Agent configuration invalid",
  "details": "ELEVENLABS_AGENT_ID is required"
}

// ❌ Error por agente no encontrado en ElevenLabs  
{
  "error": "ENV Agent not found in ElevenLabs"
}
```

## 🗑️ Endpoints Eliminados Completamente

### Gestión de Agentes (Ya No Disponibles)
```typescript
// ❌ Todos estos endpoints han sido ELIMINADOS:

// CRUD de agentes unificados
DELETE /api/agents/unified/**
GET    /api/agents/unified/**
POST   /api/agents/unified/**  
PUT    /api/agents/unified/**

// Listado y disponibilidad
GET    /api/agents/available
GET    /api/agents/references  
POST   /api/agents/references

// Agentes específicos por tipo
GET    /api/agents/voice/**
GET    /api/analysis-agents/**
GET    /api/tenant/agents/**

// ⚠️ Estos endpoints ahora retornan 404 Not Found
```

## 🔍 GET /api/leads/[id]/call (Sin Cambios Funcionales)

### Request Parameters
```typescript
// Query parameters (sin cambios)
const url = `/api/leads/123/call?batchId=batch-456`;

// ✅ Funcionamiento idéntico
// - Sin batchId: retorna todas las llamadas del lead
// - Con batchId: retorna estado específico de ElevenLabs
```

### Internal Changes (No Afectan API)
- Ahora usa `getAgentConfig()` en lugar de buscar en DB
- ElevenLabs API calls usan credentials de ENV

## 🔨 Cambios en Headers y Auth

### Sin Cambios
```typescript
// ✅ Headers de autenticación idénticos
const headers = {
  'Authorization': `Bearer ${jwt_token}`,
  'Content-Type': 'application/json'
};

// ✅ Validación de tenant/usuario idéntica  
// ✅ Estructura de respuesta idéntica
```

## 📋 Migration Guide para Clientes

### Para Frontend/UI
```typescript
// ❌ ANTES: Necesitaba selección de agente
const [selectedAgent, setSelectedAgent] = useState<string>('');

const initiateCall = async () => {
  await fetch(`/api/leads/${leadId}/call`, {
    method: 'POST',
    body: JSON.stringify({
      agentId: selectedAgent, // ⚠️ Era requerido
      callType,
      notes
    })
  });
};

// ✅ DESPUÉS: Simplificado
const initiateCall = async () => {
  await fetch(`/api/leads/${leadId}/call`, {
    method: 'POST',
    body: JSON.stringify({
      // agentId no es necesario ✅
      callType,
      notes  
    })
  });
};
```

### Para Scripts/Automatización
```bash
# ❌ ANTES: Script requería agentId
curl -X POST /api/leads/123/call \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"agentId":"agent_abc123","callType":"prospecting"}'

# ✅ DESPUÉS: Simplificado
curl -X POST /api/leads/123/call \
  -H "Authorization: Bearer $TOKEN" \  
  -d '{"callType":"prospecting"}'
```

## ⚠️ Breaking Changes Summary

| Aspecto | Impacto | Acción Requerida |
|---------|---------|------------------|
| `agentId` parameter | 🟡 **Soft Breaking** | Remover de requests (opcional) |
| Agent selection UI | 🔴 **Hard Breaking** | Eliminar selectors de agente |
| `/api/agents/**` endpoints | 🔴 **Hard Breaking** | Actualizar código que los use |
| Environment variables | 🔴 **Hard Breaking** | Configurar `ELEVENLABS_*` vars |
| Call functionality | 🟢 **No Breaking** | Funciona igual |

## 🧪 Ejemplos de Testing

### Test de Compatibilidad
```typescript
// ✅ Verificar que requests legacy aún funcionan
test('should ignore legacy agentId parameter', async () => {
  const response = await request(app)
    .post('/api/leads/123/call')
    .send({
      agentId: 'ignored-agent-id',  // Se ignora
      callType: 'prospecting'
    });
    
  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
  // Verificar que se usó el agente de ENV, no el enviado
});
```

### Test de Configuración
```typescript  
// ✅ Verificar manejo de configuración inválida
test('should fail with invalid agent config', async () => {
  // Temporarily unset env vars
  delete process.env.ELEVENLABS_AGENT_ID;
  
  const response = await request(app)
    .post('/api/leads/123/call')
    .send({ callType: 'prospecting' });
    
  expect(response.status).toBe(500);
  expect(response.body.error).toContain('configuration invalid');
});
```

---
**📝 Nota**: Los cambios mantienen backward compatibility para el parámetro `agentId`, pero la funcionalidad core se simplifica significativamente al usar un agente único desde variables de entorno.




