'use client';

// ✅ THEME SUPPORT: Este componente ha sido actualizado para soportar dark/light theme
// usando clases de Tailwind CSS responsivas al tema (bg-background, text-foreground, etc.)

import { Button } from '@/components/ui/button';
// Removed unused Select components imports
import { safeFormatDate } from '@/utils/dateFormat';
import { ArrowLeft } from 'lucide-react';
// TODO: Implement proper phone call conversation interface
import { ICallLog, IFirebaseTimestamp } from '@/modules/clients/types/clients'; // Import necessary types

interface IPhoneCallConversation {
  id: string;
  clientId: string;
  callLog: ICallLog;
  conversationSegments?: any[];
  // Add other fields that might come from the backend for display
  callDirection?: 'inbound' | 'outbound';
  startTime?: IFirebaseTimestamp | Date;
  duration?: number;
  status?: string;
  turns?: {
    id: string;
    role: 'client' | 'bot' | 'agent';
    content: string;
    timestamp: IFirebaseTimestamp;
    llmResponseTime?: number;
  }[]; // For transcription
}

// Removed unused useMemo import

interface PhoneCallListProps {
  clientId: string;
  onSelectConversation: (conversationId: string) => void;
  selectedConversationId: string | null;
  conversations: IPhoneCallConversation[]; // Add conversations prop
}

export const PhoneCallList = ({ clientId, onSelectConversation, selectedConversationId, conversations }: PhoneCallListProps) => {
  // conversations are now passed from parent, no need to filter here

  return (
    <div className="flex flex-col h-full bg-muted/50 dark:bg-muted/20 rounded-lg overflow-hidden border border-border">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversations.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold mb-4">Historial de Llamadas</h3>
            {conversations.map(conversation => (
              <div
                key={conversation.id}
                className={`bg-background dark:bg-card p-4 rounded-lg shadow-sm border cursor-pointer transition-colors hover:bg-muted/50 dark:hover:bg-muted/10 ${
                  selectedConversationId === conversation.id 
                    ? 'border-primary ring-2 ring-primary/20 dark:ring-primary/30' 
                    : 'border-border hover:border-primary/50'
                } flex justify-between items-center`}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <div>
                  <p className="font-medium">
                    Llamada {conversation.callDirection === 'outbound' ? 'Saliente' : 'Entrante'} - {safeFormatDate(conversation.startTime)}
                  </p>
                  {conversation.duration && (
                    <p className="text-sm text-muted-foreground">Duración: {conversation.duration}s</p>
                  )}
                  <p className="text-sm text-muted-foreground">Estado: {conversation.status}</p>
                </div>
                <Button variant="outline" size="sm">
                  Ver Transcripción
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground mt-8">No hay registros de llamadas para este cliente.</p>
        )}
      </div>
    </div>
  );
};

interface PhoneCallTranscriptionProps {
  conversation: IPhoneCallConversation;
  onBackToList: () => void;
}

export const PhoneCallTranscription = ({ conversation, onBackToList }: PhoneCallTranscriptionProps) => {
  return (
    <div className="flex flex-col h-full min-h-0 bg-muted/50 dark:bg-muted/20 rounded-lg overflow-hidden border border-border">
      <div className="mb-4 flex items-center justify-between p-4 border-b border-border bg-background dark:bg-card">
        <Button variant="ghost" onClick={onBackToList}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a la lista de llamadas
        </Button>
        <div className="text-sm font-semibold text-foreground">
          Conversación ({conversation.callDirection === 'outbound' ? 'Saliente' : 'Entrante'}) - {safeFormatDate(conversation.startTime)}
          {conversation.duration && <span className="ml-2 text-xs text-muted-foreground">({conversation.duration}s)</span>}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {conversation.turns && conversation.turns.length > 0 ? (
          conversation.turns.map(turn => {
            const isAgent = turn.role === 'agent';
            const isBot = turn.role === 'bot';
            const senderName = isAgent ? 'Agente' : (isBot ? 'LLM' : 'Cliente');
            const avatarFallback = isAgent ? 'AG' : (isBot ? 'AI' : 'CL');
            const avatarBg = isAgent ? 'bg-primary/20 text-primary dark:bg-primary/30' : (isBot ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' : 'bg-muted text-muted-foreground');

          return (
            <div
              key={turn.id}
              className={`flex items-start gap-3 ${isAgent ? 'justify-end' : 'justify-start'}`}
            >
              {!isAgent && (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${avatarBg}`}>
                  {avatarFallback}
                </div>
              )}
              <div
                className={`flex flex-col max-w-[70%] p-3 rounded-lg ${
                  isAgent
                    ? 'bg-primary text-primary-foreground rounded-tr-none shadow-sm'
                    : 'bg-background dark:bg-card text-foreground rounded-tl-none shadow-sm border border-border'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs font-semibold">{senderName}</p>
                  <p className={`text-xs ${isAgent ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {safeFormatDate(turn.timestamp)}
                    {turn.llmResponseTime && <span className="ml-1">({turn.llmResponseTime}ms)</span>}
                  </p>
                </div>
                <p className="text-sm">{turn.content}</p>
              </div>
              {isAgent && (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${avatarBg}`}>
                  {avatarFallback}
                </div>
              )}
            </div>
          );
        }) // Closing parenthesis for map
        ) : (
          <div className="text-center text-muted-foreground mt-8">
            No hay transcripción disponible para esta llamada.
          </div>
        )}
      </div>
    </div>
  );
};

// This component will no longer be directly used as PhoneCallHistory, but its logic is split.
// The action selection part will be integrated into the main ContactActionsPage.
export const PhoneCallHistory = ({ clientId }: { clientId: string }) => {
  // This component is now a placeholder or can be removed if not needed elsewhere.
  // The logic has been moved to PhoneCallList and PhoneCallTranscription.
  return (
    <div className="flex flex-col h-full">
      <p className="text-center text-muted-foreground mt-8">
        This component is deprecated. Use PhoneCallList and PhoneCallTranscription directly.
      </p>
    </div>
  );
};
