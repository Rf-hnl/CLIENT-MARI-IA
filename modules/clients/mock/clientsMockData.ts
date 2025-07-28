/**
 * MOCK DATA - CLIENTS MODULE
 * 
 * Datos de prueba para el módulo de clientes
 * Basado en el modelo IClient definido
 */

import { IClient, ICallLog, IWhatsAppRecord, IClientAIProfile, IMessageRole } from '../types/clients';

export const mockClients: IClient[] = [
  {
    name: "Carlos Rodríguez González",
    email: "carlos.rodriguez@ejemplo.com",
    phone: "+507 6311-6918",
    national_id: "8-123-456",
    address: "Avenida Balboa, Torre Financial Center, Piso 15",
    city: "Panamá",
    province: "Panamá",
    postal_code: "0001",
    country: "Panamá",
    debt: 8500.75,
    status: "current",
    loan_letter: "PREST-2024-0456",
    payment_date: {
      _seconds: 1705276800,
      _nanoseconds: 0
    },
    installment_amount: 350.25,
    pending_installments: 18,
    due_date: {
      _seconds: 1707955200,
      _nanoseconds: 0
    },
    loan_start_date: {
      _seconds: 1685577600,
      _nanoseconds: 0
    },
    days_overdue: 0,
    last_payment_date: {
      _seconds: 1705276800,
      _nanoseconds: 0
    },
    last_payment_amount: 350.25,
    credit_score: 720,
    risk_category: "bajo",
    credit_limit: 15000,
    available_credit: 6499.25,
    employment_status: "Empleado a tiempo completo",
    employer: "Copa Airlines",
    position: "Desarrollador Senior",
    monthly_income: 3200,
    employment_verified: true,
    preferred_contact_method: "whatsapp",
    best_contact_time: "9:00 AM - 6:00 PM (L-V)",
    response_score: 8,
    recovery_probability: 85,
    collection_strategy: "Contacto directo mensual",
    notes: "Cliente responsable con historial de pagos puntual",
    internal_notes: "Preferible contacto por WhatsApp en horario laboral",
    tags: ["vip", "puntual", "tecnología"],
    created_at: {
      _seconds: 1685577600,
      _nanoseconds: 0
    },
    updated_at: {
      _seconds: 1705276800,
      _nanoseconds: 0
    }
  },
  {
    name: "María Carmen López Fernández",
    email: undefined, // Missing recommended field
    phone: "+507 6311-6918",
    national_id: "3-456-789",
    address: undefined, // Missing recommended field
    city: "Panamá",
    province: "Panamá",
    postal_code: "0002",
    country: "Panamá",
    debt: 12750.50,
    status: "overdue",
    loan_letter: "PREST-2024-0123",
    payment_date: {
      _seconds: 1704067200,
      _nanoseconds: 0
    },
    installment_amount: 425.00,
    pending_installments: 24,
    due_date: {
      _seconds: 1709251200,
      _nanoseconds: 0
    },
    loan_start_date: {
      _seconds: 1683158400,
      _nanoseconds: 0
    },
    days_overdue: 15,
    last_payment_date: {
      _seconds: 1702857600,
      _nanoseconds: 0
    },
    last_payment_amount: 425.00,
    credit_score: 580,
    risk_category: "medio",
    credit_limit: 10000,
    available_credit: 2249.50,
    employment_status: undefined, // Missing recommended field
    employer: "Zona Libre de Colón",
    position: "Consultora de Marketing",
    monthly_income: undefined, // Missing recommended field
    employment_verified: false,
    preferred_contact_method: undefined, // Missing recommended field
    best_contact_time: "2:00 PM - 7:00 PM (L-V)",
    response_score: 6,
    recovery_probability: 65,
    collection_strategy: "Seguimiento semanal intensivo",
    notes: "Dificultades temporales por reducción de ingresos",
    internal_notes: "Requiere plan de pagos flexible. Evitar llamadas en horario matutino",
    tags: ["riesgo", "autónoma", "seguimiento"],
    created_at: {
      _seconds: 1683158400,
      _nanoseconds: 0
    },
    updated_at: {
      _seconds: 1705190400,
      _nanoseconds: 0
    }
  },
  {
    name: "José Antonio Martín Ruiz",
    email: "ja.martin@empresa.pa",
    phone: "+507 6311-6918",
    national_id: "4-789-123",
    address: "Avenida Ricardo J. Alfaro, Multiplaza Pacific",
    city: "Panamá",
    province: "Panamá",
    postal_code: "0003",
    country: "Panamá",
    debt: 15200.00,
    status: "current",
    loan_letter: "PREST-2024-0789",
    payment_date: {
      _seconds: 1705363200,
      _nanoseconds: 0
    },
    installment_amount: 633.33,
    pending_installments: 30,
    due_date: {
      _seconds: 1712793600,
      _nanoseconds: 0
    },
    loan_start_date: {
      _seconds: 1683936000,
      _nanoseconds: 0
    },
    days_overdue: 0,
    last_payment_date: {
      _seconds: 1705363200,
      _nanoseconds: 0
    },
    last_payment_amount: 633.33,
    credit_score: 780,
    risk_category: "bajo",
    credit_limit: 25000,
    available_credit: 9800.00,
    employment_status: "Empleado a tiempo completo",
    employer: "Banco General",
    position: "Director de Sucursal",
    monthly_income: 4500,
    employment_verified: true,
    preferred_contact_method: "email",
    best_contact_time: "6:00 PM - 9:00 PM (L-V)",
    response_score: 9,
    recovery_probability: 95,
    collection_strategy: "Contacto mensual de cortesía",
    notes: "Cliente de alto valor con excelente historial crediticio",
    internal_notes: "Prefiere comunicación formal por email. Posible cross-selling",
    tags: ["premium", "financiero", "confiable"],
    created_at: {
      _seconds: 1683936000,
      _nanoseconds: 0
    },
    updated_at: {
      _seconds: 1705363200,
      _nanoseconds: 0
    }
  },
  {
    name: "Ana Isabel Jiménez Torres",
    email: "ana.jimenez@hotmail.com",
    phone: "+507 6311-6918",
    national_id: "2-987-654",
    address: "Vía España, Centro Comercial El Dorado",
    city: "Panamá",
    province: "Panamá",
    postal_code: "0004",
    country: "Panamá",
    debt: 6800.25,
    status: "paid",
    loan_letter: "PREST-2023-0945",
    payment_date: {
      _seconds: 1704931200,
      _nanoseconds: 0
    },
    installment_amount: 0,
    pending_installments: 0,
    due_date: {
      _seconds: 1704931200,
      _nanoseconds: 0
    },
    loan_start_date: {
      _seconds: 1672531200,
      _nanoseconds: 0
    },
    days_overdue: 0,
    last_payment_date: {
      _seconds: 1704931200,
      _nanoseconds: 0
    },
    last_payment_amount: 283.34,
    credit_score: 650,
    risk_category: "bajo",
    credit_limit: 12000,
    available_credit: 12000,
    employment_status: "Empleada a tiempo completo",
    employer: "Hospital Santo Tomás",
    position: "Enfermera",
    monthly_income: 2800,
    employment_verified: true,
    preferred_contact_method: "whatsapp",
    best_contact_time: "7:00 PM - 10:00 PM (L-D)",
    response_score: 7,
    recovery_probability: 100,
    collection_strategy: "Cliente satisfecho - sin gestión",
    notes: "Préstamo liquidado completamente. Cliente satisfecho",
    internal_notes: "Candidata para nuevos productos. Excelente relación comercial",
    tags: ["pagado", "sanitario", "fidelizado"],
    created_at: {
      _seconds: 1672531200,
      _nanoseconds: 0
    },
    updated_at: {
      _seconds: 1704931200,
      _nanoseconds: 0
    }
  },
  {
    name: "Francisco Javier Sánchez Moreno",
    email: "fj.sanchez@gmail.com",
    phone: "+507 6311-6918",
    national_id: "9-654-321",
    address: "Avenida Central, Casco Viejo",
    city: "Panamá",
    province: "Panamá",
    postal_code: "0005",
    country: "Panamá",
    debt: 18950.75,
    status: "overdue",
    loan_letter: "PREST-2024-0234",
    payment_date: {
      _seconds: 1703721600,
      _nanoseconds: 0
    },
    installment_amount: 527.52,
    pending_installments: 36,
    due_date: {
      _seconds: 1714521600,
      _nanoseconds: 0
    },
    loan_start_date: {
      _seconds: 1680307200,
      _nanoseconds: 0
    },
    days_overdue: 45,
    last_payment_date: {
      _seconds: 1700265600,
      _nanoseconds: 0
    },
    last_payment_amount: 527.52,
    credit_score: 520,
    risk_category: "alto",
    credit_limit: 8000,
    available_credit: 0,
    employment_status: "Desempleado",
    employer: undefined, // Missing optional field
    position: undefined, // Missing optional field
    monthly_income: 0,
    employment_verified: false,
    preferred_contact_method: undefined, // Missing recommended field
    best_contact_time: "10:00 AM - 2:00 PM (L-V)",
    response_score: 3,
    recovery_probability: 25,
    collection_strategy: "Gestión legal en proceso",
    notes: "Situación laboral complicada. Comunicación irregular",
    internal_notes: "Derivado a departamento legal. Historial de incumplimientos",
    tags: ["alto-riesgo", "desempleo", "legal"],
    created_at: {
      _seconds: 1680307200,
      _nanoseconds: 0
    },
    updated_at: {
      _seconds: 1705449600,
      _nanoseconds: 0
    }
  }
];

