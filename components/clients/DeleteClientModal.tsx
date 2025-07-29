'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trash2, AlertTriangle, Loader2, X } from 'lucide-react';
import { IClient } from '@/modules/clients/types/clients';
import { useClients } from '@/modules/clients/hooks/useClients';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DeleteClientModalProps {
  client: IClient;
  trigger?: React.ReactNode;
  onDeleted?: () => void;
}

export function DeleteClientModal({ client, trigger, onDeleted }: DeleteClientModalProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationText, setConfirmationText] = useState('');
  
  const { deleteClient, refetch } = useClients();
  
  const requiredConfirmationText = `ELIMINAR ${client.name.toUpperCase()}`;
  const isConfirmationValid = confirmationText === requiredConfirmationText;

  const handleDelete = async () => {
    if (!isConfirmationValid) return;

    setIsDeleting(true);
    setError(null);

    try {
      await deleteClient(client.id);
      setOpen(false);
      setConfirmationText('');
      await refetch();
      onDeleted?.();
    } catch (err) {
      console.error('Error deleting client:', err);
      setError('Error al eliminar el cliente. Inténtalo de nuevo.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
    setConfirmationText('');
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Confirmar Eliminación
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Advertencia principal */}
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Esta acción no se puede deshacer.</strong> Se eliminará permanentemente toda la información del cliente.
            </AlertDescription>
          </Alert>

          {/* Información del cliente */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Cliente:</span>
              <span className="font-semibold">{client.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Cédula:</span>
              <span className="text-sm">{client.national_id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Deuda:</span>
              <span className="text-sm font-semibold text-red-600">
                ${client.debt?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Estado:</span>
              <Badge variant={client.status === 'current' ? 'default' : 'destructive'}>
                {client.status === 'current' ? 'Al día' : client.status === 'overdue' ? 'Vencido' : 'Pagado'}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Datos que se perderán */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Se eliminarán los siguientes datos:</p>
            <ul className="text-xs text-gray-600 space-y-1 ml-4">
              <li>• Información personal y de contacto</li>
              <li>• Historial de pagos y transacciones</li>
              <li>• Historial de llamadas y comunicaciones</li>
              <li>• Análisis de IA y perfiles de riesgo</li>
              <li>• Notas y comentarios internos</li>
              <li>• Todas las interacciones registradas</li>
            </ul>
          </div>

          <Separator />

          {/* Campo de confirmación */}
          <div className="space-y-2">
            <Label htmlFor="confirmation-text" className="text-sm font-medium">
              Para confirmar, escribe exactamente:
            </Label>
            <div className="bg-gray-100 p-2 rounded text-sm font-mono text-center border">
              {requiredConfirmationText}
            </div>
            <Input
              id="confirmation-text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="Escribe el texto de confirmación..."
              className={`${
                confirmationText && !isConfirmationValid 
                  ? 'border-red-300 focus:border-red-500' 
                  : isConfirmationValid 
                    ? 'border-green-300 focus:border-green-500' 
                    : ''
              }`}
            />
            {confirmationText && !isConfirmationValid && (
              <p className="text-xs text-red-600">El texto no coincide exactamente</p>
            )}
          </div>

          {/* Error de eliminación */}
          {error && (
            <Alert className="border-red-500 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={isDeleting}
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmationValid || isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar Cliente
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}