/**
 * ANALYTICS AND DASHBOARD TYPES
 * 
 * Tipos para el sistema de analytics avanzado y dashboard ejecutivo
 * Incluye métricas en tiempo real, auto-progresión y reporting inteligente
 */

export type MetricPeriod = 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly';
export type MetricType = 'conversion' | 'engagement' | 'revenue' | 'efficiency' | 'quality';
export type TrendDirection = 'up' | 'down' | 'stable' | 'volatile';

// Core Dashboard Types
export interface DashboardMetric {
  id: string;
  name: string;
  value: number;
  previousValue?: number;
  changePercentage?: number;
  trend: TrendDirection;
  target?: number;
  unit: 'number' | 'percentage' | 'currency' | 'duration';
  format?: string; // Ej: '$0,0.00', '0.0%', '0,0'
  description?: string;
  lastUpdated: Date;
}

export interface DashboardKPI {
  id: string;
  category: MetricType;
  title: string;
  metrics: DashboardMetric[];
  chartData?: ChartDataPoint[];
  alertThreshold?: number;
  isAlert?: boolean;
  alertMessage?: string;
}

export interface ChartDataPoint {
  timestamp: Date;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
}

// Real-time Analytics
export interface RealTimeMetrics {
  timestamp: Date;
  activeCalls: number;
  successfulCallsToday: number;
  failedCallsToday: number;
  averageCallDuration: number;
  currentConversionRate: number;
  leadsInPipeline: number;
  hotLeads: number; // Leads con alta probabilidad de conversión
  recentActivity: ActivityFeed[];
}

export interface ActivityFeed {
  id: string;
  type: 'call_completed' | 'lead_converted' | 'script_generated' | 'meeting_scheduled' | 'lead_qualified';
  title: string;
  description: string;
  leadId?: string;
  leadName?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  icon?: string;
}

// Performance Analytics
export interface PerformanceAnalytics {
  period: MetricPeriod;
  startDate: Date;
  endDate: Date;
  
  // Volume metrics
  totalCalls: number;
  totalLeads: number;
  totalOpportunities: number;
  totalRevenue: number;
  
  // Conversion metrics
  callToLeadRate: number;
  leadToOpportunityRate: number;
  opportunityToWinRate: number;
  overallConversionRate: number;
  
  // Efficiency metrics
  averageCallDuration: number;
  callsPerLead: number;
  touchesToConversion: number;
  salesCycleLength: number; // días promedio
  
  // Quality metrics
  averageSentiment: number;
  averageEngagement: number;
  scriptUsageRate: number;
  personalizationImpact: number; // % improvement with personalization
  
  // Revenue metrics
  averageDealSize: number;
  revenuePerLead: number;
  revenuePerCall: number;
  monthlyRecurringRevenue?: number;
  
  // Trend data
  trendsOverTime: PerformanceTrend[];
  
  generatedAt: Date;
}

export interface PerformanceTrend {
  date: Date;
  metric: string;
  value: number;
  changeFromPrevious?: number;
}

// Lead Scoring and Auto-Progression
export interface LeadScore {
  leadId: string;
  totalScore: number; // 0-100
  factorScores: {
    engagement: number; // 0-25
    sentiment: number; // 0-25
    behavioral: number; // 0-25
    firmographic: number; // 0-25
  };
  riskFactors: RiskFactor[];
  opportunities: OpportunityFactor[];
  recommendedActions: RecommendedAction[];
  nextBestAction: string;
  probabilityToClose: number; // 0-1
  estimatedValue: number;
  estimatedCloseDate?: Date;
  lastUpdated: Date;
}

export interface RiskFactor {
  type: 'no_response' | 'negative_sentiment' | 'competitor_mention' | 'budget_concerns' | 'timing_issues';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: number; // Score impact
  mitigation: string;
  detectedAt: Date;
}

export interface OpportunityFactor {
  type: 'buying_signal' | 'positive_sentiment' | 'engagement_increase' | 'referral_potential' | 'expansion_opportunity';
  strength: 'weak' | 'moderate' | 'strong' | 'very_strong';
  description: string;
  impact: number; // Score boost
  actionable: boolean;
  detectedAt: Date;
}

