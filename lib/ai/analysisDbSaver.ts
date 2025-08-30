import { prisma } from '@/lib/prisma';

/**
 * Utility function to save individual analysis results to the database
 */
export async function saveAnalysisToDatabase(
  analysisType: string,
  analysisData: any,
  conversationId: string,
  tenantId: string,
  leadId: string,
  aiResponse: any
) {
  try {
    // 1. Buscar análisis existente o crear uno nuevo
    let existingAnalysis = await prisma.conversationAnalysis.findFirst({
      where: {
        conversationId: conversationId,
        tenantId: tenantId
      }
    });

    // 2. Mapping de tipos de análisis a campos de la base de datos
    const getUpdateData = (type: string, data: any, existingRawInsights: any = {}) => {
      const baseUpdate = {
        rawInsights: {
          ...existingRawInsights,
          [type]: data
        },
        updatedAt: new Date()
      };

      // Mapear campos específicos según el tipo de análisis
      switch (type) {
        case 'sentiment':
          return {
            ...baseUpdate,
            overallSentiment: data.overall,
            sentimentScore: data.score,
            sentimentConfidence: data.confidence,
          };
        
        case 'quality':
          return {
            ...baseUpdate,
            callQualityScore: data.overall,
            agentPerformanceScore: data.agentPerformance,
            conversationFlow: data.conversationFlow,
          };
        
        case 'insights':
          return {
            ...baseUpdate,
            keyTopics: data.keyTopics,
            mainPainPoints: data.painPoints,
            buyingSignals: data.buyingSignals,
            objections: data.objections,
          };
        
        case 'engagement':
          return {
            ...baseUpdate,
            engagementScore: data.score,
            leadInterestLevel: data.interestLevel,
            responseQuality: data.responseQuality,
          };
        
        case 'predictions':
          return {
            ...baseUpdate,
            conversionLikelihood: data.conversionLikelihood,
            recommendedAction: data.recommendedAction,
            urgencyLevel: data.urgencyLevel,
            followUpTimeline: data.followUpTimeline,
          };
        
        case 'metrics':
          return {
            ...baseUpdate,
            questionAsked: data.questionsAsked,
            questionsAnswered: data.questionsAnswered,
            interruptionCount: data.interruptionCount,
            talkTimeRatio: data.talkTimeRatio,
          };
        
        default:
          // Para tipos como 'messages', 'actions', etc. que solo se guardan en rawInsights
          return baseUpdate;
      }
    };

    // 3. Actualizar o crear análisis
    let savedAnalysis;
    if (existingAnalysis) {
      // Actualizar análisis existente
      const updateData = getUpdateData(analysisType, analysisData, existingAnalysis.rawInsights);
      
      savedAnalysis = await prisma.conversationAnalysis.update({
        where: { id: existingAnalysis.id },
        data: updateData
      });
    } else {
      // Crear nuevo análisis
      const baseData = {
        tenantId: tenantId,
        organizationId: tenantId, // usando tenantId como fallback
        leadId,
        conversationId,
        analysisModel: aiResponse.model || 'unknown',
        analysisVersion: '1.0',
        processingTime: Date.now(),
        rawInsights: {
          [analysisType]: analysisData
        }
      };

      // Agregar campos específicos según el tipo
      const updateData = getUpdateData(analysisType, analysisData, {});
      const createData = { ...baseData, ...updateData };
      // Remover rawInsights duplicado y usar el del updateData
      delete createData.updatedAt; // No necesario en create

      savedAnalysis = await prisma.conversationAnalysis.create({
        data: createData
      });
    }

    console.log(`✅ [${analysisType.toUpperCase()} ANALYSIS] Analysis saved to database:`, savedAnalysis.id);
    return savedAnalysis;

  } catch (error) {
    console.error(`❌ [${analysisType.toUpperCase()} ANALYSIS] Error saving to database:`, error);
    throw error;
  }
}