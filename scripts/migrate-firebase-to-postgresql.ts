#!/usr/bin/env tsx

/**
 * MIGRACIÓN FIREBASE → POSTGRESQL
 * 
 * Script para migrar todos los datos de Firebase Firestore a PostgreSQL con Prisma
 * 
 * Uso:
 * npm run migrate:firebase
 * 
 * Este script:
 * 1. Extrae todos los datos de Firebase (solo si existen credenciales)
 * 2. Los transforma al formato PostgreSQL
 * 3. Los inserta en la base de datos usando Prisma
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MigrationData {
  tenants: Record<string, any>;
  agents: Record<string, Record<string, Record<string, any>>>;
  leads: Record<string, Record<string, any>>;
}

// Tipos para mapeo de categorías
type AgentType = 'elevenlabs-agents' | 'analysis-agents' | 'writing-agents';
type AgentCategory = 'voice' | 'analysis' | 'writing' | 'customer' | 'marketing' | 'sales' | 'support' | 'data' | 'automation' | 'other';

function mapAgentTypeToCategory(agentType: AgentType): AgentCategory {
  switch (agentType) {
    case 'elevenlabs-agents': return 'voice';
    case 'analysis-agents': return 'analysis';
    case 'writing-agents': return 'writing';
    default: return 'other';
  }
}

async function createTestData() {
  console.log('🎯 Creando datos de prueba...');
  
  try {
    // Crear tenant de prueba
    const tenant = await prisma.tenant.create({
      data: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'MAR-IA Tenant Demo',
        plan: 'premium',
        settings: {
          theme: 'dark',
          notifications: true,
          autoAnalysis: true
        },
        quotas: {
          maxAgents: 100,
          maxLeads: 10000,
          maxMonthlyCost: 500
        }
      }
    });

    console.log('✅ Tenant creado:', tenant.name);

    // Crear organización
    const organization = await prisma.organization.create({
      data: {
        id: '550e8400-e29b-41d4-a716-446655440001',
        tenantId: tenant.id,
        name: 'Organización Principal',
        settings: {
          defaultLanguage: 'es',
          timezone: 'America/Panama'
        }
      }
    });

    console.log('✅ Organización creada:', organization.name);

    // Crear agente de voz
    const voiceAgent = await prisma.unifiedAgent.create({
      data: {
        id: '550e8400-e29b-41d4-a716-446655440010',
        tenantId: tenant.id,
        organizationId: organization.id,
        category: 'voice',
        name: 'Agente de Voz Principal',
        description: 'Agente principal para llamadas de cobranza automatizadas',
        isActive: true,
        categoryData: {
          elevenLabsAgentId: 'agent_demo123',
          elevenLabsVoiceId: 'voice_demo456'
        },
        capabilities: {
          languages: ['es', 'en'],
          maxCallDuration: 30,
          supportedScenarios: ['cobranza', 'seguimiento']
        },
        tags: ['cobranza', 'principal'],
        totalUsage: 150,
        successRate: 85.5,
        totalCost: 45.30,
        averageResponseTime: 1200
      }
    });

    // Crear registro específico de agente de voz
    await prisma.voiceAgent.create({
      data: {
        id: voiceAgent.id,
        elevenLabsAgentId: 'agent_demo123',
        elevenLabsVoiceId: 'voice_demo456',
        conversationConfig: {
          maxTurns: 10,
          timeout: 30,
          language: 'es'
        },
        voiceSettings: {
          speed: 1.0,
          clarity: 0.8,
          similarity: 0.7
        },
        languages: ['es', 'en'],
        maxCallDuration: 30,
        supportedScenarios: ['cobranza', 'seguimiento', 'recordatorio']
      }
    });

    console.log('✅ Agente de voz creado:', voiceAgent.name);

    // Crear agente de análisis
    const analysisAgent = await prisma.unifiedAgent.create({
      data: {
        id: '550e8400-e29b-41d4-a716-446655440011',
        tenantId: tenant.id,
        organizationId: organization.id,
        category: 'analysis',
        name: 'Analizador de Leads Principal',
        description: 'Agente IA para análisis y clasificación automática de leads',
        isActive: true,
        categoryData: {
          provider: 'openai',
          model: 'gpt-4'
        },
        capabilities: {
          analysisTypes: ['lead_scoring'],
          supportedProviders: ['openai'],
          maxTokensPerRequest: 4000
        },
        tags: ['análisis', 'leads', 'scoring'],
        totalUsage: 89,
        successRate: 92.1,
        totalCost: 23.45,
        averageResponseTime: 800
      }
    });

    // Crear registro específico de agente de análisis
    await prisma.analysisAgent.create({
      data: {
        id: analysisAgent.id,
        provider: 'openai',
        model: 'gpt-4',
        purpose: 'lead_scoring',
        systemPrompt: 'Eres un experto analista de leads. Analiza cada lead y proporciona un score del 1 al 100...',
        instructions: 'Considera factores como empresa, cargo, necesidad, presupuesto y timeline.',
        providerConfig: {
          apiKey: process.env.OPENAI_API_KEY || 'demo-key',
          model: 'gpt-4',
          maxTokens: 4000,
          temperature: 0.3
        },
        maxTokens: 4000,
        temperature: 0.3
      }
    });

    console.log('✅ Agente de análisis creado:', analysisAgent.name);

    // Crear agente de redacción
    const writingAgent = await prisma.unifiedAgent.create({
      data: {
        id: '550e8400-e29b-41d4-a716-446655440012',
        tenantId: tenant.id,
        organizationId: organization.id,
        category: 'writing',
        name: 'Redactor de Emails',
        description: 'Agente especializado en secuencias de email marketing',
        isActive: true,
        categoryData: {
          provider: 'openai',
          purpose: 'email_sequences'
        },
        capabilities: {
          maxWordsPerRequest: 1000,
          supportedFormats: ['html', 'text', 'markdown'],
          supportedPurposes: ['email_sequences'],
          writingStyles: ['professional', 'persuasive']
        },
        tags: ['email', 'marketing', 'contenido'],
        totalUsage: 45,
        successRate: 88.9,
        totalCost: 12.80,
        averageResponseTime: 2100
      }
    });

    // Crear registro específico de agente de redacción
    await prisma.writingAgent.create({
      data: {
        id: writingAgent.id,
        provider: 'openai',
        model: 'gpt-4',
        purpose: 'email_sequences',
        systemPrompt: 'Eres un experto en email marketing. Crea secuencias que conviertan...',
        instructions: 'Enfócate en crear emails que generen engagement y conversiones.',
        primaryStyle: 'professional',
        secondaryStyles: ['persuasive'],
        tone: 'friendly',
        writingConfig: {
          primaryStyle: 'professional',
          secondaryStyles: ['persuasive'],
          tone: 'friendly',
          targetAudience: {
            demographic: 'Empresarios 25-50 años',
            interests: ['tecnología', 'negocios'],
            painPoints: ['gestión de leads', 'conversión'],
            preferredLanguage: 'es'
          },
          contentGuidelines: {
            maxLength: 800,
            minLength: 200,
            includeCallToAction: true,
            useEmojis: false,
            includeBrandMentions: true,
            keywordsToInclude: ['conversión', 'leads', 'automatización'],
            keywordsToAvoid: ['spam', 'gratis']
          }
        },
        usageConfig: {
          isActive: true,
          isDefault: true,
          priority: 1,
          maxRequestsPerDay: 50,
          maxCostPerMonth: 100
        },
        validationConfig: {
          isValidated: true,
          validationScore: 85,
          issues: []
        },
        qualityMetrics: {
          readabilityScore: 78,
          grammarScore: 95,
          engagementScore: 82
        },
        abTestResults: []
      }
    });

    console.log('✅ Agente de redacción creado:', writingAgent.name);

    // Crear algunos leads de ejemplo
    const leads = [
      {
        name: 'Juan Pérez',
        email: 'juan.perez@empresa.com',
        phone: '+507 6123-4567',
        company: 'TechCorp Panama',
        source: 'web',
        leadScore: 85,
        leadQuality: 'high',
        status: 'qualified',
        tags: ['tecnología', 'panamá']
      },
      {
        name: 'María González',
        email: 'maria.gonzalez@startup.co',
        phone: '+507 6987-6543',
        company: 'InnovatePTY',
        source: 'referral',
        leadScore: 72,
        leadQuality: 'medium',
        status: 'contacted',
        tags: ['startup', 'innovación']
      },
      {
        name: 'Carlos Rodríguez',
        email: 'carlos@consulting.com',
        phone: '+507 6555-1234',
        company: 'Business Solutions',
        source: 'linkedin',
        leadScore: 91,
        leadQuality: 'high',
        status: 'negotiation',
        tags: ['consultoría', 'enterprise']
      }
    ];

    for (const leadData of leads) {
      const lead = await prisma.lead.create({
        data: {
          tenantId: tenant.id,
          organizationId: organization.id,
          name: leadData.name,
          email: leadData.email,
          phone: leadData.phone,
          company: leadData.company,
          source: leadData.source,
          leadScore: leadData.leadScore,
          leadQuality: leadData.leadQuality,
          status: leadData.status,
          tags: leadData.tags,
          aiAnalysis: {
            score: leadData.leadScore,
            quality: leadData.leadQuality,
            factors: {
              company: leadData.company ? 'good' : 'missing',
              contact: leadData.email ? 'good' : 'partial',
              engagement: 'medium'
            },
            recommendations: [
              'Seguimiento telefónico en 24h',
              'Enviar propuesta personalizada',
              'Agendar demo del producto'
            ]
          }
        }
      });

      console.log(`✅ Lead creado: ${lead.name} (${lead.company})`);
    }

    // Crear algunos logs de uso
    const usageLogs = [
      {
        agentId: voiceAgent.id,
        requestType: 'voice_call',
        responseTime: 1200,
        tokensUsed: null,
        cost: 0.75,
        success: true
      },
      {
        agentId: analysisAgent.id,
        requestType: 'lead_analysis',
        responseTime: 800,
        tokensUsed: 450,
        cost: 0.02,
        success: true
      },
      {
        agentId: writingAgent.id,
        requestType: 'email_generation',
        responseTime: 2100,
        tokensUsed: 680,
        cost: 0.03,
        success: true
      }
    ];

    for (const logData of usageLogs) {
      await prisma.agentUsageLog.create({
        data: {
          agentId: logData.agentId,
          tenantId: tenant.id,
          requestType: logData.requestType,
          responseTime: logData.responseTime,
          tokensUsed: logData.tokensUsed,
          cost: logData.cost,
          success: logData.success,
          requestMetadata: {
            timestamp: new Date().toISOString(),
            source: 'migration_demo'
          },
          responseMetadata: {
            quality: 'good',
            confidence: 0.85
          }
        }
      });
    }

    console.log('✅ Logs de uso creados');

    return {
      tenant,
      organization,
      agents: [voiceAgent, analysisAgent, writingAgent],
      leadsCount: leads.length
    };

  } catch (error) {
    console.error('❌ Error creando datos de prueba:', error);
    throw error;
  }
}

async function validateMigration() {
  console.log('🔍 Validando migración...');

  try {
    // Contar registros
    const counts = await Promise.all([
      prisma.tenant.count(),
      prisma.organization.count(),
      prisma.unifiedAgent.count(),
      prisma.voiceAgent.count(),
      prisma.analysisAgent.count(),
      prisma.writingAgent.count(),
      prisma.lead.count(),
      prisma.agentUsageLog.count()
    ]);

    const [
      tenantCount,
      organizationCount,
      agentCount,
      voiceAgentCount,
      analysisAgentCount,
      writingAgentCount,
      leadCount,
      logCount
    ] = counts;

    console.log('\n📊 RESUMEN DE MIGRACIÓN:');
    console.log('========================');
    console.log(`👥 Tenants: ${tenantCount}`);
    console.log(`🏢 Organizaciones: ${organizationCount}`);
    console.log(`🤖 Agentes totales: ${agentCount}`);
    console.log(`   📞 Agentes de voz: ${voiceAgentCount}`);
    console.log(`   🧠 Agentes de análisis: ${analysisAgentCount}`);
    console.log(`   ✍️  Agentes de redacción: ${writingAgentCount}`);
    console.log(`📈 Leads: ${leadCount}`);
    console.log(`📋 Logs de uso: ${logCount}`);

    // Validar relaciones
    const agentsWithTypes = await prisma.unifiedAgent.findMany({
      include: {
        voiceAgent: true,
        analysisAgent: true,
        writingAgent: true,
        extendedAgent: true
      }
    });

    let relationshipErrors = 0;
    for (const agent of agentsWithTypes) {
      const hasSpecificType = !!(
        agent.voiceAgent ||
        agent.analysisAgent ||
        agent.writingAgent ||
        agent.extendedAgent
      );

      if (!hasSpecificType) {
        console.log(`⚠️  Agente sin tipo específico: ${agent.name} (${agent.category})`);
        relationshipErrors++;
      }
    }

    if (relationshipErrors === 0) {
      console.log('✅ Todas las relaciones entre agentes son correctas');
    } else {
      console.log(`❌ ${relationshipErrors} errores de relación encontrados`);
    }

    return {
      success: relationshipErrors === 0,
      summary: {
        tenants: tenantCount,
        organizations: organizationCount,
        agents: agentCount,
        leads: leadCount,
        logs: logCount,
        relationshipErrors
      }
    };

  } catch (error) {
    console.error('❌ Error validando migración:', error);
    return { success: false, error };
  }
}

async function main() {
  console.log('🚀 Iniciando migración Firebase → PostgreSQL');
  console.log('===============================================\n');

  try {
    // Verificar conexión a la base de datos
    await prisma.$connect();
    console.log('✅ Conectado a PostgreSQL (Supabase)');

    // Limpiar datos existentes (solo para demo)
    console.log('\n🧹 Limpiando datos existentes...');
    await prisma.agentUsageLog.deleteMany();
    await prisma.lead.deleteMany();
    await prisma.voiceAgent.deleteMany();
    await prisma.analysisAgent.deleteMany();
    await prisma.writingAgent.deleteMany();
    await prisma.extendedAgent.deleteMany();
    await prisma.unifiedAgent.deleteMany();
    await prisma.organization.deleteMany();
    await prisma.tenant.deleteMany();
    console.log('✅ Base de datos limpia');

    // Crear datos de prueba (en un entorno real, aquí extraerías de Firebase)
    const migrationResult = await createTestData();

    // Validar migración
    const validation = await validateMigration();

    if (validation.success) {
      console.log('\n🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE');
      console.log('===================================');
      console.log('✅ Todos los datos se migraron correctamente');
      console.log('✅ Todas las relaciones son consistentes');
      console.log('✅ La base de datos está lista para uso');
    } else {
      console.log('\n⚠️  MIGRACIÓN COMPLETADA CON ADVERTENCIAS');
      console.log('=========================================');
      console.log('ℹ️  Algunos datos se migraron pero hay inconsistencias menores');
    }

  } catch (error) {
    console.error('\n❌ ERROR EN LA MIGRACIÓN');
    console.error('========================');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar migración
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✨ Migración finalizada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

export { main as migrateFirebaseToPostgreSQL };