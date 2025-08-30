import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jose from 'jose';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [CLIENT CALL INITIATE] Starting call initiation...');

    // 1. Autenticación y autorización
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.log('❌ [CLIENT CALL INITIATE] No authorization header');
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'super-secret-key-for-debugging-only'
    );

    let user;
    try {
      const { payload } = await jose.jwtVerify(token, secret);
      user = { id: payload.userId as string, email: payload.email as string };
    } catch {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Token verification failed' }, { status: 401 });
    }

    // 2. Parsear request
    const body = await request.json();
    const { clientId, tenantId, organizationId, agentId, callType } = body;

    console.log('📦 [CLIENT CALL INITIATE] Request body:', { clientId, tenantId, organizationId, agentId, callType });

    if (!clientId || !tenantId || !organizationId || !agentId || !callType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 3. Verificar que el tenant existe y pertenece al usuario
    const tenant = await prisma.tenant.findFirst({
      where: { 
        id: tenantId,
        ownerId: user.id 
      }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found or access denied' }, { status: 404 });
    }

    // 4. Buscar el cliente en la tabla de clientes
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        tenantId: tenantId,
        organizationId: organizationId
      }
    });

    if (!client) {
      console.log('❌ [CLIENT CALL INITIATE] Client not found:', clientId);
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    console.log('✅ [CLIENT CALL INITIATE] Client found:', { id: client.id, name: client.name, phone: client.phone });

    // 5. Verificar que el cliente tenga teléfono
    if (!client.phone) {
      console.log('❌ [CLIENT CALL INITIATE] Client has no phone number:', clientId);
      return NextResponse.json({ error: 'Client has no phone number' }, { status: 400 });
    }

    // 6. Buscar o crear un lead correspondiente para este cliente
    let lead = await prisma.lead.findFirst({
      where: {
        email: client.email,
        tenantId: tenantId,
        organizationId: organizationId
      }
    });

    if (!lead) {
      // Crear un lead basado en los datos del cliente
      lead = await prisma.lead.create({
        data: {
          name: client.name,
          email: client.email,
          phone: client.phone,
          company: client.company || '',
          status: 'contacted', // Estado apropiado para un cliente existente
          priority: 'medium',
          source: 'client_conversion',
          tenantId: tenantId,
          organizationId: organizationId,
          address: client.address || '',
          // Estas propiedades no existen en el modelo Client, las dejamos vacías por defecto
          city: '',
          country: '',
          province: '',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      console.log('✅ [CLIENT CALL INITIATE] Lead created from client:', lead.id);
    } else {
      console.log('✅ [CLIENT CALL INITIATE] Existing lead found:', lead.id);
    }

    // 7. Mapear callType de cliente a callType de lead
    const leadCallTypeMapping: { [key: string]: string } = {
      'overdue_payment_call': 'follow_up',
      'follow_up_call': 'follow_up', 
      'request_info_call': 'qualification',
      'general_inquiry_call': 'prospecting'
    };

    const leadCallType = leadCallTypeMapping[callType] || 'follow_up';

    // 8. Llamar a la API de leads para iniciar la llamada
    const leadCallResponse = await fetch(`${request.url.replace('/api/client/calls/initiate', '')}/api/leads/${lead.id}/call`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        agentId,
        callType: leadCallType,
        notes: `Llamada iniciada desde cliente: ${client.name} (${client.id}). Tipo original: ${callType}`
      })
    });

    if (!leadCallResponse.ok) {
      const errorText = await leadCallResponse.text();
      console.error('❌ [CLIENT CALL INITIATE] Lead call API error:', errorText);
      return NextResponse.json({ 
        error: 'Failed to initiate call through leads API',
        details: errorText
      }, { status: leadCallResponse.status });
    }

    const leadCallResult = await leadCallResponse.json();
    console.log('✅ [CLIENT CALL INITIATE] Lead call initiated:', leadCallResult);

    // 9. El call log ya se creó en la API de leads, no necesitamos duplicarlo
    console.log('✅ [CLIENT CALL INITIATE] Call log handled by leads API');

    return NextResponse.json({
      success: true,
      message: 'Call initiated successfully',
      data: {
        clientId: client.id,
        leadId: lead.id,
        callType: leadCallType,
        elevenLabsResponse: leadCallResult.elevenLabsResponse,
        callLog: leadCallResult.callLog
      }
    });

  } catch (error) {
    console.error('💥 [CLIENT CALL INITIATE] Internal error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}