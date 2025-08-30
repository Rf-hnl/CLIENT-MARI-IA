/**
 * HOOK PARA AI LEAD SCORING
 * 
 * Hook personalizado para manejar el cálculo y actualización de AI Scores
 */

import { useState, useCallback } from 'react';
import { ILead } from '../types/leads';
import { 
  calculateAILeadScore, 
  updateLeadAIScore, 
  classifyLeadByScore,
  AIScoreResult 
} from '../utils/aiLeadScoring';
import { 
  updateBulkLeadScores, 
  getLeadsNeedingScoreUpdate,
  BulkUpdateResult 
} from '../utils/aiScoreUpdater';

export interface UseAILeadScoringReturn {
  // Estados
  isCalculating: boolean;
  lastUpdate: Date | null;
  
  // Funciones principales
  calculateScore: (lead: ILead) => AIScoreResult;
  updateLeadScore: (lead: ILead) => Partial<ILead>;
  classifyLead: (score: number) => ReturnType<typeof classifyLeadByScore>;
  
  // Funciones masivas
  calculateBulkScores: (leads: ILead[]) => Promise<BulkUpdateResult>;
  getLeadsNeedingUpdate: (leads: ILead[]) => ILead[];
  
  // Utilidades
  formatScoreDisplay: (score: number) => string;
  getScoreColor: (score: number) => string;
  getScoreIcon: (score: number) => string;
}

export const useAILeadScoring = (): UseAILeadScoringReturn => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Calcular score individual
  const calculateScore = useCallback((lead: ILead): AIScoreResult => {
    return calculateAILeadScore(lead);
  }, []);

  // Actualizar score de un lead
  const updateLeadScore = useCallback((lead: ILead): Partial<ILead> => {
    return updateLeadAIScore(lead);
  }, []);

  // Clasificar lead por score
  const classifyLead = useCallback((score: number) => {
    return classifyLeadByScore(score);
  }, []);

  // Cálculo masivo con estado
  const calculateBulkScores = useCallback(async (leads: ILead[]): Promise<BulkUpdateResult> => {
    setIsCalculating(true);
    
    try {
      // Simular procesamiento async para UX
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const result = updateBulkLeadScores(leads);
      setLastUpdate(new Date());
      
      return result;
    } finally {
      setIsCalculating(false);
    }
  }, []);

  // Obtener leads que necesitan actualización
  const getLeadsNeedingUpdate = useCallback((leads: ILead[]): ILead[] => {
    return getLeadsNeedingScoreUpdate(leads);
  }, []);

  // Formatear score para display
  const formatScoreDisplay = useCallback((score: number): string => {
    if (score === 0) return 'Sin calcular';
    return `${score}/100`;
  }, []);

  // Obtener color basado en score
  const getScoreColor = useCallback((score: number): string => {
    const classification = classifyLeadByScore(score);
    return classification.color;
  }, []);

  // Obtener icono basado en score
  const getScoreIcon = useCallback((score: number): string => {
    const classification = classifyLeadByScore(score);
    return classification.emoji;
  }, []);

  return {
    // Estados
    isCalculating,
    lastUpdate,
    
    // Funciones principales
    calculateScore,
    updateLeadScore,
    classifyLead,
    
    // Funciones masivas
    calculateBulkScores,
    getLeadsNeedingUpdate,
    
    // Utilidades
    formatScoreDisplay,
    getScoreColor,
    getScoreIcon
  };
};

// Hook simplificado para componentes que solo necesitan mostrar scores
export const useAIScoreDisplay = (lead: ILead) => {
  const score = lead.ai_score || 0;
  const classification = classifyLeadByScore(score);
  
  return {
    score,
    hasScore: score > 0,
    classification,
    displayText: score > 0 ? `${score}/100` : 'Sin calcular',
    breakdown: lead.ai_score_breakdown || 'No disponible',
    lastUpdated: lead.ai_score_updated_at ? 
      new Date(lead.ai_score_updated_at._seconds * 1000).toLocaleDateString() : 
      'Nunca'
  };
};