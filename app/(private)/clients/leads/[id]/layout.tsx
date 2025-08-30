'use client';

import { LeadsProvider } from '@/modules/leads/context/LeadsContext';

interface LeadLayoutProps {
  children: React.ReactNode;
}

export default function LeadLayout({ children }: LeadLayoutProps) {
  return (
    <LeadsProvider>
      {children}
    </LeadsProvider>
  );
}