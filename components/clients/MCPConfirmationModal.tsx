'use client';

import { IClient } from '@/modules/clients/types/clients';
import { generateCurlPreview } from '@/lib/services/mcpWhatsApp';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface MCPConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  client: IClient | null;
  selectedAction: string;
  isLoading?: boolean;
}

export default function MCPConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  client,
  selectedAction,
  isLoading = false
}: MCPConfirmationModalProps) {
  const [copied, setCopied] = useState(false);

  if (!client) return null;

  const curlCommand = generateCurlPreview(client, selectedAction);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(curlCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const actionLabels: Record<string, string> = {
    call_overdue_payment: 'Hacer llamado a pago atrasado',
    send_payment_reminder: 'Enviar recordatorio de pago',
    request_document: 'Solicitar documento',
    schedule_follow_up: 'Programar seguimiento',
    escalate_case: 'Escalar caso'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🚀 Confirmar Acción MCP WhatsApp
          </DialogTitle>
          <DialogDescription>
            Estás a punto de ejecutar: <strong>{actionLabels[selectedAction] || selectedAction}</strong> para el cliente <strong>{client.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold">Cliente a contactar:</h4>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Nombre:</strong> {client.name}</div>
              <div><strong>Teléfono:</strong> {client.phone}</div>
              <div><strong>Cédula:</strong> {client.national_id}</div>
              <div><strong>Préstamo:</strong> {client.loan_letter}</div>
              <div><strong>Deuda:</strong> ${client.debt.toLocaleString()}</div>
              <div><strong>Estado:</strong> {client.status}</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Comando cURL que se ejecutará:</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
            
            <ScrollArea className="h-[300px] w-full border rounded-md">
              <pre className="p-4 text-xs font-mono whitespace-pre-wrap bg-gray-50">
                {curlCommand}
              </pre>
            </ScrollArea>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              ⚠️ <strong>Esta acción enviará datos reales</strong> al servicio MCP y iniciará una conversación de WhatsApp con el cliente.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={onConfirm} 
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Ejecutando...
              </>
            ) : (
              '✅ Confirmar y Ejecutar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}