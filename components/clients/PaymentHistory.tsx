'use client';

import { IClient } from '@/modules/clients/types/clients';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { safeFormatDate } from '@/utils/dateFormat';

interface PaymentHistoryProps {
  client: IClient;
}

export const PaymentHistory = ({ client }: PaymentHistoryProps) => {
  // Mock payment history for demonstration
  const paymentHistory = [
    {
      date: client.last_payment_date,
      amount: client.last_payment_amount,
      status: 'Completado',
      method: 'Transferencia Bancaria'
    },
    {
      date: { _seconds: client.last_payment_date._seconds - 2592000, _nanoseconds: 0 }, // Approx. 30 days before
      amount: client.installment_amount,
      status: 'Completado',
      method: 'Tarjeta de Crédito'
    },
    {
      date: { _seconds: client.last_payment_date._seconds - 5184000, _nanoseconds: 0 }, // Approx. 60 days before
      amount: client.installment_amount,
      status: 'Completado',
      method: 'Transferencia Bancaria'
    }
  ];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Monto</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Método</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {paymentHistory.map((payment, index) => (
          <TableRow key={index}>
            <TableCell>{safeFormatDate(payment.date)}</TableCell>
            <TableCell>${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
            <TableCell>{payment.status}</TableCell>
            <TableCell>{payment.method}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};