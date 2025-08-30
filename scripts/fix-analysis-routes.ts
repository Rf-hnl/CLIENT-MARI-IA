/**
 * SCRIPT PARA ARREGLAR TODAS LAS RUTAS DE ANÁLISIS
 * Agrega el manejo correcto de errores de OpenAI a todas las rutas específicas
 */

import fs from 'fs';
import path from 'path';

const analysisRoutes = [
  'actions',
  'messages', 
  'metrics',
  'insights',
  'engagement',
  'predictions'
];

const basePath = '/Users/raulfernandez/Documents/BOT DE WH/LEAds/IA MARIA ACTUAL /CLIENT MAR-IA/client-mar-ia/app/api/leads/[id]/conversations/[conversationId]/analysis';

const oldErrorHandler = `  } catch (error) {
    console.error('❌ [ANALYSIS] Error in analysis:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }`;

const newErrorHandler = `  } catch (error) {
    console.error('❌ [ANALYSIS] Error in analysis:', error);
    
    // Determinar el status code y mensaje basado en el tipo de error
    let statusCode = 500;
    let errorTitle = 'Internal server error';
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('insufficient_quota') || errorMessage.includes('exceeded your current quota')) {
      statusCode = 402;
      errorTitle = 'Insufficient credits';
    } else if (errorMessage.includes('Too Many Requests') || errorMessage.includes('429')) {
      statusCode = 429;
      errorTitle = 'Rate limit exceeded';
    } else if (errorMessage.includes('invalid_api_key') || errorMessage.includes('401')) {
      statusCode = 401;
      errorTitle = 'Invalid API key';
    }
    
    return NextResponse.json({ 
      error: errorTitle,
      details: errorMessage
    }, { status: statusCode });
  }`;

function fixAnalysisRoute(routeName: string) {
  const filePath = path.join(basePath, routeName, 'route.ts');
  
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    
    // Buscar patrones de error handler genéricos y reemplazarlos
    const patterns = [
      /catch \(error\) \{[^}]*console\.error\([^)]*\);[^}]*return NextResponse\.json\(\{[^}]*error: 'Internal server error'[^}]*\}, \{ status: 500 \}\);[^}]*\}/gs,
      /catch \(error\) \{[^}]*console\.error\([^)]*\);[^}]*return NextResponse\.json\(\{[^}]*error: 'Internal server error'[^}]*details:[^}]*\}, \{ status: 500 \}\);[^}]*\}/gs
    ];
    
    let modified = false;
    patterns.forEach(pattern => {
      if (pattern.test(content)) {
        content = content.replace(pattern, newErrorHandler.trim());
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed error handling in: ${routeName}/route.ts`);
    } else {
      console.log(`⚠️ No generic error handler found in: ${routeName}/route.ts`);
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${routeName}/route.ts:`, error);
  }
}

function fixAllRoutes() {
  console.log('🔧 Fixing error handling in all analysis routes...');
  
  analysisRoutes.forEach(route => {
    fixAnalysisRoute(route);
  });
  
  console.log('✅ All analysis routes processed!');
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  fixAllRoutes();
}

export { fixAllRoutes, fixAnalysisRoute };