/**
 * USER TYPES - POSTGRESQL VERSION
 * 
 * Tipos para usuarios sin dependencias de Firebase
 */

export interface User {
  id: string;
  email: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  emailVerified: boolean;
  role: 'ADMIN' | 'USER' | 'VIEWER';
  metadata: any;
  lastSignIn?: Date | null;
  signInCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  userId: string;
  displayName?: string;
  email: string;
  phoneNumber?: string;
  photoURL?: string;
  role: 'admin' | 'user' | 'viewer';
  status: 'active' | 'inactive' | 'pending';
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    notifications: boolean;
    emailUpdates: boolean;
  };
  metadata: {
    lastLogin?: Date;
    loginCount: number;
    ipAddress?: string;
    userAgent?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateUserProfileData {
  displayName?: string;
  phoneNumber?: string;
  photoURL?: string;
  preferences?: Partial<UserProfile['preferences']>;
}