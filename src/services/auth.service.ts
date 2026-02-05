// src/services/auth.service.ts
import { endpoints } from '../api/endpoints';
import { httpClient } from '../api/httpClient';
import { clearAuthToken } from '../state/authToken';
import type {
  LoginRequest,
  RegisterRequest,
  Result,
  User,
} from '../types';
import { mockBuyers } from '../types/index';

// Mock admin user
// const mockAdmin: User = {
//   id: 'admin1',
//   name: 'Admin User',
//   email: 'admin@bagify.com',
//   type: 'admin',
//   phone: '+1 (555) 000-0000',
//   address: 'Admin Office, Bagify HQ',
// };
type LoginResponse = { token: string; user: User };
class AuthService {
  
  
async register(payload: RegisterRequest): Promise<Result<User>> {
  
  return httpClient.post<User>(endpoints.auth.register, payload, {
    service: 'auth-service',      
    auth: false,          
    retry: { attempts: 0, backoffMs: 0 }, 
  });
}


async login(
  payload: LoginRequest
): Promise<Result<{ token: string; user: User }>> {
  return httpClient.post<LoginResponse>(endpoints.auth.login, payload, {
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
    // Check if token exists in storage
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    return !!token;
  }
}

export const authService = new AuthService();