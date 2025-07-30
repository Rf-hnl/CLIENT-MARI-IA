'use client';

// ✅ THEME SUPPORT: Este componente ha sido actualizado para soportar dark/light theme
// usando clases de Tailwind CSS responsivas al tema (bg-background, text-foreground, etc.)

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhoneCall, Loader2 } from 'lucide-react'; // Added Loader2 for loading state
import { PhoneCallList, PhoneCallTranscription } from '@/components/clients/PhoneCallHistory';
import { ICallLog, IFirebaseTimestamp } from '@/modules/clients/types/clients';
import { useAgentsContext } from '@/modules/agents/context/AgentsContext'; // Import useAgentsContext
import { AgentsLoader } from '@/modules/agents/components/AgentsLoader'; // Import AgentsLoader for on-demand loading
import { useClients } from '@/modules/clients/hooks/useClients'; // Import useClients for tenant/org IDs
import { ITenantElevenLabsAgent } from '@/types/agents'; // Import agent type
import { toast } from 'sonner'; // Assuming sonner is used for toasts

// Temporary interface until we implement full call conversation system
interface IPhoneCallConversation {
  id: string;
  clientId: string;
  callLog: ICallLog;
  conversationSegments?: any[];
  // Add other fields that might come from the backend for display
  callDirection?: 'inbound' | 'outbound';
  startTime?: IFirebaseTimestamp;
  duration?: number;
  status?: string;
  turns?: any[]; // For transcription
}

interface CallHistoryAndTranscriptionViewProps {
  clientId: string;
  filterDays: number | null; // Add filterDays prop
}

