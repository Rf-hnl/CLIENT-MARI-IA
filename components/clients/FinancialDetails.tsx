'use client';

import { IClient } from '@/modules/clients/types/clients';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { safeFormatDate } from '@/utils/dateFormat';

const InfoRow = ({ label, value, children }: { label: string; value?: string | number; children?: React.ReactNode }) => (
    <div className="flex justify-between items-center py-2 border-b last:border-b-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        {value && <p className="text-sm font-semibold">{value}</p>}
        {children && <div>{children}</div>}
    </div>
);

interface FinancialDetailsProps {
  client: IClient;
}

const getStatusBadge = (status: string) => {
    switch (status) {
      case 'current':
        return <Badge variant="default">Al día</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Vencido</Badge>;
      case 'paid':
        return <Badge variant="secondary">Pagado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

export const FinancialDetails = ({ client }: FinancialDetailsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-lg shadow-none border">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">Resumen del Préstamo</CardTitle>
            </CardHeader>
            <CardContent>
                <InfoRow label="Deuda Total" value={`$${client.debt.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
                <InfoRow label="Estado del Préstamo">{getStatusBadge(client.status)}</InfoRow>
                <InfoRow label="Carta de Préstamo" value={client.loan_letter} />
                <InfoRow label="Fecha de Inicio" value={safeFormatDate(client.loan_start_date)} />
                {client.days_overdue > 0 && (
                    <InfoRow label="Días Vencido" value={client.days_overdue} />
                )}
            </CardContent>
        </Card>
        <Card className="rounded-lg shadow-none border">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">Detalles de Pago</CardTitle>
            </CardHeader>
            <CardContent>
                <InfoRow label="Monto de Cuota" value={`$${client.installment_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
                <InfoRow label="Cuotas Pendientes" value={client.pending_installments} />
                <InfoRow label="Próximo Vencimiento" value={safeFormatDate(client.due_date)} />
                <InfoRow label="Último Pago" value={safeFormatDate(client.last_payment_date)} />
                <InfoRow label="Monto Último Pago" value={`$${client.last_payment_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
            </CardContent>
        </Card>
        <Card className="rounded-lg shadow-none border md:col-span-2">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">Información Crediticia</CardTitle>
            </CardHeader>
            <CardContent>
                <InfoRow label="Puntaje de Crédito" value={client.credit_score} />
                <InfoRow label="Categoría de Riesgo">
                    <Badge variant={client.risk_category === 'bajo' ? 'default' : 'destructive'}>{client.risk_category}</Badge>
                </InfoRow>
                <InfoRow label="Límite de Crédito" value={`$${client.credit_limit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
                <InfoRow label="Crédito Disponible" value={`$${client.available_credit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
                <InfoRow label="Prob. de Recuperación" value={`${client.recovery_probability}%`} />
            </CardContent>
        </Card>
    </div>
  );
};
