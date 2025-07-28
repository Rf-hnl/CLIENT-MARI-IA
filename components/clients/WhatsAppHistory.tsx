'use client';

import { IWhatsAppRecord } from '@/modules/clients/types/clients';
import { mockWhatsAppRecords } from '@/modules/clients/mock/clientsMockData';
import { safeFormatDate } from '@/utils/dateFormat';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Copy, Share2, RefreshCcw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface WhatsAppHistoryProps {
  clientId: string;
}

export const WhatsAppHistory = ({ clientId }: WhatsAppHistoryProps) => {
  const [selectedAction, setSelectedAction] = useState('');
  const records = mockWhatsAppRecords.filter(record => record.clientId === clientId);

  const handleExecuteAction = () => {
    if (selectedAction) {
      // In a real application, you would send this action to the agentmcp
      console.log('Executing action:', selectedAction);
      setSelectedAction(''); // Clear selection after execution
    }
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-[calc(100vh-200px)] bg-gray-50 rounded-lg overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {records.map(record => {
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
          {records.length === 0 && <p className="text-center text-muted-foreground mt-8">No hay registros de WhatsApp para este cliente.</p>}
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
    </TooltipProvider>
  );
};
