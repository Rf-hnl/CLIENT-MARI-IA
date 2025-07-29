import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { IClient, IClientDocument, ICustomerInteractions, IClientAIProfile } from '@/modules/clients/types/clients';
import { FieldValue } from 'firebase-admin/firestore';

// Generate initial AI profile for migrated clients
function generateInitialAIProfile(clientId: string, clientData: IClient): IClientAIProfile {
  const now = FieldValue.serverTimestamp();
  
  // Analyze existing client data to create smarter initial profile
  const daysOverdue = clientData.days_overdue || 0;
  const debt = clientData.debt || 0;
  
  // Calculate initial scores based on existing data
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
    
    // Segmentación basada en datos existentes
    profileSegment: profileSegment as any,
    clientTier: debt > 20000 ? "Premium" : "Standard",
    
    // Puntuaciones calculadas con datos reales
    riskScore: Math.round(riskScore),
    engagementScore: 50, // Neutral hasta tener más datos
    responsivenesScore: 50, // Neutral
    paymentBehaviorScore: Math.round(paymentBehaviorScore),
    
    // Predicciones basadas en riesgo
    predictedChurnRisk: riskScore > 70,
    paymentProbability: Math.max(20, 100 - riskScore),
    recoveryProbability: Math.max(30, 90 - (daysOverdue * 0.8)),
    defaultRisk: Math.round(riskScore * 0.8),
    
    // Comportamiento - inferido de datos existentes
    communicationPreference: clientData.preferred_contact_method || "unknown",
    bestContactTime: "unknown",
    responsePattern: daysOverdue > 0 ? "delayed" : "unknown",
    negotiationStyle: "unknown",
    
    // Recomendaciones basadas en estado actual
    recommendedAction: 
      daysOverdue > 90 ? "LegalAction" :
      daysOverdue > 30 ? "PaymentPlan" :
      daysOverdue > 0 ? "HighPriorityFollow" : "PersonalizedOutreach",
    recommendedContactMethod: (clientData.preferred_contact_method as any) || "phone",
    urgencyLevel: 
      daysOverdue > 90 ? "critical" :
      daysOverdue > 30 ? "high" :
      daysOverdue > 0 ? "medium" : "low",
    
    // Insights basados en datos existentes
    aiInsights: [
      `Cliente migrado con ${daysOverdue} días vencidos`,
      `Deuda actual: $${debt.toLocaleString()}`,
      clientData.employment_status ? `Estado laboral: ${clientData.employment_status}` : "Estado laboral no registrado",
      clientData.monthly_income ? `Ingresos: $${clientData.monthly_income.toLocaleString()}` : "Ingresos no registrados"
    ].filter(insight => insight !== null),
    keyPersonalityTraits: [],
    financialStressIndicators: daysOverdue > 0 ? ["Pagos tardíos"] : [],
    
    // Estrategias - a determinar
    mostEffectiveStrategy: undefined,
    leastEffectiveStrategy: undefined,
    preferredMessageTone: daysOverdue > 60 ? "urgent" : "friendly",
    
    // Contexto temporal
    seasonalPaymentPattern: undefined,
    nextRecommendedContactDate: now,
    
    // Metadatos
    aiModel: "migration-analyzer-v1.0",
    confidenceScore: 40, // Baja confianza hasta tener más interacciones
    dataQuality: clientData.email && clientData.address ? "medium" : "low",
    lastInteractionAnalyzed: now,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, organizationId, clientId } = body;

    // Validate required parameters
    if (!tenantId || !organizationId || !clientId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'tenantId, organizationId y clientId son requeridos' 
        },
        { status: 400 }
      );
    }

    // Construct document path
    const clientDocPath = `tenants/${tenantId}/organizations/${organizationId}/clients/${clientId}`;
    const clientDocRef = adminDb.doc(clientDocPath);

    // Get current document
    const clientDoc = await clientDocRef.get();
    
    if (!clientDoc.exists) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cliente con ID '${clientId}' no encontrado` 
        },
        { status: 404 }
      );
    }

    const currentData = clientDoc.data();
    
    // Check if already migrated
    if (currentData?.customerInteractions) {
      return NextResponse.json({
        success: true,
        message: `Cliente ${clientId} ya tiene customerInteractions`,
        alreadyMigrated: true
      });
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

    console.log(`✅ Cliente ${clientId} migrado exitosamente a nueva estructura`);

    return NextResponse.json({
      success: true,
      data: {
        clientId,
        profileSegment: migratedDocument.customerInteractions?.clientAIProfiles?.profileSegment,
        riskScore: migratedDocument.customerInteractions?.clientAIProfiles?.riskScore,
        urgencyLevel: migratedDocument.customerInteractions?.clientAIProfiles?.urgencyLevel,
        timestamp: new Date().toISOString()
      },
      message: 'Cliente migrado exitosamente con perfil AI generado'
    });

  } catch (error) {
    console.error('❌ Error migrating client:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno del servidor',
        details: 'Error al migrar cliente'
      },
      { status: 500 }
    );
  }
}