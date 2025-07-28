# 📋 Flujo de Datos de Clientes - Firebase Integration

## 🎯 Resumen
Este documento describe el flujo completo para obtener datos de clientes desde Firebase, reemplazando el sistema de datos mock por datos reales basados en el contexto organizacional del usuario.

---

## 🏗️ Arquitectura General

```
Usuario Autenticado → Contexto Organizacional → API Firebase → UI Actualizada
```

### Componentes Principales:
1. **Authentication**: Firebase Auth + Firestore User Data
2. **Context Management**: Tenant + Organization 
3. **Data Layer**: Firebase Collections
4. **API Layer**: Next.js API Routes
5. **State Management**: React Context + Hooks
6. **UI Layer**: Admin Dashboard

---

## 🔄 Flujo Completo Paso a Paso

### 1. **Autenticación del Usuario**
```typescript
// modules/auth/context/AuthContext.tsx
const { currentUser } = useAuth(); // Firebase Auth User
```

### 2. **Obtención del Contexto Organizacional**
```typescript
// lib/auth/userState.ts
const userData = await getCurrentUserData(currentUser);
const organization = await getCurrentOrganization(currentUser);
const tenant = await getCurrentTenant(currentUser);
```

**Proceso interno:**
```typescript
getCurrentUserData() {
  1. getUserByUid(currentUser.uid) // Firestore: users/{uid}
  2. getCombinedUserData() // Combina Firebase Auth + Firestore
  3. getUserOrganizations(memberships) // Obtiene orgs del usuario
  4. getUserTenants(memberships) // Obtiene tenants del usuario
  5. Cache durante 5 minutos
}
```

### 3. **Contexto de Clientes (React Context)**
```typescript
// modules/clients/context/ClientsContext.tsx
export function ClientsProvider({ children }) {
  const { currentUser } = useAuth();
  
  useEffect(() => {
    fetchClients(); // Se ejecuta cuando cambia currentUser
  }, [currentUser]);
}
```

### 4. **Carga de Datos de Clientes**
```typescript
const fetchClients = async () => {
  1. Obtener contexto organizacional
  2. Validar tenant + organization
  3. Llamar API con tenantId + organizationId
  4. Actualizar estado (clients, loading, error)
}
```

### 5. **API Route - Conexión a Firebase**
```typescript
// app/api/client/admin/get/route.ts
POST /api/client/admin/get
Body: { tenantId, organizationId }

Proceso:
1. Validar parámetros requeridos
2. Construir ruta: `tenants/${tenantId}/organizations/${organizationId}/clients`
3. adminDb.collection(clientsPath).get()
4. Transformar datos a IClient[]
5. Retornar respuesta tipada
```

### 6. **Actualización de UI**
```typescript
// app/(private)/clients/admin/page.tsx
const { clients, isLoading, error, currentOrganization, currentTenant, refetch } = useClients();

Estados:
- Loading: Spinner + mensaje contextual
- Error: Card de error + botón reintentar  
- Success: Tabla de clientes + estadísticas
```

---

## 📁 Estructura de Datos en Firebase

### Firestore Collections:
```
/tenants/{tenantId}/
  ├── organizations/{organizationId}/
  │   ├── clients/{clientId}          ← AQUÍ ESTÁN LOS CLIENTES
  │   ├── billing/{billingId}
  │   └── settings/{settingId}
  └── info: { companyInfo, planType, ... }

/users/{userId}
  ├── currentTenantId: string
  ├── currentOrganizationId: string
  ├── organizationMemberships: Array<{
  │     tenantId, organizationId, role, permissions, ...
  │   }>
  └── profile: { ... }
```

### Estructura del Cliente (IClient):
```typescript
interface IClient {
  // CAMPOS REQUERIDOS
  id: string;
  name: string;
  national_id: string; 
  phone: string;
  debt: number;
  status: string;
  loan_letter: string;
  
  // CAMPOS OPCIONALES
  email?: string;
  address?: string;
  city?: string;
  province?: string;
  employment_status?: string;
  monthly_income?: number;
  
  // CAMPOS DEL SISTEMA (Firebase Timestamps)
  payment_date: IFirebaseTimestamp;
  installment_amount: number;
  credit_score: number;
  risk_category: string;
  created_at: IFirebaseTimestamp;
  updated_at: IFirebaseTimestamp;
}
```

---

## 🔧 Componentes Técnicos

### **1. Hook Principal**
```typescript
// modules/clients/hooks/useClients.ts
export { useClients } from '../context/ClientsContext';

// Retorna:
{
  clients: IClient[];
  isLoading: boolean;
  error: string | null;
  currentOrganization: Organization;
  currentTenant: Tenant;
  refetch: () => Promise<void>;
}
```

### **2. Context Provider**
```typescript
// modules/clients/context/ClientsContext.tsx
<ClientsProvider>
  - Maneja estado global de clientes
  - Se conecta automáticamente con Firebase
  - Cache y optimizaciones incluidas
  - Funciones CRUD preparadas para futuro
</ClientsProvider>
```

