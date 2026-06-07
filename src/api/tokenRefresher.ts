import { endpoints } from './endpoints';
import { serviceRegistry } from './serviceRegistry';
import { toast } from 'sonner';
import { setAuthToken, clearAuthToken } from '../state/authToken';

let logoutFn: (() => void) | null = null;

/**
 * Register the logout function from AuthContext to allow triggering
 * a graceful React-level logout state change on session expiration.
 */
export function registerLogout(fn: () => void) {
  logoutFn = fn;
}

let refreshPromise: Promise<boolean> | null = null;

/**
 * Attempt to refresh the access token using the stored refresh token.
 * Prevents concurrent redundant HTTP requests by caching/re-using the in-progress promise.
 */
export async function attemptTokenRefresh(): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const authServiceUrl = serviceRegistry['auth-service'];
      const response = await fetch(`${authServiceUrl}${endpoints.auth.refresh}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Token refresh endpoint responded with status ${response.status}`);
      }

      const payload = await response.json();
      const data = payload.data || payload;
      const { token: newAccessToken } = data;

      if (newAccessToken) {
        setAuthToken(newAccessToken);
        return true;
      }

      throw new Error('Invalid token response format from server');
    } catch (error) {
      console.error('Silent token refresh failed:', error);
      
      const wasLoggedIn = !!localStorage.getItem('auth_user');
      
      // Clear auth tokens and user session details
      clearAuthToken();
      localStorage.removeItem('auth_user');

      if (logoutFn) {
        try {
          logoutFn();
        } catch (logoutError) {
          console.error('Error invoking registered logout function:', logoutError);
        }
      }
      
      if (wasLoggedIn) {
        toast.error('Your session has expired. Please log in again.');
      }
      return false;
    }
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}
