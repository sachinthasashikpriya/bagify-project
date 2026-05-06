import { endpoints } from '../api/endpoints';
import { httpClient } from '../api/httpClient';
import { clearAuthToken, getAuthToken } from '../state/authToken';
import type {
  LoginRequest,
  RegisterRequest,
  Result,
  User,
} from '../types';
import { mockBuyers } from '../types/index';

type LoginResponse = { token: string; user: User };

const AUTH_FALLBACK_PREFIX = '/api/v1';

function toLegacyAuthPath(path: string): string {
  return path.startsWith(AUTH_FALLBACK_PREFIX)
    ? path.slice(AUTH_FALLBACK_PREFIX.length)
    : path;
}

function shouldTryLegacyAuthRoute<T>(result: Result<T>): boolean {
  return (
    !result.ok &&
    (result.status === 403 || result.status === 404 || result.status === 405)
  );
}

class AuthService {
  
  
async register(payload: RegisterRequest): Promise<Result<User>> {
  const primaryResult = await httpClient.post<User>(endpoints.auth.register, payload, {
    service: 'auth-service',      
    auth: false,          
    retry: { attempts: 0, backoffMs: 0 }, 
  });

  if (!shouldTryLegacyAuthRoute(primaryResult)) {
    return primaryResult;
  }

  const legacyPath = toLegacyAuthPath(endpoints.auth.register);
  if (legacyPath === endpoints.auth.register) {
    return primaryResult;
  }

  return httpClient.post<User>(legacyPath, payload, {
    service: 'auth-service',
    auth: false,
    retry: { attempts: 0, backoffMs: 0 },
  });
}


async login(
  payload: LoginRequest
): Promise<Result<{ token: string; user: User }>> {
  const primaryResult = await httpClient.post<LoginResponse>(endpoints.auth.login, payload, {
    service: 'auth-service',  
    auth: false,
    retry: { attempts: 0, backoffMs: 0 },
  });

  if (!shouldTryLegacyAuthRoute(primaryResult)) {
    return primaryResult;
  }

  const legacyPath = toLegacyAuthPath(endpoints.auth.login);
  if (legacyPath === endpoints.auth.login) {
    return primaryResult;
  }

  return httpClient.post<LoginResponse>(legacyPath, payload, {
    service: 'auth-service',
    auth: false,
    retry: { attempts: 0, backoffMs: 0 },
  });
}


  /**
   * Get current user profile (mock implementation)
   */
  async getCurrentUser(): Promise<Result<User>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // For demo, return the first buyer
      return {
        ok: true,
        data: mockBuyers[0],
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return {
        ok: false,
        error: 'Failed to get current user',
      };
    }
  }

  /**
   * Logout user
   */
  logout(): void {
    clearAuthToken();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!getAuthToken();
  }
}

export const authService = new AuthService();