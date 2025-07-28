import React from 'react';
import { Metadata } from 'next';
import OrganizationManager from '@/components/organizations/OrganizationManager';

export const metadata: Metadata = {
  title: 'Mis Organizaciones | MAR-IA',
  description: 'Gestiona y cambia entre tus organizaciones',
};

export default function OrganizationsPage() {
  return (
    <div className="container mx-auto py-6">
      <OrganizationManager />
    </div>
  );
}