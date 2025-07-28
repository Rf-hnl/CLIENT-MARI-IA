'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useGlobalStateInitializer } from '@/hooks/useGlobalState';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  googleSignIn: () => Promise<void>;
  resendVerification: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { initializeFromUser, clearGlobalState } = useGlobalStateInitializer();

  async function register(email: string, password: string) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(result.user);
  }

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    await signOut(auth);
    // Clear global state when logging out
    clearGlobalState();
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
  }

  async function googleSignIn() {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }

  async function resendVerification() {
    if (currentUser) {
      await sendEmailVerification(currentUser);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Initialize global state when user logs in
        try {
          await initializeFromUser(user);
        } catch (error) {
          console.error('Error initializing global state:', error);
          // You might want to handle this error more gracefully
        }
      } else {
        // Clear global state when user logs out
        clearGlobalState();
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, [initializeFromUser, clearGlobalState]);

  const value = {
    currentUser,
    login,
    register,
    logout,
    resetPassword,
    googleSignIn,
    resendVerification,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}