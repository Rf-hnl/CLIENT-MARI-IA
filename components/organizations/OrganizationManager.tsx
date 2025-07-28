'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Building2,
  Users,
  Settings,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Crown,
  Shield,
  User,
  Calendar,
  Activity,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useOrganizations, useCurrentSession, usePermissions } from '@/hooks/useGlobalState';
import { Organization } from '@/types/globalState';
import { formatDate, safeFormatDate } from '@/utils/dateFormat';
import CreateOrganizationModal from './CreateOrganizationModal';
import { Timestamp } from 'firebase/firestore';

interface OrganizationManagerProps {
  className?: string;
  onOrganizationSwitch?: () => void;
}

export default function OrganizationManager({ className = '', onOrganizationSwitch }: OrganizationManagerProps) {
  const { availableOrganizations, currentOrganization, switchToOrganization } = useOrganizations();
  const { currentTenant } = useCurrentSession();
  const { canCreateOrganizations, userRole } = usePermissions();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);

  const getRoleIcon = (orgId: string, ownerId: string) => {
    if (ownerId === userRole) {
      return <Crown className="h-4 w-4 text-yellow-600" />;
    }
    // You'd determine this based on user's role in the organization
    return <User className="h-4 w-4 text-blue-600" />;
  };

  const getRoleBadge = (orgId: string, ownerId: string) => {
    if (ownerId === userRole) {
      return <Badge variant="default">Propietario</Badge>;
    }
    // You'd determine this based on user's role in the organization
    return <Badge variant="secondary">Miembro</Badge>;
  };

  const getOrganizationInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };


  const handleSwitchOrganization = async (organization: Organization) => {
    if (organization.id === currentOrganization?.id) return;
    
    try {
      const tenantId = currentTenant?.id;
      if (!tenantId) {
        throw new Error('No se pudo determinar el tenant');
      }
      
      await switchToOrganization(organization.id, tenantId);
      
      // Llamar al callback después de cambiar de organización
      if (onOrganizationSwitch) {
        onOrganizationSwitch();
      }
    } catch (error) {
      console.error('Error switching organization:', error);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Mis Organizaciones
          </h2>
          <p className="text-muted-foreground">
            Gestiona y cambia entre tus organizaciones
          </p>
        </div>
        
        {canCreateOrganizations && (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Organización
          </Button>
        )}
      </div>

      {/* Current Organization */}
      {currentOrganization && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Organización Actual
              </CardTitle>
              <Badge variant="default">Activa</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-start space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src="" alt={currentOrganization.name} />
                <AvatarFallback className="text-lg">
                  {getOrganizationInitials(currentOrganization.name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="text-xl font-semibold">{currentOrganization.name}</h3>
                  <p className="text-muted-foreground">{currentOrganization.description}</p>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {currentOrganization.memberIds.length} miembros
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className="h-4 w-4" />
                    {currentOrganization.stats.activeUsers} activos
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Creada {safeFormatDate(currentOrganization.createdAt)}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {getRoleIcon(currentOrganization.id, currentOrganization.ownerId)}
                  {getRoleBadge(currentOrganization.id, currentOrganization.ownerId)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Organizations */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          Todas las Organizaciones ({availableOrganizations.length})
        </h3>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {availableOrganizations.map(organization => {
            const isCurrentOrg = organization.id === currentOrganization?.id;
            
            return (
              <Card key={organization.id} className={isCurrentOrg ? 'border-primary/50' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="" alt={organization.name} />
                        <AvatarFallback className="text-sm">
                          {getOrganizationInitials(organization.name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <CardTitle className="text-base">{organization.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          {getRoleIcon(organization.id, organization.ownerId)}
                          {getRoleBadge(organization.id, organization.ownerId)}
                        </div>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedOrganization(organization)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalles
                        </DropdownMenuItem>
                        {!isCurrentOrg && (
                          <DropdownMenuItem onClick={() => handleSwitchOrganization(organization)}>
                            <Building2 className="h-4 w-4 mr-2" />
                            Cambiar a Esta
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Settings className="h-4 w-4 mr-2" />
                          Configuración
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <CardDescription className="mb-3">
                    {organization.description}
                  </CardDescription>
                  
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Miembros:</span>
                      <span>{organization.memberIds.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Leads:</span>
                      <span>{organization.stats.totalLeads}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Campañas:</span>
                      <span>{organization.stats.totalCampaigns}</span>
                    </div>
                  </div>
                  
                  {isCurrentOrg && (
                    <div className="mt-3 pt-3 border-t">
                      <Badge variant="default" className="w-full justify-center">
                        Organización Actual
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {availableOrganizations.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tienes organizaciones</h3>
            <p className="text-muted-foreground text-center mb-4">
              Crea tu primera organización para comenzar a gestionar equipos y proyectos.
            </p>
            {canCreateOrganizations && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Organización
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Organization Modal */}
      <CreateOrganizationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(organizationId) => {
          console.log('Organization created:', organizationId);
        }}
      />
    </div>
  );
}