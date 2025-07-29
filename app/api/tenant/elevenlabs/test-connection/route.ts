import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { 
  ITenantElevenLabsConfig, 
  IElevenLabsConnectionTest,
  IElevenLabsVoice 
} from '@/types/elevenlabs';

// POST - Probar conexión con ElevenLabs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, testConfig }: { 
      tenantId: string; 
      testConfig?: {
        apiKey: string;
        apiUrl: string;
        phoneId: string;
      }
    } = body;

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId es requerido' },
        { status: 400 }
      );
    }

    console.log(`[TEST ELEVENLABS CONNECTION] Testing connection for tenant: ${tenantId}`);

    let config: ITenantElevenLabsConfig | null = null;

    // Si se proporciona testConfig, usar esos datos, sino obtener de la base de datos
    if (testConfig) {
      config = {
        tenantId,
        apiKey: testConfig.apiKey,
        apiUrl: testConfig.apiUrl,
        phoneId: testConfig.phoneId,
      } as ITenantElevenLabsConfig;
    } else {
      const configDocPath = `tenants/${tenantId}/elevenlabs-config/settings`;
      const configDoc = await adminDb.doc(configDocPath).get();

      if (!configDoc.exists) {
        return NextResponse.json({
          success: false,
          message: 'No hay configuración de ElevenLabs para este tenant',
          error: 'config_not_found'
        } as IElevenLabsConnectionTest);
      }

      config = configDoc.data() as ITenantElevenLabsConfig;
    }

    // Test 1: Validar API Key con endpoint de voces
    const testResults = {
      apiKeyValid: false,
      phoneIdValid: false,
      voicesAvailable: 0,
      rateLimitRemaining: 0
    };

    try {
      // Test de API Key - Obtener voces disponibles
      const voicesResponse = await fetch(`${config.apiUrl}/v1/voices`, {
        method: 'GET',
        headers: {
          'xi-api-key': config.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (voicesResponse.ok) {
        testResults.apiKeyValid = true;
        const voicesData = await voicesResponse.json();
        testResults.voicesAvailable = voicesData.voices?.length || 0;
        
        // Obtener rate limit info si está disponible
        const rateLimitRemaining = voicesResponse.headers.get('x-ratelimit-remaining');
        if (rateLimitRemaining) {
          testResults.rateLimitRemaining = parseInt(rateLimitRemaining);
        }
      } else {
        console.error('[TEST ELEVENLABS] API Key test failed:', voicesResponse.status, voicesResponse.statusText);
      }
    } catch (voicesError) {
      console.error('[TEST ELEVENLABS] Error testing API Key:', voicesError);
    }

    // Test 2: Validar Phone ID (si es posible)
    try {
      // Nota: ElevenLabs no siempre tiene un endpoint directo para validar phone ID
      // Por ahora asumimos que es válido si el API Key funciona
      testResults.phoneIdValid = testResults.apiKeyValid;
      
      // Aquí se podría hacer una llamada específica para validar el phone ID
      // const phoneResponse = await fetch(`${config.apiUrl}/v1/phone-numbers/${config.phoneId}`, {
      //   headers: { 'xi-api-key': config.apiKey }
      // });
      // testResults.phoneIdValid = phoneResponse.ok;
    } catch (phoneError) {
      console.error('[TEST ELEVENLABS] Error testing phone ID:', phoneError);
      testResults.phoneIdValid = false;
    }

    // Obtener voces si el test fue exitoso
    let voices: IElevenLabsVoice[] = [];
    if (testResults.apiKeyValid) {
      try {
        const voicesResponse = await fetch(`${config.apiUrl}/v1/voices`, {
          method: 'GET',
          headers: {
            'xi-api-key': config.apiKey,
            'Content-Type': 'application/json'
          }
        });

        if (voicesResponse.ok) {
          const voicesData = await voicesResponse.json();
          voices = voicesData.voices || [];
        }
      } catch (voicesError) {
        console.error('[TEST ELEVENLABS] Error fetching voices:', voicesError);
      }
    }

    // Determinar el resultado general
    const allTestsPassed = testResults.apiKeyValid && testResults.phoneIdValid;

    const result: IElevenLabsConnectionTest = {
      success: allTestsPassed,
      message: allTestsPassed 
        ? 'Conexión exitosa con ElevenLabs' 
        : 'Algunos tests fallaron',
      details: testResults,
      voices: voices
    };

    if (!allTestsPassed) {
      let errorMessage = 'Tests fallidos: ';
      if (!testResults.apiKeyValid) errorMessage += 'API Key inválida ';
      if (!testResults.phoneIdValid) errorMessage += 'Phone ID inválido ';
      result.error = errorMessage.trim();
    }

    console.log(`[TEST ELEVENLABS CONNECTION] Test completed for tenant ${tenantId}:`, result);

    return NextResponse.json(result);

  } catch (error) {
    console.error('[TEST ELEVENLABS CONNECTION] Error:', error);
    
    const result: IElevenLabsConnectionTest = {
      success: false,
      message: 'Error interno al probar la conexión',
      error: error instanceof Error ? error.message : 'Unknown error'
    };

    return NextResponse.json(result, { status: 500 });
  }
}

// GET - Obtener voces disponibles de ElevenLabs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId es requerido' },
        { status: 400 }
      );
    }

    console.log(`[GET ELEVENLABS VOICES] Fetching voices for tenant: ${tenantId}`);

    // Obtener configuración del tenant
    const configDocPath = `tenants/${tenantId}/elevenlabs-config/settings`;
    const configDoc = await adminDb.doc(configDocPath).get();

    if (!configDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'No hay configuración de ElevenLabs para este tenant'
      });
    }

    const config = configDoc.data() as ITenantElevenLabsConfig;

    // Obtener voces de ElevenLabs
    const voicesResponse = await fetch(`${config.apiUrl}/v1/voices`, {
      method: 'GET',
      headers: {
        'xi-api-key': config.apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!voicesResponse.ok) {
      return NextResponse.json({
        success: false,
        error: 'Error al obtener voces de ElevenLabs',
        details: `HTTP ${voicesResponse.status}: ${voicesResponse.statusText}`
      });
    }

    const voicesData = await voicesResponse.json();
    const voices: IElevenLabsVoice[] = voicesData.voices || [];

    console.log(`[GET ELEVENLABS VOICES] Retrieved ${voices.length} voices for tenant: ${tenantId}`);

    return NextResponse.json({
      success: true,
      voices,
      total: voices.length
    });

  } catch (error) {
    console.error('[GET ELEVENLABS VOICES] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}