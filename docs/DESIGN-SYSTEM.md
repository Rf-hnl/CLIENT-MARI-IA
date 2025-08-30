# Sistema de Diseño - Client Mar-IA

Este documento define el sistema de diseño visual que debe aplicarse consistentemente en todos los componentes de la aplicación.

## 🎨 Paleta de Colores

### Colores Principales
- **Negro**: `#000000` - Texto principal en modo claro, fondo en modo oscuro
- **Blanco**: `#ffffff` - Fondo en modo claro, texto principal en modo oscuro  
- **Naranja**: `#ff6600` - Color de énfasis, botones primarios, enlaces, indicadores

### Variables CSS
```css
/* Modo Claro */
--background: oklch(1 0 0);        /* Blanco puro */
--foreground: oklch(0 0 0);        /* Negro puro */
--primary: oklch(0.638 0.218 41.2); /* Naranja #ff6600 */
--border: oklch(0.15 0 0);         /* Gris oscuro para contraste */

/* Modo Oscuro */
--background: oklch(0 0 0);        /* Negro puro */
--foreground: oklch(1 0 0);        /* Blanco puro */
--primary: oklch(0.638 0.218 41.2); /* Naranja #ff6600 */
--border: oklch(0.85 0 0);         /* Gris claro para contraste */
```

## 📐 Geometría y Espaciado

### Bordes
- **Radio**: `0.25rem` (4px) - Bordes ligeramente redondeados, más cuadrados que redondos
- **Grosor**: `1px` estándar para todos los bordes
- **Color**: Usar `--border` (tonos de gris para contraste, NO blanco)

### Espaciado
- **Padding interno**: `0.75rem` (12px) para componentes pequeños, `1rem` (16px) para medianos
- **Margin entre elementos**: `0.5rem` (8px) mínimo, `1rem` (16px) estándar
- **Gap en grids**: `0.75rem` (12px) para elementos relacionados

## 🏗️ Estructura de Componentes

### Tarjetas (Cards)
```tsx
<div className="bg-white dark:bg-black border border-border rounded-lg p-4">
  <h3 className="text-black dark:text-white font-semibold mb-2">Título</h3>
  <p className="text-black dark:text-white text-sm">Contenido</p>
</div>
```

### Botones
```tsx
/* Botón Primario */
<button className="bg-primary text-white hover:opacity-90 rounded-lg px-4 py-2">
  Acción Principal
</button>

/* Botón Secundario */
<button className="bg-white dark:bg-black text-black dark:text-white border border-border hover:bg-primary hover:text-white rounded-lg px-4 py-2">
  Acción Secundaria
</button>
```

### Inputs
```tsx
<input className="bg-white dark:bg-black text-black dark:text-white border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary" />
```

### Badges/Estados
```tsx
/* Badge de estado activo */
<span className="bg-primary text-white px-2 py-1 rounded text-xs font-medium">
  Activo
</span>

/* Badge neutro */
<span className="bg-white dark:bg-black text-black dark:text-white border border-border px-2 py-1 rounded text-xs">
  Pendiente
</span>
```

## 🎯 Principios de Diseño

### 1. Contraste por Tonos, No por Colores
- ❌ **NO usar**: `border-white`, `border-gray-200`, `border-blue-300`
- ✅ **SÍ usar**: `border-border` (automáticamente ajusta el contraste)

### 2. Minimalismo Cromático
- Solo 3 colores: Negro, Blanco, Naranja
- El naranja es EXCLUSIVAMENTE para énfasis (botones primarios, enlaces activos, indicadores importantes)
- Todo lo demás debe ser negro/blanco con variaciones de opacidad si es necesario

### 3. Geometría Consistente
- Bordes ligeramente cuadrados (`0.25rem`) para aspecto moderno pero no severo
- Espaciado uniforme usando múltiplos de `0.25rem`
- Evitar bordes totalmente redondos (`rounded-full`) excepto para avatares o indicadores específicos

### 4. Jerarquía Visual
```tsx
/* Título principal */
<h1 className="text-black dark:text-white text-2xl font-bold mb-4">

/* Título secundario */
<h2 className="text-black dark:text-white text-lg font-semibold mb-3">

/* Texto normal */
<p className="text-black dark:text-white text-sm">

/* Texto de énfasis */
<span className="text-primary font-medium">
```

## 📱 Responsive y Estados

### Estados de Hover
```tsx
/* Cards y elementos interactivos */
className="hover:bg-primary hover:text-white transition-colors duration-200"

/* Botones */
className="hover:opacity-90 transition-opacity duration-200"
```

### Estados Activos
```tsx
/* Navegación activa */
className="bg-primary text-white"

/* Elemento seleccionado */
className="border-primary bg-primary/10"
```

### Responsive
- Mantener el sistema de colores en todas las resoluciones
- Ajustar solo espaciado y tamaños, nunca colores
- Usar `grid` y `flex` con gaps consistentes

## 🚫 Qué Evitar

### Colores Prohibidos
- `gray-*` (excepto para debugging temporal)
- `blue-*`, `green-*`, `purple-*`, `indigo-*`
- `border-white` o `border-transparent`
- Cualquier color que no sea negro, blanco o naranja

### Patrones Prohibidos
```tsx
❌ <div className="bg-gray-100 border-white">
❌ <button className="bg-blue-500 text-white">
❌ <span className="text-gray-600 border-gray-300">
❌ <div className="rounded-xl"> // Demasiado redondo
```

### Patrones Correctos
```tsx
✅ <div className="bg-white dark:bg-black border border-border">
✅ <button className="bg-primary text-white">
✅ <span className="text-black dark:text-white border border-border">
✅ <div className="rounded-lg"> // Ligeramente cuadrado
```

## 🔧 Implementación

### Clases Tailwind Recomendadas
```css
/* Fondos */
.bg-white dark:bg-black
.bg-primary

/* Textos */
.text-black dark:text-white
.text-primary

/* Bordes */
.border-border
.rounded-lg

/* Espaciado estándar */
.p-4, .px-3 .py-2
.mb-2, .mb-3, .mb-4
.gap-3, .gap-4
```

### Verificación Rápida
Antes de implementar un componente, pregúntate:
1. ¿Uso solo negro, blanco y naranja?
2. ¿Los bordes usan `border-border` en lugar de colores específicos?
3. ¿Los bordes son `rounded-lg` (no demasiado redondos)?
4. ¿El contraste es claro entre fondo y contenido?
5. ¿El naranja se usa solo para énfasis importantes?

---

**Ejemplo Completo de Componente**
```tsx
export const ExampleCard = () => {
  return (
    <div className="bg-white dark:bg-black border border-border rounded-lg p-4 hover:bg-primary hover:text-white transition-colors duration-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-black dark:text-white font-semibold">Título</h3>
        <span className="bg-primary text-white px-2 py-1 rounded text-xs font-medium">
          Activo
        </span>
      </div>
      <p className="text-black dark:text-white text-sm mb-3">
        Descripción del contenido
      </p>
      <button className="bg-primary text-white hover:opacity-90 rounded-lg px-4 py-2">
        Acción Principal
      </button>
    </div>
  );
};
```

Este sistema garantiza consistencia visual, alta legibilidad y un diseño profesional minimalista.