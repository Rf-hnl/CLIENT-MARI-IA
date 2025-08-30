/**
 * USE PERSONALIZATION HOOK
 * 
 * Hook personalizado para gestionar el estado de personalización de llamadas
 * Incluye generación de scripts, análisis de contexto y gestión de templates
 */

"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  PersonalizedScript,
  ContextAnalysis,
  PersonalizationRequest,
  PersonalizationResult,
  UsePersonalizationReturn,
  CallObjective,
  PersonalizationStrategy,
  PersonalizationAnalytics
} from '@/types/personalization';

interface UsePersonalizationProps {
  tenantId: string;
  organizationId: string;
  userId: string;
}

export function usePersonalization({
  tenantId,
  organizationId,
  userId
}: UsePersonalizationProps): UsePersonalizationReturn {
  // Estados principales
  const [script, setScript] = useState<PersonalizedScript | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<PersonalizationAnalytics | null>(null);

  // Estados de templates
  const [templates, setTemplates] = useState<any[]>([]); // TODO: Implementar ScriptTemplate
  const [abTests, setAbTests] = useState<any[]>([]); // TODO: Implementar ABTest

  /**
   * Generar script personalizado para un lead
   */
  const generateScript = useCallback(async (request: PersonalizationRequest): Promise<PersonalizationResult> => {
    try {
      setIsGenerating(true);
      setError(null);

      console.log('🎯 [usePersonalization] Generating script for lead:', request.leadContext.leadId.slice(0, 8) + '...');

      const response = await fetch('/api/calls/personalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          leadId: request.leadContext.leadId,
          tenantId,
          organizationId,
          callObjective: request.callObjective,
          preferredStrategy: request.preferredStrategy,
          maxScriptLength: request.maxScriptLength,
          includeObjectionHandling: request.includeObjectionHandling,
          includeValueProps: request.includeValueProps,
          includeSocialProof: request.includeSocialProof,
          customInstructions: request.customInstructions
        })
      });

      const data = await response.json();

      if (data.success) {
        const generatedScript: PersonalizedScript = {
          ...data.script,
          createdAt: new Date(data.script.createdAt)
        };

        setScript(generatedScript);

        console.log('✅ [usePersonalization] Script generated successfully:', {
          scriptId: generatedScript.id,
          confidence: data.metadata.confidence
        });

        return {
          success: true,
          script: generatedScript,
          processingTime: data.metadata.processingTime,
          tokensUsed: data.metadata.tokensUsed,
          confidence: data.metadata.confidence,
          recommendations: data.recommendations,
          warnings: data.warnings
        };
      } else {
        const error = data.error || 'Failed to generate script';
        setError(error);
        
        return {
          success: false,
          error,
          processingTime: data.processingTime || 0,
          tokensUsed: 0,
          confidence: 0
        };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      
      console.error('❌ [usePersonalization] Error generating script:', error);
      
      return {
        success: false,
        error: errorMessage,
        processingTime: 0,
        tokensUsed: 0,
        confidence: 0
      };
    } finally {
      setIsGenerating(false);
    }
  }, [tenantId, organizationId]);

  /**
   * Actualizar script existente
   */
  const updateScript = useCallback(async (
    scriptId: string, 
    updates: Partial<PersonalizedScript>
  ): Promise<void> => {
    try {
      console.log('📝 [usePersonalization] Updating script:', scriptId);

      // TODO: Implementar endpoint de actualización
      // const response = await fetch(`/api/calls/scripts/${scriptId}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(updates)
      // });

      // Por ahora, actualizar localmente
      if (script && script.id === scriptId) {
        setScript({
          ...script,
          ...updates,
          updatedAt: new Date()
        } as PersonalizedScript);
      }

      console.log('✅ [usePersonalization] Script updated successfully');

    } catch (error) {
      console.error('❌ [usePersonalization] Error updating script:', error);
      throw error;
    }
  }, [script]);

  /**
   * Analizar contexto de un lead
   */
  const analyzeContext = useCallback(async (leadId: string): Promise<ContextAnalysis> => {
    try {
      console.log('🔍 [usePersonalization] Analyzing context for lead:', leadId.slice(0, 8) + '...');

      const response = await fetch('/api/calls/analyze-context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          leadId,
          tenantId,
          organizationId
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ [usePersonalization] Context analysis completed');
        return data.contextAnalysis;
      } else {
        throw new Error(data.error || 'Failed to analyze context');
      }

    } catch (error) {
      console.error('❌ [usePersonalization] Error analyzing context:', error);
      throw error;
    }
  }, [tenantId, organizationId]);

  /**
   * Cargar templates disponibles
   */
  const loadTemplates = useCallback(async (): Promise<void> => {
    try {
      console.log('📋 [usePersonalization] Loading templates');

      // TODO: Implementar endpoint de templates
      // const response = await fetch(`/api/calls/templates?tenantId=${tenantId}&organizationId=${organizationId}`);
      // const data = await response.json();
      
      // Por ahora, usar datos mock
      const mockTemplates: any[] = [
        {
          id: 'template_1',
          name: 'Prospección Consultiva',
          description: 'Template para llamadas de prospección con enfoque consultivo',
          strategy: 'consultative',
          objective: 'prospecting',
          usageCount: 45,
          successRate: 78
        },
        {
          id: 'template_2', 
          name: 'Demo Directa',
          description: 'Template directo para programar demostraciones',
          strategy: 'direct',
          objective: 'demo_scheduling',
          usageCount: 32,
          successRate: 85
        }
      ];

      setTemplates(mockTemplates);
      console.log(`✅ [usePersonalization] Loaded ${mockTemplates.length} templates`);

    } catch (error) {
      console.error('❌ [usePersonalization] Error loading templates:', error);
    }
  }, [tenantId, organizationId]);

  /**
   * Crear nuevo template
   */
  const createTemplate = useCallback(async (template: any): Promise<string> => {
    try {
      console.log('📝 [usePersonalization] Creating new template:', template.name);

      // TODO: Implementar endpoint de creación de templates
      const templateId = `template_${Date.now()}`;
      
      const newTemplate = {
        ...template,
        id: templateId,
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
        isActive: true
      };

      setTemplates(prev => [...prev, newTemplate]);
      
      console.log('✅ [usePersonalization] Template created:', templateId);
      return templateId;

    } catch (error) {
      console.error('❌ [usePersonalization] Error creating template:', error);
      throw error;
    }
  }, []);

  /**
   * Crear A/B Test
   */
  const createABTest = useCallback(async (test: any): Promise<string> => {
    try {
      console.log('🧪 [usePersonalization] Creating A/B test:', test.name);

      // TODO: Implementar endpoint de A/B tests
      const testId = `test_${Date.now()}`;
      
      const newTest = {
        ...test,
        id: testId,
        createdAt: new Date(),
        status: 'draft'
      };

      setAbTests(prev => [...prev, newTest]);
      
      console.log('✅ [usePersonalization] A/B test created:', testId);
      return testId;

    } catch (error) {
      console.error('❌ [usePersonalization] Error creating A/B test:', error);
      throw error;
    }
  }, []);

  /**
   * Obtener resultados de A/B test
   */
  const getABTestResults = useCallback(async (testId: string): Promise<any> => {
    try {
      console.log('📊 [usePersonalization] Getting A/B test results:', testId);

      // TODO: Implementar endpoint de resultados
      const mockResults = {
        totalParticipants: 100,
        variantResults: {
          control: { participants: 50, primaryMetricValue: 0.65, conversionRate: 0.32 },
          variant_a: { participants: 50, primaryMetricValue: 0.78, conversionRate: 0.41 }
        },
        statisticalSignificance: true,
        winningVariant: 'variant_a',
        improvementPercentage: 28.1
      };

      console.log('✅ [usePersonalization] A/B test results retrieved');
      return mockResults;

    } catch (error) {
      console.error('❌ [usePersonalization] Error getting A/B test results:', error);
      throw error;
    }
  }, []);

  /**
   * Cargar analytics de personalización
   */
  const loadAnalytics = useCallback(async (
    period: 'daily' | 'weekly' | 'monthly'
  ): Promise<void> => {
    try {
      console.log('📈 [usePersonalization] Loading analytics for period:', period);

      // TODO: Implementar endpoint de analytics
      const mockAnalytics: PersonalizationAnalytics = {
        period,
        startDate: new Date(Date.now() - (period === 'daily' ? 86400000 : period === 'weekly' ? 604800000 : 2592000000)),
        endDate: new Date(),
        
        totalScriptsGenerated: 156,
        totalCallsWithPersonalization: 134,
        uniqueLeadsPersonalized: 98,
        
        averagePersonalizationScore: 84,
        scriptUsageRate: 86, // 86% de scripts generados fueron usados
        scriptModificationRate: 23, // 23% fueron modificados por usuarios
        
        personalizedCallSuccessRate: 78,
        nonPersonalizedCallSuccessRate: 52,
        improvementPercentage: 50, // 50% mejor que no personalizadas
        averageSentimentImprovement: 0.23,
        averageEngagementImprovement: 15,
        
        strategyPerformance: {
          consultative: {
            usageCount: 45,
            successRate: 82,
            averageSentiment: 0.71,
            averageEngagement: 78,
            averageDuration: 8.5,
            topIndustries: ['Technology', 'Finance'],
            topRoles: ['CTO', 'Director']
          },
          direct: {
            usageCount: 38,
            successRate: 75,
            averageSentiment: 0.65,
            averageEngagement: 72,
            averageDuration: 6.2,
            topIndustries: ['Retail', 'Manufacturing'],
            topRoles: ['CEO', 'Manager']
          },
          educational: {
            usageCount: 29,
            successRate: 79,
            averageSentiment: 0.68,
            averageEngagement: 74,
            averageDuration: 9.1,
            topIndustries: ['Healthcare', 'Education'],
            topRoles: ['Director', 'VP']
          },
          relationship: {
            usageCount: 22,
            successRate: 85,
            averageSentiment: 0.76,
            averageEngagement: 81,
            averageDuration: 11.3,
            topIndustries: ['Services', 'Consulting'],
            topRoles: ['Partner', 'Principal']
          },
          urgency: {
            usageCount: 15,
            successRate: 69,
            averageSentiment: 0.58,
            averageEngagement: 65,
            averageDuration: 5.8,
            topIndustries: ['Startup', 'SMB'],
            topRoles: ['Founder', 'Owner']
          },
          social_proof: {
            usageCount: 7,
            successRate: 72,
            averageSentiment: 0.63,
            averageEngagement: 68,
            averageDuration: 7.4,
            topIndustries: ['Enterprise', 'Government'],
            topRoles: ['Executive', 'Decision Maker']
          }
        },
        
        objectivePerformance: {
          prospecting: {
            usageCount: 62,
            achievementRate: 71,
            averageTimeToAchieve: 8.5,
            commonSuccessFactors: ['Strong opening', 'Relevant pain points'],
            commonFailureReasons: ['Generic approach', 'Poor timing']
          },
          qualification: {
            usageCount: 28,
            achievementRate: 84,
            averageTimeToAchieve: 6.2,
            commonSuccessFactors: ['Good discovery questions', 'Active listening'],
            commonFailureReasons: ['Rushed qualification', 'Missing context']
          },
          demo_scheduling: {
            usageCount: 35,
            achievementRate: 78,
            averageTimeToAchieve: 4.8,
            commonSuccessFactors: ['Clear value prop', 'Convenience focus'],
            commonFailureReasons: ['Unclear next steps', 'No urgency']
          },
          follow_up: {
            usageCount: 19,
            achievementRate: 73,
            averageTimeToAchieve: 5.5,
            commonSuccessFactors: ['Referenced previous conversation', 'Added value'],
            commonFailureReasons: ['Generic follow-up', 'No new information']
          },
          closing: {
            usageCount: 8,
            achievementRate: 89,
            averageTimeToAchieve: 12.3,
            commonSuccessFactors: ['Handled objections well', 'Clear proposal'],
            commonFailureReasons: ['Pushy approach', 'Unresolved concerns']
          },
          reactivation: {
            usageCount: 12,
            achievementRate: 58,
            averageTimeToAchieve: 9.7,
            commonSuccessFactors: ['Acknowledged gap', 'New value added'],
            commonFailureReasons: ['Same old pitch', 'No acknowledgment']
          },
          objection_handling: {
            usageCount: 6,
            achievementRate: 67,
            averageTimeToAchieve: 7.8,
            commonSuccessFactors: ['Empathetic response', 'Specific examples'],
            commonFailureReasons: ['Defensive tone', 'Generic responses']
          },
          nurturing: {
            usageCount: 14,
            achievementRate: 82,
            averageTimeToAchieve: 3.2,
            commonSuccessFactors: ['Valuable insights', 'No pressure'],
            commonFailureReasons: ['Too sales-focused', 'Irrelevant content']
          }
        },
        
        activeABTests: 3,
        completedABTests: 8,
        significantFindings: 5,
        
        generatedAt: new Date()
      };

      setAnalytics(mockAnalytics);
      console.log('✅ [usePersonalization] Analytics loaded successfully');

    } catch (error) {
      console.error('❌ [usePersonalization] Error loading analytics:', error);
    }
  }, []);

  /**
   * Cargar templates al montar el componente
   */
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  return {
    // State
    script,
    isGenerating,
    error,
    analytics,

    // Actions
    generateScript,
    updateScript,
    analyzeContext,

    // Templates
    templates,
    loadTemplates,
    createTemplate,

    // A/B Testing
    abTests,
    createABTest,
    getABTestResults,

    // Analytics
    loadAnalytics
  };
}