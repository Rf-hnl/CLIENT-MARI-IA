# Auditoría del Sistema de "Agentes ElevenLabs" - Plan de Migración a Variables de Entorno

## Resumen Ejecutivo

El sistema actual implementa un complejo stack de gestión de agentes con múltiples tablas, interfaces de usuario completas, y una arquitectura que permite crear/editar/guardar agentes desde la aplicación. Tras la auditoría, se identificaron **13 modelos Prisma**, **34+ endpoints API**, **50+ componentes UI**, y **10+ hooks/servicios** relacionados con el manejo de agentes.

La migración propuesta simplifica drasticamente este stack reemplazando toda la gestión dinámica con un solo agente configurado desde variables de entorno, eliminando ~90% del código relacionado con agentes y reduciendo la complejidad significativamente.

## 1. Inventario de Código

### A. Modelos Prisma y Tablas de Base de Datos

| Archivo | Tipo | Responsabilidad | Importaciones Clave | Impacto si Eliminamos |
|---------|------|----------------|---------------------|----------------------|
| `prisma/schema.prisma:132` | modelo Prisma | `UnifiedAgent` - tabla principal de agentes | Relations con Organization, Tenant | 🔴 ALTO - Núcleo del sistema |
| `prisma/schema.prisma:175` | modelo Prisma | `VoiceAgent` - agentes de voz (DEPRECATED) | UnifiedAgent relation | 🟡 MEDIO - Marcado como deprecated |a
| `prisma/schema.prisma:192` | modelo Prisma | `AgentReference` - nuevas referencias simplificadas | Tenant, Organization, elevenlabs_agent_id | 🔴 ALTO - Sistema actual de llamadas |
| `prisma/schema.prisma:281-436` | modelos Prisma | 9 tablas específicas: AnalysisAgent, WritingAgent, CustomerAgent, MarketingAgent, SalesAgent, SupportAgent, DataAgent, AutomationAgent, ExtendedAgent | Todas con UnifiedAgent relation | 🟠 MEDIO - Solo si se usan |
| `prisma/schema.prisma:576` | modelo Prisma | `AgentUsageLog` - logs de uso | Agent, AgentReference relations | 🟠 MEDIO - Estadísticas se pierden |

### B. API Routes (Endpoints CRUD)

| Archivo | Tipo | Responsabilidad | Importaciones Clave | Impacto si Eliminamos |
|---------|------|----------------|---------------------|----------------------|
| `app/api/agents/unified/list/route.ts` | API route | GET agentes con datos frescos de ElevenLabs | prisma, ElevenLabsConfig | 🔴 ALTO - UI principal |
| `app/api/agents/unified/create/route.ts` | API route | POST crear agentes nuevos | transacciones Prisma | 🔴 ALTO - Formularios de creación |
| `app/api/agents/unified/[id]/route.ts` | API route | GET/PUT/DELETE agente específico | -- | 🔴 ALTO - Edición/eliminación |
| `app/api/agents/unified/[id]/toggle/route.ts` | API route | POST activar/desactivar | -- | 🟡 MEDIO - Feature de estado |
| `app/api/agents/available/route.ts` | API route | GET agentes disponibles para llamadas | AgentReference table | 🔴 ALTO - Modal de selección |
| `app/api/agents/references/route.ts` | API route | CRUD de referencias de agentes | -- | 🔴 ALTO - Sistema actual |
| `app/api/agents/voice/direct-list/route.ts` | API route | GET agentes de voz directos | -- | 🟡 MEDIO - Listado específico |
| `app/api/analysis-agents/route.ts` | API route | CRUD agentes de análisis | -- | 🟠 MEDIO - Si se usan |
| `app/api/tenant/agents/elevenlabs/list/route.ts` | API route | GET agentes por tenant | ElevenLabsConfig | 🔴 ALTO - Listado por tenant |
| `app/api/tenant/analysis-agents/*` | API route | 3 endpoints para análisis | -- | 🟠 MEDIO - Si se usan |

### C. Componentes UI para Gestión de Agentes

