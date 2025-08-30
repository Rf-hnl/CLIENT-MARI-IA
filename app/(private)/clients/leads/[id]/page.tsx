'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';

interface LeadPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function LeadPage({ params }: LeadPageProps) {
  const router = useRouter();
  const { id } = use(params);

  useEffect(() => {
    // Redirigir automáticamente a la pestaña de trabajo
    router.replace(`/clients/leads/${id}/work`);
  }, [id, router]);

  return null;
}