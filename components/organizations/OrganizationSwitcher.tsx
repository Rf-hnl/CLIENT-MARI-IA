'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Building2,
  ChevronDown,
  CheckCircle,
  Loader2,
  Plus,
  Settings,
} from 'lucide-react';
import { useCurrentSession, useOrganizations, usePermissions } from '@/hooks/useGlobalState';
import { Organization } from '@/types/globalState';

interface OrganizationSwitcherProps {
  onCreateNew?: () => void;
  onManageOrganizations?: () => void;
  className?: string;
}

export default function OrganizationSwitcher({
  onCreateNew,
  onManageOrganizations,
  className = '',
}: OrganizationSwitcherProps) {
  const { currentOrganization, currentTenant, isLoading } = useCurrentSession();
  const { availableOrganizations, switchToOrganization } = useOrganizations();
  const { canCreateOrganizations, canSwitchOrganizations } = usePermissions();
  const [isSwitching, setIsSwitching] = useState(false);

  const handleOrganizationSwitch = async (organization: Organization) => {
    if (organization.id === currentOrganization?.id) return;

    try {
      setIsSwitching(true);
      // Find the tenant ID for this organization
      const tenantId = currentTenant?.id; // For now, assuming same tenant
      if (!tenantId) {
        throw new Error('No se pudo determinar el tenant');
      }
      
      await switchToOrganization(organization.id, tenantId);
    } catch (error) {
      console.error('Error switching organization:', error);
      // Handle error - you might want to show a toast notification
    } finally {
      setIsSwitching(false);
    }
  };

  const getOrganizationInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading || !currentOrganization) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Cargando...</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`h-auto p-2 justify-start ${className}`}
          disabled={isSwitching || !canSwitchOrganizations}
        >
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-8 w-8">
              <AvatarImage src="" alt={currentOrganization.name} />
              <AvatarFallback className="text-xs">
                {getOrganizationInitials(currentOrganization.name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex flex-col items-start min-w-0">
              <span className="font-medium text-sm truncate max-w-[150px]">
                {currentOrganization.name}
              </span>
              {currentTenant && (
                <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                  {currentTenant.companyInfo.name}
                </span>
              )}
            </div>
            
            {canSwitchOrganizations && (
              <ChevronDown className="h-4 w-4 shrink-0" />
            )}
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      {canSwitchOrganizations && (
        <DropdownMenuContent align="start" className="w-80">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Cambiar Organización
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Current Organization */}
          <div className="px-2 py-1">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Organización Actual
            </div>
            <div className="flex items-center gap-3 p-2 bg-muted rounded-md">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt={currentOrganization.name} />
                <AvatarFallback className="text-xs">
                  {getOrganizationInitials(currentOrganization.name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">
                    {currentOrganization.name}
                  </span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                {currentTenant && (
                  <span className="text-xs text-muted-foreground truncate">
                    {currentTenant.companyInfo.name}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Available Organizations */}
          {availableOrganizations.length > 1 && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-1">
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  Organizaciones Disponibles
                </div>
                <div className="space-y-1">
                  {availableOrganizations
                    .filter(org => org.id !== currentOrganization.id)
                    .map(organization => (
                      <DropdownMenuItem
                        key={organization.id}
                        onClick={() => handleOrganizationSwitch(organization)}
                        disabled={isSwitching}
                        className="p-2 cursor-pointer"
                      >
                        <div className="flex items-center gap-3 w-full">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="" alt={organization.name} />
                            <AvatarFallback className="text-xs">
                              {getOrganizationInitials(organization.name)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">
                                {organization.name}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {organization.memberIds.length} miembros
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground truncate">
                              {organization.description}
                            </span>
                          </div>
                          
                          {isSwitching && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))}
                </div>
              </div>
            </>
          )}
          
          {/* Action Buttons */}
          <DropdownMenuSeparator />
          <div className="p-2 space-y-1">
            {canCreateOrganizations && onCreateNew && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCreateNew}
                className="w-full justify-start"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Nueva Organización
              </Button>
            )}
            
            {onManageOrganizations && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onManageOrganizations}
                className="w-full justify-start"
              >
                <Settings className="h-4 w-4 mr-2" />
                Gestionar Organizaciones
              </Button>
            )}
          </div>
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  );
}