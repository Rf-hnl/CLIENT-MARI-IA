# Project Structure - Client Mar-IA

Este documento describe la estructura organizacional del proyecto Client Mar-IA, un sistema de autenticación modular con gestión de perfiles de usuario.

## 📁 Estructura de Directorios

### `/modules/` - ✨ **NUEVA: Arquitectura Modular y Submodular**
Organización modular del código por funcionalidad con soporte para submódulos:

#### `/modules/auth/` - Módulo de Autenticación
- **`pages/`** - Páginas del módulo de autenticación
  - **`login/page.tsx`** - Página de login principal
  - **`register/page.tsx`** - Página de registro de usuarios
  - **`verify/page.tsx`** - Pantalla de verificación de email
  - **`forgot-password/page.tsx`** - Recuperación de contraseña
- **`components/`** - Componentes específicos de autenticación
- **`context/AuthContext.tsx`** - Context de autenticación con Firebase
- **`hooks/useAuth.ts`** - Hook personalizado de autenticación
- **`types/auth.ts`** - Tipos TypeScript del módulo
- **`services/firebase.ts`** - Configuración Firebase para auth
- **`index.ts`** - Exportaciones centralizadas del módulo

#### `/modules/clients/` - ✨ **NUEVO: Módulo de Clientes (Submodular)**
Módulo principal con submódulos especializados:

- **`types/clients.ts`** - Tipos TypeScript para clientes y facturación
  - `Client` - Interfaz de cliente
  - `ClientBilling` - Interfaz de facturación
  - `ClientsContextType` - Tipos del contexto
- **`context/ClientsContext.tsx`** - Context principal de clientes
  - Estado global de clientes
  - Funciones CRUD preparadas para Firebase
  - Manejo de loading y errores
- **`hooks/useClients.ts`** - Hooks especializados
  - `useClients` - Hook principal
  - `useClientsAdmin` - Hook para administración
  - `useClientsBilling` - Hook para facturación
  - `useClientsStats` - Hook para estadísticas
- **`components/ProtectedClientRoute.tsx`** - Protección de rutas
- **`admin/index.ts`** - **Submódulo de Administración**
  - Funciones específicas para gestión de clientes
  - Validaciones y utilidades de administración
- **`billing/index.ts`** - **Submódulo de Facturación**
  - Funciones específicas para cobros
  - Cálculos y formateo de facturas
  - Estados de facturación
- **`__tests__/ClientsContext.test.tsx`** - Tests del módulo
- **`index.ts`** - Exportaciones centralizadas del módulo

### `/app/` - Rutas de Next.js App Router
Delegación a módulos especializados:

#### **Rutas Principales:**
- **`/app/page.tsx`** - Importa LoginPage desde /modules/auth/
- **`/app/(public)/auth/`** - Rutas públicas de autenticación
  - **`login/page.tsx`** - Página de login
  - **`register/page.tsx`** - Página de registro
  - **`verify/page.tsx`** - Verificación de email
  - **`forgot-password/page.tsx`** - Recuperación de contraseña
- **`/app/(private)/`** - Rutas protegidas
  - **`dashboard/page.tsx`** - Dashboard principal
  - **`profile/page.tsx`** - Gestión de perfil de usuario
  - **`clients/`** - ✨ **NUEVO: Submódulos de Clientes**
    - **`admin/page.tsx`** - Administración de clientes (módulo en desarrollo)
    - **`billing/page.tsx`** - Cobros y facturación (módulo en desarrollo)
- **`/app/layout.tsx`** - Layout raíz con AuthProvider y ThemeProvider
- **`/app/globals.css`** - Estilos globales con Tailwind CSS

### `/components/` - Componentes reutilizables
Componentes de UI organizados por funcionalidad:

#### `/components/ui/` - Componentes base de shadcn/ui
- `avatar.tsx`, `button.tsx`, `card.tsx`, `input.tsx`, `form.tsx`, etc.
- Componentes base del sistema de diseño

#### `/components/profile/` - ✨ **Módulo de Gestión de Perfil**
- **`ProfileForm.tsx`** - Formulario completo de gestión de perfil
  - Subida de imágenes con Cloudinary
  - Edición de nombre de usuario
  - Validación con react-hook-form y zod
  - Estados de loading y mensajes de éxito/error

### `/contexts/` - React Contexts
Manejo de estado global de la aplicación:

- **`AuthContext.tsx`** - Context principal de autenticación
  - Gestión de sesión con Firebase Auth
  - Funciones de login, registro, logout
  - Estado del usuario actual y loading

### `/lib/` - Funciones y configuraciones compartidas
Utilidades y configuraciones centralizadas:

- **`firebase.ts`** - Configuración cliente de Firebase
- **`cloudinary.ts`** - ✨ **Configuración y funciones de Cloudinary**
  - Upload de imágenes directo desde navegador
  - Validación de archivos
  - Optimización de URLs de imágenes
- **`utils.ts`** - Utilidades de Tailwind (cn helper)

### `/types/` - ✨ **Definiciones de tipos TypeScript**
Tipos globales sin uso de `any`:

