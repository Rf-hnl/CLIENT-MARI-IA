# 🧹 Protocolo de Limpieza y Eliminación de Código Duplicado

> **📌 NOTA IMPORTANTE**: Este protocolo contiene las instrucciones para la limpieza de código legacy y debe ser seguido antes de agregar nuevas funcionalidades a la aplicación.

## 🎯 **Objetivo del Protocolo**

Este documento establece las pautas para mantener el código limpio, eliminar dependencias obsoletas y preparar la aplicación para el desarrollo futuro. Debe ser ejecutado periódicamente o antes de implementar cambios significativos.

---

## 📋 **Checklist General de Limpieza**

### 1. **Análisis de Dependencias Legacy**
- [ ] Identificar archivos/componentes que usan patrones obsoletos (ej: `useGlobalState`)
- [ ] Localizar imports no utilizados con herramientas como `depcheck`
- [ ] Detectar funciones/componentes duplicados o redundantes
- [ ] Revisar archivos de contexto/providers que ya no son necesarios
- [ ] Verificar que no existan dependencias circulares

### 2. **Limpieza de Arquitectura**
- [ ] Eliminar contexts/providers obsoletos
- [ ] Remover hooks personalizados no utilizados
- [ ] Limpiar servicios y utilidades duplicadas
- [ ] Consolidar funciones similares en módulos unificados
- [ ] Verificar que la arquitectura siga patrones consistentes

### 3. **Actualización de Componentes**
- [ ] Migrar componentes legacy a patrones modernos
- [ ] Eliminar componentes duplicados o redundantes
- [ ] Limpiar imports no utilizados en cada archivo
- [ ] Actualizar dependencias de componentes
- [ ] Verificar que todos los componentes sigan las convenciones del proyecto

### 4. **Identificación de Archivos Candidatos**

#### 🔴 **Patrones de Archivos a Eliminar:**

Buscar y evaluar archivos que contengan estos patrones:
```bash
# Contextos/Providers obsoletos
*Context.tsx que usen patrones legacy
*Provider.tsx no utilizados

# Hooks personalizados obsoletos  
use*State.ts que no sigan convenciones actuales
use*Sync.ts para sincronización compleja innecesaria

# Componentes duplicados
*Header.tsx vs *SimpleHeader.tsx
*Manager.tsx vs *SimpleManager.tsx
*Modal.tsx vs *Dialog.tsx (si hay duplicación)

# Documentación obsoleta
*-state.md, *-context.md que documenten código eliminado
README-*.md fragmentados que puedan consolidarse
```

#### 🟡 **Patrones de Archivos a Actualizar:**
```bash
# Componentes que usan patrones legacy
grep -r "useGlobalState\|useComplexContext" components/
grep -r "import.*Context.*from" components/ | grep -v "@/"

# Archivos con imports no utilizados
npx depcheck --ignores="@types/*,eslint*,prettier*"

# Archivos con dependencias circulares
madge --circular --format es6 src/
```

### 5. **Protocolo de Eliminación Segura**

> ⚠️ **ADVERTENCIA**: Seguir estos pasos en orden y nunca eliminar archivos sin verificar dependencias.

#### **Paso 1: Análisis Pre-Eliminación**
```bash
# 1.1 Crear branch de limpieza
git checkout -b cleanup/remove-legacy-code-$(date +%Y%m%d)

# 1.2 Analizar dependencias globales
grep -r "ARCHIVO_A_ELIMINAR" . --exclude-dir=node_modules --exclude-dir=.next
rg "ARCHIVO_A_ELIMINAR" --type ts --type tsx

# 1.3 Verificar imports activos
npx depcheck
madge --circular src/

# 1.4 Backup de seguridad
git stash push -m "Pre-cleanup backup $(date)"
```

#### **Paso 2: Eliminación Gradual**
```bash
# 2.1 Eliminar archivos de menor impacto primero
rm -f docs/*-obsolete.md
rm -f components/unused/*.tsx

# 2.2 Eliminar archivos de impacto medio
rm -f hooks/use*Legacy*.ts
rm -f contexts/*Obsolete*.tsx

# 2.3 Eliminar archivos de alto impacto (uno por vez)
rm -f contexts/GlobalStateContext.tsx
npm run build # Verificar después de cada eliminación
```

