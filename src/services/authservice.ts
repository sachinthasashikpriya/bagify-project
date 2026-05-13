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

type LoginResponse = { token: string; refreshToken: string; user: User };

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
): Promise<Result<LoginResponse>> {
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
   * Get current user profile from backend
   */
  async getCurrentUser(): Promise<Result<User>> {
    try {
      const result = await httpClient.get<any>(endpoints.users.me, {
        service: 'auth-service',
        auth: true,
      });

      if (result.ok && result.data) {
        // Map backend User (profileImageUrl) to frontend User (profileImage)
        const mappedUser: User = {
          ...result.data,
          profileImage: result.data.profileImageUrl,
          // Convert numeric id to string if necessary (frontend type expects string)
          id: result.data.id.toString(),
        };
        return { ...result, data: mappedUser };
      }

      return result as Result<User>;
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
   * Send forgot password email
   */
  async forgotPassword(email: string): Promise<Result<string>> {
    return httpClient.post<string>(endpoints.auth.forgotPassword, { email }, {
      service: 'auth-service',
      auth: false,
    });
  }

  /**
   * Reset password with token
   */
  async resetPassword(payload: any): Promise<Result<string>> {
    return httpClient.post<string>(endpoints.auth.resetPassword, payload, {
      service: 'auth-service',
      auth: false,
    });
  }
}

export const authService = new AuthService();