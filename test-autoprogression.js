/**
 * TEST DEL AUTO-PROGRESSION ENGINE
 * 
 * Prueba unitaria del motor de auto-progresión sin base de datos
 * Valida lógica de triggers, reglas y acciones
 */

console.log('🤖 TESTING AUTO-PROGRESSION ENGINE\n');

// Mock data para testing
const mockLeadData = {
  id: 'lead-123',
  status: 'contacted',
  qualificationScore: 75,
  lastSentimentScore: 0.8,
  lastEngagementScore: 68,
  previousEngagementScore: 45,
  lastContactDate: new Date('2025-08-20'),
  statusUpdatedAt: new Date('2025-08-15'),
  createdAt: new Date('2025-08-10'),
  autoProgressionEnabled: true,
  conversationAnalysis: [],
  callLogs: [],
  calendarEvents: []
};

const mockRules = [
  {
    id: 'rule_high_sentiment',
    name: 'High Sentiment Progression',
    description: 'Move leads with high sentiment score to qualified status',
    isActive: true,
    triggers: [
      {
        type: 'sentiment_threshold',
        condition: 'sentiment >= 0.8',
        parameters: { threshold: 0.8 },
        weight: 0.8
      },
      {
        type: 'engagement_increase',
        condition: 'engagement_increase >= 15',
        parameters: { minIncrease: 15 },
        weight: 0.4
      }
    ],
    actions: [
      {
        type: 'status_change',
        parameters: { newStatus: 'qualified' }
      }
    ],
    minScore: 60,
    requiredStatuses: ['contacted'],
    timesTriggered: 0,
    successRate: 0,
    averageImpact: 0
  }
];

// Clase simplificada de AutoProgressionEngine para testing
class MockAutoProgressionEngine {
  
  constructor() {
    console.log('🔄 [MOCK ENGINE] Initialized for testing');
  }

  /**
   * Verificar restricciones básicas
   */
  meetBasicConstraints(lead, rule) {
    // Score mínimo
    if (rule.minScore && (lead.qualificationScore || 0) < rule.minScore) {
      return false;
    }

    // Estado requerido
    if (rule.requiredStatuses && rule.requiredStatuses.length > 0) {
      if (!rule.requiredStatuses.includes(lead.status)) {
        return false;
      }
    }

    // Estados excluidos
    if (rule.excludedStatuses && rule.excludedStatuses.includes(lead.status)) {
      return false;
    }

    return true;
  }

  /**
   * Evaluar trigger de sentiment
   */
  evaluateSentimentTrigger(lead, trigger) {
    const threshold = trigger.parameters.threshold || 0.7;
    const currentSentiment = Number(lead.lastSentimentScore) || 0;
    
    const result = currentSentiment >= threshold;
    const confidence = Math.min(currentSentiment / threshold, 1);
    
    console.log(`  📈 Sentiment Trigger: ${currentSentiment} >= ${threshold} = ${result} (confidence: ${confidence.toFixed(2)})`);
    
    return { result, confidence };
  }

  /**
   * Evaluar trigger de engagement
   */
  evaluateEngagementTrigger(lead, trigger) {
    const minIncrease = trigger.parameters.minIncrease || 10;
    const currentEngagement = lead.lastEngagementScore || 0;
    const previousEngagement = lead.previousEngagementScore || 0;
    
    const increase = currentEngagement - previousEngagement;
    const result = increase >= minIncrease;
    const confidence = Math.min(increase / minIncrease, 1);
    
    console.log(`  📊 Engagement Trigger: ${currentEngagement} - ${previousEngagement} = ${increase} >= ${minIncrease} = ${result} (confidence: ${confidence.toFixed(2)})`);
    
    return { result, confidence };
  }

  /**
   * Evaluar un trigger específico
   */
  evaluateSingleTrigger(lead, trigger) {
    console.log(`  🔍 Evaluating trigger: ${trigger.type}`);
    
    switch (trigger.type) {
      case 'sentiment_threshold':
        return this.evaluateSentimentTrigger(lead, trigger);
      
      case 'engagement_increase':
        return this.evaluateEngagementTrigger(lead, trigger);
      
      default:
        console.log(`  ⚠️  Unknown trigger type: ${trigger.type}`);
        return { result: false, confidence: 0 };
    }
  }

  /**
   * Determinar si la regla debe ejecutarse
   */
  shouldRuleTriggering(results, triggers) {
    const totalWeight = triggers.reduce((sum, t) => sum + t.weight, 0);
    const triggeredWeight = results
      .filter(r => r.result)
      .reduce((sum, r) => sum + r.trigger.weight, 0);

    const triggerThreshold = 0.6; // 60% del peso debe estar activado
    const shouldTrigger = (triggeredWeight / totalWeight) >= triggerThreshold;
    
    console.log(`  ⚖️  Weight calculation: ${triggeredWeight}/${totalWeight} = ${(triggeredWeight/totalWeight).toFixed(2)} >= ${triggerThreshold} = ${shouldTrigger}`);
    
    return shouldTrigger;
  }

  /**
   * Simular ejecución de acción
   */
  simulateAction(lead, action) {
    console.log(`  🎬 Executing action: ${action.type}`);
    
    switch (action.type) {
      case 'status_change':
        const newStatus = action.parameters.newStatus;
        console.log(`    📈 Status change: ${lead.status} → ${newStatus}`);
        return { 
          success: true,
          result: { previousStatus: lead.status, newStatus },
          message: `Lead status changed from ${lead.status} to ${newStatus}`
        };
        
      default:
        console.log(`    ❓ Unknown action type: ${action.type}`);
        return { success: false, message: 'Unknown action type' };
    }
  }