export const mockCallLogs: ICallLog[] = [
  {
    id: "call_001",
    clientId: "carlos_rodriguez",
    timestamp: {
      _seconds: 1705190400,
      _nanoseconds: 0
    },
    callType: "collection",
    durationMinutes: 8,
    agentId: "agent_maria",
    notes: "Cliente confirmó próximo pago. Situación estable.",
    outcome: "resolved",
    audioUrl: "https://storage.app.com/audio/call_001.mp3",
    transcription: "Agente: Buenos días Sr. Rodríguez, le llamo para recordarle su pago del 15 de enero. Cliente: Sí, por supuesto. Haré el pago mañana sin falta. Agente: Perfecto, muchas gracias por su puntualidad. Cliente: De nada, siempre procuro cumplir con mis compromisos.",
    transcriptionConfidence: 0.95,
    elevenLabsJobId: "elevenlabs_job_001",
    transcriptionStatus: "completed"
  },
  {
    id: "call_002",
    clientId: "maria_lopez",
    timestamp: {
      _seconds: 1705104000,
      _nanoseconds: 0
    },
    callType: "follow-up",
    durationMinutes: 15,
    agentId: "agent_carlos",
    notes: "Discutido plan de pagos flexible. Cliente acepta nueva fecha.",
    outcome: "escalated",
    audioUrl: "https://storage.app.com/audio/call_002.mp3",
    transcription: "Agente: Señora López, entiendo su situación actual. ¿Podríamos evaluar un plan de pagos más flexible? Cliente: Sí, por favor. Este mes ha sido muy complicado con la reducción de ingresos. Agente: Propongo dividir el pago en dos partes, una ahora y otra en 15 días. Cliente: Eso me ayudaría mucho, acepto la propuesta.",
    transcriptionConfidence: 0.88,
    elevenLabsJobId: "elevenlabs_job_002",
    transcriptionStatus: "completed"
  },
  {
    id: "call_003",
    clientId: "francisco_sanchez",
    timestamp: {
      _seconds: 1705017600,
      _nanoseconds: 0
    },
    callType: "collection",
    durationMinutes: 3,
    agentId: "agent_ana",
    notes: "No responde. Buzón de voz lleno.",
    outcome: "no answer",
    audioUrl: "https://storage.app.com/audio/call_003.mp3",
    transcription: "Sistema: El buzón de voz está lleno. No es posible dejar mensaje.",
    transcriptionConfidence: 0.99,
    elevenLabsJobId: "elevenlabs_job_003",
    transcriptionStatus: "completed"
  }
];

