/**
 * API ENDPOINT PARA PROCESAMIENTO DE CAMPAÑAS CON IA
 * 
 * Endpoint para procesar información desorganizada de productos/campañas
 * usando servicios de IA y generar contexto estructurado
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // TODO: Integrar con servicio de IA real (OpenAI, Claude, etc.)
    // Por ahora, simular respuesta de IA
    
    const aiResponse = await simulateAIResponse(prompt);

    return NextResponse.json({
      success: true,
      data: aiResponse
    });

  } catch (error) {
    console.error('Error processing campaign with AI:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error processing campaign with AI',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Simula respuesta de IA - reemplazar con integración real
 */
async function simulateAIResponse(prompt: string) {
  // Simular delay de procesamiento
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Extraer información básica del prompt
  const campaignNameMatch = prompt.match(/Nombre: (.+)/);
  const industryMatch = prompt.match(/Industria: (.+)/);
  const rawInfoMatch = prompt.match(/INFORMACIÓN DESORGANIZADA DE PRODUCTOS\/SERVICIOS:\n([\s\S]+?)\n\nINSTRUCCIONES:/);

  const campaignName = campaignNameMatch?.[1] || 'Campaña Sin Nombre';
  const industry = industryMatch?.[1] || 'Industria General';
  const rawInfo = rawInfoMatch?.[1] || '';

  // Procesamiento básico para simular IA
  const products = extractProductsFromText(rawInfo);
  
  return {
    campaignName,
    campaignDescription: `Campaña de ventas especializada en ${industry.toLowerCase()}. Enfocada en ofrecer soluciones innovadoras y de alta calidad para empresas que buscan optimizar sus procesos y aumentar su productividad.`,
    products,
    salesPitch: generateSalesPitch(campaignName, products),
    keyPoints: generateKeyPoints(products),
    objectionHandlers: generateObjectionHandlers(campaignName, products),
    targetAudience: `Empresas de ${industry.toLowerCase()} que buscan soluciones innovadoras para mejorar su eficiencia operativa y aumentar su competitividad en el mercado.`,
    competitiveAdvantages: generateCompetitiveAdvantages(products)
  };
}

function extractProductsFromText(text: string) {
  // Extraer información básica de productos
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const products = [];

  // Buscar patrones comunes de productos
  const productPatterns = [
    /(\w+(?:\s+\w+)*)\s*[-:]\s*(.+)/g, // "Producto - descripción"
    /(\w+(?:\s+\w+)*)\s*\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g, // "Producto $precio"
  ];

  const prices = text.match(/\$\d+(?:,\d{3})*(?:\.\d{2})?/g) || [];
  const priceNumbers = prices.map(p => parseFloat(p.replace(/[$,]/g, '')));

  // Si no se pueden extraer productos específicos, crear uno genérico
  if (lines.length === 0 || !text.includes('-') && !text.includes(':')) {
    return [
      {
        name: 'Producto Principal',
        description: text.slice(0, 200) + (text.length > 200 ? '...' : ''),
        price: priceNumbers[0] || null,
        features: extractFeatures(text),
        benefits: extractBenefits(text),
        targetAudience: ['Empresas y emprendedores']
      }
    ];
  }

  // Extraer productos específicos
  let productIndex = 0;
  for (const line of lines.slice(0, 5)) { // Máximo 5 productos
    if (line.includes('-') || line.includes(':')) {
      const parts = line.split(/[-:]/);
      if (parts.length >= 2) {
        products.push({
          name: parts[0].trim(),
          description: parts.slice(1).join(' ').trim(),
          price: priceNumbers[productIndex] || null,
          features: extractFeatures(parts.slice(1).join(' ')),
          benefits: extractBenefits(parts.slice(1).join(' ')),
          targetAudience: ['Empresas y emprendedores']
        });
        productIndex++;
      }
    }
  }

  return products.length > 0 ? products : [
    {
      name: 'Producto Principal',
      description: text.slice(0, 200) + (text.length > 200 ? '...' : ''),
      price: priceNumbers[0] || null,
      features: extractFeatures(text),
      benefits: extractBenefits(text),
      targetAudience: ['Empresas y emprendedores']
    }
  ];
}

