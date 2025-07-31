'use client';

/**
 * LEADS ADMINISTRATION PAGE
 * 
 * Página principal para la administración de leads (prospectos)
 * Ruta: /clients/leads
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  RefreshCw, 
  Users, 
  TrendingUp, 
  Target, 
  Clock,
  UserCheck,
  UserX,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  UserPlus,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Database
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Imports del sistema de leads
import { LeadsProvider, useLeads } from '@/modules/leads/context/LeadsContext';
import { useLeadsStats, useLeadSearch, useLeadNavigation, useLeadsAlerts } from '@/modules/leads/hooks/useLeads';
import { LeadStatus, LeadSource, LeadPriority, ILead } from '@/modules/leads/types/leads';
import { LeadsPipeline } from '@/components/leads/LeadsPipeline';
import { BulkImportModal } from '@/components/leads/BulkImportModal';

// Componente principal envuelto en el provider
export default function LeadsPage() {
  return (
    <LeadsProvider>
      <LeadsAdministration />
    </LeadsProvider>
  );
}

// Función helper para obtener el color del status
const getStatusColor = (status: LeadStatus): string => {
  const colors: Record<LeadStatus, string> = {
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-yellow-100 text-yellow-800',
    interested: 'bg-green-100 text-green-800',
    qualified: 'bg-purple-100 text-purple-800',
    proposal: 'bg-orange-100 text-orange-800',
    negotiation: 'bg-indigo-100 text-indigo-800',
    won: 'bg-green-100 text-green-800',
    lost: 'bg-red-100 text-red-800',
    nurturing: 'bg-cyan-100 text-cyan-800',
    follow_up: 'bg-amber-100 text-amber-800',
    cold: 'bg-gray-100 text-gray-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

// Función helper para obtener el color de la prioridad
const getPriorityColor = (priority: LeadPriority): string => {
  const colors: Record<LeadPriority, string> = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };
  return colors[priority];
};

// Componente de estadísticas
function LeadsStatsCards() {
  const { realtimeStats } = useLeadsStats();
  const { totalAlerts } = useLeadsAlerts();

  const statsCards = [
    {
      title: 'Total Leads',
      value: realtimeStats.total,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Nuevos',
      value: realtimeStats.newLeads,
      icon: UserPlus,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Calificados',
      value: realtimeStats.qualifiedLeads,
      icon: UserCheck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Convertidos',
      value: realtimeStats.convertedLeads,
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Seguimiento',
      value: realtimeStats.followUpNeeded,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
    {
      title: 'Tasa Conversión',
      value: `${realtimeStats.conversionRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {statsCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Componente de búsqueda y filtros
function LeadsSearchAndFilters() {
  const { 
    searchParams, 
    searchByText, 
    applyQuickFilter, 
    clearFilters, 
    hasActiveFilters 
  } = useLeadSearch();

  const [searchQuery, setSearchQuery] = useState(searchParams.query || '');

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    searchByText(value);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      {/* Búsqueda por texto */}
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por nombre, email, teléfono o empresa..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Filtros rápidos */}
      <div className="flex gap-2">
        <Select onValueChange={(value) => applyQuickFilter('status', value)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Por Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">Nuevos</SelectItem>
            <SelectItem value="contacted">Contactados</SelectItem>
            <SelectItem value="interested">Interesados</SelectItem>
            <SelectItem value="qualified">Calificados</SelectItem>
            <SelectItem value="proposal">Propuesta</SelectItem>
            <SelectItem value="won">Convertidos</SelectItem>
            <SelectItem value="lost">Perdidos</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={(value) => applyQuickFilter('priority', value)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Prioridad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="urgent">Urgente</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Media</SelectItem>
            <SelectItem value="low">Baja</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={(value) => applyQuickFilter('source', value)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Fuente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="website">Web</SelectItem>
            <SelectItem value="social_media">Redes</SelectItem>
            <SelectItem value="referral">Referido</SelectItem>
            <SelectItem value="cold_call">Llamada</SelectItem>
            <SelectItem value="advertisement">Publicidad</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters}>
            <XCircle className="h-4 w-4 mr-2" />
            Limpiar
          </Button>
        )}
      </div>
    </div>
  );
}