export interface RecommendedAction {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'proposal' | 'follow_up' | 'nurture' | 'close';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  expectedOutcome: string;
  estimatedEffort: 'low' | 'medium' | 'high';
  successProbability: number; // 0-1
  potentialImpact: number; // Score change expected
  suggestedTiming?: Date;
  prerequisites?: string[];
  createdAt: Date;
}

// Auto-Progression Engine
export interface AutoProgressionRule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  
  // Trigger conditions
  triggers: ProgressionTrigger[];
  
  // Actions to take
  actions: ProgressionAction[];
  
  // Constraints
  minScore?: number;
  maxDaysSinceLastTouch?: number;
  requiredStatuses?: string[];
  excludedStatuses?: string[];
  
  // Performance tracking
  timesTriggered: number;
  successRate: number;
  averageImpact: number;
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface ProgressionTrigger {
  type: 'sentiment_threshold' | 'engagement_increase' | 'time_based' | 'behavior_pattern' | 'external_signal';
  condition: string; // Expresión lógica
  parameters: Record<string, any>;
  weight: number; // Importancia relativa
}

export interface ProgressionAction {
  type: 'status_change' | 'schedule_call' | 'send_email' | 'create_task' | 'assign_to_user' | 'personalize_script';
  parameters: Record<string, any>;
  delay?: number; // Minutos antes de ejecutar
  conditions?: string[]; // Condiciones adicionales
}

export interface AutoProgressionResult {
  ruleId: string;
  leadId: string;
  triggeredAt: Date;
  actionsExecuted: {
    action: ProgressionAction;
    success: boolean;
    result?: any;
    error?: string;
    executedAt: Date;
  }[];
  overallSuccess: boolean;
  impactMeasured?: number; // Cambio en score
  notes?: string;
}

// Smart Reporting
export interface SmartReport {
  id: string;
  title: string;
  type: 'performance' | 'insights' | 'forecast' | 'exception' | 'opportunity';
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  // Content
  summary: string;
  keyFindings: ReportFinding[];
  recommendations: ReportRecommendation[];
  dataVisualization?: ChartConfig[];
  
  // Metadata
  generatedBy: 'ai' | 'scheduled' | 'manual';
  aiConfidence?: number;
  dataRange: {
    startDate: Date;
    endDate: Date;
  };
  
  // Distribution
  audience: 'executive' | 'manager' | 'agent' | 'all';
  deliveryMethod: 'dashboard' | 'email' | 'slack' | 'api';
  frequency?: 'daily' | 'weekly' | 'monthly' | 'ad_hoc';
  
  createdAt: Date;
  expiresAt?: Date;
}

export interface ReportFinding {
  type: 'insight' | 'anomaly' | 'trend' | 'correlation' | 'prediction';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  metric?: string;
  value?: number;
  change?: number;
  confidence: number; // 0-1 for AI-generated findings
  supporting_data?: any[];
}

export interface ReportRecommendation {
  id: string;
  title: string;
  description: string;
  type: 'process_improvement' | 'resource_allocation' | 'training' | 'technology' | 'strategy';
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  timeline: string; // "1 week", "1 month", etc.
  success_metrics?: string[];
  dependencies?: string[];
  priority: number; // 1-10
}

export interface ChartConfig {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'funnel' | 'gauge';
  title: string;
  data: ChartDataPoint[];
  options: {
    xAxis?: string;
    yAxis?: string;
    colors?: string[];
    showLegend?: boolean;
    showGrid?: boolean;
    responsive?: boolean;
  };
}

// Dashboard Configuration
export interface DashboardConfig {
  id: string;
  name: string;
  description?: string;
  userId: string;
  
  // Layout
  layout: DashboardLayout;
  widgets: DashboardWidget[];
  
  // Settings
  refreshInterval: number; // seconds
  autoRefresh: boolean;
  theme: 'light' | 'dark' | 'auto';
  
