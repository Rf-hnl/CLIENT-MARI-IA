'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Trash2,
  MessageCircle,
  Target,
  Users,
  Phone,
  Loader2,
  FolderOpen
} from 'lucide-react';

import { Campaign } from '@/types/campaign';

interface JWTUser {
  id: string;
  email: string;
  tenantId: string;
  organizationId: string;
  roles: string[];
}

// Define the Props interface
interface LeadsBulkActionsProps {
  selectedLeads: Set<string>;
  bulkModeActive: boolean;
  onToggleBulkMode: () => void;
  showPersonalizationPanel: boolean;
  onTogglePersonalizationPanel: () => void;
  showDeleteConfirm: boolean;
  onToggleDeleteConfirm: () => void;
  onDeleteSelected: () => void;
  user: JWTUser | null;
  onPersonalizationComplete: (results: string[]) => void;
  onBulkCall?: () => void;
  isProcessingCalls?: boolean;
  showCampaignAssignment?: boolean;
  onToggleCampaignAssignment?: () => void;
}

export function LeadsBulkActions({
  selectedLeads,
  bulkModeActive,
  onToggleBulkMode,
  showPersonalizationPanel,
  onTogglePersonalizationPanel,
  showDeleteConfirm,
  onToggleDeleteConfirm,
  onDeleteSelected,
  user,
  onPersonalizationComplete,
  onBulkCall,
  isProcessingCalls = false,
  showCampaignAssignment = false,
  onToggleCampaignAssignment
}: LeadsBulkActionsProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [isAssigningCampaign, setIsAssigningCampaign] = useState(false);

  // Mostrar acciones masivas automáticamente cuando hay 2 o más leads seleccionados
  const shouldShowBulkActions = selectedLeads.size >= 2;

  // Fetch campaigns when component mounts
  useEffect(() => {
    const fetchCampaigns = async () => {
      console.log('=== DEBUG CAMPAIGN LOADING ===');
      console.log('Full user object:', user);
      console.log('User keys:', user ? Object.keys(user) : 'No user');
      console.log('TenantId:', user?.tenantId);
      console.log('OrganizationId:', user?.organizationId);
      
      // Get tenantId and organizationId from JWT user object
      const possibleTenantId = user?.tenantId;
      const possibleOrgId = user?.organizationId;
      
      console.log('Alternative tenantId:', possibleTenantId);
      console.log('Alternative organizationId:', possibleOrgId);
      
      if (!possibleTenantId || !possibleOrgId) {
        console.warn('Missing tenantId or organizationId - cannot fetch campaigns');
        console.log('Available user properties:', user ? Object.keys(user) : 'none');
        return;
      }
      
      try {
        const queryParams = new URLSearchParams({
          tenantId: possibleTenantId,
          organizationId: possibleOrgId,
        });
        
        const url = `/api/campaigns/get`;
        console.log('Fetching campaigns from:', url);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tenantId: possibleTenantId,
            organizationId: possibleOrgId
          })
        });
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        const data = await response.json();
        console.log('Raw campaigns API response:', data);
        
        if (data.success) {
          console.log('Successfully got campaigns:', data.data);
          console.log('Campaigns count:', data.data?.length || 0);
          setCampaigns(data.data || []);
        } else {
          console.error('Campaigns API returned error:', data.error);
        }
      } catch (error) {
        console.error('Error loading campaigns:', error);
      }
    };

    if (user) {
      fetchCampaigns();
    } else {
      console.log('No user available, skipping campaign fetch');
    }
  }, [user]);

  const handleAssignCampaign = async () => {
    const possibleTenantId = user?.tenantId;
    const possibleOrgId = user?.organizationId;
    
    if (!selectedCampaign || !possibleTenantId || !possibleOrgId) return;
    
    setIsAssigningCampaign(true);
    try {
      const leadIds = Array.from(selectedLeads);
      const response = await fetch('/api/leads/bulk-assign-campaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId: possibleTenantId,
          organizationId: possibleOrgId,
          leadIds,
          campaignId: selectedCampaign
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Close modal and reset state
        onToggleCampaignAssignment && onToggleCampaignAssignment();
        setSelectedCampaign('');
        // Optionally trigger a refresh of the leads list
        window.location.reload();
      }
    } catch (error) {
      console.error('Error assigning campaign:', error);
    } finally {
      setIsAssigningCampaign(false);
    }
  };

  return (
    <>
      {/* Bulk Actions - Aparece automáticamente con 2+ leads seleccionados */}
      {shouldShowBulkActions && (
        <div className="flex items-center gap-2 p-3 bg-orange-500 dark:bg-orange-600 rounded-lg border border-orange-400 dark:border-orange-500 mt-2 mb-2 shadow-lg">
          <div className="flex-1">
            <p className="text-sm font-medium text-white">
              🚀 Acciones masivas disponibles para {selectedLeads.size} leads
            </p>
          </div>
          <div className="flex gap-2">
            {onBulkCall && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onBulkCall}
                disabled={isProcessingCalls}
                className="bg-white text-orange-600 border-white hover:bg-orange-50 hover:text-orange-700 font-medium disabled:opacity-50"
              >
                {isProcessingCalls ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Phone className="h-4 w-4 mr-2" />
                    Llamadas Masivas ({selectedLeads.size})
                  </>
                )}
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={onToggleCampaignAssignment}
              className="bg-white text-orange-600 border-white hover:bg-orange-50 hover:text-orange-700 font-medium"
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              Asignar Campaña ({selectedLeads.size})
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={onToggleDeleteConfirm}
              className="bg-red-600 text-white border-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar ({selectedLeads.size})
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-black rounded-lg max-w-md w-full mx-4 p-6 border border-gray-200 dark:border-white">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
              ⚠️ Confirmar Eliminación Masiva
            </h3>
            <p className="text-black dark:text-white mb-6">
              ¿Estás seguro de que deseas eliminar {selectedLeads.size} lead{selectedLeads.size > 1 ? 's' : ''}? 
              Esta acción eliminará permanentemente los datos de los leads seleccionados.
            </p>
            
            <div className="flex gap-3 justify-end">
              <Button 
                variant="outline" 
                onClick={onToggleDeleteConfirm}
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={onDeleteSelected}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar {selectedLeads.size} lead{selectedLeads.size > 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Assignment Modal */}
      {showCampaignAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-black rounded-lg max-w-md w-full mx-4 p-6 border border-orange-200 dark:border-orange-500 shadow-lg">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-orange-600" />
              Asignar Campaña a {selectedLeads.size} lead{selectedLeads.size > 1 ? 's' : ''}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
              Selecciona la campaña que deseas asignar a los leads seleccionados
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Campaña</label>
                <select 
                  className="w-full p-3 border border-orange-300 rounded-lg bg-white dark:bg-gray-800 dark:border-orange-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                  value={selectedCampaign}
                  onChange={(e) => setSelectedCampaign(e.target.value)}
                >
                  <option value="">Seleccionar campaña...</option>
                  {campaigns.length > 0 ? (
                    campaigns.map((campaign) => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      {campaigns.length === 0 ? 'No hay campañas disponibles' : 'Cargando campañas...'}
                    </option>
                  )}
                </select>
                {campaigns.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    No se encontraron campañas. Crea una campaña primero.
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex gap-3 justify-end mt-6">
              <Button 
                variant="outline" 
                onClick={onToggleCampaignAssignment}
                className="border-gray-300 hover:border-gray-400"
              >
                Cancelar
              </Button>
              <Button 
                variant="default"
                className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600 hover:border-orange-700"
                onClick={handleAssignCampaign}
                disabled={!selectedCampaign || isAssigningCampaign}
              >
                {isAssigningCampaign ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Asignando...
                  </>
                ) : (
                  <>
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Asignar Campaña
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Personalization Modal */}
      {showPersonalizationPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-black rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white">
              <h3 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2">
                <MessageCircle className="w-6 h-6 text-purple-600" />
                🎯 Personalización Masiva
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onTogglePersonalizationPanel}
                className="h-8 px-2"
              >
                <span className="sr-only">Cerrar</span>
                ✕
              </Button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="text-center p-8">
                <MessageCircle className="h-12 w-12 mx-auto text-purple-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Personalización Masiva</h3>
                <p className="text-gray-600 mb-4">
                  Personalización para {selectedLeads.size} leads seleccionados
                </p>
                <Button onClick={onTogglePersonalizationPanel}>
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
