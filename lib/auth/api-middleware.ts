/**
 * API AUTHENTICATION MIDDLEWARE
 * 
 * Middleware para autenticación y validación de APIs externas
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  validateApiKey, 
  extractApiKey, 
  hasPermission, 
  checkRateLimit,
  AuthenticatedRequest,
  ApiKey
} from './api-keys';

export interface MiddlewareConfig {
  requireAuth?: boolean;
  requiredPermissions?: string[];
  rateLimitConfig?: {
    maxRequests: number;
    windowMs: number;
  };
  allowedOrigins?: string[];
  requireTenantValidation?: boolean;
}

export async function apiAuthMiddleware(
  request: NextRequest,
  config: MiddlewareConfig = {}
): Promise<{
  response?: NextResponse;
  apiKey?: ApiKey;
  error?: string;
}> {
  const {
    requireAuth = true,
    requiredPermissions = [],
    rateLimitConfig = { maxRequests: 100, windowMs: 60 * 60 * 1000 },
    allowedOrigins = [],
    requireTenantValidation = true
  } = config;

  try {
    // 1. CORS Validation
    if (allowedOrigins.length > 0) {
      const origin = request.headers.get('origin');
      if (origin && !allowedOrigins.includes(origin)) {
        return {
          response: new NextResponse(JSON.stringify({ 
            success: false, 
            error: 'CORS: Origin not allowed' 
          }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          })
        };
      }
    }

    // 2. Authentication Check
    if (requireAuth) {
      const apiKey = extractApiKey(request);
      
      if (!apiKey) {
        return {
          response: new NextResponse(JSON.stringify({ 
            success: false, 
            error: 'API key required. Use Authorization: Bearer <key> or X-API-Key header' 
          }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          })
        };
      }

      // Validate API Key
      const validation = await validateApiKey(apiKey);
      if (!validation.isValid) {
        return {
          response: new NextResponse(JSON.stringify({ 
            success: false, 
            error: validation.error || 'Invalid API key' 
          }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          })
        };
      }

      const apiKeyRecord = validation.apiKey!;

      // 3. Permission Check
      for (const permission of requiredPermissions) {
        if (!hasPermission(apiKeyRecord, permission)) {
          return {
            response: new NextResponse(JSON.stringify({ 
              success: false, 
              error: `Missing required permission: ${permission}` 
            }), {
              status: 403,
              headers: { 'Content-Type': 'application/json' }
            })
          };
        }
      }

      // 4. Rate Limiting
      const rateLimitKey = `api_${apiKeyRecord.id}`;
      const rateLimit = checkRateLimit(
        rateLimitKey,
        rateLimitConfig.maxRequests,
        rateLimitConfig.windowMs
      );

      if (!rateLimit.allowed) {
        return {
          response: new NextResponse(JSON.stringify({ 
            success: false, 
            error: 'Rate limit exceeded',
            rateLimitInfo: {
              remaining: rateLimit.remaining,
              resetTime: rateLimit.resetTime
            }
          }), {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Remaining': rateLimit.remaining.toString(),
              'X-RateLimit-Reset': Math.floor(rateLimit.resetTime / 1000).toString()
            }
          })
        };
      }

      return { apiKey: apiKeyRecord };
    }

    // No auth required, continue
    return {};

  } catch (error) {
    console.error('API Middleware Error:', error);
    return {
      response: new NextResponse(JSON.stringify({ 
        success: false, 
        error: 'Internal authentication error' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    };
  }
}

// Helper para validar tenant/organization contra API key
export function validateTenantAccess(
  apiKey: ApiKey,
  requestTenantId: string,
  requestOrganizationId: string
): { valid: boolean; error?: string } {
  if (apiKey.tenantId !== requestTenantId) {
    return {
      valid: false,
      error: `Access denied: API key is not authorized for tenant ${requestTenantId}`
    };
  }

  if (apiKey.organizationId !== requestOrganizationId) {
    return {
      valid: false,
      error: `Access denied: API key is not authorized for organization ${requestOrganizationId}`
    };
  }

  return { valid: true };
}

// Helper para añadir headers CORS
export function addCorsHeaders(response: NextResponse, allowedOrigins: string[] = []): NextResponse {
  if (allowedOrigins.length > 0) {
    response.headers.set('Access-Control-Allow-Origin', allowedOrigins.join(','));
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  response.headers.set('Access-Control-Max-Age', '86400');
  
  return response;
}

// Wrapper function para usar en route handlers
export function withApiAuth(config: MiddlewareConfig = {}) {
  return function<T extends Function>(handler: T): T {
    return (async (request: NextRequest, ...args: any[]) => {
      // Run middleware
      const middlewareResult = await apiAuthMiddleware(request, config);
      
      if (middlewareResult.response) {
        return middlewareResult.response;
      }
      
      // Add API key info to request object
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.apiKey = middlewareResult.apiKey;
      
      // Call original handler
      const response = await handler(authenticatedRequest, ...args);
      
      // Add CORS headers if configured
      if (config.allowedOrigins) {
        return addCorsHeaders(response, config.allowedOrigins);
      }
      
      return response;
    }) as unknown as T;
  };
}