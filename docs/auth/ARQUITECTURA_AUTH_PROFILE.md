# Arquitectura Multi-Tenant: AuthProfile + UserModel

## Resumen Ejecutivo

Esta arquitectura implementa un sistema de autenticación y perfiles de usuario multi-tenant que permite:
- **Autenticación básica** con Firebase Auth (AuthProfile)
- **Perfiles avanzados** con membresías multi-tenant (UserModel)
- **Migración gradual** entre ambos sistemas
- **Contexto de organización** persistente

---  

## 1. CAPA 1: AuthProfile (Autenticación Básica)

### Propósito
Maneja la autenticación básica con Firebase Auth y perfil simple en Firestore.

### Estructura
```typescript
// types/auth/authProfile.ts
export interface AuthProfile {
  uid: string;                    // Firebase UID
  email: string;                 // Email único
  displayName?: string;          // Nombre para mostrar
  photoURL?: string;             // Avatar
  phoneNumber?: string;          // Teléfono
  emailVerified: boolean;        // Email verificado
  createdAt: string;            // Fecha creación
  updatedAt: string;            // Última actualización
  role: 'user' | 'admin';       // Rol básico
  isActive: boolean;            // Usuario activo
}
```

### Hook useAuth
```typescript
// hooks/useAuth.ts
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<AuthProfile | null>(null);
  
  // Funciones principales
  const signIn = async (email: string, password: string) => { /* Firebase Auth */ };
  const signUp = async (email: string, password: string) => { 
    // 1. Crear usuario en Firebase Auth
    // 2. Crear documento AuthProfile en Firestore
    // 3. Enviar verificación de email
  };
  const signOut = async () => { /* Cerrar sesión */ };
  
  // Escuchar cambios de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Cargar perfil desde Firestore
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        setUserProfile(userDoc.data() as AuthProfile);
      }
    });
    return unsubscribe;
  }, []);
  
  return { user, userProfile, signIn, signUp, signOut };
}
```

### Colección Firestore
```
/users/{uid}  // AuthProfile documents
```

---

## 2. CAPA 2: UserModel (Perfil Multi-Tenant)

### Propósito
Maneja perfiles avanzados con membresías a múltiples organizaciones y tenants.

### Estructura Principal
```typescript
// types/user/userModel.ts
export interface OrganizationMembership {
  tenantId: string;              // ID del tenant
  tenantName: string;            // Nombre del tenant
  organizationId: string;        // ID de la organización
  organizationName: string;      // Nombre de org
  role: 'owner' | 'admin' | 'member' | 'viewer';
  permissions: string[];         // Permisos específicos
  joinedAt: string;             // Fecha de unión
  isActive: boolean;            // Membresía activa
  invitedBy?: string;           // Quién invitó
  lastActivity?: string;        // Última actividad
}

export interface UserModel {
  // IDENTIFICACIÓN
  uid: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  
  // MULTI-TENANCY (NÚCLEO DEL SISTEMA)
  organizations: string[];                    // ["tenant1/org1", "tenant2/org2"]
  organizationMemberships: OrganizationMembership[];
  totalOrganizations: number;
  totalTenants: number;
  
  // CONTEXTO ACTUAL
  currentTenantId?: string;         // Tenant seleccionado
  currentOrganizationId?: string;   // Organización seleccionada
  
  // TRACKING Y ACTIVIDAD
  lastLoginAt?: string;
  lastActivity?: string;
  loginCount: number;
  invitationSent: boolean;
  
  // ESTADOS
  isActive: boolean;
  isOnline: boolean;
  emailVerified: boolean;
  profileCompleted: boolean;
  
  // METADATOS
  createdAt: string;
  updatedAt: string;
  version: number;
}
```

