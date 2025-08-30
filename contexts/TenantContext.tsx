'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface TenantInfo {
  id: string;
  name: string;
  identifier: string;
  plan: string;
}

interface OrganizationInfo {
  id: string;
  name: string;
  tenantId: string;
  description?: string | null;
  tagline?: string | null;
  industry?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  timezone?: string | null;
  logo?: string | null;
  services?: string[];
  companyValues?: string | null;
  salesPitch?: string | null;
  targetAudience?: string | null;
}

interface TenantContextType {
  currentTenant: TenantInfo | null;
  currentOrganization: OrganizationInfo | null;
  loading: boolean;
  error: string | null;
  refreshTenantData: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currentTenant, setCurrentTenant] = useState<TenantInfo | null>(null);
  const [currentOrganization, setCurrentOrganization] = useState<OrganizationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshTenantData = async () => {
    if (!user?.tenantId || !user?.organizationId) {
      console.log('🏢 [TENANT] No tenant/org IDs in user context');
      setCurrentTenant(null);
      setCurrentOrganization(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🏢 [TENANT] Fetching tenant data for:', {
        tenantId: user.tenantId,
        organizationId: user.organizationId
      });

      // Obtener datos del tenant y organización desde la base de datos
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/tenant/get', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log('🏢 [TENANT] Tenant not found (404) - likely after DB reset. Clearing user session.');
          // Clear invalid session data
          localStorage.removeItem('auth_token');
          setCurrentTenant(null);
          setCurrentOrganization(null);
          setLoading(false);
          return;
        }
        throw new Error(`Failed to fetch tenant info: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setCurrentTenant(result.tenant);
        setCurrentOrganization(result.organization);
        console.log('✅ [TENANT] Tenant data loaded:', {
          tenant: result.tenant?.name,
          organization: result.organization?.name
        });
      } else {
        throw new Error(result.error || 'Failed to load tenant data');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ [TENANT] Error loading tenant data:', errorMessage);
      setError(errorMessage);
      
      // Fallback: usar datos del JWT si están disponibles
      if (user.tenantId && user.organizationId) {
        console.log('🔄 [TENANT] Using fallback data from JWT');
        setCurrentTenant({
          id: user.tenantId,
          name: 'Current Tenant',
          identifier: 'current',
          plan: 'basic'
        });
        setCurrentOrganization({
          id: user.organizationId,
          name: 'Current Organization',
          tenantId: user.tenantId
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshTenantData();
    } else {
      setCurrentTenant(null);
      setCurrentOrganization(null);
      setLoading(false);
    }
  }, [user]);

  const value = {
    currentTenant,
    currentOrganization,
    loading,
    error,
    refreshTenantData
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}