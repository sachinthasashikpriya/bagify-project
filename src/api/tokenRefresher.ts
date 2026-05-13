import { endpoints } from './endpoints';
import { serviceRegistry } from './serviceRegistry';
import { 
  getRefreshToken, 
  setAuthToken, 
  setRefreshToken, 
  onUnauthorized 
} from '../state/authToken';

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

/**
 * Subscribe to token refresh events
 */
function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

/**
 * Notify all subscribers when token is refreshed
 */
function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

/**
 * Attempt to refresh the access token using the refresh token.
 * Handles multiple concurrent 401s by queuing requests.
 */
export async function refreshAccessToken(): Promise<string | null> {
  const currentRefreshToken = getRefreshToken();
  
  if (!currentRefreshToken) {
    console.warn('No refresh token found, logging out');
    onUnauthorized();
    return null;
  }

  // If already refreshing, wait for the result
  if (isRefreshing) {
    return new Promise((resolve) => {
      subscribeTokenRefresh((token) => {
        resolve(token);
      });
    });
  }

  isRefreshing = true;

  try {
    const authServiceUrl = serviceRegistry['auth-service'];
    const response = await fetch(`${authServiceUrl}${endpoints.auth.refresh}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: currentRefreshToken }),
    });

    if (!response.ok) {
      console.error('Refresh token expired or invalid');
      onUnauthorized();
      return null;
    }

    const payload = await response.json();
    
    // Support both direct object and { data: ... } wrapper
    const data = payload.data || payload;
    const { token, refreshToken: newRefreshToken } = data;

    if (token && newRefreshToken) {
      setAuthToken(token);
      setRefreshToken(newRefreshToken);
      onRefreshed(token);
      return token;
    }

    console.error('Invalid token refresh response format');
    onUnauthorized();
    return null;
  } catch (error) {
    console.error('Token refresh network error:', error);
    onUnauthorized();
    return null;
  } finally {
    isRefreshing = false;
  }
}
