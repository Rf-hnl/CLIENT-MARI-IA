# Plan de Implementación: Sistema de Llamadas para Leads

## 🎯 **Objetivo**
Implementar la funcionalidad de llamadas desde el modal de leads utilizando agentes de voz de ElevenLabs, permitiendo seleccionar agentes disponibles y ejecutar llamadas con seguimiento completo.

---

## 📋 **Análisis del Estado Actual**

### ✅ **Infraestructura EXISTENTE (80% completa)**

#### **1. Sistema Multi-Tenant de Agentes de Voz**
- **Base de datos**: Tablas `tenants`, `organizations`, `elevenLabsConfigs`, `unifiedAgents`
- **Configuración**: Múltiples cuentas ElevenLabs por tenant
- **Aislamiento**: Completa separación por tenant/organización

#### **2. Abstracción de Proveedores de Voz**
```
/lib/voice/
├── VoiceManager.ts              ✅ Orquestador central (singleton)
├── VoiceProviderFactory.ts      ✅ Factory pattern para proveedores
├── providers/
│   └── ElevenLabsProvider.ts    ✅ Implementación ElevenLabs completa
└── types/voiceProviders.ts      ✅ Interfaces agnósticas
```

#### **3. Gestión de Agentes (Nuevo Sistema)**
- **`agentReferences`**: Solo almacena `elevenLabsAgentId` como referencia
- **ElevenLabs API**: Fuente de verdad para configuración de agentes
- **Metadatos locales**: Reglas de uso, tags, estadísticas

#### **4. Integración con Leads**
```
/modules/leads/
├── hooks/useLeadCalls.ts        ✅ Hook para gestión de llamadas
├── types/leads.ts               ✅ Estructura con historial de llamadas
└── components/
    ├── CallConfirmationModal.tsx ✅ UI para iniciar llamadas
    └── LeadCallHistory.tsx       ✅ Historial de llamadas
```

#### **5. APIs Existentes**
```
/api/voice/providers/elevenlabs/
├── config                       ✅ CRUD configuraciones
├── test-connection             ✅ Test de conexión
├── agent-info                  ✅ Obtener detalles de agente
├── agent-update                ✅ Actualizar configuración agente
└── voices                      ✅ Listar voces disponibles
```

### ❌ **Componentes FALTANTES (20% restante)**

#### **1. API de Iniciación de Llamadas**
```
FALTA: /api/leads/[id]/call
FALTA: /api/calls/initiate
```

#### **2. Ejecución Real de Llamadas**
- `useLeadCalls.initiateCall()` está stubbed (comentarios TODO)
- No hay integración real con API de ElevenLabs
- No hay procesamiento de resultados de llamadas

#### **3. Actualizaciones en Tiempo Real**
- No hay webhooks para estado de llamadas
- No hay polling para progreso
- No hay procesamiento de transcripciones

---

## 🚀 **Plan de Implementación**

### **FASE 1: Llamadas Individuales (CORE)**

#### **Paso 1.1: API de Iniciación de Llamadas**
```typescript
// /api/leads/[id]/call/route.ts
export async function POST(request: Request, { params }: { params: { id: string } }) {
  // 1. Validar tenant/organización actual
  // 2. Obtener configuración ElevenLabs del tenant
  // 3. Listar agentes disponibles para el tenant
  // 4. Validar agente seleccionado
  // 5. Iniciar llamada con ElevenLabs
  // 6. Guardar registro en call logs
  // 7. Retornar call ID y estado
}
```

#### **Paso 1.2: Completar Hook useLeadCalls**
```typescript
// /modules/leads/hooks/useLeadCalls.ts
const initiateCall = async (leadId: string, agentId: string) => {
  // 1. Llamar API /api/leads/[id]/call
  // 2. Actualizar estado local
  // 3. Iniciar polling de estado
  // 4. Manejar callbacks de resultado
}
```

#### **Paso 1.3: Integración en LeadDetailsModal**
```typescript
// /components/leads/LeadDetailsModal.tsx
// 1. Agregar prop onCall al componente padre
// 2. Implementar selección de agente disponible
// 3. Mostrar UI de estado de llamada (in-call, completed, failed)
// 4. Actualizar historial automáticamente
```

### **FASE 2: Selección de Agentes**

#### **Paso 2.1: API para Listar Agentes Disponibles**
```typescript
// /api/voice/agents/available/route.ts
export async function GET() {
  // 1. Obtener tenant/org actual
  // 2. Buscar configuraciones ElevenLabs activas
  // 3. Para cada config, obtener agentes de ElevenLabs API
  // 4. Filtrar agentes disponibles (no en llamada)
  // 5. Retornar lista con metadatos
}
```