- **`authProfile.ts`** - Tipos relacionados con perfiles de usuario
  - `UserProfile` - Estructura de datos del perfil
  - `ProfileFormData` - Datos del formulario
  - `CloudinaryUploadResult` - Respuesta de Cloudinary
  - Funciones helper para conversión de tipos

### `/hooks/` - Custom React Hooks
- Hooks personalizados para lógica reutilizable (reservado para futuras implementaciones)

### `/docs/` - ✨ **Documentación técnica del proyecto**
- **`project-structure.md`** - Este archivo de estructura
- Documentación adicional del proyecto

### **Archivos de configuración raíz:**

- **`middleware.ts`** - Middleware de Next.js para protección de rutas
  - Protege `/dashboard` y `/profile`
  - Manejo de redirecciones según autenticación

- **`.env.example`** - Template de variables de entorno
  - Variables de Firebase
  - ✨ **Variables de Cloudinary** para subida de imágenes

- **`components.json`** - Configuración de shadcn/ui
- **`tailwind.config.js`** - Configuración de Tailwind CSS
- **`tsconfig.json`** - Configuración de TypeScript
- **`next.config.ts`** - Configuración de Next.js

## 🧩 Módulos Implementados

### 1. **Módulo de Autenticación** ✅
- Login con email/contraseña y Google OAuth
- Registro con verificación de email
- Recuperación de contraseña
- Protección de rutas con middleware
- Persistencia de sesión

### 2. **Módulo de Gestión de Perfil** ✅
- Visualización de datos del usuario
- Edición de nombre de usuario
- Subida de foto de perfil con Cloudinary
- Validación de formularios con TypeScript estricto
- UI responsive con shadcn/ui

### 3. **Módulo de Clientes** ✨ **NUEVO: Sistema Submodular**
Arquitectura modular con submódulos especializados:

#### **Submódulo de Administración** 🚧 *En desarrollo*
- Gestión CRUD de clientes
- Validación de datos
- Estados de cliente (activo/inactivo/pendiente)
- Integración con Firebase preparada

#### **Submódulo de Facturación** 🚧 *En desarrollo*
- Gestión de facturas y cobros
- Cálculos automáticos
- Estados de facturación
- Reportes de pagos

#### **Características del Sistema Modular:**
- **Context unificado** - Estado global compartido entre submódulos
- **Hooks especializados** - Funciones específicas por submódulo
- **Tipos TypeScript** - Interfaces bien definidas
- **Protección de rutas** - Permisos por submódulo
- **Testing preparado** - Tests unitarios e integración
- **Firebase ready** - Preparado para integración completa

## 🔒 Seguridad y Protección

### Rutas Protegidas:
- `/dashboard` - Requiere autenticación y email verificado
- `/profile` - Requiere autenticación y email verificado
- `/clients/admin` - ✨ **NUEVO** - Administración de clientes
- `/clients/billing` - ✨ **NUEVO** - Cobros y facturación

### Validaciones:
- Tipos TypeScript estrictos (sin uso de `any`)
- Validación de archivos en cliente (tamaño, tipo)
- Variables de entorno para credenciales sensibles
- Middleware de protección de rutas

## 🎨 Sistema de Diseño

### UI Framework: shadcn/ui + Tailwind CSS
- Componentes consistentes y accesibles
- Tema customizable
- Responsive design
- Estados de loading y error

### Patrones de Componentes:
- Separación de lógica y presentación
- Props tipadas con TypeScript
- Manejo de estados loading/error/success
- Formularios con validación

## 🚀 Arquitectura Modular

### Principios de Organización:
1. **Separación de responsabilidades** - Cada módulo tiene su propósito específico
2. **Autocontención** - Los módulos pueden activarse/desactivarse independientemente
3. **Reutilización** - Componentes y funciones compartidas en `/lib` y `/components`
4. **Tipado estricto** - TypeScript sin `any` para mayor seguridad

### Estructura Modular:
```
Módulo de Perfil:
├── /app/profile/           # Página del módulo
├── /components/profile/    # Componentes específicos
├── /types/authProfile.ts   # Tipos del módulo
└── /lib/cloudinary.ts     # Funciones específicas
```

Esta estructura permite:
- ✅ Agregar nuevos módulos fácilmente
- ✅ Desactivar módulos sin afectar el resto
- ✅ Mantener código organizado y mantenible
- ✅ Escalabilidad del proyecto

## 📦 Dependencias Principales

### Core:
- **Next.js 15** - Framework React
- **TypeScript** - Tipado estático
- **Firebase v12** - Autenticación y backend

### UI/UX:
- **shadcn/ui** - Sistema de componentes
- **Tailwind CSS** - Framework de estilos
- **Lucide React** - Iconografía

### Formularios:
- **react-hook-form** - Manejo de formularios
- **zod** - Validación de esquemas

### Servicios Externos:
- **Cloudinary** - Gestión de imágenes

## 🔄 Flujo de Desarrollo

1. **Autenticación** → Usuario inicia sesión
2. **Verificación** → Email debe estar verificado
3. **Dashboard** → Acceso al panel principal
4. **Perfil** → ✨ Gestión de información personal
5. **Subida de imagen** → Integración con Cloudinary
6. **Persistencia** → Cambios guardados en Firebase

Esta estructura modular facilita el mantenimiento, testing y escalabilidad del proyecto.