### **3. API Routes**
```typescript
// app/api/client/admin/get/route.ts
- Método: POST
- Auth: Implícita via Firebase Admin SDK
- Validación: tenantId + organizationId requeridos
- Response: { success, data: IClient[], totalClients, path }
```

---

## 🔐 Seguridad y Permisos

### **Validación de Acceso:**
1. **Firebase Auth**: Usuario autenticado
2. **Email Verification**: Email verificado requerido
3. **Organization Membership**: Usuario debe pertenecer a la organización
4. **Tenant Access**: Usuario debe tener acceso al tenant

### **Firestore Security Rules** (recomendadas):
```javascript
// firestore.rules
match /tenants/{tenantId}/organizations/{orgId}/clients/{clientId} {
  allow read, write: if 
    request.auth != null && 
    userHasAccessToOrganization(request.auth.uid, tenantId, orgId);
}
```

---

## 🚀 Uso en Páginas

### **Admin Page**
```typescript
// app/(private)/clients/admin/page.tsx
export default function ClientsAdmin() {
  const { clients, isLoading, error, refetch } = useClients();
  
  // Estados automáticos:
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorCard error={error} onRetry={refetch} />;
  
  // Render tabla con clientes reales
  return <ClientsTable clients={clients} />;
}
```

### **Billing Page** (futuro)
```typescript
// app/(private)/clients/billing/page.tsx  
export default function ClientsBilling() {
  const { clients } = useClients(); // ¡Mismo hook!
  
  // Los mismos datos, UI diferente
  return <BillingDashboard clients={clients} />;
}
```

---

## 🛠️ Debugging y Logs

### **Logs Importantes:**
```typescript
// Context logs
console.log('📋 Se cargaron X clientes desde tenants/.../clients');
console.warn('No hay organización o tenant actual para obtener clientes');

// Error logs  
console.error('Error obteniendo clientes:', error);

// API logs
console.log('API Response:', { success, totalClients, path });
```

### **Estados para Debug:**
- `isLoading`: Indica si está cargando
- `error`: Mensaje de error si hay problemas
- `currentOrganization`: Organización activa (null si no hay)
- `currentTenant`: Tenant activo (null si no hay)
- `clients.length`: Número de clientes cargados

---

## 🔄 Extensiones Futuras

### **CRUD Operations** (preparado):
```typescript
// Ya definidas en el context:
addClient(clientData): Promise<void>
updateClient(id, updates): Promise<void>  
deleteClient(id): Promise<void>
```

### **Nuevas Páginas**:
```typescript
// Solo necesitan usar el mismo hook:
const { clients } = useClients();

// Ejemplos:
- /clients/reports
- /clients/analytics  
- /clients/export
- /clients/settings
```

### **Filtros Avanzados**:
```typescript
// API puede extenderse con query params:
POST /api/client/admin/get
Body: { 
  tenantId, 
  organizationId,
  filters: { status, riskCategory, dateRange }
}
```

---

## ⚡ Performance y Optimizaciones

### **Cache Strategy:**
- **userState.ts**: Cache de 5 minutos para contexto organizacional
- **ClientsContext**: Evita re-fetch innecesario con useEffect dependencies
- **API**: Respuesta tipada reduce parsing overhead

### **Loading Strategy:**
- **Skeleton loading**: Para mejor UX
- **Error boundaries**: Manejo de errores graceful  
- **Retry logic**: Botón reintentar disponible

### **Memory Management:**
- Context limpia estado al desmontar
- Cache se limpia automáticamente
- No memory leaks detectados

---

## 📚 Referencias y Archivos

### **Archivos Clave:**
```
📁 modules/clients/
├── context/ClientsContext.tsx     (Context principal)
├── hooks/useClients.ts           (Hook exportado)
├── types/clients.ts              (Tipos TypeScript)
└── utils/clientValidation.ts     (Validaciones)

📁 lib/auth/
└── userState.ts                  (Contexto organizacional)

📁 app/api/client/admin/
└── get/route.ts                  (API endpoint)

📁 app/(private)/clients/admin/
└── page.tsx                      (UI implementación)

📁 app/
└── layout.tsx                    (Provider setup)
```

### **Dependencias:**
- `firebase/auth`: Autenticación
- `firebase/firestore`: Base de datos
- `firebase-admin`: API server-side
- `@/modules/auth`: Context de autenticación
- `@/components/ui/*`: UI components

---

## 🎯 Checklist de Implementación

- ✅ API route implementado y tipado
- ✅ Context creado con estado global  
- ✅ Hook exportado y reutilizable
- ✅ Provider agregado al layout
- ✅ Admin page conectada
- ✅ Loading y error states
- ✅ Contexto organizacional funcionando
- ✅ Datos reales reemplazando mock
- ✅ TypeScript completo sin `any`
- ✅ Logs para debugging
- ✅ UI responsive y accesible

**🚀 Sistema listo para producción y extensiones futuras!**