### Servicios de Datos
```typescript
// types/user/routeCollection.ts
export const getUserByEmail = async (email: string): Promise<UserModel | null> => {
  const q = query(collection(db, 'users'), where('email', '==', email));
  const snapshot = await getDocs(q);
  return snapshot.docs[0]?.data() as UserModel || null;
};

export const updateUser = async (uid: string, updates: Partial<UserModel>) => {
  const userRef = doc(db, 'users', uid);
  
  // Si no existe, crear usuario básico
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists()) {
    const basicUserData: CreateUserData = {
      uid,
      email: updates.email || '',
      displayName: updates.displayName || 'Usuario',
      organizations: [],
      organizationMemberships: [],
      totalOrganizations: 0,
      totalTenants: 0,
      loginCount: 1,
      isActive: true,
      isOnline: true,
      // ... más campos por defecto
    };
    await setDoc(userRef, { ...basicUserData, ...updates });
    return basicUserData as UserModel;
  }
  
  // Actualizar normalmente
  await updateDoc(userRef, {
    ...updates,
    updatedAt: new Date().toISOString()
  });
  
  return await getUserByUid(uid);
};

// Cambiar contexto de organización
export const switchOrganization = async (uid: string, tenantId: string, orgId: string) => {
  await updateUser(uid, {
    currentTenantId: tenantId,
    currentOrganizationId: orgId
  });
  
  // Persistir en localStorage
  localStorage.setItem('currentTenantId', tenantId);
  localStorage.setItem('currentOrganizationId', orgId);
};
```

### Colección Firestore
```
/users/{uid}  // UserModel documents (sobreescribe AuthProfile gradualmente)
```

---

## 3. CAPA 3: Hook Integrado (useUserProfile)

### Propósito
Integra ambas capas, maneja migración gradual y proporciona helpers multi-tenant.

### Implementación
```typescript
// hooks/useUserProfile.ts
export function useUserProfile() {
  const { user: authUser } = useAuth();  // Datos de Firebase Auth
  const [userProfile, setUserProfile] = useState<UserModel | null>(null);
  const [loading, setLoading] = useState(true);

  // CARGAR PERFIL COMPLETO
  const loadUserProfile = useCallback(async () => {
    if (!authUser?.email) return;
    
    try {
      // 1. Buscar perfil completo por email
      const profile = await getUserByEmail(authUser.email);
      
      // 2. Si no existe, crear desde datos de Firebase Auth
      if (!profile) {
        console.log('🔄 Migrando desde Firebase Auth...');
        await updateUser(authUser.uid, {
          email: authUser.email,
          displayName: authUser.displayName || authUser.email?.split('@')[0],
          photoURL: authUser.photoURL || '',
          emailVerified: authUser.emailVerified,
          lastActivity: new Date().toISOString(),
          isOnline: true
        });
        
        const newProfile = await getUserByEmail(authUser.email);
        setUserProfile(newProfile);
      } else {
        setUserProfile(profile);
        
        // 3. Actualizar actividad existente
        await updateUserActivity(authUser.uid);
      }
      
      // 4. Restaurar contexto desde localStorage
      const savedTenantId = localStorage.getItem('currentTenantId');
      const savedOrgId = localStorage.getItem('currentOrganizationId');
      
      if (savedTenantId && savedOrgId && profile) {
        await switchOrganization(authUser.uid, savedTenantId, savedOrgId);
      }
      
    } catch (error) {
      console.error('Error cargando perfil:', error);
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  // HELPERS PARA MULTI-TENANCY
  const getCurrentOrganizationMembership = useCallback(() => {
    if (!userProfile?.currentOrganizationId) return null;
    
    return userProfile.organizationMemberships.find(
      m => m.organizationId === userProfile.currentOrganizationId
    ) || null;
  }, [userProfile]);

  const isCurrentOrgAdmin = useCallback(() => {
    const membership = getCurrentOrganizationMembership();
    return membership?.role === 'admin' || membership?.role === 'owner';
  }, [getCurrentOrganizationMembership]);

  const getAllOrganizations = useCallback(() => {
    return userProfile?.organizationMemberships || [];
  }, [userProfile]);

  const switchOrganizationContext = useCallback(async (tenantId: string, orgId: string) => {
    if (!authUser?.uid) return;
    
    await switchOrganization(authUser.uid, tenantId, orgId);
    await loadUserProfile(); // Recargar perfil
  }, [authUser?.uid, loadUserProfile]);

  // CARGAR AL MONTAR
  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  return {
    // Datos
    userProfile,
    loading,
    
    // Helpers multi-tenant
    getCurrentOrganizationMembership,
    getAllOrganizations,
    isCurrentOrgAdmin,
    
    // Acciones
    switchOrganizationContext,
    loadUserProfile
  };
}
```

