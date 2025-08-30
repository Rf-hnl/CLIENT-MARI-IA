/**
 * AI SCORE UPDATER
 * 
 * Utilidad para actualizar masivamente los AI Scores de leads existentes
 * Puede procesar uno o múltiples leads
 */

import { ILead } from '../types/leads';
import { updateLeadAIScore, calculateAILeadScore } from './aiLeadScoring';

export interface ScoreUpdateResult {
  leadId: string;
  oldScore?: number;
  newScore: number;
  updated: boolean;
  error?: string;
}

export interface BulkUpdateResult {
  total: number;
  updated: number;
  errors: number;
  results: ScoreUpdateResult[];
  summary: {
    averageScore: number;
    hotLeads: number; // score >= 70
    warmLeads: number; // score 40-69
    coldLeads: number; // score < 40
  };
}

/**
 * Actualizar AI Score de un solo lead
 */
export const updateSingleLeadScore = (lead: ILead): ScoreUpdateResult => {
  try {
    const oldScore = lead.ai_score;
    const aiResult = calculateAILeadScore(lead);
    
    return {
      leadId: lead.id,
      oldScore,
      newScore: aiResult.score,
      updated: true
    };
  } catch (error) {
    return {
      leadId: lead.id,
      oldScore: lead.ai_score,
      newScore: 0,
      updated: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};

/**
 * Actualizar AI Scores de múltiples leads
 */
export const updateBulkLeadScores = (leads: ILead[]): BulkUpdateResult => {
  const results: ScoreUpdateResult[] = [];
  let totalScore = 0;
  let hotCount = 0;
  let warmCount = 0;
  let coldCount = 0;
  
  // Procesar cada lead
  leads.forEach(lead => {
    const result = updateSingleLeadScore(lead);
    results.push(result);
    
    if (result.updated) {
      totalScore += result.newScore;
      
      // Categorizar
      if (result.newScore >= 70) hotCount++;
      else if (result.newScore >= 40) warmCount++;
      else coldCount++;
    }
  });
  
  const updated = results.filter(r => r.updated).length;
  const errors = results.filter(r => !r.updated).length;
  
  return {
    total: leads.length,
    updated,
    errors,
    results,
    summary: {
      averageScore: updated > 0 ? Math.round(totalScore / updated) : 0,
      hotLeads: hotCount,
      warmLeads: warmCount,
      coldLeads: coldCount
    }
  };
};

/**
 * Obtener datos para actualización masiva (formato para Firebase)
 */
export const getLeadsWithUpdatedScores = (leads: ILead[]): Array<{
  id: string;
  updateData: Partial<ILead>;
}> => {
  return leads.map(lead => {
    const updateData = updateLeadAIScore(lead);
    return {
      id: lead.id,
      updateData
    };
  });
};

/**
 * Filtrar leads que necesitan actualización de score
 */
export const getLeadsNeedingScoreUpdate = (leads: ILead[]): ILead[] => {
  const now = Date.now();
  const oneDayAgo = now - (24 * 60 * 60 * 1000); // 24 horas atrás
  
  return leads.filter(lead => {
    // Si no tiene AI score, necesita actualización
    if (!lead.ai_score_updated_at) return true;
    
    // Si el score fue actualizado hace más de 24 horas
    const lastUpdate = lead.ai_score_updated_at._seconds * 1000;
    if (lastUpdate < oneDayAgo) return true;
    
    // Si los datos del lead han cambiado después de la última actualización del score
    if (lead.updated_at._seconds * 1000 > lastUpdate) return true;
    
    return false;
  });
};

/**
 * Generar reporte de scores
 */
export const generateScoreReport = (results: BulkUpdateResult): string => {
  const { total, updated, errors, summary } = results;
  
  const report = [
    `📊 REPORTE DE AI SCORES`,
    ``,
    `📈 Estadísticas:`,
    `• Total procesados: ${total}`,
    `• Actualizados: ${updated}`,
    `• Errores: ${errors}`,
    `• Score promedio: ${summary.averageScore}/100`,
    ``,
    `🎯 Distribución:`,
    `• 🔥 Leads Calientes (70-100): ${summary.hotLeads}`,
    `• 🌡️ Leads Tibios (40-69): ${summary.warmLeads}`,
    `• ❄️ Leads Fríos (0-39): ${summary.coldLeads}`,
    ``,
    `💡 Recomendaciones:`,
    summary.hotLeads > 0 ? `• Priorizar ${summary.hotLeads} leads calientes` : '',
    summary.warmLeads > 0 ? `• Nutrir ${summary.warmLeads} leads tibios` : '',
    summary.coldLeads > 0 ? `• Revisar estrategia para ${summary.coldLeads} leads fríos` : ''
  ].filter(line => line !== '').join('\n');
  
  return report;
};

/**
 * Validar que un lead tenga datos mínimos para calcular score
 */
export const validateLeadForScoring = (lead: ILead): { 
  isValid: boolean; 
  missingFields: string[];
  canCalculateScore: boolean;
} => {
  const missingFields: string[] = [];
  
  // Campos requeridos para cálculo básico
  if (!lead.phone) missingFields.push('teléfono');
  if (!lead.source) missingFields.push('fuente');
  if (!lead.created_at) missingFields.push('fecha de creación');
  
  // Campos recomendados
  const recommendedFields = [];
  if (!lead.email) recommendedFields.push('email');
  if (!lead.company) recommendedFields.push('empresa');
  
  const isValid = missingFields.length === 0;
  const canCalculateScore = isValid; // Con datos mínimos podemos calcular
  
  return {
    isValid,
    missingFields: [...missingFields, ...recommendedFields],
    canCalculateScore
  };
};