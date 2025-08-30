import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { callLogId } = body;

    if (!callLogId) {
      return NextResponse.json({ error: 'callLogId is required' }, { status: 400 });
    }

    // 1. Find the call log in our database
    const callLog = await prisma.leadCallLog.findUnique({
      where: { id: callLogId },
      include: { elevenLabsConfig: true }, // Include the config to get the API key
    });

    if (!callLog) {
      return NextResponse.json({ error: 'CallLog not found' }, { status: 404 });
    }

    if (!callLog.elevenLabsBatchId) {
      return NextResponse.json({ error: 'elevenLabsBatchId not found for this call' }, { status: 400 });
    }
    
    if (callLog.conversationId) {
        return NextResponse.json({ message: 'Conversation ID already exists', conversationId: callLog.conversationId }, { status: 200 });
    }

    const { elevenLabsConfig, elevenLabsBatchId } = callLog;

    if (!elevenLabsConfig) {
        return NextResponse.json({ error: 'ElevenLabs configuration not found for this call' }, { status: 400 });
    }

    // 2. Fetch batch call details from ElevenLabs
    const batchDetailsUrl = `${elevenLabsConfig.apiUrl}/v1/convai/batch-calling/${elevenLabsBatchId}`;
    const elevenLabsResponse = await fetch(batchDetailsUrl, {
      method: 'GET',
      headers: {
        'xi-api-key': elevenLabsConfig.apiKey,
      },
    });

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text();
      console.error(`[SYNC-STATUS] ElevenLabs API error: ${errorText}`);
      return NextResponse.json({ error: 'Failed to get call status from ElevenLabs', details: errorText }, { status: elevenLabsResponse.status });
    }

    const batchDetails = await elevenLabsResponse.json();

    // 3. Extract the conversation_id
    const recipient = batchDetails.recipients?.[0];
    const conversationId = recipient?.conversation_id;

    if (!conversationId) {
      return NextResponse.json({ error: 'conversation_id not found in ElevenLabs response' }, { status: 404 });
    }

    // 4. Update our database with the new conversation_id
    const updatedCallLog = await prisma.leadCallLog.update({
      where: { id: callLogId },
      data: { conversationId: conversationId },
    });

    console.log(`[SYNC-STATUS] Successfully synced conversationId ${conversationId} for callLogId ${callLogId}`);

    return NextResponse.json({
      success: true,
      message: 'Successfully synced conversation ID',
      conversationId: updatedCallLog.conversationId,
    });

  } catch (error) {
    console.error('[SYNC-STATUS] Error:', error);
    return NextResponse.json({ error: 'An internal error occurred' }, { status: 500 });
  }
}
