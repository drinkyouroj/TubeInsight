// utils/api.ts
import { createClient } from '@/lib/supabase/client';

/**
 * Make an authenticated fetch request to the API
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @returns The response data
 * @throws Error if not authenticated or request fails
 */
export async function authFetch<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    'Authorization': `Bearer ${session.access_token}`
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include' // Important for cookies if using them
    });

    if (!response.ok) {
      // Try to parse as JSON first
      try {
        const errorData = await response.clone().json();
        const errorMessage = errorData.error || JSON.stringify(errorData);
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        (error as any).data = errorData;
        throw error;
      } catch (jsonError) {
        // If JSON parsing fails, get the raw text
        const errorText = await response.text();
        throw new Error(errorText || `Request failed with status ${response.status}`);
      }
    }

    // For empty responses (like 204 No Content)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return {} as T;
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}