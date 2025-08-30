# Migración a Agente Estático - Notas de Despliegue

## 🎯 Resumen de Cambios

Esta migración elimina todo el sistema de gestión dinámica de agentes y lo reemplaza con un **agente único configurado por variables de entorno**. 

### Cambios Principales:
- ✅ Eliminadas **13 tablas de agentes** y sus relaciones
- ✅ Removidos **34+ endpoints API** de CRUD de agentes  
- ✅ Eliminados **50+ componentes UI** de gestión de agentes
- ✅ Removidos **10+ hooks/contextos** relacionados
- ✅ Limpiadas **API keys hardcoded** de scripts
- ✅ Implementado agente estático desde `.env`

## 📋 Requisitos Previos

### Variables de Entorno Obligatorias
```bash
ELEVENLABS_API_KEY=sk_your_actual_api_key_here
ELEVENLABS_AGENT_ID=agent_your_actual_agent_id_here  
ELEVENLABS_PHONE_ID=phone_your_actual_phone_id_here
```

### Variables Opcionales
```bash
ELEVENLABS_API_URL=https://api.elevenlabs.io  # (default)
ELEVENLABS_VOICE_ID=voice_optional_override   # (opcional)
```

## 🚀 Pasos de Despliegue

### Fase 1: Preparación Base de Datos (Solo si hay datos existentes)
```bash
# 1. Ejecutar migración de compatibilidad
npm run prisma:migrate:deploy -- --name prepare_for_env_agent

# 2. Verificar que no hay llamadas activas
psql $DATABASE_URL -c "SELECT COUNT(*) FROM lead_call_logs WHERE status IN ('initiating', 'in_progress');"
```

### Fase 2: Aplicar Migración de Limpieza
```bash
# 3. Ejecutar migración que elimina tablas de agentes
npm run prisma:migrate:deploy -- --name drop_agent_entities

# 4. Generar nuevo cliente Prisma
npm run prisma:generate
```

### Fase 3: Desplegar Aplicación
```bash
# 5. Asegurar que las variables de entorno estén configuradas
npm run env:check  # (o validar manualmente)

# 6. Construir aplicación
npm run build

# 7. Desplegar
npm run start
```

### Fase 4: Verificación Post-Despliegue
```bash
# 8. Verificar que la configuración del agente funciona
curl -X POST http://localhost:3000/api/test/agent-config

# 9. Probar una llamada de prueba (con lead existente)
# (usar la UI o API directamente)

# 10. Verificar logs para errores relacionados con agentes
tail -f logs/app.log | grep -i agent
```

## 🔧 Validaciones de Configuración

La aplicación ahora incluye validación automática:

```typescript
import { getAgentConfig } from '@/lib/config/agentConfig';

// Validar configuración al iniciar
try {
  const config = getAgentConfig();
  console.log('✅ Agent configuration valid');
} catch (error) {
  console.error('❌ Agent configuration invalid:', error.message);
  // La aplicación debe fallar o mostrar error claro
}
```

## ⚠️ Puntos Críticos

1. **Variables de Entorno**: Sin estas variables, las llamadas fallarán
2. **Migración de BD**: Las migraciones eliminarán datos permanentemente
3. **Backup**: Asegurar backup completo antes de ejecutar migraciones
4. **Llamadas Activas**: No ejecutar migraciones con llamadas en progreso

## 🔄 Plan de Rollback

### Si el Despliegue Falla:

1. **Rollback de Código**:
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

2. **Rollback de Base de Datos**: ⚠️ **DIFÍCIL** 
   - Las tablas de agentes se habrán eliminado
   - Restaurar desde backup completo:
   ```bash
   pg_restore --clean --if-exists -d $DATABASE_URL backup_pre_migration.dump
   ```

3. **Reconfigurar Variables**:
   - Remover variables `ELEVENLABS_*` si no se van a usar

### Si Solo Hay Problemas de Configuración:

1. **Verificar Variables**:
   ```bash
   echo $ELEVENLABS_API_KEY
   echo $ELEVENLABS_AGENT_ID  
   echo $ELEVENLABS_PHONE_ID
   ```

2. **Probar Configuración**:
   ```bash
   node -e "console.log(require('./lib/config/agentConfig').getAgentConfig())"
   ```

## 🧪 Testing

### Tests Automatizados
```bash
# Ejecutar suite completa
npm test

# Tests específicos de configuración
npm test -- --grep "agent.*config"

# Tests de integración de llamadas
npm test -- --grep "lead.*call"
```

### Tests Manuales
1. ✅ Acceder a `/leads` - no debe mostrar selector de agente
2. ✅ Iniciar llamada - debe usar agente de `.env`
3. ✅ Verificar logs de llamada en BD con `agent_source = 'ENV'`
4. ✅ Acceder a `/agents` - debe mostrar mensaje de deprecación

## 📊 Monitoreo Post-Despliegue

### Métricas a Vigilar:
- Tasa de error en llamadas (debe mantenerse igual)
- Tiempo de respuesta en `/api/leads/[id]/call` 
- Logs de error relacionados con configuración

### Queries Útiles:
```sql
-- Verificar llamadas con nuevo sistema
SELECT agent_source, COUNT(*) 
FROM lead_call_logs 
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY agent_source;

-- Verificar errores recientes
SELECT status, COUNT(*)
FROM lead_call_logs  
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY status;
```

## 🚨 Problemas Conocidos y Soluciones

### Error: "Agent configuration invalid"
**Solución**: Verificar que todas las variables de entorno estén configuradas correctamente.

### Error: "Agent not found in ElevenLabs"
**Solución**: Verificar que el `ELEVENLABS_AGENT_ID` exista en la cuenta de ElevenLabs.

### Error: "Failed to initiate call"
**Solución**: Verificar `ELEVENLABS_API_KEY` y `ELEVENLABS_PHONE_ID`.

## ✅ Checklist Final

- [ ] Backup de base de datos creado
- [ ] Variables de entorno configuradas en producción
- [ ] Migraciones ejecutadas exitosamente
- [ ] Aplicación desplegada y funcionando
- [ ] Tests pasando
- [ ] Llamada de prueba exitosa
- [ ] Monitoreo configurado
- [ ] Equipo notificado de cambios

---
**Contacto**: En caso de problemas durante el despliegue, contactar al equipo de desarrollo.