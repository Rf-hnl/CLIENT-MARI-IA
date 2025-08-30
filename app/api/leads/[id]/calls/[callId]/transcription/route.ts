/**
 * API ENDPOINT: GET /api/leads/[id]/calls/[callId]/transcription
 * 
 * Fetches transcription data for a specific call from ElevenLabs
 * Updates the call log with the latest transcription data
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// ElevenLabs API types
interface ElevenLabsConversationResponse {
  conversation_id: string;
  status: string;
  transcript: {
    text: string;
    confidence: number;
  } | null;
  audio_url?: string;
  metadata?: any;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; callId: string } }
) {
  try {
    console.log('🔍 [TRANSCRIPTION API] Starting request for call:', params.callId);

    // Extract JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    let decodedToken: any;

    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as any;
      console.log('✅ [TRANSCRIPTION API] Token verified for user:', decodedToken.email);
    } catch (error) {
      console.error('❌ [TRANSCRIPTION API] JWT verification failed:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { tenantId } = decodedToken;
    const { id: leadId, callId } = params;

    // 1. Find the call log
    const callLog = await prisma.leadCallLog.findFirst({
      where: {
        id: callId,
        leadId: leadId,
        tenantId: tenantId
      }
    });

    if (!callLog) {
      console.error('❌ [TRANSCRIPTION API] Call log not found');
      return NextResponse.json({ error: 'Call log not found' }, { status: 404 });
    }

    if (!callLog.elevenLabsBatchId) {
      console.error('❌ [TRANSCRIPTION API] No ElevenLabs batch ID found');
      return NextResponse.json({ error: 'No batch ID available for this call' }, { status: 400 });
    }

    console.log('📞 [TRANSCRIPTION API] Found call log with batch ID:', callLog.elevenLabsBatchId);

    // 2. Get ElevenLabs config for this tenant
    const elevenLabsConfig = await prisma.elevenLabsConfig.findFirst({
      where: {
        tenantId: tenantId,
        isActive: true
      }
    });

    if (!elevenLabsConfig) {
      console.error('❌ [TRANSCRIPTION API] ElevenLabs config not found');
      return NextResponse.json({ error: 'ElevenLabs configuration not found' }, { status: 404 });
    }

    console.log('🔧 [TRANSCRIPTION API] Using ElevenLabs config:', elevenLabsConfig.name);

    // 3. Fetch conversation details from ElevenLabs
    const conversationResponse = await fetch(
      `https://api.elevenlabs.io/v1/convai/batch-calling/conversations/${callLog.elevenLabsBatchId}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': elevenLabsConfig.apiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('📡 [TRANSCRIPTION API] ElevenLabs API response status:', conversationResponse.status);

    if (!conversationResponse.ok) {
      const errorData = await conversationResponse.text();
      console.error('❌ [TRANSCRIPTION API] ElevenLabs API error:', errorData);
      
      // If conversation not found, it might still be processing
      if (conversationResponse.status === 404) {
        return NextResponse.json({
          transcription: callLog.transcription || '',
          confidence: 0,
          status: 'processing',
          message: 'Conversation still being processed'
        });
      }
      
      throw new Error(`ElevenLabs API error: ${conversationResponse.status}`);
    }

    const conversationData: ElevenLabsConversationResponse = await conversationResponse.json();
    console.log('📊 [TRANSCRIPTION API] Conversation data status:', conversationData.status);

    // 4. Extract transcription data
    const transcriptionText = conversationData.transcript?.text || callLog.transcription || '';
    const confidence = conversationData.transcript?.confidence || 0;
    const status = conversationData.status || 'unknown';
    const audioUrl = conversationData.audio_url;

    // 5. Update call log if we have new transcription data
    if (transcriptionText && transcriptionText !== callLog.transcription) {
      console.log('🔄 [TRANSCRIPTION API] Updating call log with new transcription');
      
      await prisma.leadCallLog.update({
        where: { id: callId },
        data: {
          transcription: transcriptionText,
          transcriptionStatus: status,
          transcriptionConfidence: confidence,
          audioUrl: audioUrl,
          updatedAt: new Date()
        }
      });
    }

    // 6. Return transcription data
    const responseData = {
      transcription: transcriptionText,
      confidence: confidence,
      status: status,
      audioUrl: audioUrl,
      conversationId: conversationData.conversation_id,
      lastUpdated: new Date().toISOString()
    };

    console.log('✅ [TRANSCRIPTION API] Returning transcription data');
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('💥 [TRANSCRIPTION API] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch transcription',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}