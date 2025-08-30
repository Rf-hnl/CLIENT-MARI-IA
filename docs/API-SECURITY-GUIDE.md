# 🔐 API Security Implementation Guide

## Overview

Este documento describe la implementación completa del sistema de seguridad para las APIs externas del CRM de Leads.

## 🚀 Características Implementadas

### ✅ 1. Autenticación con API Keys
- **Sistema de API Keys**: Generación segura con prefijo `sk_`
- **Hash de Keys**: Almacenamiento seguro usando SHA-256
- **Expiración**: API Keys con fecha de expiración opcional
- **Permisos**: Sistema granular de permisos por API Key

### ✅ 2. Rate Limiting
- **Límites por API Key**: 100 requests/hora por defecto
- **Ventana deslizante**: Sistema de ventana de tiempo configurable
- **Headers informativos**: `X-RateLimit-Remaining` y `X-RateLimit-Reset`

### ✅ 3. Validación de Tenant/Organización
- **Aislamiento de datos**: API Keys restringidas por tenant y organización
- **Validación automática**: Verificación contra permisos de la API Key

### ✅ 4. CORS Restrictivo
- **Origins permitidos**: Lista configurable via variables de entorno
- **Headers seguros**: Restricción de headers permitidos
- **Preflight requests**: Manejo correcto de OPTIONS

### ✅ 5. Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

## 📋 Configuración

### Variables de Entorno

```bash
# JWT Secret para tokens internos
JWT_SECRET="your-super-secure-jwt-secret-key-here-256-bits-minimum"

# Origins permitidos para CORS
ALLOWED_ORIGINS="http://localhost:3000,https://yourdomain.com"

# Rate Limiting
API_RATE_LIMIT_MAX_REQUESTS=100
API_RATE_LIMIT_WINDOW_MS=3600000
```

### Base de Datos

Ejecutar migración de Prisma para crear la tabla de API Keys:

```bash
npx prisma migrate dev --name add-api-keys
```

## 🔑 Gestión de API Keys

### Crear Nueva API Key

```bash
POST /api/admin/api-keys
Content-Type: application/json

{
  "tenantId": "tenant-uuid",
  "organizationId": "org-uuid", 
  "name": "External Integration",
  "permissions": ["leads:create", "leads:read"],
  "expiresInDays": 365
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "api-key-uuid",
    "name": "External Integration",
    "apiKey": "sk_abc123...", // ⚠️ Solo se muestra al crear
    "permissions": ["leads:create", "leads:read"],
    "expiresAt": "2025-08-27T00:00:00.000Z",
    "createdAt": "2024-08-27T00:00:00.000Z"
  }
}
```

### Listar API Keys

```bash
GET /api/admin/api-keys?tenantId=tenant-uuid&organizationId=org-uuid
```

### Desactivar API Key

```bash
PATCH /api/admin/api-keys
Content-Type: application/json

{
  "keyId": "api-key-uuid",
  "isActive": false
}
```

## 🛡️ Uso de APIs Seguras

### Autenticación

Incluir API Key en los requests:

**Opción 1: Authorization Header**
```bash
curl -X POST https://yourapp.com/api/leads/admin/create \
  -H "Authorization: Bearer sk_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{"tenantId": "...", "organizationId": "...", "leadData": {...}}'
```

**Opción 2: X-API-Key Header**
```bash
curl -X POST https://yourapp.com/api/leads/admin/create \
  -H "X-API-Key: sk_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{"tenantId": "...", "organizationId": "...", "leadData": {...}}'
```

### Crear Lead Individual

```bash
POST /api/leads/admin/create
Authorization: Bearer sk_your_api_key_here
Content-Type: application/json

{
  "tenantId": "your-tenant-id",
  "organizationId": "your-org-id",
  "leadData": {
    "name": "Juan Pérez",
    "phone": "+507-1234-5678",
    "email": "juan@example.com",
    "company": "Mi Empresa",
    "source": "external_api",
    "status": "new",
    "priority": "medium"
  }
}
```

