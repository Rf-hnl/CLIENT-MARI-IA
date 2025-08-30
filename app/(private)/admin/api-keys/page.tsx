'use client';

/**
 * API KEYS MANAGEMENT PAGE
 * 
 * Página para gestionar API Keys, documentación y testing
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Key,
  Plus,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  Play,
  Code,
  BookOpen,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Zap
} from 'lucide-react';
import { useAuth } from '@/modules/auth';
import { toast } from 'sonner';

interface ApiKey {
  id: string;
  name: string;
  permissions: string[];
  isActive: boolean;
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

interface ApiTestResult {
  success: boolean;
  status: number;
  data?: any;
  error?: string;
  responseTime: number;
}

const PERMISSIONS = [
  { id: 'leads:create', label: 'Crear leads', description: 'Permite crear nuevos leads' },
  { id: 'leads:read', label: 'Leer leads', description: 'Permite obtener información de leads' },
  { id: 'leads:update', label: 'Actualizar leads', description: 'Permite modificar leads existentes' },
  { id: 'leads:delete', label: 'Eliminar leads', description: 'Permite eliminar leads' },
  { id: 'leads:import', label: 'Importación masiva', description: 'Permite importar leads en lote' },
  { id: 'analytics:read', label: 'Analíticas', description: 'Acceso a estadísticas y reportes' },
];

export default function ApiKeysPage() {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
  const [testResults, setTestResults] = useState<ApiTestResult | null>(null);

  // Estados para creación de API Key
  const [keyName, setKeyName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['leads:create', 'leads:read']);
  const [expiresInDays, setExpiresInDays] = useState<string>('365');

  // Estados para testing
  const [testApiKey, setTestApiKey] = useState('');
  const [testEndpoint, setTestEndpoint] = useState('/api/leads/admin/create');
  const [testPayload, setTestPayload] = useState(`{
  "tenantId": "${user?.tenantId || 'your-tenant-id'}",
  "organizationId": "${user?.organizationId || 'your-org-id'}",
  "leadData": {
    "name": "Test Lead",
    "phone": "+507-1234-5678",
    "email": "test@example.com",
    "company": "Test Company",
    "source": "api_test",
    "status": "new",
    "priority": "medium"
  }
}`);

  useEffect(() => {
    // Solo cargar API Keys si tenemos la información del usuario
    if (user?.tenantId && user?.organizationId) {
      loadApiKeys();
    }
  }, [user?.tenantId, user?.organizationId]);

  const loadApiKeys = async () => {
    if (!user?.tenantId || !user?.organizationId) {
      console.log('⏳ Esperando información del usuario...');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/api-keys?tenantId=${user.tenantId}&organizationId=${user.organizationId}`);
      
      if (response.ok) {
        const result = await response.json();
        setApiKeys(result.data || []);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        console.error('Error loading API keys:', errorData);
        toast.error(`Error al cargar API Keys: ${errorData.error || 'Error del servidor'}`);
      }
    } catch (error) {
      console.error('Error loading API keys:', error);
      toast.error('Error de conexión al cargar API Keys');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateApiKey = async () => {
    if (!keyName.trim()) {
      toast.error('El nombre de la API Key es requerido');
      return;
    }

    try {
      const response = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: user?.tenantId,
          organizationId: user?.organizationId,
          name: keyName,
          permissions: selectedPermissions,
          expiresInDays: parseInt(expiresInDays) || undefined
        })
      });

      if (response.ok) {
        const result = await response.json();
        setNewApiKey(result.data.apiKey);
        setKeyName('');
        setSelectedPermissions(['leads:create', 'leads:read']);
        toast.success('API Key creada exitosamente');
        loadApiKeys();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al crear API Key');
      }
    } catch (error) {
      console.error('Error creating API key:', error);
      toast.error('Error al crear API Key');
    }
  };

  const handleToggleApiKey = async (keyId: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/admin/api-keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId, isActive: !isActive })
      });

      if (response.ok) {
        toast.success(`API Key ${!isActive ? 'activada' : 'desactivada'}`);
        loadApiKeys();
      } else {
        toast.error('Error al actualizar API Key');
      }
    } catch (error) {
      console.error('Error toggling API key:', error);
      toast.error('Error al actualizar API Key');
    }
  };

  const handleDeleteApiKey = async (keyId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta API Key? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/api-keys?keyId=${keyId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('API Key eliminada');
        loadApiKeys();
      } else {
        toast.error('Error al eliminar API Key');
      }
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast.error('Error al eliminar API Key');
    }
  };

  const handleTestApi = async () => {
    if (!testApiKey.trim()) {
      toast.error('API Key es requerida para hacer pruebas');
      return;
    }

    const startTime = Date.now();

    try {
      const response = await fetch(testEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testApiKey}`,
          'Content-Type': 'application/json'
        },
        body: testPayload
      });

      const responseTime = Date.now() - startTime;
      const data = await response.json();

      setTestResults({
        success: response.ok,
        status: response.status,
        data,
        responseTime
      });

      if (response.ok) {
        toast.success('Prueba de API exitosa');
      } else {
        toast.error('Error en prueba de API');
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      setTestResults({
        success: false,
        status: 0,
        error: error instanceof Error ? error.message : 'Error desconocido',
        responseTime
      });
      toast.error('Error al realizar prueba de API');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="container mx-auto p-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 border-b pb-4">
          <div>
            <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100">
              Claves API
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Administra el acceso externo a tu CRM
            </p>
          </div>
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button variant="outline" className="text-sm">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Clave
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Crear Nueva Clave API</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="keyName">Nombre de la Clave API</Label>
                  <Input
                    id="keyName"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="Ej: Integración CRM externo"
                  />
                </div>
                
                <div>
                  <Label>Permisos</Label>
                  <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                    {PERMISSIONS.map((permission) => (
                      <div key={permission.id} className="flex items-start space-x-2">
                        <Checkbox
                          checked={selectedPermissions.includes(permission.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedPermissions([...selectedPermissions, permission.id]);
                            } else {
                              setSelectedPermissions(selectedPermissions.filter(p => p !== permission.id));
                            }
                          }}
                        />
                        <div>
                          <label className="text-sm font-medium cursor-pointer">
                            {permission.label}
                          </label>
                          <p className="text-xs text-gray-500">{permission.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="expires">Expira en (días)</Label>
                  <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 días</SelectItem>
                      <SelectItem value="90">90 días</SelectItem>
                      <SelectItem value="365">1 año</SelectItem>
                      <SelectItem value="never">Nunca</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleCreateApiKey}
                    className="flex-1"
                  >
                    Crear
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Nueva API Key generada */}
        {newApiKey && (
          <Card className="mb-6 border">
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    Clave API Creada
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Guarda esta clave de forma segura. No podrás verla nuevamente.
                  </p>
                </div>
                <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded border font-mono text-sm">
                  <code className="flex-1 break-all text-xs">{newApiKey}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(newApiKey)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setNewApiKey('')}
                  className="text-xs"
                >
                  Cerrar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs principales */}
        <Tabs defaultValue="manage" className="w-full">
          <TabsList className="grid grid-cols-3 w-full max-w-sm">
            <TabsTrigger value="manage" className="text-xs">Claves</TabsTrigger>
            <TabsTrigger value="test" className="text-xs">Probar</TabsTrigger>
            <TabsTrigger value="docs" className="text-xs">Docs</TabsTrigger>
          </TabsList>

          {/* Tab: Gestionar API Keys */}
          <TabsContent value="manage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">
                  Claves API Activas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!user?.tenantId || !user?.organizationId ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <RefreshCw className="h-4 w-4 animate-spin mb-2" />
                    <p className="text-sm">Cargando información del usuario...</p>
                  </div>
                ) : isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <RefreshCw className="h-4 w-4 animate-spin mb-2" />
                    <p className="text-sm text-gray-600">Cargando Claves API...</p>
                  </div>
                ) : apiKeys.length === 0 ? (
                  <div className="text-center py-16">
                    <Key className="h-8 w-8 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Sin Claves API</h3>
                    <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                      Crea claves API para integrar aplicaciones externas de forma segura.
                    </p>
                    <Button 
                      onClick={() => setShowCreateModal(true)}
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Crear primera Clave API
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {apiKeys.map((apiKey) => (
                      <div key={apiKey.id} className="border rounded p-3">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-sm">{apiKey.name}</h3>
                            <Badge variant={apiKey.isActive ? 'default' : 'secondary'} className="text-xs">
                              {apiKey.isActive ? 'Activa' : 'Inactiva'}
                            </Badge>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleApiKey(apiKey.id, apiKey.isActive)}
                            >
                              {apiKey.isActive ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteApiKey(apiKey.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-600 dark:text-gray-400">
                          <div>
                            <span className="font-medium">Permisos:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {apiKey.permissions.map((permission) => (
                                <Badge key={permission} variant="outline" className="text-xs px-1 py-0">
                                  {permission.split(':')[1]}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">Último uso:</span>
                            <p>{apiKey.lastUsedAt ? formatDate(apiKey.lastUsedAt) : 'Nunca'}</p>
                          </div>
                          <div>
                            <span className="font-medium">Expira:</span>
                            <p>{apiKey.expiresAt ? formatDate(apiKey.expiresAt) : 'Nunca'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Probar API */}
          <TabsContent value="test" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium">
                    Probar API
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="testApiKey">Clave API</Label>
                    <Input
                      id="testApiKey"
                      type="password"
                      value={testApiKey}
                      onChange={(e) => setTestApiKey(e.target.value)}
                      placeholder="sk_..."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="testEndpoint">Endpoint</Label>
                    <Select value={testEndpoint} onValueChange={setTestEndpoint}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="/api/leads/admin/create">Crear Lead Individual</SelectItem>
                        <SelectItem value="/api/leads/import/bulk">Importación Masiva</SelectItem>
                        <SelectItem value="/api/leads/stats">Estadísticas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="testPayload">Datos JSON</Label>
                    <Textarea
                      id="testPayload"
                      value={testPayload}
                      onChange={(e) => setTestPayload(e.target.value)}
                      rows={10}
                      className="font-mono text-sm"
                    />
                  </div>

                  <Button onClick={handleTestApi} className="w-full" variant="outline">
                    Ejecutar Prueba
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Resultado</CardTitle>
                </CardHeader>
                <CardContent>
                  {testResults ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        {testResults.success ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                        <span>
                          Estado: {testResults.status}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {testResults.responseTime}ms
                        </Badge>
                      </div>
                      
                      <div>
                        <Label className="text-sm">Respuesta:</Label>
                        <pre className="mt-1 p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs overflow-auto max-h-64 border">
                          {JSON.stringify(testResults.data || testResults.error, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Play className="h-6 w-6 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Ejecuta una prueba para ver los resultados</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Documentación */}
          <TabsContent value="docs" className="space-y-4">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium">
                    Autenticación
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 text-sm">Header Authorization</h4>
                    <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded font-mono text-xs border">
                      Authorization: Bearer sk_your_api_key_here
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2 text-sm">X-API-Key Header</h4>
                    <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded font-mono text-xs border">
                      X-API-Key: sk_your_api_key_here
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded border">
                    <div className="text-xs text-gray-700 dark:text-gray-300">
                      <strong>Nota:</strong> Las Claves API son sensibles. Nunca las compartas o las incluyas en código del lado cliente.
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Límites de Velocidad</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Peticiones por hora:</span>
                      <Badge variant="outline" className="text-xs">100</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Ventana:</span>
                      <Badge variant="outline" className="text-xs">60 minutes</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Headers de respuesta:</span>
                      <div className="text-right text-xs">
                        <div>X-RateLimit-Remaining</div>
                        <div>X-RateLimit-Reset</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Endpoints Disponibles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* CRUD BÁSICO */}
                    <div>
                      <h4 className="font-semibold text-lg mb-3 text-orange-700 dark:text-orange-400">🔧 CRUD Básico</h4>
                      <div className="space-y-3">
                        <div className="border rounded p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge>POST</Badge>
                            <code className="text-sm">/api/leads/admin/create</code>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Crea un nuevo lead individual. Requiere permisos <code>leads:create</code>.
                          </p>
                        </div>

                        <div className="border rounded p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary">GET</Badge>
                            <code className="text-sm">/api/leads/list</code>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Lista leads con filtros y paginación. Requiere permisos <code>leads:read</code>. Soporta filtros por status, source, limit, offset.
                          </p>
                        </div>

                        <div className="border rounded p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge>POST</Badge>
                            <code className="text-sm">/api/leads/admin/get</code>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Obtiene leads en formato objeto. Requiere permisos <code>leads:read</code>.
                          </p>
                        </div>

                        <div className="border rounded p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-blue-500">PUT</Badge>
                            <code className="text-sm">/api/leads/admin/update</code>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Actualiza un lead específico. Requiere permisos <code>leads:update</code>.
                          </p>
                        </div>

                        <div className="border rounded p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-red-500">DELETE</Badge>
                            <code className="text-sm">/api/leads/admin/delete</code>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Elimina un lead específico. Requiere permisos <code>leads:delete</code>.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ANALYTICS */}
                    <div>
                      <h4 className="font-medium text-sm mb-2">Análisis</h4>
                      <div className="space-y-2">
                        <div className="border rounded p-2">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">GET</Badge>
                            <code className="text-xs">/api/leads/stats</code>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Obtener estadísticas completas de leads. Requiere <code>analytics:read</code>.
                          </p>
                        </div>

                        <div className="border rounded p-2">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">GET</Badge>
                            <code className="text-xs">/api/leads/analytics-api</code>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Análisis avanzado de leads con métricas detalladas y datos de rendimiento.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* IMPORT */}
                    <div>
                      <h4 className="font-medium text-sm mb-2">Importar y Exportar</h4>
                      <div className="space-y-2">
                        <div className="border rounded p-2">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">POST</Badge>
                            <code className="text-xs">/api/leads/import/bulk</code>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Importación masiva de leads desde CSV. Requiere <code>leads:import</code>.
                          </p>
                        </div>

                        <div className="border rounded p-2">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">POST</Badge>
                            <code className="text-xs">/api/leads/import/multi-format</code>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Importación multi-formato (CSV, Excel, JSON) con seguimiento en tiempo real.
                          </p>
                        </div>

                        <div className="border rounded p-2">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">GET</Badge>
                            <code className="text-xs">/api/leads/import/templates</code>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Descargar plantillas CSV con datos de ejemplo.
                          </p>
                        </div>

                        <div className="border rounded p-2">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">GET</Badge>
                            <code className="text-xs">/api/leads/import/progress</code>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Seguir el progreso de importación con Server-Sent Events.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* STATUS INFO */}
                    <div className="border rounded p-3">
                      <h5 className="font-medium text-sm mb-2">
                        Estado de la API
                      </h5>
                      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        <p>• Todos los endpoints requieren autenticación con Clave API</p>
                        <p>• Límites: 50-300 peticiones/hora dependiendo de la operación</p>
                        <p>• Parámetros tenantId y organizationId siempre requeridos</p>
                        <p>• Todas las respuestas en formato JSON</p>
                        <p>• Estado: 11/11 endpoints completamente funcionales</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}