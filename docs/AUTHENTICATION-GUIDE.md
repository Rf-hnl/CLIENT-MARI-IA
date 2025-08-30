# 🔐 Guía de Autenticación del Sistema

## ⚠️ **IMPORTANTE: Para evitar problemas futuros**

Este documento explica el sistema de autenticación actual para evitar confusiones y errores en el desarrollo.

## 📋 **Sistema de Autenticación Actual**

### **🎯 Flujo Principal:**
```
Usuario → Login → JWT Token → localStorage/Cookies → API Requests
```

### **🔧 Tecnologías NO utilizadas:**
- ❌ **Firebase Auth** (código legacy/obsoleto)
- ❌ **Supabase Auth** (solo para DB, no para autenticación)
- ❌ **Next.js middleware** (simplificado, no maneja auth)

### **✅ Tecnologías SÍ utilizadas:**
- ✅ **JWT custom tokens** (jose library)
- ✅ **localStorage** para persistencia
- ✅ **Cookies** como fallback
- ✅ **bcryptjs** para passwords
- ✅ **PostgreSQL** via Prisma para usuarios

## 🔄 **Flujo de Autenticación Detallado**

### **1. Login (/api/auth/login)**
```typescript
// Input: { email, password, tenantIdentifier }
// Output: JWT token con { userId, email, tenantId, organizationId, roles }
```

### **2. Token Storage**
```typescript
// AuthContext almacena en:
localStorage.setItem('auth_token', token)
Cookies.set('auth_token', token)
```

### **3. API Requests**
```typescript
// Headers requeridos:
'Authorization': `Bearer ${token}`
```

### **4. Token Validation**
```typescript
// En endpoints API:
const { payload } = await jose.jwtVerify(token, secret)
// payload contiene: userId, email, tenantId, organizationId, roles
```

## 🗃️ **Estructura de Datos**

### **JWT Payload:**
```typescript
{
  userId: string,
  email: string,
  tenantId: string,
  organizationId: string,
  roles: string[]
}
```

### **User en AuthContext:**
```typescript
interface User {
  id: string;
  email: string;
  tenantId: string;
  organizationId: string;
  roles: string[];
}
```

## 📁 **Archivos Clave**

### **Frontend:**
- `contexts/AuthContext.tsx` - Context principal de autenticación
- `modules/auth/index.ts` - Re-export del context
- `app/api/auth/login/route.ts` - Endpoint de login

### **Hooks de ejemplo correctos:**
```typescript
import { useAuth } from '@/contexts/AuthContext';

const { user } = useAuth(); // NO currentUser
const token = localStorage.getItem('auth_token'); // Para API calls
```

## 🚨 **Errores Comunes a Evitar**

### **⚠️ ERROR CRÍTICO: Foreign Key Constraints**
**Problema**: Error `Foreign key constraint violated on constraint: *_organization_id_fkey`

**Causa**: Usar búsqueda de tenant por `ownerId` en lugar de usar los IDs del JWT directamente.

```typescript
// ❌ INCORRECTO (causa foreign key errors):
const tenant = await prisma.tenant.findFirst({
  where: { ownerId: user.id }
});
const organizationId = tenant.organizationId || tenant.id; // Puede no existir

// ✅ CORRECTO (usar IDs del JWT directamente):
const { payload } = await jose.jwtVerify(token, secret);
const user = { 
  tenantId: payload.tenantId as string,
  organizationId: payload.organizationId as string
};
// Usar directamente user.tenantId y user.organizationId
```

**🔧 Patrón correcto para nuevos endpoints API:**
```typescript
// 1. Extraer IDs del JWT
const { payload } = await jose.jwtVerify(token, secret);
const user = {
  id: payload.userId as string,
  tenantId: payload.tenantId as string, // ✅ Usar este
  organizationId: payload.organizationId as string // ✅ Y este
};

// 2. Validar que existen (opcional pero recomendado)
const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId } });
const organization = await prisma.organization.findUnique({ where: { id: user.organizationId } });

// 3. Usar directamente en operaciones
await prisma.someModel.create({
  data: {
    tenantId: user.tenantId, // ✅ Del JWT, no de búsqueda
    organizationId: user.organizationId, // ✅ Del JWT, no de búsqueda
    // ... otros campos
  }
});
```

### **1. Confundir sistemas de auth:**
```typescript
// ❌ INCORRECTO:
import { useAuth } from '@/modules/auth'; // Si apunta a Firebase/Supabase
const { currentUser } = useAuth();
const token = await supabase.auth.getSession();

// ✅ CORRECTO:
import { useAuth } from '@/contexts/AuthContext';
const { user } = useAuth();
const token = localStorage.getItem('auth_token');
```

### **2. Validación incorrecta en APIs:**
```typescript
// ❌ INCORRECTO:
import { supabaseAdmin } from '@/lib/supabase/server';
const { data: { user } } = await supabaseAdmin.auth.getUser(token);

// ✅ CORRECTO:
import * as jose from 'jose';
const { payload } = await jose.jwtVerify(token, secret);
const user = { 
  id: payload.userId as string,
  organizationId: payload.organizationId as string,
  tenantId: payload.tenantId as string
};
```

### **3. Filtrado incorrecto de datos:**
```typescript
// ❌ INCORRECTO:
const leads = await prisma.lead.findMany(); // Sin filtrar

// ✅ CORRECTO:
const whereClause = { organizationId: user.organizationId, tenantId: user.tenantId };
const leads = await prisma.lead.findMany({ where: whereClause });
```

