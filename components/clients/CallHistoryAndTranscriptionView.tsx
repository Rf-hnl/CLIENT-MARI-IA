'use client';

// Simplified version without agent management
// Agent system now uses ENV-based static configuration

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PhoneCall } from 'lucide-react';
import { PhoneCallList, PhoneCallTranscription } from '@/components/clients/PhoneCallHistory';
import { ICallLog, IFirebaseTimestamp, IClient } from '@/modules/clients/types/clients';
import { toast } from 'sonner';
import { isAgentConfigured } from '@/lib/config/agentConfig';

// Helper function to convert timestamp to Date object
const getTimestampAsDate = (timestamp: IFirebaseTimestamp | Date): Date => {
  if (timestamp instanceof Date) {
    return timestamp;
  }
  // If it's a Firebase timestamp
  if (timestamp && typeof timestamp === 'object' && '_seconds' in timestamp) {
    return new Date(timestamp._seconds * 1000);
  }
  // Fallback to current date if invalid
  return new Date();
};

interface IPhoneCallConversation {
  id: string;
  clientId: string;
  callLog: ICallLog;
  conversationSegments?: any[];
  callDirection?: 'inbound' | 'outbound';
  startTime?: IFirebaseTimestamp | Date;
  duration?: number;
  status?: string;
  turns?: any[];
}

interface CallHistoryAndTranscriptionViewProps {
  clientId: string;
  filterDays: number | null;
}

const CallHistoryContent = ({ clientId, filterDays }: CallHistoryAndTranscriptionViewProps) => {
  const [conversations, setConversations] = useState<IPhoneCallConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<IPhoneCallConversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [agentConfigAvailable] = useState(isAgentConfigured());

  // Load call history
  useEffect(() => {
    // TODO: Implement call history loading
    // This would load from the lead_call_logs table instead of agent-specific data
  }, [clientId, filterDays]);

  const handleInitiateCall = async (clientData: IClient) => {
    if (!agentConfigAvailable) {
      toast.error('Agent configuration not available. Please check environment variables.');
      return;
    }

    if (!clientData.phone) {
      toast.error('Client has no phone number configured');
      return;
    }

    setLoading(true);
    try {
      // Note: This would need to be updated to work with leads instead of direct client calls
      toast.info('Call system now uses environment-based agent configuration');
      // TODO: Implement lead-based calling
    } catch (error) {
      console.error('Call initiation error:', error);
      toast.error('Failed to initiate call');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Agent Configuration Status */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Call History</h3>
        {!agentConfigAvailable && (
          <div className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
            ⚠️ Agent not configured
          </div>
        )}
      </div>

      {/* Call History List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <PhoneCallList 
            conversations={conversations}
            onSelectConversation={setSelectedConversation}
            selectedConversationId={selectedConversation?.id || null}
          />
        </div>

        <div className="space-y-4">
          {selectedConversation ? (
            <PhoneCallTranscription conversation={selectedConversation} />
          ) : (
            <div className="text-center text-gray-500 py-8">
              Select a call to view transcription
            </div>
          )}
        </div>
      </div>

      {/* Simplified Call Button */}
      <div className="mt-6 p-4 border rounded-lg bg-gray-50">
        <p className="text-sm text-gray-600 mb-3">
          📝 <strong>Note:</strong> Call system has been simplified to use environment-based agent configuration.
        </p>
        <Button 
          onClick={() => handleInitiateCall({ id: clientId } as IClient)}
          disabled={loading || !agentConfigAvailable}
          className="w-full"
        >
          <PhoneCall className="w-4 h-4 mr-2" />
          {loading ? 'Initiating...' : 'Initiate Call (ENV Agent)'}
        </Button>
      </div>
    </div>
  );
};

export default function CallHistoryAndTranscriptionView({ clientId, filterDays }: CallHistoryAndTranscriptionViewProps) {
  return <CallHistoryContent clientId={clientId} filterDays={filterDays} />;
}