# Client Mar-IA - Sistema de Autenticación y Gestión de Perfil

Desarrollo completo de autenticación y gestión de perfil de usuario con Next.js (TypeScript), Firebase Auth y Cloudinary. Incluye login/registro, verificación de email, recuperación de contraseña, protección de rutas y gestión completa de perfil con subida de imágenes.

## Características

✅ **Registro con correo y contraseña**
- Creación de cuenta con validación
- Envío automático de correo de verificación

✅ **Inicio de sesión múltiple**
- Correo electrónico y contraseña
- Google OAuth (Sign-In con Google)

✅ **Gestión de cuentas**
- Pantalla de verificación de email con opción de reenvío
- Recuperación de contraseña por email
- Cierre de sesión seguro

✅ **Protección de rutas**
- Middleware para proteger rutas sensibles
- Redirección automática según estado de autenticación
- Componente ProtectedRoute reutilizable

✅ **Persistencia de sesión**
- Gestión automática de sesión con Firebase Auth
- AuthContext para manejo global del estado

✅ **Gestión de Perfil de Usuario** 🆕
- Visualización de información personal del usuario
- Edición de nombre de usuario (updateProfile Firebase)
- Subida de foto de perfil con Cloudinary
- Validación de archivos (tamaño, tipo, seguridad)
- Formularios con react-hook-form y validación Zod
- Estados de loading, error y éxito
- UI responsive con shadcn/ui

## Tecnologías

- **Next.js 15** con TypeScript
- **Firebase v12** (modular imports)
- **Cloudinary** para gestión de imágenes
- **shadcn/ui** + **Tailwind CSS** para UI/UX
- **React Hook Form** + **Zod** para formularios
- **React Context** para gestión de estado
- **Next.js App Router** (nueva arquitectura)

## Estructura del Proyecto

```
├── app/
│   ├── page.tsx                 # Página de login
│   ├── register/page.tsx        # Página de registro
│   ├── verify/page.tsx          # Verificación de email
│   ├── forgot-password/page.tsx # Recuperar contraseña
│   ├── dashboard/page.tsx       # Dashboard protegido
│   ├── profile/page.tsx         # 🆕 Gestión de perfil
│   └── layout.tsx               # Layout principal con AuthProvider
├── components/
│   ├── ui/                      # 🆕 Componentes shadcn/ui
│   ├── profile/                 # 🆕 Módulo de perfil
│   │   └── ProfileForm.tsx      # 🆕 Formulario de perfil
│   └── ProtectedRoute.tsx       # Componente para proteger rutas
├── contexts/
│   └── AuthContext.tsx          # Context de autenticación
├── types/                       # 🆕 Tipos TypeScript
│   └── authProfile.ts           # 🆕 Tipos del perfil de usuario
├── lib/
│   ├── firebase.ts              # Configuración de Firebase
│   ├── cloudinary.ts            # 🆕 Configuración de Cloudinary
│   └── utils.ts                 # Utilidades (Tailwind merge)
├── docs/                        # 🆕 Documentación técnica
│   └── project-structure.md     # 🆕 Estructura del proyecto
├── middleware.ts                # Middleware de Next.js
└── .env.example                 # Template de variables de entorno
```

## Instalación

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd client-mar-ia
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar Firebase

1. Crear un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilitar Authentication con:
   - Email/Password
   - Google Sign-In
3. Obtener las credenciales del proyecto

### 4. Configurar Cloudinary 🆕

1. Crear cuenta en [Cloudinary](https://cloudinary.com/)
2. Crear un upload preset:
   - Ir a Settings → Upload
   - Crear preset sin autenticación (unsigned)
   - Configurar folder: `user-profiles`
   - Habilitar transformaciones automáticas
3. Obtener Cloud Name y Upload Preset

### 5. Configurar variables de entorno

Copiar el archivo de ejemplo y completar con tus credenciales:

```bash
cp .env.example .env.local
```

Editar `.env.local` con tus credenciales:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key_aqui
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id

# Cloudinary Configuration (for profile image uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=tu_cloudinary_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=tu_upload_preset_name
```

### 6. Ejecutar el proyecto

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en tu navegador.

## Uso

### Flujo de Autenticación

1. **Registro**: 
   - Usuario crea cuenta en `/register`
   - Se envía automáticamente email de verificación
   - Redirección a `/verify`

2. **Verificación**: 
   - Usuario debe verificar email antes de acceder al dashboard
   - Opción de reenviar correo de verificación
   - Una vez verificado, acceso automático al dashboard

3. **Login**:
   - Email/contraseña en `/` (página principal)
   - Google Sign-In (OAuth)
   - Redirección automática al dashboard si ya está autenticado

4. **Protección de rutas**:
   - `/dashboard` y `/profile` requieren autenticación y email verificado
   - Redirección automática según estado de usuario

### Flujo de Gestión de Perfil 🆕

1. **Acceso al perfil**:
   - Desde el dashboard o directamente en `/profile`
   - Requiere autenticación y email verificado

2. **Visualización de datos**:
   - Información actual del usuario desde Firebase Auth
   - Email (solo lectura), nombre, foto de perfil
   - Estado de verificación y fecha de registro

3. **Edición de perfil**:
   - Cambio de nombre de usuario (updateProfile Firebase)
   - Subida de nueva foto de perfil
   - Validación en tiempo real

4. **Subida de imágenes**:
   - Drag & drop o selección de archivo
   - Validación: máximo 5MB, formatos JPEG/PNG/WebP/GIF
   - Subida directa a Cloudinary
   - Preview en tiempo real

### Páginas disponibles

- `/` - Login principal
- `/register` - Registro de nuevos usuarios
- `/verify` - Verificación de email
- `/forgot-password` - Recuperación de contraseña
- `/dashboard` - Panel principal (protegido)
- `/profile` - 🆕 Gestión de perfil (protegido)

## Despliegue

### Vercel (Recomendado)

1. Conectar repositorio a Vercel
2. Configurar variables de entorno en el panel de Vercel
3. Deploy automático

### Otros proveedores

El proyecto es compatible con cualquier plataforma que soporte Next.js:
- Netlify
- Railway
- Digital Ocean App Platform

## Desarrollo

### Comandos disponibles

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Construir para producción
npm run start    # Iniciar servidor de producción
npm run lint     # Linter de código
```

### Estructura del AuthContext

El contexto de autenticación proporciona:

- `currentUser`: Usuario actual (null si no autenticado)
- `login()`: Iniciar sesión con email/contraseña
- `register()`: Registrar nuevo usuario
- `logout()`: Cerrar sesión
- `resetPassword()`: Enviar email de recuperación
- `googleSignIn()`: Autenticación con Google
- `resendVerification()`: Reenviar email de verificación
- `loading`: Estado de carga

### Personalización

El proyecto usa Tailwind CSS para los estilos. Puedes personalizar:

- Colores en `tailwind.config.js`
- Componentes en las respectivas páginas
- Mensajes de error/éxito en español

## Seguridad

- Variables de entorno para credenciales sensibles
- Validación tanto en cliente como servidor
- Protección de rutas con middleware
- Verificación de email obligatoria para acceso completo

## Contribución

1. Fork del proyecto
2. Crear rama para feature (`git checkout -b feature/AmazingFeature`)
3. Commit de cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## Licencia

Proyecto privado - Todos los derechos reservados
