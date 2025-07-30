import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAgentsContext } from '../context/AgentsContext';

interface UseSelectiveAgentsOptions {
  loadOnRoutes?: string[];  // Rutas donde debe cargar automáticamente
  enabled?: boolean;        // Si está habilitado la carga automática
}

/**
 * Hook que carga agentes selectivamente basado en la ruta actual
 * Evita cargas innecesarias en páginas que no requieren datos de agentes
 */
export const useSelectiveAgents = (options: UseSelectiveAgentsOptions = {}) => {
  const router = useRouter();
  const { agents, fetchAgents, loading, error } = useAgentsContext();
  
  const {
    loadOnRoutes = ['/agents', '/calls', '/agents/'],
    enabled = true
  } = options;

  useEffect(() => {
    if (!enabled) return;

    // Obtener la ruta actual del pathname
    const currentPath = window.location.pathname;
    
    // Verificar si estamos en una ruta que necesita agentes
    const shouldLoad = loadOnRoutes.some(route => 
      currentPath.includes(route) || 
      currentPath.startsWith(route)
    );

    if (shouldLoad && agents.length === 0 && !loading) {
      console.log(`🎯 [SELECTIVE_AGENTS] Loading agents for route: ${currentPath}`);
      fetchAgents();
    } else if (!shouldLoad) {
      console.log(`⏭️ [SELECTIVE_AGENTS] Skipping agent load for route: ${currentPath}`);
    }

  }, [enabled, loadOnRoutes, agents.length, loading, fetchAgents]);

  return {
    agents,
    loading,
    error,
    loadAgents: fetchAgents,
    shouldLoadOnCurrentRoute: () => {
      const currentPath = window.location.pathname;
      return loadOnRoutes.some(route => 
        currentPath.includes(route) || 
        currentPath.startsWith(route)
      );
    }
  };
};