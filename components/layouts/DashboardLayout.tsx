'use client'

import { usePathname } from 'next/navigation'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useAuth } from '@/contexts/AuthContext'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const PUBLIC_ROUTES = ['/auth/login', '/auth/register', '/auth/verify', '/auth/forgot-password', '/invite']

const isPublicRoute = (pathname: string) => {
  return pathname === '/' || PUBLIC_ROUTES.some(route => pathname.startsWith(route))
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const { user, loading } = useAuth()
  
  // Debug logging
  console.log('🏗️ [DASHBOARD-LAYOUT] Pathname:', pathname)
  console.log('🏗️ [DASHBOARD-LAYOUT] User:', user)
  console.log('🏗️ [DASHBOARD-LAYOUT] Loading:', loading)
  
  // Rutas públicas sin sidebar
  if (isPublicRoute(pathname)) {
    console.log('🏗️ [DASHBOARD-LAYOUT] Public route detected')
    return (
      <div className="min-h-screen bg-background">
        {children}
      </div>
    )
  }

  // Si está cargando, mostrar loading
  if (loading) {
    console.log('🏗️ [DASHBOARD-LAYOUT] Still loading auth...')
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div>Cargando...</div>
      </div>
    )
  }

  // Si no hay usuario autenticado, no mostrar sidebar
  if (!user) {
    console.log('🏗️ [DASHBOARD-LAYOUT] No user, hiding sidebar')
    return (
      <div className="min-h-screen bg-background">
        {children}
      </div>
    )
  }

  // Layout con sidebar para usuarios autenticados
  console.log('🏗️ [DASHBOARD-LAYOUT] User authenticated, showing sidebar')
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-1 flex-col gap-4 p-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}