/**
 * CALENDAR SYSTEM TYPES
 * 
 * Tipos para el sistema de calendario integrado
 * Incluye programación automática basada en sentiment analysis
 */

export type CalendarEventStatus = 
  | 'scheduled'    // Programado
  | 'confirmed'    // Confirmado
  | 'completed'    // Completado
  | 'canceled'     // Cancelado
  | 'rescheduled'  // Reprogramado
  | 'no_show'      // No se presentó
  | 'pending'      // Pendiente de confirmación

export type CalendarEventPriority = 'low' | 'medium' | 'high' | 'urgent'

export type FollowUpType = 
  | 'demo'          // Demostración del producto
  | 'proposal'      // Presentación de propuesta
  | 'closing'       // Reunión de cierre
  | 'follow_up'     // Seguimiento general
  | 'nurturing'     // Llamada de nurturing
  | 'technical_call' // Llamada técnica
  | 'discovery'     // Llamada de descubrimiento
  | 'onboarding'    // Onboarding del cliente

export type MeetingPlatform = 
  | 'internal'  // Sistema interno
  | 'zoom'      // Zoom
  | 'teams'     // Microsoft Teams
  | 'meet'      // Google Meet
  | 'phone'     // Llamada telefónica
  | 'in_person' // Presencial

export interface CalendarEvent {
  id: string
  leadId: string
  userId: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  allDay: boolean
  location?: string
  eventType: string
  reminderMinutes?: number
  status: CalendarEventStatus
  
  // Enhanced fields for intelligent scheduling
  priority: CalendarEventPriority
  automated: boolean
  sentimentTrigger?: number // -1.0 to 1.0
  followUpType?: FollowUpType
  meetingLink?: string
  meetingPlatform: MeetingPlatform
  attendeeEmails: string[]
  
  // Automation & tracking
  autoReminderSent: boolean
  rescheduledCount: number
  canceledAt?: Date
  completedAt?: Date
  outcomeNotes?: string
  nextAction?: string
  
  metadata: any
  createdAt: Date
  updatedAt: Date
}

// Data para crear nuevo evento
export interface CreateCalendarEventData {
  leadId: string
  userId: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  allDay?: boolean
  location?: string
  eventType?: string
  reminderMinutes?: number
  priority?: CalendarEventPriority
  automated?: boolean
  sentimentTrigger?: number
  followUpType?: FollowUpType
  meetingPlatform?: MeetingPlatform
  attendeeEmails?: string[]
  metadata?: any
}

// Configuración de programación automática
export interface AutoSchedulingConfig {
  enabled: boolean
  sentimentThreshold: number // Score mínimo para activar programación
  businessHours: {
    start: string // "09:00"
    end: string   // "17:00"
    timezone: string
    workingDays: number[] // [1,2,3,4,5] = Mon-Fri
  }
  meetingDurations: {
    [key in FollowUpType]: number // minutes
  }
  defaultPlatform: MeetingPlatform
  autoConfirm: boolean
}

// Configuración por tipo de seguimiento
export interface FollowUpConfig {
  type: FollowUpType
  title: string
  description: string
  duration: number // minutes
  priority: CalendarEventPriority
  reminderMinutes: number
  meetingPlatform: MeetingPlatform
  requiresConfirmation: boolean
}

// Resultado de programación automática
export interface AutoSchedulingResult {
  success: boolean
  eventId?: string
  event?: CalendarEvent
  error?: string
  reason?: string
  suggestedTimes?: Date[]
}

// Filtros para consultar eventos
export interface CalendarEventFilters {
  leadId?: string
  userId?: string
  status?: CalendarEventStatus[]
  priority?: CalendarEventPriority[]
  followUpType?: FollowUpType[]
  automated?: boolean
  dateRange?: {
    start: Date
    end: Date
  }
  meetingPlatform?: MeetingPlatform[]
}

