'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Target, 
  X, 
  Search,
  Filter
} from 'lucide-react';

interface AdvancedFilters {
  minScore: number;
  maxScore: number;
  sentiment: string;
  engagement: string;
  lastContactDays: number;
  selectedStatuses: string[];
  callStatus: 'all' | 'called' | 'not_called';
}

interface LeadsAdvancedFiltersProps {
  showAdvancedFilters: boolean;
  onToggleAdvancedFilters: (show: boolean) => void;
  advancedFilters: AdvancedFilters;
  onAdvancedFiltersChange: (filters: AdvancedFilters) => void;
  filteredLeads: any[];
  onApplyFilters: () => void;
  onClearFilters: () => void;
}

const statusOptions = [
  { value: 'new', label: 'Nuevos' },
  { value: 'interested', label: 'Interesados' },
  { value: 'qualified', label: 'Calificados' },
  { value: 'follow_up', label: 'Seguimiento' },
  { value: 'proposal_current', label: 'Cotizaciones' },
  { value: 'proposal_previous', label: 'Camp. Anteriores' },
  { value: 'negotiation', label: 'Negociación' },
  { value: 'nurturing', label: 'En Pausa' },
  { value: 'won', label: 'Ganados' },
  { value: 'lost', label: 'Perdidos' },
  { value: 'cold', label: 'Fríos' }
];

