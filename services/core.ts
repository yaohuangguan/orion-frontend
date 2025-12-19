
import { toast } from '../components/Toast';

export const API_BASE_URL = 'https://bananaboom-api-242273127238.asia-east1.run.app/api';

/**
 * Native fetch wrapper with error handling, timeouts, and auth headers
 */
export async function fetchClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  // Increased timeout to 15s to handle potential Cloud Run cold starts
  const id = setTimeout(() => controller.abort(), 15000); 

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Inject token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      (headers as any)['x-auth-token'] = token;
    }

    // Inject Google Auth if available
    const googleInfo = localStorage.getItem('googleInfo');
    if (googleInfo) {
      (headers as any)['x-google-auth'] = googleInfo;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers,
    });
    clearTimeout(id);

    // Handle Auth Errors (Token Expired) -> 401
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('googleInfo');
      window.dispatchEvent(new Event('auth:logout'));
      toast.error('Session expired. Please login again.');
      throw new Error('Session expired. Please login again.');
    }

    // Handle Forbidden (VIP Only) -> 403
    if (response.status === 403) {
      toast.error('VIP Access Required.');
      // Do NOT logout, just throw error to be caught by caller
      throw new Error('Forbidden: VIP Access Required.');
    }

    // Handle Standard Errors (4xx, 5xx)
    if (!response.ok) {
      const errorBody = await response.text();
      let msg = `API Error ${response.status}`;
      
      // Try to parse JSON error if possible
      try {
        const errorJson = JSON.parse(errorBody);
        msg = errorJson.message || errorJson.msg || msg;
        
        // Handle specific "token not the same" error
        if (msg.includes('token') || msg.includes('expired')) {
           localStorage.removeItem('auth_token');
           localStorage.removeItem('googleInfo');
           window.dispatchEvent(new Event('auth:logout'));
        }
      } catch (e) {
        msg = errorBody || msg;
      }
      
      // Global Toast Notification for Errors
      toast.error(msg);
      throw new Error(msg);
    }

    // Handle 204 No Content (often used for DELETE)
    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error: any) {
    clearTimeout(id);
    // Identify abort errors specifically
    if (error.name === 'AbortError') {
      const msg = 'Request timed out. The server might be waking up.';
      toast.error(msg);
      throw new Error(msg);
    }
    // If it's a network error (not a response error which is handled above)
    if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
       toast.error('Network connection error.');
    }
    throw error;
  }
}