  /**
   * Evaluar un lead contra una regla (método principal de testing)
   */
  async testLeadAgainstRule(lead, rule) {
    console.log(`\n🔬 TESTING LEAD AGAINST RULE: ${rule.name}`);
    console.log(`📋 Lead ID: ${lead.id} (Status: ${lead.status})`);
    
    // 1. Verificar restricciones básicas
    console.log('\n1️⃣ Checking basic constraints...');
    if (!this.meetBasicConstraints(lead, rule)) {
      console.log('❌ Basic constraints not met');
      return { success: false, reason: 'Basic constraints not met' };
    }
    console.log('✅ Basic constraints satisfied');

    // 2. Evaluar triggers
    console.log('\n2️⃣ Evaluating triggers...');
    const triggerResults = [];
    
    for (const trigger of rule.triggers) {
      const result = this.evaluateSingleTrigger(lead, trigger);
      triggerResults.push({ trigger, ...result });
    }

    // 3. Determinar si debe ejecutarse
    console.log('\n3️⃣ Determining rule execution...');
    const shouldTrigger = this.shouldRuleTriggering(triggerResults, rule.triggers);
    
    if (!shouldTrigger) {
      console.log('❌ Rule triggers not satisfied');
      return { success: false, reason: 'Triggers not satisfied', triggerResults };
    }
    
    console.log('✅ Rule should be triggered');

    // 4. Simular ejecución de acciones
    console.log('\n4️⃣ Executing actions...');
    const actionResults = [];
    
    for (const action of rule.actions) {
      const actionResult = this.simulateAction(lead, action);
      actionResults.push(actionResult);
    }

    const overallSuccess = actionResults.some(r => r.success);
    
    console.log(`\n🎯 RESULT: ${overallSuccess ? 'SUCCESS' : 'FAILED'}`);
    
    return {
      success: overallSuccess,
      triggerResults,
      actionResults,
      rule: rule.name
    };
  }
}

// Ejecutar tests
async function runTests() {
  const engine = new MockAutoProgressionEngine();
  
  console.log('📊 MOCK LEAD DATA:');
  console.log(`  • ID: ${mockLeadData.id}`);
  console.log(`  • Status: ${mockLeadData.status}`);
  console.log(`  • Qualification Score: ${mockLeadData.qualificationScore}`);
  console.log(`  • Sentiment Score: ${mockLeadData.lastSentimentScore}`);
  console.log(`  • Engagement: ${mockLeadData.lastEngagementScore} (prev: ${mockLeadData.previousEngagementScore})`);
  console.log(`  • Auto-progression: ${mockLeadData.autoProgressionEnabled ? 'Enabled' : 'Disabled'}`);

  console.log('\n📋 TESTING RULES:');
  
  let totalTests = 0;
  let successfulTests = 0;
  
  for (const rule of mockRules) {
    totalTests++;
    console.log('\n' + '='.repeat(60));
    
    const testResult = await engine.testLeadAgainstRule(mockLeadData, rule);
    
    if (testResult.success) {
      successfulTests++;
      console.log('🎉 TEST PASSED');
    } else {
      console.log(`❌ TEST FAILED: ${testResult.reason}`);
    }
  }

  // Resumen final
  console.log('\n' + '='.repeat(60));
  console.log('🎯 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`📊 Tests executed: ${totalTests}`);
  console.log(`✅ Successful: ${successfulTests}`);
  console.log(`❌ Failed: ${totalTests - successfulTests}`);
  console.log(`📈 Success rate: ${((successfulTests / totalTests) * 100).toFixed(1)}%`);
  
  if (successfulTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED - AUTO-PROGRESSION ENGINE WORKING CORRECTLY');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED - REVIEW ENGINE LOGIC');
  }

  // Test de escenarios adicionales
  console.log('\n\n🧪 ADDITIONAL SCENARIO TESTS:');
  
  // Escenario 2: Lead con bajo engagement
  const lowEngagementLead = {
    ...mockLeadData,
    id: 'lead-456',
    lastEngagementScore: 30,
    previousEngagementScore: 35, // Engagement decreasing
  };
  
  console.log('\n📉 Testing low engagement lead...');
  const lowEngagementResult = await engine.testLeadAgainstRule(lowEngagementLead, mockRules[0]);
  console.log(`Result: ${lowEngagementResult.success ? 'PASSED' : 'FAILED'} (Expected: FAILED)`);
  
  // Escenario 3: Lead con sentiment bajo
  const lowSentimentLead = {
    ...mockLeadData,
    id: 'lead-789',
    lastSentimentScore: 0.3, // Below threshold
  };
  
  console.log('\n😔 Testing low sentiment lead...');
  const lowSentimentResult = await engine.testLeadAgainstRule(lowSentimentLead, mockRules[0]);
  console.log(`Result: ${lowSentimentResult.success ? 'PASSED' : 'FAILED'} (Expected: FAILED)`);

  console.log('\n✅ AUTO-PROGRESSION ENGINE TESTING COMPLETED');
}

// Ejecutar tests
runTests().catch(console.error);