function extractFeatures(text: string): string[] {
  const keywords = ['incluye', 'cuenta con', 'ofrece', 'permite', 'dispone de', 'tiene'];
  const features: string[] = [];
  
  for (const keyword of keywords) {
    const regex = new RegExp(`${keyword}\\s+([^.!?]{10,80})`, 'gi');
    const matches = text.match(regex);
    if (matches) {
      features.push(...matches.map(m => m.replace(new RegExp(keyword, 'gi'), '').trim()));
    }
  }
  
  return features.slice(0, 4).map(f => f.charAt(0).toUpperCase() + f.slice(1));
}

function extractBenefits(text: string): string[] {
  const keywords = ['ahorra', 'mejora', 'optimiza', 'reduce', 'aumenta', 'facilita', 'acelera'];
  const benefits: string[] = [];
  
  for (const keyword of keywords) {
    const regex = new RegExp(`${keyword}\\s+([^.!?]{10,80})`, 'gi');
    const matches = text.match(regex);
    if (matches) {
      benefits.push(...matches.map(m => m.trim()));
    }
  }
  
  // Si no se encuentran beneficios específicos, crear genéricos
  if (benefits.length === 0) {
    return [
      'Mejora la eficiencia operativa',
      'Reduce costos operativos',
      'Aumenta la productividad',
      'Facilita la gestión diaria'
    ];
  }
  
  return benefits.slice(0, 4).map(b => b.charAt(0).toUpperCase() + b.slice(1));
}

function generateSalesPitch(campaignName: string, products: any[]): string {
  const mainProduct = products[0];
  return `Hola {{name}}, le llamo de {{my_company_name}} para presentarle ${campaignName}, ${mainProduct?.description || 'nuestra solución innovadora'}. Hemos ayudado a empresas como {{company}} a ${mainProduct?.benefits?.[0]?.toLowerCase() || 'mejorar su eficiencia operativa'}. ¿Tendría unos minutos para que le explique cómo esto puede beneficiar específicamente a {{company}}?`;
}

function generateKeyPoints(products: any[]): string[] {
  const keyPoints = [
    `Solución comprobada con resultados inmediatos`,
    `Implementación rápida y sin complicaciones`,
    `Soporte técnico especializado incluido`,
    `ROI positivo en los primeros meses`
  ];

  // Agregar puntos específicos de productos si están disponibles
  products.forEach(product => {
    if (product.features && product.features.length > 0) {
      keyPoints.push(product.features[0]);
    }
  });

  return keyPoints.slice(0, 5);
}

function generateObjectionHandlers(campaignName: string, products: any[]) {
  return [
    {
      objection: "Es muy costoso",
      response: `Entiendo su preocupación por la inversión. Sin embargo, ${campaignName} tiene un ROI comprobado que recupera la inversión inicial en los primeros 3-6 meses. Además, ofrecemos planes de financiamiento flexibles para {{company}}.`
    },
    {
      objection: "Ya tenemos un proveedor",
      response: `Perfecto, eso significa que {{company}} ya entiende el valor de este tipo de solución. ${campaignName} se diferencia por ${products[0]?.features?.[0] || 'su tecnología avanzada'} y nuestro soporte personalizado. ¿Le gustaría ver una comparación?`
    },
    {
      objection: "No es el momento adecuado",
      response: `Entiendo que el timing es importante. Precisamente por eso ${campaignName} es ideal ahora - puede implementarse gradualmente sin interrumpir las operaciones de {{company}}. Podemos empezar con una prueba piloto.`
    },
    {
      objection: "Necesito pensarlo",
      response: `Por supuesto, es una decisión importante para {{company}}. ¿Qué información específica necesitaría para tomar la mejor decisión? Puedo prepararle un análisis personalizado de cómo ${campaignName} se adaptaría a sus necesidades.`
    }
  ];
}

function generateCompetitiveAdvantages(products: any[]): string[] {
  const advantages = [
    'Tecnología de vanguardia probada en el mercado',
    'Implementación más rápida que la competencia',
    'Soporte técnico 24/7 en español',
    'Personalización completa según necesidades específicas'
  ];

  // Agregar ventajas específicas basadas en características de productos
  products.forEach(product => {
    if (product.features) {
      product.features.forEach((feature: string) => {
        if (feature.toLowerCase().includes('automático') || feature.toLowerCase().includes('inteligente')) {
          advantages.push('Automatización inteligente integrada');
        }
        if (feature.toLowerCase().includes('cloud') || feature.toLowerCase().includes('nube')) {
          advantages.push('Acceso desde cualquier lugar con tecnología cloud');
        }
      });
    }
  });

  return [...new Set(advantages)].slice(0, 5); // Remover duplicados y limitar a 5
}