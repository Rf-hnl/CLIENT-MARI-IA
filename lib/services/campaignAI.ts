/**
 * SERVICIO DE IA PARA CAMPAÑAS
 * 
 * Procesa información desorganizada de productos/servicios usando IA
 * y genera contexto estructurado para las llamadas de MarIA
 */

interface ProductInfo {
  name: string;
  description?: string;
  price?: number;
  features?: string[];
  benefits?: string[];
  targetAudience?: string[];
}

interface CampaignContext {
  campaignName: string;
  campaignDescription: string;
  products: ProductInfo[];
  salesPitch: string;
  keyPoints: string[];
  objectionHandlers: {
    objection: string;
    response: string;
  }[];
  targetAudience: string;
  competitiveAdvantages: string[];
}

interface RawCampaignData {
  campaignName: string;
  rawProductInfo: string; // Información desorganizada que viene del usuario
  budget?: number;
  industry?: string;
  targetMarket?: string;
}

/**
 * Procesa información desorganizada de productos usando IA
 */
export async function processCampaignWithAI(rawData: RawCampaignData): Promise<CampaignContext> {
  const prompt = `
Actúa como un experto en marketing y ventas. Te daré información desorganizada sobre productos/servicios para una campaña de ventas telefónicas.

Tu tarea es organizar esta información y crear un contexto estructurado para un agente de IA de ventas llamado MarIA.

INFORMACIÓN DE LA CAMPAÑA:
- Nombre: ${rawData.campaignName}
- Industria: ${rawData.industry || 'No especificada'}
- Mercado objetivo: ${rawData.targetMarket || 'General'}
- Presupuesto: ${rawData.budget ? `$${rawData.budget}` : 'No especificado'}

INFORMACIÓN DESORGANIZADA DE PRODUCTOS/SERVICIOS:
${rawData.rawProductInfo}

INSTRUCCIONES:
1. Extrae y organiza los productos/servicios mencionados
2. Para cada producto identifica: nombre, descripción, precio (si se menciona), características clave
3. Crea un pitch de ventas persuasivo
4. Identifica puntos clave de venta
5. Genera respuestas para objeciones comunes
6. Define la audiencia objetivo
7. Identifica ventajas competitivas

Responde ÚNICAMENTE en formato JSON válido con esta estructura exacta:

{
  "campaignName": "string",
  "campaignDescription": "string",
  "products": [
    {
      "name": "string",
      "description": "string",
      "price": number | null,
      "features": ["string"],
      "benefits": ["string"],
      "targetAudience": ["string"]
    }
  ],
  "salesPitch": "string",
  "keyPoints": ["string"],
  "objectionHandlers": [
    {
      "objection": "string",
      "response": "string"
    }
  ],
  "targetAudience": "string",
  "competitiveAdvantages": ["string"]
}

No incluyas comentarios, explicaciones adicionales ni texto fuera del JSON.
`;

  try {
    // Simular llamada a IA (aquí integrarías con OpenAI, Claude, etc.)
    // Por ahora, hacer procesamiento básico
    
    const processedContext: CampaignContext = await callAIService(prompt);
    
    return processedContext;
  } catch (error) {
    console.error('Error processing campaign with AI:', error);
    
    // Fallback: procesamiento básico sin IA
    return createFallbackContext(rawData);
  }
}

/**
 * Simula llamada a servicio de IA (reemplazar con integración real)
 */
