import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { IClient } from '@/modules/clients/types/clients';
import firebaseApp from '@/lib/firebase/client';

const db = getFirestore(firebaseApp);

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

    // Generate system fields
    const systemFields = generateSystemFields(clientData);

    // Prepare final client data
    const finalClientData = {
      ...clientData,
      ...systemFields,
    };

    // Create document path
    const clientsCollectionPath = `tenants/${tenantId}/organizations/${organizationId}/clients`;
    const clientsRef = collection(db, clientsCollectionPath);

    // Add client to Firebase
    const docRef = await addDoc(clientsRef, finalClientData);

    console.log(`✅ Cliente creado exitosamente en: ${clientsCollectionPath}/${docRef.id}`);

    return NextResponse.json({
      success: true,
      data: {
        id: docRef.id,
        ...finalClientData
      },
      path: `${clientsCollectionPath}/${docRef.id}`,
      message: 'Cliente creado exitosamente'
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