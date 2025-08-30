import { 
  Home, User, Settings, Key, PieChart, Shield, Building, Brain, UserCog, 
  BarChart3, Zap, Calendar, Users, Bot, Activity, Target, Package
} from 'lucide-react'

export interface AppModule {
  id: string
  label: string
  icon: React.ReactElement
  path: string
  enabled: boolean
  group: 'main' | 'core' | 'intelligence' | 'account' | 'admin'
}

// CONFIGURACIÓN MODULAR - 6 MÓDULOS INDEPENDIENTES
export const MODULES: AppModule[] = [
  // Principal
  { id: 'dashboard', label: 'Dashboard Ejecutivo', icon: <Home />, path: '/dashboard', enabled: true, group: 'main' },
  
  // Módulos Core
  { id: 'leads', label: 'Gestión de Leads', icon: <Users />, path: '/clients/leads', enabled: true, group: 'core' },
  { id: 'campaigns', label: 'Campañas', icon: <Target />, path: '/campaigns', enabled: true, group: 'core' },
  { id: 'products', label: 'Productos', icon: <Package />, path: '/products', enabled: false, group: 'core' },
  { id: 'calendar', label: 'Calendario IA', icon: <Calendar />, path: '/calendar', enabled: true, group: 'core' },
  
  // Módulos de Inteligencia
  { id: 'analytics', label: 'Analytics IA', icon: <BarChart3 />, path: '/analytics', enabled: false, group: 'intelligence' },
  { id: 'monitor', label: 'Monitor Tiempo Real', icon: <Activity />, path: '/monitor', enabled: false, group: 'intelligence' },
  { id: 'automation', label: 'Automatización', icon: <Bot />, path: '/automation', enabled: false, group: 'intelligence' },
  
  // Cuenta
  { id: 'profile', label: 'Mi Perfil', icon: <User />, path: '/profile', enabled: true, group: 'account' },
  { id: 'clients', label: 'Admin Clientes', icon: <Building />, path: '/clients/admin', enabled: false, group: 'account' },
  
  // Admin
  { id: 'api-keys', label: 'API Keys', icon: <Key />, path: '/admin/api-keys', enabled: true, group: 'admin' },
]

// Labels de grupos
export const GROUP_LABELS = {
  main: 'Principal',
  core: 'Módulos Core', 
  intelligence: 'Inteligencia IA',
  account: 'Cuenta',
  admin: 'Administración'
} as const

// Helper: obtener módulos agrupados
export const getGroupedModules = () => {
  const groups = new Map<string, AppModule[]>()
  
  MODULES.filter(m => m.enabled).forEach(module => {
    if (!groups.has(module.group)) {
      groups.set(module.group, [])
    }
    groups.get(module.group)!.push(module)
  })
  
  return Array.from(groups.entries()).map(([id, modules]) => ({
    id,
    label: GROUP_LABELS[id as keyof typeof GROUP_LABELS] || id,
    modules
  }))
}