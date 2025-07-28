# Estado Global - Sistema Multi-Organización

## Descripción

Este sistema implementa un estado global completo para manejar usuarios, organizaciones y tenants en toda la aplicación. El estado es accesible desde cualquier componente y se actualiza de forma reactiva.

## Componentes del Sistema

### 1. Tipos de Estado (`/types/globalState.ts`)

#### Interfaces Principales:
- **`CurrentUser`**: Datos completos del usuario (Firebase Auth + Firestore)
- **`Organization`**: Estructura de una organización
- **`Tenant`**: Estructura de un tenant/empresa
- **`CurrentSession`**: Contexto actual (organización y tenant activos)
- **`GlobalState`**: Estado global completo

### 2. Context y Provider (`/contexts/GlobalStateContext.tsx`)

#### Funcionalidades:
- Manejo centralizado del estado global
- Funciones helper para cambiar organizaciones
- Gestión de estados de carga y errores
- Reducer para actualizaciones de estado

### 3. Hooks Personalizados (`/hooks/useGlobalState.ts`)

#### Hooks Disponibles:
- **`useCurrentUser()`**: Datos del usuario actual
- **`useCurrentSession()`**: Sesión actual (organización/tenant)
- **`useOrganizations()`**: Gestión de organizaciones
- **`usePermissions()`**: Verificación de permisos
- **`useGlobalStateInitializer()`**: Inicialización del estado

### 4. Servicios (`/lib/services/organizationService.ts`)

#### Operaciones CRUD:
- Crear organizaciones
- Actualizar organizaciones
- Cambiar de organización
- Gestionar membresías

### 5. Componentes UI

#### Componentes Principales:
- **`OrganizationSwitcher`**: Selector de organización
- **`CreateOrganizationModal`**: Modal para crear organizaciones
- **`OrganizationManager`**: Gestión completa de organizaciones

## Uso del Sistema

### 1. Configuración Inicial

El sistema se configura automáticamente en el layout principal:

```tsx
// app/layout.tsx
<GlobalStateProvider>
  <AuthProvider>
    {/* Tu aplicación */}
  </AuthProvider>
</GlobalStateProvider>
```

### 2. Acceso al Estado Global

#### Usuario Actual
```tsx
import { useCurrentUser } from '@/hooks/useGlobalState';

function MyComponent() {
  const { user, isAuthenticated, firebaseAuth, firestoreUser } = useCurrentUser();
  
  return (
    <div>
      {isAuthenticated && (
        <p>Bienvenido, {user?.firebaseAuth.displayName}</p>
      )}
    </div>
  );
}
```

#### Organización y Tenant Actual
```tsx
import { useCurrentSession } from '@/hooks/useGlobalState';

function MyComponent() {
  const { currentOrganization, currentTenant, userRole } = useCurrentSession();
  
  return (
    <div>
      {currentOrganization && (
        <div>
          <h2>{currentOrganization.name}</h2>
          <p>Tu rol: {userRole}</p>
        </div>
      )}
    </div>
  );
}
```

#### Gestión de Organizaciones
```tsx
import { useOrganizations } from '@/hooks/useGlobalState';

function MyComponent() {
  const { 
    availableOrganizations, 
    createNewOrganization, 
    switchToOrganization 
  } = useOrganizations();
  
  const handleSwitch = async (orgId: string, tenantId: string) => {
    await switchToOrganization(orgId, tenantId);
  };
  
  return (
    <div>
      {availableOrganizations.map(org => (
        <button 
          key={org.id} 
          onClick={() => handleSwitch(org.id, currentTenant?.id)}
        >
          {org.name}
        </button>
      ))}
    </div>
  );
}
```

#### Verificación de Permisos
```tsx
import { usePermissions } from '@/hooks/useGlobalState';

function MyComponent() {
  const { checkPermission, isOwnerOrAdmin, canCreateOrganizations } = usePermissions();
  
  return (
    <div>
      {canCreateOrganizations && (
        <button>Crear Organización</button>
      )}
      
      {checkPermission('manage_users') && (
        <button>Gestionar Usuarios</button>
      )}
      
      {isOwnerOrAdmin && (
        <button>Configuración Avanzada</button>
      )}
    </div>
  );
}
```

### 3. Componentes Listos para Usar

#### Selector de Organización
```tsx
import OrganizationSwitcher from '@/components/organizations/OrganizationSwitcher';

function Navigation() {
  return (
    <nav>
      <OrganizationSwitcher 
        onCreateNew={() => setShowCreateModal(true)}
        onManageOrganizations={() => router.push('/organizations')}
      />
    </nav>
  );
}
```

#### Modal de Creación de Organización
```tsx
import CreateOrganizationModal from '@/components/organizations/CreateOrganizationModal';

function MyComponent() {
  const [showModal, setShowModal] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowModal(true)}>
        Nueva Organización
      </button>
      
      <CreateOrganizationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={(orgId) => console.log('Created:', orgId)}
      />
    </>
  );
}
```

## Flujo de Datos

### 1. Inicialización
1. Usuario se autentica con Firebase Auth
2. `AuthProvider` detecta el cambio de estado
3. `useGlobalStateInitializer` se ejecuta automáticamente
4. Se cargan datos de Firestore (usuario, organizaciones, tenants)
5. Estado global se actualiza reactivamente

### 2. Cambio de Organización
1. Usuario selecciona nueva organización
2. `switchToOrganization` se ejecuta
3. Estado local se actualiza
4. Firestore se actualiza con nueva organización actual
5. Todos los componentes se re-renderizan automáticamente

### 3. Creación de Organización
1. Usuario llena formulario de creación
2. `createNewOrganization` se ejecuta
3. Organización se crea en Firestore
4. Estado global se actualiza
5. Opcionalmente se cambia a la nueva organización

## Estados de Carga

El sistema maneja múltiples estados de carga:

```tsx
import { useGlobalLoadingStates, useGlobalErrors } from '@/hooks/useGlobalState';

function MyComponent() {
  const { isLoadingUser, isSwitching, isLoadingAny } = useGlobalLoadingStates();
  const { userError, switchingError, hasAnyError } = useGlobalErrors();
  
  if (isLoadingAny) return <LoadingSpinner />;
  if (hasAnyError) return <ErrorMessage />;
  
  return <MyContent />;
}
```

## Rutas Disponibles

- `/organizations` - Gestión de organizaciones
- `/profile` - Perfil con selector de organización
- `/dashboard` - Dashboard con contexto organizacional

## Estructura de Base de Datos

El sistema está basado en la estructura definida en `docs/schema.json`:

```
tenants/
├── {tenantId}/
    ├── organizations/
    │   └── {organizationId}/
    └── settings/

users/
└── {userId}/
    ├── organizationMemberships[]
    ├── currentOrganizationId
    └── currentTenantId
```

## Extensión del Sistema

### Agregar Nuevos Hooks
1. Crear hook en `/hooks/useGlobalState.ts`
2. Usar `useGlobalState()` para acceder al contexto
3. Implementar lógica específica

### Agregar Nuevos Componentes
1. Usar hooks existentes para acceder al estado
2. Seguir patrones de componentes existentes
3. Mantener separación de responsabilidades

### Agregar Nuevas Acciones
1. Definir acción en `GlobalStateAction` type
2. Implementar en el reducer
3. Crear función helper en el contexto