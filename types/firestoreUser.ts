// Firestore User Collection Data Model
// Based on the users collection structure from docs/schema.json

import { Timestamp } from 'firebase/firestore';

// Organization membership structure
export interface OrganizationMembership {
  tenantId: string;
  tenantName: string;
  organizationId: string;
  organizationName: string;
  role: 'owner' | 'admin' | 'member';
  permissions: string[];
  joinedAt: Timestamp;
  isActive: boolean;
  invitedBy: string | null;
  lastActivity: Timestamp;
}

// Tenant membership structure
export interface TenantMembership {
  tenantId: string;
  organizationId: string;
  role: 'owner' | 'admin' | 'member';
  permissions: string[];
  joinedAt: Timestamp;
  isActive: boolean;
}

// User profile data structure
export interface UserProfileData {
  firstName: string;
  lastName: string;
  phone: string;
  position: string;
  department: string;
  location: string;
  bio: string;
}

// User preferences structure
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

// Main Firestore User document structure
export interface FirestoreUser {
  // Basic identity fields
  uid?: string; // This will be the key field for UID matching
  email: string;
  emailVerified: boolean;
  displayName: string;
  name: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  
  // Profile information
  profile: UserProfileData;
  
  // Organization and tenant memberships
  organizations: string[]; // Array of "tenantId/organizationId" strings
  organizationMemberships: OrganizationMembership[];
  tenant_memberships: Record<string, TenantMembership>;
  
  // Roles and permissions
  role: 'owner' | 'admin' | 'member';
  systemRole: 'admin' | 'user';
  
  // Counters and current context
  totalOrganizations: number;
  totalTenants: number;
  currentTenantId: string;
  currentOrganizationId: string;
  
  // Activity tracking
  lastLoginAt: Timestamp | null;
  lastActivity: Timestamp;
  loginCount: number;
  
  // Status flags
  invitationSent: boolean;
  isActive: boolean;
  isOnline: boolean;
  profileCompleted: boolean;
  
  // User preferences
  preferences: UserPreferences;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  version: number;
}

// For creating new Firestore user documents
export interface CreateFirestoreUserData {
  uid: string; // Required for UID matching
  email: string;
  emailVerified: boolean;
  displayName: string;
  name: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  profile?: Partial<UserProfileData>;
  role?: 'owner' | 'admin' | 'member';
  systemRole?: 'admin' | 'user';
  currentTenantId?: string;
  currentOrganizationId?: string;
  preferences?: Partial<UserPreferences>;
}

// For updating Firestore user documents
export interface UpdateFirestoreUserData {
  uid?: string; // Allow UID updates for synchronization
  displayName?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profile?: Partial<UserProfileData>;
  emailVerified?: boolean;
  currentTenantId?: string;
  currentOrganizationId?: string;
  preferences?: Partial<UserPreferences>;
  isActive?: boolean;
  isOnline?: boolean;
  profileCompleted?: boolean;
  lastActivity?: Timestamp;
  updatedAt?: Timestamp;
}

// Editable user data interface (campos que el usuario puede editar)
export interface EditableUserData {
  // Información básica editable
  displayName: string;
  name: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  
  // Información del perfil editable
  profile: {
    firstName: string;
    lastName: string;
    phone: string;
    position: string;
    department: string;
    location: string;
    bio: string;
  };
  
  // Preferencias editables
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
  
  // Status flags editables (solo por admins)
  isActive?: boolean;
  profileCompleted?: boolean;
}

// Campos de solo lectura (no editables)
export interface ReadOnlyUserData {
  // IDs (nunca editables)
  uid: string;
  email: string;
  
  // Fechas (nunca editables)
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastActivity: Timestamp;
  lastLoginAt: Timestamp | null;
  
  // Verificación (controlada por el sistema)
  emailVerified: boolean;
  
  // Membresías y organizaciones (controladas por el sistema)
  organizations: string[];
  organizationMemberships: OrganizationMembership[];
  tenant_memberships: Record<string, TenantMembership>;
  
  // Roles (solo editables por super admin)
  role: 'owner' | 'admin' | 'member';
  systemRole: 'admin' | 'user';
  
