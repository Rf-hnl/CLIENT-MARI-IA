import { NextRequest, NextResponse } from 'next/server';
import { convertElevenLabsTranscript } from '@/lib/ai/conversationAnalyzer';

/**
 * ENDPOINT DE DEBUG - Obtener transcript raw de ElevenLabs
 * Solo para diagnóstico temporal
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    console.log('🔍 [DEBUG TRANSCRIPT] Getting raw transcript for:', conversationId);

    // Obtener configuración de ElevenLabs del ENV
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    const elevenLabsApiUrl = process.env.ELEVENLABS_API_URL;

    if (!elevenLabsApiKey || !elevenLabsApiUrl) {
      return NextResponse.json({ error: 'ElevenLabs not configured' }, { status: 400 });
    }

    console.log('🔗 [DEBUG TRANSCRIPT] Calling ElevenLabs API...');
    console.log(`   🎯 URL: ${elevenLabsApiUrl}/v1/convai/conversations/${conversationId}`);
    console.log(`   🔑 API Key: ${elevenLabsApiKey.substring(0, 20)}...`);

    // Obtener transcript directamente de ElevenLabs
    const transcriptResponse = await fetch(
      `${elevenLabsApiUrl}/v1/convai/conversations/${conversationId}`,
      {
        headers: {
          'xi-api-key': elevenLabsApiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('📊 [DEBUG TRANSCRIPT] ElevenLabs response status:', transcriptResponse.status);

    if (!transcriptResponse.ok) {
      const errorText = await transcriptResponse.text();
      console.error('❌ [DEBUG TRANSCRIPT] ElevenLabs error:', errorText);
      return NextResponse.json({ 
        error: 'ElevenLabs API error',
        status: transcriptResponse.status,
        details: errorText
      }, { status: 500 });
    }

    const rawData = await transcriptResponse.json();
    
    console.log('🔍 [DEBUG TRANSCRIPT] Raw ElevenLabs response analysis:');
    console.log(`   📊 Response keys:`, Object.keys(rawData));
    console.log(`   📊 Has transcript:`, !!rawData.transcript);
    console.log(`   📊 Transcript type:`, typeof rawData.transcript);
    console.log(`   📊 Transcript length:`, Array.isArray(rawData.transcript) ? rawData.transcript.length : 'N/A');
    
    if (Array.isArray(rawData.transcript)) {
      console.log(`   📊 Sample messages (first 3):`);
      rawData.transcript.slice(0, 3).forEach((msg, i) => {
        console.log(`      ${i + 1}. Role: ${msg.role}, Content: "${(msg.message || msg.text || '').substring(0, 100)}..."`);
      });
    }

    // Convertir usando nuestra función
    const convertedTranscript = convertElevenLabsTranscript(rawData.transcript || []);

    // Responder con datos detallados para diagnóstico
    return NextResponse.json({
      success: true,
      conversationId,
      debug: {
        elevenLabsApiUrl,
        elevenLabsResponseStatus: transcriptResponse.status,
        rawDataKeys: Object.keys(rawData),
        hasTranscript: !!rawData.transcript,
        transcriptType: typeof rawData.transcript,
        transcriptLength: Array.isArray(rawData.transcript) ? rawData.transcript.length : null
      },
      rawData: {
        ...rawData,
        // Limitar transcript a primeros 5 mensajes para no saturar logs
        transcript: Array.isArray(rawData.transcript) ? rawData.transcript.slice(0, 5) : rawData.transcript
      },
      convertedTranscript,
      summary: {
        messagesConverted: convertedTranscript.messages.length,
        totalDuration: convertedTranscript.duration,
        totalWords: convertedTranscript.totalWords,
        participantCount: convertedTranscript.participantCount
      }
    });

  } catch (error) {
    console.error('💥 [DEBUG TRANSCRIPT] Unexpected error:', error);
    return NextResponse.json({
      error: 'Debug endpoint error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}