export const mockWhatsAppRecords: IWhatsAppRecord[] = [
  {
    id: "wa_001",
    clientId: "carlos_rodriguez",
    timestamp: {
      _seconds: 1705276800,
      _nanoseconds: 0
    },
    messageDirection: "outbound",
    agentId: "agent_maria",
    messageContent: "Hola Carlos, recordatorio amistoso de tu pago del 15 de enero. ¡Gracias!",
    attachments: [],
    interactionType: "text",
    isBotConversation: false
  },
  {
    id: "wa_002",
    clientId: "carlos_rodriguez",
    timestamp: {
      _seconds: 1705278600,
      _nanoseconds: 0
    },
    messageDirection: "inbound",
    messageContent: "Perfecto, haré el pago mañana por la mañana. Gracias por el recordatorio.",
    attachments: [],
    interactionType: "text",
    isBotConversation: false
  },
  {
    id: "wa_003",
    clientId: "maria_lopez",
    timestamp: {
      _seconds: 1705104000,
      _nanoseconds: 0
    },
    messageDirection: "inbound",
    messageContent: "Conversación completa con bot de pagos",
    attachments: [],
    interactionType: "text",
    isBotConversation: true,
    botTranscription: [
      {
        role: "bot",
        content: "¡Hola María! Soy el asistente de pagos. ¿En qué puedo ayudarte hoy?",
        timestamp: {
          _seconds: 1705104000,
          _nanoseconds: 0
        }
      },
      {
        role: "client",
        content: "Hola, necesito información sobre mi próximo pago",
        timestamp: {
          _seconds: 1705104060,
          _nanoseconds: 0
        }
      },
      {
        role: "bot",
        content: "Claro, tu próximo pago de $425.00 vence el 25 de enero. ¿Necesitas más detalles?",
        timestamp: {
          _seconds: 1705104120,
          _nanoseconds: 0
        }
      },
      {
        role: "client",
        content: "Tendré problemas para pagarlo completo. ¿Hay opciones?",
        timestamp: {
          _seconds: 1705104180,
          _nanoseconds: 0
        }
      },
      {
        role: "bot",
        content: "Entiendo tu situación. Te voy a conectar con un agente para evaluar opciones de pago flexible.",
        timestamp: {
          _seconds: 1705104240,
          _nanoseconds: 0
        }
      }
    ],
    botSessionId: "bot_session_001",
    botIntent: "payment_assistance",
    botConfidence: 0.92,
    requiresHumanHandoff: true
  },
  {
    id: "wa_004",
    clientId: "ana_jimenez",
    timestamp: {
      _seconds: 1704931200,
      _nanoseconds: 0
    },
    messageDirection: "inbound",
    messageContent: "¡Préstamo completamente pagado! Adjunto comprobante final.",
    attachments: ["https://example.com/receipt_final.pdf"],
    interactionType: "media",
    isBotConversation: false
  }
];

