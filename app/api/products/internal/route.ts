import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Obtener productos (versión interna sin auth de API key)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const organizationId = searchParams.get('organizationId');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');

    if (!tenantId || !organizationId) {
      return NextResponse.json(
        { success: false, error: 'tenantId and organizationId are required' },
        { status: 400 }
      );
    }

    // Build where clause
    const where: any = {
      tenantId,
      organizationId,
    };

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get products
    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: {
        products: products.map(product => ({
          ...product,
          price: product.price ? parseFloat(product.price.toString()) : null,
          createdAt: product.createdAt.toISOString(),
          updatedAt: product.updatedAt.toISOString(),
        })),
        total: products.length
      }
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Crear producto (versión interna)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, organizationId, ...productData } = body;

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
        sku: productData.sku && productData.sku.trim() ? productData.sku.trim() : null,
        isActive: productData.isActive !== undefined ? productData.isActive : true,
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...newProduct,
        price: newProduct.price ? parseFloat(newProduct.price.toString()) : null,
        createdAt: newProduct.createdAt.toISOString(),
        updatedAt: newProduct.updatedAt.toISOString(),
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}