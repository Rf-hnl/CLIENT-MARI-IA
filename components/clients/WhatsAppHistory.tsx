'use client';

import { IWhatsAppRecord, IFirebaseTimestamp } from '@/modules/clients/types/clients'; // Import IFirebaseTimestamp
import { safeFormatDate } from '@/utils/dateFormat';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useEffect } from 'react'; // Import useMemo, useEffect
import { ThumbsUp, ThumbsDown, Copy, Share2, RefreshCcw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClients } from '@/modules/clients/hooks/useClients'; // Import useClients hook
import MCPConfirmationModal from './MCPConfirmationModal';

interface WhatsAppHistoryProps {
  clientId: string;
  filterDays: number | null; // Add filterDays prop
}

export const WhatsAppHistory = ({ clientId, filterDays }: WhatsAppHistoryProps) => {
  const [selectedAction, setSelectedAction] = useState('');
  const [whatsappRecords, setWhatsappRecords] = useState<IWhatsAppRecord[]>([]); // State to hold fetched data
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const { currentTenant, currentOrganization, clients } = useClients(); // Get real tenant/org data and clients
  
  // Get current client data
  const currentClient = clients.find(c => c.id === clientId);

  useEffect(() => {
    const fetchWhatsAppHistory = async () => {
      // Don't fetch if we don't have tenant/org data yet
      if (!currentTenant || !currentOrganization) {
        console.log('⏳ Waiting for tenant/organization data...');
        return;
      }

      try {
        console.log(`📱 Fetching WhatsApp history for client: ${clientId}`);
        console.log(`🏢 Using tenant: ${currentTenant.id}, org: ${currentOrganization.id}`);
        
        const response = await fetch('/api/client/whatsapp/get', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientId,
            tenantId: currentTenant.id, // Use real tenant ID
            organizationId: currentOrganization.id, // Use real organization ID
            days: filterDays || 7
          })
        });

        const result = await response.json();
        
        if (result.success) {
          setWhatsappRecords(result.data);
          console.log(`📱 Loaded ${result.count} WhatsApp messages from ${result.source}`);
        } else {
          console.error('Error from API:', result.error);
          setWhatsappRecords([]);
        }

      } catch (error) {
        console.error('Error fetching WhatsApp history:', error);
        setWhatsappRecords([]); // Set to empty on error
      }
    };

    fetchWhatsAppHistory();
  }, [clientId, filterDays, currentTenant, currentOrganization]); // Re-fetch when any dependency changes

  const filteredRecords = useMemo(() => {
    const now = new Date();
    return whatsappRecords.filter(record => {
      // Ensure timestamp is correctly handled, assuming it's IFirebaseTimestamp
      const recordDate = new Date((record.timestamp as IFirebaseTimestamp)._seconds * 1000);
      const isForClient = record.clientId === clientId;

      if (!isForClient) return false;

      if (filterDays === null) {
        return true; // Show all history
      } else {
        return now.getTime() - recordDate.getTime() < filterDays * 24 * 60 * 60 * 1000;
      }
    });
  }, [clientId, filterDays, whatsappRecords]); // Depend on whatsappRecords

  const handleExecuteAction = () => {
    if (selectedAction && currentClient) {
      setShowConfirmModal(true);
    }
  };

  const handleConfirmExecution = async () => {
    if (!selectedAction || !currentTenant || !currentOrganization || !currentClient) return;

    setIsExecuting(true);
    try {
      console.log('🎯 Executing action:', selectedAction);
      console.log(`🏢 Using tenant: ${currentTenant.id}, org: ${currentOrganization.id}`);
      
      // Start WhatsApp conversation via MCP
      const response = await fetch('/api/client/whatsapp/start-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          tenantId: currentTenant.id,
          organizationId: currentOrganization.id,
          action: selectedAction
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Action executed successfully:', result.conversationId);
        setShowConfirmModal(false);
        setSelectedAction('');
        // Refresh WhatsApp history after starting conversation
        window.location.reload();
      } else {
        console.error('❌ Error executing action:', result.error);
        alert('Error al ejecutar la acción: ' + result.error);
      }
      
    } catch (error) {
      console.error('❌ Error executing action:', error);
      alert('Error al ejecutar la acción');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCancelExecution = () => {
    setShowConfirmModal(false);
    setSelectedAction('');
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-[calc(100vh-200px)] bg-gray-50 rounded-lg overflow-hidden">
        {/* Filter buttons are now handled by the parent component */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {filteredRecords.length === 0 && <p className="text-center text-muted-foreground mt-8">No hay registros de WhatsApp para este cliente.</p>}
          {filteredRecords.map(record => {
            const isClient = record.messageDirection === 'inbound';
            const senderName = isClient ? 'Cliente' : 'Agente';
            const avatarFallback = isClient ? 'CL' : 'AG';

            return (
              <div key={record.id}>
                <div
                  className={`flex items-start gap-3 ${isClient ? 'justify-start' : 'justify-end'}`}
                >
                  {isClient && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>{avatarFallback}</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`flex flex-col max-w-[70%] p-3 rounded-lg ${
                      isClient
                        ? 'bg-white text-gray-800 rounded-tl-none shadow-sm'
                        : 'bg-blue-600 text-white rounded-tr-none shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-xs font-semibold">{senderName}</p>
                      <p className={`text-xs ${isClient ? 'text-muted-foreground' : 'text-blue-200'}`}>
                        {safeFormatDate(record.timestamp)}
                      </p>
                    </div>
                    <p className="text-sm">{record.messageContent}</p>
                    {record.botTranscription && (
                      <div className={`mt-3 p-2 rounded-md ${isClient ? 'bg-gray-100' : 'bg-blue-700'}`}>
                        <p className={`text-xs font-semibold mb-1 ${isClient ? 'text-gray-700' : 'text-blue-100'}`}>
                          Transcripción del Bot
                        </p>
                        <div className="space-y-1">
                          {record.botTranscription.map((entry, index) => (
                            <div key={index} className={`text-xs ${isClient ? (entry.role === 'bot' ? 'text-blue-600' : 'text-gray-800') : (entry.role === 'bot' ? 'text-blue-200' : 'text-white')}`}>
                              <span className="font-bold">{entry.role}: </span>
                              <span>{entry.content}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {!isClient && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>{avatarFallback}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
                {/* Message actions and "New answer" */}
                <div className={`flex items-center gap-2 mt-1 ${isClient ? 'justify-start ml-11' : 'justify-end mr-11'}`}>
                  {isClient && (
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="w-6 h-6">
                            <ThumbsUp className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Me gusta</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="w-6 h-6">
                            <ThumbsDown className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>No me gusta</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="w-6 h-6">
                            <Copy className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Copiar</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="w-6 h-6">
                            <Share2 className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Compartir</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                  {!isClient && (
                    <Button variant="ghost" className="text-xs text-muted-foreground flex items-center gap-1">
                      <RefreshCcw className="w-3 h-3" />
                      Nueva respuesta
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="p-4 border-t bg-white flex items-center gap-2">
          <Select onValueChange={setSelectedAction} value={selectedAction}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Selecciona una acción o misión..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="call_overdue_payment">Hacer llamado a pago atrasado</SelectItem>
              <SelectItem value="send_payment_reminder">Enviar recordatorio de pago</SelectItem>
              <SelectItem value="request_document">Solicitar documento</SelectItem>
              <SelectItem value="schedule_follow_up">Programar seguimiento</SelectItem>
              <SelectItem value="escalate_case">Escalar caso</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExecuteAction} disabled={!selectedAction}>Ejecutar Acción</Button>
        </div>
      </div>

      <MCPConfirmationModal
        isOpen={showConfirmModal}
        onClose={handleCancelExecution}
        onConfirm={handleConfirmExecution}
        client={currentClient}
        selectedAction={selectedAction}
        isLoading={isExecuting}
      />
    </TooltipProvider>
  );
};
