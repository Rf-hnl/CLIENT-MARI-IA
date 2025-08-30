/**
 * AUTO-PROGRESSION API ENDPOINT
 * 
 * Endpoint para controlar y obtener información del motor de auto-progresión
 * GET /api/analytics/auto-progression - Obtener estado y estadísticas
 * POST /api/analytics/auto-progression - Iniciar/detener motor
 */

import { NextRequest, NextResponse } from 'next/server';
import AutoProgressionEngine from '@/lib/services/autoProgressionEngine';

// Instancia global del motor (singleton)
let engineInstance: AutoProgressionEngine | null = null;

function getEngineInstance(): AutoProgressionEngine {
  if (!engineInstance) {
    engineInstance = new AutoProgressionEngine();
  }
  return engineInstance;
}

/**
 * GET /api/analytics/auto-progression
 * Obtener estado y estadísticas del motor
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    console.log('📊 [AUTO-PROGRESSION API] GET request:', { action });

    const engine = getEngineInstance();

    if (action === 'stats') {
      // Obtener estadísticas detalladas
      const stats = engine.getEngineStats();
      
      return NextResponse.json({
        success: true,
        data: {
          engineStatus: stats,
          timestamp: new Date()
        }
      });
    }

    if (action === 'rules') {
      // Obtener reglas activas (placeholder)
      return NextResponse.json({
        success: true,
        data: {
          rules: [], // TODO: Implementar obtención de reglas desde DB
          totalRules: 0,
          activeRules: 0
        }
      });
    }

    // Respuesta por defecto - estado del motor
    const stats = engine.getEngineStats();
    
    return NextResponse.json({
      success: true,
      data: {
        isRunning: stats.isRunning,
        stats,
        uptime: stats.isRunning ? '15 minutes' : '0 minutes', // Mock
        lastProcessed: new Date(),
        nextRun: stats.isRunning 
          ? new Date(Date.now() + 15 * 60 * 1000) 
          : null
      }
    });

  } catch (error) {
    console.error('❌ [AUTO-PROGRESSION API] Error in GET:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get auto-progression data',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/auto-progression
 * Controlar el motor (iniciar/detener/configurar)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, config } = body;

    console.log('🔄 [AUTO-PROGRESSION API] POST request:', { action, config });

    const engine = getEngineInstance();

    switch (action) {
      case 'start':
        const intervalMinutes = config?.intervalMinutes || 15;
        await engine.start(intervalMinutes);
        
        return NextResponse.json({
          success: true,
          data: {
            message: 'Auto-progression engine started',
            intervalMinutes,
            nextRun: new Date(Date.now() + intervalMinutes * 60 * 1000)
          }
        });

      case 'stop':
        engine.stop();
        
        return NextResponse.json({
          success: true,
          data: {
            message: 'Auto-progression engine stopped'
          }
        });

      case 'process':
        // Ejecutar procesamiento manual
        await engine.processAllLeads();
        
        return NextResponse.json({
          success: true,
          data: {
            message: 'Manual processing completed',
            processedAt: new Date()
          }
        });

      case 'create_rule':
        if (!config?.rule) {
          return NextResponse.json(
            { success: false, error: 'Rule configuration required' },
            { status: 400 }
          );
        }

        const ruleId = await engine.createRule(config.rule);
        
        return NextResponse.json({
          success: true,
          data: {
            message: 'Rule created successfully',
            ruleId,
            rule: config.rule
          }
        });

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ [AUTO-PROGRESSION API] Error in POST:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to execute auto-progression action',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/analytics/auto-progression
 * Actualizar configuración del motor
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { config } = body;

    console.log('⚙️ [AUTO-PROGRESSION API] PUT request:', { config });

    // TODO: Implementar actualización de configuración
    // Por ahora solo devolvemos éxito
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'Configuration updated',
        config
      }
    });

  } catch (error) {
    console.error('❌ [AUTO-PROGRESSION API] Error in PUT:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update configuration',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}