import React from 'react';
import { 
  User, 
  LayoutDashboard, 
  Settings, 
  FileText, 
  BarChart3, 
  Mail,
  Shield,
  Database,
  Users,
  UserCog,
  CreditCard,
  UserPlus,
  Bot
} from 'lucide-react';

/**
 * SISTEMA DE CONFIGURACIÓN MODULAR
 * 
 * Para agregar un nuevo módulo, solo añade un nuevo objeto al arreglo MODULES.
 * Este sistema permite control dinámico sin modificar el layout.
 * 
 * Cada módulo puede ser activado/desactivado cambiando la propiedad 'enabled'.
 * Los iconos provienen de lucide-react para mantener consistencia.
 * 
 * Estructura del módulo:
 * - id: Identificador único
 * - label: Nombre visible en el sidebar
 * - icon: Componente JSX del icono (lucide-react)
 * - path: Ruta de navegación
 * - enabled: Si el módulo está activo o no
 * 
 * EJEMPLOS DE USO:
 * 
 * Activar un módulo:
 * { ...módulo, enabled: true }
 * 
 * Desactivar un módulo:
 * { ...módulo, enabled: true }
 * 
 * Agregar nuevo módulo:
 * {
 *   id: 'nuevo-modulo',
 *   label: 'Nuevo Módulo',
 *   icon: <NuevoIcon className="h-5 w-5" />,
 *   path: '/nuevo-modulo',
 *   enabled: true,
 * }
 */

interface SubModule {
  id: string;
  label: string;
  icon: React.ReactElement;
  path: string;
  enabled: boolean;
}

export interface AppModule {
  id: string;
  label: string;
  icon: React.ReactElement;
  path?: string;
  enabled: boolean;
  group?: string;
  submodules?: SubModule[];
}

export interface ModuleGroup {
  id: string;
  label: string;
  modules: AppModule[];
}

export const MODULES: AppModule[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
    path: '/dashboard',
    enabled: true,
    group: 'main',
  },
  {
    id: 'profile',
    label: 'Perfil',
    icon: <User className="h-5 w-5" />,
    path: '/profile',
    enabled: true,
    group: 'account',
  },
  {
    id: 'clients-leads',
    label: 'Leads',
    icon: <UserPlus className="h-4 w-4" />,
    path: '/clients/leads',
    enabled: true,
  },
  {
    id: 'agents',
    label: 'Agentes IA',
    icon: <Bot className="h-5 w-5" />,
    path: '/agents',
    enabled: true,
    group: 'business',
  },
  {
    id: 'clients',
    label: 'Clientes',
    icon: <Users className="h-5 w-5" />,
    enabled: true,
    group: 'business',
    submodules: [
      {
        id: 'clients-admin',
        label: 'Administración',
        icon: <UserCog className="h-4 w-4" />,
        path: '/clients/admin',
        enabled: true,
      },
      {
        id: 'clients-billing',
        label: 'Cobros',
        icon: <CreditCard className="h-4 w-4" />,
        path: '/clients/billing',
        enabled: true,
      },
    ],
  },

  // MÓDULOS FUTUROS - Agregar cuando estén listos
  {
    id: 'auth-management',
    label: 'Gestión Auth',
    icon: <Shield className="h-5 w-5" />,
    path: '/auth-management',
    enabled: false,
    group: 'admin',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <BarChart3 className="h-5 w-5" />,
    path: '/analytics',
    enabled: true,
    group: 'business',
  },
  {
    id: 'reports',
    label: 'Reportes',
    icon: <FileText className="h-5 w-5" />,
    path: '/reports',
    enabled: false,
    group: 'business',
  },
  {
    id: 'messaging',
    label: 'Mensajería',
    icon: <Mail className="h-5 w-5" />,
    path: '/messaging',
    enabled: false,
    group: 'communication',
  },
  {
    id: 'database',
    label: 'Base de Datos',
    icon: <Database className="h-5 w-5" />,
    path: '/database',
    enabled: false,
    group: 'admin',
  },
  {
    id: 'settings',
    label: 'Configuración',
    icon: <Settings className="h-5 w-5" />,
    path: '/settings',
    enabled: false,
    group: 'account',
  },
];

// Group labels mapping
export const GROUP_LABELS: Record<string, string> = {
  main: 'Principal',
  account: 'Cuenta',
  business: 'Negocio',
  communication: 'Comunicación',
  admin: 'Administración',
};

/**
 * HELPER FUNCTIONS
 */

// Obtener solo módulos activos
export const getEnabledModules = (): AppModule[] => {
  return MODULES.filter(appModule => appModule.enabled);
};

// Obtener módulos agrupados (solo activos)
export const getGroupedModules = (): ModuleGroup[] => {
  const enabledModules = getEnabledModules();
  const groupMap = new Map<string, AppModule[]>();

  // Agrupar módulos por group
  enabledModules.forEach(appModule => {
    const group = appModule.group || 'other';
    if (!groupMap.has(group)) {
      groupMap.set(group, []);
    }
    groupMap.get(group)!.push(appModule);
  });

  // Convertir a array de grupos
  return Array.from(groupMap.entries()).map(([groupId, modules]) => ({
    id: groupId,
    label: GROUP_LABELS[groupId] || groupId,
    modules,
  }));
};

// Buscar módulo por ID
export const getModuleById = (id: string): AppModule | undefined => {
  return MODULES.find(appModule => appModule.id === id);
};

// Buscar módulo por path (incluyendo submódulos)
export const getModuleByPath = (path: string): AppModule | undefined => {
  // Primero buscar en módulos principales
  const mainModule = MODULES.find(appModule => appModule.path === path);
  if (mainModule) return mainModule;
  
  // Luego buscar en submódulos
  for (const appModule of MODULES) {
    if (appModule.submodules) {
      const submodule = appModule.submodules.find(sub => sub.path === path);
      if (submodule) return appModule; // Retorna el módulo padre
    }
  }
  
  return undefined;
};

// Buscar submódulo por path
export const getSubmoduleByPath = (path: string) => {
  for (const appModule of MODULES) {
    if (appModule.submodules) {
      const submodule = appModule.submodules.find(sub => sub.path === path);
      if (submodule) return { parent: appModule, submodule };
    }
  }
  return undefined;
};

// Verificar si un path corresponde a un módulo activo
export const isActiveModulePath = (path: string): boolean => {
  const appModule = getModuleByPath(path);
  return appModule ? appModule.enabled : true;
};