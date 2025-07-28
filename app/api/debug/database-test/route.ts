import { adminDb } from '@/lib/firebase/admin';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test Firebase Admin connection
    const testQuery = await adminDb.collection('clients').limit(1).get();
    
    return NextResponse.json({
      success: true,
      data: {
        size: testQuery.size,
        empty: testQuery.empty,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}