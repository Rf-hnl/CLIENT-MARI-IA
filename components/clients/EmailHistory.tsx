'use client';

// TODO: Implement IEmailRecord type and real data fetching
interface IEmailRecord {
  id: string;
  clientId: string;
  subject: string;
  content: string;
  timestamp: any;
  direction: 'inbound' | 'outbound';
  status?: string;
}
import { safeFormatDate } from '@/utils/dateFormat';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from 'react';
import { ThumbsUp, ThumbsDown, Copy, Share2, RefreshCcw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EmailHistoryProps {
  clientId: string;
  filterDays: number | null; // Add filterDays prop
}

export const EmailHistory = ({ clientId, filterDays }: EmailHistoryProps) => {
  const [selectedAction, setSelectedAction] = useState('');

  const filteredRecords = useMemo(() => {
    // TODO: Replace with real data from Firebase
    const emailRecords: IEmailRecord[] = [];
    const now = new Date();
    return emailRecords.filter(record => {
      const recordDate = new Date(record.timestamp._seconds * 1000);
      const isForClient = record.clientId === clientId;

      if (!isForClient) return false;

      if (filterDays === null) {
        return true; // Show all history
      } else {
        return now.getTime() - recordDate.getTime() < filterDays * 24 * 60 * 60 * 1000;
      }
    });
  }, [clientId, filterDays]); // Depend on filterDays

  const handleExecuteAction = () => {
    if (selectedAction) {
      console.log('Executing email action:', selectedAction);
      setSelectedAction('');
    }
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-[calc(100vh-200px)] bg-gray-50 rounded-lg overflow-hidden">
        {/* Filter buttons are now handled by the parent component */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {filteredRecords.length === 0 && <p className="text-center text-muted-foreground mt-8">No hay registros de Email para este cliente.</p>}
          {filteredRecords.map(record => {
            const isClient = record.direction === 'inbound';
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
                    <p className="text-sm font-bold mb-1">Asunto: {record.subject}</p>
                    <p className="text-sm whitespace-pre-wrap">{record.body}</p>
                    {record.agentResponse && (
                      <div className={`mt-3 p-2 rounded-md ${isClient ? 'bg-gray-100' : 'bg-blue-700'}`}>
                        <p className={`text-xs font-semibold mb-1 ${isClient ? 'text-gray-700' : 'text-blue-100'}`}>
                          Respuesta del Agente/Bot
                        </p>
                        <div className="space-y-1">
                          {record.agentResponse.map((entry, index) => (
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
              <SelectItem value="send_payment_reminder_email">Enviar recordatorio de pago por email</SelectItem>
              <SelectItem value="request_document_email">Solicitar documento por email</SelectItem>
              <SelectItem value="schedule_follow_up_email">Programar seguimiento por email</SelectItem>
              <SelectItem value="escalate_case_email">Escalar caso por email</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExecuteAction} disabled={!selectedAction}>Ejecutar Acción</Button>
        </div>
      </div>
    </TooltipProvider>
  );
};
