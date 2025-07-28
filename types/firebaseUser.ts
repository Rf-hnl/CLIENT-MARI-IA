import { User } from 'firebase/auth';

// Tipado extendido basado en Firebase Admin SDK UserRecord
export interface FirebaseUserRecord {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  disabled: boolean;
  metadata: {
    creationTime: string;
    lastSignInTime: string;
    lastRefreshTime?: string;
  };
  providerData: Array<{
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    providerId: string;
    phoneNumber: string | null;
  }>;
  customClaims?: Record<string, string | number | boolean | null>;
  tokensValidAfterTime?: string;
}

// Campos actualizables del perfil
export interface ProfileUpdateData {
  displayName?: string | null;
  photoURL?: string | null;
  phoneNumber?: string | null;
  disabled?: boolean;
}

// Datos del formulario de perfil (solo campos editables)
export interface ProfileFormData {
  displayName: string;
  photoURL?: string | null;
}

// Tipo de compatibilidad (alias para FirebaseUserRecord)
export type UserProfile = FirebaseUserRecord;

// Resultado de actualización
export interface ProfileUpdateResult {
  success: boolean;
  message: string;
  updatedFields?: string[];
  error?: string;
  updatedProfile?: FirebaseUserRecord;
}

// Convertir Firebase Auth User a nuestro tipo extendido
export function createFirebaseUserRecord(user: User): FirebaseUserRecord {
  return {
    uid: user.uid,
    email: user.email,
    emailVerified: user.emailVerified,
    displayName: user.displayName,
    photoURL: user.photoURL,
    phoneNumber: user.phoneNumber,
    disabled: false, // Firebase Auth User no tiene este campo, asumimos false
    metadata: {
      creationTime: user.metadata.creationTime || '',
      lastSignInTime: user.metadata.lastSignInTime || '',
      lastRefreshTime: undefined
    },
    providerData: user.providerData.map(provider => ({
      uid: provider.uid,
      displayName: provider.displayName,
      email: provider.email,
      photoURL: provider.photoURL,
      providerId: provider.providerId,
      phoneNumber: provider.phoneNumber
    })),
    customClaims: undefined,
    tokensValidAfterTime: undefined
  };
}

// Obtener el proveedor principal (primer proveedor)
export function getPrimaryProvider(user: FirebaseUserRecord): string {
  if (user.providerData.length > 0) {
    return user.providerData[0].providerId;
  }
  return 'unknown';
}

// Obtener información del proveedor formateada
export function getProviderInfo(providerId: string): { name: string; icon: string } {
  const providers: Record<string, { name: string; icon: string }> = {
    'google.com': { name: 'Google', icon: '🔍' },
    'facebook.com': { name: 'Facebook', icon: '📘' },
    'twitter.com': { name: 'Twitter', icon: '🐦' },
    'github.com': { name: 'GitHub', icon: '🐙' },
    'apple.com': { name: 'Apple', icon: '🍎' },
    'microsoft.com': { name: 'Microsoft', icon: '🏢' },
    'password': { name: 'Email/Contraseña', icon: '📧' },
    'phone': { name: 'Teléfono', icon: '📱' },
  };
  
  return providers[providerId] || { name: 'Desconocido', icon: '❓' };
}

// Crear datos de formulario desde FirebaseUserRecord
export function createFormDataFromFirebaseUser(user: FirebaseUserRecord): ProfileFormData {
  return {
    displayName: user.displayName || '',
    photoURL: user.photoURL || '',
  };
}

// Crear datos de formulario desde Firebase Auth User (para compatibilidad)
export function createFormDataFromProfile(user: User): ProfileFormData {
  return {
    displayName: user.displayName || '',
    photoURL: user.photoURL || '',
  };
}

// Función de compatibilidad - convierte User a UserProfile (alias de FirebaseUserRecord)
export function createUserProfileFromFirebaseUser(user: User): UserProfile {
  return createFirebaseUserRecord(user);
}