  // Permissions
  isPublic: boolean;
  sharedWith?: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardLayout {
  columns: number;
  rows: number;
  gap: number;
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'feed' | 'progress' | 'alert';
  title: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: {
    dataSource: string;
    refreshInterval?: number;
    filters?: Record<string, any>;
    visualization?: ChartConfig;
  };
  isVisible: boolean;
}

// Integration with existing systems
export interface SystemIntegration {
  // From Bulk Calling (Phase 1)
  bulkCallMetrics: {
    queuesActive: number;
    callsInProgress: number;
    completionRate: number;
    averageWaitTime: number;
  };
  
  // From Sentiment Analysis (Phase 2)
  sentimentMetrics: {
    averageSentiment: number;
    sentimentTrend: TrendDirection;
    criticalMomentsDetected: number;
    sentimentDistribution: Record<string, number>;
  };
  
  // From Calendar (Phase 3)
  calendarMetrics: {
    meetingsScheduled: number;
    meetingsCompleted: number;
    noShowRate: number;
    averageMeetingDuration: number;
    automatedScheduling: number;
  };
  
  // From Personalization (Phase 4)
  personalizationMetrics: {
    scriptsGenerated: number;
    scriptUsageRate: number;
    personalizationImpact: number;
    averageConfidence: number;
    strategiesUsed: Record<string, number>;
  };
}

// Hook interfaces
export interface UseAnalyticsReturn {
  // Real-time data
  realTimeMetrics: RealTimeMetrics | null;
  isLoadingRealTime: boolean;
  
  // Performance analytics
  performanceData: PerformanceAnalytics | null;
  isLoadingPerformance: boolean;
  
  // Lead scoring
  leadScores: LeadScore[];
  isLoadingScores: boolean;
  
  // Reports
  smartReports: SmartReport[];
  isLoadingReports: boolean;
  
  // Actions
  refreshRealTimeData: () => Promise<void>;
  loadPerformanceData: (period: MetricPeriod) => Promise<void>;
  generateSmartReport: (type: SmartReport['type']) => Promise<SmartReport>;
  updateLeadScore: (leadId: string) => Promise<LeadScore>;
  
  // Auto-progression
  autoProgressionRules: AutoProgressionRule[];
  createProgressionRule: (rule: Omit<AutoProgressionRule, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  executeProgressionRule: (ruleId: string, leadId: string) => Promise<AutoProgressionResult>;
  
  // Dashboard
  dashboardConfig: DashboardConfig | null;
  updateDashboardConfig: (config: Partial<DashboardConfig>) => Promise<void>;
}

// Utility types
export interface AnalyticsFilter {
  dateRange?: {
    start: Date;
    end: Date;
  };
  leadStatuses?: string[];
  sources?: string[];
  userIds?: string[];
  tags?: string[];
}

export interface AnalyticsExport {
  format: 'csv' | 'xlsx' | 'pdf' | 'json';
  data: any[];
  filename: string;
  generatedAt: Date;
}

// Default configurations
export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayout = {
  columns: 12,
  rows: 8,
  gap: 16
};

export const DEFAULT_REFRESH_INTERVAL = 30; // seconds

export const KPI_CATEGORIES: Record<MetricType, string> = {
  conversion: 'Conversión',
  engagement: 'Engagement',
  revenue: 'Ingresos',
  efficiency: 'Eficiencia',
  quality: 'Calidad'
};

export const METRIC_UNITS: Record<string, { label: string; format: string }> = {
  number: { label: '', format: '0,0' },
  percentage: { label: '%', format: '0.0%' },
  currency: { label: '$', format: '$0,0.00' },
  duration: { label: 'min', format: '0.0' }
};

// AI-powered insights configuration
export interface AIInsightConfig {
  enableAnomalyDetection: boolean;
  enableTrendPrediction: boolean;
  enableRecommendationEngine: boolean;
  confidenceThreshold: number; // 0-1
  updateFrequency: 'realtime' | 'hourly' | 'daily';
  notificationChannels: ('dashboard' | 'email' | 'slack')[];
}

export const DEFAULT_AI_INSIGHT_CONFIG: AIInsightConfig = {
  enableAnomalyDetection: true,
  enableTrendPrediction: true,
  enableRecommendationEngine: true,
  confidenceThreshold: 0.8,
  updateFrequency: 'hourly',
  notificationChannels: ['dashboard']
};