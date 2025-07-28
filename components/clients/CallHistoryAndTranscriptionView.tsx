'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhoneCall } from 'lucide-react';
import { PhoneCallList, PhoneCallTranscription } from '@/components/clients/PhoneCallHistory';
import { IPhoneCallConversation } from '@/modules/clients/mock/phoneCallMockData'; // Keep interface import
import { useEffect, useMemo } from 'react'; // Import useEffect and useMemo
import { IFirebaseTimestamp } from '@/modules/clients/types/clients'; // Import IFirebaseTimestamp

interface CallHistoryAndTranscriptionViewProps {
  clientId: string;
  filterDays: number | null; // Add filterDays prop
}

export const CallHistoryAndTranscriptionView = ({ clientId, filterDays }: CallHistoryAndTranscriptionViewProps) => {
  const [allConversations, setAllConversations] = useState<IPhoneCallConversation[]>([]); // State to hold fetched data
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedCallAction, setSelectedCallAction] = useState('');

  useEffect(() => {
    // Placeholder for fetching real data
    const fetchCallHistory = async () => {
      try {
        // const response = await fetch(`/api/clients/${clientId}/call-history`);
        // const data = await response.json();
        // setAllConversations(data);

        // For now, simulate fetching with mock data (remove this in production)
        const { mockPhoneCallConversations } = await import('@/modules/clients/mock/phoneCallMockData');
        setAllConversations(mockPhoneCallConversations.filter(conv => conv.clientId === clientId));
      } catch (error) {
        console.error('Error fetching call history:', error);
        setAllConversations([]); // Set to empty on error
      }
    };

    fetchCallHistory();
  }, [clientId]); // Re-fetch when clientId changes

  const conversations = useMemo(() => {
    const now = new Date();
    return allConversations.filter(conv => {
      // Assuming the last turn's timestamp is the conversation's latest timestamp
      const lastTurnTimestamp = conv.turns[conv.turns.length - 1]?.timestamp;
      if (!lastTurnTimestamp) return false;

      // Convert string timestamp to Date object
      const conversationDate = new Date(lastTurnTimestamp);

      if (filterDays === null) {
        return true; // Show all history
      } else {
        return now.getTime() - conversationDate.getTime() < filterDays * 24 * 60 * 60 * 1000;
      }
    });
  }, [allConversations, filterDays]);

  useEffect(() => {
    if (conversations.length > 0 && !selectedConversationId) {
      setSelectedConversationId(conversations[0].conversationId);
    } else if (conversations.length === 0 && selectedConversationId) {
      setSelectedConversationId(null); // Clear selection if no conversations match filter
    }
  }, [conversations, selectedConversationId]);

  const selectedConversation = conversations.find(
    (conv) => conv.conversationId === selectedConversationId
  );

  const handleInitiateCallAction = () => {
    if (selectedCallAction) {
      // In a real application, this would invoke the Elebvel MCP for a call
      console.log('Initiating call action:', selectedCallAction);
      setSelectedCallAction(''); // Clear selection after initiation
      // Optionally, navigate to a new "in-progress call" view or add a new conversation to mock data
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex flex-1 gap-4 min-h-0">
        {/* Left Column: Phone Call List */}
        <div className="w-1/3 flex flex-col">
          <PhoneCallList
            clientId={clientId}
            onSelectConversation={setSelectedConversationId}
            selectedConversationId={selectedConversationId}
            conversations={conversations} // Pass filtered conversations
          />
        </div>

        {/* Right Column: Transcription View */}
        <div className="w-2/3 flex flex-col space-y-4">
          {selectedConversationId && selectedConversation ? (
            <PhoneCallTranscription
              conversation={selectedConversation}
              onBackToList={() => setSelectedConversationId(null)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg text-muted-foreground">
              Selecciona una llamada para ver la transcripción.
            </div>
          )}
        </div>
      </div>
      {/* Call Action Selector at the bottom */}
      <div className="p-4 border-t bg-white flex items-center gap-2 mt-4">
        <Select onValueChange={setSelectedCallAction} value={selectedCallAction}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Selecciona una acción de llamada..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="initiate_overdue_call">Iniciar llamada por pago atrasado</SelectItem>
            <SelectItem value="initiate_follow_up_call">Iniciar llamada de seguimiento</SelectItem>
            <SelectItem value="request_info_call">Iniciar llamada para solicitar información</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleInitiateCallAction} disabled={!selectedCallAction}>
          <PhoneCall className="h-4 w-4 mr-2" />
          Iniciar Llamada
        </Button>
      </div>
    </div>
  );
};