### Importación Masiva

```bash
POST /api/leads/import/bulk
Authorization: Bearer sk_your_api_key_here
Content-Type: application/json

{
  "tenantId": "your-tenant-id",
  "organizationId": "your-org-id", 
  "csvContent": "name;phone;email\\nJuan;+507-1234;juan@test.com",
  "dryRun": false
}
```

## 🚨 Códigos de Error

| Código | Error | Descripción |
|--------|-------|-------------|
| `401` | `Invalid API key` | API Key inválida o expirada |
| `401` | `API key required` | Falta header de autenticación |
| `403` | `Missing permission: leads:create` | API Key sin permisos necesarios |
| `403` | `Access denied: wrong tenant` | API Key no autorizada para el tenant |
| `429` | `Rate limit exceeded` | Límite de requests excedido |
| `403` | `CORS: Origin not allowed` | Origin no permitido |

## 🔒 Permisos Disponibles

| Permiso | Descripción |
|---------|-------------|
| `leads:create` | Crear nuevos leads |
| `leads:read` | Leer leads existentes |
| `leads:update` | Actualizar leads |
| `leads:delete` | Eliminar leads |
| `leads:import` | Importación masiva |
| `analytics:read` | Acceso a estadísticas |
| `*` | Todos los permisos |
| `admin:all` | Permisos de administrador |

## 📊 Monitoreo

### Headers de Rate Limiting

```
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1693180800
```

### Logs de Seguridad

```
🔑 Nueva API Key generada: External Integration para Mi Empresa
🔒 API Middleware: /api/leads/admin/create | Security headers added
📥 Received authenticated request: { tenantId, organizationId, apiKeyId }
```

## 🛠️ Desarrollo

### Extender Middleware

```typescript
// En tu route handler
import { apiAuthMiddleware } from '@/lib/auth/api-middleware';

export async function POST(request: NextRequest) {
  const authResult = await apiAuthMiddleware(request, {
    requireAuth: true,
    requiredPermissions: ['custom:permission'],
    rateLimitConfig: {
      maxRequests: 50,
      windowMs: 60 * 60 * 1000
    },
    allowedOrigins: ['https://trusted-domain.com']
  });

  if (authResult.response) {
    return authResult.response; // Auth failed
  }

  // Continuar con lógica protegida
  const apiKey = authResult.apiKey;
  // ...
}
```

### Testing

```javascript
// Test de autenticación
const response = await fetch('/api/leads/admin/create', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sk_test_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(testData)
});

expect(response.status).toBe(200);
```

## 🔧 Migración de Endpoints Existentes

Para migrar endpoints existentes al nuevo sistema de seguridad:

1. **Importar middleware**:
   ```typescript
   import { apiAuthMiddleware, validateTenantAccess } from '@/lib/auth/api-middleware';
   ```

2. **Aplicar autenticación**:
   ```typescript
   const authResult = await apiAuthMiddleware(request, {
     requireAuth: true,
     requiredPermissions: ['appropriate:permission']
   });
   ```

3. **Validar tenant**:
   ```typescript
   const tenantValidation = validateTenantAccess(apiKey, tenantId, organizationId);
   ```

## 📈 Roadmap

### Próximas Mejoras

- [ ] **Redis para Rate Limiting**: Migrar de memoria a Redis
- [ ] **JWT para Tokens de Sesión**: Implementar tokens temporales
- [ ] **Webhooks Seguros**: Sistema de webhooks con verificación
- [ ] **API Analytics**: Dashboard de uso de APIs
- [ ] **IP Whitelisting**: Restricción por direcciones IP
- [ ] **Rotación de Keys**: Auto-rotación de API Keys

---

## 🆘 Soporte

Para problemas o preguntas sobre la implementación de seguridad:

1. Revisar logs de aplicación
2. Verificar configuración de variables de entorno
3. Confirmar que las migraciones de DB se ejecutaron
4. Validar formato de API Keys (debe empezar con `sk_`)

**¡La seguridad es responsabilidad de todos!** 🛡️