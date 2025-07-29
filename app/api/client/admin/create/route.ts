import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, addDoc, setDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { IClient, IClientDocument, ICustomerInteractions, IClientAIProfile } from '@/modules/clients/types/clients';
import firebaseApp from '@/lib/firebase/client';

const db = getFirestore(firebaseApp);

// Generate initial AI profile for new clients
function generateInitialAIProfile(clientId: string): IClientAIProfile {
  const now = serverTimestamp();
  
  return {
    clientId,
    analysisDate: now,
    lastUpdatedByAI: now,
    
    // Segmentación inicial para nuevo cliente
    profileSegment: "NewClient",
    clientTier: "Standard",
    
    // Puntuaciones iniciales conservadoras
    riskScore: 50, // Neutral hasta tener más datos
    engagementScore: 50, // Neutral
    responsivenesScore: 50, // Neutral
    paymentBehaviorScore: 50, // Neutral hasta historial
    
    // Predicciones iniciales
    predictedChurnRisk: false, // Optimista para nuevos clientes
    paymentProbability: 70, // Probabilidad moderada-alta para nuevos
    recoveryProbability: 80, // Alta para nuevos clientes
    defaultRisk: 30, // Bajo para nuevos clientes
    
    // Comportamiento - valores desconocidos inicialmente
    communicationPreference: "unknown",
    bestContactTime: "unknown",
    responsePattern: "unknown",  
    negotiationStyle: "unknown",
    
    // Recomendaciones iniciales para nuevos clientes
    recommendedAction: "PersonalizedOutreach",
    recommendedContactMethod: "phone", // Método tradicional inicial
    urgencyLevel: "low", // Baja urgencia para nuevos
    
    // Insights vacíos - se llenarán con tiempo
    aiInsights: ["Cliente nuevo - se requiere más interacción para análisis completo"],
    keyPersonalityTraits: [],
    financialStressIndicators: [],
    
    // Estrategias - aún no determinadas
    preferredMessageTone: "friendly", // Tono amigable para nuevos clientes
    
    // Contexto temporal
    nextRecommendedContactDate: now, // Contacto inmediato para nuevos
    
    // Metadatos
    aiModel: "initial-profile-v1.0", // Perfil inicial, no generado por IA aún
    confidenceScore: 25, // Baja confianza en perfil inicial
    dataQuality: "low", // Calidad baja hasta tener interacciones
    lastInteractionAnalyzed: now,
  };
}

// Generate default system-calculated fields for new clients
function generateSystemFields(clientData: { debt?: number }): Partial<IClient> {
  const now = serverTimestamp();
  
  return {
    // System calculated fields with default values
    payment_date: now,
    installment_amount: clientData.debt ? Math.round((clientData.debt / 12) * 100) / 100 : 0,
    pending_installments: 12, // Default 12 installments
    due_date: now,
    loan_start_date: now,
    days_overdue: 0,
    last_payment_date: now,
    last_payment_amount: 0,
    credit_score: 650, // Default credit score
    risk_category: 'medio', // Default risk category
    credit_limit: clientData.debt ? clientData.debt * 1.5 : 10000,
    available_credit: clientData.debt ? clientData.debt * 0.5 : 5000,
    recovery_probability: 75, // Default 75%
    created_at: now,
    updated_at: now,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, organizationId, clientData } = body;

    // Validate required parameters
    if (!tenantId || !organizationId || !clientData) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'tenantId, organizationId y clientData son requeridos' 
        },
        { status: 400 }
      );
    }

    // Validate required client fields
    const requiredFields = ['name', 'national_id', 'phone', 'debt', 'status', 'loan_letter'];
    const missingFields = requiredFields.filter(field => !clientData[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Campos requeridos faltantes: ${missingFields.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Construct the collection path
    const clientsCollectionPath = `tenants/${tenantId}/organizations/${organizationId}/clients`;

    // Extract customId if provided (development mode only)
    const { customId, ...clientDataWithoutId } = clientData;
    const isDevelopment = process.env.NEXT_PUBLIC_DEVELOPMENT === 'true';
    
    // Generate system fields
    const systemFields = generateSystemFields(clientDataWithoutId);

    // Prepare final client data with ID for AI profile
    const finalClientData = {
      ...clientDataWithoutId,
      ...systemFields,
    };

    // Generate client ID early for AI profile creation
    const tempClientId = isDevelopment && customId?.trim() ? customId.trim() : doc(collection(db, clientsCollectionPath)).id;
    
    // Create complete client document structure
    const clientDocument: IClientDocument = {
      _data: {
        ...finalClientData,
        id: tempClientId, // Ensure ID is set for the client data
      },
      customerInteractions: {
        callLogs: [],
        emailRecords: [],
        clientAIProfiles: generateInitialAIProfile(tempClientId),
      }
    };

    let docRef;
    let clientId = tempClientId;

    // Use custom ID if provided and in development mode
    if (isDevelopment && customId?.trim()) {
      const customDocRef = doc(db, clientsCollectionPath, clientId);
      
      // Check if document with custom ID already exists
      const existingDoc = await getDoc(customDocRef);
      if (existingDoc.exists()) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Ya existe un cliente con el ID '${clientId}'` 
          },
          { status: 409 }
        );
      }
      
      // Create document with custom ID and complete structure
      await setDoc(customDocRef, clientDocument);
      docRef = { id: clientId };
      
      console.log(`✅ Cliente creado con ID personalizado en: ${clientsCollectionPath}/${clientId}`);
      console.log(`✅ CustomerInteractions inicializado para cliente: ${clientId}`);
    } else {
      // Use auto-generated ID
      const clientsRef = collection(db, clientsCollectionPath);
      docRef = await addDoc(clientsRef, clientDocument);
      clientId = docRef.id;
      
      // Update the AI profile with the actual generated ID
      clientDocument.customerInteractions!.clientAIProfiles!.clientId = clientId;
      clientDocument._data.id = clientId;
      
      // Update the document with correct IDs
      await setDoc(doc(db, clientsCollectionPath, clientId), clientDocument);
      
      console.log(`✅ Cliente creado con ID automático en: ${clientsCollectionPath}/${clientId}`);
      console.log(`✅ CustomerInteractions inicializado para cliente: ${clientId}`);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: clientId,
        ...clientDocument._data,
        customerInteractions: clientDocument.customerInteractions
      },
      path: `${clientsCollectionPath}/${clientId}`,
      message: isDevelopment && customId?.trim() 
        ? `Cliente creado exitosamente con ID personalizado: ${clientId}`
        : 'Cliente creado exitosamente con perfil AI inicial'
    });

  } catch (error) {
    console.error('❌ Error creating client:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno del servidor',
        details: 'Error al crear cliente en Firebase'
      },
      { status: 500 }
    );
  }
}