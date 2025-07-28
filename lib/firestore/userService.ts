// Firestore User Service
// Handles user queries, UID verification, and synchronization

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  collection,
  where,
  getDocs,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import {
  FirestoreUser,
  CreateFirestoreUserData,
  UpdateFirestoreUserData,
  CombinedUserData,
  UidVerificationResult,
  UserUpdateResult,
  UserEditFormData,
  verifyUidMatching,
  createFirestoreUserFromAuth,
  createUpdateDataFromForm,
} from '@/types/firestoreUser';
import { FirebaseUserRecord } from '@/types/firebaseUser';
import { safeToISOString } from '@/utils/dateFormat';

// Collection reference
const USERS_COLLECTION = 'users';

// Query user by email
export async function queryUserByEmail(email: string): Promise<FirestoreUser | null> {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    // Get the first matching document (there should only be one per email)
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    
    return {
      ...data,
      // Convert Firestore timestamps back to Timestamp objects
      createdAt: data.createdAt || Timestamp.now(),
      updatedAt: data.updatedAt || Timestamp.now(),
      lastActivity: data.lastActivity || Timestamp.now(),
      lastLoginAt: data.lastLoginAt || null,
      organizationMemberships: data.organizationMemberships?.map((membership: any) => ({
        ...membership,
        joinedAt: membership.joinedAt || Timestamp.now(),
        lastActivity: membership.lastActivity || Timestamp.now(),
      })) || [],
      tenant_memberships: Object.fromEntries(
        Object.entries(data.tenant_memberships || {}).map(([key, value]: [string, any]) => [
          key,
          {
            ...value,
            joinedAt: value.joinedAt || Timestamp.now(),
          },
        ])
      ),
    } as FirestoreUser;
  } catch (error) {
    console.error('Error querying user by email:', error);
    throw new Error('Failed to query user by email');
  }
}

// Get user by document ID (UID)
export async function getUserByUid(uid: string): Promise<FirestoreUser | null> {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return null;
    }
    
    const data = userDoc.data();
    return {
      ...data,
      createdAt: data.createdAt || Timestamp.now(),
      updatedAt: data.updatedAt || Timestamp.now(),
      lastActivity: data.lastActivity || Timestamp.now(),
      lastLoginAt: data.lastLoginAt || null,
      organizationMemberships: data.organizationMemberships?.map((membership: any) => ({
        ...membership,
        joinedAt: membership.joinedAt || Timestamp.now(),
        lastActivity: membership.lastActivity || Timestamp.now(),
      })) || [],
      tenant_memberships: Object.fromEntries(
        Object.entries(data.tenant_memberships || {}).map(([key, value]: [string, any]) => [
          key,
          {
            ...value,
            joinedAt: value.joinedAt || Timestamp.now(),
          },
        ])
      ),
    } as FirestoreUser;
  } catch (error) {
    console.error('Error getting user by UID:', error);
    throw new Error('Failed to get user by UID');
  }
}

// Create new user in Firestore
export async function createFirestoreUser(
  userData: CreateFirestoreUserData
): Promise<FirestoreUser> {
  try {
    const userRef = doc(db, USERS_COLLECTION, userData.uid);
    
    const firestoreData = {
      ...userData,
      profile: userData.profile || {
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phone: userData.phoneNumber || '',
        position: '',
        department: '',
        location: '',
        bio: '',
      },
      preferences: userData.preferences || {
        theme: 'system' as const,
        language: 'es',
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
      },
      organizations: [],
      organizationMemberships: [],
      tenant_memberships: {},
      role: userData.role || 'member',
      systemRole: userData.systemRole || 'user',
      totalOrganizations: 0,
      totalTenants: 0,
      currentTenantId: userData.currentTenantId || '',
      currentOrganizationId: userData.currentOrganizationId || '',
      lastLoginAt: null,
      lastActivity: serverTimestamp(),
      loginCount: 0,
      invitationSent: false,
      isActive: true,
      isOnline: false,
      profileCompleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      version: 1,
    };
    
    await setDoc(userRef, firestoreData);
    
    // Return the created user data with current timestamps
    return {
      ...firestoreData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      lastActivity: Timestamp.now(),
    } as FirestoreUser;
  } catch (error) {
    console.error('Error creating Firestore user:', error);
    throw new Error('Failed to create user in Firestore');
  }
}

