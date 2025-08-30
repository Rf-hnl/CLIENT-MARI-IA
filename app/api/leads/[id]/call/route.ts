import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jose from 'jose';
import { getAgentConfig } from '@/lib/config/agentConfig';

interface ElevenLabsBatchCallRequest {
  call_name: string;
  agent_id: string;
  agent_phone_number_id: string;
  scheduled_time_unix: number;
  recipients: Array<{
    phone_number: string;
    conversation_initiation_client_data?: {
      dynamic_variables?: Record<string, string>;
    };
  }>;
}

interface ElevenLabsBatchCallResponse {
  id: string;
  phone_number_id: string;
  name: string;
  agent_id: string;
  created_at_unix: number;
  scheduled_time_unix: number;
  total_calls_dispatched: number;
  total_calls_scheduled: number;
  last_updated_at_unix: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  agent_name: string;
  phone_provider: 'twilio' | 'sip_trunk';
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    console.log('🚀 [LEAD CALL] Starting call initiation for lead:', id);

    // 1. Autenticación y autorización
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.log('❌ [LEAD CALL] No authorization header');
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

    // 2. Obtener perfil de usuario y tenant
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id }
    });

    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const tenant = await prisma.tenant.findFirst({
      where: { ownerId: user.id }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const organization = await prisma.organization.findFirst({
      where: { 
        tenantId: tenant.id,
        ownerId: user.id 
      }
    });

    // 3. Parsear request
    const body = await request.json();
    const { callType = 'prospecting', notes } = body;
    const leadId = id;
    
    // Ignore any agentId sent from client (migrating to env-based agent)
    if ('agentId' in body) {
      console.warn('🔄 [LEAD CALL] Client-sent agentId ignored, using ENV agent');
    }

    console.log('📦 [LEAD CALL] Request body:', { callType, notes, leadId });
    console.log('👤 [LEAD CALL] User context:', { userId: user.id, tenantId: tenant.id, organizationId: organization?.id });

    // Get static agent configuration from environment
    let agentConfig;
    try {
      agentConfig = getAgentConfig();
      console.log('✅ [LEAD CALL] Using ENV agent:', agentConfig.agentId);
    } catch (error) {
      console.error('❌ [LEAD CALL] Agent configuration error:', error);
      return NextResponse.json({ 
        error: 'Agent configuration invalid', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
    
    const agentId = agentConfig.agentId;

    // 4. Obtener lead con validación de tenant
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        tenantId: tenant.id
      },
      include: {
        campaign: {
          include: {
            products: {
              include: {
                product: true
              }
            }
          }
        }
      }
    });

    if (!lead) {
      console.log('❌ [LEAD CALL] Lead not found:', leadId);
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (!lead.phone) {
      console.log('❌ [LEAD CALL] Lead has no phone number:', leadId);
      return NextResponse.json({ error: 'Lead has no phone number' }, { status: 400 });
    }

    // VALIDACIÓN: El lead debe tener una campaña asignada
    if (!lead.campaign) {
      console.log('❌ [LEAD CALL] Lead has no campaign assigned:', leadId);
      return NextResponse.json({ 
        error: 'No se puede realizar llamada sin campaña asignada',
        details: 'El lead debe tener una campaña asignada para que el agente sepa de qué productos hablar'
      }, { status: 400 });
    }

    console.log('✅ [LEAD CALL] Lead found:', { 
      id: lead.id, 
      name: lead.name, 
      phone: lead.phone,
      campaign: lead.campaign?.name || 'Sin campaña'
    });

    // 5. Skip agent reference validation (using static ENV agent)
    console.log('✅ [LEAD CALL] Using static ENV agent, skipping DB validation');

    // 6. Use static agent configuration (from ENV)
    console.log('✅ [LEAD CALL] Using ENV ElevenLabs config');
    console.log('📱 [LEAD CALL] Phone ID from ENV:', agentConfig.phoneId);

    // 6. Validate agent exists in ElevenLabs (using ENV config)
    try {
      const agentInfoResponse = await fetch(`${agentConfig.apiUrl}/v1/convai/agents/${agentId}`, {
        method: 'GET',
        headers: {
          'xi-api-key': agentConfig.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!agentInfoResponse.ok) {
        console.log('❌ [LEAD CALL] ENV Agent not found in ElevenLabs:', agentId);
        return NextResponse.json({ error: 'ENV Agent not found in ElevenLabs' }, { status: 400 });
      }

      const agentInfo = await agentInfoResponse.json();
      console.log('✅ [LEAD CALL] ENV Agent info from ElevenLabs:', agentInfo.name);

    } catch (error) {
      console.error('❌ [LEAD CALL] Error fetching ENV agent info:', error);
      return NextResponse.json({ error: 'Failed to validate ENV agent' }, { status: 500 });
    }

    // 7. Preparar variables dinámicas con información completa de la empresa
    const variables = {
      // Información del lead/cliente
      name: lead.name || "Cliente",
      email: lead.email || "",
      phone: lead.phone || "",
      lead_company: lead.company || "",
      lead_source: lead.source || "",
      lead_status: lead.status || "new",
      lead_priority: lead.priority || "medium",
      lead_address: lead.address || "",
      lead_city: lead.city || "",
      lead_country: lead.country || "",
      lead_province: lead.province || "",
      lead_position: lead.position || "",
      lead_budget_range: lead.budgetRange || "",
      lead_decision_timeline: lead.decisionTimeline || "",
      
      // Información de MI empresa (la que llama)
      my_company_name: organization?.name || "Mi Empresa",
      my_company_description: organization?.description || "",
      my_company_tagline: organization?.tagline || "",
      my_company_industry: organization?.industry || "",
      my_company_website: organization?.website || "",
      my_company_email: organization?.email || "",
      my_company_phone: organization?.phone || "",
      my_company_address: organization?.address || "",
      my_company_city: organization?.city || "",
      my_company_country: organization?.country || "",
      my_company_services: Array.isArray(organization?.services) ? organization.services.join(", ") : "",
      
      // Información para agentes IA
      company_values: organization?.companyValues || "",
      sales_pitch: organization?.salesPitch || "",
      target_audience: organization?.targetAudience || "",
      
      // Información contextual
      notes: notes || "Sin notas adicionales",
      today_date: new Date().toISOString().split('T')[0],
      
      // NUEVA INFORMACIÓN DE CAMPAÑA Y PRODUCTOS
      campaign_name: lead.campaign?.name || "Sin campaña específica",
      campaign_description: lead.campaign?.description || "",
      campaign_budget: lead.campaign?.budget ? `$${lead.campaign.budget}` : "",
      campaign_status: lead.campaign?.status || "N/A",
      campaign_start_date: lead.campaign?.startDate?.toISOString().split('T')[0] || "",
      campaign_end_date: lead.campaign?.endDate?.toISOString().split('T')[0] || "",
      
      // Productos de la campaña
      campaign_products: lead.campaign?.products?.map(cp => cp.product.name).join(", ") || "Productos generales",
      campaign_products_count: lead.campaign?.products?.length || 0,
      campaign_products_detailed: lead.campaign?.products?.map(cp => 
        `${cp.product.name}${cp.product.price ? ` ($${cp.product.price})` : ''}${cp.product.description ? ` - ${cp.product.description}` : ''}`
      ).join(" | ") || "Sin productos específicos",
      
      // Variables para enfoque específico de la campaña
      has_specific_campaign: lead.campaign ? "true" : "false",
      campaign_focus_intro: lead.campaign 
        ? `Sobre la campaña "${lead.campaign.name}" que te interesó` 
        : "Sobre nuestros servicios",
      call_type: callType || "prospecting",
      current_time: new Date().toLocaleString('es-PA', { 
        timeZone: organization?.timezone || 'UTC',
        hour12: true 
      })
    };

    // 8. Preparar datos para la llamada
    let cleanPhone = lead.phone.replace(/\D/g, ''); // Remover caracteres no numéricos
    
    // Asegurar formato E.164 (debe empezar con +)
    if (!cleanPhone.startsWith('+')) {
      if (!cleanPhone.startsWith('507') && cleanPhone.length === 8) {
        cleanPhone = `+507${cleanPhone}`; // Asumir Panamá si son 8 dígitos
      } else {
        cleanPhone = `+${cleanPhone}`;
      }
    }
    
    console.log('📱 [LEAD CALL] Phone number formatted:', { original: lead.phone, cleaned: cleanPhone });
    const callName = `Lead_${lead.name || 'Unknown'}_${Date.now()}`.replace(/\s+/g, '_');

    const batchCallRequest: ElevenLabsBatchCallRequest = {
      call_name: callName,
      agent_id: agentId, // From ENV
      agent_phone_number_id: agentConfig.phoneId, // From ENV
      scheduled_time_unix: 1, // Llamada inmediata
      recipients: [{
        phone_number: cleanPhone,
        conversation_initiation_client_data: {
          dynamic_variables: variables
        }
      }]
    };

    console.log('🔤 [LEAD CALL] Dynamic variables:', variables);
    console.log('📞 [LEAD CALL] Batch call request:', batchCallRequest);

    // Debug: Generar el curl exacto que se está enviando
    const curlCommand = `curl -X POST ${agentConfig.apiUrl}/v1/convai/batch-calling/submit \\
     -H "xi-api-key: ${agentConfig.apiKey}" \\
     -H "Content-Type: application/json" \\
     -d '${JSON.stringify(batchCallRequest, null, 2)}'`;
    
    console.log('🔍 [LEAD CALL] CURL equivalent command:');
    console.log(curlCommand);

    // 8. Iniciar llamada con ElevenLabs Batch Calling API (using ENV config)
    const elevenLabsResponse = await fetch(`${agentConfig.apiUrl}/v1/convai/batch-calling/submit`, {
      method: 'POST',
      headers: {
        'xi-api-key': agentConfig.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(batchCallRequest)
    });

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text();
      console.error('❌ [LEAD CALL] ElevenLabs API error:', errorText);
      return NextResponse.json({ 
        error: 'Failed to initiate call with ElevenLabs',
        details: errorText
      }, { status: elevenLabsResponse.status });
    }

    const callResult: ElevenLabsBatchCallResponse = await elevenLabsResponse.json();
    console.log('✅ [LEAD CALL] ElevenLabs call initiated:', callResult);

    // 9. Crear registro en call logs (using ENV agent)
    const callLog = await prisma.leadCallLog.create({
      data: {
        leadId,
        tenantId: tenant.id,
        organizationId: organization?.id,
        // elevenLabsConfigId: null, // No longer using DB config
        elevenLabsBatchId: callResult.id,
        agentId, // From ENV
        agentName: callResult.agent_name,
        callType,
        status: 'initiating',
        notes: notes ? `${notes}\n\nVariables dinámicas: ${JSON.stringify(variables, null, 2)}\n\nAgent Source: ENV` : `Variables dinámicas: ${JSON.stringify(variables, null, 2)}\n\nAgent Source: ENV`,
        elevenLabsJobId: callResult.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('✅ [LEAD CALL] Call log created:', callLog.id);

    // 10. Actualizar lead con último intento de contacto
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        lastContactDate: new Date(),
        contactAttempts: { increment: 1 },
        updatedAt: new Date()
      }
    });

    console.log('✅ [LEAD CALL] Lead contact data updated');

    // 11. Skip agent reference stats update (ENV agent doesn't use DB)
    console.log('✅ [LEAD CALL] Using ENV agent, skipping DB stats update');

    return NextResponse.json({
      success: true,
      callLog: {
        id: callLog.id,
        leadId: callLog.leadId,
        agentId: callLog.agentId,
        agentName: callLog.agentName,
        status: callLog.status,
        callType: callLog.callType,
        elevenLabsBatchId: callLog.elevenLabsBatchId
      },
      elevenLabsResponse: {
        batchId: callResult.id,
        status: callResult.status,
        totalCalls: callResult.total_calls_scheduled,
        agentName: callResult.agent_name
      }
    });

  } catch (error) {
    console.error('💥 [LEAD CALL] Internal error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET - Obtener estado de una llamada específica
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Autenticación
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
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

    const tenant = await prisma.tenant.findFirst({
      where: { ownerId: user.id }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');

    if (!batchId) {
      // Obtener todas las llamadas del lead
      const callLogs = await prisma.leadCallLog.findMany({
        where: {
          leadId: id,
          tenantId: tenant.id
        },
        orderBy: { createdAt: 'desc' }
      });

      return NextResponse.json({
        success: true,
        callLogs
      });
    }

    // Obtener estado específico de ElevenLabs
    const callLog = await prisma.leadCallLog.findFirst({
      where: {
        leadId: id,
        elevenLabsBatchId: batchId,
        tenantId: tenant.id
      }
    });

    if (!callLog) {
      return NextResponse.json({ error: 'Call log not found' }, { status: 404 });
    }

    // Get ENV agent configuration for API call
    const agentConfig = getAgentConfig();
    
    // Consultar estado en ElevenLabs (using ENV config)
    const elevenLabsResponse = await fetch(
      `${agentConfig.apiUrl}/v1/convai/batch-calling/${batchId}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': agentConfig.apiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!elevenLabsResponse.ok) {
      return NextResponse.json({ 
        error: 'Failed to get call status from ElevenLabs' 
      }, { status: 500 });
    }

    const batchStatus = await elevenLabsResponse.json();

    // Actualizar estado local si ha cambiado
    if (batchStatus.status !== callLog.status) {
      await prisma.leadCallLog.update({
        where: { id: callLog.id },
        data: { 
          status: batchStatus.status,
          updatedAt: new Date()
        }
      });
    }

    return NextResponse.json({
      success: true,
      callLog: {
        ...callLog,
        status: batchStatus.status
      },
      elevenLabsStatus: batchStatus
    });

  } catch (error) {
    console.error('💥 [GET CALL STATUS] Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}