'use client';

import { useState, useEffect } from 'react';

export function useAuthToken() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getToken = () => {
      if (typeof window !== 'undefined') {
        const authToken = localStorage.getItem('auth_token');
        setToken(authToken);
      }
      setLoading(false);
    };

    getToken();

    // Listen for token changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token') {
        setToken(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return { token, loading };
}