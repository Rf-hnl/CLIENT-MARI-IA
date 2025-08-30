'use client';

/**
 * LEADS AI ANALYSIS PAGE
 * 
 * Página de análisis de datos de leads con IA - Lead Score Inteligente
 * Ruta: /clients/leads/ai-analysis
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bot, 
  Brain, 
  TrendingUp, 
  Users, 
  Target, 
  Sparkles,
  RefreshCw,
  ArrowRight,
  BarChart3,
  Zap,
  AlertCircle,
  CheckCircle,
  Calculator,
  Filter,
  Settings
} from 'lucide-react';

// Imports del sistema de leads
import { useLeads } from '@/modules/leads/hooks/useLeads';
import { LeadsProvider } from '@/modules/leads/context/LeadsContext';
import { useAILeadScoring, useAIScoreDisplay } from '@/modules/leads/hooks/useAILeadScoring';
import { classifyLeadByScore } from '@/modules/leads/utils/aiLeadScoring';

// Componente para mostrar el AI Score de un lead individual
const LeadScoreRow = ({ lead }: { lead: any }) => {
  const { score, hasScore, classification, displayText, breakdown } = useAIScoreDisplay(lead);
  
  return (
    <TableRow>
      <TableCell className="font-medium">{lead.name || 'Sin nombre'}</TableCell>
      <TableCell>{lead.company || 'Sin empresa'}</TableCell>
      <TableCell>{lead.source || 'Sin fuente'}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${classification.color}`}>
            {classification.emoji} {displayText}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground max-w-xs">
        {breakdown}
      </TableCell>
    </TableRow>
  );
};

// Componente principal envuelto en el provider
export default function LeadsAIAnalysisPage() {
  return (
    <LeadsProvider>
      <LeadsAIAnalysisContent />
    </LeadsProvider>
  );
}

// Componente de contenido que usa el contexto
function LeadsAIAnalysisContent() {
  const { leads, isLoading } = useLeads();
  const { 
    calculateBulkScores, 
    isCalculating, 
    lastUpdate,
    getLeadsNeedingUpdate 
  } = useAILeadScoring();
  // TODO: Integrar con agentes reales cuando estén listos
  const scoringAgents: any[] = [];
  const defaultScoringAgent = null;
  
  const [filter, setFilter] = useState<'all' | 'hot' | 'warm' | 'cold'>('all');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // Calcular estadísticas y análisis de factores
  const stats = useMemo(() => {
    const leadsWithScore = leads.filter(l => (l.ai_score || 0) > 0);
    const total = leadsWithScore.length;
    
    if (total === 0) {
      return { 
        total: 0, hot: 0, warm: 0, cold: 0, average: 0, needsUpdate: leads.length,
        factors: { dataCompleteness: 0, sourceQuality: 0, engagement: 0, timing: 0 },
        distribution: { dataCompleteness: 0, sourceQuality: 0, engagement: 0, timing: 0 }
      };
    }
    
    const hot = leadsWithScore.filter(l => (l.ai_score || 0) >= 70).length;
    const warm = leadsWithScore.filter(l => (l.ai_score || 0) >= 40 && (l.ai_score || 0) < 70).length;
    const cold = leadsWithScore.filter(l => (l.ai_score || 0) < 40).length;
    const average = Math.round(leadsWithScore.reduce((sum, l) => sum + (l.ai_score || 0), 0) / total);
    const needsUpdate = getLeadsNeedingUpdate(leads).length;
    
    // Calcular promedios reales de cada factor
    const totalFactors = leadsWithScore.reduce((acc, lead) => {
      if (lead.ai_score_factors) {
        acc.dataCompleteness += lead.ai_score_factors.data_completeness || 0;
        acc.sourceQuality += lead.ai_score_factors.source_quality || 0;
        acc.engagement += lead.ai_score_factors.engagement_level || 0;
        acc.timing += lead.ai_score_factors.timing_factor || 0;
      }
      return acc;
    }, { dataCompleteness: 0, sourceQuality: 0, engagement: 0, timing: 0 });
    
    const factors = {
      dataCompleteness: Math.round(totalFactors.dataCompleteness / total),
      sourceQuality: Math.round(totalFactors.sourceQuality / total),
      engagement: Math.round(totalFactors.engagement / total),
      timing: Math.round(totalFactors.timing / total)
    };
    
    // Calcular distribución porcentual real
    const totalPoints = factors.dataCompleteness + factors.sourceQuality + factors.engagement + factors.timing;
    const distribution = totalPoints > 0 ? {
      dataCompleteness: Math.round((factors.dataCompleteness / totalPoints) * 100),
      sourceQuality: Math.round((factors.sourceQuality / totalPoints) * 100),
      engagement: Math.round((factors.engagement / totalPoints) * 100),
      timing: Math.round((factors.timing / totalPoints) * 100)
    } : { dataCompleteness: 40, sourceQuality: 30, engagement: 20, timing: 10 };
    
    return { total, hot, warm, cold, average, needsUpdate, factors, distribution };
  }, [leads, getLeadsNeedingUpdate]);

  // Filtrar leads
  const filteredLeads = useMemo(() => {
    let filtered = leads.filter(l => (l.ai_score || 0) > 0);
    
    if (filter === 'hot') filtered = filtered.filter(l => (l.ai_score || 0) >= 70);
    else if (filter === 'warm') filtered = filtered.filter(l => (l.ai_score || 0) >= 40 && (l.ai_score || 0) < 70);
    else if (filter === 'cold') filtered = filtered.filter(l => (l.ai_score || 0) < 40);
    
    return filtered.sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0));
  }, [leads, filter]);

  // Obtener agente seleccionado o por defecto
  const selectedAgent = useMemo(() => {
    if (selectedAgentId) {
      return scoringAgents.find(a => a.id === selectedAgentId);
    }
    return defaultScoringAgent;
  }, [selectedAgentId, scoringAgents, defaultScoringAgent]);

  // Manejar cálculo de scores
  const handleCalculateScores = async () => {
    const leadsToUpdate = getLeadsNeedingUpdate(leads);
    if (leadsToUpdate.length > 0) {
      if (selectedAgent) {
        console.log('Calculando scores con agente:', selectedAgent.name);
        // En el futuro: usar callAgent para cada lead
        // for (const lead of leadsToUpdate.slice(0, 5)) {
        //   await callAgent({
        //     agentId: selectedAgent.id,
        //     input: { leadData: lead },
        //     metadata: { ... }
        //   });
        // }
      }
      await calculateBulkScores(leadsToUpdate);
      console.log('Scores calculados para', leadsToUpdate.length, 'leads');
    }
  };

  return (
    <div className="container mx-auto p-0 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Zap className="h-8 w-8 text-blue-600" />
            Lead Score Inteligente
          </h1>
          <p className="text-muted-foreground mt-2">
            Algoritmo de IA que evalúa automáticamente la calidad de tus leads
          </p>
        </div>
        <div className="flex items-center gap-2">
          {stats.needsUpdate > 0 && (
            <Badge variant="outline" className="text-orange-600">
              <AlertCircle className="h-3 w-3 mr-1" />
              {stats.needsUpdate} sin calcular
            </Badge>
          )}
          
          {/* Selector de Agente IA - Solo mostrar si hay agentes configurados */}
          {scoringAgents.length > 0 ? (
            <Select 
              value={selectedAgentId || defaultScoringAgent?.id || ''} 
              onValueChange={setSelectedAgentId}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Seleccionar agente IA" />
              </SelectTrigger>
              <SelectContent>
                {/* TODO: Renderizar agentes cuando estén disponibles */}
              </SelectContent>
            </Select>
          ) : (
            <Badge variant="outline" className="text-orange-600">
              <AlertCircle className="h-3 w-3 mr-1" />
              Sin agentes configurados
            </Badge>
          )}
          
          <Button 
            onClick={handleCalculateScores}
            disabled={isCalculating || stats.needsUpdate === 0 || scoringAgents.length === 0}
          >
            <Calculator className="h-4 w-4 mr-2" />
            {isCalculating ? 'Calculando...' : 'Calcular Scores'}
          </Button>
          
          {/* NOTE: Agent configuration moved to environment variables */}
          <Button variant="outline" size="sm" disabled>
            <Settings className="h-3 w-3 mr-1" />
            Agentes configurados vía ENV
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Leads con Score</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.hot}</div>
            <div className="text-xs text-muted-foreground">🔥 Calientes (70+)</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.warm}</div>
            <div className="text-xs text-muted-foreground">🌡️ Tibios (40-69)</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.cold}</div>
            <div className="text-xs text-muted-foreground">❄️ Fríos (0-39)</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.average}</div>
            <div className="text-xs text-muted-foreground">Score Promedio</div>
          </CardContent>
        </Card>
      </div>

      {/* Análisis de Factores - Datos Reales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            Análisis de Factores AI Score
          </CardTitle>
          <CardDescription>
            {stats.total > 0 
              ? `Basado en ${stats.total} leads con AI Score calculado`
              : 'Calcula scores para ver el análisis de factores'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.total > 0 ? (
            <div className="space-y-6">
              {/* Distribución Real de Factores */}
              <div className="grid md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg border">
                  <div className="text-2xl font-bold text-blue-600">{stats.distribution.dataCompleteness}%</div>
                  <div className="text-sm font-medium">Datos Completos</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Promedio: {stats.factors.dataCompleteness}/40 pts
                  </div>
                  <Progress value={(stats.factors.dataCompleteness / 40) * 100} className="mt-2 h-1" />
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg border">
                  <div className="text-2xl font-bold text-green-600">{stats.distribution.sourceQuality}%</div>
                  <div className="text-sm font-medium">Fuente</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Promedio: {stats.factors.sourceQuality}/30 pts
                  </div>
                  <Progress value={(stats.factors.sourceQuality / 30) * 100} className="mt-2 h-1" />
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg border">
                  <div className="text-2xl font-bold text-orange-600">{stats.distribution.engagement}%</div>
                  <div className="text-sm font-medium">Engagement</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Promedio: {stats.factors.engagement}/20 pts
                  </div>
                  <Progress value={(stats.factors.engagement / 20) * 100} className="mt-2 h-1" />
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg border">
                  <div className="text-2xl font-bold text-purple-600">{stats.distribution.timing}%</div>
                  <div className="text-sm font-medium">Timing</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Promedio: {stats.factors.timing}/10 pts
                  </div>
                  <Progress value={(stats.factors.timing / 10) * 100} className="mt-2 h-1" />
                </div>
              </div>

              {/* Insights de los Datos */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="bg-blue-50">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-blue-800 mb-2">💡 Factor Más Fuerte</h4>
                    <p className="text-sm text-blue-700">
                      {stats.factors.dataCompleteness >= Math.max(stats.factors.sourceQuality, stats.factors.engagement, stats.factors.timing) 
                        ? `Datos Completos (${stats.factors.dataCompleteness} pts promedio)` 
                        : stats.factors.sourceQuality >= Math.max(stats.factors.engagement, stats.factors.timing)
                        ? `Fuente (${stats.factors.sourceQuality} pts promedio)`
                        : stats.factors.engagement >= stats.factors.timing
                        ? `Engagement (${stats.factors.engagement} pts promedio)`
                        : `Timing (${stats.factors.timing} pts promedio)`
                      }
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-orange-50">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-orange-800 mb-2">⚠️ Área de Mejora</h4>
                    <p className="text-sm text-orange-700">
                      {stats.factors.dataCompleteness <= Math.min(stats.factors.sourceQuality, stats.factors.engagement, stats.factors.timing) 
                        ? `Completar más datos de leads (${stats.factors.dataCompleteness}/40)` 
                        : stats.factors.sourceQuality <= Math.min(stats.factors.engagement, stats.factors.timing)
                        ? `Mejorar fuentes de leads (${stats.factors.sourceQuality}/30)`
                        : stats.factors.engagement <= stats.factors.timing
                        ? `Aumentar engagement (${stats.factors.engagement}/20)`
                        : `Trabajar leads más rápido (${stats.factors.timing}/10)`
                      }
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">Sin Datos de Análisis</h3>
              <p className="text-gray-500 mb-4">
                Necesitas calcular AI Scores para ver el análisis de factores
              </p>
              <Button onClick={handleCalculateScores} disabled={isCalculating}>
                <Calculator className="h-4 w-4 mr-2" />
                {isCalculating ? 'Calculando...' : 'Calcular Scores'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filtros y Tabla */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Leads con AI Score</CardTitle>
              <CardDescription>
                {filteredLeads.length} de {leads.length} leads
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant={filter === 'all' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilter('all')}
              >
                Todos
              </Button>
              <Button 
                variant={filter === 'hot' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilter('hot')}
              >
                🔥 Calientes
              </Button>
              <Button 
                variant={filter === 'warm' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilter('warm')}
              >
                🌡️ Tibios
              </Button>
              <Button 
                variant={filter === 'cold' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilter('cold')}
              >
                ❄️ Fríos
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Cargando leads...</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-muted-foreground">
                {filter === 'all' 
                  ? 'No hay leads con AI Score calculado' 
                  : `No hay leads ${filter === 'hot' ? 'calientes' : filter === 'warm' ? 'tibios' : 'fríos'}`
                }
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={handleCalculateScores}
                disabled={isCalculating}
              >
                <Calculator className="h-4 w-4 mr-2" />
                Calcular Scores
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Fuente</TableHead>
                  <TableHead>AI Score</TableHead>
                  <TableHead>Explicación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <LeadScoreRow key={lead.id} lead={lead} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}