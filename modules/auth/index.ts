// Auth Module Exports
export { AuthProvider, useAuth } from './context/AuthContext';
export { useAuth as useAuthHook } from './hooks/useAuth';
export { default as ProtectedRoute } from './components/ProtectedRoute';
export * from './types/auth';
export { auth } from '@/lib/firebase/client';