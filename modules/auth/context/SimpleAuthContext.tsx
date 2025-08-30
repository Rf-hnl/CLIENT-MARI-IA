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

export function SimpleAuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false); // Start as not loading

  async function register(email: string, password: string) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(result.user);
  }

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    await signOut(auth);
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
    console.log('Setting up simple auth listener');
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Simple auth state changed:', user?.email || 'No user');
      setCurrentUser(user);
      setLoading(false);
    });

    // Never block for more than 500ms
    const quickTimeout = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => {
      unsubscribe();
      clearTimeout(quickTimeout);
    };
  }, []);

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
      {children}
    </AuthContext.Provider>
  );
}