| Archivo | Tipo | Responsabilidad | Importaciones Clave | Impacto si Eliminamos |
|---------|------|----------------|---------------------|----------------------|
| `app/(private)/agents/page.tsx` | página principal | Dashboard principal de agentes | UnifiedAgentsProvider | 🔴 ALTO - Página completa |
| `app/(private)/agents/components/UnifiedAgentsList.tsx` | componente | Lista unificada de agentes | useUnifiedAgents | 🔴 ALTO - Vista principal |
| `app/(private)/agents/components/AgentsList.tsx` | componente | Lista genérica de agentes | -- | 🔴 ALTO - Reutilizable |
| `app/(private)/agents/components/AgentForm.tsx` | componente | Formulario de creación/edición | -- | 🔴 ALTO - CRUD forms |
| `app/(private)/agents/components/AgentFormModal.tsx` | componente | Modal de formulario | -- | 🔴 ALTO - Modal principal |
| `app/(private)/agents/components/AgentCreationModal.tsx` | componente | Modal de creación | -- | 🔴 ALTO - Creación |
| `app/(private)/agents/components/UniversalAgentCreationModal.tsx` | componente | Modal universal | -- | 🔴 ALTO - Nueva arquitectura |
| `app/(private)/agents/components/VoiceAgentCreationModal.tsx` | componente | Modal específico para voz | ElevenLabs APIs | 🔴 ALTO - Voz específico |
| `app/(private)/agents/components/AnalysisAgentCreationModal.tsx` | componente | Modal para análisis | -- | 🟠 MEDIO - Si se usa |
| `app/(private)/agents/components/VoiceAgentsSection.tsx` | componente | Sección de agentes de voz | -- | 🔴 ALTO - Sección principal |
| `app/(private)/agents/components/ElevenLabsConfigSection.tsx` | componente | Configuración de ElevenLabs | useElevenLabsConfig | 🟡 MEDIO - Config puede conservarse |
| `app/(private)/agents/components/AgentsStats.tsx` | componente | Estadísticas de agentes | -- | 🟠 MEDIO - Dashboards |
| `components/leads/AgentSelectionModal.tsx` | componente | Selección de agente para llamadas | useAuth, Lead calls | 🔴 ALTO - Llamadas manuales |

### D. Hooks y Servicios

| Archivo | Tipo | Responsabilidad | Importaciones Clave | Impacto si Eliminamos |
|---------|------|----------------|---------------------|----------------------|
| `modules/agents/context/UnifiedAgentsContext.tsx` | contexto | Contexto principal para agentes | Prisma APIs | 🔴 ALTO - State management global |
| `modules/agents/context/AgentsContext.tsx` | contexto | Contexto legacy | -- | 🟡 MEDIO - Si aún se usa |
| `modules/agents/hooks/useAgents.ts` | hook | Hook principal para agentes | API calls | 🔴 ALTO - CRUD operations |
| `modules/agents/hooks/useEnrichedAgents.ts` | hook | Hook con datos enriquecidos | ElevenLabs API | 🔴 ALTO - Llamadas con datos frescos |
| `modules/agents/hooks/useLightweightAgents.ts` | hook | Hook optimizado | -- | 🟠 MEDIO - Performance |
| `modules/agents/hooks/useSelectiveAgents.ts` | hook | Hook con filtros | -- | 🟠 MEDIO - Filtrado |
| `modules/agents/hooks/useAnalysisAgents.ts` | hook | Hook específico análisis | -- | 🟠 MEDIO - Si se usa |
| `modules/agents/hooks/useElevenLabsConfig.ts` | hook | Hook configuración ElevenLabs | Config API | 🟡 MEDIO - Config se mantiene |
| `modules/agents/hooks/useVoiceManager.ts` | hook | Gestión de voz | ElevenLabsProvider | 🟡 MEDIO - Calling logic |

### E. Tipos TypeScript

