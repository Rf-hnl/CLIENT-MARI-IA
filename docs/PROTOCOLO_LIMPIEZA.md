# 🧹 Protocolo de Limpieza y Eliminación de Código Duplicado

## 📋 Checklist General

### 1. **Análisis de Dependencias**
- [ ] Identificar archivos/componentes que usan `useGlobalState` 
- [ ] Localizar imports no utilizados
- [ ] Detectar funciones/componentes duplicados
- [ ] Revisar archivos de contexto obsoletos

### 2. **Limpieza de Hooks y Context**
- [ ] Eliminar `contexts/GlobalStateContext.tsx` (si no se usa)
- [ ] Remover `hooks/useGlobalState.ts` (si no se usa)
- [ ] Limpiar hooks de sincronización obsoletos
- [ ] Verificar que no haya dependencias circulares

### 3. **Actualización de Componentes**
- [ ] Migrar componentes de `useGlobalState` a funciones utilitarias
- [ ] Eliminar componentes duplicados (ej: GlobalHeader vs SimpleGlobalHeader)
- [ ] Limpiar imports no utilizados en cada componente
- [ ] Verificar que todos los componentes tengan dependencias correctas

### 4. **Archivos a Revisar y Posiblemente Eliminar**

#### 🔴 Archivos Candidatos para Eliminación:
```
components/layout/GlobalHeader.tsx           # Reemplazado por SimpleGlobalHeader
components/organizations/OrganizationManager.tsx   # Si usa useGlobalState
components/organizations/OrganizationSwitcher.tsx  # Si usa useGlobalState  
components/organizations/CreateOrganizationModal.tsx # Si usa useGlobalState
contexts/GlobalStateContext.tsx             # Si no se usa más
hooks/useGlobalState.ts                      # Si no se usa más
docs/global-state.md                         # Documentación obsoleta
```

#### 🟡 Archivos a Actualizar:
```
components/profile/UserProfileCard.tsx      # ✅ Ya actualizado
modules/auth/context/AuthContext.tsx        # ✅ Ya actualizado  
app/layout.tsx                              # ✅ Ya actualizado
```

### 5. **Protocolo de Eliminación Segura**

#### Paso 1: Verificar Dependencias
```bash
# Buscar referencias a archivos antes de eliminar
grep -r "GlobalHeader" . --exclude-dir=node_modules
grep -r "useGlobalState" . --exclude-dir=node_modules
grep -r "GlobalStateProvider" . --exclude-dir=node_modules
```

#### Paso 2: Crear Branch de Limpieza
```bash
git checkout -b cleanup/remove-unused-code
```

#### Paso 3: Eliminar Archivos Uno por Uno
```bash
# Solo después de verificar que no se usan
rm components/layout/GlobalHeader.tsx
rm contexts/GlobalStateContext.tsx  
rm hooks/useGlobalState.ts
# etc...
```

#### Paso 4: Verificar que la App Funciona
```bash
npm run build    # Verificar que compila
npm run dev      # Verificar que funciona
```

#### Paso 5: Commit de Limpieza
```bash
git add .
git commit -m "Clean up unused GlobalState code and duplicated components"
```

### 6. **Verificaciones Post-Limpieza**

#### ✅ Checklist de Verificación:
- [ ] La aplicación compila sin errores
- [ ] No hay imports rotos
- [ ] Todas las páginas cargan correctamente
- [ ] No hay warnings de dependencias faltantes
- [ ] Los tests pasan (si existen)
- [ ] No hay código muerto en el bundle

#### 🔍 Comandos de Verificación:
```bash
# Buscar imports rotos
npm run build 2>&1 | grep "Module not found"

# Buscar código no utilizado  
npx depcheck

# Verificar estructura de archivos
tree components/ hooks/ contexts/ -I node_modules

# Buscar TODOs y comentarios de limpieza
grep -r "TODO\|FIXME\|XXX" . --exclude-dir=node_modules
```

### 7. **Optimizaciones Adicionales**

#### 📦 Bundle Size:
- [ ] Remover bibliotecas no utilizadas de `package.json`
- [ ] Verificar que no se importen bibliotecas completas innecesariamente
- [ ] Usar dynamic imports para componentes pesados

#### 🔧 Code Quality:
- [ ] Ejecutar linter y fix automático: `npm run lint --fix`
- [ ] Formatear código: `npm run format` 
- [ ] Verificar tipos TypeScript: `npm run type-check`

#### 📁 Estructura de Archivos:
- [ ] Consolidar archivos similares
- [ ] Mover utilidades a carpetas apropiadas
- [ ] Eliminar archivos de test obsoletos

### 8. **Documentación Post-Limpieza**

#### 📚 Actualizar Documentación:
- [ ] README.md con nueva estructura
- [ ] Comentarios en código complejo
- [ ] Documentar nuevas funciones utilitarias
- [ ] Eliminar documentación de código removido

---

## 🚨 **IMPORTANTE: Orden de Ejecución**

1. **SIEMPRE** hacer backup/commit antes de eliminar código
2. **VERIFICAR** dependencias antes de eliminar archivos
3. **PROBAR** la aplicación después de cada eliminación
4. **COMMITEAR** cambios en pequeños chunks
5. **DOCUMENTAR** cambios importantes

---

## 📝 **Log de Limpieza**

| Fecha | Archivo Eliminado | Razón | Status |
|-------|------------------|-------|---------|
| 2025-01-28 | `hooks/useAuthGlobalStateSync.ts` | Dependencia circular | ✅ |
| 2025-01-28 | `components/providers/AuthGlobalStateSync.tsx` | No usado | ✅ |
| | | | |

---

*Protocolo creado: 2025-01-28*  
*Última actualización: 2025-01-28*