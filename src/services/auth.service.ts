// src/services/auth.service.ts
import { httpClient } from '../api/httpClient';
import { clearAuthToken, setAuthToken } from '../state/authToken';
import { endpoints } from '../api/endpoints';
import type {
  LoginRequest,
  RegisterRequest,
  Result,
  User,
} from '../types';
import { mockBuyers, mockSellers } from '../types/index';

// Mock admin user
const mockAdmin: User = {
  id: 'admin1',
  name: 'Admin User',
  email: 'admin@bagify.com',
  type: 'admin',
  phone: '+1 (555) 000-0000',
  address: 'Admin Office, Bagify HQ',
};

class AuthService {
  
  
async register(payload: RegisterRequest): Promise<Result<User>> {
  // Choose the right service key based on your registry:
  // - If register is under Auth service, use service: 'auth'
  // - If it's under Users service, use service: 'users'
  return httpClient.post<User>(endpoints.auth.register, payload, {
    service: 'auth-service',       // <-- change to 'users' if needed
    auth: false,           // registration is public
    retry: { attempts: 0, backoffMs: 0 }, // usually no retry for register
  });
}




  /**
   * Login user (mock implementation)
   */
  async login(payload: LoginRequest): Promise<Result<{ token: string; user: User }>> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Check credentials against mock data
      const allUsers = [...mockBuyers, ...mockSellers, mockAdmin];
      const foundUser = allUsers.find(user => 
        user.email.toLowerCase() === payload.email.toLowerCase()
      );

      // For demo, accept "password123" for all users
      if (foundUser && payload.password === "password123") {
        const token = `demo_token_${foundUser.id}_${Date.now()}`;
        setAuthToken(token);

        return {
          ok: true,
          data: { token, user: foundUser },
          message: 'Login successful',
        };
      }

      return {
        ok: false,
        error: 'Invalid credentials',
        message: 'Please check your email and password. Use "password123" for demo.',
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        ok: false,
        error: 'Login failed',
        message: 'An unexpected error occurred',
      };
    }
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