#### **Paso 3: Validación Post-Eliminación**
```bash
# 3.1 Verificación de compilación
npm run build
npm run type-check
npm run lint

# 3.2 Verificación funcional
npm run dev  # Probar rutas principales
npm run test # Si hay tests

# 3.3 Verificación de bundle
npm run build
npx bundle-analyzer # Verificar reducción de tamaño
```

#### **Paso 4: Commit Estructurado**
```bash
# 4.1 Commit por categoría
git add docs/
git commit -m "docs: remove obsolete documentation"

git add components/
git commit -m "feat: remove unused legacy components"

git add hooks/ contexts/
git commit -m "refactor: remove legacy state management"

# 4.2 Push y merge
git push -u origin cleanup/remove-legacy-code-$(date +%Y%m%d)
# Crear PR para revisión
```

### 6. **Verificaciones Post-Limpieza**

#### ✅ **Checklist de Validación Final:**
- [ ] **Compilación**: `npm run build` exitoso sin errores
- [ ] **Tipos**: `npm run type-check` sin errores de TypeScript
- [ ] **Linting**: `npm run lint` sin errores críticos
- [ ] **Imports**: No hay módulos rotos o no encontrados
- [ ] **Funcionalidad**: Todas las rutas principales funcionan
- [ ] **Tests**: Suite de tests pasa completamente
- [ ] **Bundle**: Tamaño de bundle reducido notablemente
- [ ] **Performance**: No degradación en métricas de rendimiento

#### 🔍 **Comandos de Verificación Automatizada:**
```bash
# Script completo de verificación
#!/bin/bash
echo "🧹 Iniciando verificación post-limpieza..."

echo "📦 Verificando compilación..."
npm run build > build.log 2>&1
if [ $? -eq 0 ]; then echo "✅ Build exitoso"; else echo "❌ Build falló"; cat build.log; fi

echo "🔍 Verificando dependencias..."
npx depcheck --json > depcheck.json
cat depcheck.json | jq '.dependencies[]' | wc -l | xargs echo "📊 Dependencias no utilizadas:"

echo "🔗 Verificando imports rotos..."
grep -r "Module not found\|Cannot resolve" .next/build.log 2>/dev/null || echo "✅ No hay imports rotos"

echo "📁 Verificando estructura..."
find . -name "*.tsx" -o -name "*.ts" | grep -E "(components|hooks|contexts)" | wc -l | xargs echo "📈 Archivos TS/TSX restantes:"

echo "🏷️ Verificando TODOs pendientes..."
grep -r "TODO\|FIXME\|XXX" src/ 2>/dev/null | wc -l | xargs echo "📝 TODOs pendientes:"

echo "✨ Verificación completada!"
```

### 7. **Optimizaciones Adicionales**

#### 📦 **Optimización de Bundle:**
```bash
# Analizar dependencias no utilizadas
npx depcheck --ignores="@types/*,eslint*"

# Verificar imports de bibliotecas completas
grep -r "import.*from ['\"]lodash['\"]" src/ 
# ↳ Cambiar por: import { specific } from 'lodash/specific'

# Analizar tamaño de bundle
npm run build && npx @next/bundle-analyzer

# Dynamic imports para componentes pesados
# Antes: import HeavyComponent from './Heavy'
# Después: const HeavyComponent = dynamic(() => import('./Heavy'))
```

#### 🔧 **Calidad de Código:**
```bash
# Pipeline de calidad automatizada
npm run lint --fix     # Corregir problemas automáticamente
npm run format          # Formatear código con Prettier
npm run type-check      # Verificar tipos TypeScript
npm run test:coverage   # Verificar cobertura de tests
```

#### 📁 **Reestructuración Arquitectural:**
```bash
# Consolidar utilidades dispersas
find . -name "utils.ts" -o -name "helpers.ts" | head -5
# ↳ Considerar consolidar en lib/utils/

# Mover componentes a estructuras consistentes
find components/ -maxdepth 1 -name "*.tsx" | head -5
# ↳ Mover a components/ui/ o components/feature/

# Eliminar archivos de test huérfanos
find . -name "*.test.*" -o -name "*.spec.*" | while read f; do
  base=$(basename "$f" | sed 's/\.(test|spec)\./\./g')
  [[ ! -f "${f%/*}/$base" ]] && echo "Test huérfano: $f"
done
```