export function LeadsAdvancedFilters({
  showAdvancedFilters,
  onToggleAdvancedFilters,
  advancedFilters,
  onAdvancedFiltersChange,
  filteredLeads,
  onApplyFilters,
  onClearFilters
}: LeadsAdvancedFiltersProps) {
  
  const handleStatusChange = (status: string, checked: boolean) => {
    const updatedStatuses = checked
      ? [...advancedFilters.selectedStatuses, status]
      : advancedFilters.selectedStatuses.filter(s => s !== status);
    
    onAdvancedFiltersChange({
      ...advancedFilters,
      selectedStatuses: updatedStatuses
    });
  };

  return (
    <>
      {/* Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onToggleAdvancedFilters(true)}
        className="border-orange-200 text-orange-600 hover:bg-orange-50"
      >
        <Filter className="h-4 w-4 mr-2" />
        Filtros Inteligentes
      </Button>

      {/* Advanced Filters Modal */}
      {showAdvancedFilters && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <Target className="w-4 h-4 text-orange-600" />
                </div>
                <h2 className="text-xl font-light text-gray-800">
                  Filtros Inteligentes
                </h2>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onToggleAdvancedFilters(false)}
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
              >
                <X className="h-4 w-4 text-gray-400" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Score Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Puntuación */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                  <label className="text-sm font-medium text-gray-700">
                    Puntuación de Calificación
                  </label>
                </div>
                
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">Mínimo</label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={advancedFilters.minScore}
                      onChange={(e) => onAdvancedFiltersChange({
                        ...advancedFilters,
                        minScore: parseInt(e.target.value) || 0
                      })}
                      className="h-9 text-sm border-gray-200 focus:border-orange-300 focus:ring-orange-100 rounded-lg"
                    />
                  </div>
                  <span className="text-gray-400 mb-2">—</span>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">Máximo</label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={advancedFilters.maxScore}
                      onChange={(e) => onAdvancedFiltersChange({
                        ...advancedFilters,
                        maxScore: parseInt(e.target.value) || 100
                      })}
                      className="h-9 text-sm border-gray-200 focus:border-orange-300 focus:ring-orange-100 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Sentiment */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                  <label className="text-sm font-medium text-gray-700">
                    Análisis de Sentimiento
                  </label>
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: 'all', label: 'Todos', color: 'gray' },
                    { value: 'positive', label: 'Positivo', color: 'green' },
                    { value: 'neutral', label: 'Neutral', color: 'yellow' },
                    { value: 'negative', label: 'Negativo', color: 'red' }
                  ].map((sentiment) => (
                    <div 
                      key={sentiment.value}
                      className={`p-3 rounded-lg cursor-pointer transition-all border text-center ${
                        advancedFilters.sentiment === sentiment.value
                          ? 'bg-orange-50 border-orange-200 shadow-sm'
                          : 'bg-gray-50 border-gray-200 hover:border-orange-200'
                      }`}
                      onClick={() => onAdvancedFiltersChange({
                        ...advancedFilters,
                        sentiment: sentiment.value
                      })}
                    >
                      <div className={`h-3 w-3 rounded-full mx-auto mb-2 ${
                        sentiment.color === 'gray' ? 'bg-gray-400' :
                        sentiment.color === 'green' ? 'bg-green-500' :
                        sentiment.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <span className="text-xs font-medium text-gray-700">{sentiment.label}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Último Contacto y Estado de Llamadas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Último Contacto */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                  <label className="text-sm font-medium text-gray-700">Último Contacto</label>
                </div>
                
                <div className="flex items-center gap-3">
                  <label className="text-xs text-gray-500 whitespace-nowrap">Días desde contacto</label>
                  <Input
                    type="number"
                    min="1"
                    value={advancedFilters.lastContactDays}
                    onChange={(e) => onAdvancedFiltersChange({
                      ...advancedFilters,
                      lastContactDays: parseInt(e.target.value) || 30
                    })}
                    className="h-9 w-20 text-sm border-gray-200 focus:border-orange-300 focus:ring-orange-100 rounded-lg text-center"
                  />
                </div>
              </div>

              {/* Estado de Llamadas */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                  <label className="text-sm font-medium text-gray-700">Estado de Llamadas</label>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'all', label: 'Todos' },
                    { value: 'called', label: 'Llamados' },
                    { value: 'not_called', label: 'Sin Llamar' }
                  ].map((callOption) => (
                    <div 
                      key={callOption.value}
                      className={`p-3 rounded-lg cursor-pointer transition-all border text-center ${
                        advancedFilters.callStatus === callOption.value
                          ? 'bg-orange-50 border-orange-200 shadow-sm'
                          : 'bg-gray-50 border-gray-200 hover:border-orange-200'
                      }`}
                      onClick={() => onAdvancedFiltersChange({
                        ...advancedFilters,
                        callStatus: callOption.value as 'all' | 'called' | 'not_called'
                      })}
                    >
                      <div className="text-sm font-medium text-gray-700">
                        {callOption.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Estados */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                  <label className="text-sm font-medium text-gray-700">Estados del Lead</label>
                </div>
                {advancedFilters.selectedStatuses.length > 0 && (
                  <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                    {advancedFilters.selectedStatuses.length} seleccionados
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                {statusOptions.map((status) => (
                  <div 
                    key={status.value}
                    className={`p-3 rounded-lg cursor-pointer transition-all border text-center ${
                      advancedFilters.selectedStatuses.includes(status.value)
                        ? 'bg-orange-50 border-orange-200 shadow-sm'
                        : 'bg-white border-gray-200 hover:border-orange-200'
                    }`}
                    onClick={() => handleStatusChange(status.value, !advancedFilters.selectedStatuses.includes(status.value))}
                  >
                    <div className="text-sm font-medium text-gray-700">
                      {status.label}
                    </div>
                  </div>
                ))}
              </div>
              
              {advancedFilters.selectedStatuses.length > 0 && (
                <div className="flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-orange-600 hover:bg-orange-50"
                    onClick={() => onAdvancedFiltersChange({
                      ...advancedFilters,
                      selectedStatuses: []
                    })}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Limpiar Estados
                  </Button>
                </div>
              )}
            </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3 p-6 border-t border-gray-100 bg-gray-50">
              <Button 
                className="flex-1 h-11 bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
                onClick={() => {
                  onApplyFilters();
                  onToggleAdvancedFilters(false);
                }}
              >
                <Target className="h-4 w-4 mr-2" />
                Aplicar Filtros ({filteredLeads.length})
              </Button>
              <Button 
                variant="outline" 
                className="h-11 border-gray-200 text-gray-600 hover:bg-white px-6 rounded-xl transition-all duration-200"
                onClick={onClearFilters}
              >
                Limpiar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}