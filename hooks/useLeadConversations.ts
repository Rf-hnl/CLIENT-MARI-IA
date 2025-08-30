import { useState, useEffect } from 'react';
import { authFetch } from '@/lib/auth-interceptor';

interface ConversationData {
  conversationId: string;
  agentId: string;
  agentName: string;
  startTime: string | null;
  duration: number;
  messageCount: number;
  status: string;
  callSuccessful: string;
  transcriptSummary: string;
  callSummaryTitle: string;
  direction: string;
  callLogId: string | null;
  elevenLabsBatchId: string | null;
  callType: string;
  localStatus: string;
  createdAt: string | null;
}

interface LeadConversationsResponse {
  success: boolean;
  conversations: ConversationData[];
  total: number;
  leadInfo: {
    id: string;
    name: string;
    phone: string;
  };
}

interface TranscriptData {
  success: boolean;
  conversationId: string;
  callLogInfo: {
    id: string;
    agentId: string;
    agentName: string;
    callType: string;
    status: string;
    createdAt: string;
  };
  leadInfo: {
    id: string;
    name: string;
    phone: string;
  };
  conversationDetails: {
    start_time: string | null;
    duration_seconds: number;
    duration_formatted: string | null;
    message_count: number;
    status: string;
    call_successful: string;
    direction: string;
    transcript_summary: string;
    call_summary_title: string;
  };
  transcript: {
    raw: any[];
    formatted: string;
  };
}

export function useLeadConversations(leadId: string) {
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leadInfo, setLeadInfo] = useState<LeadConversationsResponse['leadInfo'] | null>(null);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await authFetch(`/api/leads/${leadId}/conversations`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data: LeadConversationsResponse = await response.json();
      
      if (data.success) {
        setConversations(data.conversations);
        setLeadInfo(data.leadInfo);
      } else {
        throw new Error('Failed to fetch conversations');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (leadId) {
      fetchConversations();
    }
  }, [leadId]);

  return {
    conversations,
    leadInfo,
    loading,
    error,
    refetch: fetchConversations,
  };
}

export function useConversationTranscript(leadId: string, conversationId: string | null) {
  const [transcript, setTranscript] = useState<TranscriptData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTranscript = async () => {
    if (!conversationId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await authFetch(`/api/leads/${leadId}/conversations/${conversationId}/transcript`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data: TranscriptData = await response.json();
      
      if (data.success) {
        setTranscript(data);
      } else {
        throw new Error('Failed to fetch transcript');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Error fetching transcript:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (leadId && conversationId) {
      fetchTranscript();
    }
  }, [leadId, conversationId]);

  return {
    transcript,
    loading,
    error,
    refetch: fetchTranscript,
  };
}