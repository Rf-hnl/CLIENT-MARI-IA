'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';
import { useAuth } from '@/modules/auth';
import { getCurrentUserData, getCurrentOrganization } from '@/lib/auth/userState';

interface SimpleGlobalHeaderProps {
  className?: string;
}

export default function SimpleGlobalHeader({ className = '' }: SimpleGlobalHeaderProps) {
  const router = useRouter();
  const { logout, currentUser } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [currentOrg, setCurrentOrg] = useState<any>(null);

  useEffect(() => {
    if (currentUser) {
      getCurrentUserData(currentUser).then(setUserData);
      getCurrentOrganization(currentUser).then(setCurrentOrg);
    } else {
      setUserData(null);
      setCurrentOrg(null);
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  if (!currentUser || !userData) {
    return null;
  }

  const displayName = userData.firestoreUser?.displayName || currentUser.email || 'Usuario';
  const userInitials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase();

  return (
    <header className={`flex h-16 shrink-0 items-center gap-2 px-4 ${className}`}>
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      
      {/* Organization Display */}
      <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-md">
        <Building2 className="h-4 w-4" />
        <span className="text-sm font-medium">
          {currentOrg?.name || 'Sin organización'}
        </span>
      </div>

      <div className="flex-1" />

      {/* Notifications */}
      <Button variant="ghost" size="sm">
        <Bell className="h-4 w-4" />
      </Button>

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={userData.firestoreUser?.photoURL} alt={displayName} />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {currentUser.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push('/profile')}>
            <User className="mr-2 h-4 w-4" />
            <span>Perfil</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Cerrar sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}