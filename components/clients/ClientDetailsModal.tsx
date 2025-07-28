'use client';

import { useState } from 'react';
import { IClient } from '@/modules/clients/types/clients';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  FileText, 
  CreditCard, 
  User, 
  Building2,
  DollarSign,
  Calendar,
  TrendingUp,
  Shield,
  MapPin,
  Phone,
  Mail,
  Clock,
  Tag,
  AlertTriangle,
  CheckCircle,
  Settings,
  MessageCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { safeFormatDate } from '@/utils/dateFormat';
import { validateClientData, getCompletenessColor } from '@/modules/clients/utils/clientValidation';
import { mockCallLogs, mockWhatsAppRecords, mockClientAIProfiles } from '@/modules/clients/mock/clientsMockData';

interface ClientDetailsModalProps {
  client: IClient;
  trigger?: React.ReactNode;
}

export default function ClientDetailsModal({ client, trigger }: ClientDetailsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const validation = validateClientData(client);

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <FileText className="h-4 w-4 mr-2" />
      Ver Detalles
    </Button>
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'current':
        return <Badge className="bg-green-100 text-green-800">Al día</Badge>;
      case 'overdue':
        return <Badge className="bg-red-50 text-red-600 border-red-200">Vencido</Badge>;
      case 'paid':
        return <Badge className="bg-blue-100 text-blue-800">Pagado</Badge>;
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

  // Mock payment history data
  const paymentHistory = [
    {
      date: '2024-01-15',
      amount: client.installment_amount,
      status: 'completed',
      method: 'Transferencia bancaria',
      reference: 'TXN-001234'
    },
    {
      date: '2024-02-15',
      amount: client.installment_amount,
      status: 'completed',
      method: 'Efectivo',
      reference: 'REC-005678'
    },
    {
      date: '2024-03-15',
      amount: client.installment_amount,
      status: 'pending',
      method: 'Pendiente',
      reference: 'PEND-009876'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="pb-6 border-b">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{client.name.toUpperCase()}</h2>
              <p className="text-sm text-muted-foreground font-normal">
                {client.loan_letter} • {client.national_id}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="personal" className="w-full mt-6">
          <TabsList className="grid w-full grid-cols-6 h-12 bg-muted/30">
            <TabsTrigger value="personal" className="flex items-center gap-2 font-medium">
              <User className="h-4 w-4" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center gap-2 font-medium">
              <DollarSign className="h-4 w-4" />
              Financiero
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2 font-medium">
              <CreditCard className="h-4 w-4" />
              Pagos
            </TabsTrigger>
            <TabsTrigger value="calls" className="flex items-center gap-2 font-medium">
              <Phone className="h-4 w-4" />
              Llamadas
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex items-center gap-2 font-medium">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2 font-medium">
              <TrendingUp className="h-4 w-4" />
              IA & Análisis
            </TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Info */}
              <Card className="shadow-sm border-l-4 border-l-blue-500">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
                    <User className="h-5 w-5" />
                    Información Personal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 py-2 border-b border-muted">
                      <span className="font-medium text-muted-foreground">Nombre</span>
                      <span className="col-span-2 font-semibold uppercase">{client.name}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 py-2 border-b border-muted">
                      <span className="font-medium text-muted-foreground">Cédula</span>
                      <span className="col-span-2 font-mono">{client.national_id}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 py-2 border-b border-muted">
                      <span className="font-medium text-muted-foreground">Dirección</span>
                      <span className="col-span-2 text-sm">
                        {client.address || <span className="text-rose-600 italic">No disponible</span>}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 py-2 border-b border-muted">
                      <span className="font-medium text-muted-foreground">Ciudad</span>
                      <span className="col-span-2">{client.city || 'N/A'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 py-2 border-b border-muted">
                      <span className="font-medium text-muted-foreground">Provincia</span>
                      <span className="col-span-2">{client.province || 'N/A'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 py-2">
                      <span className="font-medium text-muted-foreground">País</span>
                      <span className="col-span-2">{client.country || 'N/A'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card className="shadow-sm border-l-4 border-l-green-500">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                    <Phone className="h-5 w-5" />
                    Información de Contacto
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Teléfono:</span>
                    <span className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      {client.phone}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Email:</span>
                    <span className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      {client.email || <span className="text-rose-600">No disponible</span>}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Método preferido:</span>
                    <span>
                      {client.preferred_contact_method ? (
                        <Badge variant="outline">{client.preferred_contact_method}</Badge>
                      ) : (
                        <span className="text-yellow-600">No especificado</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Mejor horario:</span>
                    <span className="text-sm">
                      {client.best_contact_time || 'No especificado'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Employment Info */}
              <Card className="shadow-sm border-l-4 border-l-purple-500">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2 text-purple-700">
                    <Building2 className="h-5 w-5" />
                    Información Laboral
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Estado:</span>
                    <span>{client.employment_status || <span className="text-yellow-600">No especificado</span>}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Empleador:</span>
                    <span className="text-right text-sm">
                      {client.employer || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Cargo:</span>
                    <span>{client.position || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Ingresos:</span>
                    <span>
                      {client.monthly_income ? 
                        `$${client.monthly_income.toLocaleString('en-US')}` : 
                        <span className="text-yellow-600">No especificado</span>
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Verificado:</span>
                    <span className="flex items-center gap-1">
                      {client.employment_verified ? (
                        <>
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span className="text-green-600">Sí</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-3 w-3 text-yellow-600" />
                          <span className="text-yellow-600">No</span>
                        </>
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Data Completeness */}
              <Card className="shadow-sm border-l-4 border-l-orange-500">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
                    <Settings className="h-5 w-5" />
                    Completitud de Datos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Score:</span>
                    <Badge className={getCompletenessColor(validation.completenessScore)}>
                      {validation.completenessScore}%
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Estado:</span>
                    <span className={validation.riskLevel === 'high' ? 'text-red-600' : 
                                   validation.riskLevel === 'medium' ? 'text-yellow-600' : 'text-green-600'}>
                      {validation.riskLevel === 'high' ? '🚨 Alto riesgo' :
                       validation.riskLevel === 'medium' ? '⚠️ Riesgo medio' : '✅ Bajo riesgo'}
                    </span>
                  </div>
                  {validation.missingRequired.length > 0 && (
                    <div className="bg-rose-50 p-2 rounded border border-rose-200">
                      <p className="text-xs font-medium text-rose-800">Campos obligatorios faltantes:</p>
                      <ul className="text-xs text-rose-700 mt-1">
                        {validation.missingRequired.map(field => (
                          <li key={field}>• {field}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {validation.missingRecommended.length > 0 && (
                    <div className="bg-yellow-50 p-2 rounded">
                      <p className="text-xs font-medium text-yellow-800">Campos recomendados faltantes:</p>
                      <ul className="text-xs text-yellow-700 mt-1">
                        {validation.missingRecommended.slice(0, 3).map(field => (
                          <li key={field}>• {field}</li>
                        ))}
                        {validation.missingRecommended.length > 3 && (
                          <li>• y {validation.missingRecommended.length - 3} más...</li>
                        )}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Loan Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Detalles del Préstamo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Número:</span>
                    <Badge variant="outline">{client.loan_letter}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Estado:</span>
                    {getStatusBadge(client.status)}
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Deuda actual:</span>
                    <span className="font-bold text-lg">
                      ${client.debt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Cuota mensual:</span>
                    <span className="font-medium">
                      ${client.installment_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Cuotas restantes:</span>
                    <span>{client.pending_installments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Días vencido:</span>
                    <span className={client.days_overdue > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                      {client.days_overdue > 0 ? `${client.days_overdue} días` : 'Al día'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Credit Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Información Crediticia
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Score crediticio:</span>
                    <span className="font-bold">{client.credit_score}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Categoría de riesgo:</span>
                    {getRiskBadge(client.risk_category)}
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Límite de crédito:</span>
                    <span>${client.credit_limit.toLocaleString('en-US')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Crédito disponible:</span>
                    <span className="text-green-600 font-medium">
                      ${client.available_credit.toLocaleString('en-US')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Prob. recuperación:</span>
                    <span className={client.recovery_probability >= 70 ? 'text-green-600' : 
                                   client.recovery_probability >= 40 ? 'text-yellow-600' : 'text-red-600'}>
                      {client.recovery_probability}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Important Dates */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Fechas Importantes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Inicio del préstamo:</span>
                    <span>{safeFormatDate(client.loan_start_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Próximo pago:</span>
                    <span className="font-medium text-blue-600">
                      {safeFormatDate(client.payment_date)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Vencimiento:</span>
                    <span>{safeFormatDate(client.due_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Último pago:</span>
                    <span>{safeFormatDate(client.last_payment_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Monto último pago:</span>
                    <span>${client.last_payment_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6 mt-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-4 border-b">
                <CardTitle className="text-xl flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CreditCard className="h-5 w-5 text-green-600" />
                  </div>
                  Historial de Pagos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-medium text-muted-foreground">Estado</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Fecha</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Método</th>
                        <th className="text-right p-4 font-medium text-muted-foreground">Monto</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Referencia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentHistory.map((payment, index) => (
                        <tr key={index} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${
                                payment.status === 'completed' ? 'bg-green-500' : 
                                payment.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                              }`} />
                              <Badge className={
                                payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-50 text-red-600'
                              }>
                                {payment.status === 'completed' ? 'Completado' :
                                 payment.status === 'pending' ? 'Pendiente' : 'Fallido'}
                              </Badge>
                            </div>
                          </td>
                          <td className="p-4 font-medium">
                            {safeFormatDate({ _seconds: new Date(payment.date).getTime() / 1000, _nanoseconds: 0 })}
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {payment.method}
                          </td>
                          <td className="p-4 text-right font-bold text-lg">
                            ${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-4">
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {payment.reference}
                            </code>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Call Logs Tab */}
          <TabsContent value="calls" className="space-y-6 mt-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-4 border-b">
                <CardTitle className="text-xl flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Phone className="h-5 w-5 text-blue-600" />
                  </div>
                  Historial de Llamadas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-medium text-muted-foreground">Tipo</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Fecha & Hora</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Duración</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Agente</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Resultado</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Transcripción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockCallLogs
                        .filter(call => call.clientId === 'carlos_rodriguez')
                        .map((call, index) => (
                        <tr key={index} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="p-4">
                            <Badge variant="outline" className="text-xs">
                              {call.callType === 'collection' ? 'Cobranza' :
                               call.callType === 'follow-up' ? 'Seguimiento' :
                               call.callType === 'support' ? 'Soporte' : call.callType}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">
                                {safeFormatDate(call.timestamp)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(call.timestamp._seconds * 1000).toLocaleTimeString('es-ES', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{call.durationMinutes} min</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="h-3 w-3 text-blue-600" />
                              </div>
                              <span className="text-sm">{call.agentId.replace('agent_', '').charAt(0).toUpperCase() + call.agentId.replace('agent_', '').slice(1)}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge className={
                              call.outcome === 'resolved' ? 'bg-green-100 text-green-800' :
                              call.outcome === 'escalated' ? 'bg-yellow-100 text-yellow-800' :
                              call.outcome === 'no answer' ? 'bg-gray-100 text-gray-800' :
                              'bg-red-50 text-red-600'
                            }>
                              {call.outcome === 'resolved' ? 'Resuelto' :
                               call.outcome === 'escalated' ? 'Escalado' :
                               call.outcome === 'no answer' ? 'Sin respuesta' : call.outcome}
                            </Badge>
                          </td>
                          <td className="p-4">
                            {call.transcription ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                                  <span className="text-xs text-green-700 font-medium">
                                    Disponible ({Math.round((call.transcriptionConfidence || 0) * 100)}%)
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground max-w-xs truncate">
                                  {call.transcription.substring(0, 80)}...
                                </p>
                                {call.notes && (
                                  <p className="text-xs bg-blue-50 p-1 rounded text-blue-800">
                                    <strong>Nota:</strong> {call.notes.substring(0, 50)}...
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                                <span className="text-xs text-muted-foreground">No disponible</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* WhatsApp Tab */}
          <TabsContent value="whatsapp" className="space-y-6 mt-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-4 border-b">
                <CardTitle className="text-xl flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <MessageCircle className="h-5 w-5 text-green-600" />
                  </div>
                  Historial de WhatsApp
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-medium text-muted-foreground">Dirección</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Fecha & Hora</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Tipo</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Agente</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Mensaje</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">Bot/IA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockWhatsAppRecords
                        .filter(record => record.clientId === 'carlos_rodriguez' || record.clientId === 'maria_lopez')
                        .map((record, index) => (
                        <tr key={index} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${
                                record.messageDirection === 'inbound' ? 'bg-blue-500' : 'bg-green-500'
                              }`} />
                              <Badge className={
                                record.messageDirection === 'inbound' ? 
                                'bg-blue-100 text-blue-800' : 
                                'bg-green-100 text-green-800'
                              }>
                                {record.messageDirection === 'inbound' ? 'Entrante' : 'Saliente'}
                              </Badge>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">
                                {safeFormatDate(record.timestamp)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(record.timestamp._seconds * 1000).toLocaleTimeString('es-ES', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className="text-xs">
                              {record.interactionType === 'text' ? 'Texto' :
                               record.interactionType === 'media' ? 'Media' :
                               record.interactionType === 'template' ? 'Plantilla' : record.interactionType}
                            </Badge>
                          </td>
                          <td className="p-4">
                            {record.agentId ? (
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                  <User className="h-3 w-3 text-green-600" />
                                </div>
                                <span className="text-sm">
                                  {record.agentId.replace('agent_', '').charAt(0).toUpperCase() + record.agentId.replace('agent_', '').slice(1)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">Cliente</span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="space-y-2 max-w-sm">
                              <p className="text-sm">
                                {record.messageContent.length > 100 
                                  ? record.messageContent.substring(0, 100) + '...' 
                                  : record.messageContent}
                              </p>
                              {record.attachments && record.attachments.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                  <span className="text-xs text-blue-700">
                                    {record.attachments.length} adjunto(s)
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            {record.isBotConversation ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                                  <span className="text-xs text-purple-700 font-medium">Bot Activo</span>
                                </div>
                                {record.botConfidence && (
                                  <Badge className="bg-purple-100 text-purple-800 text-xs">
                                    {Math.round(record.botConfidence * 100)}%
                                  </Badge>
                                )}
                                {record.botIntent && (
                                  <p className="text-xs text-purple-600">
                                    Intent: {record.botIntent.replace('_', ' ')}
                                  </p>
                                )}
                                {record.requiresHumanHandoff && (
                                  <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                    Escalar
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                                <span className="text-xs text-muted-foreground">Manual</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Analysis Tab */}
          <TabsContent value="ai" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* AI Profile Card */}
              <Card className="shadow-sm border-l-4 border-l-purple-500">
                <CardHeader className="pb-4 border-b">
                  <CardTitle className="text-lg flex items-center gap-2 text-purple-700">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                    Perfil de Inteligencia Artificial
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {mockClientAIProfiles
                    .filter(profile => profile.clientId === 'carlos_rodriguez')
                    .map((profile, index) => (
                    <div key={index} className="space-y-4">
                      {/* Score Dashboard */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium text-purple-800 uppercase tracking-wide">Riesgo</p>
                              <p className="text-2xl font-bold text-purple-900">{profile.riskScore || 0}%</p>
                            </div>
                            <div className={`w-3 h-3 rounded-full ${
                              (profile.riskScore || 0) > 50 ? 'bg-red-500' : 'bg-green-500'
                            }`} />
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium text-blue-800 uppercase tracking-wide">Engagement</p>
                              <p className="text-2xl font-bold text-blue-900">{profile.engagementScore || 0}%</p>
                            </div>
                            <div className={`w-3 h-3 rounded-full ${
                              (profile.engagementScore || 0) > 70 ? 'bg-green-500' : (profile.engagementScore || 0) > 40 ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                          </div>
                        </div>
                      </div>

                      {/* Segment & Status */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <span className="font-medium text-sm">Segmento:</span>
                          <Badge className="bg-blue-100 text-blue-800 font-medium">
                            {profile.profileSegment === 'HighValue' ? 'Alto Valor' :
                             profile.profileSegment === 'Premium' ? 'Premium' :
                             profile.profileSegment === 'AtRisk' ? 'En Riesgo' :
                             profile.profileSegment === 'HighRisk' ? 'Alto Riesgo' : profile.profileSegment}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <span className="font-medium text-sm">Riesgo de Abandono:</span>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              profile.predictedChurnRisk ? 'bg-red-500' : 'bg-green-500'
                            }`} />
                            <span className={`font-medium text-sm ${
                              profile.predictedChurnRisk ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {profile.predictedChurnRisk ? 'Alto Riesgo' : 'Bajo Riesgo'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* AI Recommendation */}
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-200">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-1 bg-indigo-100 rounded">
                            <Settings className="h-4 w-4 text-indigo-600" />
                          </div>
                          <p className="font-medium text-indigo-800">Recomendación de IA</p>
                        </div>
                        <p className="text-sm text-indigo-900 leading-relaxed">
                          {profile.recommendedAction === 'OfferPremiumServices' ? 'Ofrecer servicios premium y productos adicionales' :
                           profile.recommendedAction === 'PersonalizedOutreach' ? 'Realizar contacto personalizado y seguimiento intensivo' :
                           profile.recommendedAction === 'CrossSelling' ? 'Oportunidad para venta cruzada de productos' :
                           profile.recommendedAction === 'LegalAction' ? 'Iniciar proceso de acción legal' :
                           profile.recommendedAction || 'No hay recomendaciones disponibles'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                        <span>Última actualización de IA:</span>
                        <span className="font-medium">{safeFormatDate(profile.lastUpdatedByAI)}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Collection Strategy Card */}
              <Card className="shadow-sm border-l-4 border-l-orange-500">
                <CardHeader className="pb-4 border-b">
                  <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Shield className="h-5 w-5 text-orange-600" />
                    </div>
                    Estrategia de Cobranza
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {/* Response Score */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-green-800 uppercase tracking-wide">Score de Respuesta</p>
                        <p className="text-2xl font-bold text-green-900">{client.response_score || 0}/10</p>
                      </div>
                      <div className="text-right">
                        <div className={`w-16 h-2 rounded-full bg-gray-200 overflow-hidden`}>
                          <div 
                            className="h-full bg-green-500 transition-all duration-300"
                            style={{ width: `${((client.response_score || 0) / 10) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-green-700 mt-1">
                          {(client.response_score || 0) >= 8 ? 'Excelente' :
                           (client.response_score || 0) >= 6 ? 'Bueno' :
                           (client.response_score || 0) >= 4 ? 'Regular' : 'Bajo'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Current Strategy */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Estrategia Actual</label>
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-900 leading-relaxed">
                        {client.collection_strategy || 'No hay estrategia definida'}
                      </p>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Etiquetas</label>
                    <div className="flex flex-wrap gap-2">
                      {client.tags && client.tags.length > 0 ? (
                        client.tags.map((tag, index) => (
                          <Badge key={index} className="bg-indigo-100 text-indigo-800 border-indigo-200 text-xs px-2 py-1">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground italic">Sin etiquetas asignadas</span>
                      )}
                    </div>
                  </div>

                  {/* Notes Section */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Notas Generales</label>
                      <div className="mt-1 bg-gray-50 p-3 rounded-lg border">
                        <p className="text-sm text-gray-800">
                          {client.notes || 'Sin notas generales'}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Notas Internas</label>
                      <div className="mt-1 bg-rose-50 p-3 rounded-lg border border-rose-200">
                        <p className="text-sm text-rose-800">
                          {client.internal_notes || 'Sin notas internas'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}