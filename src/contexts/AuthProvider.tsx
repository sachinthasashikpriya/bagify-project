import { useEffect, useState, useCallback, type ReactNode } from "react";
import type { User } from "../types";
import { AuthContext } from "./AuthContext";
import type { AuthContextType } from "./AuthContext";
import { authService } from "../services/authservice";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { getAuthToken, setAuthToken, clearAuthToken } from "../state/authToken";
import { attemptTokenRefresh, registerLogout } from "../api/tokenRefresher";
import { toast } from "sonner";

const USER_STORAGE_KEY = "auth_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Attempt silent refresh using cookies
        const refreshSuccess = await attemptTokenRefresh();
        
        if (refreshSuccess) {
          const result = await authService.getCurrentUser();
          if (result.ok && result.data) {
            setToken(getAuthToken());
            setCurrentUser(result.data);
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(result.data));
          } else {
            console.warn("Failed to get current user profile after refresh");
            logout();
          }
        } else {
          logout();
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

  const login = (user: User, authToken: string, _authRefreshToken?: string | null) => {
    setCurrentUser(user);
    setToken(authToken);
    setAuthToken(authToken);
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } catch (error) {
      console.error("Failed to save user to localStorage:", error);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setToken(null); 
    clearAuthToken();
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
      authService.logout().catch(error => {
        console.error("Failed backend logout request:", error);
      });
    } catch (error) {
      console.error("Failed to remove user from localStorage:", error);
    }
  };

  // Register logout callback for silent token refresher
  registerLogout(logout);

  // ✅ Update user function - updates profile including image
  const updateUser = useCallback((updatedUser: User) => {
    console.log('🔐 Updating user:', updatedUser.email);
    if (updatedUser.profileImage) {
      console.log('🔐 New profile image:', updatedUser.profileImage);
    }
    setCurrentUser(updatedUser);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
  }, []);

  // SSE connection for real-time seller verification updates
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'SELLER' || !token) {
      return;
    }

    const sseUrl = `/api/v1/users/verifications/stream?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.addEventListener("verification-update", async (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("🔔 SSE Verification update received:", data);
        
        // Fetch fresh profile details from the backend to update AuthContext fully
        const result = await authService.getCurrentUser();
        if (result.ok && result.data) {
          updateUser(result.data);
          toast.success(`Your profile verification has been updated to ${data.status}!`);
        }
      } catch (err) {
        console.error("Failed to handle verification update event:", err);
      }
    });

    eventSource.onerror = (err) => {
      console.warn("SSE connection error, browser will retry...", err);
    };

    return () => {
      eventSource.close();
    };
  }, [currentUser?.id, token, updateUser]);

  const checkAuth = useCallback(async () => {
    console.log('🔐 Checking auth...');
    try {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      const currentToken = getAuthToken();
      
      if (storedUser && currentToken) {
        setCurrentUser(JSON.parse(storedUser));
        setToken(currentToken);
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
    refreshToken: null,
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