// Update user in Firestore
export async function updateFirestoreUser(
  uid: string,
  updateData: UpdateFirestoreUserData
): Promise<FirestoreUser> {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    
    // Check if the document exists first
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.warn(`User document ${uid} does not exist. Creating it first.`);
      
      // Create basic user document with minimal data
      const createData: CreateFirestoreUserData = {
        uid,
        email: updateData.email || '',
        displayName: updateData.displayName || '',
        firstName: updateData.firstName || '',
        lastName: updateData.lastName || '',
        phoneNumber: updateData.phoneNumber || '',
        currentTenantId: updateData.currentTenantId || '',
        currentOrganizationId: updateData.currentOrganizationId || '',
      };
      
      // Create the user document first
      const createdUser = await createFirestoreUser(createData);
      
      // Now update with the additional data
      if (Object.keys(updateData).some(key => !['email', 'displayName', 'firstName', 'lastName', 'phoneNumber', 'currentTenantId', 'currentOrganizationId'].includes(key))) {
        const updatePayload = {
          ...updateData,
          updatedAt: serverTimestamp(),
        };
        
        await updateDoc(userRef, updatePayload);
        
        // Get the updated document
        const updatedUser = await getUserByUid(uid);
        if (!updatedUser) {
          throw new Error('Failed to retrieve updated user');
        }
        
        return updatedUser;
      }
      
      return createdUser;
    }
    
    const updatePayload = {
      ...updateData,
      updatedAt: serverTimestamp(),
    };
    
    await updateDoc(userRef, updatePayload);
    
    // Get the updated document
    const updatedUser = await getUserByUid(uid);
    if (!updatedUser) {
      throw new Error('Failed to retrieve updated user');
    }
    
    return updatedUser;
  } catch (error) {
    console.error('Error updating Firestore user:', error);
    
    // If it's a "No document to update" error, try to create the document
    if (error instanceof Error && error.message.includes('No document to update')) {
      console.warn(`Attempting to create missing user document for UID: ${uid}`);
      
      try {
        // Create basic user document
        const createData: CreateFirestoreUserData = {
          uid,
          email: updateData.email || '',
          displayName: updateData.displayName || '',
          firstName: updateData.firstName || '',
          lastName: updateData.lastName || '',
          phoneNumber: updateData.phoneNumber || '',
          currentTenantId: updateData.currentTenantId || '',
          currentOrganizationId: updateData.currentOrganizationId || '',
        };
        
        return await createFirestoreUser(createData);
      } catch (createError) {
        console.error('Failed to create user document:', createError);
        throw new Error('Failed to create or update user in Firestore');
      }
    }
    
    throw new Error('Failed to update user in Firestore');
  }
}

// Synchronize UID between Firebase Auth and Firestore
export async function synchronizeUserUid(
  firebaseAuthUid: string,
  firestoreUser: FirestoreUser
): Promise<FirestoreUser> {
  try {
    // Update the UID field in the Firestore document
    const updatedUser = await updateFirestoreUser(firebaseAuthUid, {
      uid: firebaseAuthUid,
      lastActivity: Timestamp.now(),
    });
    
    return updatedUser;
  } catch (error) {
    console.error('Error synchronizing user UID:', error);
    throw new Error('Failed to synchronize user UID');
  }
}

