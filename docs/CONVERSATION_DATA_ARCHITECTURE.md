# Arquitectura de Datos de Conversaciones

## Resumen Ejecutivo

El sistema de conversaciones utiliza una **arquitectura híbrida** que combina datos de dos fuentes:
1. **Base de datos local** (PostgreSQL/Supabase) - Almacena call logs con metadatos de llamadas
2. **API de ElevenLabs** - Contiene las conversaciones completas y transcripciones

## ⚠️ Comportamiento Normal: UI vs Base de Datos

**Discrepancia esperada**: El UI puede mostrar MÁS conversaciones que las que aparecen en la tabla `leadCallLog` de la base de datos.

### Ejemplo Real Documentado
- **UI muestra**: 18 conversaciones 
- **Base de datos**: 7 registros en `leadCallLog`
- **Diferencia**: 11 conversaciones adicionales vienen directamente de ElevenLabs API

**✅ ESTO ES NORMAL Y ESPERADO**

## Flujo de Datos Detallado

```mermaid
graph TD
    A[Cliente solicita conversaciones] --> B[GET /api/leads/[id]/conversations]
    B --> C[Verificar autenticación JWT]
    C --> D[Obtener call logs de BD local]
    D --> E[Sincronizar conversationId faltantes]
    E --> F[Filtrar call logs con conversationId]
    F --> G[Obtener agentes únicos]
    G --> H[Para cada agente: Consultar ElevenLabs API]
    H --> I[Filtrar conversaciones del lead]
    I --> J[Enriquecer con datos locales]
    J --> K[Combinar y ordenar por fecha]
    K --> L[Retornar conversaciones combinadas]
```

## Fuentes de Datos

### 1. Base de Datos Local (`leadCallLog`)
**Propósito**: Tracking y metadatos de llamadas iniciadas
**Contiene**:
- `id` - ID único local
- `leadId` - Referencia al lead
- `agentId` - ID del agente que hizo la llamada
- `conversationId` - ID de conversación en ElevenLabs (puede ser null)
- `elevenLabsBatchId` - ID del batch de llamadas
- `status` - Estado local de la llamada
- `callType` - Tipo de llamada
- `tenantId` - Para multi-tenancy

### 2. API de ElevenLabs
**Propósito**: Conversaciones completas, transcripciones y análisis
**Contiene**:
- Conversaciones detalladas con mensajes
- Transcripciones completas
- Análisis y resúmenes de llamadas
- Métricas de duración y éxito
- Estados actualizados en tiempo real

## Proceso de Sincronización

### 1. Sincronización de `conversationId`
Si un `leadCallLog` no tiene `conversationId`:
```typescript
// Se consulta el batch en ElevenLabs
const batchResponse = await fetch(`/v1/convai/batch-calling/${elevenLabsBatchId}`);
// Se extrae el conversationId del primer recipient
const conversationId = batchData.recipients[0].conversation_id;
// Se actualiza en la BD local
await prisma.leadCallLog.update({ data: { conversationId } });
```

### 2. Obtención de Conversaciones
```typescript
// Se consultan todas las conversaciones del agente en ElevenLabs
const conversationsUrl = `/v1/convai/conversations?agent_id=${agentId}`;
// Se filtran las que corresponden al lead específico
const leadConversations = conversations.filter(conv => 
  callLogs.find(log => log.conversationId === conv.conversation_id)
);
```

## Casos de Uso y Comportamientos

### ✅ Casos Normales
1. **Más conversaciones en UI que en BD**: Normal, algunas conversaciones pueden no estar trackeadas localmente
2. **Conversaciones sin transcripción**: Llamadas fallidas o en proceso
3. **Estados diferentes entre local y ElevenLabs**: ElevenLabs es la fuente de verdad para estados

### ❌ Casos que Requieren Investigación
1. **Menos conversaciones en UI que en BD**: Posible problema de conectividad con ElevenLabs
2. **Error 401/403 en ElevenLabs**: Problemas de autenticación o configuración
3. **Conversaciones duplicadas**: Problema en el filtrado por `conversationId`

## Configuración Requerida

### Variables de Entorno
```env
JWT_SECRET=your-jwt-secret
```

### Base de Datos
- Tabla `elevenLabsConfig` con configuración activa
- Tabla `leadCallLog` con registros de llamadas
- Tabla `tenant` para multi-tenancy

### ElevenLabs
- API Key válida en `elevenLabsConfig`
- Agentes configurados y activos
- Permisos de API para consultar conversaciones

## Logs y Debugging

El endpoint incluye logs detallados:
```
🔍 [LEAD CONVERSATIONS] Getting conversations for lead: {leadId}
📞 [LEAD CONVERSATIONS] Found call logs: {count}
🤖 [LEAD CONVERSATIONS] Agents that called this lead: {agentIds}
✅ [LEAD CONVERSATIONS] Found {count} conversations for agent {agentId}
📊 [LEAD CONVERSATIONS] Data sources breakdown:
   - Call logs in DB: {dbCount}
   - Conversations from ElevenLabs: {apiCount}
   - Difference: {difference}
```

## Troubleshooting

### Problema: "No hay conversaciones disponibles"
**Posibles causas**:
1. No hay `conversationId` en los call logs → Se ejecuta sincronización automática
2. Configuración de ElevenLabs inactiva → Verificar `elevenLabsConfig.isActive = true`
3. Error de conectividad → Revisar logs de la API

### Problema: Discrepancia de números
**Verificar**:
1. ¿Los call logs tienen `conversationId`? → Si no, se sincronizarán automáticamente
2. ¿La configuración de ElevenLabs es correcta? → Verificar API key y URL
3. ¿Los agentes existen en ElevenLabs? → Verificar `agentId` válidos

### Problema: Conversaciones vacías o sin transcripción
**Causas normales**:
- Llamadas fallidas (`call_successful: 'failure'`)
- Llamadas sin respuesta
- Conversaciones aún procesándose en ElevenLabs

## Componentes Relacionados

### Frontend
- `LeadConversationsTab.tsx` - UI principal de conversaciones
- `useLeadConversations.ts` - Hook para cargar conversaciones
- `useConversationTranscript.ts` - Hook para transcripciones específicas

### Backend
- `/api/leads/[id]/conversations/route.ts` - Endpoint principal
- `/api/leads/[id]/conversations/[conversationId]/transcript/route.ts` - Transcripciones

### Base de Datos
- `leadCallLog` - Registro de llamadas locales
- `elevenLabsConfig` - Configuración de la API
- `tenant` - Multi-tenancy

## Conclusión

La arquitectura híbrida es **por diseño** y permite:
- **Flexibilidad**: No todas las conversaciones necesitan estar en BD local
- **Escalabilidad**: ElevenLabs maneja el procesamiento pesado
- **Consistencia**: Los call logs locales mantienen la trazabilidad
- **Real-time**: Estados y transcripciones siempre actualizados desde ElevenLabs

**La discrepancia entre UI y BD local es comportamiento esperado y correcto.**