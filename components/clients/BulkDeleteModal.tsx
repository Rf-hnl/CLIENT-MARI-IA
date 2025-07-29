'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, AlertTriangle, Loader2, X, CheckCircle, XCircle } from 'lucide-react';
import { IClient } from '@/modules/clients/types/clients';
import { useClients } from '@/modules/clients/hooks/useClients';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BulkDeleteModalProps {
  selectedClients: IClient[];
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

interface DeletionResult {
  clientId: string;
  clientName: string;
  success: boolean;
  error?: string;
}

export function BulkDeleteModal({ selectedClients, isOpen, onClose, onDeleted }: BulkDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationText, setConfirmationText] = useState('');
  const [deletionProgress, setDeletionProgress] = useState(0);
  const [deletionResults, setDeletionResults] = useState<DeletionResult[]>([]);
  const [currentDeletingClient, setCurrentDeletingClient] = useState<string>('');
  const [autoClosing, setAutoClosing] = useState(false);
  const [deletedCount, setDeletedCount] = useState(0);
  
  const { bulkDeleteClients, refetch } = useClients();
  
  const requiredConfirmationText = `ELIMINAR ${selectedClients.length} CLIENTES`;
  const isConfirmationValid = confirmationText === requiredConfirmationText;
  const totalDebt = selectedClients.reduce((sum, client) => sum + (client.debt || 0), 0);

  const handleBulkDelete = async () => {
    if (!isConfirmationValid || selectedClients.length === 0) return;

    setIsDeleting(true);
    setError(null);
    setDeletionProgress(0);
    setDeletionResults([]);

    try {
      setCurrentDeletingClient('Procesando eliminación masiva...');
      setDeletionProgress(25);
      
      // Usar la función de eliminación masiva del contexto
      const clientIds = selectedClients.map(client => client.id);
      setDeletionProgress(50);
      
      await bulkDeleteClients(clientIds);
      setDeletionProgress(75);
      
      // Simular resultados exitosos (la API real manejará los errores individualmente)
      const results: DeletionResult[] = selectedClients.map(client => ({
        clientId: client.id,
        clientName: client.name,
        success: true
      }));
      
      setDeletionResults(results);
      setDeletionProgress(100);
      setDeletedCount(selectedClients.length);

      // Refrescar la lista de clientes
      await refetch();
      
      // Cerrar automáticamente después de 2 segundos si todo fue exitoso
      setAutoClosing(true);
      setCurrentDeletingClient(`¡${selectedClients.length} cliente${selectedClients.length > 1 ? 's' : ''} eliminado${selectedClients.length > 1 ? 's' : ''} exitosamente!`);
      setTimeout(() => {
        onDeleted?.(); // Llamar el callback que cierra el modal y limpia estado
      }, 2000);

    } catch (err) {
      console.error('Error en eliminación masiva:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error crítico durante la eliminación masiva';
      setError(errorMessage);
      
      // En caso de error, mostrar todos como fallidos
      const results: DeletionResult[] = selectedClients.map(client => ({
        clientId: client.id,
        clientName: client.name,
        success: false,
        error: errorMessage
      }));
      
      setDeletionResults(results);
      setDeletionProgress(100);
    } finally {
      setIsDeleting(false);
      setCurrentDeletingClient('');
    }
  };

  const handleClose = () => {
    onClose();
    setConfirmationText('');
    setError(null);
    setDeletionProgress(0);
    setDeletionResults([]);
    setCurrentDeletingClient('');
    setAutoClosing(false);
    setDeletedCount(0);
  };

  const successCount = deletionResults.filter(r => r.success).length;
  const failureCount = deletionResults.filter(r => !r.success).length;

  return (
    <Dialog open={isOpen} onOpenChange={!isDeleting ? handleClose : undefined}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${
            deletionResults.length > 0 && successCount === deletionResults.length 
              ? 'text-green-600' 
              : 'text-red-600'
          }`}>
            {deletionResults.length > 0 && successCount === deletionResults.length ? (
              <>
                <CheckCircle className="h-5 w-5" />
                {deletedCount > 0 ? `${deletedCount} Cliente${deletedCount > 1 ? 's' : ''} Eliminado${deletedCount > 1 ? 's' : ''}` : 'Eliminación Exitosa'}
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5" />
                Eliminar {selectedClients.length} Cliente{selectedClients.length > 1 ? 's' : ''}
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!isDeleting && deletionResults.length === 0 && (
            <>
              {/* Advertencia principal */}
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Esta acción no se puede deshacer.</strong> Se eliminará permanentemente la información de {selectedClients.length} cliente{selectedClients.length > 1 ? 's' : ''}.
                </AlertDescription>
              </Alert>

              {/* Resumen de clientes */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Total de clientes:</span>
                  <Badge variant="destructive">{selectedClients.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Deuda total:</span>
                  <span className="font-semibold text-red-600">
                    ${totalDebt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Lista de clientes a eliminar */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Clientes que se eliminarán:</Label>
                <ScrollArea className="h-32 w-full border rounded-md p-2">
                  <div className="space-y-2">
                    {selectedClients.map((client, index) => (
                      <div key={client.id} className="flex items-center justify-between text-xs p-2 bg-white rounded border">
                        <div>
                          <span className="font-medium">{client.name}</span>
                          <span className="text-gray-500 ml-2">({client.national_id})</span>
                        </div>
                        <span className="text-red-600 font-medium">
                          ${client.debt?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <Separator />

              {/* Campo de confirmación */}
              <div className="space-y-2">
                <Label htmlFor="bulk-confirmation-text" className="text-sm font-medium">
                  Para confirmar, escribe exactamente:
                </Label>
                <div className="bg-gray-100 p-2 rounded text-sm font-mono text-center border">
                  {requiredConfirmationText}
                </div>
                <Input
                  id="bulk-confirmation-text"
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
            </>
          )}

          {/* Progreso de eliminación */}
          {isDeleting && (
            <div className="space-y-4">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
                <p className="text-sm font-medium">Eliminando clientes...</p>
                {currentDeletingClient && (
                  <p className="text-xs text-gray-600">Eliminando: {currentDeletingClient}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Progreso</span>
                  <span>{Math.round(deletionProgress)}%</span>
                </div>
                <Progress value={deletionProgress} className="w-full" />
                <p className="text-xs text-center text-gray-600">
                  {deletionResults.length} de {selectedClients.length} procesados
                </p>
              </div>
            </div>
          )}

          {/* Mensaje de éxito */}
          {deletionResults.length > 0 && !isDeleting && successCount === deletionResults.length && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>¡Eliminación exitosa!</strong> Se eliminaron {deletedCount} cliente{deletedCount > 1 ? 's' : ''} correctamente de la base de datos.
              </AlertDescription>
            </Alert>
          )}

          {/* Resultados de eliminación */}
          {deletionResults.length > 0 && !isDeleting && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Resultados de eliminación:</h4>
                <div className="flex gap-2">
                  {successCount > 0 && (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      {successCount} exitosas
                    </Badge>
                  )}
                  {failureCount > 0 && (
                    <Badge variant="destructive">
                      {failureCount} fallidas
                    </Badge>
                  )}
                </div>
              </div>
              
              <ScrollArea className="h-40 w-full border rounded-md p-2">
                <div className="space-y-2">
                  {deletionResults.map((result) => (
                    <div key={result.clientId} className={`flex items-center justify-between text-xs p-2 rounded border ${
                      result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        {result.success ? (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-600" />
                        )}
                        <span className="font-medium">{result.clientName}</span>
                      </div>
                      {!result.success && result.error && (
                        <span className="text-red-600 text-xs">{result.error}</span>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Error general */}
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
            onClick={handleClose}
            disabled={isDeleting}
          >
            <X className="h-4 w-4 mr-2" />
            {deletionResults.length > 0 ? 'Cerrar' : 'Cancelar'}
          </Button>
          
          {deletionResults.length === 0 && (
            <Button 
              variant="destructive"
              onClick={handleBulkDelete}
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
                  Eliminar {selectedClients.length} Cliente{selectedClients.length > 1 ? 's' : ''}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}