import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import firebaseApp from '@/lib/firebase/client';

const db = getFirestore(firebaseApp);

/**
 * DEBUG ENDPOINT - Firebase Path Investigation
 * 
 * Investiga la estructura real de Firebase para encontrar los clientes
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId } = body;

    console.log('🔍 Debugging Firebase structure for client:', clientId);

    // Try different possible paths
    const possiblePaths = [
      `clients/${clientId}`,
      `tenants/default-tenant/organizations/default-org/clients/${clientId}`,
      `tenants/default/organizations/default/clients/${clientId}`,
      `organizations/default/clients/${clientId}`,
      `users/${clientId}`,
      clientId // Direct document access
    ];

    const results = [];

    for (const path of possiblePaths) {
      try {
        console.log(`🔍 Trying path: ${path}`);
        const docRef = doc(db, path);
        const docSnap = await getDoc(docRef);
        
        results.push({
          path,
          exists: docSnap.exists(),
          data: docSnap.exists() ? 'Document found!' : 'Not found'
        });

        if (docSnap.exists()) {
          console.log(`✅ Found client at path: ${path}`);
        }
      } catch (error) {
        results.push({
          path,
          exists: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Also try to list collections at root level
    let rootCollections = [];
    try {
      // This is a server-side only operation in Firebase
      console.log('🔍 Investigating root collections...');
      rootCollections = ['clients', 'tenants', 'organizations', 'users'];
    } catch (error) {
      console.log('Cannot list collections from client-side');
    }

    return NextResponse.json({
      success: true,
      clientId,
      pathResults: results,
      rootCollections,
      message: 'Firebase path investigation completed'
    });

  } catch (error) {
    console.error('❌ Error in debug endpoint:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}