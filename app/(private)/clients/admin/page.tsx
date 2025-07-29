'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/modules/auth';
import { useRouter } from 'next/navigation';
import { useClients } from '@/modules/clients/hooks/useClients';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  MoreHorizontal, 
  Search, 
  Filter, 
  Phone,
  Mail,
  MapPin,
  Download,
  Trash2,
  Users,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { safeFormatDate } from '@/utils/dateFormat';
import { 
  validateClientData
} from '@/modules/clients/utils/clientValidation';
import { 
  formatClientStatus, 
  formatRiskCategory, 
  calculateClientMetrics 
} from '@/modules/clients/admin';
import ContactActionsModal from '@/components/clients/ContactActionsModal';
import { NewClientModal } from '@/components/clients/NewClientModal';
import { DeleteClientModal } from '@/components/clients/DeleteClientModal';
import { BulkDeleteModal } from '@/components/clients/BulkDeleteModal';


export default function ClientsAdmin() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { clients, isLoading, error, currentOrganization, currentTenant, refetch } = useClients();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Filtrar clientes con filtros mejorados
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (client.email ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.phone.includes(searchTerm) ||
                         client.national_id.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    const matchesRisk = riskFilter === 'all' || client.risk_category === riskFilter;
    
    return matchesSearch && matchesStatus && matchesRisk;
  });

  // Funciones para selección masiva
  const handleSelectAll = () => {
    if (selectedClients.length === filteredClients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(filteredClients.map(c => c.id));
    }
  };

  const handleSelectClient = (clientId: string) => {
    setSelectedClients(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  // Función para abrir modal de eliminación masiva
  const handleBulkDelete = () => {
    if (selectedClients.length === 0) return;
    setShowBulkDeleteModal(true);
  };

  // Obtener clientes seleccionados completos para el modal
  const selectedClientsData = filteredClients.filter(client => 
    selectedClients.includes(client.id)
  );

  // Función para manejar eliminación exitosa
  const handleBulkDeleteSuccess = () => {
    setSelectedClients([]);
    setShowBulkDeleteModal(false);
  };

  // Calcular estadísticas usando función del módulo admin
  const metrics = calculateClientMetrics(clients);
  const {
    total: totalClients,
    current: activeClients,
    overdue: overdueClients,
    uniqueTags,
    totalDebt,
    avgDebt,
    highRisk
  } = metrics;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'current':
        return <Badge variant="default" className="bg-green-100 text-green-800">Al día</Badge>;
      case 'overdue':
        return <Badge className="bg-red-50 text-red-600 border-red-200">Vencido</Badge>;
      case 'paid':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Pagado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRiskBadge = (riskCategory: string) => {
    switch (riskCategory) {
      case 'bajo':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Bajo</Badge>;
      case 'medio':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Medio</Badge>;
      case 'alto':
        return <Badge className="bg-red-50 text-red-600 border-red-200">Alto</Badge>;
      default:
        return <Badge variant="outline">{riskCategory}</Badge>;
    }
  };

  useEffect(() => {
    if (!currentUser) {
      router.push('/');
      return;
    }

    if (!currentUser.emailVerified) {
      router.push('/verify');
      return;
    }
  }, [currentUser, router]);

  if (!currentUser || !currentUser.emailVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Mostrar loading mientras se cargan los clientes
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando clientes...</p>
          {currentTenant && currentOrganization && (
            <p className="text-sm text-muted-foreground mt-2">
              {currentTenant.companyInfo?.name} - {currentOrganization.name}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Mostrar error si hay algún problema
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-red-800 font-medium mb-2">Error al cargar clientes</h3>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <Button onClick={refetch} variant="outline" size="sm">
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Administración de Clientes</h1>
          <p className="text-muted-foreground">
            Gestiona de manera centralizada a los clientes de la organización
          </p>
          {currentTenant && currentOrganization && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-muted-foreground">
                {currentTenant.companyInfo?.name} - {currentOrganization.name}
              </span>
              <Button 
                onClick={refetch} 
                variant="ghost" 
                size="sm"
                className="h-6 px-2 text-xs"
                disabled={isLoading}
              >
                ↻ Actualizar
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
            ✓ Conectado a Firebase
          </span>
        </div>
      </div>

      {/* Quick Stats - Enhanced */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">{totalClients}</span>
            </div>
            <div>
              <p className="text-sm font-medium">Total Clientes</p>
              <p className="text-xs text-muted-foreground">Registrados</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 font-semibold text-sm">{activeClients}</span>
            </div>
            <div>
              <p className="text-sm font-medium">Al Día</p>
              <p className="text-xs text-muted-foreground">Pagos corrientes</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-red-600 font-semibold text-sm">{overdueClients}</span>
            </div>
            <div>
              <p className="text-sm font-medium">Vencidos</p>
              <p className="text-xs text-muted-foreground">Requieren seguimiento</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 font-semibold text-sm">{highRisk}</span>
            </div>
            <div>
              <p className="text-sm font-medium">Alto Riesgo</p>
              <p className="text-xs text-muted-foreground">Requieren atención</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 font-semibold text-xs">
                ${Math.round(totalDebt / 1000)}K
              </span>
            </div>
            <div>
              <p className="text-sm font-medium">Deuda Total</p>
              <p className="text-xs text-muted-foreground">
                Prom: ${Math.round(avgDebt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <span className="text-amber-600 font-semibold text-sm">{uniqueTags}</span>
            </div>
            <div>
              <p className="text-sm font-medium">Etiquetas</p>
              <p className="text-xs text-muted-foreground">Categorías creadas</p>
            </div>
          </div>
        </div>
      </div>


      {/* Clients Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Clientes</CardTitle>
            <NewClientModal />
          </div>
          
          {/* Search and Filters */}
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email, teléfono o cédula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            {/* Filtro de Estado */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Estado: {statusFilter === 'all' ? 'Todos' : formatClientStatus(statusFilter)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                  Todos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('current')}>
                  Al día
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('overdue')}>
                  Vencidos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('paid')}>
                  Pagados
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Filtro de Riesgo */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Riesgo: {riskFilter === 'all' ? 'Todos' : formatRiskCategory(riskFilter)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setRiskFilter('all')}>
                  Todos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRiskFilter('bajo')}>
                  Bajo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRiskFilter('medio')}>
                  Medio
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRiskFilter('alto')}>
                  Alto
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Bulk Actions */}
          {selectedClients.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    {selectedClients.length} cliente{selectedClients.length > 1 ? 's' : ''} seleccionado{selectedClients.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-1" />
                    Exportar
                  </Button>
                  <Button size="sm" variant="outline">
                    Contacto Masivo
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={handleBulkDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Eliminar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setSelectedClients([])}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedClients.length === filteredClients.length && filteredClients.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Creación/ID</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Deuda</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Riesgo</TableHead>
                <TableHead>Completitud</TableHead>
                <TableHead>Próximo Pago</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => {
                const validation = validateClientData(client);
                return (
                <TableRow key={client.id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedClients.includes(client.id)}
                      onCheckedChange={() => handleSelectClient(client.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <p className="font-medium uppercase">{client.name}</p>
                      <p className="text-xs text-muted-foreground">{client.national_id}</p>
                      <div className="flex gap-1 mt-1">
                        {(client.tags || []).slice(0, 2).map((tag, tagIndex) => (
                          <Badge key={tagIndex} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {(client.tags || []).length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{(client.tags || []).length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex flex-col">
                      <p className="text-xs font-medium">{safeFormatDate(client.created_at)}</p>
                      <p className="text-xs text-muted-foreground font-mono">{client.id.slice(-8)}</p>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1 text-xs">
                        <Mail className="h-3 w-3" />
                        {client.email || <span className="text-rose-600">Sin email</span>}
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Phone className="h-3 w-3" />
                        {client.phone}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {client.address ? `${client.city}, ${client.province}` : <span className="text-yellow-600">Sin dirección</span>}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex flex-col">
                      <p className="font-medium">${client.debt.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                      <p className="text-xs text-muted-foreground">
                        {client.pending_installments} cuotas restantes
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ${client.installment_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}/mes
                      </p>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {getStatusBadge(client.status)}
                      {client.days_overdue > 0 && (
                        <p className="text-xs text-red-600">
                          {client.days_overdue} días vencido
                        </p>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {getRiskBadge(client.risk_category)}
                      <p className="text-xs text-muted-foreground">
                        Score: {client.credit_score}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Recup: {client.recovery_probability}%
                      </p>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center justify-center">
                      {validation.warnings.length === 0 ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                          Completo
                        </Badge>
                      ) : validation.missingRequired.length > 0 ? (
                        <Badge className="bg-red-50 text-red-600 border-red-200 text-xs">
                          Crítico ({validation.warnings.length})
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
                          Incompleto ({validation.warnings.length})
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex flex-col">
                      <p className="text-sm">{safeFormatDate(client.payment_date)}</p>
                      <p className="text-xs text-muted-foreground">
                        ${client.installment_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => router.push(`/clients/${client.id}`)}
                      >
                        Detalles/Editar
                      </Button>
                      <ContactActionsModal client={client} />
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Otras Acciones</DropdownMenuLabel>
                          <DropdownMenuItem>Historial Completo</DropdownMenuItem>
                          <DropdownMenuItem>Exportar Datos</DropdownMenuItem>
                          <DropdownMenuItem>Duplicar Cliente</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-rose-600"
                            onClick={(e) => e.preventDefault()}
                          >
                            <DeleteClientModal 
                              client={client}
                              trigger={
                                <span className="flex items-center w-full cursor-pointer">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar Cliente
                                </span>
                              }
                              onDeleted={() => {
                                // Opcional: mostrar notificación de éxito
                                console.log('Cliente eliminado exitosamente');
                              }}
                            />
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {filteredClients.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No se encontraron clientes con los filtros aplicados
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de eliminación masiva */}
      <BulkDeleteModal
        selectedClients={selectedClientsData}
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        onDeleted={handleBulkDeleteSuccess}
      />
    </div>
  );
}
