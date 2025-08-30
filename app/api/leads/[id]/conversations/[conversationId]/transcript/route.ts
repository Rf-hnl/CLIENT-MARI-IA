import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jose from 'jose';
import { getAgentConfig } from '@/lib/config/agentConfig';

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string; conversationId: string }> }
) {
  try {
    const { id: leadId, conversationId } = await params;
    console.log('📜 [CONVERSATION TRANSCRIPT] Getting transcript for:', conversationId);

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

    // 3. Verificar que la conversación pertenece a este lead y tenant
    const callLog = await prisma.leadCallLog.findFirst({
      where: {
        leadId: leadId,
        conversationId: conversationId,
        tenantId: tenant.id
      },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    });

    if (!callLog) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    console.log('🔍 [CONVERSATION TRANSCRIPT] Found call log for conversation');

    // 3.1. Obtener configuración ENV de ElevenLabs
    let agentConfig;
    try {
      agentConfig = getAgentConfig();
    } catch (error) {
      console.error('❌ [CONVERSATION TRANSCRIPT] Agent configuration error:', error);
      return NextResponse.json({ 
        error: 'Agent configuration invalid', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

    // 4. Obtener la transcripción completa desde ElevenLabs
    try {
      const transcriptResponse = await fetch(
        `${agentConfig.apiUrl}/v1/convai/conversations/${conversationId}`,
        {
          method: 'GET',
          headers: {
            'xi-api-key': agentConfig.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!transcriptResponse.ok) {
        return NextResponse.json({ 
          error: 'Failed to fetch transcript from ElevenLabs',
          status: transcriptResponse.status 
        }, { status: 500 });
      }

      const conversationData = await transcriptResponse.json();
      console.log('✅ [CONVERSATION TRANSCRIPT] Transcript fetched successfully');

      // 5. Formatear la transcripción para fácil lectura
      let formattedTranscript = '';
      
      if (conversationData.transcript && Array.isArray(conversationData.transcript)) {
        formattedTranscript = conversationData.transcript
          .map((message: any, index: number) => {
            const timestamp = message.timestamp ? 
              new Date(message.timestamp * 1000).toLocaleTimeString() : 
              `Mensaje ${index + 1}`;
            
            const speaker = message.role === 'agent' ? 
              `🤖 ${callLog.agentName || 'Agente'}` : 
              `👤 ${callLog.lead.name || 'Cliente'}`;
            
            return `[${timestamp}] ${speaker}: ${message.message || message.text || '(mensaje vacío)'}`;
          })
          .join('\n\n');
      } else {
        formattedTranscript = 'No hay transcripción disponible para esta conversación.';
      }

      // 6. Preparar respuesta completa
      const response = {
        success: true,
        conversationId: conversationId,
        callLogInfo: {
          id: callLog.id,
          agentId: callLog.agentId,
          agentName: callLog.agentName,
          callType: callLog.callType,
          status: callLog.status,
          createdAt: callLog.createdAt
        },
        leadInfo: {
          id: callLog.lead.id,
          name: callLog.lead.name,
          phone: callLog.lead.phone
        },
        conversationDetails: {
          start_time: conversationData.start_time_unix_secs ? 
            new Date(conversationData.start_time_unix_secs * 1000).toISOString() : null,
          duration_seconds: conversationData.call_duration_secs,
          duration_formatted: conversationData.call_duration_secs ? 
            formatDuration(conversationData.call_duration_secs) : null,
          message_count: conversationData.message_count,
          status: conversationData.status,
          call_successful: conversationData.call_successful,
          direction: conversationData.direction,
          transcript_summary: conversationData.transcript_summary,
          call_summary_title: conversationData.call_summary_title
        },
        transcript: {
          raw: conversationData.transcript || [],
          formatted: formattedTranscript
        }
      };

      return NextResponse.json(response);

    } catch (error) {
      console.error('❌ [CONVERSATION TRANSCRIPT] Error fetching from ElevenLabs:', error);
      return NextResponse.json({ 
        error: 'Error fetching transcript from ElevenLabs',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('💥 [CONVERSATION TRANSCRIPT] Internal error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Función auxiliar para formatear duración
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}