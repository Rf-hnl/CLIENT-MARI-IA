# Oleada A - Limpieza de Código de Baja Complejidad

## Componentes de Perfil No Utilizados (Firebase Legacy)
Los siguientes componentes están marcados como no utilizados y pertenecen al sistema legacy de Firebase:

### REMOVER - Componentes Profile Legacy
- `components/profile/AccountInfo.tsx` - Componente no referenciado
- `components/profile/ProfileForm.tsx` - Componente no referenciado  
- `components/profile/UserAvatar.tsx` - Componente no referenciado
- `components/profile/UserInfo.tsx` - Componente no referenciado
- `components/profile/VerificationStatus.tsx` - Componente no referenciado

**Evidencia**: ts-prune no los reporta como usados, búsqueda grep confirma sin imports

## Tipos/Interfaces No Utilizados

### REMOVER - Interfaces en types/agents.ts
- `IAgentSelectionCriteria` (línea 94)
- `IAgentSelectionResult` (línea 103)  
- `ICallEvent` (línea 141)
- `IPromptTemplate` (línea 175)
- `IWebhookConfig` (línea 186)

**Evidencia**: Solo definidos en types/agents.ts, sin referencias en codebase

## Páginas No Utilizadas

### CANDIDATOS - Requieren Revisión Manual
- `app/(private)/dashboard/page-simple.tsx` - Posible página alternativa
- `app/(private)/clients/leads/page-old.tsx` - Página con sufijo "-old"

**Razón**: Podrían ser páginas de respaldo o testing. Requieren validación humana.

## Acciones a Realizar
1. Eliminar componentes profile legacy
2. Eliminar interfaces no utilizadas de types/agents.ts  
3. Marcar candidatos para revisión humana
4. Ejecutar tests y verificar builds