// Componente interno que usa los agentes
const CallHistoryContent = ({ clientId, filterDays }: CallHistoryAndTranscriptionViewProps) => {
  const { currentTenant, currentOrganization } = useClients(); // Use useClients for tenant/org IDs
  const { agents, loading: agentsLoading, error: agentsError } = useAgentsContext();
  
  const [allConversations, setAllConversations] = useState<IPhoneCallConversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedCallAction, setSelectedCallAction] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null); // New state for selected agent
  const [isInitiatingCall, setIsInitiatingCall] = useState(false); // Loading state for call initiation

  const tenantId = currentTenant?.id;
  const organizationId = currentOrganization?.id;

  // Fetch call history from the backend
  useEffect(() => {
    const fetchCallHistory = async () => {
      if (!clientId || !tenantId || !organizationId) return;

      try {
        const response = await fetch('/api/client/calls/get', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ clientId, tenantId, organizationId }),
        });
        const result = await response.json();

        if (result.success) {
          // Map ICallLog to IPhoneCallConversation
          const fetchedConversations: IPhoneCallConversation[] = result.data.map((log: ICallLog) => ({
            id: log.id,
            clientId: log.clientId,
            callLog: log,
            callDirection: log.callType.includes('outbound') ? 'outbound' : 'inbound', // Infer direction
            startTime: log.timestamp,
            duration: log.durationMinutes * 60, // Convert minutes to seconds for consistency
            status: log.transcriptionStatus, // Use transcriptionStatus as call status
            turns: log.transcription ? [{ role: 'bot', content: log.transcription, timestamp: log.timestamp }] : [], // Simple representation
          }));
          setAllConversations(fetchedConversations);
        } else {
          console.error('Error fetching call history:', result.error);
          toast.error(`Error al cargar historial de llamadas: ${result.error}`);
          setAllConversations([]);
        }
      } catch (error) {
        console.error('Error fetching call history:', error);
        toast.error('Error de red al cargar historial de llamadas.');
        setAllConversations([]);
      }
    };

    fetchCallHistory();
  }, [clientId, tenantId, organizationId, isInitiatingCall]); // Re-fetch when clientId or a call is initiated

  // Set default selected agent if available
  useEffect(() => {
    if (agentsLoading) return;

    if (agentsError) {
      toast.error(`Error al cargar agentes: ${typeof agentsError === 'object' && agentsError !== null && 'message' in agentsError ? (agentsError as Error).message : agentsError || 'Desconocido'}`);
      return;
    }

    if (agents.length === 0) {
      toast.error('No hay agentes disponibles. Por favor, crea un agente para iniciar llamadas.');
      setSelectedAgentId(null); // Ensure no agent is selected if none are available
      return;
    }

    if (!selectedAgentId) {
      setSelectedAgentId(agents[0].id); // Select the first agent by default
    }
  }, [agents, agentsLoading, agentsError]);

  const conversations = useMemo(() => {
    const now = new Date();
    return allConversations.filter(conv => {
      // Assuming the last turn's timestamp is the conversation's latest timestamp
      // Add check for conv.turns existence and length
      const lastTurnTimestamp = (conv.turns && conv.turns.length > 0) ? conv.turns[conv.turns.length - 1]?.timestamp : undefined;
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
      setSelectedConversationId(conversations[0].id); // Use 'id' instead of 'conversationId'
    } else if (conversations.length === 0 && selectedConversationId) {
      setSelectedConversationId(null); // Clear selection if no conversations match filter
    }
  }, [conversations, selectedConversationId]);

  const selectedConversation = conversations.find(
    (conv) => conv.id === selectedConversationId // Use 'id' instead of 'conversationId'
  );

  const handleInitiateCallAction = async () => {
    if (!selectedCallAction || !selectedAgentId || !clientId || !tenantId || !organizationId) {
      toast.error('Por favor, selecciona una acción y un agente para iniciar la llamada.');
      return;
    }

    setIsInitiatingCall(true);
    try {
      const response = await fetch('/api/client/calls/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          tenantId,
          organizationId,
          agentId: selectedAgentId,
          callType: selectedCallAction,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Llamada iniciada exitosamente. El historial se actualizará pronto.');
        setSelectedCallAction(''); // Clear selection
        // No need to manually add to allConversations, the useEffect will re-fetch
      } else {
        console.error('Error al iniciar llamada:', result.error);
        toast.error(`Error al iniciar llamada: ${result.error}`);
      }
    } catch (error) {
      console.error('Error de red al iniciar llamada:', error);
      toast.error('Error de red al iniciar llamada.');
    } finally {
      setIsInitiatingCall(false);
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
            <div className="flex-1 flex items-center justify-center bg-muted/50 dark:bg-muted/20 rounded-lg text-muted-foreground border border-border">
              Selecciona una llamada para ver la transcripción.
            </div>
          )}
        </div>
      </div>
      {/* Call Action Selector and Agent Selector at the bottom */}
      <div className="p-4 border-t border-border bg-background dark:bg-card flex items-center gap-2 mt-4">
        {/* Agent Selector */}
        <Select onValueChange={setSelectedAgentId} value={selectedAgentId || ''} disabled={agentsLoading || isInitiatingCall}>
          <SelectTrigger className="w-1/3">
            <SelectValue placeholder="Selecciona un agente..." />
          </SelectTrigger>
          <SelectContent>
            {agentsLoading && <SelectItem value="loading" disabled>Cargando agentes...</SelectItem>}
            {agentsError && <SelectItem value="error" disabled>Error al cargar agentes</SelectItem>}
            {agents.length === 0 && !agentsLoading && !agentsError && <SelectItem value="no-agents" disabled>No hay agentes disponibles</SelectItem>}
            {agents.map((agent) => (
              <SelectItem key={agent.id} value={agent.id}>
                {agent.name} ({agent.usage.targetScenarios.join(', ')})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Call Action Selector */}
        <Select onValueChange={setSelectedCallAction} value={selectedCallAction} disabled={isInitiatingCall}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Selecciona una acción de llamada..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="overdue_payment_call">Iniciar llamada por pago atrasado</SelectItem>
            <SelectItem value="follow_up_call">Iniciar llamada de seguimiento</SelectItem>
            <SelectItem value="request_info_call">Iniciar llamada para solicitar información</SelectItem>
            <SelectItem value="general_inquiry_call">Llamada de consulta general</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleInitiateCallAction} disabled={!selectedCallAction || !selectedAgentId || isInitiatingCall}>
          {isInitiatingCall ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Iniciando...
            </>
          ) : (
            <>
              <PhoneCall className="h-4 w-4 mr-2" />
              Iniciar Llamada
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

// Componente principal que envuelve con AgentsLoader
// ✅ NECESITA AGENTES: Este componente permite iniciar llamadas, por lo que necesita
// cargar los agentes completos para mostrar en el selector de agentes
export const CallHistoryAndTranscriptionView = ({ clientId, filterDays }: CallHistoryAndTranscriptionViewProps) => {
  return (
    <AgentsLoader 
      autoLoad={true} 
      showLoading={true}
      onLoaded={() => console.log('🎯 [CALL_HISTORY] Agents loaded for call initiation')}
    >
      <CallHistoryContent clientId={clientId} filterDays={filterDays} />
    </AgentsLoader>
  );
};
