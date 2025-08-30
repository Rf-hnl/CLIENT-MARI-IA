# Deploy a Vercel - Client MAR-IA

Esta rama está configurada específicamente para deployment en Vercel como alternativa a Docker/Azure.

## 🚀 Configuración Rápida

### 1. Preparar el Proyecto
```bash
# Cambiar a la rama de Vercel
git checkout vercel-deploy

# Cambiar configuración para Vercel
npm run switch:vercel

# Instalar dependencias
npm ci
```

### 2. Variables de Entorno
Copia `.env.example.vercel` y configura:

```bash
cp .env.example.vercel .env.local
```

**Variables Requeridas:**
- `DATABASE_URL` - PostgreSQL database URL
- `NEXTAUTH_SECRET` - Authentication secret
- `NEXTAUTH_URL` - Your Vercel app URL
- `OPENAI_API_KEY` - OpenAI API key
- `ELEVENLABS_API_KEY` - ElevenLabs API key
- `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Base de Datos
**Opciones recomendadas para Vercel:**

#### Opción A: Vercel Postgres (Recomendado)
```bash
# En el dashboard de Vercel
1. Ve a Storage → Create Database → Postgres
2. Copia la DATABASE_URL generada
3. Ejecuta: npx prisma db push
```

#### Opción B: Supabase Database
```bash
# En supabase.com
1. Crear nuevo proyecto
2. Copiar Database URL de Settings → Database
3. Ejecutar: npx prisma db push
```

### 4. Deploy a Vercel

#### Opción A: Vercel CLI
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Opción B: GitHub Integration
```bash
# Push a GitHub
git add .
git commit -m "Setup Vercel deployment"
git push origin vercel-deploy

# En vercel.com:
# 1. Import from GitHub
# 2. Select vercel-deploy branch
# 3. Configure environment variables
```

## 📋 Diferencias con Docker/Azure

### Archivos Específicos para Vercel:
- `next.config.vercel.ts` - Configuración sin 'standalone'
- `vercel.json` - Configuración de funciones y timeouts
- `.env.example.vercel` - Template de variables de entorno

### Scripts de Cambio:
- `npm run switch:vercel` - Cambiar a configuración Vercel
- `npm run switch:docker` - Volver a configuración Docker

## ⚠️ Consideraciones

### Limitaciones de Vercel:
- **Serverless Functions**: Timeout máximo 60s (Hobby) / 300s (Pro)
- **Cold Starts**: Primera ejecución puede ser más lenta
- **Database Connections**: Usar connection pooling

### Funciones con Timeout Extendido:
```json
// En vercel.json
"functions": {
  "app/api/ai/**/*.ts": { "maxDuration": 60 },
  "app/api/calls/**/*.ts": { "maxDuration": 45 }
}
```

## 🔄 Cambiar Entre Configuraciones

```bash
# Para deploy en Vercel
npm run switch:vercel

# Para volver a Docker/Azure
npm run switch:docker
```

## 📊 Monitoreo

### Vercel Analytics
```bash
# Agregar a .env.local
NEXT_PUBLIC_VERCEL_ANALYTICS_ID="your-analytics-id"
```

### Logs en Tiempo Real
```bash
vercel logs [deployment-url] --follow
```

## 🛠️ Troubleshooting

### Error: Database Connection
```bash
# Verificar DATABASE_URL en Vercel dashboard
# Usar connection pooling para PostgreSQL
```

### Error: Build Timeout
```bash
# Verificar que next.config.vercel.ts no tenga 'output: standalone'
# Simplificar build process si es necesario
```

### Error: API Route Timeout
```bash
# Revisar vercel.json para timeouts específicos
# Optimizar queries de base de datos
```

## 🎯 Ventajas de Vercel

- ✅ **Zero Config**: Deploy automático desde Git
- ✅ **Edge Network**: CDN global automático
- ✅ **Serverless**: Escala automáticamente
- ✅ **Preview Deployments**: URL única por commit
- ✅ **Built-in Analytics**: Métricas sin configuración