| Archivo | Tipo | Responsabilidad | Importaciones Clave | Impacto si Eliminamos |
|---------|------|----------------|---------------------|----------------------|
| `types/unifiedAgents.ts` | tipos | Definiciones principales | -- | 🔴 ALTO - Types core |
| `types/agents.ts` | tipos | Tipos legacy de agentes | elevenlabs.ts | 🔴 ALTO - Compatibilidad |
| `types/elevenlabs.ts` | tipos | Tipos de ElevenLabs | -- | 🟡 MEDIO - API types se conservan |
| `types/analysisAgents.ts` | tipos | Tipos específicos análisis | -- | 🟠 MEDIO - Si se usa |
| `types/writingAgents.ts` | tipos | Tipos específicos escritura | -- | 🟠 MEDIO - Si se usa |

## 2. Diagrama de Flujo Actual

### Flujo de Creación de Agente:
```
1. Usuario accede a /agents
   └─ UnifiedAgentsProvider carga contexto
   └─ AgentsPage renderiza dashboard
   
2. Usuario hace clic "Crear Agente"
   └─ UniversalAgentCreationModal se abre
   └─ Selecciona categoría (voice, analysis, writing, etc.)
   
3. Usuario llena formulario
   └─ AgentForm con campos específicos por categoría
   └─ Validación en cliente
   
4. Submit formulario
   └─ POST /api/agents/unified/create
   └─ Transacción Prisma:
       ├─ Crear UnifiedAgent (tabla principal)
       └─ Crear registro específico (VoiceAgent, AnalysisAgent, etc.)
   
5. Respuesta exitosa
   └─ Actualizar contexto local
   └─ Refrescar lista de agentes
   └─ Cerrar modal
```

### Flujo de Llamada a Lead:
```
1. Usuario selecciona lead en LeadsTable
   └─ Hace clic en "Call" button
   
2. AgentSelectionModal se abre
   └─ GET /api/agents/available 
   └─ Carga AgentReference + datos frescos de ElevenLabs API
   └─ Muestra lista de agentes disponibles
   
3. Usuario selecciona agente
   └─ POST /api/leads/[id]/call
   └─ Validaciones:
       ├─ Agent exists en AgentReference
       ├─ ElevenLabsConfig está activa
       └─ Agent disponible en ElevenLabs API
   
4. Preparar llamada
   └─ Obtener variables dinámicas (lead, organization data)
   └─ POST a ElevenLabs batch-calling API
   
5. Crear registros locales
   └─ LeadCallLog con elevenLabsBatchId
   └─ Actualizar AgentReference stats
   └─ Actualizar Lead contactAttempts
```

### Flujo de Listado y Gestión:
```
1. Cargar agentes en dashboard
   └─ POST /api/agents/unified/list
   └─ Obtener AgentReference (voice agents)
   └─ Obtener UnifiedAgent (otros tipos)
   
2. Para cada voice agent:
   └─ GET ElevenLabs API /v1/convai/agents/[id]
   └─ Merge datos locales + datos frescos
   └─ Mostrar en UI con nombre real
   
3. Usuario puede:
   ├─ Editar agente → Modal + PUT /api/agents/unified/[id]
   ├─ Activar/Desactivar → POST /api/agents/unified/[id]/toggle
   ├─ Ver estadísticas → AgentsStats component
   └─ Eliminar → DELETE /api/agents/unified/[id]
```

## 3. Variables de Entorno Existentes

### Variables Encontradas en el Sistema:

```bash
# En scripts (hardcoded - PROBLEMA DE SEGURIDAD):
ELEVENLABS_API_KEY = "sk_e482a25076ad433018000633b640343c721c0bb8d608057b"

# En tipos y configuración:
ELEVENLABS_API_KEY     # API key principal
ELEVENLABS_API_URL     # URL base API (default: https://api.elevenlabs.io)
ELEVENLABS_PHONE_ID    # ID del teléfono por defecto
ELEVENLABS_AGENT_ID    # ID específico del agente (para migración)

# En prisma/seed.ts:
YOUR_ELEVENLABS_API_KEY    # Placeholder
YOUR_ELEVENLABS_PHONE_ID   # Placeholder

# En README.md:
ELEVENLABS_API_KEY=        # Documentado
```

