// Organization Service
// Handles CRUD operations for organizations and tenants

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import {
  Organization,
  Tenant,
  CreateOrganizationData,
  UpdateOrganizationData,
  OrganizationCreationResult,
  OrganizationSwitchResult,
  UserOrganizationMembership,
  MembershipUpdateResult
} from '@/types/globalState';
import { FirestoreUser, UpdateFirestoreUserData } from '@/types/firestoreUser';
import { updateFirestoreUser, ensureFirestoreUser, getUserByUid } from '@/lib/firestore/userService';

// Collection references
const TENANTS_COLLECTION = 'tenants';
const ORGANIZATIONS_SUBCOLLECTION = 'organizations';
const USERS_COLLECTION = 'users';

// Get organization by ID
export async function getOrganizationById(tenantId: string, organizationId: string): Promise<Organization | null> {
  try {
    const orgRef = doc(db, TENANTS_COLLECTION, tenantId, ORGANIZATIONS_SUBCOLLECTION, organizationId);
    const orgDoc = await getDoc(orgRef);
    
    if (!orgDoc.exists()) {
      return null;
    }
    
    const data = orgDoc.data();
    return {
      id: orgDoc.id,
      ...data,
      createdAt: data.createdAt || Timestamp.now(),
      updatedAt: data.updatedAt || Timestamp.now(),
      stats: {
        ...data.stats,
        lastActivity: data.stats?.lastActivity || Timestamp.now(),
      },
    } as Organization;
  } catch (error) {
    console.error('Error getting organization:', error);
    throw new Error('Failed to get organization');
  }
}

// Get tenant by ID
export async function getTenantById(tenantId: string): Promise<Tenant | null> {
  try {
    const tenantRef = doc(db, TENANTS_COLLECTION, tenantId);
    const tenantDoc = await getDoc(tenantRef);
    
    if (!tenantDoc.exists()) {
      return null;
    }
    
    const data = tenantDoc.data();
    return {
      id: tenantDoc.id,
      ...data,
      createdAt: data.createdAt || Timestamp.now(),
      updatedAt: data.updatedAt || Timestamp.now(),
      stats: {
        ...data.stats,
        lastActivity: data.stats?.lastActivity || Timestamp.now(),
      },
    } as Tenant;
  } catch (error) {
    console.error('Error getting tenant:', error);
    throw new Error('Failed to get tenant');
  }
}

// Get organizations for a user
export async function getUserOrganizations(userMemberships: UserOrganizationMembership[]): Promise<Organization[]> {
  try {
    const organizations: Organization[] = [];
    
    // Group memberships by tenant for efficient querying
    const membershipsByTenant = userMemberships.reduce((acc, membership) => {
      if (!acc[membership.tenantId]) {
        acc[membership.tenantId] = [];
      }
      acc[membership.tenantId].push(membership.organizationId);
      return acc;
    }, {} as Record<string, string[]>);
    
    // Fetch organizations for each tenant
    for (const [tenantId, orgIds] of Object.entries(membershipsByTenant)) {
      for (const orgId of orgIds) {
        try {
          const organization = await getOrganizationById(tenantId, orgId);
          if (organization) {
            organizations.push(organization);
          }
        } catch (error) {
          console.error(`Error fetching organization ${orgId} in tenant ${tenantId}:`, error);
          // Continue with other organizations
        }
      }
    }
    
    return organizations;
  } catch (error) {
    console.error('Error getting user organizations:', error);
    throw new Error('Failed to get user organizations');
  }
}

// Get tenants for a user
export async function getUserTenants(userMemberships: UserOrganizationMembership[]): Promise<Tenant[]> {
  try {
    const tenantIds = [...new Set(userMemberships.map(m => m.tenantId))];
    const tenants: Tenant[] = [];
    
    for (const tenantId of tenantIds) {
      try {
        const tenant = await getTenantById(tenantId);
        if (tenant) {
          tenants.push(tenant);
        }
      } catch (error) {
        console.error(`Error fetching tenant ${tenantId}:`, error);
        // Continue with other tenants
      }
    }
    
    return tenants;
  } catch (error) {
    console.error('Error getting user tenants:', error);
    throw new Error('Failed to get user tenants');
  }
}

