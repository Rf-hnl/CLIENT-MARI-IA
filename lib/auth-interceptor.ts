// Auth interceptor to add token to requests
export function addAuthHeader(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  
  if (token) {
    return {
      'Authorization': `Bearer ${token}`,
    };
  }
  
  return {};
}

// Custom fetch with auth header
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const authHeaders = addAuthHeader();
  
  const mergedOptions: RequestInit = {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
  };
  
  return fetch(url, mergedOptions);
}