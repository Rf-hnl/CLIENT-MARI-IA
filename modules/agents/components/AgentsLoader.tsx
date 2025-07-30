'use client';

import { useEffect } from 'react';
import { useAgentsContext } from '../context/AgentsContext';

interface AgentsLoaderProps {
  /**
   * Si debe cargar automáticamente al montar el componente
   */
  autoLoad?: boolean;
  
  /**
   * Si debe mostrar un loading spinner
   */
  showLoading?: boolean;
  
  /**
   * Componente hijo que se renderiza después de cargar
   */
  children?: React.ReactNode;
  
  /**
   * Callback cuando termina de cargar
   */
  onLoaded?: () => void;
}

/**
 * Componente que se encarga de cargar agentes solo cuando es necesario
 * Úsalo en páginas que necesiten datos de agentes
 */
export const AgentsLoader = ({ 
  autoLoad = true, 
  showLoading = true, 
  children,
  onLoaded 
}: AgentsLoaderProps) => {
  const { agents, loading, error, fetchAgents, isLoaded } = useAgentsContext();

  useEffect(() => {
    if (autoLoad && !isLoaded && !loading && agents.length === 0) {
      console.log('🎯 [AGENTS_LOADER] Loading agents on demand...');
      fetchAgents();
    }
  }, [autoLoad, isLoaded, loading, agents.length, fetchAgents]);

  useEffect(() => {
    if (isLoaded && onLoaded) {
      onLoaded();
    }
  }, [isLoaded, onLoaded]);

  if (loading && showLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-600">Cargando agentes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-800">Error al cargar agentes: {error}</p>
        <button 
          onClick={() => fetchAgents()}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return <>{children}</>;
};