import { useEffect, useState, useCallback, type ReactNode } from "react";
import type { User } from "../types";
import { AuthContext } from "./AuthContext";
import type { AuthContextType } from "./AuthContext";
import { authService } from "../services/authservice";
import { LoadingSpinner } from "../components/common/LoadingSpinner";

const USER_STORAGE_KEY = "auth_user";
const TOKEN_STORAGE_KEY = "auth_token";
const REFRESH_TOKEN_STORAGE_KEY = "refresh_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
        const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
        
        if (storedToken && storedRefreshToken) {
          setToken(storedToken);
          setRefreshToken(storedRefreshToken);
          // Refresh user data from backend
          const result = await authService.getCurrentUser();
          if (result.ok && result.data) {
            setCurrentUser(result.data);
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(result.data));
          } else {
            // If token is invalid or user not found, logout
            console.warn("Session invalid, logging out");
            logout();
          }
        } else {
          // No token, ensure state is clear
          setCurrentUser(null);
          setToken(null);
          setRefreshToken(null);
        }
      } catch (error) {
        console.error("Failed to restore user session:", error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (user: User, authToken: string, authRefreshToken: string) => {
    setCurrentUser(user);
    setToken(authToken);
    setRefreshToken(authRefreshToken);
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(TOKEN_STORAGE_KEY, authToken);
      localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, authRefreshToken);
    } catch (error) {
      console.error("Failed to save user to localStorage:", error);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setToken(null); 
    setRefreshToken(null);
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
      
    } catch (error) {
      console.error("Failed to remove user from localStorage:", error);
    }
  };

  

  // ✅ Update user function - updates profile including image
  const updateUser = useCallback((updatedUser: User) => {
    console.log('🔐 Updating user:', updatedUser.email);
    if (updatedUser.profileImage) {
      console.log('🔐 New profile image:', updatedUser.profileImage);
    }
    setCurrentUser(updatedUser);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
  }, []);

  const checkAuth = useCallback(async () => {
    console.log('🔐 Checking auth...');
    try {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
      
      if (storedUser && storedToken && storedRefreshToken) {
        setCurrentUser(JSON.parse(storedUser));
        setToken(storedToken);
        setRefreshToken(storedRefreshToken);
      } else {
        setCurrentUser(null);
        setToken(null);
        setRefreshToken(null);
      }
    } catch (error) {
      console.error("Failed to check auth:", error);
      setCurrentUser(null);
      setToken(null);
      setRefreshToken(null);
    }
  }, []);

  // ✅ Context value
  const contextValue: AuthContextType = {
    currentUser,
    token,
    refreshToken,
    isLoading,
    login,
    logout,
    updateUser,
    checkAuth,
    isAuthenticated: !!currentUser && !!token,
  };

  // Optional: Show loading state while checking auth
  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