### 8. **Mantenimiento Continuo**

#### 📚 **Documentación Viva:**
- [ ] **README.md**: Mantener arquitectura actualizada
- [ ] **CHANGELOG.md**: Documentar cambios significativos  
- [ ] **API.md**: Documentar interfaces públicas
- [ ] **TROUBLESHOOTING.md**: Soluciones a problemas comunes

#### 🔄 **Automatización de Limpieza:**
```json
// package.json - Scripts de mantenimiento
{
  "scripts": {
    "cleanup:deps": "npx depcheck && npm audit fix",
    "cleanup:lint": "npm run lint --fix && npm run format",
    "cleanup:build": "rm -rf .next && npm run build",
    "cleanup:full": "npm run cleanup:deps && npm run cleanup:lint && npm run cleanup:build"
  }
}
```

#### 📊 **Métricas de Salud del Código:**
```bash
# Script de métricas automatizado
#!/bin/bash
echo "📊 Métricas de salud del código:"
echo "🗂️  Archivos TS/TSX: $(find src -name '*.ts*' | wc -l)"
echo "📦 Dependencias: $(cat package.json | jq '.dependencies | length')"
echo "🧪 Cobertura tests: $(npm test -- --coverage --silent | grep 'All files' | awk '{print $10}')"
echo "⚡ Bundle size: $(ls -lh .next/static/chunks/pages/_app-*.js | awk '{print $5}')"
echo "🔧 ESLint issues: $(npm run lint --silent 2>&1 | grep -c 'error\|warning' || echo 0)"
```

---

## 🎯 **Criterios de Éxito**

Una limpieza exitosa debe cumplir:

✅ **Reducción de código**: Mínimo 15% menos líneas de código  
✅ **Mejora de bundle**: Reducción notable en tamaño de bundle  
✅ **Cero errores**: Build, lint y tests pasan completamente  
✅ **Mejora de performance**: Métricas de carga mejoradas o mantenidas  
✅ **Documentación actualizada**: Toda la documentación refleja el estado actual  

---

---

## 🎓 **Lecciones Aprendidas y Mejoras del Protocolo**

> **Basado en la ejecución práctica del 2025-01-29**

### 🔍 **Descubrimientos Importantes**

#### **1. TypeScript Build vs ESLint Errors**
- ✅ **Insight**: Next.js puede compilar exitosamente incluso con warnings de ESLint
- 🎯 **Mejorar**: Separar validaciones de "build blocker" vs "code quality"
- 📝 **Actualización**: Agregar `npm run lint --max-warnings=0` como paso crítico

#### **2. Análisis de Dependencias más Preciso**
- ✅ **Encontrado**: `depcheck` reporta falsos positivos con devDependencies
- 🎯 **Mejorar**: Usar `--ignores` más específicos
- 📝 **Comando mejorado**: 
```bash
npx depcheck --ignores="@types/*,eslint*,prettier*,tailwindcss,typescript"
```

#### **3. Patrones de Archivos Obsoletos**
- ✅ **Descubierto**: Archivos de debug (`/api/debug/*`) son comunes
- ✅ **Descubierto**: Documentación con errores tipográficos (`docs/cleints/`)
- 🎯 **Nuevo patrón**: `**/debug/**/*.ts` para endpoints de desarrollo
- 📝 **Agregar**: Verificación de carpetas con typos en nombres

#### **4. Imports No Utilizados - Patrones Comunes**
- ✅ **Pattern 1**: Iconos de Lucide React no utilizados (muy común)
- ✅ **Pattern 2**: Tipos TypeScript importados pero no usados
- ✅ **Pattern 3**: Funciones auxiliares declaradas pero no llamadas
- 🎯 **Tool sugerido**: Usar Task agent para limpieza sistemática de imports

#### **5. Validación en Tiempo Real**
- ✅ **Crítico**: Compilar después de cada paso mayor
- 🎯 **Mejorar**: Usar `&&` para comandos secuenciales críticos
- 📝 **Ejemplo**: `npm run build && git add . && git commit`