---

## 4. Migración Gradual

### Estrategia
1. **AuthProfile** maneja autenticación básica (existente)
2. **useUserProfile** detecta si existe UserModel completo
3. Si no existe, migra automáticamente desde Firebase Auth
4. Si existe, usa UserModel directamente
5. Ambos sistemas coexisten durante transición

### Flujo de Migración
```typescript
// En useUserProfile.loadUserProfile()
const profile = await getUserByEmail(authUser.email);

if (!profile) {
  // MIGRACIÓN AUTOMÁTICA
  console.log('🔄 Usuario no encontrado, creando desde Auth...');
  
  await updateUser(authUser.uid, {
    email: authUser.email || '',
    displayName: authUser.displayName || authUser.email?.split('@')[0] || 'Usuario',
    photoURL: authUser.photoURL || '',
    emailVerified: authUser.emailVerified || false,
    lastActivity: new Date().toISOString(),
    isOnline: true
  });
  
  // El servicio updateUser crea automáticamente UserModel completo
  const newProfile = await getUserByEmail(authUser.email);
  setUserProfile(newProfile);
} else {
  // Usuario ya migrado, usar UserModel
  setUserProfile(profile);
}
```

---

## 5. Persistencia de Contexto

### LocalStorage + Firestore
```typescript
// Guardar contexto al cambiar organización
const switchOrganizationContext = async (tenantId: string, orgId: string) => {
  // 1. Actualizar en Firestore
  await updateUser(authUser.uid, {
    currentTenantId: tenantId,
    currentOrganizationId: orgId
  });
  
  // 2. Persistir en localStorage
  localStorage.setItem('currentTenantId', tenantId);
  localStorage.setItem('currentOrganizationId', orgId);
  
  // 3. Recargar perfil
  await loadUserProfile();
};

// Restaurar contexto al cargar app
const savedTenantId = localStorage.getItem('currentTenantId');
const savedOrgId = localStorage.getItem('currentOrganizationId');

if (savedTenantId && savedOrgId && userProfile) {
  await switchOrganization(authUser.uid, savedTenantId, savedOrgId);
}
```

---

## 6. Componente de Cambio de Contexto

### OrganizationSwitcher
```typescript
const OrganizationSwitcher = () => {
  const { userProfile, switchOrganizationContext } = useUserProfile();
  
  const handleSwitch = async (membership: OrganizationMembership) => {
    await switchOrganizationContext(
      membership.tenantId, 
      membership.organizationId
    );
  };
  
  const currentMembership = getCurrentOrganizationMembership();
  
  return (
    <div className="organization-switcher">
      <label>Organización Actual:</label>
      <select 
        value={userProfile?.currentOrganizationId || ''}
        onChange={(e) => {
          const membership = userProfile?.organizationMemberships.find(
            m => m.organizationId === e.target.value
          );
          if (membership) handleSwitch(membership);
        }}
      >
        <option value="">Seleccionar organización...</option>
        {userProfile?.organizationMemberships.map(membership => (
          <option key={membership.organizationId} value={membership.organizationId}>
            {membership.tenantName} - {membership.organizationName} ({membership.role})
          </option>
        ))}
      </select>
      
      {currentMembership && (
        <div className="current-context">
          <p>Tenant: {currentMembership.tenantName}</p>
          <p>Organización: {currentMembership.organizationName}</p>
          <p>Rol: {currentMembership.role}</p>
          <p>Admin: {isCurrentOrgAdmin() ? 'Sí' : 'No'}</p>
        </div>
      )}
    </div>
  );
};
```

