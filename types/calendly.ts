/**
 * TYPES FOR CALENDLY INTEGRATION
 * 
 * Definiciones de tipos para la integración con Calendly API
 */

export interface CalendlyEvent {
  uri: string;
  name: string;
  status: 'active' | 'canceled';
  start_time: string;
  end_time: string;
  event_type: string;
  location?: {
    type: string;
    location?: string;
    join_url?: string;
  };
  invitees_counter?: {
    total: number;
    active: number;
    limit: number;
  };
  created_at: string;
  updated_at: string;
}

export interface CalendlyInvitee {
  uri: string;
  email: string;
  name: string;
  status: 'active' | 'canceled';
  timezone: string;
  text_reminder_number?: string;
  created_at: string;
  updated_at: string;
  questions_and_answers?: Array<{
    question: string;
    answer: string;
    position: number;
  }>;
  tracking?: {
    utm_campaign?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_content?: string;
    utm_term?: string;
    salesforce_uuid?: string;
  };
  payment?: {
    external_id: string;
    provider: string;
    amount: number;
    currency: string;
    terms: string;
    successful: boolean;
  };
}

export interface CalendlyEventType {
  uri: string;
  name: string;
  active: boolean;
  slug: string;
  scheduling_url: string;
  duration: number;
  kind: 'solo' | 'group';
  pooling_type?: 'round_robin' | 'collective';
  type: 'StandardEventType' | 'AdhocEventType';
  color: string;
  created_at: string;
  updated_at: string;
  internal_note?: string;
  description_plain?: string;
  description_html?: string;
  profile: {
    type: string;
    name: string;
    owner: string;
  };
  secret: boolean;
  booking_method: 'instant' | 'confirmation';
}

export interface CalendlyWebhook {
  uri: string;
  callback_url: string;
  created_at: string;
  updated_at: string;
  retry_started_at?: string;
  state: 'active' | 'disabled';
  scope: 'user' | 'organization';
  organization: string;
  user?: string;
  creator: string;
  events: CalendlyWebhookEvent[];
}

export type CalendlyWebhookEvent = 
  | 'invitee.created'
  | 'invitee.canceled'
  | 'routing_form_submission.created'
  | 'invitee_no_show.created'
  | 'invitee_no_show.deleted';

export interface CalendlyWebhookPayload {
  created_at: string;
  created_by: string;
  event: CalendlyWebhookEvent;
  payload: {
    event?: CalendlyEvent;
    invitee?: CalendlyInvitee;
    questions_and_responses?: Array<{
      question: string;
      response: string;
    }>;
    questions_and_answers?: Array<{
      question: string;
      answer: string;
      position: number;
    }>;
    tracking?: {
      utm_campaign?: string;
      utm_source?: string;
      utm_medium?: string;
      utm_content?: string;
      utm_term?: string;
      salesforce_uuid?: string;
    };
    new_event?: CalendlyEvent;
    new_invitee?: CalendlyInvitee;
    old_event?: CalendlyEvent;
    old_invitee?: CalendlyInvitee;
  };
}

export interface CalendlyConfig {
  accessToken: string;
  organizationUri: string;
  webhookSecret: string;
  baseUrl: string;
  eventTypes: {
    [key: string]: {
      uri: string;
      name: string;
      duration: number;
      schedulingUrl: string;
    };
  };
}

export interface CalendlyIntegrationSettings {
  enabled: boolean;
  autoScheduling: boolean;
  eventTypeMapping: {
    demo: string;
    proposal: string;
    closing: string;
    follow_up: string;
    technical_call: string;
    discovery: string;
  };
  webhookUrl: string;
  defaultDuration: number;
  timezone: string;
  bufferTime: number;
  leadScoreThreshold: number;
  sentimentThreshold: number;
}

export interface CalendlySchedulingRequest {
  leadId: string;
  eventType: keyof CalendlyIntegrationSettings['eventTypeMapping'];
  preferredTimes?: string[];
  timezone: string;
  inviteeEmail: string;
  inviteeName: string;
  customMessage?: string;
  followUpType: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  automated: boolean;
  metadata?: {
    leadScore: number;
    sentiment: number;
    source: string;
    campaignId?: string;
  };
}

export interface CalendlySchedulingResponse {
  success: boolean;
  schedulingUrl?: string;
  eventUri?: string;
  inviteeUri?: string;
  error?: string;
  eventDetails?: {
    startTime: string;
    endTime: string;
    location: string;
    joinUrl?: string;
  };
}