// Estadísticas de calendario
export interface CalendarStats {
  totalEvents: number
  eventsByStatus: Record<CalendarEventStatus, number>
  eventsByPriority: Record<CalendarEventPriority, number>
  eventsByType: Record<FollowUpType, number>
  automatedEvents: number
  completionRate: number // % de eventos completados
  noShowRate: number // % de no-shows
  averageMeetingDuration: number // minutes
  upcomingEvents: number
}

// Vista de calendario mensual
export interface CalendarMonthView {
  year: number
  month: number
  days: CalendarDayView[]
}

export interface CalendarDayView {
  date: Date
  dayOfWeek: number
  isToday: boolean
  isCurrentMonth: boolean
  events: CalendarEvent[]
  eventCount: number
  hasHighPriorityEvents: boolean
}

// Disponibilidad de usuario
export interface UserAvailability {
  userId: string
  date: Date
  timeSlots: AvailabilitySlot[]
  workingHours: {
    start: string
    end: string
  }
  timezone: string
}

export interface AvailabilitySlot {
  start: Date
  end: Date
  available: boolean
  reason?: string // "meeting", "blocked", "break"
}

// Detección automática de leads calificados
export interface QualifiedLeadCriteria {
  minSentimentScore: number
  minEngagementScore: number
  requiredBuyingSignals: string[]
  excludeStatuses: string[]
  daysSinceLastContact: number
  criticalMomentTypes: string[]
}

export interface QualifiedLeadDetection {
  leadId: string
  qualificationScore: number
  reasons: string[]
  suggestedFollowUpType: FollowUpType
  suggestedPriority: CalendarEventPriority
  sentimentScore: number
  engagementScore: number
  lastCriticalMoment?: {
    type: string
    description: string
    timePoint: number
  }
}

// Integración con análisis de sentiment
export interface SentimentBasedScheduling {
  leadId: string
  conversationId: string
  sentimentScore: number
  criticalMoments: Array<{
    type: string
    timePoint: number
    description: string
    impact: string
  }>
  recommendedAction: 'schedule_immediately' | 'schedule_follow_up' | 'nurture' | 'no_action'
  suggestedFollowUpType: FollowUpType
  urgency: 'low' | 'medium' | 'high' | 'urgent'
  reasoning: string
}

// Hook return types
export interface UseCalendarReturn {
  // State
  events: CalendarEvent[]
  currentView: 'month' | 'week' | 'day' | 'list'
  selectedDate: Date
  isLoading: boolean
  error: string | null
  
  // Actions
  createEvent: (data: CreateCalendarEventData) => Promise<CalendarEvent>
  updateEvent: (id: string, data: Partial<CalendarEvent>) => Promise<CalendarEvent>
  deleteEvent: (id: string) => Promise<void>
  rescheduleEvent: (id: string, newStartTime: Date, newEndTime: Date) => Promise<CalendarEvent>
  completeEvent: (id: string, outcome: string, nextAction?: string) => Promise<void>
  
  // Queries
  getEventsByDateRange: (start: Date, end: Date) => Promise<CalendarEvent[]>
  getUpcomingEvents: (limit?: number) => CalendarEvent[]
  getEventsByLead: (leadId: string) => CalendarEvent[]
  
  // Views
  setView: (view: 'month' | 'week' | 'day' | 'list') => void
  setSelectedDate: (date: Date) => void
  navigateDate: (direction: 'prev' | 'next') => void
}

export interface UseAutoSchedulingReturn {
  // State
  isEnabled: boolean
  config: AutoSchedulingConfig
  qualifiedLeads: QualifiedLeadDetection[]
  isDetecting: boolean
  
  // Actions
  detectQualifiedLeads: () => Promise<QualifiedLeadDetection[]>
  scheduleAutomatically: (leadId: string, config?: Partial<AutoSchedulingConfig>) => Promise<AutoSchedulingResult>
  updateConfig: (config: Partial<AutoSchedulingConfig>) => void
  
  // Utilities
  isLeadQualified: (leadId: string) => boolean
  getSuggestedTimes: (leadId: string, duration: number) => Date[]
}

