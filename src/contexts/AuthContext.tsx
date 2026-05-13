import { createContext } from 'react';
import type { User } from '../types';

export interface AuthContextType {
  currentUser: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  login: (user: User, token: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  isAuthenticated: boolean;
  checkAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);