'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { User } from '@/types/user';

// Define the shape of the JWT user object
interface JWTUser {
  id: string;
  email: string;
  tenantId: string;
  organizationId: string;
  roles: string[];
}

interface AuthContextType {
  user: JWTUser | null;
  currentUser: User | null; // Full user profile
  loading: boolean;
  logout: () => Promise<void>;
  setUserFromToken: (token: string) => void;
  updateProfile: (data: { displayName?: string; avatarUrl?: string; phone?: string }) => Promise<{ error?: string }>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// A helper function to decode JWT - simplistic, use a library for production for full validation
function decodeJwt(token: string): JWTUser | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const payload = JSON.parse(jsonPayload);
    
    // Check if token is expired
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      console.warn('🔍 [AUTH] Token is expired');
      return null;
    }
    
    // Debug: Log the JWT payload
    console.log('🔍 [AUTH] JWT Payload decoded:', {
      userId: payload.userId,
      email: payload.email,
      tenantId: payload.tenantId,
      organizationId: payload.organizationId,
      roles: payload.roles,
      exp: payload.exp ? new Date(payload.exp * 1000) : 'no expiry'
    });
    
    return {
      id: payload.userId,
      email: payload.email,
      tenantId: payload.tenantId,
      organizationId: payload.organizationId,
      roles: payload.roles,
    };
  } catch (error) {
    console.error("Failed to decode JWT", error);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<JWTUser | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Function to fetch full user profile
  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return null;

      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.user;
      }
    } catch (error) {
      console.error('❌ [AUTH] Error fetching user profile:', error);
    }
    return null;
  };

  // Function to refresh user profile
  const refreshUserProfile = async () => {
    if (user) {
      const profile = await fetchUserProfile(user.id);
      setCurrentUser(profile);
    }
  };

  // Function to update profile
  const updateProfile = async (data: { displayName?: string; avatarUrl?: string; phone?: string }) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        return { error: 'No autorizado' };
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setCurrentUser(result.user);
        return {};
      } else {
        return { error: result.error || 'Error al actualizar el perfil' };
      }
    } catch (error) {
      console.error('❌ [AUTH] Error updating profile:', error);
      return { error: 'Error de conexión' };
    }
  };

  useEffect(() => {
    console.log('🔐 AuthContext: Initializing with localStorage + cookie fallback...');
    
    // Try localStorage first (most reliable for client-side)
    const localToken = localStorage.getItem('auth_token');
    console.log('💾 localStorage auth_token:', localToken ? 'exists' : 'missing');
    
    // Fallback to cookie for middleware compatibility
    const cookieToken = Cookies.get('auth_token');
    console.log('🍪 Cookie auth_token:', cookieToken ? 'exists' : 'missing');
    
    const finalToken = localToken || cookieToken;
    console.log('🎯 FINAL TOKEN TO USE:', finalToken ? 'exists' : 'missing');
    
    if (finalToken) {
      console.log('🔍 Decoding JWT token...');
      const decodedUser = decodeJwt(finalToken);
      console.log('👤 Decoded user:', decodedUser);
      
      if (decodedUser) {
        setUser(decodedUser);
        
        // Sync localStorage and cookie
        if (localToken && !cookieToken) {
          console.log('🔄 Setting cookie from localStorage');
          Cookies.set('auth_token', localToken, { path: '/' });
        }
        if (cookieToken && !localToken) {
          console.log('🔄 Setting localStorage from cookie');
          localStorage.setItem('auth_token', cookieToken);
        }

        // Fetch full user profile
        fetchUserProfile(decodedUser.id).then((profile) => {
          setCurrentUser(profile);
        }).catch((error) => {
          console.error('❌ [AUTH] Failed to fetch user profile, but continuing with JWT user:', error);
          setCurrentUser(null);
        }).finally(() => {
          setLoading(false);
        });
      } else {
        console.log('❌ Invalid token, clearing auth state');
        localStorage.removeItem('auth_token');
        Cookies.remove('auth_token');
        setUser(null);
        setCurrentUser(null);
        setLoading(false);
      }
    } else {
      console.log('🔍 No token found, user not authenticated');
      setLoading(false);
    }
  }, []);

  const logout = async () => {
    console.log('🚪 Logging out...');
    
    // Clear tokens
    localStorage.removeItem('auth_token');
    Cookies.remove('auth_token');
    
    // Clear state
    setUser(null);
    setCurrentUser(null);
    
    // Call logout API if it exists
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.log('Note: logout API call failed, but local cleanup successful');
    }
    
    // Redirect to login
    router.push('/auth/login');
  };

  const setUserFromToken = (token: string) => {
    console.log('🔄 Setting user from new token');
    
    // Store token
    localStorage.setItem('auth_token', token);
    Cookies.set('auth_token', token, { path: '/' });
    
    // Decode and set user
    const decodedUser = decodeJwt(token);
    if (decodedUser) {
      setUser(decodedUser);
      
      // Fetch full profile
      fetchUserProfile(decodedUser.id).then((profile) => {
        setCurrentUser(profile);
      });
    }
  };

  const value: AuthContextType = {
    user,
    currentUser,
    loading,
    logout,
    setUserFromToken,
    updateProfile,
    refreshUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}