# Design System - Client MAR-IA

## 🎨 Identidad Visual

### Sobre el Proyecto
**Client MAR-IA** es una plataforma CRM inteligente especializada en gestión de leads con inteligencia artificial. El sistema permite:

- **Gestión de Leads**: Captura, calificación y seguimiento de prospectos
- **Scoring con IA**: Análisis automático y puntuación de leads
- **Comunicación Multi-canal**: WhatsApp, email y llamadas integradas  
- **Analytics Avanzados**: Dashboard con métricas y tendencias
- **Sistema Multi-tenant**: Soporte para múltiples organizaciones

---

## 🎯 Paleta de Colores Principal

### Naranja (Color Primario)
```css
/* Gradientes principales */
--gradient-primary: linear-gradient(to bottom right, #f97316, #ea580c, #c2410c);
--gradient-hero: linear-gradient(to bottom right, #f97316, #ea580c, #c2410c);

/* Colores sólidos */
--orange-50: #fff7ed;
--orange-100: #ffedd5;
--orange-500: #f97316;  /* Principal */
--orange-600: #ea580c;  /* Hover states */
--orange-700: #c2410c;  /* Active states */
--orange-800: #9a3412;  /* Dark mode */
```

### Colores de Estado
```css
/* Éxito */
--green-50: #f0fdf4;
--green-600: #16a34a;
--green-800: #166534;

/* Información */
--blue-50: #eff6ff;
--blue-600: #2563eb;
--blue-800: #1e40af;

/* Advertencia */
--amber-50: #fffbeb;
--amber-600: #d97706;
--amber-800: #92400e;

/* Error */
--red-50: #fef2f2;
--red-600: #dc2626;
--red-800: #991b1b;
```

---

## 🖼️ Gradientes

### Hero/Landing Sections
```css
/* Login/Register Hero */
.hero-gradient {
  background: linear-gradient(to bottom right, #f97316, #ea580c, #c2410c);
}

/* Dashboard Cards */
.card-gradient {
  background: linear-gradient(to right, #f97316, #ea580c);
}

/* Success States */
.success-gradient {
  background: linear-gradient(to bottom right, #f0fdf4, #dcfce7);
}

/* Info Cards */
.info-gradient {
  background: linear-gradient(to bottom right, #fff7ed, #fed7aa);
}
```

