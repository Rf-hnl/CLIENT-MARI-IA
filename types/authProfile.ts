import { User } from 'firebase/auth';

/**
 * ESTRUCTURA JERÁRQUICA DEL MODELO DE AUTENTICACIÓN Y PERFIL
 * 
 * COLECCIONES FIRESTORE:
 * 
 * users (colección principal)
 * ├── {uid: string} (documento usuario)
 * │   ├── profile: UserProfile {
 * │   │     uid: string
 * │   │     email: string | null
 * │   │     displayName: string | null
 * │   │     photoURL: string | null
 * │   │     emailVerified: boolean
 * │   │     creationTime: string | undefined
 * │   │     lastSignInTime: string | undefined
 * │   │   }
 * │   ├── settings: UserSettings {
 * │   │     theme: 'light' | 'dark'
 * │   │     language: string
 * │   │     notifications: boolean
 * │   │     privacy: 'public' | 'private'
 * │   │   }
 * │   ├── sessions (subcolección)
 * │   │   └── {sessionId: string}: SessionData {
 * │   │         sessionId: string
 * │   │         deviceInfo: string
 * │   │         ipAddress: string
 * │   │         loginTime: Timestamp
 * │   │         lastActivity: Timestamp
 * │   │         isActive: boolean
 * │   │       }
 * │   ├── activity (subcolección)
 * │   │   └── {activityId: string}: ActivityLog {
 * │   │         activityId: string
 * │   │         action: 'login' | 'logout' | 'profile_update' | 'password_change'
 * │   │         timestamp: Timestamp
 * │   │         metadata: Record<string, any>
 * │   │       }
 * │   └── preferences (subcolección)
 * │       └── {preferenceId: string}: UserPreference {
 * │             preferenceId: string
 * │             category: string
 * │             key: string
 * │             value: any
 * │             updatedAt: Timestamp
 * │           }
 * 
 * profiles (colección denormalizada - para búsquedas)
 * └── {uid: string}: PublicProfile {
 *       uid: string
 *       displayName: string | null
 *       photoURL: string | null
 *       isPublic: boolean
 *       lastSeen: Timestamp
 *     }
 * 
 * FLUJO DE DATOS:
 * Firebase Auth User → UserProfile → Firestore /users/{uid}/profile
 *                  ↓
 * ProfileFormData (formularios) → ProfileUpdateResult
 * 
 * INTEGRACIÓN EXTERNA:
 * Cloudinary → CloudinaryUploadResult → photoURL en UserProfile
 */

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  creationTime: string | undefined;
  lastSignInTime: string | undefined;
}

export interface ProfileFormData {
  displayName: string;
  photoURL?: string | null;
}

export interface ProfileUpdateResult {
  success: boolean;
  message: string;
  updatedProfile?: UserProfile;
}

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  original_filename: string;
  format: string;
  resource_type: string;
  created_at: string;
}

export interface CloudinaryError {
  error: {
    message: string;
    http_code: number;
  };
}

export const createUserProfileFromFirebaseUser = (user: User): UserProfile => {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
    creationTime: user.metadata.creationTime,
    lastSignInTime: user.metadata.lastSignInTime,
  };
};

export const createFormDataFromProfile = (profile: UserProfile): ProfileFormData => {
  return {
    displayName: profile.displayName || '',
    photoURL: profile.photoURL || '',
  };
};