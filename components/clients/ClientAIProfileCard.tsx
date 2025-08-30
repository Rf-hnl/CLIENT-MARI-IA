'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  MessageSquare, 
  AlertTriangle,
  CheckCircle,
  Info,
  Lightbulb
} from 'lucide-react';
import { IClientAIProfile } from '@/modules/clients/types/clients';

interface ClientAIProfileCardProps {
  profile?: IClientAIProfile;
  clientName?: string;
}

export function ClientAIProfileCard({ profile, clientName }: ClientAIProfileCardProps) {
  if (!profile) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">Perfil de IA no disponible</p>
            <p className="text-sm text-muted-foreground">
              El análisis de IA se generará después de más interacciones
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Helper functions
  const getSegmentColor = (segment: string) => {
    const colors = {
      'HighValue': 'bg-green-500',
      'AtRisk': 'bg-red-500',
      'Engaged': 'bg-blue-500',
      'Dormant': 'bg-gray-500',
      'NewClient': 'bg-purple-500',
      'VIP': 'bg-yellow-500',
      'Problematic': 'bg-orange-500'
    };
    return colors[segment as keyof typeof colors] || 'bg-gray-500';
  };

  const getUrgencyColor = (urgency: string) => {
    const colors = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-orange-100 text-orange-800',
      'critical': 'bg-red-100 text-red-800'
    };
    return colors[urgency as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    // Handle Firebase timestamp
    const date = timestamp._seconds ? new Date(timestamp._seconds * 1000) : new Date(timestamp);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with basic info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Perfil de Inteligencia Artificial
            {clientName && <span className="text-muted-foreground">- {clientName}</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Segmentation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className={`${getSegmentColor(profile.profileSegment)} text-white`}>
                {profile.profileSegment}
              </Badge>
              <Badge variant="outline">{profile.clientTier}</Badge>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>Último análisis: {formatDate(profile.lastUpdatedByAI)}</p>
              <p>Confianza: {profile.confidenceScore}%</p>
            </div>
          </div>

          {/* Urgency Alert */}
          {profile.urgencyLevel !== 'low' && (
            <Alert className={profile.urgencyLevel === 'critical' ? 'border-red-500' : ''}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getUrgencyColor(profile.urgencyLevel)}`}>
                  Urgencia {profile.urgencyLevel.toUpperCase()}
                </span>
                <span className="ml-2">{profile.recommendedAction}</span>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Scores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Puntuaciones de Riesgo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Riesgo General</span>
                <span>{profile.riskScore}%</span>
              </div>
              <Progress value={profile.riskScore} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Engagement</span>
                <span>{profile.engagementScore}%</span>
              </div>
              <Progress value={profile.engagementScore} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Responsividad</span>
                <span>{profile.responsivenesScore}%</span>
              </div>
              <Progress value={profile.responsivenesScore} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Comportamiento de Pago</span>
                <span>{profile.paymentBehaviorScore}%</span>
              </div>
              <Progress value={profile.paymentBehaviorScore} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Predicciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Probabilidad de Pago</span>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="font-medium">{profile.paymentProbability}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Prob. Recuperación</span>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                <span className="font-medium">{profile.recoveryProbability}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Riesgo de Default</span>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="font-medium">{profile.defaultRisk}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Riesgo de Fuga</span>
              <div className="flex items-center gap-2">
                {profile.predictedChurnRisk ? (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                <span className="font-medium">
                  {profile.predictedChurnRisk ? 'Alto' : 'Bajo'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Communication Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <MessageSquare className="h-4 w-4" />
            Preferencias de Comunicación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="font-medium text-muted-foreground">Método Preferido</p>
              <p className="capitalize">{profile.communicationPreference}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Mejor Horario</p>
              <p className="capitalize">{profile.bestContactTime}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Patrón de Respuesta</p>
              <p className="capitalize">{profile.responsePattern}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Estilo de Negociación</p>
              <p className="capitalize">{profile.negotiationStyle}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      {profile.aiInsights && profile.aiInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Lightbulb className="h-4 w-4" />
              Insights de IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {profile.aiInsights.map((insight, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Next Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            Próximas Acciones Recomendadas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Acción Recomendada</span>
            <Badge variant="outline">{profile.recommendedAction}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Método de Contacto</span>
            <Badge variant="outline">{profile.recommendedContactMethod}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Tono Preferido</span>
            <Badge variant="outline" className="capitalize">{profile.preferredMessageTone}</Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Próximo Contacto</span>
            <span>{formatDate(profile.nextRecommendedContactDate)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
            <div>
              <p className="font-medium">Modelo IA</p>
              <p>{profile.aiModel}</p>
            </div>
            <div>
              <p className="font-medium">Calidad de Datos</p>
              <p className="capitalize">{profile.dataQuality}</p>
            </div>
            <div>
              <p className="font-medium">Última Actualización</p>
              <p>{formatDate(profile.lastInteractionAnalyzed)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}