// Create new organization
export async function createOrganization(
  userId: string,
  organizationData: CreateOrganizationData
): Promise<OrganizationCreationResult> {
  try {
    const batch = writeBatch(db);
    
    // Generate organization ID
    const orgRef = doc(collection(db, TENANTS_COLLECTION, organizationData.tenantId, ORGANIZATIONS_SUBCOLLECTION));
    const organizationId = orgRef.id;
    
    // Create organization document
    const newOrganization: Omit<Organization, 'id'> = {
      name: organizationData.name,
      description: organizationData.description,
      ownerId: userId,
      memberIds: [userId],
      settings: {
        allowMemberInvites: organizationData.settings?.allowMemberInvites ?? true,
        defaultLeadStage: organizationData.settings?.defaultLeadStage ?? 'Nuevo',
        timezone: organizationData.settings?.timezone ?? 'America/Mexico_City',
        inheritFromTenant: false,
      },
      branding: organizationData.branding || {},
      limits: {
        maxUsers: 25,
        maxLeads: 1000,
        storageUsed: 0,
        storageLimit: 1073741824, // 1GB
      },
      stats: {
        totalLeads: 0,
        totalCampaigns: 0,
        monthlyActivity: {
          leads: 0,
          campaigns: 0,
          apiCalls: 0,
        },
        lastActivity: Timestamp.now(),
        activeUsers: 1,
      },
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    // Add organization to batch
    batch.set(orgRef, newOrganization);
    
    // Update tenant organization count
    const tenantRef = doc(db, TENANTS_COLLECTION, organizationData.tenantId);
    batch.update(tenantRef, {
      organizationCount: increment(1),
      'stats.organizationsCount': increment(1),
      updatedAt: serverTimestamp(),
    });
    
    // Update user's organization memberships
    const userRef = doc(db, USERS_COLLECTION, userId);
    const newMembership: UserOrganizationMembership = {
      organizationId,
      organizationName: organizationData.name,
      tenantId: organizationData.tenantId,
      tenantName: '', // Will be filled by the calling function
      role: 'owner',
      permissions: ['*'], // Owner has all permissions
      joinedAt: Timestamp.now(),
      isActive: true,
      lastActivity: Timestamp.now(),
    };
    
    // Add membership to user document
    batch.update(userRef, {
      organizationMemberships: increment(1),
      totalOrganizations: increment(1),
      updatedAt: serverTimestamp(),
    });
    
    // Commit batch
    await batch.commit();
    
    return {
      success: true,
      message: 'Organización creada exitosamente',
      organization: {
        id: organizationId,
        ...newOrganization,
      },
    };
  } catch (error) {
    console.error('Error creating organization:', error);
    return {
      success: false,
      message: 'Error al crear la organización',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Update organization
export async function updateOrganization(
  tenantId: string,
  organizationId: string,
  updateData: UpdateOrganizationData
): Promise<OrganizationCreationResult> {
  try {
    const orgRef = doc(db, TENANTS_COLLECTION, tenantId, ORGANIZATIONS_SUBCOLLECTION, organizationId);
    
    const updatePayload = {
      ...updateData,
      updatedAt: serverTimestamp(),
    };
    
    await updateDoc(orgRef, updatePayload);
    
    // Get updated organization
    const updatedOrg = await getOrganizationById(tenantId, organizationId);
    
    return {
      success: true,
      message: 'Organización actualizada exitosamente',
      organization: updatedOrg || undefined,
    };
  } catch (error) {
    console.error('Error updating organization:', error);
    return {
      success: false,
      message: 'Error al actualizar la organización',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Switch user's current organization
export async function switchUserOrganization(
  userId: string,
  organizationId: string,
  tenantId: string
): Promise<OrganizationSwitchResult> {
  try {
    // Verify user exists first
    let user = await getUserByUid(userId);
    if (!user) {
      console.warn(`User ${userId} not found in Firestore, cannot switch organization`);
      throw new Error('Usuario no encontrado en Firestore');
    }
    
    // Verify organization exists
    const organization = await getOrganizationById(tenantId, organizationId);
    if (!organization) {
      throw new Error('Organización no encontrada');
    }
    
    // Verify tenant exists
    const tenant = await getTenantById(tenantId);
    if (!tenant) {
      throw new Error('Tenant no encontrado');
    }
    
    // Update user's current context
    const updateData: UpdateFirestoreUserData = {
      currentOrganizationId: organizationId,
      currentTenantId: tenantId,
      lastActivity: Timestamp.now(),
    };
    
    await updateFirestoreUser(userId, updateData);
    
    return {
      success: true,
      message: 'Organización cambiada exitosamente',
      organization,
      tenant,
    };
  } catch (error) {
    console.error('Error switching organization:', error);
    return {
      success: false,
      message: 'Error al cambiar de organización',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Add user to organization
export async function addUserToOrganization(
  userId: string,
  organizationId: string,
  tenantId: string,
  role: 'admin' | 'member' = 'member',
  permissions: string[] = []
): Promise<MembershipUpdateResult> {
  try {
    const batch = writeBatch(db);
    
    // Get organization to verify it exists and get name
    const organization = await getOrganizationById(tenantId, organizationId);
    if (!organization) {
      throw new Error('Organización no encontrada');
    }
    
    // Get tenant name
    const tenant = await getTenantById(tenantId);
    if (!tenant) {
      throw new Error('Tenant no encontrado');
    }
    
    // Add user to organization's member list
    const orgRef = doc(db, TENANTS_COLLECTION, tenantId, ORGANIZATIONS_SUBCOLLECTION, organizationId);
    batch.update(orgRef, {
      memberIds: [...new Set([...organization.memberIds, userId])],
      'stats.activeUsers': increment(1),
      updatedAt: serverTimestamp(),
    });
    
    // Create membership object
    const membership: UserOrganizationMembership = {
      organizationId,
      organizationName: organization.name,
      tenantId,
      tenantName: tenant.companyInfo.name,
      role,
      permissions,
      joinedAt: Timestamp.now(),
      isActive: true,
      lastActivity: Timestamp.now(),
    };
    
    // Update user document (this would need to be implemented based on your user document structure)
    const userRef = doc(db, USERS_COLLECTION, userId);
    batch.update(userRef, {
      totalOrganizations: increment(1),
      updatedAt: serverTimestamp(),
    });
    
    await batch.commit();
    
    return {
      success: true,
      message: 'Usuario agregado a la organización exitosamente',
      membership,
    };
  } catch (error) {
    console.error('Error adding user to organization:', error);
    return {
      success: false,
      message: 'Error al agregar usuario a la organización',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Remove user from organization
export async function removeUserFromOrganization(
  userId: string,
  organizationId: string,
  tenantId: string
): Promise<MembershipUpdateResult> {
  try {
    const batch = writeBatch(db);
    
    // Get organization
    const organization = await getOrganizationById(tenantId, organizationId);
    if (!organization) {
      throw new Error('Organización no encontrada');
    }
    
    // Cannot remove owner
    if (organization.ownerId === userId) {
      throw new Error('No se puede remover al propietario de la organización');
    }
    
    // Remove user from organization's member list
    const orgRef = doc(db, TENANTS_COLLECTION, tenantId, ORGANIZATIONS_SUBCOLLECTION, organizationId);
    const updatedMemberIds = organization.memberIds.filter(id => id !== userId);
    
    batch.update(orgRef, {
      memberIds: updatedMemberIds,
      'stats.activeUsers': increment(-1),
      updatedAt: serverTimestamp(),
    });
    
    // Update user document
    const userRef = doc(db, USERS_COLLECTION, userId);
    batch.update(userRef, {
      totalOrganizations: increment(-1),
      updatedAt: serverTimestamp(),
    });
    
    await batch.commit();
    
    return {
      success: true,
      message: 'Usuario removido de la organización exitosamente',
    };
  } catch (error) {
    console.error('Error removing user from organization:', error);
    return {
      success: false,
      message: 'Error al remover usuario de la organización',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Get organization statistics
export async function getOrganizationStats(tenantId: string, organizationId: string) {
  try {
    const organization = await getOrganizationById(tenantId, organizationId);
    if (!organization) {
      throw new Error('Organización no encontrada');
    }
    
    return {
      ...organization.stats,
      memberCount: organization.memberIds.length,
      isActive: organization.isActive,
      createdAt: organization.createdAt,
      limits: organization.limits,
    };
  } catch (error) {
    console.error('Error getting organization stats:', error);
    throw new Error('Failed to get organization statistics');
  }
}