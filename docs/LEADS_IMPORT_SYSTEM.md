# 📊 Sistema de Importación Masiva de Leads

## 🌟 Resumen

Sistema completo para importar leads masivamente desde archivos CSV del CRM externo hacia Firebase. Incluye mapeo inteligente de datos, validación robusta y una interfaz intuitiva con preview y estadísticas en tiempo real.

## 🏗️ Arquitectura del Sistema

### 📁 Estructura de Archivos

```
📦 Sistema de Importación de Leads
├── 🔧 modules/leads/utils/csvImporter.ts        # Lógica de importación y mapeo
├── 🌐 app/api/leads/import/bulk/route.ts        # API endpoint para importación
├── 💻 components/leads/BulkImportModal.tsx      # Interface de usuario
├── 📊 scripts/generate-sample-csv.js            # Generador de datos de prueba
├── 📋 data/sample-leads.csv                     # Archivo de muestra
└── 📄 data/Lead (crm.lead) (7).csv             # Archivo original del CRM
```

### 🔄 Flujo de Importación

1. **📤 Carga de Archivo**: Usuario selecciona archivo CSV
2. **✅ Validación**: Verificación de estructura y formato
3. **👁️ Preview**: Vista previa con estadísticas y primeros 10 registros
4. **🚀 Importación**: Procesamiento en lotes hacia Firebase
5. **📈 Resultados**: Reporte final con métricas y errores

## 🗺️ Mapeo de Datos

### 📊 Estados (Lead Status)

| CRM Original | Sistema Interno | Descripción |
|--------------|-----------------|-------------|
| `Nuevos Leads / Pendientes` | `new` | Leads sin contactar |
| `Leads Potenciales / Prioritario` | `interested` | Muestran interés |
| `Calificado - En seguimiento` | `qualified` | Cumplen criterios |
| `En seguimiento / Sin respuesta` | `follow_up` | Requieren seguimiento |
| `Negociación / En ajustes` | `negotiation` | En proceso de cierre |
| `Cotización enviada...` | `proposal` | Propuesta enviada |
| `A futuro / En pausa` | `nurturing` | En proceso de nutrición |
| `Ganado / Cerrado` | `won` | Convertidos a clientes |
| `Propuesta declinada` | `lost` | No convertidos |
| `Leads descartados...` | `cold` | Prospecto frío |

### 🎯 Prioridades

| CRM Original | Sistema Interno |
|--------------|-----------------|
| `Muy alta` | `urgent` |
| `Alta` | `high` |
| `Medio` | `medium` |
| `Baja` | `low` |

### 📡 Fuentes (Lead Sources)

El sistema infiere automáticamente la fuente basándose en:
- **Nombre de la oportunidad**: keywords como "web", "social", etc.
- **Actividades**: "llamada" → `cold_call`
- **Contexto**: referencias a "referido", "email", etc.
- **Default**: `other` si no se puede determinar

## 🚀 Uso del Sistema

### 1. 📤 Importación Manual

1. Ve a **Administración de Leads**
2. Haz clic en **"Importar CSV"**
3. Selecciona tu archivo CSV
4. Revisa la **vista previa** y estadísticas
5. Confirma la **importación**

### 2. 📋 Formato de CSV

**Headers requeridos:**
```csv
Etapa;Probabilidad;Activo;Moneda;MMR esperado;Equipo de ventas;Ganado/Perdido;Índice de Colores;Oportunidad;Ingresos esperados;Cliente;Etiquetas;Propiedades;Prioridad;Actividades;Decoración de Actividad de Excepción;Icono;Estado de la actividad;Resumen de la siguiente actividad;Icono de tipo de actvidad;Tipo de la siguiente actividad;Comercial;Propiedad 1
```

**Ejemplo de fila:**
```csv
Nuevos Leads / Pendientes;25.5;VERDADERO;PAB;0.00;Ventas;Pendiente;0;Tech Solutions Panama;1500.00;Tech Solutions Panama;prospecto,interesado;Contacto vía LinkedIn;Alta;Llamada de seguimiento;;;Planificado;Llamada de seguimiento;fa-check;Actividades pendientes;ventas@empresa.com;
```

### 3. 🔧 Generación de Datos de Prueba

```bash
# Generar 50 leads de muestra
node scripts/generate-sample-csv.js 50

# Generar con ubicación personalizada
node scripts/generate-sample-csv.js 25 ./mi-archivo.csv
```

## 🔍 Funcionalidades Avanzadas