  // Contadores (controlados por el sistema)
  totalOrganizations: number;
  totalTenants: number;
  loginCount: number;
  
  // Estados controlados por el sistema
  invitationSent: boolean;
  isOnline: boolean;
  
  // Contexto actual (puede ser editable dependiendo de permisos)
  currentTenantId: string;
  currentOrganizationId: string;
  
  // Versión (controlada por el sistema)
  version: number;
}

// Formulario de edición de usuario
export interface UserEditFormData {
  // Información personal
  displayName: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  
  // Información del perfil
  position: string;
  department: string;
  location: string;
  bio: string;
  
  // Preferencias
  theme: 'light' | 'dark' | 'system';
  language: string;
  notificationEmail: boolean;
  notificationPush: boolean;
  notificationSms: boolean;
}

// Resultado de actualización de usuario
export interface UserUpdateResult {
  success: boolean;
  message: string;
  updatedFields?: string[];
  error?: string;
  updatedUser?: FirestoreUser;
}

// UID verification result
export interface UidVerificationResult {
  isMatching: boolean;
  firebaseAuthUid: string;
  firestoreUid: string | null;
  requiresSync: boolean;
  message: string;
}

// Combined user data (Firebase Auth + Firestore)
export interface CombinedUserData {
  firebaseAuth: import('./firebaseUser').FirebaseUserRecord;
  firestoreUser: FirestoreUser | null;
  uidVerification: UidVerificationResult;
}

// Utility function to create default user preferences
export function createDefaultUserPreferences(): UserPreferences {
  return {
    theme: 'system',
    language: 'es',
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
  };
}

// Utility function to create default user profile
export function createDefaultUserProfile(): UserProfileData {
  return {
    firstName: '',
    lastName: '',
    phone: '',
    position: '',
    department: '',
    location: '',
    bio: '',
  };
}

// Convert Firebase Auth user to CreateFirestoreUserData
export function createFirestoreUserFromAuth(
  authUser: import('./firebaseUser').FirebaseUserRecord,
  additionalData?: Partial<CreateFirestoreUserData>
): CreateFirestoreUserData {
  const [firstName = '', lastName = ''] = (authUser.displayName || '').split(' ', 2);
  
  return {
    uid: authUser.uid,
    email: authUser.email || '',
    emailVerified: authUser.emailVerified,
    displayName: authUser.displayName || '',
    name: authUser.displayName || '',
    firstName,
    lastName,
    phoneNumber: authUser.phoneNumber || '',
    profile: createDefaultUserProfile(),
    role: 'member',
    systemRole: 'user',
    preferences: createDefaultUserPreferences(),
    ...additionalData,
  };
}

// Verify UID matching between Firebase Auth and Firestore
export function verifyUidMatching(
  firebaseAuthUid: string,
  firestoreUser: FirestoreUser | null
): UidVerificationResult {
  if (!firestoreUser) {
    return {
      isMatching: false,
      firebaseAuthUid,
      firestoreUid: null,
      requiresSync: true,
      message: 'Usuario no encontrado en Firestore. Se requiere sincronización.',
    };
  }
  
  const firestoreUid = firestoreUser.uid || null;
  
  if (!firestoreUid) {
    return {
      isMatching: false,
      firebaseAuthUid,
      firestoreUid: null,
      requiresSync: true,
      message: 'UID no establecido en documento de Firestore. Se requiere sincronización.',
    };
  }
  
  if (firebaseAuthUid !== firestoreUid) {
    return {
      isMatching: false,
      firebaseAuthUid,
      firestoreUid,
      requiresSync: true,
      message: `UIDs no coinciden. Firebase Auth: ${firebaseAuthUid}, Firestore: ${firestoreUid}`,
    };
  }
  
  return {
    isMatching: true,
    firebaseAuthUid,
    firestoreUid,
    requiresSync: false,
    message: 'UIDs coinciden correctamente.',
  };
}

