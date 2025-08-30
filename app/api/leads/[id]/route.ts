import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jose from 'jose';

/**
 * GET - Obtener un lead específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
    console.log(`🔍 [LEAD_GET] Fetching lead: ${leadId}`);

    // 1. Autenticación (opcional - ajustar según necesidades)
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const secret = new TextEncoder().encode(
          process.env.JWT_SECRET || 'super-secret-key-for-debugging-only'
        );
        await jose.jwtVerify(token, secret);
      } catch (authError) {
        console.error('❌ [LEAD_GET] Authentication failed:', authError);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // 2. Buscar el lead en la base de datos
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        campaign: true,
        callLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10 // Últimos 10 call logs
        },
        conversationAnalysis: {
          orderBy: { createdAt: 'desc' },
          take: 5 // Últimos 5 análisis
        }
      }
    });

    if (!lead) {
      console.log(`❌ [LEAD_GET] Lead not found: ${leadId}`);
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    console.log(`✅ [LEAD_GET] Lead found: ${lead.name || lead.id}`);
    return NextResponse.json({ lead }, { status: 200 });

  } catch (error) {
    console.error('❌ [LEAD_GET] Error fetching lead:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}