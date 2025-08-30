/**
 * API KEYS MANAGEMENT SYSTEM
 * 
 * Sistema de gestión de API Keys para acceso externo seguro
 */

import { prisma } from '@/lib/prisma';
import { randomBytes, createHash } from 'crypto';
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export interface ApiKey {
  id: string;
  keyHash: string;
  name: string;
  tenantId: string;
  organizationId: string;
  permissions: string[];
  isActive: boolean;
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKeyValidationResult {
  isValid: boolean;
  apiKey?: ApiKey;
  error?: string;
  rateLimitInfo?: {
    remaining: number;
    resetTime: number;
  };
}

// Generar nueva API Key
export async function generateApiKey(
  tenantId: string,
  organizationId: string,
  name: string,
  permissions: string[] = ['leads:create', 'leads:read'],
  expiresInDays?: number
): Promise<{ apiKey: string; keyRecord: ApiKey }> {
  // Generar key aleatoria
  const rawKey = randomBytes(32).toString('hex');
  const apiKey = `sk_${rawKey}`;
  
  // Hash de la key para almacenamiento seguro
  const keyHash = createHash('sha256').update(apiKey).digest('hex');
  
  const expiresAt = expiresInDays 
    ? new Date(Date.now() + (expiresInDays * 24 * 60 * 60 * 1000))
    : null;

  // Guardar en base de datos
  const keyRecord = await prisma.apiKey.create({
    data: {
      keyHash,
      name,
      tenantId,
      organizationId,
      permissions,
      isActive: true,
      expiresAt,
    }
  });

  return { apiKey, keyRecord };
}

// Validar API Key o JWT Token
export async function validateApiKey(apiKey: string): Promise<ApiKeyValidationResult> {
  if (!apiKey) {
    return { isValid: false, error: 'Token de autenticación requerido' };
  }

  // Si es una API key tradicional (empieza con sk_)
  if (apiKey.startsWith('sk_')) {
    // Hash de la key para buscar en DB
    const keyHash = createHash('sha256').update(apiKey).digest('hex');

    try {
      const keyRecord = await prisma.apiKey.findFirst({
        where: {
          keyHash,
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      });

      if (!keyRecord) {
        return { isValid: false, error: 'API key inválida o expirada' };
      }

      // Actualizar último uso
      await prisma.apiKey.update({
        where: { id: keyRecord.id },
        data: { lastUsedAt: new Date() }
      });

      return { isValid: true, apiKey: keyRecord };
    } catch (error) {
      console.error('Error validating API key:', error);
      return { isValid: false, error: 'Error interno de validación' };
    }
  }

  // Si parece ser un JWT token, intentar validarlo
  try {
    const decodedToken = verifyJWT(apiKey);
    if (!decodedToken || !decodedToken.userId || !decodedToken.tenantId || !decodedToken.organizationId) {
      return { isValid: false, error: 'JWT token inválido o expirado' };
    }

    // Crear un ApiKey temporal para el JWT
    const jwtApiKey: ApiKey = {
      id: `jwt_${decodedToken.userId}`,
      keyHash: '',
      name: 'JWT Session Token',
      tenantId: decodedToken.tenantId,
      organizationId: decodedToken.organizationId,
      permissions: ['leads:import', 'leads:create', 'leads:read', 'leads:update'], // Permisos por defecto para usuarios autenticados
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return { isValid: true, apiKey: jwtApiKey };
  } catch (error) {
    console.error('Error validating JWT token:', error);
    return { isValid: false, error: 'Token JWT inválido' };
  }
}

// Extraer API Key del request
export function extractApiKey(request: NextRequest): string | null {
  // Buscar en Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Buscar en X-API-Key header
  const apiKeyHeader = request.headers.get('x-api-key');
  if (apiKeyHeader) {
    return apiKeyHeader;
  }

  // Buscar en cookies (para JWT tokens de sesión)
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        acc[name] = decodeURIComponent(value);
      }
      return acc;
    }, {} as Record<string, string>);

    if (cookies.auth_token) {
      return cookies.auth_token;
    }
  }

  return null;
}

// Validar permisos
export function hasPermission(apiKey: ApiKey, requiredPermission: string): boolean {
  return apiKey.permissions.includes(requiredPermission) || 
         apiKey.permissions.includes('*') ||
         apiKey.permissions.includes('admin:all');
}

// Generar JWT para sesiones internas
export function generateJWT(payload: any, expiresIn: string = '1h'): string {
  const secret = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
  return jwt.sign(payload, secret, { expiresIn });
}

// Verificar JWT
export function verifyJWT(token: string): any {
  try {
    const secret = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
}

// Rate limiting básico en memoria (para producción usar Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string, 
  maxRequests: number = 100, 
  windowMs: number = 60 * 60 * 1000 // 1 hora
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  const current = rateLimitMap.get(identifier) || { count: 0, resetTime: now + windowMs };
  
  // Reset if window expired
  if (current.resetTime <= now) {
    current.count = 0;
    current.resetTime = now + windowMs;
  }
  
  // Check if limit exceeded
  if (current.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime
    };
  }
  
  // Increment counter
  current.count++;
  rateLimitMap.set(identifier, current);
  
  return {
    allowed: true,
    remaining: maxRequests - current.count,
    resetTime: current.resetTime
  };
}

// Limpiar rate limits antiguos (ejecutar periódicamente)
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetTime <= now) {
      rateLimitMap.delete(key);
    }
  }
}

// Tipos para TypeScript
export interface AuthenticatedRequest extends NextRequest {
  apiKey?: ApiKey;
  user?: any;
  rateLimit?: {
    remaining: number;
    resetTime: number;
  };
}