// Convert FirestoreUser to UserEditFormData for editing
export function createUserEditFormData(firestoreUser: FirestoreUser): UserEditFormData {
  return {
    // Información personal
    displayName: firestoreUser.displayName || '',
    firstName: firestoreUser.firstName || '',
    lastName: firestoreUser.lastName || '',
    phoneNumber: firestoreUser.phoneNumber || '',
    
    // Información del perfil
    position: firestoreUser.profile?.position || '',
    department: firestoreUser.profile?.department || '',
    location: firestoreUser.profile?.location || '',
    bio: firestoreUser.profile?.bio || '',
    
    // Preferencias
    theme: firestoreUser.preferences?.theme || 'system',
    language: firestoreUser.preferences?.language || 'es',
    notificationEmail: firestoreUser.preferences?.notifications?.email ?? true,
    notificationPush: firestoreUser.preferences?.notifications?.push ?? true,
    notificationSms: firestoreUser.preferences?.notifications?.sms ?? false,
  };
}

// Convert UserEditFormData to UpdateFirestoreUserData for saving
export function createUpdateDataFromForm(formData: UserEditFormData): UpdateFirestoreUserData {
  return {
    displayName: formData.displayName,
    name: formData.displayName, // Keep name in sync with displayName
    firstName: formData.firstName,
    lastName: formData.lastName,
    phoneNumber: formData.phoneNumber,
    
    profile: {
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phoneNumber,
      position: formData.position,
      department: formData.department,
      location: formData.location,
      bio: formData.bio,
    },
    
    preferences: {
      theme: formData.theme,
      language: formData.language,
      notifications: {
        email: formData.notificationEmail,
        push: formData.notificationPush,
        sms: formData.notificationSms,
      },
    },
    
    updatedAt: Timestamp.now(),
  };
}

// Get editable fields from FirestoreUser
export function getEditableUserData(firestoreUser: FirestoreUser): EditableUserData {
  return {
    displayName: firestoreUser.displayName || '',
    name: firestoreUser.name || '',
    firstName: firestoreUser.firstName || '',
    lastName: firestoreUser.lastName || '',
    phoneNumber: firestoreUser.phoneNumber || '',
    
    profile: {
      firstName: firestoreUser.profile?.firstName || '',
      lastName: firestoreUser.profile?.lastName || '',
      phone: firestoreUser.profile?.phone || '',
      position: firestoreUser.profile?.position || '',
      department: firestoreUser.profile?.department || '',
      location: firestoreUser.profile?.location || '',
      bio: firestoreUser.profile?.bio || '',
    },
    
    preferences: {
      theme: firestoreUser.preferences?.theme || 'system',
      language: firestoreUser.preferences?.language || 'es',
      notifications: {
        email: firestoreUser.preferences?.notifications?.email ?? true,
        push: firestoreUser.preferences?.notifications?.push ?? true,
        sms: firestoreUser.preferences?.notifications?.sms ?? false,
      },
    },
    
    isActive: firestoreUser.isActive,
    profileCompleted: firestoreUser.profileCompleted,
  };
}

// Get read-only fields from FirestoreUser
export function getReadOnlyUserData(firestoreUser: FirestoreUser): ReadOnlyUserData {
  return {
    uid: firestoreUser.uid || '',
    email: firestoreUser.email,
    
    createdAt: firestoreUser.createdAt,
    updatedAt: firestoreUser.updatedAt,
    lastActivity: firestoreUser.lastActivity,
    lastLoginAt: firestoreUser.lastLoginAt,
    
    emailVerified: firestoreUser.emailVerified,
    
    organizations: firestoreUser.organizations,
    organizationMemberships: firestoreUser.organizationMemberships,
    tenant_memberships: firestoreUser.tenant_memberships,
    
    role: firestoreUser.role,
    systemRole: firestoreUser.systemRole,
    
    totalOrganizations: firestoreUser.totalOrganizations,
    totalTenants: firestoreUser.totalTenants,
    loginCount: firestoreUser.loginCount,
    
    invitationSent: firestoreUser.invitationSent,
    isOnline: firestoreUser.isOnline,
    
    currentTenantId: firestoreUser.currentTenantId,
    currentOrganizationId: firestoreUser.currentOrganizationId,
    
    version: firestoreUser.version,
  };
}