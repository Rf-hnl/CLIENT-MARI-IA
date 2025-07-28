'use client';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { safeFormatDate } from '@/utils/dateFormat';
import { PhoneCall, Mic, RefreshCcw, ArrowLeft } from 'lucide-react';
import { IPhoneCallConversation, mockPhoneCallConversations } from '@/modules/clients/mock/phoneCallMockData';

import { useMemo } from 'react'; // Import useMemo

interface PhoneCallListProps {
  clientId: string;
  onSelectConversation: (conversationId: string) => void;
  selectedConversationId: string | null;
  conversations: IPhoneCallConversation[]; // Add conversations prop
}

export const PhoneCallList = ({ clientId, onSelectConversation, selectedConversationId, conversations }: PhoneCallListProps) => {
  // conversations are now passed from parent, no need to filter here

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-lg overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversations.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold mb-4">Historial de Llamadas</h3>
            {conversations.map(conversation => (
              <div
                key={conversation.conversationId}
                className={`bg-white p-4 rounded-lg shadow-sm border cursor-pointer ${
                  selectedConversationId === conversation.conversationId ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                } flex justify-between items-center`}
                onClick={() => onSelectConversation(conversation.conversationId)}
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
    <div className="flex flex-col h-full min-h-0 bg-gray-50 rounded-lg overflow-hidden">
      <div className="mb-4 flex items-center justify-between p-4 border-b bg-white">
        <Button variant="ghost" onClick={onBackToList}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a la lista de llamadas
        </Button>
        <div className="text-sm font-semibold text-gray-700">
          Conversación ({conversation.callDirection === 'outbound' ? 'Saliente' : 'Entrante'}) - {safeFormatDate(conversation.startTime)}
          {conversation.duration && <span className="ml-2 text-xs text-muted-foreground">({conversation.duration}s)</span>}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {conversation.turns.map(turn => {
          const isAgent = turn.role === 'agent';
          const isBot = turn.role === 'bot';
          const senderName = isAgent ? 'Agente' : (isBot ? 'LLM' : 'Cliente');
          const avatarFallback = isAgent ? 'AG' : (isBot ? 'AI' : 'CL');
          const avatarBg = isAgent ? 'bg-blue-300 text-blue-700' : (isBot ? 'bg-purple-300 text-purple-700' : 'bg-gray-300 text-gray-700');

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
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-sm'
                    : 'bg-white text-gray-800 rounded-tl-none shadow-sm'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs font-semibold">{senderName}</p>
                  <p className={`text-xs ${isAgent ? 'text-blue-200' : 'text-muted-foreground'}`}>
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
        })}
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