// Get combined user data (Firebase Auth + Firestore) with UID verification
export async function getCombinedUserData(
  firebaseAuthUser: FirebaseUserRecord
): Promise<CombinedUserData> {
  try {
    // First try to find user by email
    let firestoreUser = await queryUserByEmail(firebaseAuthUser.email || '');
    
    // If not found by email, try by UID
    if (!firestoreUser && firebaseAuthUser.uid) {
      firestoreUser = await getUserByUid(firebaseAuthUser.uid);
    }
    
    // Verify UID matching
    const uidVerification = verifyUidMatching(firebaseAuthUser.uid, firestoreUser);
    
    return {
      firebaseAuth: firebaseAuthUser,
      firestoreUser,
      uidVerification,
    };
  } catch (error) {
    console.error('Error getting combined user data:', error);
    throw new Error('Failed to get combined user data');
  }
}

// Create user in Firestore if not exists
export async function ensureFirestoreUser(
  firebaseAuthUser: FirebaseUserRecord
): Promise<FirestoreUser> {
  try {
    // Check if user already exists
    let firestoreUser = await queryUserByEmail(firebaseAuthUser.email || '');
    
    if (!firestoreUser) {
      // Create new user in Firestore
      const createData = createFirestoreUserFromAuth(firebaseAuthUser);
      firestoreUser = await createFirestoreUser(createData);
    } else {
      // Verify and sync UID if necessary
      const verification = verifyUidMatching(firebaseAuthUser.uid, firestoreUser);
      if (verification.requiresSync) {
        firestoreUser = await synchronizeUserUid(firebaseAuthUser.uid, firestoreUser);
      }
    }
    
    return firestoreUser;
  } catch (error) {
    console.error('Error ensuring Firestore user:', error);
    throw new Error('Failed to ensure user exists in Firestore');
  }
}

// Get user profile data for display (combining both sources)
export async function getUserProfileData(
  firebaseAuthUser: FirebaseUserRecord
): Promise<{
  combinedData: CombinedUserData;
  displayData: {
    uid: string;
    email: string;
    displayName: string;
    photoURL: string | null;
    emailVerified: boolean;
    isActive: boolean;
    lastActivity: string | null;
    organizations: string[];
    currentTenant: string;
    currentOrganization: string;
  };
}> {
  try {
    const combinedData = await getCombinedUserData(firebaseAuthUser);
    
    const displayData = {
      uid: firebaseAuthUser.uid,
      email: firebaseAuthUser.email || '',
      displayName: firebaseAuthUser.displayName || combinedData.firestoreUser?.displayName || '',
      photoURL: firebaseAuthUser.photoURL,
      emailVerified: firebaseAuthUser.emailVerified,
      isActive: combinedData.firestoreUser?.isActive ?? true,
      lastActivity: safeToISOString(combinedData.firestoreUser?.lastActivity) || null,
      organizations: combinedData.firestoreUser?.organizations || [],
      currentTenant: combinedData.firestoreUser?.currentTenantId || '',
      currentOrganization: combinedData.firestoreUser?.currentOrganizationId || '',
    };
    
    return {
      combinedData,
      displayData,
    };
  } catch (error) {
    console.error('Error getting user profile data:', error);
    throw new Error('Failed to get user profile data');
  }
}

// Update user data from form
export async function updateUserFromForm(
  uid: string,
  formData: UserEditFormData
): Promise<UserUpdateResult> {
  try {
    // Convert form data to update data
    const updateData = createUpdateDataFromForm(formData);
    
    // Update the user in Firestore
    const updatedUser = await updateFirestoreUser(uid, updateData);
    
    // Determine which fields were updated
    const updatedFields: string[] = [];
    Object.keys(updateData).forEach(key => {
      if (key !== 'updatedAt') {
        updatedFields.push(key);
      }
    });
    
    return {
      success: true,
      message: `Usuario actualizado exitosamente. Campos modificados: ${updatedFields.join(', ')}`,
      updatedFields,
      updatedUser,
    };
  } catch (error) {
    console.error('Error updating user from form:', error);
    return {
      success: false,
      message: 'Error al actualizar el usuario',
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}