## 🔍 **Debugging**

### **🚨 Para debuggear Foreign Key Errors:**
```typescript
// En API endpoints, agregar logs de diagnóstico:
console.log('🔍 [DEBUG] User context from JWT:');
console.log(`   tenantId: ${user.tenantId}`);
console.log(`   organizationId: ${user.organizationId}`);

// Verificar si los registros existen:
const [tenant, organization] = await Promise.all([
  prisma.tenant.findUnique({ where: { id: user.tenantId } }),
  prisma.organization.findUnique({ where: { id: user.organizationId } })
]);

console.log('✅ [DEBUG] Records found:', {
  tenant: tenant ? tenant.name : 'NOT FOUND',
  organization: organization ? organization.name : 'NOT FOUND'
});

// Si alguno no existe, el foreign key constraint fallará
if (!tenant || !organization) {
  console.error('🚨 [DEBUG] Missing records - Foreign key will fail!');
}
```

### **Para verificar autenticación:**
```typescript
// En browser console:
console.log('Token:', localStorage.getItem('auth_token'));

// Para decodificar JWT (sin validar):
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('JWT payload:', payload);

// En API endpoints:
console.log('User from JWT:', user);
console.log('Org/Tenant IDs:', user.organizationId, user.tenantId);
```

### **Logs útiles automáticos:**
```typescript
// AuthContext logs automáticamente:
'🔐 AuthContext: Initializing...'
'👤 Decoded user:', decodedUser
'🎯 FINAL TOKEN TO USE:', token ? 'exists' : 'missing'

// API endpoints deberían loggear:
'🔍 [DEBUG] User context from JWT: { tenantId, organizationId }'
'✅ [DEBUG] Tenant and Organization validated'
```

## 📊 **Casos de Uso Reales**

### **Dashboard Analytics:**
```typescript
// hooks/useLeadsStats.ts
const token = localStorage.getItem('auth_token');
const response = await fetch('/api/leads/stats', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### **API Endpoint:**
```typescript
// api/leads/stats/route.ts
const { payload } = await jose.jwtVerify(token, secret);
const user = {
  id: payload.userId as string,
  tenantId: payload.tenantId as string,
  organizationId: payload.organizationId as string
};

// Validar existencia (recomendado para operaciones críticas)
const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId } });
const organization = await prisma.organization.findUnique({ where: { id: user.organizationId } });

if (!tenant || !organization) {
  return NextResponse.json({ error: 'Invalid tenant/organization' }, { status: 404 });
}

const whereClause = { 
  organizationId: user.organizationId,
  tenantId: user.tenantId 
};
```

## 🛠️ **Mantenimiento**

### **Para nuevos endpoints:**
1. Usar validación JWT con `jose.jwtVerify()`
2. **IMPORTANTE**: Extraer `organizationId` y `tenantId` directamente del payload JWT
3. NO buscar tenant por `ownerId` - usar los IDs del JWT
4. Validar existencia con `findUnique()` si es crítico
5. Filtrar todas las consultas de DB con estos IDs

### **✅ Template para nuevos endpoints API:**
```typescript
export async function POST/GET/PUT(request: NextRequest) {
  try {
    // 1. Autenticación
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    
    const { payload } = await jose.jwtVerify(token, secret);
    const user = {
      id: payload.userId as string,
      tenantId: payload.tenantId as string,
      organizationId: payload.organizationId as string
    };

    // 2. Validación (opcional pero recomendado)
    const [tenant, organization] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: user.tenantId } }),
      prisma.organization.findUnique({ where: { id: user.organizationId } })
    ]);

    if (!tenant || !organization) {
      return NextResponse.json({ error: 'Invalid context' }, { status: 404 });
    }

    // 3. Operaciones usando user.tenantId y user.organizationId
    const result = await prisma.yourModel.create({
      data: {
        tenantId: user.tenantId,
        organizationId: user.organizationId,
        // ... otros campos
      }
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### **Para nuevos hooks:**
1. Usar `useAuth()` de `@/contexts/AuthContext`
2. Obtener token con `localStorage.getItem('auth_token')`
3. Incluir Authorization header en requests

## 🎯 **Resumen**

**El sistema usa JWT tokens custom almacenados en localStorage, NO Firebase ni Supabase Auth.**

### **✅ Checklist para nuevos endpoints:**
- ✅ Import correcto: `@/contexts/AuthContext`
- ✅ Token source: `localStorage.getItem('auth_token')`
- ✅ Validación: `jose.jwtVerify()`
- ✅ **IDs del JWT**: `payload.tenantId` y `payload.organizationId` directamente
- ✅ **NO buscar** tenant por `ownerId`
- ✅ Validar registros con `findUnique()` si es crítico
- ✅ Filtrado: `{ organizationId: user.organizationId, tenantId: user.tenantId }`

### **🚨 Red Flags que indican problemas:**
- ❌ `findFirst({ where: { ownerId: user.id } })`
- ❌ `tenant.organizationId || tenant.id`
- ❌ Error: `Foreign key constraint violated`
- ❌ Crear organizaciones dinámicamente en endpoints

### **✅ Endpoints de referencia que funcionan bien:**
- `/api/tenant/info/route.ts` - Patrón perfecto a seguir
- `/api/leads/[id]/conversations/[conversationId]/analysis/sentiment/route.ts` - Recién corregido

---

*Actualizado después del incidente de Foreign Key constraints para documentar el patrón correcto y evitar futuros errores de `organization_id_fkey`.*