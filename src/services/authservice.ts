import { endpoints } from '../api/endpoints';
import { httpClient } from '../api/httpClient';
import { clearAuthToken } from '../state/authToken';
import type {
  LoginRequest,
  RegisterRequest,
  Result,
  User,
} from '../types';

interface BackendUser extends Omit<User, 'profileImage' | 'verification' | 'id'> {
  id?: string | number;
  profileImageUrl?: string;
  verificationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  businessName?: string;
  registrationNumber?: string;
  nicImageUrl?: string;
  brCertificateUrl?: string;
  rejectionReason?: string;
  submittedAt?: string;
}

interface BackendLoginResponse {
  token: string;
  refreshToken?: string | null;
  user: BackendUser;
}

type LoginResponse = { token: string; refreshToken?: string | null; user: User };

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

function mapBackendUserToFrontendUser(user: BackendUser): User {
  const mappedUser: User = {
    ...user,
    profileImage: user.profileImageUrl,
    id: user.id?.toString() || '',
  };

  if (user.role === 'SELLER' && user.verificationStatus) {
    mappedUser.verification = {
      status: user.verificationStatus,
      businessName: user.businessName || '',
      registrationNumber: user.registrationNumber || '',
      nicImageUrl: user.nicImageUrl,
      brCertificateUrl: user.brCertificateUrl,
      rejectionReason: user.rejectionReason,
      submittedAt: user.submittedAt,
    };
  }

  return mappedUser;
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
    const primaryResult = await httpClient.post<BackendLoginResponse>(endpoints.auth.login, payload, {
      service: 'auth-service',  
      auth: false,
      retry: { attempts: 0, backoffMs: 0 },
    });

    if (primaryResult.ok && primaryResult.data) {
      const user = primaryResult.data.user;
      const mappedUser = mapBackendUserToFrontendUser(user);
      return {
        ...primaryResult,
        data: {
          ...primaryResult.data,
          user: mappedUser,
        },
      };
    }

    if (!shouldTryLegacyAuthRoute(primaryResult)) {
      return { ok: primaryResult.ok, status: primaryResult.status, error: primaryResult.error };
    }

    const legacyPath = toLegacyAuthPath(endpoints.auth.login);
    if (legacyPath === endpoints.auth.login) {
      return { ok: primaryResult.ok, status: primaryResult.status, error: primaryResult.error };
    }

    const legacyResult = await httpClient.post<BackendLoginResponse>(legacyPath, payload, {
      service: 'auth-service',
      auth: false,
      retry: { attempts: 0, backoffMs: 0 },
    });

    if (legacyResult.ok && legacyResult.data) {
      const user = legacyResult.data.user;
      const mappedUser = mapBackendUserToFrontendUser(user);
      return {
        ...legacyResult,
        data: {
          ...legacyResult.data,
          user: mappedUser,
        },
      };
    }

    return { ok: legacyResult.ok, status: legacyResult.status, error: legacyResult.error };
  }


  /**
   * Get current user profile from backend
   */
  async getCurrentUser(): Promise<Result<User>> {
    try {
      const result = await httpClient.get<BackendUser>(endpoints.users.me, {
        service: 'auth-service',
        auth: true,
      });

      if (result.ok && result.data) {
        // Map backend User (profileImageUrl) to frontend User (profileImage)
        const mappedUser = mapBackendUserToFrontendUser(result.data);
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
  async logout(): Promise<Result<void>> {
    clearAuthToken();
    return httpClient.post<void>(endpoints.auth.logout, null, {
      service: 'auth-service',
      auth: false,
    });
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
  async resetPassword(payload: Record<string, string>): Promise<Result<string>> {
    return httpClient.post<string>(endpoints.auth.resetPassword, payload, {
      service: 'auth-service',
      auth: false,
    });
  }

  /**
   * Verify registration OTP
   */
  async verifyOtp(email: string, code: string): Promise<Result<LoginResponse>> {
    const payload = { email, code };
    const primaryResult = await httpClient.post<BackendLoginResponse>(endpoints.auth.verifyOtp, payload, {
      service: 'auth-service',
      auth: false,
      retry: { attempts: 0, backoffMs: 0 },
    });

    if (primaryResult.ok && primaryResult.data) {
      const user = primaryResult.data.user;
      const mappedUser = mapBackendUserToFrontendUser(user);
      return {
        ...primaryResult,
        data: {
          ...primaryResult.data,
          user: mappedUser,
        },
      };
    }

    if (!shouldTryLegacyAuthRoute(primaryResult)) {
      return { ok: primaryResult.ok, status: primaryResult.status, error: primaryResult.error };
    }

    const legacyPath = toLegacyAuthPath(endpoints.auth.verifyOtp);
    if (legacyPath === endpoints.auth.verifyOtp) {
      return { ok: primaryResult.ok, status: primaryResult.status, error: primaryResult.error };
    }

    const legacyResult = await httpClient.post<BackendLoginResponse>(legacyPath, payload, {
      service: 'auth-service',
      auth: false,
      retry: { attempts: 0, backoffMs: 0 },
    });

    if (legacyResult.ok && legacyResult.data) {
      const user = legacyResult.data.user;
      const mappedUser = mapBackendUserToFrontendUser(user);
      return {
        ...legacyResult,
        data: {
          ...legacyResult.data,
          user: mappedUser,
        },
      };
    }

    return { ok: legacyResult.ok, status: legacyResult.status, error: legacyResult.error };
  }
}

export const authService = new AuthService();