### 🧠 Detección Inteligente

- **Empresas vs Personas**: Algoritmo para distinguir entre nombres de empresa y personas
- **Fuentes Automáticas**: Inferencia de canal de origen basada en contexto
- **Calificación**: Score automático basado en probabilidad del CRM
- **Teléfonos**: Generación de placeholders para leads sin teléfono

### 📊 Validaciones

- **Estructura CSV**: Verificación de headers requeridos
- **Formato de Datos**: Validación de tipos y rangos
- **Duplicados**: Detección de oportunidades repetidas
- **Integridad**: Consistencia entre campos relacionados

### ⚡ Optimizaciones

- **Procesamiento por Lotes**: Máximo 450 operaciones por batch de Firestore
- **Timestamps Firebase**: Conversión correcta de fechas
- **Manejo de Errores**: Continuación de importación aunque fallen algunos registros
- **Preview Limitado**: Solo primeros 10 registros para optimizar UX

## 📈 Estadísticas de Importación

El sistema proporciona métricas detalladas:

- **📊 Totales**: Leads importados vs omitidos
- **📈 Distribución por Estado**: Cuántos leads por cada status
- **🎯 Distribución por Prioridad**: Análisis de prioridades
- **📡 Distribución por Fuente**: Origen de los leads
- **⚠️ Errores**: Lista de problemas encontrados

## 🔧 API Endpoints

### POST `/api/leads/import/bulk`

**Request:**
```json
{
  "tenantId": "tenant_123",
  "organizationId": "org_456", 
  "csvContent": "Etapa;Probabilidad;...",
  "dryRun": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "importedCount": 45,
    "skippedCount": 5,
    "errors": ["Error en lead 'Nombre': campo requerido faltante"],
    "stats": {
      "totalRows": 50,
      "validLeads": 45,
      "statusDistribution": {...},
      "priorityDistribution": {...}
    }
  }
}
```

### GET `/api/leads/import/bulk`

Descarga plantilla CSV de ejemplo.

## 🛠️ Configuración Técnica

### 🔥 Firebase Structure

```
📁 tenants/{tenantId}/organizations/{organizationId}/leads/{leadId}
{
  id: string,
  name: string,
  phone: string,
  status: LeadStatus,
  source: LeadSource,
  priority: LeadPriority,
  qualification_score: number,
  // ... más campos según ILead interface
}
```

### 🔗 Dependencias

- **Firebase Admin SDK**: Para operaciones batch en Firestore
- **React Components**: Modal, Progress, Tables, etc.
- **TypeScript**: Tipado fuerte para toda la lógica
- **Next.js API Routes**: Endpoints serverless

## 🚀 Próximas Mejoras

### 📋 Roadmap

- [ ] **🔄 Importación Automática**: Webhook para importar desde CRM automáticamente
- [ ] **📧 Notificaciones**: Email cuando termine la importación
- [ ] **🔍 Deduplicación**: Detección inteligente de leads duplicados
- [ ] **📊 Mapeo Personalizado**: Interface para configurar mapeos
- [ ] **🔒 Validaciones Personalizadas**: Reglas de negocio configurables
- [ ] **📈 Métricas Históricas**: Tracking de importaciones anteriores

### 🎯 Optimizaciones Futuras

- **⚡ Streaming**: Procesamiento en tiempo real para archivos grandes
- **🧠 ML Integration**: Machine learning para mapeo automático
- **🔧 Field Mapping UI**: Interface visual para mapear campos
- **📊 Advanced Analytics**: Dashboard de importaciones
- **🔄 Sync Integration**: Sincronización bidireccional con CRM

## 🤝 Contribución

Para contribuir al sistema de importación:

1. 🌿 Crea una rama: `git checkout -b feature/importacion-mejora`
2. 📝 Implementa cambios siguiendo los patrones existentes
3. 🧪 Agrega tests para nuevas funcionalidades
4. 📋 Actualiza documentación si es necesario
5. 🚀 Crea Pull Request con descripción detallada

## 📞 Soporte

Para problemas con la importación:

1. 🔍 Revisa los logs en la consola del navegador
2. 📋 Verifica el formato del CSV con la plantilla
3. 🧪 Prueba con el archivo de muestra generado
4. 📧 Contacta al equipo de desarrollo con detalles del error

---

**🎉 Sistema desarrollado para optimizar la migración y gestión de leads desde sistemas CRM externos hacia la plataforma interna con máxima eficiencia y precisión.**