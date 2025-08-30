import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jose from 'jose';
import { getAgentConfig } from '@/lib/config/agentConfig';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: leadId } = await params;
    console.log('🔍 [LEAD CONVERSATIONS] Getting conversations for lead:', leadId);

    // 1. Autenticación
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

    // 2. Obtener tenant
    const tenant = await prisma.tenant.findFirst({
      where: { ownerId: user.id }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // 3. Verificar que el lead pertenece al tenant
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        tenantId: tenant.id
      }
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // 4. Obtener todos los call logs del lead (de cualquier agente)
    const allCallLogs = await prisma.leadCallLog.findMany({
      where: {
        leadId: leadId,
        tenantId: tenant.id
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('📞 [LEAD CONVERSATIONS] Found call logs:', allCallLogs.length);
    console.log('📞 [LEAD CONVERSATIONS] Call logs details:', allCallLogs.map(log => ({
      id: log.id,
      conversationId: log.conversationId,
      agentId: log.agentId,
      status: log.status
    })));

    // 4.1. Sincronizar conversationId para call logs que no lo tienen
    let syncedCount = 0;
    
    // Obtener configuración ENV de ElevenLabs
    let agentConfig;
    try {
      agentConfig = getAgentConfig();
    } catch (error) {
      console.error('❌ [LEAD CONVERSATIONS] Agent configuration error:', error);
      return NextResponse.json({ 
        error: 'Agent configuration invalid', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
    
    for (const callLog of allCallLogs) {
      if (!callLog.conversationId && callLog.elevenLabsBatchId) {
        try {
          console.log(`🔄 [LEAD CONVERSATIONS] Syncing batch ${callLog.elevenLabsBatchId}`);
          
          const batchResponse = await fetch(
            `${agentConfig.apiUrl}/v1/convai/batch-calling/${callLog.elevenLabsBatchId}`,
            {
              method: 'GET',
              headers: {
                'xi-api-key': agentConfig.apiKey,
                'Content-Type': 'application/json'
              }
            }
          );

          if (batchResponse.ok) {
            const batchData = await batchResponse.json();
            const recipient = batchData.recipients?.[0];
            
            if (recipient && recipient.conversation_id) {
              await prisma.leadCallLog.update({
                where: { id: callLog.id },
                data: {
                  conversationId: recipient.conversation_id,
                  status: recipient.status || batchData.status,
                  updatedAt: new Date()
                }
              });
              
              // Actualizar el objeto en memoria
              callLog.conversationId = recipient.conversation_id;
              syncedCount++;
              console.log(`✅ [LEAD CONVERSATIONS] Synced conversation ${recipient.conversation_id}`);
            }
          }
        } catch (error) {
          console.warn(`⚠️ [LEAD CONVERSATIONS] Failed to sync batch ${callLog.elevenLabsBatchId}:`, error);
        }
      }
    }

    if (syncedCount > 0) {
      console.log(`🔄 [LEAD CONVERSATIONS] Synced ${syncedCount} conversation IDs`);
    }

    // 4.2. Filtrar solo los call logs que tienen conversationId
    const callLogs = allCallLogs.filter(log => log.conversationId);

    if (callLogs.length === 0) {
      return NextResponse.json({
        success: true,
        conversations: [],
        total: 0,
        message: 'No conversations found. Call logs may still be processing.'
      });
    }

    // 5. Usar configuración ENV de ElevenLabs (ya obtenida arriba)

    // 6. Obtener todos los agentes que han llamado a este lead
    const agentIds = [...new Set(callLogs.map(log => log.agentId))];
    console.log('🤖 [LEAD CONVERSATIONS] Agents that called this lead:', agentIds);

    // 7. Para cada agente, obtener conversaciones de ElevenLabs directamente
    const allConversations = [];
    console.log('📋 [LEAD CONVERSATIONS] Lead info for filtering:', { 
      id: lead.id, 
      name: lead.name, 
      phone: lead.phone 
    });
    
    for (const agentId of agentIds) {
      try {
        // Usar API de conversaciones con filtros
        const conversationsUrl = new URL(`${agentConfig.apiUrl}/v1/convai/conversations`);
        conversationsUrl.searchParams.set('agent_id', agentId);
        conversationsUrl.searchParams.set('page_size', '100');
        conversationsUrl.searchParams.set('summary_mode', 'include');
        
        // Filtrar por fechas si es posible (últimos 30 días)
        const thirtyDaysAgo = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
        conversationsUrl.searchParams.set('call_start_after_unix', thirtyDaysAgo.toString());

        const conversationsResponse = await fetch(conversationsUrl.toString(), {
          method: 'GET',
          headers: {
            'xi-api-key': agentConfig.apiKey,
            'Content-Type': 'application/json'
          }
        });

        if (conversationsResponse.ok) {
          const conversationsData = await conversationsResponse.json();
          
          // Filtrar conversaciones que corresponden ESPECÍFICAMENTE a este lead
          const leadConversations = conversationsData.conversations.filter((conv: any) => {
            // Solo incluir conversaciones que tienen un call log específico para este lead
            const matchingCallLog = callLogs.find(log => 
              log.conversationId === conv.conversation_id
            );
            
            // También verificar por número de teléfono si no hay conversationId match
            if (!matchingCallLog && lead.phone) {
              // Normalizar números de teléfono para comparación
              const normalizePhone = (phone: string) => phone.replace(/[\s\-\(\)\+]/g, '');
              const leadPhoneNormalized = normalizePhone(lead.phone);
              
              // Verificar si la conversación fue hacia el número del lead
              if (conv.end_user_phone_number) {
                const convPhoneNormalized = normalizePhone(conv.end_user_phone_number);
                return convPhoneNormalized.includes(leadPhoneNormalized) || 
                       leadPhoneNormalized.includes(convPhoneNormalized);
              }
            }
            
            return matchingCallLog !== undefined;
          });

          // Enriquecer con datos locales
          for (const conv of leadConversations) {
            const callLog = callLogs.find(log => 
              log.conversationId === conv.conversation_id
            );

            allConversations.push({
              // Datos de ElevenLabs (principal)
              conversationId: conv.conversation_id,
              agentId: conv.agent_id,
              agentName: conv.agent_name,
              startTime: conv.start_time_unix_secs ? new Date(conv.start_time_unix_secs * 1000).toISOString() : null,
              duration: conv.call_duration_secs,
              messageCount: conv.message_count,
              status: conv.status,
              callSuccessful: conv.call_successful,
              transcriptSummary: conv.transcript_summary,
              callSummaryTitle: conv.call_summary_title,
              direction: conv.direction,
              
              // Datos locales (secundarios)
              callLogId: callLog?.id || null,
              elevenLabsBatchId: callLog?.elevenLabsBatchId || null,
              callType: callLog?.callType || 'unknown',
              localStatus: callLog?.status || 'unknown',
              createdAt: callLog?.createdAt || null
            });
          }

          console.log(`✅ [LEAD CONVERSATIONS] Found ${conversationsData.conversations.length} total conversations for agent ${agentId}`);
          console.log(`🎯 [LEAD CONVERSATIONS] Filtered ${leadConversations.length} conversations for this specific lead`);
          console.log('🎯 [LEAD CONVERSATIONS] Lead-specific conversations:', leadConversations.map(conv => ({
            conversationId: conv.conversation_id,
            agentId: conv.agent_id,
            status: conv.status,
            startTime: conv.start_time_unix_secs,
            endUserPhone: conv.end_user_phone_number
          })));
          
        } else {
          console.warn(`⚠️ [LEAD CONVERSATIONS] Failed to fetch conversations for agent ${agentId}: ${conversationsResponse.status}`);
        }
      } catch (error) {
        console.error(`❌ [LEAD CONVERSATIONS] Error fetching conversations for agent ${agentId}:`, error);
      }
    }

    // 8. Ordenar por fecha de inicio (más recientes primero)
    const conversations = allConversations.sort((a, b) => {
      const timeA = a.startTime ? new Date(a.startTime).getTime() : 0;
      const timeB = b.startTime ? new Date(b.startTime).getTime() : 0;
      return timeB - timeA;
    });

    console.log('✅ [LEAD CONVERSATIONS] Final processed conversations:', conversations.length);
    console.log('📊 [LEAD CONVERSATIONS] Data sources breakdown:');
    console.log('   - Call logs in DB:', allCallLogs.length);
    console.log('   - Conversations from ElevenLabs:', conversations.length);
    console.log('   - Difference:', conversations.length - allCallLogs.length);

    return NextResponse.json({
      success: true,
      conversations: conversations,
      total: conversations.length,
      leadInfo: {
        id: lead.id,
        name: lead.name,
        phone: lead.phone
      }
    });

  } catch (error) {
    console.error('💥 [LEAD CONVERSATIONS] Internal error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}