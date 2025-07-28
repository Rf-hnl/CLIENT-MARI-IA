# API Endpoints - Client Communication History & AI Analysis

## 📋 Estructura Real de Datos Identificada

Después del análisis de la estructura real de Firebase, los datos están organizados de la siguiente manera:

```json
{
  "clients": {
    "clientId": {
      "_data": { /* IClient data */ },
      "customerInteractions": {
        "callLogs": [{ /* ICallLog[] */ }],
        "whatsAppRecords": [{ /* IWhatsAppRecord[] */ }],
        "emailRecords": [{ /* IEmailRecord[] */ }],
        "clientAIProfiles": { /* IClientAIProfile */ }
      }
    }
  }
}
```

## 🔄 Endpoints Corregidos

### 1. 📱 Historial de WhatsApp
**Endpoint:** `POST /api/client/whatsapp/get`

**Ruta Firebase real:**
```
tenants/{tenantId}/organizations/{organizationId}/clients/{clientId}
```

**Funcionalidad:**
- Obtiene `customerInteractions.whatsAppRecords` del documento del cliente
- Los datos reales vienen de **servicios MCP externos**
- Aquí solo se almacenan los IDs para referenciar los datos externos

**Tipo de respuesta:** `IWhatsAppRecord[]` (IDs almacenados)

---

### 2. 📞 Historial de Llamadas
**Endpoint:** `POST /api/client/calls/get`

**Ruta Firebase real:**
```
tenants/{tenantId}/organizations/{organizationId}/clients/{clientId}
```

**Funcionalidad:**
- Obtiene `customerInteractions.callLogs` del documento del cliente
- Los datos reales (transcripciones, audio) vienen de **servicios MCP externos**
- Integración con ElevenLabs vía MCP

**Tipo de respuesta:** `ICallLog[]` (IDs almacenados)

---

### 3. 📧 Historial de Correos Electrónicos
**Endpoint:** `POST /api/client/emails/get`

**Ruta Firebase real:**
```
tenants/{tenantId}/organizations/{organizationId}/clients/{clientId}
```

**Funcionalidad:**
- Obtiene `customerInteractions.emailRecords` del documento del cliente
- Los datos reales (contenido, adjuntos) vienen de **servicios MCP externos**
- Integración con Gmail API/SendGrid vía MCP

**Tipo de respuesta:** `IEmailRecord[]` (IDs almacenados)

---

### 4. 🤖 Sistema de Análisis con IA
**Endpoint:** `POST /api/client/ai-analysis/get`

**Ruta Firebase real:**
```
tenants/{tenantId}/organizations/{organizationId}/clients/{clientId}
```

**Funcionalidad:**
- Obtiene `customerInteractions.clientAIProfiles` del documento del cliente
- Los análisis pueden generarse vía **servicios MCP externos**
- Análisis basado en patrones de comunicación y datos del cliente

**Tipo de respuesta:** `IClientAIProfile | null`

---

## 🏗️ Tipos Actualizados

### IClient (Corregido)
- ✅ Coincide exactamente con la estructura real de datos
- ✅ Incluye `available_credit` encontrado en datos reales
- ✅ Campo `email` como parte del cliente (no solo en comunicaciones)
- ✅ Campos organizados por categorías lógicas

### IClientDocument (Nuevo)
```typescript
interface IClientDocument {
  _data: IClient;
  customerInteractions?: ICustomerInteractions;
}
```

### ICustomerInteractions (Nuevo)
```typescript
interface ICustomerInteractions {
  callLogs?: ICallLog[];
  whatsAppRecords?: IWhatsAppRecord[];
  emailRecords?: IEmailRecord[];
  clientAIProfiles?: IClientAIProfile;
}
```

---

## 🔌 Integración MCP

### Concepto Clave: **Arquitectura Híbrida**
1. **Firebase:** Almacena IDs y metadatos básicos
2. **Servicios MCP:** Proporcionan datos completos y funcionalidades avanzadas
3. **Endpoints:** Actúan como orquestadores entre Firebase y MCP

### Servicios MCP Identificados:
- **WhatsApp:** Bot conversacional, mensajes, medios
- **Llamadas:** ElevenLabs para transcripciones y análisis
- **Emails:** Gmail API/SendGrid para contenido y entrega
- **IA:** OpenAI/Claude para análisis y recomendaciones

---

## ✅ Estado Actual Corregido

Todos los endpoints están:
- ✅ **Corregidos** para usar la estructura real de `customerInteractions`
- ✅ **Validados** con datos de cliente existentes
- ✅ **Preparados** para integración MCP
- ✅ **Documentados** con rutas Firebase reales
- ✅ **Build exitoso** sin errores

## 🚀 Próximos Pasos

1. **Definir integraciones MCP específicas** para cada servicio
2. **Implementar lógica de orquestación** entre Firebase y MCP
3. **Configurar autenticación y autorización** para servicios externos
4. **Optimizar rendimiento** con caching y batching de requests MCP