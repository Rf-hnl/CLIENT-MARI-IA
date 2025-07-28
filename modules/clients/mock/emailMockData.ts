import { IFirebaseTimestamp } from '@/modules/clients/types/clients'; // Import IFirebaseTimestamp

export interface IEmailRecord {
  id: string;
  clientId: string;
  timestamp: IFirebaseTimestamp;
  subject: string;
  body: string;
  direction: 'inbound' | 'outbound'; // 'inbound' for client to agent, 'outbound' for agent to client
  agentResponse?: {
    role: 'agent' | 'bot';
    content: string;
  }[];
}

export const mockEmailRecords: IEmailRecord[] = [
  {
    id: 'email-1',
    clientId: 'client-1',
    timestamp: { _seconds: new Date('2024-07-20T10:00:00Z').getTime() / 1000, _nanoseconds: 0 },
    subject: 'Consulta sobre mi préstamo',
    body: 'Estimado equipo, tengo una consulta sobre el estado de mi préstamo y la fecha de mi próximo pago.',
    direction: 'inbound',
    agentResponse: [
      { role: 'agent', content: 'Hola, ¿en qué puedo ayudarte con tu préstamo?' },
      { role: 'bot', content: 'El cliente pregunta sobre el estado y la fecha de pago de su préstamo.' }
    ]
  },
  {
    id: 'email-2',
    clientId: 'client-1',
    timestamp: { _seconds: new Date('2024-07-20T10:30:00Z').getTime() / 1000, _nanoseconds: 0 },
    subject: 'Re: Consulta sobre mi préstamo',
    body: 'Estimado/a [Nombre del Cliente],\n\nGracias por contactarnos. Su préstamo [Número de Préstamo] está al día. Su próximo pago está programado para el [Fecha de Próximo Pago].\n\nSi tiene alguna otra pregunta, no dude en responder a este correo.\n\nSaludos cordiales,\nEquipo de Soporte',
    direction: 'outbound',
    agentResponse: [
      { role: 'agent', content: 'Le he enviado la información sobre el estado de su préstamo y la fecha de pago.' },
      { role: 'bot', content: 'Se ha respondido al cliente con la información solicitada.' }
    ]
  },
  {
    id: 'email-3',
    clientId: 'client-1',
    timestamp: { _seconds: new Date('2024-07-22T14:00:00Z').getTime() / 1000, _nanoseconds: 0 },
    subject: 'Recordatorio de pago',
    body: 'Estimado/a [Nombre del Cliente],\n\nLe recordamos que su pago de préstamo está próximo a vencer. Por favor, realice su pago a tiempo para evitar cargos por mora.\n\nGracias,\nEquipo de Cobranza',
    direction: 'outbound',
  },
  {
    id: 'email-4',
    clientId: 'client-2',
    timestamp: { _seconds: new Date('2024-07-21T09:00:00Z').getTime() / 1000, _nanoseconds: 0 },
    subject: 'Problema con mi cuenta',
    body: 'No puedo acceder a mi cuenta. ¿Podrían ayudarme?',
    direction: 'inbound',
  },
  {
    id: 'email-5',
    clientId: 'client-2',
    timestamp: { _seconds: new Date('2024-07-21T09:15:00Z').getTime() / 1000, _nanoseconds: 0 },
    subject: 'Re: Problema con mi cuenta',
    body: 'Estimado/a [Nombre del Cliente],\n\nLamentamos que esté experimentando problemas para acceder a su cuenta. Por favor, intente restablecer su contraseña a través del siguiente enlace: [Enlace de Restablecimiento]\n\nSi el problema persiste, no dude en contactarnos nuevamente.\n\nSaludos cordiales,\nEquipo de Soporte',
    direction: 'outbound',
  },
];
