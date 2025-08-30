import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiAuthMiddleware, validateTenantAccess } from '@/lib/auth/api-middleware';
import { UpdateProductData } from '@/types/campaign';

// GET - Obtener un producto específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 API Route: /api/products/[id] - GET request');
    
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const organizationId = searchParams.get('organizationId');
    const productId = params.id;

    if (!tenantId || !organizationId || !productId) {
      return NextResponse.json(
        { success: false, error: 'tenantId, organizationId, and productId are required' },
        { status: 400 }
      );
    }

    // Apply security middleware
    const authResult = await apiAuthMiddleware(request, {
      requireAuth: true,
      requiredPermissions: ['products:read'],
      rateLimitConfig: {
        maxRequests: 100,
        windowMs: 60 * 60 * 1000
      },
      allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
      requireTenantValidation: true
    });

    if (authResult.response) {
      return authResult.response;
    }

    const apiKey = authResult.apiKey!;

    // Validate tenant access
    const tenantValidation = validateTenantAccess(apiKey, tenantId, organizationId);
    if (!tenantValidation.valid) {
      return NextResponse.json(
        { success: false, error: tenantValidation.error },
        { status: 403 }
      );
    }

    // Get product with campaigns
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        tenantId,
        organizationId,
      },
      include: {
        campaigns: {
          include: {
            campaign: true
          }
        }
      }
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    const response = {
      ...product,
      price: product.price ? parseFloat(product.price.toString()) : null,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };

    console.log('✅ Product found:', productId);
    return NextResponse.json({ success: true, data: response });

  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un producto
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 API Route: /api/products/[id] - PUT request');

    // Apply security middleware
    const authResult = await apiAuthMiddleware(request, {
      requireAuth: true,
      requiredPermissions: ['products:write'],
      rateLimitConfig: {
        maxRequests: 50,
        windowMs: 60 * 60 * 1000
      },
      allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
      requireTenantValidation: true
    });

    if (authResult.response) {
      return authResult.response;
    }

    const apiKey = authResult.apiKey!;
    const body = await request.json();
    console.log('📥 Request body received:', body);

    const { tenantId, organizationId, ...updateData }: UpdateProductData & {
      tenantId: string;
      organizationId: string;
    } = body;

    const productId = params.id;

    if (!tenantId || !organizationId || !productId) {
      return NextResponse.json(
        { success: false, error: 'tenantId, organizationId, and productId are required' },
        { status: 400 }
      );
    }

    // Validate tenant access
    const tenantValidation = validateTenantAccess(apiKey, tenantId, organizationId);
    if (!tenantValidation.valid) {
      return NextResponse.json(
        { success: false, error: tenantValidation.error },
        { status: 403 }
      );
    }

    // Check if product exists and belongs to tenant/organization
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        tenantId,
        organizationId,
      }
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if SKU already exists (if provided and different from current)
    if (updateData.sku && updateData.sku !== existingProduct.sku) {
      const existingProductWithSku = await prisma.product.findFirst({
        where: {
          sku: updateData.sku,
          tenantId,
          organizationId,
          NOT: {
            id: productId
          }
        }
      });

      if (existingProductWithSku) {
        return NextResponse.json(
          { success: false, error: 'A product with this SKU already exists' },
          { status: 409 }
        );
      }
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(updateData.name && { name: updateData.name }),
        ...(updateData.description !== undefined && { description: updateData.description }),
        ...(updateData.price !== undefined && { price: updateData.price }),
        ...(updateData.sku !== undefined && { sku: updateData.sku }),
        ...(updateData.isActive !== undefined && { isActive: updateData.isActive }),
      },
      include: {
        campaigns: {
          include: {
            campaign: true
          }
        }
      }
    });

    const response = {
      ...updatedProduct,
      price: updatedProduct.price ? parseFloat(updatedProduct.price.toString()) : null,
      createdAt: updatedProduct.createdAt.toISOString(),
      updatedAt: updatedProduct.updatedAt.toISOString(),
    };

    console.log('✅ Product updated successfully:', productId);
    return NextResponse.json({ success: true, data: response });

  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un producto
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 API Route: /api/products/[id] - DELETE request');

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const organizationId = searchParams.get('organizationId');
    const productId = params.id;

    if (!tenantId || !organizationId || !productId) {
      return NextResponse.json(
        { success: false, error: 'tenantId, organizationId, and productId are required' },
        { status: 400 }
      );
    }

    // Apply security middleware
    const authResult = await apiAuthMiddleware(request, {
      requireAuth: true,
      requiredPermissions: ['products:delete'],
      rateLimitConfig: {
        maxRequests: 20,
        windowMs: 60 * 60 * 1000
      },
      allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
      requireTenantValidation: true
    });

    if (authResult.response) {
      return authResult.response;
    }

    const apiKey = authResult.apiKey!;

    // Validate tenant access
    const tenantValidation = validateTenantAccess(apiKey, tenantId, organizationId);
    if (!tenantValidation.valid) {
      return NextResponse.json(
        { success: false, error: tenantValidation.error },
        { status: 403 }
      );
    }

    // Check if product exists and belongs to tenant/organization
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        tenantId,
        organizationId,
      },
      include: {
        campaigns: true
      }
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if product is used in campaigns
    if (existingProduct.campaigns.length > 0) {
      console.log(`⚠️ Deleting product used in ${existingProduct.campaigns.length} campaigns`);
    }

    // Delete product (cascade will handle relationships)
    await prisma.product.delete({
      where: { id: productId }
    });

    console.log('✅ Product deleted successfully:', productId);
    return NextResponse.json({ 
      success: true, 
      message: 'Product deleted successfully',
      affectedCampaigns: existingProduct.campaigns.length 
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}