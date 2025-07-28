import { User } from 'firebase/auth';

// Auth Context Types
export interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  googleSignIn: () => Promise<void>;
  resendVerification: () => Promise<void>;
  loading: boolean;
}

// Form Data Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordFormData {
  email: string;
}

// Auth State Types
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Auth Action Types
export interface AuthError {
  code: string;
  message: string;
}

// Helper Types
export interface UserMetadata {
  creationTime?: string;
  lastSignInTime?: string;
}