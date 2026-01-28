import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth.service';
import type { User } from '../types';

// ✅ Global state to persist user across components
let globalUser: User | null = null;
const listeners: Set<(user: User | null) => void> = new Set();

function notifyListeners(user: User | null) {
  globalUser = user;
  listeners.forEach(listener => listener(user));
}

// ✅ Initialize from localStorage on app load
function initializeFromStorage(): User | null {
  const token = localStorage.getItem('authToken');
  const storedUser = localStorage.getItem('currentUser');
  
  if (token && storedUser) {
    try {
      return JSON.parse(storedUser);
    } catch {
      return null;
    }
  }
  return null;
}

// Initialize global user from storage
if (!globalUser) {
  globalUser = initializeFromStorage();
}

export function useAuth() {
  const [currentUser, setCurrentUserState] = useState<User | null>(globalUser);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Subscribe to user changes
    const listener = (user: User | null) => {
      setCurrentUserState(user);
    };
    listeners.add(listener);

    // Sync with global state
    if (globalUser !== currentUser) {
      setCurrentUserState(globalUser);
    }

    return () => {
      listeners.delete(listener);
    };
  }, []);

  // ✅ Set current user (called after login)
  const setCurrentUser = useCallback((user: User | null) => {
    console.log('🔐 useAuth: Setting current user:', user?.email);
    
    if (user) {
      // Store in localStorage for persistence
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
    
    notifyListeners(user);
  }, []);

  // ✅ Check auth from token
  const checkAuth = useCallback(async () => {
    console.log('🔍 useAuth: Checking authentication...');
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        console.log('❌ useAuth: No token found');
        setCurrentUser(null);
        return;
      }

      // Try to get user from localStorage first
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          console.log('✅ useAuth: User loaded from storage:', user.email);
          notifyListeners(user);
          return;
        } catch {
          // Invalid stored user, continue to fetch from API
        }
      }

      // Fetch from API
      const result = await authService.getCurrentUser();
      
      if (result.ok && result.data) {
        console.log('✅ useAuth: User loaded from API:', result.data.email);
        setCurrentUser(result.data);
      } else {
        console.log('❌ useAuth: Failed to get user from API');
        setCurrentUser(null);
        authService.logout();
      }
    } catch (error) {
      console.error('💥 useAuth: Auth check error:', error);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [setCurrentUser]);

  // ✅ Logout
  const logout = useCallback(() => {
    console.log('🚪 useAuth: Logging out...');
    authService.logout();
    localStorage.removeItem('currentUser');
    notifyListeners(null);
  }, []);

  const isAuthenticated = !!currentUser;

  return {
    currentUser,
    setCurrentUser, // ✅ Export this for LoginPage
    isAuthenticated,
    isLoading,
    logout,
    checkAuth,
  };
}