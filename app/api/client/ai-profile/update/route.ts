import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { IClientAIProfile, IClientDocument } from '@/modules/clients/types/clients';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, organizationId, clientId, aiProfileUpdates } = body;

    // Validate required parameters
    if (!tenantId || !organizationId || !clientId || !aiProfileUpdates) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'tenantId, organizationId, clientId y aiProfileUpdates son requeridos' 
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

    const currentData = clientDoc.data() as IClientDocument;
    
    // Check if document has new structure
    if (!currentData.customerInteractions) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'El cliente no tiene estructura de customerInteractions. Requiere migración.' 
        },
        { status: 400 }
      );
    }

    // Prepare updated AI profile with timestamp
    const updatedAIProfile: Partial<IClientAIProfile> = {
      ...aiProfileUpdates,
      clientId, // Ensure clientId is always correct
      lastUpdatedByAI: FieldValue.serverTimestamp(),
    };

    // Update the document
    await clientDocRef.update({
      'customerInteractions.clientAIProfiles': updatedAIProfile,
      updated_at: FieldValue.serverTimestamp()
    });

    console.log(`✅ Perfil AI actualizado para cliente: ${clientId}`);

    return NextResponse.json({
      success: true,
      data: {
        clientId,
        updatedFields: Object.keys(aiProfileUpdates),
        timestamp: new Date().toISOString()
      },
      message: 'Perfil de IA actualizado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error updating AI profile:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno del servidor',
        details: 'Error al actualizar perfil de IA'
      },
      { status: 500 }
    );
  }
}

// Helper endpoint to regenerate AI profile based on client data
export async function PUT(request: NextRequest) {
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

    const currentData = clientDoc.data() as IClientDocument;
    
    // Check if document has new structure
    if (!currentData.customerInteractions) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'El cliente no tiene estructura de customerInteractions. Requiere migración.' 
        },
        { status: 400 }
      );
    }

    // Here you would typically call an AI service to analyze the client data
    // For now, we'll create an improved profile based on current data
    const clientData = currentData._data;
    const currentAI = currentData.customerInteractions.clientAIProfiles;

    // Generate improved AI profile based on client data
    const improvedAIProfile: Partial<IClientAIProfile> = {
      ...currentAI,
      
      // Update based on payment behavior
      paymentBehaviorScore: clientData.days_overdue > 30 ? 25 : 
                           clientData.days_overdue > 0 ? 50 : 75,
      
      // Update risk based on debt and payment history
      riskScore: Math.min(100, 
        (clientData.days_overdue * 2) + 
        (clientData.debt > 10000 ? 20 : 10)
      ),
      
      // Update recovery probability based on risk
      recoveryProbability: Math.max(20, 100 - (clientData.days_overdue * 1.5)),
      
      // Update segment based on current status
      profileSegment: clientData.days_overdue > 90 ? "Problematic" :
                     clientData.days_overdue > 30 ? "AtRisk" :
                     clientData.debt > 15000 ? "HighValue" : "Standard" as any,
      
      // Add insights based on data
      aiInsights: [
        ...(currentAI?.aiInsights || []),
        `Análisis actualizado: ${clientData.days_overdue} días vencidos`,
        `Deuda actual: $${clientData.debt.toLocaleString()}`,
        clientData.preferred_contact_method ? 
          `Prefiere contacto por ${clientData.preferred_contact_method}` : 
          "Método de contacto no especificado"
      ].slice(-5), // Keep only last 5 insights
      
      // Update metadata
      lastUpdatedByAI: FieldValue.serverTimestamp(),
      analysisDate: FieldValue.serverTimestamp(),
      aiModel: "rule-based-analyzer-v1.0",
      confidenceScore: 65, // Medium confidence for rule-based analysis
      dataQuality: currentAI?.dataQuality || "medium"
    };

    // Update the document
    await clientDocRef.update({
      'customerInteractions.clientAIProfiles': improvedAIProfile,
      updated_at: FieldValue.serverTimestamp()
    });

    console.log(`✅ Perfil AI regenerado para cliente: ${clientId}`);

    return NextResponse.json({
      success: true,
      data: {
        clientId,
        profileSegment: improvedAIProfile.profileSegment,
        riskScore: improvedAIProfile.riskScore,
        timestamp: new Date().toISOString()
      },
      message: 'Perfil de IA regenerado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error regenerating AI profile:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno del servidor',
        details: 'Error al regenerar perfil de IA'
      },
      { status: 500 }
    );
  }
}