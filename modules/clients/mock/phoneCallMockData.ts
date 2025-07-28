// Redefined interface for a phone call conversation
export interface IPhoneCallConversation {
  conversationId: string;
  clientId: string;
  callDirection: 'inbound' | 'outbound'; // 'inbound' for client calling in, 'outbound' for agent calling out
  startTime: string;
  endTime?: string; // Optional, for ongoing calls
  duration?: number; // in seconds, optional
  status: 'completed' | 'failed' | 'in_progress';
  turns: {
    id: string;
    role: 'agent' | 'client' | 'bot';
    content: string;
    timestamp: string; // Timestamp of this specific turn
    llmResponseTime?: number; // For bot/LLM responses
  }[];
}

// Mock data for phone call conversations
export const mockPhoneCallConversations: IPhoneCallConversation[] = [
  {
    conversationId: 'conv_5901k18nzv0afk4r62dj43aj84wr',
    clientId: 'cl_001',
    callDirection: 'outbound',
    startTime: '2025-07-27T10:00:00Z',
    endTime: '2025-07-27T10:03:42Z',
    duration: 222, // 3 minutes 42 seconds
    status: 'completed',
    turns: [
      { id: 't1', role: 'agent', content: 'Hola raul fernandez, le habla CELIA, soy una asistente de cobros de CMF. Esta llamada es para ayudarle con un saldo pendiente de 1000 dólares. ¿Le parece si revisamos su situación y buscamos una solución juntos?', timestamp: '2025-07-27T10:00:00Z' },
      { id: 't2', role: 'client', content: '¿De qué me hablas?', timestamp: '2025-07-27T10:00:15Z' },
      { id: 't3', role: 'agent', content: 'Entiendo su confusión, Sr. fernandez. Me refiero al saldo pendiente de 1000 dólares en su cuenta con CMF. ¿Reconoce esta deuda o necesita que le proporcione más detalles al respecto?', timestamp: '2025-07-27T10:00:20Z' },
      { id: 't4', role: 'bot', content: 'Análisis: Cliente reconoce deuda. Sugerir plan de pago.', timestamp: '2025-07-27T10:00:20.754Z', llmResponseTime: 754 },
      { id: 't5', role: 'client', content: '¿Y en qué me gaste esa plata?', timestamp: '2025-07-27T10:00:31Z' },
      { id: 't6', role: 'agent', content: 'Para darle información precisa sobre en qué se gastó ese dinero, necesito acceder a los detalles de su cuenta. ¿Me permite un momento para revisar su historial y así poder darle una respuesta clara?', timestamp: '2025-07-27T10:00:36Z' },
      { id: 't7', role: 'bot', content: 'Análisis: Cliente proactivo. Ofrecer opciones de pago.', timestamp: '2025-07-27T10:00:36.764Z', llmResponseTime: 764 },
      { id: 't8', role: 'client', content: 'Ahí estás llamando al MSP', timestamp: '2025-07-27T10:00:49Z' },
      { id: 't9', role: 'agent', content: 'Discúlpeme, no entiendo a qué se refiere con "MSP". ¿Podría aclararme su pregunta para poder ayudarle mejor?', timestamp: '2025-07-27T10:00:55Z' },
      { id: 't10', role: 'bot', content: 'Análisis: Cliente proactivo. Ofrecer opciones de pago.', timestamp: '2025-07-27T10:00:55.562Z', llmResponseTime: 562 },
      { id: 't11', role: 'client', content: 'No, dígame cómo hago para pagarle.', timestamp: '2025-07-27T10:01:03Z' },
      { id: 't12', role: 'agent', content: 'Comprendo, Sr. fernandez. Para ayudarle a pagar, primero necesito entender su situación actual. ¿Cuál sería la forma de pago más cómoda para usted y qué monto podría pagar, ya sea la totalidad o en cuotas?', timestamp: '2025-07-27T10:01:08Z' },
      { id: 't13', role: 'bot', content: 'Análisis: Cliente proactivo. Ofrecer opciones de pago.', timestamp: '2025-07-27T10:01:08.909Z', llmResponseTime: 909 },
      { id: 't14', role: 'client', content: 'Yo le puedo pagar en cuotas.', timestamp: '2025-07-27T10:01:23Z' },
      { id: 't15', role: 'agent', content: 'Excelente, Sr. fernandez. Me alegra saber que podemos trabajar en un plan de cuotas. Para ofrecerle la mejor opción, ¿podría decirme qué monto podría pagar mensualmente? Esto me ayudará...', timestamp: '2025-07-27T10:01:27Z' },
      { id: 't16', role: 'bot', content: 'Análisis: Cliente proactivo. Ofrecer opciones de pago.', timestamp: '2025-07-27T10:01:27.580Z', llmResponseTime: 580 },
      { id: 't17', role: 'client', content: 'Yo le puedo pagar como de 20 en 20 dólares.', timestamp: '2025-07-27T10:01:39Z' },
      { id: 't18', role: 'agent', content: 'Entiendo, Sr. fernandez. Pagar de veinte en veinte dólares podría ser una opción viable. Sin embargo, dado el monto total de su deuda, tomaría bastante tiempo saldarla por completo. ¿Estaría de acuerdo con un plan de pagos a largo plazo, o prefiere explorar otras alternativas que le permitan liquidar la deuda en un plazo más corto?', timestamp: '2025-07-27T10:01:45Z' },
      { id: 't19', role: 'bot', content: 'Análisis: Cliente proactivo. Ofrecer opciones de pago.', timestamp: '2025-07-27T10:01:45.787Z', llmResponseTime: 787 },
      { id: 't20', role: 'client', content: 'De repente en un año, ¿cómo puedo hacer para pagarlo todo?', timestamp: '2025-07-27T10:02:08Z' },
      { id: 't21', role: 'agent', content: 'Para pagar el total de su deuda de mil dólares en un año, necesitaríamos calcular un plan de pagos que se ajuste a ese plazo. Esto significaría que sus pagos mensuales serían de aproximadamente ochenta y cuatro dólares. ¿Le parece que esta cantidad se ajusta a su presupuesto mensual?', timestamp: '2025-07-27T10:02:13Z' },
      { id: 't22', role: 'bot', content: 'Análisis: Cliente proactivo. Ofrecer opciones de pago.', timestamp: '2025-07-27T10:02:13.766Z', llmResponseTime: 766 },
      { id: 't23', role: 'client', content: 'No, no puedo. Es mucho para mí. Puede ser $25.', timestamp: '2025-07-27T10:02:31Z' },
      { id: 't24', role: 'agent', content: 'Entiendo, Sr. fernandez. Veinticinco dólares al mes es un monto más cómodo para usted. Con pagos de veinticinco dólares mensuales, tomaría más tiempo cubrir el saldo total de mil dólares, aproximadamente cuarenta meses. ¿Estaría bien para usted un plan de pago extendido a ese plazo?', timestamp: '2025-07-27T10:02:38Z' },
      { id: 't25', role: 'bot', content: 'Análisis: Cliente proactivo. Ofrecer opciones de pago.', timestamp: '2025-07-27T10:02:38.652Z', llmResponseTime: 652 },
      { id: 't26', role: 'client', content: 'Sí, sí, sí puedo.', timestamp: '2025-07-27T10:02:58Z' },
      { id: 't27', role: 'agent', content: 'Perfecto, Sr. fernandez. Me alegra que hayamos encontrado un monto que se ajuste a sus posibilidades. Entonces, confirmamos que usted realizará pagos mensuales de veinticinco dólares. ¿Está de acuerdo con que le envíe un recordatorio de pago unos días antes de la fecha límite para evitar cualquier inconveniente?', timestamp: '2025-07-27T10:03:02Z' },
      { id: 't28', role: 'bot', content: 'Análisis: Cliente proactivo. Ofrecer opciones de pago.', timestamp: '2025-07-27T10:03:02.790Z', llmResponseTime: 790 },
      { id: 't29', role: 'client', content: 'Sí, está bien. Me gusta.', timestamp: '2025-07-27T10:03:24Z' },
      { id: 't30', role: 'agent', content: 'Excelente. Para que no se olvide, ¿cuál es su método de contacto preferido para enviarle el recordatorio, correo electrónico o WhatsApp?', timestamp: '2025-07-27T10:03:28Z' },
      { id: 't31', role: 'bot', content: 'Análisis: Cliente proactivo. Ofrecer opciones de pago.', timestamp: '2025-07-27T10:03:28.609Z', llmResponseTime: 609 },
      { id: 't32', role: 'client', content: 'Pueden mandármelo por Whatsapp', timestamp: '2025-07-27T10:03:39Z' },
      { id: 't33', role: 'agent', content: 'Perfecto, Sr. fernandez. Le enviaré un recordatorio por WhatsApp unos días antes de cada fecha de pago. Para confirmar, ¿es este el número al que le enviaré los recordatorios? [Número de teléfono]. Además, le enviaré un resumen de este acuerdo a su WhatsApp para que tenga todos los...', timestamp: '2025-07-27T10:03:42Z' },
    ],
  },
  {
    conversationId: 'conv_another_call',
    clientId: 'cl_001',
    callDirection: 'inbound',
    startTime: '2025-07-20T09:00:00Z',
    endTime: '2025-07-20T09:01:30Z',
    duration: 90,
    status: 'completed',
    turns: [
      { id: 't1', role: 'client', content: 'Hola, llamo para consultar sobre mi estado de cuenta.', timestamp: '2025-07-20T09:00:00Z' },
      { id: 't2', role: 'agent', content: 'Claro, ¿me podría proporcionar su número de identificación?', timestamp: '2025-07-20T09:00:10Z' },
      { id: 't3', role: 'bot', content: 'Análisis: Cliente solicita información de cuenta.', timestamp: '2025-07-20T09:00:10.500Z', llmResponseTime: 500 },
    ],
  },
];
