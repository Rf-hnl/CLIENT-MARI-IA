/**
 * Tipos TypeScript para el sistema de Campañas y Productos
 */

// Tipos básicos para Productos
export interface Product {
  id: string;
  tenantId: string;
  organizationId: string;
  name: string;
  description?: string | null;
  price?: number | null;
  sku?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Tipos básicos para Campañas
export interface Campaign {
  id: string;
  tenantId: string;
  organizationId: string;
  name: string;
  description?: string | null;
  budget?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
}

// Estados de las campañas
export type CampaignStatus = 'draft' | 'active' | 'completed' | 'archived';

// Relación M:N entre Campañas y Productos
export interface CampaignProduct {
  campaignId: string;
  productId: string;
  createdAt: string;
}

// Tipos extendidos con relaciones

export interface CampaignWithProducts extends Campaign {
  products: Product[];
}

export interface ProductWithCampaigns extends Product {
  campaigns: Campaign[];
}

export interface CampaignWithLeadsCount extends Campaign {
  _count?: {
    leads: number;
  };
}

export interface CampaignWithMetrics extends Campaign {
  products: Product[];
  _count: {
    leads: number;
  };
  metrics?: {
    totalLeads: number;
    conversionRate: number;
    totalRevenue: number;
    activeLeads: number;
    completedLeads: number;
  };
}

// Tipos para formularios

export interface CreateCampaignData {
  name: string;
  description?: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  status?: CampaignStatus;
  productIds?: string[];
}

export interface UpdateCampaignData extends Partial<CreateCampaignData> {
  id: string;
}

export interface CreateProductData {
  name: string;
  description?: string;
  price?: number;
  sku?: string;
  isActive?: boolean;
}

export interface UpdateProductData extends Partial<CreateProductData> {
  id: string;
}

// Tipos para APIs

export interface CampaignListResponse {
  campaigns: Campaign[];
  total: number;
  page: number;
  limit: number;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
}

// Filtros para búsquedas

export interface CampaignFilters {
  status?: CampaignStatus;
  search?: string;
  dateRange?: {
    startDate?: string;
    endDate?: string;
  };
}

export interface ProductFilters {
  isActive?: boolean;
  search?: string;
  priceRange?: {
    min?: number;
    max?: number;
  };
}

// Tipos para el contexto del agente de IA

export interface CampaignContextForAgent {
  campaignName: string;
  campaignDescription?: string;
  products: {
    name: string;
    description?: string;
    price?: number;
  }[];
}

// Estadísticas y métricas

export interface CampaignStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalLeads: number;
  averageConversionRate: number;
  totalRevenue: number;
}

export interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  averagePrice: number;
  mostPopularProducts: {
    id: string;
    name: string;
    campaignCount: number;
  }[];
}