#### **Paso 2.2: Componente de Selección de Agente**
```typescript
// /components/leads/AgentSelector.tsx
// 1. Dropdown o modal con agentes disponibles
// 2. Mostrar información del agente (nombre, voz, especialidad)
// 3. Indicar disponibilidad en tiempo real
// 4. Preview de voz si disponible
```

### **FASE 3: Seguimiento de Llamadas**

#### **Paso 3.1: Webhook de ElevenLabs**
```typescript
// /api/webhooks/elevenlabs/call-status/route.ts
export async function POST(request: Request) {
  // 1. Validar firma del webhook
  // 2. Procesar evento de estado de llamada
  // 3. Actualizar registro en base de datos
  // 4. Notificar al frontend via WebSocket/SSE
}
```

#### **Paso 3.2: Procesamiento de Transcripciones**
```typescript
// /api/webhooks/elevenlabs/transcription/route.ts
export async function POST(request: Request) {
  // 1. Recibir transcripción de ElevenLabs
  // 2. Asociar con lead y llamada
  // 3. Actualizar registro en base de datos
  // 4. Generar insights automáticos
}
```

---

## 🏗️ **Estructura de Datos Actualizada**

### **Call Log Extendido**
```typescript
interface ILeadCallLog {
  id: string
  leadId: string
  tenantId: string                    // NUEVO: Aislamiento multi-tenant
  organizationId: string              // NUEVO: Nivel organización
  elevenLabsConfigId: string          // NUEVO: Configuración usada
  elevenLabsJobId?: string            // EXISTENTE: ID de trabajo EL
  agentId: string                     // EXISTENTE: ID del agente
  agentName?: string                  // NUEVO: Nombre del agente
  
  // Estados de llamada
  status: "initiating" | "ringing" | "in_progress" | "completed" | "failed"
  callType: "prospecting" | "qualification" | "follow_up" | "closing"
  outcome?: "answered" | "no_answer" | "voicemail" | "busy" | "interested" | "not_interested" | "callback_requested"
  
  // Timing
  timestamp: IFirebaseTimestamp
  startTime?: Date                    // NUEVO: Inicio real de llamada
  endTime?: Date                      // NUEVO: Fin de llamada
  durationMinutes?: number
  
  // Contenido
  audioUrl?: string
  transcription?: string
  transcriptionConfidence?: number
  transcriptionStatus?: "pending" | "processing" | "completed" | "failed"
  
  // Metadatos
  notes?: string
  next_action?: string
  cost?: number                       // NUEVO: Costo de la llamada
  costCurrency?: string               // NUEVO: Moneda del costo
}
```

---

## 🔧 **Flujo de Implementación Detallado**

### **1. Preparar el Modal de Leads**
```typescript
// En /app/(private)/clients/leads/page.tsx
const handleCallLead = async (lead: ExtendedLead) => {
  setSelectedLead(lead);
  setShowCallSelector(true); // Nuevo estado
};

// Pasar la función al modal
<LeadDetailsModal
  isOpen={showLeadDetails}
  onClose={handleCloseLeadDetails}
  lead={selectedLead}
  onCall={handleCallLead}  // ← AGREGAR ESTA PROP
/>
```

### **2. Actualizar LeadDetailsModal**
```typescript
// En /components/leads/LeadDetailsModal.tsx
interface LeadDetailsModalProps {
  // ... props existentes
  onCall?: (lead: ExtendedLead) => void; // ← ESTA PROP YA EXISTE
}

// En el WorkPanel, el botón ya tiene la lógica correcta:
<Button onClick={() => onCall?.(lead)}>
  <Phone className="h-4 w-4" />
  Llamar
</Button>
```

### **3. Crear Componente de Selección de Agente**
```typescript
// /components/leads/AgentCallSelector.tsx
interface AgentCallSelectorProps {
  lead: ExtendedLead;
  isOpen: boolean;
  onClose: () => void;
  onCallInitiated: (callLog: ILeadCallLog) => void;
}

// Funcionalidad:
// 1. Cargar agentes disponibles del tenant actual
// 2. Mostrar información de cada agente
// 3. Permitir selección
// 4. Iniciar llamada
// 5. Mostrar progreso
```

