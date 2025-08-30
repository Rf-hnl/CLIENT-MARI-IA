'use client';

/**
 * ENHANCED LEADS FILTERS COMPONENT
 * 
 * Componente ADITIVO para filtros avanzados en llamadas masivas
 * NO modifica la funcionalidad existente, solo AGREGA nuevas capacidades
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Calendar,
  CalendarIcon,
  Clock,
  Filter,
  FilterX,
  ChevronDown,
  ChevronUp,
  Users,
  Phone,
  MessageSquare,
  Star,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Target,
  RefreshCw
} from 'lucide-react';

import { LeadStatus, LeadPriority, LeadSource } from '@/modules/leads/types/leads';
import { 
  MassiveCallFilters, 
  CallResult, 
  CALL_RESULT_LABELS, 
  EligibilityStats 
} from '@/types/bulkCalls';

// Configuración de estados con badges
const LEAD_STATUS_CONFIG = {
  new: { 
    label: 'Nuevo', 
    color: 'bg-gray-100 text-gray-800 border-gray-200'
  },
  interested: { 
    label: 'Interesado', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  qualified: { 
    label: 'Calificado', 
    color: 'bg-orange-100 text-orange-800 border-orange-200'
  },
  follow_up: { 
    label: 'Seguimiento', 
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  proposal_current: { 
    label: 'Propuesta Actual', 
    color: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  negotiation: { 
    label: 'En Negociación', 
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200'
  },
  won: { 
    label: 'Ganado', 
    color: 'bg-green-100 text-green-800 border-green-200'
  },
  lost: { 
    label: 'Perdido', 
    color: 'bg-red-100 text-red-800 border-red-200'
  },
  nurturing: { 
    label: 'En Nurturing', 
    color: 'bg-teal-100 text-teal-800 border-teal-200'
  },
  cold: { 
    label: 'Frío', 
    color: 'bg-slate-100 text-slate-800 border-slate-200'
  }
};

interface EnhancedLeadsFiltersProps {
  onFiltersChange: (filters: MassiveCallFilters) => void;
  eligibilityStats?: EligibilityStats;
  showBulkOptions: boolean;
  isLoading?: boolean;
}

export function EnhancedLeadsFilters({ 
  onFiltersChange, 
  eligibilityStats, 
  showBulkOptions, 
  isLoading = false 
}: EnhancedLeadsFiltersProps) {
  
  // Estado de los filtros
  const [filters, setFilters] = useState<MassiveCallFilters>({});
  
  // Estados de UI
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic']));
  
  // Actualizar filtros cuando cambian
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);
  
  // Helper para toggle de secciones expandidas
  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };
  
  // Helper para actualizar filtros
  const updateFilter = (key: keyof MassiveCallFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Limpiar todos los filtros
  const clearAllFilters = () => {
    setFilters({});
  };
  
  // Contar filtros activos
  const activeFiltersCount = Object.values(filters).filter(Boolean).length;
  
  if (!showBulkOptions) {
    return null; // No mostrar si no está en modo masivo
  }
  
  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-sm font-medium text-blue-900">
              Filtros Avanzados para Llamadas Masivas
            </CardTitle>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {activeFiltersCount} activos
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-6 px-2 text-xs text-gray-600 hover:text-gray-800"
              >
                <FilterX className="h-3 w-3 mr-1" />
                Limpiar
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800"
            >
              {showAdvancedFilters ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Ocultar
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Expandir
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 pt-0">
        {/* Estadísticas de Elegibilidad */}
        {eligibilityStats && (
          <div className="grid grid-cols-3 gap-3 p-3 bg-white rounded-lg border border-blue-100">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">{eligibilityStats.total}</div>
              <div className="text-xs text-gray-600">Total Leads</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">{eligibilityStats.eligible}</div>
              <div className="text-xs text-gray-600">Elegibles</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">
                {eligibilityStats.total > 0 ? Math.round((eligibilityStats.eligible / eligibilityStats.total) * 100) : 0}%
              </div>
              <div className="text-xs text-gray-600">Tasa Elegible</div>
            </div>
          </div>
        )}
        
        {/* Filtros Básicos - Siempre Visibles */}
        <Collapsible 
          open={expandedSections.has('basic')} 
          onOpenChange={() => toggleSection('basic')}
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between h-8 px-2 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Filtros Básicos</span>
              </div>
              {expandedSections.has('basic') ? 
                <ChevronUp className="h-4 w-4" /> : 
                <ChevronDown className="h-4 w-4" />
              }
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-3">
            {/* Estados */}
            <div>
              <Label className="text-xs font-medium text-gray-700 mb-2 block">Estados</Label>
              <div className="flex flex-wrap gap-1">
                {(Object.keys(LEAD_STATUS_CONFIG) as LeadStatus[]).map(status => (
                  <Badge
                    key={status}
                    variant={filters.status?.includes(status) ? "default" : "outline"}
                    className={`cursor-pointer text-xs transition-all ${
                      filters.status?.includes(status) 
                        ? 'bg-blue-600 text-white' 
                        : LEAD_STATUS_CONFIG[status].color
                    }`}
                    onClick={() => {
                      const currentStatuses = filters.status || [];
                      const newStatuses = currentStatuses.includes(status)
                        ? currentStatuses.filter(s => s !== status)
                        : [...currentStatuses, status];
                      updateFilter('status', newStatuses.length > 0 ? newStatuses : undefined);
                    }}
                  >
                    {LEAD_STATUS_CONFIG[status].label}
                  </Badge>
                ))}
              </div>
            </div>
            
            {/* Prioridades */}
            <div>
              <Label className="text-xs font-medium text-gray-700 mb-2 block">Prioridad</Label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high', 'urgent'] as LeadPriority[]).map(priority => (
                  <Badge
                    key={priority}
                    variant={filters.priority?.includes(priority) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => {
                      const currentPriorities = filters.priority || [];
                      const newPriorities = currentPriorities.includes(priority)
                        ? currentPriorities.filter(p => p !== priority)
                        : [...currentPriorities, priority];
                      updateFilter('priority', newPriorities.length > 0 ? newPriorities : undefined);
                    }}
                  >
                    {priority === 'low' && '🟢 Baja'}
                    {priority === 'medium' && '🟡 Media'}
                    {priority === 'high' && '🟠 Alta'}
                    {priority === 'urgent' && '🔴 Urgente'}
                  </Badge>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
        
        {/* Filtros Avanzados - Solo cuando está expandido */}
        {showAdvancedFilters && (
          <>
            <Separator />
            
            {/* Filtros de Llamadas */}
            <Collapsible 
              open={expandedSections.has('calls')} 
              onOpenChange={() => toggleSection('calls')}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between h-8 px-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>Historial de Llamadas</span>
                  </div>
                  {expandedSections.has('calls') ? 
                    <ChevronUp className="h-4 w-4" /> : 
                    <ChevronDown className="h-4 w-4" />
                  }
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-3">
                {/* Resultado de última llamada */}
                <div>
                  <Label className="text-xs font-medium text-gray-700 mb-2 block">
                    Resultado de Última Llamada
                  </Label>
                  <div className="flex flex-wrap gap-1">
                    {(Object.keys(CALL_RESULT_LABELS) as CallResult[]).map(result => (
                      <Badge
                        key={result}
                        variant={filters.lastCallResult?.includes(result) ? "default" : "outline"}
                        className="cursor-pointer text-xs"
                        onClick={() => {
                          const currentResults = filters.lastCallResult || [];
                          const newResults = currentResults.includes(result)
                            ? currentResults.filter(r => r !== result)
                            : [...currentResults, result];
                          updateFilter('lastCallResult', newResults.length > 0 ? newResults : undefined);
                        }}
                      >
                        {CALL_RESULT_LABELS[result]}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* Días desde última llamada */}
                <div>
                  <Label className="text-xs font-medium text-gray-700 mb-2 block">
                    Días Desde Última Llamada
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-gray-600">Mínimo</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        className="h-8 text-xs"
                        value={filters.daysSinceLastCall?.min || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || undefined;
                          updateFilter('daysSinceLastCall', {
                            ...filters.daysSinceLastCall,
                            min: value
                          });
                        }}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Máximo</Label>
                      <Input
                        type="number"
                        placeholder="365"
                        className="h-8 text-xs"
                        value={filters.daysSinceLastCall?.max || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || undefined;
                          updateFilter('daysSinceLastCall', {
                            ...filters.daysSinceLastCall,
                            max: value
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Intentos de contacto */}
                <div>
                  <Label className="text-xs font-medium text-gray-700 mb-2 block">
                    Intentos de Contacto
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-gray-600">Mínimo</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        className="h-8 text-xs"
                        value={filters.contactAttempts?.min || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || undefined;
                          updateFilter('contactAttempts', {
                            ...filters.contactAttempts,
                            min: value
                          });
                        }}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Máximo</Label>
                      <Input
                        type="number"
                        placeholder="10"
                        className="h-8 text-xs"
                        value={filters.contactAttempts?.max || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || undefined;
                          updateFilter('contactAttempts', {
                            ...filters.contactAttempts,
                            max: value
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
            
            {/* Filtros de IA */}
            <Collapsible 
              open={expandedSections.has('ai')} 
              onOpenChange={() => toggleSection('ai')}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between h-8 px-2 text-sm">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Análisis de IA</span>
                  </div>
                  {expandedSections.has('ai') ? 
                    <ChevronUp className="h-4 w-4" /> : 
                    <ChevronDown className="h-4 w-4" />
                  }
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-3">
                {/* Qualification Score */}
                <div>
                  <Label className="text-xs font-medium text-gray-700 mb-2 block">
                    Score de Calificación: {filters.qualificationScore?.min || 0} - {filters.qualificationScore?.max || 100}
                  </Label>
                  <Slider
                    min={0}
                    max={100}
                    step={5}
                    value={[filters.qualificationScore?.min || 0, filters.qualificationScore?.max || 100]}
                    onValueChange={([min, max]) => {
                      updateFilter('qualificationScore', { min, max });
                    }}
                    className="w-full"
                  />
                </div>
                
                {/* Engagement Score */}
                <div>
                  <Label className="text-xs font-medium text-gray-700 mb-2 block">
                    Score de Engagement: {filters.engagementScore?.min || 0} - {filters.engagementScore?.max || 100}
                  </Label>
                  <Slider
                    min={0}
                    max={100}
                    step={5}
                    value={[filters.engagementScore?.min || 0, filters.engagementScore?.max || 100]}
                    onValueChange={([min, max]) => {
                      updateFilter('engagementScore', { min, max });
                    }}
                    className="w-full"
                  />
                </div>
                
                {/* Sentiment Score */}
                <div>
                  <Label className="text-xs font-medium text-gray-700 mb-2 block">
                    Score de Sentiment: {((filters.sentimentScore?.min || -1) * 100).toFixed(0)}% - {((filters.sentimentScore?.max || 1) * 100).toFixed(0)}%
                  </Label>
                  <Slider
                    min={-100}
                    max={100}
                    step={10}
                    value={[
                      (filters.sentimentScore?.min || -1) * 100, 
                      (filters.sentimentScore?.max || 1) * 100
                    ]}
                    onValueChange={([min, max]) => {
                      updateFilter('sentimentScore', { 
                        min: min / 100, 
                        max: max / 100 
                      });
                    }}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Muy Negativo</span>
                    <span>Neutral</span>
                    <span>Muy Positivo</span>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
            
            {/* Filtros de Elegibilidad */}
            <Collapsible 
              open={expandedSections.has('eligibility')} 
              onOpenChange={() => toggleSection('eligibility')}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between h-8 px-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Elegibilidad para Llamadas</span>
                  </div>
                  {expandedSections.has('eligibility') ? 
                    <ChevronUp className="h-4 w-4" /> : 
                    <ChevronDown className="h-4 w-4" />
                  }
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-3">
                <div className="grid grid-cols-2 gap-4">
                  {/* Elegible para llamadas */}
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-gray-700">
                      Solo Elegibles
                    </Label>
                    <Switch
                      checked={filters.eligibleForCall === true}
                      onCheckedChange={(checked) => {
                        updateFilter('eligibleForCall', checked ? true : undefined);
                      }}
                    />
                  </div>
                  
                  {/* No blacklisteados */}
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-gray-700">
                      Excluir Blacklist
                    </Label>
                    <Switch
                      checked={filters.blacklistedForCalls === false}
                      onCheckedChange={(checked) => {
                        updateFilter('blacklistedForCalls', checked ? false : undefined);
                      }}
                    />
                  </div>
                  
                  {/* Auto-progresión habilitada */}
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-gray-700">
                      Auto-Progresión
                    </Label>
                    <Switch
                      checked={filters.autoProgressionEnabled === true}
                      onCheckedChange={(checked) => {
                        updateFilter('autoProgressionEnabled', checked ? true : undefined);
                      }}
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
            
            {/* Filtros Temporales */}
            <Collapsible 
              open={expandedSections.has('temporal')} 
              onOpenChange={() => toggleSection('temporal')}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between h-8 px-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Filtros Temporales</span>
                  </div>
                  {expandedSections.has('temporal') ? 
                    <ChevronUp className="h-4 w-4" /> : 
                    <ChevronDown className="h-4 w-4" />
                  }
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-3">
                <div className="grid grid-cols-2 gap-4">
                  {/* Seguimientos vencidos */}
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-gray-700">
                      Seguimientos Vencidos
                    </Label>
                    <Switch
                      checked={filters.nextFollowUpDate?.overdue === true}
                      onCheckedChange={(checked) => {
                        updateFilter('nextFollowUpDate', {
                          ...filters.nextFollowUpDate,
                          overdue: checked ? true : undefined
                        });
                      }}
                    />
                  </div>
                  
                  {/* Programados para hoy */}
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-gray-700">
                      Programados Hoy
                    </Label>
                    <Switch
                      checked={filters.nextFollowUpDate?.today === true}
                      onCheckedChange={(checked) => {
                        updateFilter('nextFollowUpDate', {
                          ...filters.nextFollowUpDate,
                          today: checked ? true : undefined
                        });
                      }}
                    />
                  </div>
                  
                  {/* Nunca contactado */}
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-gray-700">
                      Nunca Contactado
                    </Label>
                    <Switch
                      checked={filters.lastContactDate?.never === true}
                      onCheckedChange={(checked) => {
                        updateFilter('lastContactDate', {
                          ...filters.lastContactDate,
                          never: checked ? true : undefined
                        });
                      }}
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </>
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center justify-center py-3">
            <RefreshCw className="h-4 w-4 animate-spin text-blue-600 mr-2" />
            <span className="text-xs text-blue-600">Aplicando filtros...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}