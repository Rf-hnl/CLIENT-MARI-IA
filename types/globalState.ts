// Global State Types and Interfaces
// Based on schema.json structure for tenants and organizations

import { Timestamp } from 'firebase/firestore';
import { FirebaseUserRecord } from './firebaseUser';
import { FirestoreUser } from './firestoreUser';

// Organization data structure (from schema.json)
export interface Organization {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  memberIds: string[];
  settings: {
    allowMemberInvites: boolean;
    defaultLeadStage: string;
    timezone: string;
    inheritFromTenant?: boolean;
  };
  branding?: {
    primaryColor: string;
  };
  limits?: {
    maxUsers: number;
    maxLeads: number;
    storageUsed: number;
    storageLimit: number;
  };
  stats: {
    totalLeads: number;
    totalCampaigns: number;
    monthlyActivity: {
      leads: number;
      campaigns: number;
      apiCalls: number;
    };
    lastActivity: Timestamp;
    activeUsers: number;
  };
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Tenant data structure (from schema.json)
export interface Tenant {
  id: string;
  companyInfo: {
    name: string;
    description: string;
    industry: string;
    size: 'small' | 'medium' | 'large' | 'enterprise';
    website: string;
    logoUrl: string;
  };
  ownerId: string;
  status: 'active' | 'inactive' | 'suspended';
  planType: 'basic' | 'premium' | 'enterprise';
  userCount: number;
  organizationCount: number;
  stats: {
    organizationsCount: number;
    userCount: number;
    lastActivity: Timestamp;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// User's organization membership details
export interface UserOrganizationMembership {
  organizationId: string;
  organizationName: string;
  tenantId: string;
  tenantName: string;
  role: 'owner' | 'admin' | 'member';
  permissions: string[];
  joinedAt: Timestamp;
  isActive: boolean;
  lastActivity: Timestamp;
}

// Current user context data
export interface CurrentUser {
  // Firebase Auth data
  firebaseAuth: FirebaseUserRecord;
  // Firestore data
  firestoreUser: FirestoreUser;
  // User's memberships
  memberships: UserOrganizationMembership[];
  // Available organizations for this user
  availableOrganizations: Organization[];
  // Available tenants for this user
  availableTenants: Tenant[];
}

// Current session context
export interface CurrentSession {
  // Current active organization
  currentOrganization: Organization | null;
  // Current active tenant
  currentTenant: Tenant | null;
  // User's role in current organization
  userRole: 'owner' | 'admin' | 'member' | null;
  // User's permissions in current organization
  userPermissions: string[];
  // Whether user can create organizations
  canCreateOrganizations: boolean;
  // Whether user can switch organizations
  canSwitchOrganizations: boolean;
}

// Global application state
export interface GlobalState {
  // User data
  user: CurrentUser | null;
  // Session data
  session: CurrentSession;
  // Loading states
  loading: {
    user: boolean;
    organizations: boolean;
    tenants: boolean;
    switching: boolean;
  };
  // Error states
  errors: {
    user: string | null;
    organizations: string | null;
    tenants: string | null;
    switching: string | null;
  };
  // Initialization state
  isInitialized: boolean;
}

// Actions for state management
export type GlobalStateAction =
  // User actions
  | { type: 'SET_USER'; payload: CurrentUser }
  | { type: 'CLEAR_USER' }
  | { type: 'UPDATE_USER'; payload: Partial<CurrentUser> }
  
  // Organization actions
  | { type: 'SET_CURRENT_ORGANIZATION'; payload: Organization }
  | { type: 'ADD_ORGANIZATION'; payload: Organization }
  | { type: 'UPDATE_ORGANIZATION'; payload: { id: string; data: Partial<Organization> } }
  | { type: 'REMOVE_ORGANIZATION'; payload: string }
  
  // Tenant actions
  | { type: 'SET_CURRENT_TENANT'; payload: Tenant }
  | { type: 'ADD_TENANT'; payload: Tenant }
  | { type: 'UPDATE_TENANT'; payload: { id: string; data: Partial<Tenant> } }
  
  // Session actions
  | { type: 'SWITCH_ORGANIZATION'; payload: { organizationId: string; tenantId: string } }
  | { type: 'UPDATE_SESSION'; payload: Partial<CurrentSession> }
  
  // Loading actions
  | { type: 'SET_LOADING'; payload: { key: keyof GlobalState['loading']; value: boolean } }
  
  // Error actions
  | { type: 'SET_ERROR'; payload: { key: keyof GlobalState['errors']; value: string | null } }
  
  // Initialization
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'RESET_STATE' };

// Organization creation data
export interface CreateOrganizationData {
  name: string;
  description: string;
  tenantId: string;
  settings?: {
    allowMemberInvites?: boolean;
    defaultLeadStage?: string;
    timezone?: string;
  };
  branding?: {
    primaryColor?: string;
  };
}

// Organization update data
export interface UpdateOrganizationData {
  name?: string;
  description?: string;
  settings?: Partial<Organization['settings']>;
  branding?: Partial<Organization['branding']>;
  limits?: Partial<Organization['limits']>;
}

// Organization switch result
export interface OrganizationSwitchResult {
  success: boolean;
  message: string;
  organization?: Organization;
  tenant?: Tenant;
  error?: string;
}

// User membership update result
export interface MembershipUpdateResult {
  success: boolean;
  message: string;
  membership?: UserOrganizationMembership;
  error?: string;
}

// Organization creation result
export interface OrganizationCreationResult {
  success: boolean;
  message: string;
  organization?: Organization;
  error?: string;
}

// Helper function to create initial state
export function createInitialGlobalState(): GlobalState {
  return {
    user: null,
    session: {
      currentOrganization: null,
      currentTenant: null,
      userRole: null,
      userPermissions: [],
      canCreateOrganizations: false,
      canSwitchOrganizations: false,
    },
    loading: {
      user: false,
      organizations: false,
      tenants: false,
      switching: false,
    },
    errors: {
      user: null,
      organizations: null,
      tenants: null,
      switching: null,
    },
    isInitialized: false,
  };
}

// Helper function to check user permissions
export function hasPermission(permissions: string[], permission: string): boolean {
  return permissions.includes(permission) || permissions.includes('*');
}

// Helper function to check if user is owner/admin
export function isOwnerOrAdmin(role: string | null): boolean {
  return role === 'owner' || role === 'admin';
}

// Helper function to get user's role in organization
export function getUserRoleInOrganization(
  memberships: UserOrganizationMembership[],
  organizationId: string
): 'owner' | 'admin' | 'member' | null {
  const membership = memberships.find(m => m.organizationId === organizationId);
  return membership?.role || null;
}

// Helper function to get available organizations for tenant
export function getOrganizationsForTenant(
  organizations: Organization[],
  tenantId: string,
  memberships: UserOrganizationMembership[]
): Organization[] {
  const userOrgIds = memberships
    .filter(m => m.tenantId === tenantId)
    .map(m => m.organizationId);
  
  return organizations.filter(org => userOrgIds.includes(org.id));
}