# 📊 Scripts para Gestión de Leads

Esta carpeta contiene scripts útiles para crear y gestionar leads de ejemplo en el sistema.

## 🚀 Scripts Disponibles

### 1. `create-sample-leads.js` - Script Completo
Crea 10 leads de ejemplo con datos realistas y completos para probar todas las funcionalidades.

**Características:**
- ✅ 10 leads con datos reales de empresas panameñas
- ✅ Diferentes estados (new, contacted, qualified, won, lost, etc.)
- ✅ Prioridades variadas (low, medium, high, urgent)
- ✅ Fuentes diversas (website, referral, cold_call, etc.)
- ✅ Datos de contacto completos
- ✅ Fechas realistas y scoring calculado
- ✅ Algunos leads convertidos con valores

**Uso:**
```bash
# Con parámetros específicos
node scripts/create-sample-leads.js <tenantId> <organizationId>

# Con variables de entorno
export DEFAULT_TENANT_ID="tu-tenant-id"
export DEFAULT_ORGANIZATION_ID="tu-organization-id"
node scripts/create-sample-leads.js

# Usando NPM
npm run create-sample-leads <tenantId> <organizationId>
```

**Ejemplo:**
```bash
node scripts/create-sample-leads.js abc123 org456
```

### 2. `quick-create-leads.js` - Script Rápido
Crea 5 leads básicos para desarrollo y pruebas rápidas.

**Características:**
- ⚡ Rápido y simple
- 🧪 Perfecto para desarrollo
- 🏷️ Leads marcados como "test"
- 📊 Cubre los estados principales del pipeline

**Uso:**
```bash
# Directo
node scripts/quick-create-leads.js

# Con NPM
npm run quick-leads

# Configurar datos de demo completos
npm run setup-demo-data
```

## 📋 Comandos NPM Disponibles

```bash
# Crear leads de ejemplo completos
npm run create-sample-leads <tenantId> <organizationId>

# Crear leads de prueba rápidos
npm run quick-leads

# Configurar todos los datos de demo
npm run setup-demo-data
```

## 🔧 Configuración

### Variables de Entorno
Puedes configurar estas variables para usar valores por defecto:

```bash
# En tu .env.local o terminal
export DEFAULT_TENANT_ID="tu-tenant-id"
export DEFAULT_ORGANIZATION_ID="tu-organization-id"
export FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
```

### Firebase Setup
Los scripts requieren acceso a Firebase Admin. Tienes dos opciones:

#### Opción 1: Variable de Entorno
```bash
export FIREBASE_SERVICE_ACCOUNT_KEY='{"type": "service_account", "project_id": "...", ...}'
```

#### Opción 2: Archivo Local
Crea `firebase-service-account.json` en la raíz del proyecto (no se commitea al repo):
```json
{
  "type": "service_account",
  "project_id": "tu-project-id",
  "private_key_id": "...",
  "private_key": "...",
  ...
}
```

## 📊 Datos Creados

### Estados de Leads Incluidos:
- **new** - Leads nuevos sin contactar
- **contacted** - Primer contacto realizado  
- **interested** - Muestran interés
- **qualified** - Cumplen criterios de calificación
- **proposal** - Propuesta enviada
- **negotiation** - En proceso de cierre
- **won** - Convertidos a clientes ✅
- **lost** - No convertidos ❌
- **nurturing** - En proceso de nutrición
- **follow_up** - Requieren seguimiento

### Fuentes de Leads:
- `website` - Sitio web
- `social_media` - Redes sociales  
- `referral` - Referencias
- `cold_call` - Llamadas en frío
- `advertisement` - Publicidad
- `email` - Email marketing

### Prioridades:
- `urgent` - Urgente 🔴
- `high` - Alta 🟠  
- `medium` - Media 🟡
- `low` - Baja ⚪

## 🎯 Uso en Desarrollo

### Para Pipeline Visual
Los leads creados se distribuyen en todas las columnas del pipeline Kanban, permitiendo probar:
- ✅ Drag & drop entre estados
- ✅ Estadísticas por columna
- ✅ Indicadores visuales (urgencia, scoring, etc.)
- ✅ Filtros y búsqueda

### Para Testing
Los datos incluyen:
- 📧 Emails válidos para testing
- 📞 Números de teléfono panameños
- 🏢 Empresas realistas
- 💰 Valores de conversión para análisis
- 📅 Fechas realistas para timeboxing

## 🐛 Troubleshooting

### Error: Firebase no inicializado
```bash
# Verificar configuración
echo $FIREBASE_SERVICE_ACCOUNT_KEY

# O verificar archivo
ls -la firebase-service-account.json
```

### Error: Permisos insuficientes
- Verificar que la cuenta de servicio tenga permisos de escritura en Firestore
- Verificar que las reglas de Firestore permitan escritura en la ruta de leads

### Error: Tenant/Organization no encontrado
- Verificar que el tenant y organization existan en Firebase
- Usar IDs exactos (case-sensitive)

## 📈 Próximos Pasos

Después de crear los leads de ejemplo:

1. **Visita** `/clients/leads` en tu aplicación
2. **Prueba** el pipeline visual (drag & drop)
3. **Explora** los filtros y búsqueda
4. **Testa** las acciones de lead (llamar, email, etc.)
5. **Verifica** las estadísticas del dashboard

¡Los scripts están listos para poblar tu sistema con datos realistas! 🎉