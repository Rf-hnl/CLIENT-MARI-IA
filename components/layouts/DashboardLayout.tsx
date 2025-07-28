'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import GlobalHeader from '@/components/layout/GlobalHeader';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  
  // Rutas públicas que no necesitan sidebar ni header
  const publicRoutes = ['/auth/login', '/auth/register', '/auth/verify', '/auth/forgot-password'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route)) || pathname === '/';
  
  // Si es ruta pública, renderizar sin sidebar ni header
  if (isPublicRoute) {
    return (
      <div className="min-h-screen bg-background">
        {children}
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Global Header integrado */}
        <GlobalHeader />
        
        {/* Contenido principal */}
        <div className="flex flex-1 flex-col gap-4 p-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}