### Variables Usadas En:
- `prisma/seed.ts:40-41` - Seed data con placeholders
- `scripts/*.js` - Scripts con API key hardcoded (SEGURIDAD)
- `types/elevenlabs.ts:7-9` - Definición de estructura
- Tablas `ElevenLabsConfig` en DB - Configuración por tenant

## 4. Mapa de Dependencias

### Si eliminamos `UnifiedAgent` model:
- ❌ `app/(private)/agents/page.tsx` - Página principal
- ❌ `UnifiedAgentsContext` - Context principal  
- ❌ `useUnifiedAgents` - Hook principal
- ❌ Todos los modales de creación/edición
- ❌ `UnifiedAgentsList` component
- ❌ 9 tablas específicas (AnalysisAgent, WritingAgent, etc.)
- ❌ AgentUsageLog table

### Si eliminamos endpoints CRUD:
- ❌ Formularios de creación no funcionan
- ❌ Edición de agentes no funciona
- ❌ Toggle de estado no funciona
- ❌ Estadísticas no se actualizan

### Si eliminamos `AgentReference` model:
- ❌ `AgentSelectionModal` no funciona
- ❌ Llamadas a leads fallan
- ❌ `/api/leads/[id]/call` falla
- ❌ Sistema actual de calling completo

### Si eliminamos componentes UI:
- ❌ `/agents` página queda vacía
- ❌ No hay forma de gestionar agentes desde UI
- ❌ Dashboard de agentes no funciona

## 5. Riesgos y Edge Cases

### A. Riesgos de Data Loss:
- **AgentUsageLog**: Se pierden estadísticas históricas de uso
- **CustomConfiguration**: Configuraciones específicas de agentes
- **LocalTags**: Tags y metadatos locales
- **UsageRules**: Reglas específicas de negocio

### B. Edge Cases:
- **Seeds/Fixtures**: `prisma/seed.ts` crea agentes por defecto
- **Migraciones**: Scripts existentes modifican agentes
- **Tests**: Tests que dependen de agentes específicos
- **Webhooks**: Callbacks que esperan `agentId`
- **Batch Jobs**: Jobs que procesan agentes
- **Analytics**: Dashboards que usan estadísticas

### C. Referencias Externas:
- **LeadCallLog.agentId**: Referencias en logs de llamadas
- **Lead.assignedAgentId**: Leads asignados a agentes específicos  
- **Webhooks de ElevenLabs**: Pueden enviar agentId específicos
- **Colas de trabajo**: Jobs que referencian agentes

## 6. Plan de Deprecación

### Fase 1: Preparación (Feature Flag)
```bash
# Nuevas variables de entorno
USE_ENV_AGENT=true              # Feature flag para transición
ELEVENLABS_AGENT_ID=agent_xxx   # ID del agente único
ELEVENLABS_VOICE_ID=voice_yyy   # ID de la voz (opcional)
ELEVENLABS_PHONE_ID=phone_zzz   # ID del teléfono (existente)
ELEVENLABS_API_KEY=sk_xxx       # API key (existente)
```

### Fase 2: Implementación del Nuevo Sistema

#### A. Crear `AgentConfig` utility:
```typescript
// lib/config/agentConfig.ts
import { z } from 'zod';

const AgentConfigSchema = z.object({
  agentId: z.string().min(1, 'ELEVENLABS_AGENT_ID is required'),
  voiceId: z.string().optional(),
  phoneId: z.string().min(1, 'ELEVENLABS_PHONE_ID is required'),
  apiKey: z.string().min(1, 'ELEVENLABS_API_KEY is required'),
  apiUrl: z.string().url().default('https://api.elevenlabs.io')
});

export type AgentConfig = z.infer<typeof AgentConfigSchema>;

export function getAgentConfig(): AgentConfig {
  const config = {
    agentId: process.env.ELEVENLABS_AGENT_ID,
    voiceId: process.env.ELEVENLABS_VOICE_ID,
    phoneId: process.env.ELEVENLABS_PHONE_ID,
    apiKey: process.env.ELEVENLABS_API_KEY,
    apiUrl: process.env.ELEVENLABS_API_URL || 'https://api.elevenlabs.io'
  };

  try {
    return AgentConfigSchema.parse(config);
  } catch (error) {
    throw new Error(`Agent configuration invalid: ${error.message}`);
  }
}
```

