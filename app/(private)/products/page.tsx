'use client';

/**
 * GESTIÓN DE PRODUCTOS - DISEÑO MINIMALISTA
 * 
 * Página principal para la gestión integral de productos y servicios
 * Ruta: /products
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  Package,
  DollarSign,
  ShoppingCart,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  Loader2,
  Target,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
} from 'lucide-react';

// Imports para auth y API
import { useAuth } from '@/modules/auth';
import { useNotification } from '@/hooks/useNotification';
import { NotificationContainer } from '@/components/ui/notification';

// Types
import { 
  Product, 
  CreateProductData, 
  UpdateProductData,
  Campaign
} from '@/types/campaign';

import { useTenant } from '@/contexts/TenantContext';

// Componente principal
export default function ProductsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentTenant: tenant } = useTenant();
  const { showNotification, notifications, removeNotification } = useNotification();

  // Estados
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<boolean | 'all'>('all');
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Formulario
  const [formData, setFormData] = useState<CreateProductData>({
    name: '',
    description: '',
    price: undefined,
    sku: '',
    isActive: true
  });

  // Cargar productos cuando cambien los filtros

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        tenantId: tenant!.id,
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(activeFilter !== 'all' && { isActive: activeFilter.toString() })
      });

      const response = await fetch(`/api/products/internal?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.data.products);
        setTotalPages(Math.ceil(data.data.total / itemsPerPage));
      } else {
        showNotification({ type: 'error', title: 'Error al cargar productos' });
      }
    } catch (error) {
      console.error('Error loading products:', error);
      showNotification({ type: 'error', title: 'Error al cargar productos' });
    } finally {
      setLoading(false);
    }
  }, [tenant, currentPage, searchQuery, activeFilter, showNotification, itemsPerPage]);

  useEffect(() => {
    if (tenant) {
      loadProducts();
    }
  }, [tenant, currentPage, searchQuery, activeFilter, loadProducts]);

  const handleCreateProduct = async () => {
    try {
      const response = await fetch('/api/products/internal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId: tenant!.id,
          ...formData
        }),
      });

      const data = await response.json();

      if (data.success) {
        showNotification({ type: 'success', title: 'Producto creado exitosamente' });
        setIsNewProductOpen(false);
        resetForm();
        // Update local products state immediately to avoid race condition
        setProducts(prevProducts => [data.data, ...prevProducts]);
      } else {
        showNotification({ type: 'error', title: `Error: ${data.error}` });
      }
    } catch (error) {
      console.error('Error creating product:', error);
      showNotification({ type: 'error', title: 'Error al crear el producto' });
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    try {
      const response = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId: tenant!.id,
          ...formData
        }),
      });

      const data = await response.json();

      if (data.success) {
        showNotification({ type: 'success', title: 'Producto actualizado exitosamente' });
        setEditingProduct(null);
        resetForm();
        loadProducts();
      } else {
        showNotification({ type: 'error', title: `Error: ${data.error}` });
      }
    } catch (error) {
      console.error('Error updating product:', error);
      showNotification({ type: 'error', title: 'Error al actualizar el producto' });
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`¿Estás seguro de eliminar el producto "${product.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const queryParams = new URLSearchParams({
        tenantId: tenant!.id,
      });

      const response = await fetch(`/api/products/${product.id}?${queryParams.toString()}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        showNotification({ type: 'success', title: 'Producto eliminado exitosamente' });
        loadProducts();
      } else {
        showNotification({ type: 'error', title: `Error: ${data.error}` });
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      showNotification({ type: 'error', title: 'Error al eliminar el producto' });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: undefined,
      sku: '',
      isActive: true
    });
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price || undefined,
      sku: product.sku || '',
      isActive: product.isActive
    });
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesActive = activeFilter === 'all' || product.isActive === activeFilter;
    return matchesSearch && matchesActive;
  });

  // Métricas generales
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.isActive).length;
  const averagePrice = products.reduce((sum, p) => sum + (p.price || 0), 0) / (products.length || 1);
  const totalValue = products.reduce((sum, p) => sum + (p.price || 0), 0);

  return (
    <div className="container mx-auto p-6">
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Productos</h1>
          <p className="text-gray-600">Tu catálogo de productos y servicios</p>
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.push('/campaigns')}
            className="flex items-center gap-2"
          >
            <Target className="w-4 h-4" />
            Campañas
          </Button>
          
          <Button
            onClick={() => setIsNewProductOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Productos</p>
                <p className="text-2xl font-bold">{totalProducts}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Productos Activos</p>
                <p className="text-2xl font-bold">{activeProducts}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Precio Promedio</p>
                <p className="text-2xl font-bold">${averagePrice.toFixed(2)}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
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
                  placeholder="Buscar productos por nombre, descripción o SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={activeFilter.toString()} onValueChange={(value) => setActiveFilter(value === 'all' ? 'all' : value === 'true')}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los productos</SelectItem>
                <SelectItem value="true">Activos</SelectItem>
                <SelectItem value="false">Inactivos</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              onClick={loadProducts}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de productos */}
      <Card>
        <CardHeader>
          <CardTitle>Productos ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Cargando productos...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sin productos registrados</h3>
              <p className="text-gray-500 mb-4">Los productos se asocian a campañas para personalizar llamadas</p>
              <Button onClick={() => setIsNewProductOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Producto
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Producto</th>
                      <th className="text-left py-3 px-4">SKU</th>
                      <th className="text-left py-3 px-4">Precio</th>
                      <th className="text-left py-3 px-4">Estado</th>
                      <th className="text-left py-3 px-4">Creado</th>
                      <th className="text-right py-3 px-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            {product.description && (
                              <p className="text-sm text-gray-500">{product.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {product.sku ? (
                            <Badge variant="outline">{product.sku}</Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {product.price ? (
                            <span className="font-medium">${product.price.toLocaleString()}</span>
                          ) : (
                            <span className="text-gray-400">Sin precio</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {product.isActive ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Activo
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3 mr-1" />
                              Inactivo
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-500">
                            {new Date(product.createdAt).toLocaleDateString()}
                          </span>
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
                              <DropdownMenuItem onClick={() => openEditModal(product)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteProduct(product)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
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

      {/* Modal Nuevo Producto / Editar */}
      <Dialog open={isNewProductOpen || !!editingProduct} onOpenChange={(open) => {
        if (!open) {
          setIsNewProductOpen(false);
          setEditingProduct(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Actualiza la información del producto' : 'Define un producto para usar en campañas'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nombre *
              </Label>
              <Input
                id="name"
                className="col-span-3"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre del producto"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descripción
              </Label>
              <Textarea
                id="description"
                className="col-span-3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción del producto"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sku" className="text-right">
                SKU
              </Label>
              <Input
                id="sku"
                className="col-span-3"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="Código del producto (opcional)"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Precio
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                className="col-span-3"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="0.00"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">
                Estado
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">
                  {formData.isActive ? 'Activo' : 'Inactivo'}
                </Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsNewProductOpen(false);
              setEditingProduct(null);
              resetForm();
            }}>
              Cancelar
            </Button>
            <Button onClick={editingProduct ? handleUpdateProduct : handleCreateProduct}>
              {editingProduct ? 'Actualizar' : 'Crear'} Producto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