### Glassmorphism
```css
.glass-container {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

---

## 🎭 Componentes UI

### Botones

#### Primario
```css
.btn-primary {
  background: linear-gradient(to right, #f97316, #ea580c);
  color: white;
  border-radius: 0.75rem; /* 12px */
  padding: 0.6875rem 1rem; /* 11px height */
  transition: all 200ms;
}

.btn-primary:hover {
  background: linear-gradient(to right, #ea580c, #c2410c);
  box-shadow: 0 10px 25px -5px rgba(249, 115, 22, 0.4);
}
```

#### Secundario
```css
.btn-secondary {
  background: transparent;
  border: 1px solid #e5e7eb;
  color: #374151;
  border-radius: 0.75rem;
}

.btn-secondary:hover {
  background: #fff7ed;
  border-color: #f97316;
  color: #ea580c;
}
```

### Cards
```css
.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 1rem; /* 16px */
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.card:hover {
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

/* Dark mode */
.dark .card {
  background: #0f172a;
  border-color: #1e293b;
}
```

### Inputs
```css
.input {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #d1d5db;
  border-radius: 0.75rem;
  height: 2.75rem; /* 44px */
  padding: 0 0.75rem;
}

.input:focus {
  border-color: #f97316;
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
}

/* Dark mode */
.dark .input {
  background: rgba(15, 23, 42, 0.3);
  border-color: #334155;
}
```

---

## 📐 Espaciado y Layout

### Grid System
```css
/* Dashboard */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

/* Metrics Cards */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

/* Mobile responsivo */
@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
}
```

### Espaciado
```css
/* Espaciado estándar */
--space-xs: 0.25rem;   /* 4px */
--space-sm: 0.5rem;    /* 8px */
--space-md: 1rem;      /* 16px */
--space-lg: 1.5rem;    /* 24px */
--space-xl: 2rem;      /* 32px */
--space-2xl: 3rem;     /* 48px */

/* Contenedores */
--container-padding: 1rem;
--max-width: 1200px;
```

---

## 🔤 Tipografía

### Font Family
```css
/* Primary: Geist Sans */
font-family: '__Geist_Sans_5cfdac', '__Geist_Sans_Fallback_5cfdac', sans-serif;

/* Monospace: Geist Mono */
font-family: '__Geist_Mono_9a8899', '__Geist_Mono_Fallback_9a8899', monospace;
```

### Escalas
```css
/* Headings */
.text-3xl { font-size: 1.875rem; font-weight: 700; } /* Dashboard titles */
.text-2xl { font-size: 1.5rem; font-weight: 600; }   /* Section headers */
.text-xl { font-size: 1.25rem; font-weight: 500; }   /* Card titles */

/* Body text */
.text-base { font-size: 1rem; }      /* Normal text */
.text-sm { font-size: 0.875rem; }    /* Secondary text */
.text-xs { font-size: 0.75rem; }     /* Labels, captions */
```

---

## 🌙 Dark Mode

### Background Colors
```css
/* Light mode */
--bg-primary: #ffffff;
--bg-secondary: #f9fafb;
--bg-card: #ffffff;

/* Dark mode */
--dark-bg-primary: #0f172a;
--dark-bg-secondary: #1e293b;
--dark-bg-card: #1e293b;
```

### Text Colors
```css
/* Light mode */
--text-primary: #111827;
--text-secondary: #6b7280;
--text-muted: #9ca3af;

/* Dark mode */
--dark-text-primary: #f1f5f9;
--dark-text-secondary: #cbd5e1;
--dark-text-muted: #64748b;
```

---

## 🧩 Componentes Específicos

### Sidebar
```css
.sidebar {
  width: 16rem; /* 256px */
  background: white;
  border-right: 1px solid #e5e7eb;
}

.sidebar-collapsed {
  width: 3rem; /* 48px */
}

.sidebar-item {
  padding: 0.5rem;
  border-radius: 0.5rem;
  color: #6b7280;
  transition: all 200ms;
}

.sidebar-item:hover {
  background: #fff7ed;
  color: #f97316;
}

.sidebar-item.active {
  background: #fff7ed;
  color: #f97316;
  font-weight: 500;
}
```

### Metrics Cards
```css
.metric-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.metric-value {
  font-size: 2rem;
  font-weight: 700;
  color: #f97316;
}

.metric-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}
```

### Status Badges
```css
/* Lead Status Colors */
.status-new { background: #dbeafe; color: #1d4ed8; }
.status-interested { background: #fef3c7; color: #d97706; }
.status-qualified { background: #d1fae5; color: #059669; }
.status-won { background: #dcfce7; color: #16a34a; }
.status-lost { background: #fee2e2; color: #dc2626; }
```

---

## 🎯 Patrones de Uso

### Login/Auth Pages
- **Background**: Gradiente naranja principal
- **Card**: Fondo blanco/dark con glassmorphism sutil
- **Inputs**: Border radius 12px, focus orange
- **Botones**: Gradiente naranja con efectos hover

### Dashboard
- **Layout**: Sidebar + main content
- **Cards**: Border radius 16px, sombras suaves
- **Métricas**: Iconos coloridos + valores destacados
- **Navegación**: Items con hover naranja

### Forms
- **Fields**: Labels con iconos, inputs redondeados
- **Validation**: Estados de error en rojo
- **Actions**: Botón primario naranja prominente

### Tables
- **Headers**: Fondo neutro, texto semi-bold
- **Rows**: Hover sutil, borders ligeros
- **Actions**: Iconos con tooltip

---

## 📱 Responsividad

### Breakpoints
```css
/* Mobile first */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }  
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

### Layout Adaptivo
- **Mobile**: Sidebar colapsado, cards apiladas
- **Tablet**: Grid 2-3 columnas, sidebar toggle
- **Desktop**: Sidebar fijo, grid completo

---

## ⚡ Animaciones

### Transiciones Estándar
```css
/* Elementos interactivos */
transition: all 200ms ease-in-out;

/* Hover effects */
transition: transform 200ms, box-shadow 200ms;

/* Loading states */
.loading {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

### Micro-interacciones
- **Buttons**: Subtle scale en hover
- **Cards**: Lift effect con shadow
- **Inputs**: Focus glow effect
- **Icons**: Rotation en loading states

---

## 🔧 Implementación Técnica

### CSS Variables (Tailwind Config)
```typescript
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#f97316',
        'primary-hover': '#ea580c',
        'primary-active': '#c2410c',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(to bottom right, #f97316, #ea580c, #c2410c)',
        'card-gradient': 'linear-gradient(to right, #f97316, #ea580c)',
      }
    }
  }
}
```

### Clases Reutilizables
```css
/* Gradientes comunes */
.bg-hero-gradient { background: linear-gradient(to bottom right, #f97316, #ea580c, #c2410c); }
.bg-card-gradient { background: linear-gradient(to right, #f97316, #ea580c); }

/* Glassmorphism */
.glass { background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); }

/* Sombras */
.shadow-card { box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
.shadow-hover { box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); }
```

---

## 📋 Checklist de Consistencia

### ✅ Login/Auth
- [x] Gradiente naranja en hero
- [x] Theme toggle visible
- [x] Mensaje alineado con propósito
- [x] Iconos coherentes (IA/leads)

### ✅ Dashboard  
- [x] Sidebar con hover naranja
- [x] Cards con border radius 16px
- [x] Métricas con colores de estado
- [x] Iconos Lucide consistentes

### 🔄 Por Verificar
- [ ] Formularios con estilo coherente
- [ ] Tablas con hover effects
- [ ] Modales con glassmorphism
- [ ] Loading states animados
- [ ] Error states con colores correctos

---

## 🎨 Ejemplos de Uso

### Hero Section (Auth)
```tsx
<div className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-800">
  <div className="w-16 h-16 bg-white/10 rounded-2xl backdrop-blur-sm">
    {/* IA Icon */}
  </div>
</div>
```

### Metric Card
```tsx
<div className="bg-white border border-orange-200 rounded-xl p-6 hover:shadow-lg">
  <div className="text-2xl font-bold text-orange-600">{value}</div>
  <div className="text-sm text-gray-600">{label}</div>
</div>
```

### Primary Button
```tsx
<button className="bg-gradient-to-r from-orange-500 to-orange-700 hover:from-orange-600 hover:to-orange-800 text-white rounded-xl px-4 py-2 transition-all shadow-lg hover:shadow-xl">
  {children}
</button>
```

---

*Última actualización: Agosto 2025*  
*Versión: 1.0.0*