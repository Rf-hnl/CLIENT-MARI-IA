import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { 
  ITenantElevenLabsConfig, 
  ICreateElevenLabsConfigData, 
  IUpdateElevenLabsConfigData,
  IElevenLabsConfigResult 
} from '@/types/elevenlabs';

// GET - Obtener configuración de ElevenLabs del tenant
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

    console.log(`[GET ELEVENLABS CONFIG] Fetching config for tenant: ${tenantId}`);

    const configDocPath = `tenants/${tenantId}/elevenlabs-config/settings`;
    const configDoc = await adminDb.doc(configDocPath).get();

    if (!configDoc.exists) {
      return NextResponse.json({
        success: true,
        message: 'No hay configuración de ElevenLabs para este tenant',
        config: null
      });
    }

    const config = configDoc.data() as ITenantElevenLabsConfig;

    return NextResponse.json({
      success: true,
      message: 'Configuración obtenida exitosamente',
      config
    } as IElevenLabsConfigResult);

  } catch (error) {
    console.error('[GET ELEVENLABS CONFIG] Error:', error);
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

// POST - Crear configuración de ElevenLabs para el tenant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, uid, ...configData }: { 
      tenantId: string; 
      uid: string; 
    } & ICreateElevenLabsConfigData = body;

    if (!tenantId || !uid) {
      return NextResponse.json(
        { success: false, error: 'tenantId y uid son requeridos' },
        { status: 400 }
      );
    }

    // Validar datos requeridos
    if (!configData.apiKey || !configData.apiUrl || !configData.phoneId) {
      return NextResponse.json(
        { success: false, error: 'apiKey, apiUrl y phoneId son requeridos' },
        { status: 400 }
      );
    }

    console.log(`[CREATE ELEVENLABS CONFIG] Creating config for tenant: ${tenantId}`);

    const now = new Date();
    const config: ITenantElevenLabsConfig = {
      tenantId,
      apiKey: configData.apiKey,
      apiUrl: configData.apiUrl,
      phoneId: configData.phoneId,
      settings: {
        defaultVoiceId: configData.settings.defaultVoiceId || '',
        timezone: configData.settings.timezone || 'America/Bogota',
        allowedCallHours: {
          start: configData.settings.allowedCallHours?.start || '09:00',
          end: configData.settings.allowedCallHours?.end || '18:00'
        },
        allowedDays: configData.settings.allowedDays || [1, 2, 3, 4, 5],
        maxConcurrentCalls: configData.settings.maxConcurrentCalls || 5,
        costLimitPerMonth: configData.settings.costLimitPerMonth || 1000
      },
      metadata: {
        isActive: true,
        createdAt: now as any,
        updatedAt: now as any,
        createdBy: uid
      }
    };

    const configDocPath = `tenants/${tenantId}/elevenlabs-config/settings`;
    await adminDb.doc(configDocPath).set(config);

    console.log(`[CREATE ELEVENLABS CONFIG] Configuration created successfully for tenant: ${tenantId}`);

    return NextResponse.json({
      success: true,
      message: 'Configuración de ElevenLabs creada exitosamente',
      config
    } as IElevenLabsConfigResult);

  } catch (error) {
    console.error('[CREATE ELEVENLABS CONFIG] Error:', error);
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

// PUT - Actualizar configuración de ElevenLabs del tenant
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, uid, ...updateData }: { 
      tenantId: string; 
      uid: string; 
    } & IUpdateElevenLabsConfigData = body;

    if (!tenantId || !uid) {
      return NextResponse.json(
        { success: false, error: 'tenantId y uid son requeridos' },
        { status: 400 }
      );
    }

    console.log(`[UPDATE ELEVENLABS CONFIG] Updating config for tenant: ${tenantId}`);

    const configDocPath = `tenants/${tenantId}/elevenlabs-config/settings`;
    const configDoc = await adminDb.doc(configDocPath).get();

    if (!configDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'No existe configuración para este tenant' },
        { status: 404 }
      );
    }

    const currentConfig = configDoc.data() as ITenantElevenLabsConfig;
    const now = new Date();

    // Merge de configuración actual con nuevos datos
    const updatedConfig: ITenantElevenLabsConfig = {
      ...currentConfig,
      ...(updateData.apiKey && { apiKey: updateData.apiKey }),
      ...(updateData.apiUrl && { apiUrl: updateData.apiUrl }),
      ...(updateData.phoneId && { phoneId: updateData.phoneId }),
      settings: {
        ...currentConfig.settings,
        ...updateData.settings
      },
      metadata: {
        ...currentConfig.metadata,
        updatedAt: now as any
      }
    };

    await adminDb.doc(configDocPath).set(updatedConfig);

    console.log(`[UPDATE ELEVENLABS CONFIG] Configuration updated successfully for tenant: ${tenantId}`);

    return NextResponse.json({
      success: true,
      message: 'Configuración actualizada exitosamente',
      config: updatedConfig
    } as IElevenLabsConfigResult);

  } catch (error) {
    console.error('[UPDATE ELEVENLABS CONFIG] Error:', error);
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

// DELETE - Eliminar configuración de ElevenLabs del tenant
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const uid = searchParams.get('uid');

    if (!tenantId || !uid) {
      return NextResponse.json(
        { success: false, error: 'tenantId y uid son requeridos' },
        { status: 400 }
      );
    }

    console.log(`[DELETE ELEVENLABS CONFIG] Deleting config for tenant: ${tenantId}`);

    const configDocPath = `tenants/${tenantId}/elevenlabs-config/settings`;
    const configDoc = await adminDb.doc(configDocPath).get();

    if (!configDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'No existe configuración para este tenant' },
        { status: 404 }
      );
    }

    await adminDb.doc(configDocPath).delete();

    console.log(`[DELETE ELEVENLABS CONFIG] Configuration deleted successfully for tenant: ${tenantId}`);

    return NextResponse.json({
      success: true,
      message: 'Configuración eliminada exitosamente'
    } as IElevenLabsConfigResult);

  } catch (error) {
    console.error('[DELETE ELEVENLABS CONFIG] Error:', error);
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