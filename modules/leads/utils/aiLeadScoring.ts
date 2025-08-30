/**
 * AI LEAD SCORING SYSTEM
 * 
 * Calcula automáticamente un puntaje de 0-100 para cada lead
 * Algoritmo simple pero efectivo usando datos existentes
 */

import { ILead, LeadSource, IFirebaseTimestamp } from '../types/leads';

export interface AIScoreResult {
  score: number; // 0-100
  factors: {
    data_completeness: number; // 0-40 points
    source_quality: number; // 0-30 points
    engagement_level: number; // 0-20 points
    timing_factor: number; // 0-10 points
  };
  breakdown: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * FACTOR 1: COMPLETITUD DE DATOS (40% del score)
 * Más datos = más probabilidad de conversión
 */
export const calculateDataCompleteness = (lead: ILead): number => {
  let points = 0;
  
  // Datos críticos (20 puntos)
  if (lead.phone && lead.phone !== 'Sin teléfono') points += 10;
  if (lead.email && lead.email !== 'Sin email') points += 10;
  
  // Datos importantes (15 puntos)
  if (lead.company && lead.company !== 'Empresa sin nombre') points += 5;
  if (lead.position && lead.position !== 'Sin posición') points += 5;
  if (lead.national_id) points += 5;
  
  // Datos adicionales (5 puntos)
  if (lead.address) points += 1;
  if (lead.city) points += 1;
  if (lead.budget_range) points += 1;
  if (lead.decision_timeline) points += 1;
  if (lead.best_contact_time) points += 1;
  
  return Math.min(points, 40); // Máximo 40 puntos
};

/**
 * FACTOR 2: CALIDAD DE LA FUENTE (30% del score)
 * Algunas fuentes convierten mejor que otras
 */
export const calculateSourceQuality = (source: LeadSource): number => {
  const sourceValues: Record<LeadSource, number> = {
    referral: 30,        // Referidos = mejor conversión
    website: 25,         // Web = buena intención
    social_media: 20,    // Redes = interés moderado
    email: 18,          // Email = engagement medio
    event: 15,          // Eventos = variable
    whatsapp: 12,       // WhatsApp = casual
    advertisement: 10,   // Publicidad = menos calificado
    cold_call: 8,       // Llamada fría = resistencia
    other: 5            // Otros = desconocido
  };
  
  return sourceValues[source] || 5;
};

/**
 * FACTOR 3: NIVEL DE ENGAGEMENT (20% del score)
 * Interacciones y respuestas del lead
 */
export const calculateEngagementLevel = (lead: ILead): number => {
  let points = 0;
  
  // Response rate (10 puntos)
  const responseRate = lead.response_rate || 0;
  points += Math.round((responseRate / 100) * 10);
  
  // Contact attempts vs responses (5 puntos)
  const attempts = lead.contactAttempts || 0;
  if (attempts > 0 && responseRate > 50) points += 5;
  else if (attempts > 0 && responseRate > 25) points += 3;
  else if (attempts > 0 && responseRate > 0) points += 1;
  
  // Interest level (5 puntos)
  const interestLevel = lead.interest_level || 1;
  points += interestLevel; // 1-5 puntos directos
  
  return Math.min(points, 20); // Máximo 20 puntos
};

/**
 * FACTOR 4: FACTOR DE TIEMPO (10% del score)
 * Leads recientes son más valiosos
 */
export const calculateTimingFactor = (lead: ILead): number => {
  const now = Date.now();
  const createdAt = lead.created_at._seconds * 1000;
  const daysOld = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
  
  // Puntuación basada en antiguedad
  if (daysOld <= 1) return 10;      // Menos de 1 día = 10 puntos
  if (daysOld <= 3) return 8;       // 1-3 días = 8 puntos
  if (daysOld <= 7) return 6;       // 3-7 días = 6 puntos
  if (daysOld <= 14) return 4;      // 1-2 semanas = 4 puntos
  if (daysOld <= 30) return 2;      // 2-4 semanas = 2 puntos
  return 1;                         // Más de 1 mes = 1 punto
};

/**
 * FUNCIÓN PRINCIPAL: Calcular AI Score completo
 */
export const calculateAILeadScore = (lead: ILead): AIScoreResult => {
  // Calcular cada factor
  const dataCompleteness = calculateDataCompleteness(lead);
  const sourceQuality = calculateSourceQuality(lead.source);
  const engagementLevel = calculateEngagementLevel(lead);
  const timingFactor = calculateTimingFactor(lead);
  
  // Sumar puntuación total
  const totalScore = dataCompleteness + sourceQuality + engagementLevel + timingFactor;
  
  // Generar explicación
  const breakdown = generateScoreBreakdown({
    dataCompleteness,
    sourceQuality,
    engagementLevel,
    timingFactor,
    totalScore
  });
  
  // Determinar confianza
  const confidence = determineConfidence(lead, totalScore);
  
  return {
    score: Math.min(totalScore, 100), // Asegurar máximo 100
    factors: {
      data_completeness: dataCompleteness,
      source_quality: sourceQuality,
      engagement_level: engagementLevel,
      timing_factor: timingFactor
    },
    breakdown,
    confidence
  };
};

/**
 * Generar explicación legible del score
 */
const generateScoreBreakdown = (factors: {
  dataCompleteness: number;
  sourceQuality: number;
  engagementLevel: number;
  timingFactor: number;
  totalScore: number;
}): string => {
  const parts = [];
  
  // Datos
  if (factors.dataCompleteness >= 30) parts.push("✅ Datos completos");
  else if (factors.dataCompleteness >= 20) parts.push("⚠️ Datos parciales");
  else parts.push("❌ Datos insuficientes");
  
  // Fuente
  if (factors.sourceQuality >= 25) parts.push("🔥 Fuente premium");
  else if (factors.sourceQuality >= 15) parts.push("👍 Fuente buena");
  else parts.push("📢 Fuente básica");
  
  // Engagement
  if (factors.engagementLevel >= 15) parts.push("🎯 Alto engagement");
  else if (factors.engagementLevel >= 10) parts.push("📈 Engagement moderado");
  else parts.push("💤 Bajo engagement");
  
  // Timing
  if (factors.timingFactor >= 8) parts.push("⚡ Lead reciente");
  else if (factors.timingFactor >= 4) parts.push("🕐 Lead moderado");
  else parts.push("⏰ Lead antiguo");
  
  return parts.join(" • ");
};

/**
 * Determinar nivel de confianza en el score
 */
const determineConfidence = (lead: ILead, score: number): 'high' | 'medium' | 'low' => {
  const hasGoodData = lead.email && lead.phone && lead.company;
  const hasInteractions = (lead.contactAttempts || 0) > 0;
  
  if (hasGoodData && hasInteractions && score >= 60) return 'high';
  if (hasGoodData && score >= 40) return 'medium';
  return 'low';
};

/**
 * Función helper para actualizar el AI Score en un lead
 */
export const updateLeadAIScore = (lead: ILead): Partial<ILead> => {
  const aiResult = calculateAILeadScore(lead);
  
  return {
    ai_score: aiResult.score,
    ai_score_updated_at: {
      _seconds: Math.floor(Date.now() / 1000),
      _nanoseconds: 0
    } as IFirebaseTimestamp,
    ai_score_factors: aiResult.factors,
    ai_score_breakdown: aiResult.breakdown
  };
};

/**
 * Clasificar leads por score
 */
export const classifyLeadByScore = (score: number): {
  level: 'hot' | 'warm' | 'cold';
  color: string;
  label: string;
  emoji: string;
} => {
  if (score >= 70) {
    return {
      level: 'hot',
      color: 'text-red-600 bg-red-50',
      label: 'Lead Caliente',
      emoji: '🔥'
    };
  } else if (score >= 40) {
    return {
      level: 'warm',
      color: 'text-orange-600 bg-orange-50',
      label: 'Lead Tibio',
      emoji: '🌡️'
    };
  } else {
    return {
      level: 'cold',
      color: 'text-blue-600 bg-blue-50',
      label: 'Lead Frío',
      emoji: '❄️'
    };
  }
};