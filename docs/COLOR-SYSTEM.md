# Sistema de Colores Simplificado

Este proyecto usa un sistema de colores **minimalista** con solo **tres colores**: negro, blanco y naranja.

## 🎨 Colores Base

### Modo Claro
- **Fondo:** Blanco (`#ffffff`)
- **Texto:** Negro (`#000000`)
- **Énfasis:** Naranja (`#ff6600`)

### Modo Oscuro
- **Fondo:** Negro (`#000000`)
- **Texto:** Blanco (`#ffffff`)
- **Énfasis:** Naranja (`#ff6600`)

## 📝 Clases de Tailwind Recomendadas

### Fondos y Textos
```css
/* Fondo principal */
.bg-white dark:bg-black

/* Texto principal */
.text-black dark:text-white

/* Énfasis */
.bg-orange-500
.text-orange-500
.text-orange-600
```

### Bordes
```css
/* Bordes estándar */
.border-gray-200 dark:border-white
```

### Estados Hover
```css
/* Hover con énfasis naranja */
.hover:bg-orange-500 .hover:text-white dark:hover:bg-orange-500 dark:hover:text-black
```

## 🛠️ Clases de Utilidad Personalizadas

Hemos creado clases semánticas para facilitar el uso:

```css
/* Backgrounds */
.bg-app-primary     /* Fondo principal (blanco/negro) */
.bg-app-secondary   /* Fondo secundario (blanco/negro) */
.bg-app-emphasis    /* Fondo de énfasis (naranja) */

/* Textos */
.text-app-primary   /* Texto principal (negro/blanco) */
.text-app-secondary /* Texto secundario (negro/blanco) */
.text-app-emphasis  /* Texto de énfasis (naranja) */

/* Bordes */
.border-app         /* Bordes estándar */

/* Hovers */
.hover-app-emphasis /* Hover naranja */
```

## 📦 Componentes Base

### Tarjetas
```css
.card-base {
  @apply bg-app-primary text-app-primary border-app rounded-lg shadow-sm;
}
```

### Botones
```css
.button-primary {
  @apply bg-app-emphasis text-white hover:opacity-90 rounded-lg px-4 py-2;
}

.button-secondary {
  @apply bg-app-primary text-app-primary border-app hover-app-emphasis rounded-lg px-4 py-2;
}
```

### Inputs
```css
.input-base {
  @apply bg-app-primary text-app-primary border-app rounded-lg px-3 py-2 focus:border-orange-500;
}
```

## ✅ Ejemplos de Uso

### Tarjeta Simple
```tsx
<div className="bg-white dark:bg-black border border-gray-200 dark:border-white rounded-lg p-4">
  <h2 className="text-black dark:text-white font-semibold mb-2">Título</h2>
  <p className="text-black dark:text-white">Contenido</p>
  <button className="bg-orange-500 text-white px-4 py-2 rounded hover:opacity-90">
    Acción
  </button>
</div>
```

### Usando Clases Semánticas
```tsx
<div className="card-base p-4">
  <h2 className="text-app-primary font-semibold mb-2">Título</h2>
  <p className="text-app-primary">Contenido</p>
  <button className="button-primary">Acción</button>
</div>
```

## 🚫 Colores a Evitar

No uses estos colores en nuevos componentes:
- `gray-*` (excepto `gray-200` para bordes claros)
- `blue-*`
- `green-*`
- `purple-*`
- `indigo-*`

**Excepción:** Solo usa otros colores para estados específicos como:
- `red-*` para errores
- `green-*` para éxito (si es absolutamente necesario)

## 🔧 Configuración

El sistema está configurado en:
- `tailwind.config.js` - Configuración principal
- `app/globals-simplified.css` - Variables CSS y clases personalizadas

Para usar el nuevo sistema, cambia la importación en `layout.tsx`:
```tsx
import '@/app/globals-simplified.css' // En lugar de globals.css
```

## 📱 Responsive Design

El sistema funciona igual en todas las resoluciones. Solo cambia con el modo oscuro/claro:

```css
/* Funciona en móvil, tablet y desktop */
.bg-white dark:bg-black
.text-black dark:text-white
```

## 🎯 Beneficios

1. **Simplicidad:** Solo 3 colores para recordar
2. **Consistencia:** Todas las interfaces se ven coherentes
3. **Mantenibilidad:** Fácil de actualizar desde un solo lugar
4. **Accesibilidad:** Alto contraste garantizado
5. **Minimalismo:** Diseño limpio y profesional