'use client';

/**
 * GESTIÓN DE CAMPAÑAS - DISEÑO MINIMALISTA
 * 
 * Página principal para la gestión integral de campañas de marketing
 * Ruta: /campaigns
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Plus, 
  RefreshCw, 
  Target,
  DollarSign,
  Users,
  Edit,
  Trash2,
  MoreVertical,
  Loader2,
  Package,
  Activity,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// Imports para auth y API
import { useAuth } from '@/modules/auth';
import { useNotification } from '@/hooks/useNotification';
import { NotificationContainer } from '@/components/ui/notification';

// Types
import { 
  CampaignStatus, 
  CreateCampaignData,
  CampaignWithMetrics,
  Product
} from '@/types/campaign';

// Componente principal
export default function CampaignsPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Crear objetos tenant y organization a partir del user JWT (memoizados para evitar re-renders)
  const currentTenant = useMemo(() => 
    user ? { id: user.tenantId } : null, 
    [user?.tenantId]
  );
  const currentOrganization = useMemo(() => 
    user ? { id: user.organizationId } : null, 
    [user?.organizationId]
  );
  const { showNotification, notifications, removeNotification } = useNotification();

  // Estados
  const [campaigns, setCampaigns] = useState<CampaignWithMetrics[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all');
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignWithMetrics | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [newProductData, setNewProductData] = useState({
    name: '',
    description: '',
    price: undefined as number | undefined,
    sku: ''
  });
  const [rawProductInfo, setRawProductInfo] = useState('');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [showAiHelper, setShowAiHelper] = useState(false);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Formulario
  const [formData, setFormData] = useState<CreateCampaignData>({
    name: '',
    description: '',
    budget: undefined,
    startDate: undefined,
    endDate: undefined,
    status: 'draft',
    productIds: []
  });

  // --- Flujo de datos centralizado y eficiente ---

  const fetchProducts = React.useCallback(async () => {
    if (!currentTenant?.id || !currentOrganization?.id) return;
    try {
      const queryParams = new URLSearchParams({
        tenantId: currentTenant.id,
        organizationId: currentOrganization.id,
        isActive: 'true'
      });
      const response = await fetch(`/api/products/internal?${queryParams}`);
      const data = await response.json();
      if (data.success) {
        setProducts(data.data.products);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  }, [currentTenant, currentOrganization]);

  const fetchCampaigns = React.useCallback(async () => {
    if (!currentTenant?.id || !currentOrganization?.id) return;
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        tenantId: currentTenant.id,
        organizationId: currentOrganization.id,
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      });
      const response = await fetch(`/api/campaigns/internal?${queryParams}`);
      const data = await response.json();
      if (data.success) {
        setCampaigns(data.data.campaigns);
        setTotalPages(Math.ceil(data.data.total / itemsPerPage));
      } else {
        showNotification({ type: 'error', title: 'Error al cargar campañas' });
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
      showNotification({ type: 'error', title: 'Error al cargar campañas' });
    } finally {
      setLoading(false);
    }
  }, [currentTenant, currentOrganization, currentPage, searchQuery, statusFilter, showNotification]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleCreateCampaign = async () => {
    if (!currentTenant?.id || !currentOrganization?.id) {
      showNotification({ type: 'error', title: 'Error: Información de tenant/organización no disponible' });
      return;
    }

    // Debug log to check selectedProducts before sending
    console.log('Selected products before creating campaign:', selectedProducts);

    // LOG para depuración
    console.log('[Crear Campaña] Datos enviados:', {
      tenantId: currentTenant.id,
      organizationId: currentOrganization.id,
      ...formData,
      productIds: selectedProducts
    });

    try {
      const response = await fetch('/api/campaigns/internal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          organizationId: currentOrganization.id,
          ...formData,
          productIds: selectedProducts
        }),
      });

      const data = await response.json();

      // LOG para depuración
      console.log('[Crear Campaña] Respuesta API:', data);

      if (data.success && data.data?.campaign) {
        showNotification({ type: 'success', title: 'Campaña creada exitosamente' });
        setIsNewCampaignOpen(false);
        resetForm();
        // Flujo eficiente: si estamos en la página 1, actualizamos localmente.
        // Si no, vamos a la página 1 para ver la nueva campaña.
        if (currentPage === 1) {
          setCampaigns(prev => [data.data.campaign, ...prev].slice(0, itemsPerPage));
        } else {
          setCurrentPage(1);
        }
      } else {
        showNotification({ type: 'error', title: `Error: ${data.error || 'No se pudo crear la campaña'}` });
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      showNotification({ type: 'error', title: 'Error al crear la campaña' });
    }
  };

  const handleUpdateCampaign = async () => {
    if (!editingCampaign) return;
    
    if (!currentTenant?.id || !currentOrganization?.id) {
      showNotification({ type: 'error', title: 'Error: Información de tenant/organización no disponible' });
      return;
    }

    try {
      const response = await fetch(`/api/campaigns/${editingCampaign.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          organizationId: currentOrganization.id,
          ...formData,
          productIds: selectedProducts
        }),
      });

      const data = await response.json();

      if (data.success && data.data?.campaign) {
        showNotification({ type: 'success', title: 'Campaña actualizada exitosamente' });
        // Actualización local para una respuesta instantánea
        setCampaigns(campaigns.map(c => 
          c.id === editingCampaign.id ? data.data.campaign : c
        ));
        setEditingCampaign(null);
        resetForm();
      } else {
        showNotification({ type: 'error', title: `Error: ${data.error || 'No se pudo actualizar la campaña'}` });
      }
    } catch (error) {
      console.error('Error updating campaign:', error);
      showNotification({ type: 'error', title: 'Error al actualizar la campaña' });
    }
  };

  const handleDeleteCampaign = async (campaign: CampaignWithMetrics) => {
    if (!confirm(`¿Estás seguro de eliminar la campaña "${campaign.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    if (!currentTenant?.id || !currentOrganization?.id) {
      showNotification({ type: 'error', title: 'Error: Información de tenant/organización no disponible' });
      return;
    }

    try {
      const queryParams = new URLSearchParams({
        tenantId: currentTenant.id,
        organizationId: currentOrganization.id,
      });

      const response = await fetch(`/api/campaigns/${campaign.id}?${queryParams}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        showNotification({ type: 'success', title: 'Campaña eliminada exitosamente' });
        // Eliminación local para una respuesta instantánea
        setCampaigns(campaigns.filter(c => c.id !== campaign.id));
      } else {
        showNotification({ type: 'error', title: `Error: ${data.error || 'No se pudo eliminar la campaña'}` });
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
      showNotification({ type: 'error', title: 'Error al eliminar la campaña' });
    }
  };

  const processWithAI = async () => {
    if (!rawProductInfo.trim()) {
      showNotification({ type: 'error', title: 'Por favor ingresa información sobre los productos' });
      return;
    }

    if (!formData.name.trim()) {
      showNotification({ type: 'error', title: 'Por favor ingresa el nombre de la campaña primero' });
      return;
    }

    setAiProcessing(true);
    try {
      const context = await processCampaignWithAI({
        campaignName: formData.name,
        rawProductInfo: rawProductInfo,
        budget: formData.budget,
        industry: undefined, // Podríamos agregarlo al formulario
        targetMarket: undefined // Podríamos agregarlo al formulario
      });

      // Actualizar descripción de campaña con la generada por IA
      setFormData({
        ...formData,
        description: context.campaignDescription
      });

      // Crear productos automáticamente basados en la IA
      for (const product of context.products) {
        try {
          const response = await fetch('/api/products/internal', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              tenantId: currentTenant?.id,
              organizationId: currentOrganization?.id,
              name: product.name,
              description: product.description,
              price: product.price,
              sku: '',
              isActive: true
            }),
          });

          const data = await response.json();
          if (data.success && data.data?.product?.id) {
            setSelectedProducts(prev => [...prev, data.data.product.id]);
          }
        } catch (error) {
          console.error('Error creating AI-generated product:', error);
        }
      }

      // Recargar lista de productos
      await fetchProducts();

      setShowAiHelper(false);
      setRawProductInfo('');
      showNotification({ type: 'success', title: `IA procesó exitosamente ${context.products.length} productos para tu campaña` });

    } catch (error) {
      console.error('Error processing with AI:', error);
      showNotification({ type: 'error', title: 'Error al procesar con IA. Intenta de nuevo.' });
    } finally {
      setAiProcessing(false);
    }
  };

  const handleCreateProduct = async (): Promise<boolean> => {
    if (!currentTenant?.id || !currentOrganization?.id) {
      showNotification({ type: 'error', title: 'Error: Información de tenant/organización no disponible' });
      return false;
    }

    setIsCreatingProduct(true);

    // LOG 1: Datos que se envían para crear el producto
    const productPayload = {
      tenantId: currentTenant.id,
      organizationId: currentOrganization.id,
      name: newProductData.name,
      description: newProductData.description,
      price: newProductData.price,
      sku: newProductData.sku || undefined,
      isActive: true
    };
    console.log('[Crear Producto] Enviando datos a la API:', productPayload);

    try {
      const response = await fetch('/api/products/internal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productPayload),
      });

      // Si la respuesta no es OK (ej. 4xx, 5xx), manejar como error
      if (!response.ok) {
        let errorDetails = `Error del servidor: ${response.status} ${response.statusText}`;
        try {
          // Intentar obtener más detalles del cuerpo del error
          const errorData = await response.json();
          errorDetails = errorData.error || errorData.message || JSON.stringify(errorData);
        } catch {
          // Si el cuerpo no es JSON, usar el texto plano
          errorDetails = await response.text();
        }
        showNotification({ type: 'error', title: 'No se pudo crear el producto', description: errorDetails });
        console.error('[Crear Producto] Falló la creación (Respuesta no OK):', { status: response.status, details: errorDetails });
        return false;
      }

      const data = await response.json();

      // LOG 2: Respuesta completa de la API
      console.log('[Crear Producto] Respuesta recibida de la API:', data);

      if (data.success && data.data?.product) {
        showNotification({ type: 'success', title: 'Producto creado exitosamente' });
        setNewProductData({ name: '', description: '', price: undefined, sku: '' });
        
        const newProduct = data.data.product;

        // LOG 3: ID del producto creado
        console.log(`[Crear Producto] Producto guardado con ID: ${newProduct.id}`);

        // Actualizar estados locales en lugar de recargar todo
        setProducts(prev => [...prev, newProduct]);

        // LOG 4: IDs de productos seleccionados para la campaña (antes y después)
        console.log('[Crear Producto] IDs de productos seleccionados ANTES de agregar:', selectedProducts);
        setSelectedProducts(prev => {
          const newSelectedProducts = [...prev, newProduct.id];
          console.log('[Crear Producto] IDs de productos seleccionados DESPUÉS de agregar:', newSelectedProducts);
          return newSelectedProducts;
        });

        return true;

      } else {
        const errorMsg = data.error || 'No se pudo crear el producto';
        showNotification({ type: 'error', title: `Error: ${errorMsg}` });
        console.error('[Crear Producto] Falló la creación en el backend (success: false):', errorMsg);
        return false;
      }
    } catch (error) {
      console.error('Error de red o de fetch al crear el producto:', error);
      showNotification({ type: 'error', title: 'Error de Conexión', description: 'No se pudo comunicar con el servidor.' });
      return false;
    } finally {
      setIsCreatingProduct(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      budget: undefined,
      startDate: undefined,
      endDate: undefined,
      status: 'draft',
      productIds: []
    });
    setSelectedProducts([]);
    setNewProductData({ name: '', description: '', price: undefined, sku: '' });
  };

  const openEditModal = (campaign: CampaignWithMetrics) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      description: campaign.description || '',
      budget: campaign.budget || undefined,
      startDate: campaign.startDate ? campaign.startDate.split('T')[0] : undefined,
      endDate: campaign.endDate ? campaign.endDate.split('T')[0] : undefined,
      status: campaign.status,
    });
    // Load products for this campaign
    const campaignProductIds = campaign.products?.map(p => p.id) || [];
    setSelectedProducts(campaignProductIds);
  };

  const getStatusBadge = (status: CampaignStatus) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Borrador' },
      active: { color: 'bg-green-100 text-green-800', label: 'Activa' },
      completed: { color: 'bg-blue-100 text-blue-800', label: 'Completada' },
      archived: { color: 'bg-red-100 text-red-800', label: 'Archivada' }
    };

    const config = statusConfig[status];
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (campaign.description && campaign.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Métricas generales
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const totalLeads = campaigns.reduce((sum, c) => sum + (c._count?.leads || 0), 0);
  const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);

  return (
    <div className="container mx-auto p-6">
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Campañas</h1>
          <p className="text-gray-600">Organiza tus leads por campaña de marketing</p>
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.push('/products')}
            className="flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            Productos
          </Button>
          
          <Button
            onClick={() => setIsNewCampaignOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nueva Campaña
          </Button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Campañas</p>
                <p className="text-2xl font-bold">{totalCampaigns}</p>
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Campañas Activas</p>
                <p className="text-2xl font-bold">{activeCampaigns}</p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold">{totalLeads}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Presupuesto Total</p>
                <p className="text-2xl font-bold">${totalBudget.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar campañas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={(value: CampaignStatus | 'all') => setStatusFilter(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="active">Activa</SelectItem>
                <SelectItem value="completed">Completada</SelectItem>
                <SelectItem value="archived">Archivada</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              onClick={fetchCampaigns}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de campañas */}
      <Card>
        <CardHeader>
          <CardTitle>Campañas ({filteredCampaigns.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Cargando campañas...</span>
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sin campañas registradas</h3>
              <p className="text-gray-500 mb-4">Las campañas te ayudan a rastrear el origen de tus leads</p>
              <Button onClick={() => setIsNewCampaignOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primera Campaña
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Nombre</th>
                      <th className="text-left py-3 px-4">Estado</th>
                      <th className="text-left py-3 px-4">Presupuesto</th>
                      <th className="text-left py-3 px-4">Leads</th>
                      <th className="text-left py-3 px-4">Productos</th>
                      <th className="text-left py-3 px-4">Fechas</th>
                      <th className="text-right py-3 px-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCampaigns.map((campaign) => (
                      <tr key={campaign.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{campaign.name}</p>
                            <p className="text-sm text-gray-500">{campaign.description || 'Sin descripción'}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(campaign.status)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium">
                            {campaign.budget ? `$${campaign.budget.toLocaleString()}` : '--'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium">
                            {campaign._count?.leads || 0}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {campaign.products?.length > 0 ? (
                              campaign.products.slice(0, 2).map((product) => (
                                <Badge key={product.id} variant="outline" className="text-xs">
                                  {product.name}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-gray-400 text-sm">Sin productos</span>
                            )}
                            {campaign.products?.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{campaign.products.length - 2} más
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            {campaign.startDate && (
                              <div>Inicio: {new Date(campaign.startDate).toLocaleDateString()}</div>
                            )}
                            {campaign.endDate && (
                              <div>Fin: {new Date(campaign.endDate).toLocaleDateString()}</div>
                            )}
                            {!campaign.startDate && !campaign.endDate && (
                              <span className="text-gray-400">Sin fechas</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openEditModal(campaign)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteCampaign(campaign)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-700">
                    Página {currentPage} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal Nueva Campaña / Editar */}
      <Dialog open={isNewCampaignOpen || !!editingCampaign} onOpenChange={(open) => {
        if (!open) {
          setIsNewCampaignOpen(false);
          setEditingCampaign(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCampaign ? 'Editar Campaña' : 'Nueva Campaña'}
            </DialogTitle>
            <DialogDescription>
              {editingCampaign ? 'Actualiza la información de tu campaña' : 'Completa los datos básicos de tu campaña'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium mb-2 block">
                Nombre de la campaña *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Campaña Black Friday 2024"
                className="w-full"
              />
            </div>
            
            <div>
              <Label htmlFor="description" className="text-sm font-medium mb-2 block">
                Descripción
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe el objetivo y alcance de tu campaña..."
                rows={3}
                className="w-full"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="budget" className="text-sm font-medium mb-2 block">
                  Presupuesto
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="budget"
                    type="number"
                    step="0.01"
                    value={formData.budget || ''}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="0.00"
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="status" className="text-sm font-medium mb-2 block">
                  Estado
                </Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: CampaignStatus) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="active">Activa</SelectItem>
                    <SelectItem value="completed">Completada</SelectItem>
                    <SelectItem value="archived">Archivada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="startDate" className="text-sm font-medium mb-2 block">
                  Fecha inicio
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate || ''}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value || undefined })}
                />
              </div>
              
              <div>
                <Label htmlFor="endDate" className="text-sm font-medium mb-2 block">
                  Fecha fin
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate || ''}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value || undefined })}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">
                  Productos de la campaña
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsProductModalOpen(true)}
                  className="flex items-center gap-1 text-xs"
                >
                  <Plus className="w-3 h-3" />
                  Agregar Producto
                </Button>
              </div>
              
              <div className="border rounded-lg p-3 bg-gray-50 min-h-[100px]">
                {selectedProducts.length > 0 ? (
                  <div className="space-y-2">
                    {products.filter(p => selectedProducts.includes(p.id)).map((product) => (
                      <div key={product.id} className="flex items-center justify-between bg-white p-2 rounded border">
                        <div className="flex-1">
                          <span className="text-sm font-medium">{product.name}</span>
                          {product.price && (
                            <span className="text-xs text-green-600 ml-2">${product.price}</span>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedProducts(selectedProducts.filter(id => id !== product.id))}
                          className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-6">
                    <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No hay productos agregados</p>
                    <p className="text-xs">Haz clic en Agregar Producto para añadir</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              if (editingCampaign) {
                setEditingCampaign(null);
              } else {
                setIsNewCampaignOpen(false);
              }
              resetForm();
            }}>
              Cancelar
            </Button>
            <Button 
              onClick={editingCampaign ? handleUpdateCampaign : handleCreateCampaign}
              disabled={!formData.name.trim()}
            >
              {editingCampaign ? 'Actualizar' : 'Crear'} Campaña
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Modal Crear Producto */}
      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Producto</DialogTitle>
            <DialogDescription>
              Completa la información del producto
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="newProductName" className="text-sm font-medium mb-2 block">
                Nombre *
              </Label>
              <Input
                id="newProductName"
                placeholder="Ej: Plan Básico, Consultoría..."
                value={newProductData.name}
                onChange={(e) => setNewProductData({ ...newProductData, name: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="newProductDescription" className="text-sm font-medium mb-2 block">
                Descripción
              </Label>
              <Textarea
                id="newProductDescription"
                placeholder="Describe qué incluye este producto o servicio..."
                value={newProductData.description}
                onChange={(e) => setNewProductData({ ...newProductData, description: e.target.value })}
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="newProductPrice" className="text-sm font-medium mb-2 block">
                Precio (opcional)
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="newProductPrice"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newProductData.price || ''}
                  onChange={(e) => setNewProductData({ ...newProductData, price: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsProductModalOpen(false);
              setNewProductData({ name: '', description: '', price: undefined, sku: '' });
            }}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                const success = await handleCreateProduct();
                if (success) {
                  setIsProductModalOpen(false);
                }
              }}
              disabled={!newProductData.name.trim() || isCreatingProduct}
            >
              {isCreatingProduct && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Agregar Producto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
// Simulación de procesamiento con IA para campañas y productos
async function processCampaignWithAI({
  campaignName,
  rawProductInfo,
  budget,
  industry,
  targetMarket,
}: {
  campaignName: string;
  rawProductInfo: string;
  budget: number | undefined;
  industry: string | undefined;
  targetMarket: string | undefined;
}) {
  // Simula llamada a API de IA (puedes reemplazar por llamada real)
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Genera una descripción de campaña y productos a partir del texto ingresado
  const campaignDescription = `Campaña "${campaignName}" con presupuesto de ${budget ? `$${budget}` : 'sin definir'}.
Objetivo: ${rawProductInfo.slice(0, 80)}...`;

  // Simula extracción de productos del texto (separa por líneas)
  const products = rawProductInfo
    .split('\n')
    .map((line, idx) => line.trim())
    .filter(Boolean)
    .map((name, idx) => ({
      name,
      description: `Producto generado por IA para la campaña "${campaignName}".`,
      price: budget ? Math.round((budget / 10) * (1 + idx * 0.1)) : undefined,
    }));

  return {
    campaignDescription,
    products,
  };
}
