'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Building2,
  Bell,
  User,
  LogOut,
  Plus,
  Crown,
  Shield,
  UserCheck,
} from 'lucide-react';
import {
  useCurrentUser,
  useCurrentSession,
  usePermissions,
} from '@/hooks/useGlobalState';
import { useAuth } from '@/modules/auth';
import OrganizationManager from '@/components/organizations/OrganizationManager';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface GlobalHeaderProps {
  className?: string;
}

export default function GlobalHeader({ className = '' }: GlobalHeaderProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const { user, firebaseAuth } = useCurrentUser();
  const { currentOrganization, currentTenant, userRole } = useCurrentSession();
  const { canCreateOrganizations } = usePermissions();
  const [isOrganizationSwitcherOpen, setIsOrganizationSwitcherOpen] = useState(false);

  const getRoleIcon = (role: string | null) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-3 w-3 text-yellow-500" />;
      case 'admin':
        return <Shield className="h-3 w-3 text-blue-500" />;
      default:
        return <UserCheck className="h-3 w-3 text-gray-500" />;
    }
  };

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case 'owner':
        return 'Propietario';
      case 'admin':
        return 'Administrador';
      default:
        return 'Miembro';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <header className={`flex h-16 shrink-0 items-center gap-2 border-b px-4 ${className}`}>
      {/* Left Section - Sidebar Toggle + Logo + Company Info */}
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-4" />
        
        {/* Brand + Company Info - Minimalista - Clickeable */}
        <button 
          onClick={() => setIsOrganizationSwitcherOpen(true)}
          className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/50 transition-colors"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded bg-primary text-primary-foreground">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-sm font-semibold leading-none">MAR-IA</span>
            <span className="text-xs text-muted-foreground leading-none">
              {currentTenant?.companyInfo.name || currentOrganization?.name || 'Demo Company'}
            </span>
          </div>
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right Section - Actions */}
      <div className="flex items-center gap-1">
        {canCreateOrganizations && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOrganizationSwitcherOpen(true)}
            title="Gestionar organizaciones"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
        
        <Button variant="ghost" size="sm">
          <Bell className="h-4 w-4" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage 
                  src={firebaseAuth?.photoURL || ''} 
                  alt={firebaseAuth?.displayName || 'User'} 
                />
                <AvatarFallback>
                  {getInitials(firebaseAuth?.displayName || firebaseAuth?.email || 'U')}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
            
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {firebaseAuth?.displayName || 'Sin nombre'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {firebaseAuth?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator />
              
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuItem asChild>
              <Link href="/organizations" className="cursor-pointer">
                <Building2 className="mr-2 h-4 w-4" />
                <span>Organizaciones</span>
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Organization Switcher Modal */}
      <Dialog open={isOrganizationSwitcherOpen} onOpenChange={setIsOrganizationSwitcherOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Gestionar Organizaciones</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh]">
            <OrganizationManager 
              onOrganizationSwitch={() => setIsOrganizationSwitcherOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}