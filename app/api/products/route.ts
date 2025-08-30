import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiAuthMiddleware, validateTenantAccess } from '@/lib/auth/api-middleware';
import { CreateProductData, ProductListResponse } from '@/types/campaign';

// GET - Obtener todos los productos
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API Route: /api/products - GET request');
    
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const organizationId = searchParams.get('organizationId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');

    if (!tenantId || !organizationId) {
      return NextResponse.json(
        { success: false, error: 'tenantId and organizationId are required' },
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

    // Build where clause
    const where: any = {
      tenantId,
      organizationId,
    };

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get products with campaign count
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          campaigns: {
            include: {
              campaign: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where })
    ]);

    const response: ProductListResponse = {
      products: products.map(product => ({
        ...product,
        price: product.price ? parseFloat(product.price.toString()) : null,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      })),
      total,
      page,
      limit,
    };

    console.log(`✅ Found ${products.length} products`);
    return NextResponse.json({ success: true, data: response });

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Crear un nuevo producto
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 API Route: /api/products - POST request');

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

    const { tenantId, organizationId, ...productData }: CreateProductData & {
      tenantId: string;
      organizationId: string;
    } = body;

    if (!tenantId || !organizationId) {
      return NextResponse.json(
        { success: false, error: 'tenantId and organizationId are required' },
        { status: 400 }
      );
    }

    if (!productData.name) {
      return NextResponse.json(
        { success: false, error: 'Product name is required' },
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

    // Check if SKU already exists (if provided)
    if (productData.sku) {
      const existingProduct = await prisma.product.findFirst({
        where: {
          sku: productData.sku,
          tenantId,
          organizationId,
        }
      });

      if (existingProduct) {
        return NextResponse.json(
          { success: false, error: 'A product with this SKU already exists' },
          { status: 409 }
        );
      }
    }

    // Create product
    const newProduct = await prisma.product.create({
      data: {
        tenantId,
        organizationId,
        name: productData.name,
        description: productData.description,
        price: productData.price,
        sku: productData.sku,
        isActive: productData.isActive !== undefined ? productData.isActive : true,
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
      ...newProduct,
      price: newProduct.price ? parseFloat(newProduct.price.toString()) : null,
      createdAt: newProduct.createdAt.toISOString(),
      updatedAt: newProduct.updatedAt.toISOString(),
    };

    console.log('✅ Product created successfully:', newProduct.id);
    return NextResponse.json({ success: true, data: response }, { status: 201 });

  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}