// Configuraciones predeterminadas
export const DEFAULT_FOLLOW_UP_CONFIGS: Record<FollowUpType, FollowUpConfig> = {
  demo: {
    type: 'demo',
    title: 'Demostración del Producto',
    description: 'Sesión de demostración personalizada del producto/servicio',
    duration: 45,
    priority: 'high',
    reminderMinutes: 60,
    meetingPlatform: 'zoom',
    requiresConfirmation: true
  },
  proposal: {
    type: 'proposal',
    title: 'Presentación de Propuesta',
    description: 'Presentación detallada de la propuesta comercial',
    duration: 60,
    priority: 'high',
    reminderMinutes: 120,
    meetingPlatform: 'teams',
    requiresConfirmation: true
  },
  closing: {
    type: 'closing',
    title: 'Reunión de Cierre',
    description: 'Sesión para finalizar el proceso de venta',
    duration: 30,
    priority: 'urgent',
    reminderMinutes: 60,
    meetingPlatform: 'zoom',
    requiresConfirmation: true
  },
  follow_up: {
    type: 'follow_up',
    title: 'Seguimiento',
    description: 'Llamada de seguimiento general',
    duration: 30,
    priority: 'medium',
    reminderMinutes: 30,
    meetingPlatform: 'phone',
    requiresConfirmation: false
  },
  nurturing: {
    type: 'nurturing',
    title: 'Llamada de Nurturing',
    description: 'Mantenimiento de relación con el cliente',
    duration: 20,
    priority: 'low',
    reminderMinutes: 30,
    meetingPlatform: 'phone',
    requiresConfirmation: false
  },
  technical_call: {
    type: 'technical_call',
    title: 'Consulta Técnica',
    description: 'Reunión para resolver dudas técnicas',
    duration: 45,
    priority: 'medium',
    reminderMinutes: 60,
    meetingPlatform: 'teams',
    requiresConfirmation: true
  },
  discovery: {
    type: 'discovery',
    title: 'Llamada de Descubrimiento',
    description: 'Sesión para entender mejor las necesidades del cliente',
    duration: 30,
    priority: 'medium',
    reminderMinutes: 60,
    meetingPlatform: 'phone',
    requiresConfirmation: false
  },
  onboarding: {
    type: 'onboarding',
    title: 'Onboarding del Cliente',
    description: 'Sesión de introducción y configuración inicial',
    duration: 60,
    priority: 'high',
    reminderMinutes: 120,
    meetingPlatform: 'zoom',
    requiresConfirmation: true
  }
}

export const DEFAULT_AUTO_SCHEDULING_CONFIG: AutoSchedulingConfig = {
  enabled: true,
  sentimentThreshold: 0.5, // Solo programar si sentiment > 0.5
  businessHours: {
    start: "09:00",
    end: "17:00",
    timezone: "America/Panama",
    workingDays: [1, 2, 3, 4, 5] // Mon-Fri
  },
  meetingDurations: {
    demo: 45,
    proposal: 60,
    closing: 30,
    follow_up: 30,
    nurturing: 20,
    technical_call: 45,
    discovery: 30,
    onboarding: 60
  },
  defaultPlatform: 'internal',
  autoConfirm: false
}

// Utilidades
export const formatEventTime = (event: CalendarEvent): string => {
  const start = new Date(event.startTime)
  const end = new Date(event.endTime)
  
  if (event.allDay) {
    return 'Todo el día'
  }
  
  return `${start.toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })} - ${end.toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })}`
}

export const getEventStatusColor = (status: CalendarEventStatus): string => {
  const colors = {
    scheduled: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-green-100 text-green-800',
    completed: 'bg-emerald-100 text-emerald-800',
    canceled: 'bg-red-100 text-red-800',
    rescheduled: 'bg-orange-100 text-orange-800',
    no_show: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800'
  }
  return colors[status] || colors.pending
}

export const getPriorityColor = (priority: CalendarEventPriority): string => {
  const colors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  }
  return colors[priority]
}