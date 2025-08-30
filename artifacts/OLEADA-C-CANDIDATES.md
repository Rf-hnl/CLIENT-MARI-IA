# Oleada C - Candidatos para Revisión Humana

## FRAMEWORK FILES - NO TOCAR (Uso Dinámico por Next.js)
Estos archivos exportan funciones/componentes que Next.js carga dinámicamente:

### Core Framework Files
- `middleware.ts:5` - middleware (usado por Next.js)
- `middleware.ts:17` - config (usado por Next.js)
- `next.config.ts:34` - default (configuración Next.js)
- `app/page.tsx:3` - default (página raíz)

### API Routes - Dinamically loaded by Next.js
- Todas las rutas `app/api/**/route.ts` con exportaciones GET, POST, PUT, DELETE
- Todas las rutas `legacy_firebase_apis/**/route.ts` 
- **Total**: ~50+ rutas API que Next.js carga dinámicamente

### App Pages - Dinamically loaded by Next.js
- Todas las páginas `app/(private|public)/**/page.tsx` 
- Todas las páginas de componentes con `default export`
- **Ejemplos**:
  - `app/(private)/agents/page-unified.tsx:488`
  - `app/(private)/dashboard/page-simple.tsx:9` 
  - `app/(private)/profile/page.tsx:15`

## EXPORT MODULES - REVISAR MANUALMENTE

### Module Barrel Exports
Estos archivos exportan desde módulos index.ts, podrían ser cargados dinámicamente:
- `modules/auth/index.ts:2` - AuthProvider, useAuth
- `modules/clients/index.ts:9` - ClientsProvider, useClients
- Toda la jerarquía de `modules/**` parece ser arquitectura modular

### Agent Templates & Default Configurations
- `types/automationAgents.ts:680` - default (template)
- `types/customerAgents.ts:500` - default (template) 
- `types/dataAgents.ts:689` - default (template)
- **Razón**: Podrían ser cargados dinámicamente por registries de tipos de agentes

### Component Index Exports
- `components/leads/index.ts:8-19` - Múltiples exportaciones (LeadsView, LeadsPipeline, etc.)
- **Razón**: Barrel exports que podrían ser importados dinámicamente

## POSIBLES CANDIDATOS A ELIMINAR (Tras Verificación Manual)

### Pages con Sufijos Suspect
- `app/(private)/dashboard/page-simple.tsx` - ¿Versión simplificada no usada?

### Hooks No Referenciados
- `modules/leads/hooks/useAIAgents.ts:58` - useAIAgents
- `modules/leads/hooks/useLeads.ts:15-273` - Múltiples hooks no referenciados

### Context Providers No Referenciados  
- `modules/auth/context/SimpleAuthContext.tsx:30` - useAuth
- `modules/auth/context/SimpleAuthContext.tsx:38` - SimpleAuthProvider

## RECOMENDACIONES

### Prioridad ALTA - Verificar manualmente:
1. Si `page-simple.tsx` es realmente necesaria
2. Si los hooks en `modules/leads/hooks/` son usados dinámicamente
3. Si `SimpleAuthContext` vs `AuthContext` - uno podría ser redundante

### Prioridad MEDIA - Investigar:
1. Agent template defaults - podrían estar en registries
2. Component barrel exports - verificar si hay imports dinámicos

### NO TOCAR:
- Nada en `app/api/` (rutas API)
- Nada en `app/(private|public)/*/page.tsx` (páginas Next.js)
- `middleware.ts`, `next.config.ts` (framework core)