async function callAIService(prompt: string): Promise<CampaignContext> {
  // TODO: Integrar con OpenAI API, Claude API, o servicio similar
  // Por ahora, retornamos un procesamiento básico
  
  const response = await fetch('/api/ai/process-campaign', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    throw new Error('AI service unavailable');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Crea contexto básico sin IA como fallback
 */
function createFallbackContext(rawData: RawCampaignData): CampaignContext {
  // Procesamiento básico de texto
  const words = rawData.rawProductInfo.toLowerCase().split(/\s+/);
  const prices = rawData.rawProductInfo.match(/\$\d+(?:,\d{3})*(?:\.\d{2})?/g) || [];
  
  return {
    campaignName: rawData.campaignName,
    campaignDescription: `Campaña de ventas para ${rawData.campaignName} dirigida a ${rawData.targetMarket || 'mercado general'}`,
    products: [
      {
        name: rawData.campaignName,
        description: rawData.rawProductInfo.slice(0, 200) + '...',
        price: prices.length > 0 ? parseFloat(prices[0].replace(/[$,]/g, '')) : null,
        features: extractFeatures(rawData.rawProductInfo),
        benefits: extractBenefits(rawData.rawProductInfo),
        targetAudience: [rawData.targetMarket || 'Empresas y emprendedores']
      }
    ],
    salesPitch: `Le presentamos ${rawData.campaignName}, la solución ideal para ${rawData.targetMarket || 'su negocio'}. ${rawData.rawProductInfo.slice(0, 150)}...`,
    keyPoints: extractKeyPoints(rawData.rawProductInfo),
    objectionHandlers: [
      {
        objection: "Es muy costoso",
        response: `Entendemos su preocupación por el costo. Sin embargo, ${rawData.campaignName} ofrece un retorno de inversión comprobado que justifica la inversión inicial.`
      },
      {
        objection: "No es el momento",
        response: `Precisamente por eso es el momento perfecto. ${rawData.campaignName} puede ayudarle a optimizar sus procesos desde ahora.`
      }
    ],
    targetAudience: rawData.targetMarket || 'Empresas y emprendedores que buscan optimizar sus procesos',
    competitiveAdvantages: extractCompetitiveAdvantages(rawData.rawProductInfo)
  };
}

function extractFeatures(text: string): string[] {
  // Extracción básica de características
  const keywords = ['incluye', 'cuenta con', 'ofrece', 'permite', 'dispone'];
  const features: string[] = [];
  
  keywords.forEach(keyword => {
    const regex = new RegExp(`${keyword}([^.!?]*)[.!?]`, 'gi');
    const matches = text.match(regex);
    if (matches) {
      features.push(...matches.map(m => m.replace(keyword, '').trim()));
    }
  });
  
  return features.slice(0, 5); // Máximo 5 características
}

function extractBenefits(text: string): string[] {
  // Extracción básica de beneficios
  const keywords = ['ahorra', 'mejora', 'optimiza', 'reduce', 'aumenta', 'facilita'];
  const benefits: string[] = [];
  
  keywords.forEach(keyword => {
    const regex = new RegExp(`${keyword}([^.!?]*)[.!?]`, 'gi');
    const matches = text.match(regex);
    if (matches) {
      benefits.push(...matches.map(m => m.trim()));
    }
  });
  
  return benefits.slice(0, 5); // Máximo 5 beneficios
}

function extractKeyPoints(text: string): string[] {
  // Extracción de puntos clave basada en oraciones cortas y importantes
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10 && s.trim().length < 100);
  return sentences.slice(0, 5).map(s => s.trim());
}

function extractCompetitiveAdvantages(text: string): string[] {
  // Extracción de ventajas competitivas
  const keywords = ['único', 'exclusivo', 'mejor', 'superior', 'innovador', 'líder'];
  const advantages: string[] = [];
  
  keywords.forEach(keyword => {
    const regex = new RegExp(`([^.!?]*${keyword}[^.!?]*)[.!?]`, 'gi');
    const matches = text.match(regex);
    if (matches) {
      advantages.push(...matches.map(m => m.trim()));
    }
  });
  
  return advantages.slice(0, 3); // Máximo 3 ventajas
}

/**
 * Actualiza el prompt de MarIA con el contexto procesado por IA
 */
export function generateUpdatedPrompt(context: CampaignContext, basePrompt: string): string {
  const campaignSection = `
## 🎯 CONTEXTO DE CAMPAÑA PROCESADO POR IA

**CAMPAÑA:** ${context.campaignName}
**DESCRIPCIÓN:** ${context.campaignDescription}

**PRODUCTOS/SERVICIOS:**
${context.products.map(product => `
• **${product.name}**
  - Descripción: ${product.description}
  ${product.price ? `- Precio: $${product.price}` : ''}
  - Características: ${product.features?.join(', ') || 'N/A'}
  - Beneficios: ${product.benefits?.join(', ') || 'N/A'}
  - Audiencia: ${product.targetAudience?.join(', ') || 'N/A'}
`).join('\n')}

**PITCH DE VENTAS:**
${context.salesPitch}

**PUNTOS CLAVE:**
${context.keyPoints.map(point => `• ${point}`).join('\n')}

**AUDIENCIA OBJETIVO:**
${context.targetAudience}

**VENTAJAS COMPETITIVAS:**
${context.competitiveAdvantages.map(adv => `• ${adv}`).join('\n')}

**MANEJO DE OBJECIONES ESPECÍFICAS:**
${context.objectionHandlers.map(handler => `
• **"${handler.objection}"**
  → ${handler.response}
`).join('\n')}

---

`;

  return campaignSection + basePrompt;
}

/**
 * Guarda el contexto procesado por IA en la base de datos
 */
export async function saveCampaignContext(
  campaignId: string, 
  context: CampaignContext,
  tenantId: string,
  organizationId: string
): Promise<void> {
  try {
    const response = await fetch('/api/campaigns/ai-context', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        campaignId,
        context,
        tenantId,
        organizationId
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save campaign context');
    }
  } catch (error) {
    console.error('Error saving campaign context:', error);
    throw error;
  }
}