export const mockClientAIProfiles: IClientAIProfile[] = [
  {
    clientId: "carlos_rodriguez",
    analysisDate: {
      _seconds: 1705276800,
      _nanoseconds: 0
    },
    profileSegment: "HighValue",
    riskScore: 15,
    engagementScore: 85,
    predictedChurnRisk: false,
    recommendedAction: "OfferPremiumServices",
    lastUpdatedByAI: {
      _seconds: 1705276800,
      _nanoseconds: 0
    }
  },
  {
    clientId: "maria_lopez",
    analysisDate: {
      _seconds: 1705190400,
      _nanoseconds: 0
    },
    profileSegment: "AtRisk",
    riskScore: 65,
    engagementScore: 45,
    predictedChurnRisk: true,
    recommendedAction: "PersonalizedOutreach",
    lastUpdatedByAI: {
      _seconds: 1705190400,
      _nanoseconds: 0
    }
  },
  {
    clientId: "jose_martin",
    analysisDate: {
      _seconds: 1705363200,
      _nanoseconds: 0
    },
    profileSegment: "Premium",
    riskScore: 5,
    engagementScore: 95,
    predictedChurnRisk: false,
    recommendedAction: "CrossSelling",
    lastUpdatedByAI: {
      _seconds: 1705363200,
      _nanoseconds: 0
    }
  },
  {
    clientId: "francisco_sanchez",
    analysisDate: {
      _seconds: 1705449600,
      _nanoseconds: 0
    },
    profileSegment: "HighRisk",
    riskScore: 90,
    engagementScore: 20,
    predictedChurnRisk: true,
    recommendedAction: "LegalAction",
    lastUpdatedByAI: {
      _seconds: 1705449600,
      _nanoseconds: 0
    }
  }
];