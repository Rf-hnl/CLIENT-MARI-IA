import { ConversationAnalysis } from './conversationAnalysis';

// Based on Prisma schema, but simplified for client-side usage
export interface Lead {
  id: string;
  tenantId: string;
  organizationId: string;
  name: string;
  email?: string | null;
  phone: string;
  company?: string | null;
  status: string;
  priority: string;
  description?: string | null;
  lastContactDate?: string | null;
  nextFollowUpDate?: string | null;
  createdAt: string;
  updatedAt: string;
  campaignId?: string | null;
  // Relations that might be included
  conversationAnalysis?: ConversationAnalysis[];
}
