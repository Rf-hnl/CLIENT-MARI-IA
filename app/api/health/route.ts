import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'client-mar-ia'
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ 
      status: 'error',
      timestamp: new Date().toISOString(),
      service: 'client-mar-ia'
    }, { status: 500 });
  }
}