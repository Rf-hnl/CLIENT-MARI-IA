/**
 * Configuración para controlar cuándo cargar agentes automáticamente
 */
export const AGENT_LOADING_CONFIG = {
  // Rutas donde se cargan agentes automáticamente (modo completo)
  FULL_LOAD_ROUTES: [
    '/agents',
    '/agents/',
    '/calls/initiate',
    '/calls/new'
  ],
  
  // Rutas donde se cargan solo datos básicos (modo ligero)
  LIGHTWEIGHT_ROUTES: [
    '/dashboard',
    '/stats',
    '/reports'
  ],
  
  // Rutas donde NO se cargan agentes
  NO_LOAD_ROUTES: [
    '/clients',
    '/clients/',
    '/settings',
    '/profile',
    '/auth'
  ],
  
  // Determina el tipo de carga basado en la ruta
  getLoadingStrategy: (pathname: string): 'full' | 'lightweight' | 'none' => {
    // Verificar primero las rutas de no carga
    if (AGENT_LOADING_CONFIG.NO_LOAD_ROUTES.some(route => 
      pathname.startsWith(route) || pathname.includes(route)
    )) {
      return 'none';
    }
    
    // Verificar rutas de carga completa
    if (AGENT_LOADING_CONFIG.FULL_LOAD_ROUTES.some(route => 
      pathname.startsWith(route) || pathname.includes(route)
    )) {
      return 'full';
    }
    
    // Verificar rutas de carga ligera
    if (AGENT_LOADING_CONFIG.LIGHTWEIGHT_ROUTES.some(route => 
      pathname.startsWith(route) || pathname.includes(route)
    )) {
      return 'lightweight';
    }
    
    // Por defecto, no cargar
    return 'none';
  }
};

export default AGENT_LOADING_CONFIG;