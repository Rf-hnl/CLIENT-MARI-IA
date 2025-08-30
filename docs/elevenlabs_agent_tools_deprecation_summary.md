
# Resumen de la Suspensión de Herramientas de Agente (Agent Tools) en ElevenLabs

Este documento resume la información clave sobre la suspensión y reemplazo de la funcionalidad de `tools` en la API de Agentes de IA Conversacional de ElevenLabs.

## ¿Qué está cambiando?

El parámetro `tools` utilizado dentro del cuerpo de la solicitud para crear o actualizar un agente está siendo suspendido. Este enfoque, donde las herramientas se definían directamente en la configuración del agente, se considera obsoleto.

## ¿Por qué se realiza este cambio?

La nueva implementación separa las herramientas de los agentes, lo que ofrece varias ventajas:
- **Reutilización:** Las herramientas se pueden definir una vez y reutilizarse en múltiples agentes.
- **Auditoría y Mantenimiento:** La gestión de herramientas se centraliza, simplificando su auditoría y actualización.
- **Limpieza:** Mantiene las configuraciones de los agentes más limpias y enfocadas.
- **Funcionalidad Avanzada:** Abre la puerta a características más potentes, como herramientas nativas (`code_interpreter`, `end_call`).

## La Nueva Implementación

La gestión de herramientas ahora se realiza a través de un nuevo endpoint dedicado y se vinculan al agente mediante IDs.

1.  **Nuevo Endpoint para Herramientas:**
    - Se ha introducido el endpoint `https://api.elevenlabs.io/v1/convai/tools`.
    - Permite operaciones CRUD (Crear, Leer, Actualizar, Eliminar) para gestionar tus herramientas de forma independiente.

2.  **Nuevos Parámetros en la Configuración del Agente:**
    - `prompt.tool_ids`: Un array de strings donde se especifican los IDs de las herramientas que el agente debe usar.
    - `prompt.built_in_tools`: Un array para habilitar herramientas nativas proporcionadas por el sistema (ej: `end_call`).

## Cronología de la Suspensión y Fechas Clave

ElevenLabs ha establecido un calendario para la transición:

- **14 de Julio de 2025:** Fin de la compatibilidad hacia atrás. Aunque el sistema antiguo seguirá funcionando hasta el 23 de julio, se recomienda encarecidamente migrar antes de esta fecha.
- **15 de Julio de 2025:** Las solicitudes `GET` a la API de agentes dejarán de devolver el campo `tools`.
- **23 de Julio de 2025:** El campo `prompt.tools` será eliminado permanentemente. Cualquier solicitud a la API que contenga este campo será rechazada con un error.

## Acción Requerida: ¿Cómo Migrar?

Todos los usuarios que utilicen la funcionalidad de `tools` deben actualizar sus integraciones.

**Pasos para la migración:**

1.  **Eliminar el Parámetro Antiguo:** Quita el array `tools` de la configuración de tu agente en tus llamadas a la API.
2.  **Añadir los Nuevos Parámetros:**
    - Reemplázalo con el array `prompt.tool_ids`, que contendrá los IDs de las herramientas correspondientes.
    - Si usas herramientas del sistema, añade el campo `prompt.built_in_tools`.

**Nota Importante:** ElevenLabs ha realizado una migración automática de las herramientas existentes a registros independientes. Puedes obtener los IDs de tus herramientas migradas utilizando el nuevo endpoint `GET /v1/convai/tools`. No se pueden usar ambos campos (`tools` y `tool_ids`) en la misma solicitud.
