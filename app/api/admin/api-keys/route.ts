/**
 * API KEYS MANAGEMENT ENDPOINT
 * 
 * Endpoint para gestionar API Keys de acceso externo
 * Solo accesible por administradores del tenant
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateApiKey, validateApiKey } from '@/lib/auth/api-keys';
import { prisma } from '@/lib/prisma';

// Crear nueva API Key
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      tenantId, 
      organizationId, 
      name, 
      permissions = ['leads:create', 'leads:read'],
      expiresInDays 
    } = body;

    // TODO: Validar que el usuario tiene permisos de administrador
    // Por ahora permitimos la creación directa

    if (!tenantId || !organizationId || !name) {
      return NextResponse.json({
        success: false,
        error: 'tenantId, organizationId, and name are required'
      }, { status: 400 });
    }

    // Verificar que la organización existe
    const organization = await prisma.organization.findFirst({
      where: { 
        id: organizationId, 
        tenantId,
        tenant: { isActive: true }
      }
    });

    if (!organization) {
      return NextResponse.json({
        success: false,
        error: 'Organization not found or inactive'
      }, { status: 404 });
    }

    // Generar nueva API Key
    const { apiKey, keyRecord } = await generateApiKey(
      tenantId,
      organizationId,
      name,
      permissions,
      expiresInDays
    );

    console.log(`🔑 Nueva API Key generada: ${keyRecord.name} para ${organization.name}`);

    return NextResponse.json({
      success: true,
      data: {
        id: keyRecord.id,
        name: keyRecord.name,
        apiKey, // Solo se muestra una vez al crear
        permissions: keyRecord.permissions,
        expiresAt: keyRecord.expiresAt,
        createdAt: keyRecord.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Error creating API key:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

// Listar API Keys existentes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const organizationId = searchParams.get('organizationId');

    console.log('📋 GET API Keys - Params:', { tenantId, organizationId });

    if (!tenantId || !organizationId) {
      return NextResponse.json({
        success: false,
        error: 'tenantId and organizationId are required'
      }, { status: 400 });
    }

    // Verificar que tenantId y organizationId son válidos
    if (tenantId === 'undefined' || organizationId === 'undefined') {
      return NextResponse.json({
        success: false,
        error: 'Invalid tenantId or organizationId - user information not loaded yet'
      }, { status: 400 });
    }

    // TODO: Validar permisos de usuario

    // Verificar que la organización existe y pertenece al tenant
    const organization = await prisma.organization.findFirst({
      where: { 
        id: organizationId, 
        tenantId,
        tenant: { isActive: true }
      }
    });

    if (!organization) {
      return NextResponse.json({
        success: false,
        error: 'Organization not found or inactive'
      }, { status: 404 });
    }

    const apiKeys = await prisma.apiKey.findMany({
      where: {
        tenantId,
        organizationId
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        permissions: true,
        isActive: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
        // No incluir keyHash por seguridad
      }
    });

    console.log(`✅ Found ${apiKeys.length} API keys for org: ${organization.name}`);

    return NextResponse.json({
      success: true,
      data: apiKeys
    });

  } catch (error) {
    console.error('❌ Error listing API keys:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

// Desactivar/Activar API Key
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyId, isActive } = body;

    if (!keyId || typeof isActive !== 'boolean') {
      return NextResponse.json({
        success: false,
        error: 'keyId and isActive (boolean) are required'
      }, { status: 400 });
    }

    const updatedKey = await prisma.apiKey.update({
      where: { id: keyId },
      data: { isActive },
      select: {
        id: true,
        name: true,
        isActive: true,
        updatedAt: true
      }
    });

    console.log(`🔑 API Key ${isActive ? 'activada' : 'desactivada'}: ${updatedKey.name}`);

    return NextResponse.json({
      success: true,
      data: updatedKey
    });

  } catch (error) {
    console.error('❌ Error updating API key:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

// Eliminar API Key
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('keyId');

    if (!keyId) {
      return NextResponse.json({
        success: false,
        error: 'keyId is required'
      }, { status: 400 });
    }

    await prisma.apiKey.delete({
      where: { id: keyId }
    });

    console.log(`🗑️ API Key eliminada: ${keyId}`);

    return NextResponse.json({
      success: true,
      message: 'API Key deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting API key:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}