### 📋 **Protocolo Mejorado - Versión 2.1**

#### **Paso 1.5: Pre-análisis Mejorado** *(NUEVO)*
```bash
# 1.5.1 Análisis específico de TypeScript
npx tsc --noEmit --skipLibCheck 2>&1 | grep -E "(error|warning)" | wc -l

# 1.5.2 Análisis de imports con AST
npx ts-unused-exports tsconfig.json --showLineNumber

# 1.5.3 Buscar patrones específicos encontrados
find . -path "*/debug/*" -name "*.ts" -type f
find . -name "*typo*" -o -name "*draft*" -o -name "*temp*" | grep -v node_modules
```

#### **Paso 2.1: Limpieza de Imports Automatizada** *(MEJORADO)*
```bash
# 2.1.1 Usar Task agent para limpieza sistemática
# Más eficiente que manual para 15+ archivos

# 2.1.2 Verificación inmediata post-limpieza
npm run type-check 2>&1 | grep -c "error:" || echo "✅ No type errors"
```

#### **Paso 3.1: Detección de Archivos Obsoletos Mejorada** *(MEJORADO)*
```bash
# 3.1.1 Patrones específicos encontrados
find . -path "*/api/debug/*" -name "*.ts" -type f
find . -name "*.md" | xargs grep -l "^\s*ok mira\|errores tipográficos"

# 3.1.2 Archivos de desarrollo no necesarios en producción
find . -name "*test*" -name "*debug*" -name "*draft*" | grep -E "\.(ts|tsx)$"
```

#### **Paso 4.1: Validación Robusta** *(MEJORADO)*
```bash
# 4.1.1 Verificación en paralelo
npm run build & npm run type-check & wait

# 4.1.2 Métricas específicas
echo "📊 Archivos TS/TSX: $(find . -name '*.ts*' -not -path './node_modules/*' | wc -l)"
echo "📦 Build exitoso: $(npm run build >/dev/null 2>&1 && echo '✅ SÍ' || echo '❌ NO')"
```

## 📝 **Historial de Limpiezas**

| Fecha | Descripción | Archivos Eliminados | Líneas Reducidas | Mejora Bundle | Lecciones |
|-------|-------------|-------------------|------------------|---------------|-----------|
| 2025-01-28 | Eliminación GlobalState legacy | 9 archivos | -2,076 líneas | TBD | Primera versión |
| 2025-01-29 | **Imports + archivos obsoletos** | **2 archivos + 15+ optimizados** | **~90 líneas** | **Build OK** | **Protocolo validado** |

### 🎯 **Métricas de la Última Limpieza (2025-01-29)**
- ✅ **Build Status**: Compilación exitosa con Next.js
- 📊 **Archivos procesados**: 15+ archivos con imports optimizados
- 🗑️ **Archivos eliminados**: 2 (debug endpoint + documentación obsoleta)
- ⚡ **Tiempo de ejecución**: ~10 minutos (automatizado con Task agent)
- 🎯 **Calidad**: Solo warnings de linting restantes (no críticos)

---

## 🚀 **Recomendaciones para Próximas Ejecuciones**

### **Frecuencia Optimizada**
- 🔄 **Cada 2 sprints**: Para proyectos en desarrollo activo
- 🎯 **Pre-release**: Antes de cada release importante
- ⚡ **Post-feature**: Después de agregar funcionalidades grandes

### **Tools Recomendados** *(ACTUALIZADO)*
```json
{
  "scripts": {
    "cleanup:analysis": "npx depcheck && npx ts-unused-exports tsconfig.json",
    "cleanup:imports": "npx organize-imports-cli tsconfig.json",
    "cleanup:build-test": "npm run build && npm run type-check",
    "cleanup:full": "npm run cleanup:analysis && npm run cleanup:build-test"
  }
}
```

---

> **💡 RECOMENDACIÓN ACTUALIZADA**: El protocolo ha demostrado ser altamente efectivo. Usar Task agents para pasos repetitivos mejora significativamente la eficiencia.

*Protocolo creado: 2025-01-28*  
*Última actualización: 2025-01-29*  
*Versión: 2.1 - Mejorado con experiencia práctica* ✨