### **4. API de Iniciación de Llamadas**
```typescript
// /api/leads/[id]/call/route.ts

import { VoiceManager } from '@/lib/voice/VoiceManager';
import { getServerSession } from 'next-auth';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    // 1. Autenticación y autorización
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parsear request
    const { agentId, callType = 'prospecting' } = await request.json();
    const leadId = params.id;

    // 3. Obtener lead
    const lead = await getLeadById(leadId, session.user.tenantId);
    if (!lead || !lead.phone) {
      return NextResponse.json({ error: 'Lead not found or no phone' }, { status: 404 });
    }

    // 4. Validar agente disponible
    const voiceManager = VoiceManager.getInstance();
    const agentInfo = await voiceManager.getAgentInfo(agentId, session.user.tenantId);
    if (!agentInfo) {
      return NextResponse.json({ error: 'Agent not available' }, { status: 400 });
    }

    // 5. Iniciar llamada
    const callRequest = {
      agentId,
      phoneNumber: lead.phone,
      leadContext: {
        name: lead.name,
        company: lead.company,
        interest: lead.notes
      }
    };

    const callResult = await voiceManager.makeCall(callRequest, session.user.tenantId);

    // 6. Guardar en historial
    const callLog: ILeadCallLog = {
      id: generateId(),
      leadId,
      tenantId: session.user.tenantId,
      organizationId: session.user.organizationId,
      elevenLabsJobId: callResult.jobId,
      agentId,
      agentName: agentInfo.name,
      status: 'initiating',
      callType,
      timestamp: Timestamp.now(),
      cost: callResult.estimatedCost,
      costCurrency: 'USD'
    };

    await saveCallLog(callLog);

    return NextResponse.json({
      success: true,
      callLog,
      jobId: callResult.jobId
    });

  } catch (error) {
    console.error('Error initiating call:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

## 🔄 **Flujo de Usuario Completo**

### **1. Usuario hace clic en "Llamar" en el modal de lead**
```
Lead Modal → WorkPanel → Botón "Llamar" → onCall(lead)
```

### **2. Se abre selector de agente**
```
Parent Component → setShowCallSelector(true) → AgentCallSelector Modal
```

### **3. Usuario selecciona agente y confirma**
```
AgentCallSelector → API /api/leads/[id]/call → ElevenLabs API → Call Initiated
```

### **4. Seguimiento en tiempo real**
```
Webhook ElevenLabs → API /api/webhooks/elevenlabs → Update Call Status → Frontend Update
```

### **5. Transcripción y resultado**
```
ElevenLabs → Transcription Webhook → Save to DB → Update Lead History
```

---

## 📊 **Consideraciones Técnicas**

### **Seguridad**
- ✅ Validación de tenant/organización en cada request
- ✅ Rate limiting para llamadas
- ✅ Validación de permisos de usuario
- ✅ Sanitización de datos de lead

### **Performance**
- ✅ Caching de información de agentes
- ✅ Lazy loading de historial de llamadas
- ✅ Polling inteligente para estado de llamadas
- ✅ Cleanup automático de llamadas antiguas

### **Costos**
- ✅ Tracking de costos por llamada
- ✅ Límites por tenant
- ✅ Alertas de presupuesto
- ✅ Reportes de usage

### **UX/UI**
- ✅ Estados de loading claramente indicados
- ✅ Feedback en tiempo real del estado de llamada
- ✅ Manejo de errores user-friendly
- ✅ Cancelación de llamadas en progreso

---

## 🎯 **Resultado Esperado**

Al completar esta implementación, el usuario podrá:

1. **Hacer clic en "Llamar"** en cualquier lead
2. **Ver agentes disponibles** de su tenant/organización
3. **Seleccionar agente** con preview de información
4. **Iniciar llamada** con feedback en tiempo real
5. **Ver progreso** de la llamada (iniciando, sonando, en progreso)
6. **Recibir transcripción** automática al finalizar
7. **Ver historial** actualizado inmediatamente
8. **Seguimiento de costos** y usage del tenant

Todo esto **sin modales sobre modales**, manteniendo UX limpio y utilizando la infraestructura multi-tenant ya existente.

---

## 📝 **Siguientes Pasos Inmediatos**

1. **Implementar API `/api/leads/[id]/call`** (Paso 1.1)
2. **Completar hook `useLeadCalls`** (Paso 1.2)  
3. **Agregar prop `onCall` al componente padre** (Paso 1.3)
4. **Crear `AgentCallSelector` component** (Paso 2.2)
5. **Testing end-to-end** con ElevenLabs sandbox

**Tiempo estimado**: 1-2 días de desarrollo focused

---

*Documento creado para rastrear la implementación completa del sistema de llamadas para leads usando agentes de voz ElevenLabs con arquitectura multi-tenant.*