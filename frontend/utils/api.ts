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
      // First get the response as text
      const responseText = await response.text();
      
      // Try to parse as JSON
      try {
        const errorData = JSON.parse(responseText);
        // If we have an error property, use that as the message
        const errorMessage = errorData.error || response.statusText || 'Request failed';
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        (error as any).data = errorData;
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          url,
          errorData
        });
        throw error;
      } catch (jsonError) {
        // If JSON parsing fails, use the raw text as the error message
        const errorMessage = responseText || `Request failed with status ${response.status}`;
        console.error('API Error (raw text):', {
          status: response.status,
          statusText: response.statusText,
          url,
          responseText
        });
        throw new Error(errorMessage);
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