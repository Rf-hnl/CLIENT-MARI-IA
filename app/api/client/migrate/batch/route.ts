import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { IClient, IClientDocument, ICustomerInteractions, IClientAIProfile } from '@/modules/clients/types/clients';
import { FieldValue } from 'firebase-admin/firestore';

// Generate initial AI profile for migrated clients (same as single migration)
function generateInitialAIProfile(clientId: string, clientData: IClient): IClientAIProfile {
  const now = FieldValue.serverTimestamp();
  
  const daysOverdue = clientData.days_overdue || 0;
  const debt = clientData.debt || 0;
  
  const riskScore = Math.min(100, Math.max(0, 
    50 + (daysOverdue * 1.5) + (debt > 10000 ? 20 : 10)
  ));
  
  const paymentBehaviorScore = Math.max(0, 
    daysOverdue > 90 ? 15 : 
    daysOverdue > 30 ? 35 : 
    daysOverdue > 0 ? 55 : 75
  );
  
  const profileSegment = 
    daysOverdue > 90 ? "Problematic" :
    daysOverdue > 30 ? "AtRisk" :
    debt > 15000 ? "HighValue" : "Standard";
  
  return {
    clientId,
    analysisDate: now,
    lastUpdatedByAI: now,
    profileSegment: profileSegment as any,
    clientTier: debt > 20000 ? "Premium" : "Standard",
    riskScore: Math.round(riskScore),
    engagementScore: 50,
    responsivenesScore: 50,
    paymentBehaviorScore: Math.round(paymentBehaviorScore),
    predictedChurnRisk: riskScore > 70,
    paymentProbability: Math.max(20, 100 - riskScore),
    recoveryProbability: Math.max(30, 90 - (daysOverdue * 0.8)),
    defaultRisk: Math.round(riskScore * 0.8),
    communicationPreference: clientData.preferred_contact_method || "unknown",
    bestContactTime: "unknown",
    responsePattern: daysOverdue > 0 ? "delayed" : "unknown",
    negotiationStyle: "unknown",
    recommendedAction: 
      daysOverdue > 90 ? "LegalAction" :
      daysOverdue > 30 ? "PaymentPlan" :
      daysOverdue > 0 ? "HighPriorityFollow" : "PersonalizedOutreach",
    recommendedContactMethod: (clientData.preferred_contact_method as any) || "phone",
    urgencyLevel: 
      daysOverdue > 90 ? "critical" :
      daysOverdue > 30 ? "high" :
      daysOverdue > 0 ? "medium" : "low",
    aiInsights: [
      `Cliente migrado con ${daysOverdue} días vencidos`,
      `Deuda actual: $${debt.toLocaleString()}`,
      clientData.employment_status ? `Estado laboral: ${clientData.employment_status}` : "Estado laboral no registrado",
      clientData.monthly_income ? `Ingresos: $${clientData.monthly_income.toLocaleString()}` : "Ingresos no registrados"
    ].filter(insight => insight !== null),
    keyPersonalityTraits: [],
    financialStressIndicators: daysOverdue > 0 ? ["Pagos tardíos"] : [],
    mostEffectiveStrategy: undefined,
    leastEffectiveStrategy: undefined,
    preferredMessageTone: daysOverdue > 60 ? "urgent" : "friendly",
    seasonalPaymentPattern: undefined,
    nextRecommendedContactDate: now,
    aiModel: "migration-analyzer-v1.0",
    confidenceScore: 40,
    dataQuality: clientData.email && clientData.address ? "medium" : "low",
    lastInteractionAnalyzed: now,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, organizationId, clientIds } = body;

    // Validate required parameters
    if (!tenantId || !organizationId || !clientIds || !Array.isArray(clientIds)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'tenantId, organizationId y clientIds (array) son requeridos' 
        },
        { status: 400 }
      );
    }

    if (clientIds.length === 0) {
      return NextResponse.json({
        success: true,
        migratedCount: 0,
        message: 'No hay clientes para migrar'
      });
    }

    const clientsPath = `tenants/${tenantId}/organizations/${organizationId}/clients`;
    const results = {
      migrated: [] as string[],
      alreadyMigrated: [] as string[],
      errors: [] as { clientId: string, error: string }[]
    };

    // Process each client
    for (const clientId of clientIds) {
      try {
        const clientDocRef = adminDb.doc(`${clientsPath}/${clientId}`);
        const clientDoc = await clientDocRef.get();
        
        if (!clientDoc.exists) {
          results.errors.push({
            clientId,
            error: 'Cliente no encontrado'
          });
          continue;
        }

        const currentData = clientDoc.data();
        
        // Check if already migrated
        if (currentData?.customerInteractions) {
          results.alreadyMigrated.push(clientId);
          continue;
        }

        // Current data is in old format (direct IClient)
        const clientData = currentData as IClient;
        
        // Create new document structure
        const migratedDocument: IClientDocument = {
          _data: {
            ...clientData,
            id: clientId,
            updated_at: FieldValue.serverTimestamp()
          },
          customerInteractions: {
            callLogs: [],
            emailRecords: [],
            clientAIProfiles: generateInitialAIProfile(clientId, clientData)
          }
        };

        // Update the document with new structure
        await clientDocRef.set(migratedDocument);
        
        results.migrated.push(clientId);
        console.log(`✅ Cliente ${clientId} migrado exitosamente`);

      } catch (error) {
        console.error(`❌ Error migrando cliente ${clientId}:`, error);
        results.errors.push({
          clientId,
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }

    // Prepare response
    const totalProcessed = results.migrated.length + results.alreadyMigrated.length + results.errors.length;
    
    console.log(`📊 Migración batch completada:
    - Migrados: ${results.migrated.length}
    - Ya migrados: ${results.alreadyMigrated.length}  
    - Errores: ${results.errors.length}
    - Total procesados: ${totalProcessed}/${clientIds.length}`);

    return NextResponse.json({
      success: results.errors.length < clientIds.length, // Success if at least some succeeded
      data: {
        totalRequested: clientIds.length,
        totalProcessed,
        migratedCount: results.migrated.length,
        alreadyMigratedCount: results.alreadyMigrated.length,
        errorCount: results.errors.length,
        migrated: results.migrated,
        alreadyMigrated: results.alreadyMigrated,
        errors: results.errors,
        timestamp: new Date().toISOString()
      },
      message: `Migración completada: ${results.migrated.length} migrados, ${results.alreadyMigrated.length} ya estaban migrados, ${results.errors.length} errores`
    });

  } catch (error) {
    console.error('❌ Error in batch migration:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno del servidor',
        details: 'Error en migración batch'
      },
      { status: 500 }
    );
  }
}