// Componente de la tabla de leads
function LeadsTable() {
  const { isLoading } = useLeads();
  const { paginatedLeads } = useLeadNavigation();
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(paginatedLeads.map(lead => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSelectLead = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads(prev => [...prev, leadId]);
    } else {
      setSelectedLeads(prev => prev.filter(id => id !== leadId));
    }
  };

  const formatDate = (timestamp?: { _seconds: number }) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp._seconds * 1000).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Cargando leads...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Lista de Leads</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Lead
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {paginatedLeads.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay leads</h3>
            <p className="text-gray-500">Comienza agregando tu primer lead.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedLeads.length === paginatedLeads.length && paginatedLeads.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Fuente</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedLeads.includes(lead.id)}
                        onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{lead.name}</div>
                        {lead.position && (
                          <div className="text-sm text-gray-500">{lead.position}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Phone className="h-3 w-3 mr-1" />
                          {lead.phone}
                        </div>
                        {lead.email && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Mail className="h-3 w-3 mr-1" />
                            {lead.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.company || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(lead.status)}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(lead.priority)}>
                        {lead.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {lead.source}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDate(lead.created_at)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Phone className="mr-2 h-4 w-4" />
                            Llamar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            WhatsApp
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="mr-2 h-4 w-4" />
                            Email
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Calendar className="mr-2 h-4 w-4" />
                            Agendar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente de paginación
function LeadsPagination() {
  const {
    page,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
    goToPage,
    setPageSize,
    limit
  } = useLeadNavigation();

  if (totalItems === 0) return null;

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="flex items-center space-x-2">
        <p className="text-sm text-muted-foreground">
          Mostrando {startIndex} a {endIndex} de {totalItems} leads
        </p>
        <Select value={limit.toString()} onValueChange={(value) => setPageSize(Number(value))}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={prevPage}
          disabled={!hasPrevPage}
        >
          Anterior
        </Button>
        
        {/* Páginas */}
        <div className="flex items-center space-x-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNumber = Math.max(1, page - 2) + i;
            if (pageNumber > totalPages) return null;
            
            return (
              <Button
                key={pageNumber}
                variant={page === pageNumber ? "default" : "outline"}
                size="sm"
                onClick={() => goToPage(pageNumber)}
                className="w-8"
              >
                {pageNumber}
              </Button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={nextPage}
          disabled={!hasNextPage}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}

// Componente principal de administración
function LeadsAdministration() {
  const { error, refetch } = useLeads();
  const { totalAlerts, hasAlerts } = useLeadsAlerts();
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Administración de Leads</h1>
          <p className="text-muted-foreground">
            Gestiona tus prospectos y convierte leads en clientes
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasAlerts && (
            <Badge variant="destructive" className="mr-2">
              {totalAlerts} alertas
            </Badge>
          )}
          <Button 
            variant="outline" 
            onClick={() => setIsBulkImportOpen(true)}
            className="flex items-center gap-2"
          >
            <Database className="h-4 w-4" />
            Importar CSV
          </Button>
          <Button variant="outline" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-500 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <LeadsStatsCards />

      {/* Search and Filters */}
      <LeadsSearchAndFilters />

      {/* Main Content Tabs */}
      <Tabs defaultValue="pipeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pipeline" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Pipeline
          </TabsTrigger>
          <TabsTrigger value="all">Todos los Leads</TabsTrigger>
          <TabsTrigger value="active">Activos</TabsTrigger>
          <TabsTrigger value="qualified">Calificados</TabsTrigger>
          <TabsTrigger value="followup">Seguimiento</TabsTrigger>
          <TabsTrigger value="converted">Convertidos</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-4">
          <LeadsPipeline />
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <LeadsTable />
          <LeadsPagination />
        </TabsContent>

        <TabsContent value="active">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Vista de leads activos - En desarrollo
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="qualified">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Vista de leads calificados - En desarrollo
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="followup">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Vista de leads para seguimiento - En desarrollo
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="converted">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Vista de leads convertidos - En desarrollo
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>

      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onImportComplete={() => {
          setIsBulkImportOpen(false);
          refetch();
        }}
      />
    </div>
  );
}