#### B. Reemplazar llamadas de selección de agente:
```typescript
// Antes:
const agentReference = await prisma.agentReference.findFirst({
  where: { tenantId, elevenLabsAgentId: agentId, isActive: true }
});

// Después:
const agentConfig = getAgentConfig();
const agentId = agentConfig.agentId;
```

#### C. Simplificar `/api/leads/[id]/call`:
```typescript
// Eliminar selección dinámica de agente
const { callType = 'prospecting', notes } = body; // Remover agentId
const agentConfig = getAgentConfig();

// Usar agente fijo
const batchCallRequest = {
  call_name: callName,
  agent_id: agentConfig.agentId, // Usar agente único
  agent_phone_number_id: agentConfig.phoneId,
  // ... resto igual
};
```

### Fase 3: Migración de Base de Datos

#### A. Backup crítico:
```sql
-- Backup de datos importantes
CREATE TABLE agent_usage_backup AS SELECT * FROM agent_usage_logs;
CREATE TABLE agent_references_backup AS SELECT * FROM agent_references;
CREATE TABLE unified_agents_backup AS SELECT * FROM unified_agents;
```

#### B. Migración Prisma propuesta:
```prisma
// prisma/migrations/xxx_drop-agent-entities/migration.sql

-- Verificaciones de seguridad
DO $$ 
BEGIN
  -- Verificar que no hay llamadas activas
  IF EXISTS (SELECT 1 FROM lead_call_logs WHERE status IN ('initiating', 'in_progress')) THEN
    RAISE EXCEPTION 'Cannot drop agent tables: active calls in progress';
  END IF;
  
  -- Verificar feature flag
  -- Esto sería verificado en código antes de ejecutar migración
END $$;

-- Eliminar constraints primero
ALTER TABLE agent_usage_logs DROP CONSTRAINT IF EXISTS agent_usage_logs_agent_id_fkey;
ALTER TABLE agent_usage_logs DROP CONSTRAINT IF EXISTS agent_usage_logs_agent_reference_id_fkey;

-- Eliminar tablas específicas de agentes
DROP TABLE IF EXISTS analysis_agents CASCADE;
DROP TABLE IF EXISTS writing_agents CASCADE;
DROP TABLE IF EXISTS customer_agents CASCADE;
DROP TABLE IF EXISTS marketing_agents CASCADE;
DROP TABLE IF EXISTS sales_agents CASCADE;
DROP TABLE IF EXISTS support_agents CASCADE;
DROP TABLE IF EXISTS data_agents CASCADE;
DROP TABLE IF EXISTS automation_agents CASCADE;
DROP TABLE IF EXISTS extended_agents CASCADE;
DROP TABLE IF EXISTS voice_agents CASCADE; -- DEPRECATED

-- Eliminar tabla de referencias  
DROP TABLE IF EXISTS agent_references CASCADE;

-- Eliminar tabla principal
DROP TABLE IF EXISTS unified_agents CASCADE;

-- Eliminar logs (opcional - puede mantenerse para análisis)
-- DROP TABLE IF EXISTS agent_usage_logs CASCADE;

-- Eliminar enum
DROP TYPE IF EXISTS "AgentCategory";
```

### Fase 4: Limpieza de Código

#### A. Eliminar endpoints:
- `app/api/agents/unified/**`
- `app/api/agents/available/**` 
- `app/api/agents/references/**`
- `app/api/agents/voice/**`
- `app/api/analysis-agents/**`
- `app/api/tenant/agents/**`

#### B. Eliminar componentes UI:
- `app/(private)/agents/page.tsx` → Redirigir a dashboard principal
- `app/(private)/agents/components/**` (excepto config)
- `components/leads/AgentSelectionModal.tsx` → Eliminar selección

