/**
 * MCP WhatsApp Service
 * 
 * Service for integrating with MCP (Model Context Protocol) WhatsApp API
 * Handles conversation management and message retrieval
 */

import { IClient } from '@/modules/clients/types/clients';

const MCP_BASE_URL = 'https://cobros.maiz.studio';

export interface MCPConversationMessage {
  direction: 'inbound' | 'outbound';
  content: string;
  created_at: string;
  message_type: 'text' | 'media' | 'template';
}

export interface MCPConversationResponse {
  user_id: string;
  days: number;
  message_count: number;
  messages: MCPConversationMessage[];
}

export interface MCPStartConversationResponse {
  success: boolean;
  conversation_id: string;
  client_id: string;
  message: string;
}

/**
 * Formats IClient data to the complete format expected by MCP service
 */
export function formatClientForMCP(client: IClient, selectedAction?: string) {
  // Helper function to format Firebase timestamp to YYYY-MM-DD
  const formatFirebaseDate = (timestamp: any): string => {
    try {
      if (!timestamp) return new Date().toISOString().split('T')[0];
      
      // Handle different timestamp formats
      if (timestamp._seconds) {
        return new Date(timestamp._seconds * 1000).toISOString().split('T')[0];
      } else if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toISOString().split('T')[0];
      }
      
      return new Date().toISOString().split('T')[0];
    } catch (error) {
      console.warn('Error formatting date:', timestamp, error);
      return new Date().toISOString().split('T')[0];
    }
  };

  // Helper function to safely get numeric values
  const safeNumber = (value: any, fallback: number = 0): number => {
    const num = Number(value);
    return isNaN(num) ? fallback : num;
  };

  // Helper function to safely get string values
  const safeString = (value: any, fallback: string = ""): string => {
    return value && typeof value === 'string' ? value : fallback;
  };

  // Ensure required fields are present and valid
  const formattedData = {
    // REQUIRED FIELDS - Must be present
    name: safeString(client.name, "Unknown Client"),
    phone: safeString(client.phone, ""),
    national_id: safeString(client.national_id, ""),
    debt: safeNumber(client.debt, 0),
    status: safeString(client.status, "unknown"),
    loan_letter: safeString(client.loan_letter, ""),
    
    // CONTACT FIELDS
    email: client.email || "",
    address: client.address || "",
    city: client.city || "",
    province: client.province || "",
    postal_code: client.postal_code || "",
    country: client.country || "Colombia",
    
    // FINANCIAL FIELDS - Ensure they're numbers
    installment_amount: safeNumber(client.installment_amount, 0),
    pending_installments: safeNumber(client.pending_installments, 0),
    days_overdue: safeNumber(client.days_overdue, 0),
    last_payment_amount: safeNumber(client.last_payment_amount, 0),
    credit_score: safeNumber(client.credit_score, 600),
    credit_limit: safeNumber(client.credit_limit, 0),
    available_credit: safeNumber(client.available_credit, 0),
    recovery_probability: Math.round(safeNumber(client.recovery_probability, 50)),
    
    // DATE FIELDS - Format properly
    payment_date: formatFirebaseDate(client.payment_date),
    due_date: formatFirebaseDate(client.due_date),
    loan_start_date: formatFirebaseDate(client.loan_start_date),
    last_payment_date: formatFirebaseDate(client.last_payment_date),
    
    // EMPLOYMENT FIELDS
    employment_status: client.employment_status || "",
    employer: client.employer || "",
    position: client.position || "",
    monthly_income: safeNumber(client.monthly_income, 0),
    employment_verified: Boolean(client.employment_verified),
    
    // OTHER FIELDS
    risk_category: client.risk_category || "unknown",
    preferred_contact_method: client.preferred_contact_method || "whatsapp",
    best_contact_time: client.best_contact_time || "09:00-17:00",
    response_score: client.response_score ? Math.round(safeNumber(client.response_score, 0)) : 0,
    collection_strategy: client.collection_strategy || "",
    notes: client.notes || "",
    internal_notes: client.internal_notes || "",
    tags: Array.isArray(client.tags) ? client.tags : [],
    
    // Add selected action if provided
    ...(selectedAction && { selected_action: selectedAction })
  };

  // Log any potential issues
  console.log('🔍 Formatter - Missing required fields check:');
  const requiredFields = ['name', 'phone', 'national_id', 'debt', 'status', 'loan_letter'];
  requiredFields.forEach(field => {
    if (!formattedData[field as keyof typeof formattedData]) {
      console.warn(`⚠️ Required field '${field}' is empty or missing`);
    }
  });

  return formattedData;
}

