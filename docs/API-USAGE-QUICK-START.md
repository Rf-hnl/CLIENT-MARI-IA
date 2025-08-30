# 🚀 API Quick Start Guide

## ¿Cómo usar las APIs seguras?

### 1. **Accede a la página de gestión**
Navega a **Admin → API Keys** en el sidebar del CRM.

### 2. **Crea tu primera API Key**
1. Haz clic en **"Nueva API Key"**
2. Dale un nombre descriptivo (ej: "Integración WhatsApp")
3. Selecciona los permisos necesarios:
   - `leads:create` - Para crear leads individuales
   - `leads:import` - Para importación masiva
   - `leads:read` - Para leer estadísticas
4. Configura la expiración (recomendado: 1 año)
5. Haz clic en **"Crear API Key"**

### 3. **¡IMPORTANTE! Guarda tu API Key**
⚠️ **La API Key solo se muestra UNA VEZ** al crearla. Cópiala y guárdala en un lugar seguro.

### 4. **Configura tu entorno**
Añade estas variables a tu `.env`:

```bash
# Tu API Key (obtenida en el paso anterior)
CRM_API_KEY="sk_tu_api_key_aqui"

# URL de tu CRM
CRM_BASE_URL="https://tu-crm.com"

# Tu tenant ID y organization ID (los encuentras en la página de API Keys)
TENANT_ID="tu-tenant-id"
ORGANIZATION_ID="tu-org-id"
```

### 5. **Prueba desde la interfaz**
1. Ve a la pestaña **"Probar"** en la página de API Keys
2. Pega tu API Key en el campo correspondiente
3. Haz clic en **"Ejecutar Prueba"**
4. ¡Deberías ver una respuesta exitosa! 🎉

---

## 📝 Ejemplos Rápidos

### Crear un lead (JavaScript)
```javascript
const response = await fetch('https://tu-crm.com/api/leads/admin/create', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sk_tu_api_key_aqui',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tenantId: 'tu-tenant-id',
    organizationId: 'tu-org-id',
    leadData: {
      name: 'Juan Pérez',
      phone: '+507-1234-5678',
      email: 'juan@example.com',
      company: 'Mi Empresa',
      source: 'website',
      status: 'new'
    }
  })
});

const result = await response.json();
console.log(result);
```

### Importación masiva (CSV)
```javascript
const csvData = `name;phone;email
Juan Pérez;+507-1234-5678;juan@test.com
María García;+507-9876-5432;maria@test.com`;

const response = await fetch('https://tu-crm.com/api/leads/import/bulk', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sk_tu_api_key_aqui',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tenantId: 'tu-tenant-id',
    organizationId: 'tu-org-id',
    csvContent: csvData,
    dryRun: false // true para solo validar
  })
});
```

---

## 🔧 Configuración del Servidor

### Variables de entorno necesarias:
```bash
# Secreto JWT (genera uno fuerte)
JWT_SECRET="tu-secreto-jwt-super-seguro-256-bits"

# Dominios permitidos para CORS
ALLOWED_ORIGINS="https://tu-dominio.com,https://app.tu-dominio.com"

# Límites de rate limiting
API_RATE_LIMIT_MAX_REQUESTS=100
API_RATE_LIMIT_WINDOW_MS=3600000
```

### Ejecutar migración de base de datos:
```bash
npx prisma migrate dev --name add-api-keys
```

---

## ✅ Lista de verificación

- [ ] ¿Ejecutaste la migración de base de datos?
- [ ] ¿Configuraste las variables de entorno?
- [ ] ¿Creaste tu primera API Key desde la interfaz?
- [ ] ¿Guardaste la API Key en un lugar seguro?
- [ ] ¿Probaste la API desde la pestaña "Probar"?
- [ ] ¿Configuraste los dominios permitidos en CORS?

---

## 🆘 ¿Problemas?

### Error 401 - "API key required"
- ✅ Verifica que estás enviando el header `Authorization: Bearer sk_...`
- ✅ Confirma que la API Key no esté expirada

### Error 403 - "Access denied"
- ✅ Verifica que el `tenantId` y `organizationId` coincidan con tu API Key
- ✅ Confirma que tienes los permisos necesarios

### Error 429 - "Rate limit exceeded"
- ✅ Estás haciendo demasiadas requests. Espera 1 hora o pide aumentar el límite.

### Error 403 - "CORS: Origin not allowed"
- ✅ Añade tu dominio a la variable `ALLOWED_ORIGINS`

---

## 📚 Más información

- **Guía completa:** [docs/API-SECURITY-GUIDE.md](./API-SECURITY-GUIDE.md)
- **Endpoints disponibles:** Ve a la pestaña "Documentación" en la página de API Keys
- **Ejemplos de código:** Ve a la pestaña "Ejemplos" en la página de API Keys

¡Listo para integrar! 🚀