#### C. Eliminar contextos y hooks:
- `modules/agents/context/UnifiedAgentsContext.tsx`
- `modules/agents/context/AgentsContext.tsx` 
- `modules/agents/hooks/useAgents.ts`
- `modules/agents/hooks/useEnrichedAgents.ts`
- Etc.

#### D. Actualizar navegación:
```typescript
// Eliminar de sidebar/menú:
- "Agents" menu item
- "Voice Agents" submenu
- "Analysis Agents" submenu
```

### Fase 5: Actualización de Tests

#### A. Mock `getAgentConfig()`:
```typescript
// tests/mocks/agentConfig.ts
export const mockAgentConfig = {
  agentId: 'test-agent-123',
  voiceId: 'test-voice-456', 
  phoneId: 'test-phone-789',
  apiKey: 'sk_test_key',
  apiUrl: 'https://api.elevenlabs.io'
};

jest.mock('@/lib/config/agentConfig', () => ({
  getAgentConfig: () => mockAgentConfig
}));
```

#### B. Actualizar tests de llamadas:
```typescript
// Eliminar tests de selección de agente
// Actualizar tests para usar agente fijo
// Verificar que configuración sea válida
```

## 7. Propuesta de Variables .env Final

```bash
# ElevenLabs Configuration (Required)
ELEVENLABS_API_KEY=sk_your_api_key_here
ELEVENLABS_AGENT_ID=agent_your_agent_id_here
ELEVENLABS_PHONE_ID=phone_your_phone_id_here

# ElevenLabs Configuration (Optional)
ELEVENLABS_API_URL=https://api.elevenlabs.io
ELEVENLABS_VOICE_ID=voice_optional_override

# Migration Feature Flag (Temporary)
USE_ENV_AGENT=true

# Existing configuration (keep)
JWT_SECRET=your_jwt_secret
DATABASE_URL=your_database_url
# ... other vars
```

## 8. Checklist de Preparación para Refactor

### Pre-refactor:
- [ ] Backup completo de base de datos
- [ ] Documentar agentes actualmente en uso
- [ ] Identificar agente principal para usar como único
- [ ] Crear rama `chore/use-env-agent-and-remove-agent-crud`
- [ ] Verificar que no hay llamadas activas en producción

### Durante refactor:
- [ ] Implementar `getAgentConfig()` utility con validación
- [ ] Actualizar `/api/leads/[id]/call` para usar agente único
- [ ] Eliminar `AgentSelectionModal` y reemplazar con confirmación simple
- [ ] Actualizar todos los componentes que consuman agentes
- [ ] Ejecutar tests en cada paso
- [ ] Crear migración Prisma con verificaciones de seguridad

### Post-refactor:
- [ ] Verificar que llamadas funcionan con agente único
- [ ] Ejecutar suite completa de tests
- [ ] Actualizar documentación de API
- [ ] Instruir al equipo sobre nuevas variables de entorno
- [ ] Monitorear logs por errores relacionados con agentes

### Verificaciones finales:
- [ ] `/agents` página redirige o muestra mensaje informativo
- [ ] Llamadas a leads funcionan sin selección de agente
- [ ] No hay referencias a tablas eliminadas en código
- [ ] Variables de entorno están documentadas
- [ ] Sistema funciona sin dependencias de agentes dinámicos

## 9. Estimación de Reducción de Complejidad

- **Modelos Prisma**: De 13 → 0 (-100%)
- **API endpoints**: De 34+ → 0 (-100%) 
- **Componentes UI**: De 50+ → 2-3 (config) (-95%)
- **Hooks/Services**: De 10+ → 1 (config) (-90%)
- **Líneas de código**: Estimado -15,000+ líneas (-90%)
- **Complejidad mental**: De "complejo multi-agente" → "agente único" (-95%)

Esta migración representa una simplificación masiva que eliminará la mayoría del código relacionado con agentes manteniendo la funcionalidad core de realizar llamadas con ElevenLabs.

---

**Próximos Pasos**: Revisar este informe con el equipo y proceder con la implementación por fases, comenzando con la creación del `getAgentConfig()` utility y el feature flag `USE_ENV_AGENT`.