# Manual Completo del Proyecto Client MAR-IA

## 📋 Índice

1. [Visión General del Proyecto](#visión-general-del-proyecto)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Funcionalidades Principales](#funcionalidades-principales)
4. [Integración con Servicios Externos](#integración-con-servicios-externos)
5. [Base de Datos y Estructura de Datos](#base-de-datos-y-estructura-de-datos)
6. [APIs y Endpoints](#apis-y-endpoints)
7. [Configuración y Despliegue](#configuración-y-despliegue)
8. [Guía de Desarrollo](#guía-de-desarrollo)
9. [Testing y Calidad](#testing-y-calidad)
10. [Seguridad](#seguridad)

---

## 🎯 Visión General del Proyecto

**Client MAR-IA** es una plataforma integral de gestión de relaciones con clientes (CRM) especializada en:

- **Gestión de Leads**: Sistema completo de manejo de prospectos
- **Gestión de Clientes**: Administración de clientes existentes
- **Sistema de Cobros**: Automatización de cobros y seguimiento de pagos
- **Comunicación Multicanal**: WhatsApp, llamadas telefónicas y email
- **Inteligencia Artificial**: Perfiles de IA basados en interacciones

### Tecnologías Principales

- **Frontend**: Next.js 15 con TypeScript
- **Backend**: Next.js API Routes
- **Base de Datos**: Firebase Firestore
- **Autenticación**: Firebase Auth
- **UI/UX**: shadcn/ui + Tailwind CSS
- **Comunicación**: MCP (Model Context Protocol) para WhatsApp
- **Llamadas**: ElevenLabs para transcripción de audio
- **Imágenes**: Cloudinary para gestión de archivos

---

## 🏗️ Arquitectura del Sistema

### Estructura Modular

El proyecto sigue una arquitectura modular con los siguientes módulos principales:

```
client-mar-ia/
├── modules/
│   ├── auth/           # Autenticación y autorización
│   ├── clients/        # Gestión de clientes
│   ├── leads/          # Gestión de leads/prospectos
│   └── agents/         # Agentes de IA (ElevenLabs)
├── app/                # Rutas Next.js App Router
├── components/         # Componentes reutilizables
├── lib/                # Utilidades y configuraciones
└── types/              # Definiciones TypeScript
```

### Patrones de Diseño

- **Context Pattern**: Manejo de estado global
- **Hook Pattern**: Lógica reutilizable
- **Module Pattern**: Separación de responsabilidades
- **API Route Pattern**: Endpoints RESTful

---

## ⚡ Funcionalidades Principales

### 1. Sistema de Autenticación

#### Características:
- Login con email/contraseña
- Autenticación con Google OAuth
- Registro con verificación de email
- Recuperación de contraseña
- Protección de rutas con middleware

#### Archivos clave:
- `modules/auth/context/AuthContext.tsx`
- `middleware.ts`
- `app/(public)/auth/`

### 2. Gestión de Leads

#### Características:
- CRUD completo de leads
- Pipeline de ventas con estados
- Importación masiva desde CSV
- Conversión de leads a clientes
- Scoring automático de leads

#### Estados de Lead:
```typescript
type LeadStatus = 
  | "new"                    // Nuevos Leads
  | "interested"             // Leads Potenciales
  | "qualified"              // Calificado
  | "follow_up"              // En seguimiento
  | "proposal_current"       // Cotizaciones actuales
  | "proposal_previous"      // Cotizaciones previas
  | "negotiation"            // Negociación
  | "nurturing"              // A futuro
  | "won"                    // Ganado
  | "lost"                   // Perdido
  | "cold"                   // Descartados
```

#### Archivos clave:
- `modules/leads/types/leads.ts`
- `modules/leads/context/LeadsContext.tsx`
- `app/(private)/clients/leads/page.tsx`

### 3. Gestión de Clientes

#### Características:
- Administración completa de clientes
- Historial de interacciones
- Análisis con IA
- Perfiles automáticos basados en comportamiento
- Sistema de migración de datos

#### Tipos de Cliente:
```typescript
interface IClient {
  id: string;
  name: string;
  national_id: string;
  phone: string;
  email?: string;
  debt: number;
  status: ClientStatus;
  // ... más campos
}
```

#### Archivos clave:
- `modules/clients/types/clients.ts`
- `modules/clients/context/ClientsContext.tsx`
- `app/(private)/clients/`

### 4. Sistema de Cobros

#### Características:
- Llamadas automatizadas para cobros
- Seguimiento de conversaciones
- Batch processing de llamadas
- Integración con ElevenLabs para transcripción
- Reportes de efectividad

#### Archivos clave:
- `app/api/cobros/`
- `components/cobros/`
- `types/cobros.ts`

### 5. Comunicación Multicanal

#### WhatsApp (MCP Integration)
- Integración completa con MCP
- Conversaciones en tiempo real
- Historial de mensajes
- Acciones automatizadas

#### Llamadas Telefónicas
- Integración con ElevenLabs
- Transcripción automática
- Análisis de sentimientos
- Métricas de llamadas

#### Email
- Envío automático de emails
- Seguimiento de apertura
- Templates personalizables

### 6. Inteligencia Artificial

#### Perfiles de IA
```typescript
interface IClientAIProfile {
  clientId: string;
  communicationPreference: string;
  responsePattern: string;
  paymentBehavior: string;
  riskScore: number;
  recommendedAction: string;
  insights: string[];
}
```

#### Características:
- Análisis automático de interacciones
- Recomendaciones de acciones
- Predicción de comportamiento de pago
- Segmentación automática

---

## 🔗 Integración con Servicios Externos

### 1. Firebase

#### Configuración:
```typescript
// lib/firebase/client.ts
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // ...
};
```

#### Uso:
- **Auth**: Autenticación de usuarios
- **Firestore**: Base de datos NoSQL
- **Storage**: Almacenamiento de archivos (reservado)

### 2. MCP (Model Context Protocol) - WhatsApp

#### Configuración:
```typescript
// lib/services/mcpWhatsApp.ts
const MCP_BASE_URL = 'https://cobros.maiz.studio';
```

#### APIs:
- `POST /start-conversation/{clientId}` - Iniciar conversación
- `GET /users/{clientId}/conversations?days=7` - Obtener historial

### 3. ElevenLabs

#### Configuración:
```typescript
interface ElevenLabsConfig {
  apiKey: string;
  agentId: string;
  voiceId: string;
}
```

#### Uso:
- Transcripción de llamadas
- Análisis de audio
- Generación de reportes

### 4. Cloudinary

#### Configuración:
```typescript
// lib/cloudinary/index.ts
const cloudinaryConfig = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
};
```

#### Uso:
- Subida de imágenes de perfil
- Optimización automática
- Transformaciones de imagen

---

## 🗄️ Base de Datos y Estructura de Datos

### Estructura de Firebase Firestore

```
firestore/
├── tenants/
│   └── {tenantId}/
│       ├── organizations/
│       │   └── {organizationId}/
│       │       ├── clients/
│       │       │   └── {clientId}/
│       │       │       ├── _data: IClient
│       │       │       └── customerInteractions/
│       │       │           ├── callLogs: ICallLog[]
│       │       │           ├── emailRecords: IEmailRecord[]
│       │       │           └── clientAIProfiles: IClientAIProfile
│       │       ├── leads/
│       │       │   └── {leadId}/
│       │       │       ├── _data: ILead
│       │       │       └── leadInteractions/
│       │       │           ├── callLogs: ILeadCallLog[]
│       │       │           ├── emailRecords: ILeadEmailRecord[]
│       │       │           ├── whatsappRecords: ILeadWhatsAppRecord[]
│       │       │           └── leadAIProfile: ILeadAIProfile
│       │       └── agents/
│       │           └── {agentId}/
│       │               └── _data: IAgent
│       └── users/
│           └── {userId}/
│               └── profile: IUserProfile
```

### Modelos de Datos Principales

#### Cliente (IClient)
```typescript
interface IClient {
  id: string;
  name: string;
  national_id: string;
  phone: string;
  email?: string;
  debt: number;
  status: ClientStatus;
  payment_date?: IFirebaseTimestamp;
  due_date?: IFirebaseTimestamp;
  // ... campos adicionales
}
```

#### Lead (ILead)
```typescript
interface ILead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: LeadStatus;
  source: LeadSource;
  priority: LeadPriority;
  qualification_score: number;
  // ... campos adicionales
}
```

#### Interacciones
```typescript
interface ICustomerInteractions {
  callLogs?: ICallLog[];
  emailRecords?: IEmailRecord[];
  clientAIProfiles?: IClientAIProfile;
}
```

---

## 🔌 APIs y Endpoints

### Estructura de APIs

```
app/api/
├── auth/                    # Autenticación
│   ├── login/route.ts
│   └── register/route.ts
├── client/                  # Gestión de clientes
│   ├── admin/
│   ├── ai-analysis/
│   ├── calls/
│   └── whatsapp/
├── leads/                   # Gestión de leads
│   ├── admin/
│   ├── convert/
│   └── import/
├── cobros/                  # Sistema de cobros
│   └── batch-calls/
└── tenant/                  # Configuración de tenant
    └── agents/
```

### Endpoints Principales

#### Clientes
- `GET /api/client/admin/get` - Obtener clientes
- `POST /api/client/admin/create` - Crear cliente
- `PUT /api/client/admin/update` - Actualizar cliente
- `DELETE /api/client/admin/delete` - Eliminar cliente
- `POST /api/client/whatsapp/start-conversation` - Iniciar conversación WhatsApp

#### Leads
- `GET /api/leads/admin/get` - Obtener leads
- `POST /api/leads/admin/create` - Crear lead
- `POST /api/leads/convert` - Convertir lead a cliente
- `POST /api/leads/import/bulk` - Importación masiva

#### Cobros
- `POST /api/cobros/batch-calls/{batchId}` - Iniciar batch de llamadas
- `GET /api/cobros/batch-calls/list` - Listar batches

### Formato de Respuestas API

```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}
```

---

## ⚙️ Configuración y Despliegue

### Variables de Entorno

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (Server-side)
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PROJECT_ID=

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=

# ElevenLabs
ELEVENLABS_API_KEY=
```

### Scripts Disponibles

```json
{
  "dev": "next dev --turbopack",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "create-sample-leads": "node scripts/create-sample-leads.js",
  "quick-leads": "node scripts/quick-create-leads.js"
}
```

### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  client-maria:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.local
```

### CI/CD Pipeline

El proyecto utiliza Azure DevOps para integración y despliegue continuo:

- **Build automático**: Se activa con cada push al repositorio
- **Tests automáticos**: Ejecuta lint, tests unitarios y build
- **Despliegue**: Automático a Azure App Service tras build exitoso

---

## 👨‍💻 Guía de Desarrollo

### Configuración del Entorno

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd client-mar-ia
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env.local
# Editar .env.local con las credenciales correctas
```

4. **Ejecutar en desarrollo**
```bash
npm run dev
```

### Estructura de Desarrollo

#### Crear un nuevo módulo

1. **Crear estructura de carpetas**
```
modules/nuevo-modulo/
├── components/
├── context/
├── hooks/
├── types/
├── utils/
└── index.ts
```

2. **Definir tipos TypeScript**
```typescript
// types/nuevo-modulo.ts
export interface INuevoModulo {
  id: string;
  // ... propiedades
}
```

3. **Crear contexto**
```typescript
// context/NuevoModuloContext.tsx
export const NuevoModuloContext = createContext<INuevoModuloContextType | undefined>(undefined);
```

4. **Implementar hook personalizado**
```typescript
// hooks/useNuevoModulo.ts
export const useNuevoModulo = () => {
  const context = useContext(NuevoModuloContext);
  if (!context) {
    throw new Error('useNuevoModulo must be used within NuevoModuloProvider');
  }
  return context;
};
```

### Convenciones de Código

#### Naming Conventions
- **Componentes**: PascalCase (`ClientForm.tsx`)
- **Hooks**: camelCase con prefijo `use` (`useClients.ts`)
- **Tipos**: PascalCase con prefijo `I` (`IClient`)
- **Variables**: camelCase (`clientData`)
- **Constantes**: UPPER_SNAKE_CASE (`API_BASE_URL`)

#### Estructura de Archivos
```typescript
// Importaciones externas primero
import React from 'react';
import { NextResponse } from 'next/server';

// Importaciones internas
import { IClient } from '@/modules/clients/types/clients';
import { formatClientData } from '@/utils/clientUtils';

// Tipos e interfaces
interface ComponentProps {
  client: IClient;
}

// Componente principal
export default function Component({ client }: ComponentProps) {
  // lógica del componente
}
```

---

## 🧪 Testing y Calidad

### Configuración de Testing

```javascript
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
}

module.exports = createJestConfig(customJestConfig)
```

### Tipos de Tests

#### Tests Unitarios
```typescript
// __tests__/components/ClientForm.test.tsx
import { render, screen } from '@testing-library/react';
import ClientForm from '@/components/clients/ClientForm';

describe('ClientForm', () => {
  it('renders correctly', () => {
    render(<ClientForm />);
    expect(screen.getByText('Client Form')).toBeInTheDocument();
  });
});
```

#### Tests de Integración
```typescript
// __tests__/api/client/create.test.ts
import { POST } from '@/app/api/client/admin/create/route';

describe('/api/client/admin/create', () => {
  it('creates client successfully', async () => {
    const request = new Request('http://localhost:3000/api/client/admin/create', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Client' }),
    });
    
    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
```

### Calidad de Código

#### ESLint
```javascript
// eslint.config.mjs
export default [
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
];
```

#### TypeScript
- Configuración estricta habilitada
- No uso de `any`
- Tipos explícitos para todas las funciones públicas

---

## 🔐 Seguridad

### Autenticación y Autorización

#### Firebase Auth
- Tokens JWT automáticos
- Verificación de email obligatoria
- Protección de rutas con middleware

#### Protección de APIs
```typescript
// Ejemplo de protección de API
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Verificar token
  const token = authHeader.replace('Bearer ', '');
  const decodedToken = await admin.auth().verifyIdToken(token);
  
  // Continuar con la lógica de la API
}
```

### Validación de Datos

#### Zod Schemas
```typescript
import { z } from 'zod';

const ClientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  email: z.string().email().optional(),
});
```

### Configuración de Seguridad

#### Middleware
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const protectedRoutes = ['/dashboard', '/clients', '/leads'];
  const pathname = request.nextUrl.pathname;
  
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    // Verificar autenticación
  }
  
  return NextResponse.next();
}
```

#### Headers de Seguridad
```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];
  },
};
```

### Manejo de Datos Sensibles

- Variables de entorno para credenciales
- No logging de datos sensibles
- Encriptación de datos en tránsito (HTTPS)
- Validación y sanitización de inputs

---

## 📚 Recursos Adicionales

### Documentación Técnica
- `docs/project-structure.md` - Estructura del proyecto
- `docs/api-endpoints-placeholder.md` - Documentación de APIs
- `docs/clients-data-flow.md` - Flujo de datos de clientes
- `MCP_WHATSAPP_INTEGRATION.md` - Integración con WhatsApp

### Scripts de Utilidad
- `scripts/create-sample-leads.js` - Crear leads de muestra
- `scripts/quick-create-leads.js` - Creación rápida de leads
- `scripts/generate-sample-csv.js` - Generar CSVs de muestra

### Herramientas de Desarrollo
- **Next.js DevTools**: Debugging de aplicación
- **Firebase Emulator**: Testing local
- **Postman**: Testing de APIs
- **React DevTools**: Debugging de componentes

---

*Última actualización: Enero 2025*
*Versión del proyecto: 0.1.0*