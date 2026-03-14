import { useEffect, useState, useCallback, type ReactNode } from "react";
import type { User } from "../types";
import { AuthContext } from "./AuthContext";
import type { AuthContextType } from "./AuthContext";

const USER_STORAGE_KEY = "auth_user";
const TOKEN_STORAGE_KEY = "auth_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);  // ✅ Add token state
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);  // ✅ Load token
      
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
      if (storedToken) {
        setToken(storedToken);
      }
    } catch (error) {
      console.error("Failed to restore user session:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (user: User, authToken: string) => {
    setCurrentUser(user);
    setToken(authToken);
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(TOKEN_STORAGE_KEY, authToken);
    } catch (error) {
      console.error("Failed to save user to localStorage:", error);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setToken(null); 
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      
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
      
      if (storedUser && storedToken) {
        setCurrentUser(JSON.parse(storedUser));
        setToken(storedToken);
      } else {
        setCurrentUser(null);
        setToken(null);
      }
    } catch (error) {
      console.error("Failed to check auth:", error);
      setCurrentUser(null);
      setToken(null);
    }
  }, []);

  // ✅ Context value
  const contextValue: AuthContextType = {
    currentUser,
    token,
    isLoading,
    login,
    logout,
    updateUser,
    checkAuth,
    isAuthenticated: !!currentUser && !!token,
  };

  // Optional: Show loading state while checking auth
  if (isLoading) {
    return <div>Loading...</div>; // Or your loading component
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
