import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Agentes IA - Client Mar-IA',
  description: 'Configura y administra tus agentes de ElevenLabs para llamadas automatizadas de cobranza',
}

export default function AgentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}