---

## 7. Estructura de Firestore

```
/users/{uid}                    // UserModel documents (reemplaza AuthProfile)
/tenants/{tenantId}             // Datos del tenant
/organizations/{orgId}          // Datos de organización global
/tenantOrganizations/{tenantId}/organizations/{orgId}  // Organizaciones por tenant
```

### Ejemplo de Documento UserModel
```json
{
  "uid": "firebase-auth-uid",
  "email": "usuario@ejemplo.com",
  "displayName": "Juan Pérez",
  "organizations": ["tenant1/org1", "tenant2/org3"],
  "organizationMemberships": [
    {
      "tenantId": "tenant1",
      "tenantName": "Empresa A",
      "organizationId": "org1",
      "organizationName": "Ventas",
      "role": "admin",
      "permissions": ["read", "write", "invite"],
      "joinedAt": "2024-01-15T10:00:00.000Z",
      "isActive": true
    }
  ],
  "totalOrganizations": 2,
  "totalTenants": 2,
  "currentTenantId": "tenant1",
  "currentOrganizationId": "org1",
  "loginCount": 15,
  "isActive": true,
  "isOnline": true,
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-28T14:30:00.000Z",
  "version": 1
}
```

---

## 8. Pasos para Implementar

### Fase 1: Estructura Base (2-3 días)
1. ✅ Crear tipos `AuthProfile` y `UserModel`
2. ✅ Implementar `useAuth` hook básico
3. ✅ Crear servicios de datos (`routeCollection.ts`)
4. ✅ Configurar colecciones Firestore

### Fase 2: Multi-Tenancy (3-4 días)
5. ✅ Implementar `useUserProfile` hook
6. ✅ Agregar helpers multi-tenant
7. ✅ Crear lógica de migración gradual
8. ✅ Implementar persistencia de contexto

### Fase 3: UI y UX (2-3 días)
9. ✅ Crear componente `OrganizationSwitcher`
10. ✅ Integrar en navegación principal
11. ✅ Agregar indicadores de contexto actual
12. ✅ Testing y refinamiento

### Fase 4: Optimización (1-2 días)
13. ✅ Cacheo de consultas frecuentes  
14. ✅ Optimización de renders
15. ✅ Manejo de errores robusto
16. ✅ Documentación final

---

## 9. Ventajas del Patrón

### ✅ Migración Sin Interrupciones
- Usuarios existentes siguen funcionando
- Migración automática en primer acceso
- Rollback fácil si hay problemas

### ✅ Escalabilidad Multi-Tenant
- Usuario puede pertenecer a múltiples organizaciones
- Contexto persistente entre sesiones
- Roles granulares por organización

### ✅ Flexibilidad de Datos
- AuthProfile para casos simples
- UserModel para casos complejos
- Estructura extensible

### ✅ Experiencia de Usuario
- Cambio fluido entre organizaciones
- Contexto preservado
- Indicadores visuales claros

---

## 10. Consideraciones Importantes

### 🔒 Seguridad
- Validar permisos en cada cambio de contexto
- Verificar membresías antes de mostrar datos
- Sanitizar datos de entrada

### ⚡ Performance
- Cachear membresías frecuentemente usadas
- Optimizar consultas Firestore con índices
- Minimizar re-renders innecesarios

### 🧪 Testing
- Probar migración con datos reales
- Verificar persistencia de contexto
- Testear casos edge (usuario sin organizaciones)

### 📊 Monitoreo
- Log de migraciones exitosas/fallidas
- Métricas de cambios de contexto
- Alertas por errores de autenticación

---

## Conclusión

Esta arquitectura proporciona una base sólida para aplicaciones multi-tenant con:
- **Migración gradual** sin interrupciones
- **Flexibilidad** para diferentes casos de uso
- **Escalabilidad** para múltiples organizaciones
- **Experiencia de usuario** fluida y consistente

La clave está en la **coexistencia temporal** de ambos sistemas y la **migración automática** transparente para el usuario.