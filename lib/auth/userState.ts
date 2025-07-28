import { User } from 'firebase/auth';
import { getCombinedUserData } from '@/lib/firestore/userService';
import { getUserOrganizations, getUserTenants } from '@/lib/services/organizationService';
import { createFirebaseUserRecord } from '@/types/firebaseUser';

/**
 * Funciones simples para obtener datos del usuario sin estado global complejo
 */

// Cache simple para evitar llamadas repetidas
let cachedUser: any = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Obtiene los datos completos del usuario (Firebase + Firestore)
 */
export async function getCurrentUserData(firebaseUser: User | null) {
  if (!firebaseUser) {
    cachedUser = null;
    return null;
  }

  // Usar cache si es reciente
  const now = Date.now();
  if (cachedUser && cachedUser.firebaseAuth?.uid === firebaseUser.uid && 
      (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedUser;
  }

  try {
    const firebaseUserRecord = createFirebaseUserRecord(firebaseUser);
    const combinedData = await getCombinedUserData(firebaseUserRecord);
    
    if (!combinedData.firestoreUser) {
      return {
        firebaseAuth: firebaseUserRecord,
        firestoreUser: null,
        memberships: [],
        availableOrganizations: [],
        availableTenants: [],
      };
    }

    // Obtener organizaciones y tenants
    const [organizations, tenants] = await Promise.all([
      getUserOrganizations(combinedData.firestoreUser.organizationMemberships),
      getUserTenants(combinedData.firestoreUser.organizationMemberships)
    ]);

    const userData = {
      firebaseAuth: firebaseUserRecord,
      firestoreUser: combinedData.firestoreUser,
      memberships: combinedData.firestoreUser.organizationMemberships,
      availableOrganizations: organizations,
      availableTenants: tenants,
    };

    // Actualizar cache
    cachedUser = userData;
    cacheTimestamp = now;
    
    return userData;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
}

/**
 * Obtiene la organización actual del usuario
 */
export async function getCurrentOrganization(firebaseUser: User | null) {
  const userData = await getCurrentUserData(firebaseUser);
  if (!userData?.firestoreUser?.currentOrganizationId) return null;
  
  return userData.availableOrganizations.find(
    org => org.id === userData.firestoreUser?.currentOrganizationId
  ) || null;
}

/**
 * Obtiene el tenant actual del usuario
 */
export async function getCurrentTenant(firebaseUser: User | null) {
  const userData = await getCurrentUserData(firebaseUser);
  if (!userData?.firestoreUser?.currentTenantId) return null;
  
  return userData.availableTenants.find(
    tenant => tenant.id === userData.firestoreUser?.currentTenantId
  ) || null;
}

/**
 * Verifica si el usuario puede crear organizaciones
 */
export async function canCreateOrganizations(firebaseUser: User | null) {
  const userData = await getCurrentUserData(firebaseUser);
  if (!userData) return false;
  
  // Lógica simple: si tiene memberships, puede crear organizaciones
  return userData.memberships.length > 0;
}

/**
 * Limpia el cache del usuario
 */
export function clearUserCache() {
  cachedUser = null;
  cacheTimestamp = 0;
}