/**
 * Generate curl command preview for debugging
 */
export function generateCurlPreview(client: IClient, selectedAction?: string): string {
  const clientData = formatClientForMCP(client, selectedAction);
  const jsonData = JSON.stringify(clientData, null, 2);
  
  return `curl -X POST "${MCP_BASE_URL}/start-conversation/${client.id}" \\
  -H "Content-Type: application/json" \\
  -d '${jsonData}'`;
}

/**
 * Start a new WhatsApp conversation with a client
 */
export async function startWhatsAppConversation(client: IClient, selectedAction?: string): Promise<MCPStartConversationResponse> {
  const clientData = formatClientForMCP(client, selectedAction);
  
  // EXTENSIVE DEBUG LOGGING
  console.log('🔍 DEBUG - CLIENT DATA BEING SENT TO MCP:');
  console.log('🔍 URL:', `${MCP_BASE_URL}/start-conversation/${client.id}`);
  console.log('🔍 Raw client object keys:', Object.keys(client));
  console.log('🔍 Raw client data:', JSON.stringify(client, null, 2));
  console.log('🔍 Formatted clientData keys:', Object.keys(clientData));
  console.log('🔍 Formatted clientData:', JSON.stringify(clientData, null, 2));
  console.log('🔍 Selected action:', selectedAction);
  
  try {
    const response = await fetch(`${MCP_BASE_URL}/start-conversation/${client.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(clientData)
    });

    console.log('🔍 MCP Response status:', response.status);
    console.log('🔍 MCP Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      // Try to get the error response body
      let errorBody = 'No error details available';
      try {
        errorBody = await response.text();
        console.log('🔍 MCP Error response body:', errorBody);
      } catch (e) {
        console.log('🔍 Could not read error response body');
      }
      
      throw new Error(`MCP API error: ${response.status} ${response.statusText}. Details: ${errorBody}`);
    }

    const result = await response.json();
    console.log('🔍 MCP Success response:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('❌ Error starting WhatsApp conversation:', error);
    throw new Error(`Failed to start conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get WhatsApp conversations for a client
 */
export async function getWhatsAppConversations(
  clientId: string, 
  days: number = 7
): Promise<MCPConversationResponse> {
  try {
    const url = `${MCP_BASE_URL}/users/${clientId}/conversations?days=${days}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MCP API error: ${response.status} ${response.statusText}. Body: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching WhatsApp conversations:', error);
    throw new Error(`Failed to fetch conversations: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Transform MCP conversation data to IWhatsAppRecord format
 */
export function transformMCPToWhatsAppRecord(mcpMessage: MCPConversationMessage, clientId: string) {
  // Generate a unique ID based on timestamp and content
  const messageId = `${new Date(mcpMessage.created_at).getTime()}_${mcpMessage.content.substring(0, 10)}`;
  
  return {
    id: messageId,
    clientId: clientId,
    timestamp: {
      _seconds: Math.floor(new Date(mcpMessage.created_at).getTime() / 1000),
      _nanoseconds: 0
    },
    messageDirection: mcpMessage.direction,
    agentId: mcpMessage.direction === 'outbound' ? 'mcp-agent' : undefined,
    messageContent: mcpMessage.content,
    attachments: [],
    interactionType: mcpMessage.message_type,
    isBotConversation: true,
    botSessionId: messageId,
    requiresHumanHandoff: false
  };
}