import { supabase } from './supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const jwt = session?.access_token;

    const headers = new Headers(options.headers);
    if (jwt) {
      headers.set('Authorization', `Bearer ${jwt}`);
    }
    headers.set('Content-Type', 'application/json');

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Handle unauthorized - potentially trigger sign out or refresh
      await supabase.auth.signOut();
      return { data: null, error: 'Unauthorized' };
    }

    const result = await response.json();
    
    if (!response.ok) {
      const errorMessage = typeof result.error === 'object' ? result.error.message : (result.error || 'Request failed');
      return { data: null, error: errorMessage };
    }

    // If result is { data, error }, return as is (ApiResponse matches this structure)
    if (result && typeof result === 'object' && ('data' in result)) {
      return { data: result.data, error: result.error };
    }

    return { data: result, error: null };
  } catch (error) {
    console.error('API Request Error:', error);
    const message = error instanceof Error ? error.message : 'Network error';
    return { data: null, error: message };
  }
}

export const api = {
  get: <T>(path: string, options?: RequestInit) => 
    apiRequest<T>(path, { ...options, method: 'GET' }),
  
  post: <T>(path: string, body: Record<string, unknown>, options?: RequestInit) => 
    apiRequest<T>(path, { 
      ...options, 
      method: 'POST', 
      body: JSON.stringify(body) 
    }),
  
  patch: <T>(path: string, body: Record<string, unknown>, options?: RequestInit) => 
    apiRequest<T>(path, { 
      ...options, 
      method: 'PATCH', 
      body: JSON.stringify(body) 
    }),
  
  delete: <T>(path: string, options?: RequestInit) => 
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
};
