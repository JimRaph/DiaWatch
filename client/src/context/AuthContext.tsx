"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { api } from "../util/api";
import { useRouter } from "next/navigation";

interface AuthContextType {
  isAuthenticated: boolean | null;
  isLoading: boolean;
  login: (u: string, p: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (u: string, p: string, linkGuest: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // CRITICAL FIX: Initialize to null (unknown) to prevent hydration mismatch
  // localStorage is checked in useEffect after mount
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Check localStorage only after mount (client-side only)
  useEffect(() => {
    setMounted(true);
    const hasSessionFlag = localStorage.getItem("dw_auth");

    if (!hasSessionFlag) {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    // Verify session with server
    const verifyAuth = async () => {
      try {
        // console.log("verify auth")
        const success = await api.refreshToken();
        setIsAuthenticated(success);
        if (!success) {
          // console.log("not success")
          localStorage.removeItem("dw_auth");
        }
      } catch {
        // console.log("catch auth")
        setIsAuthenticated(false);
        localStorage.removeItem("dw_auth");
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, []);

  // Session expired handler (for 401 responses from api.ts interceptor)
  const handleSessionExpired = useCallback(() => {
    setIsAuthenticated(false);
    setIsLoading(false);
    localStorage.removeItem("dw_auth");
    sessionStorage.removeItem("pending_analysis");
    sessionStorage.removeItem("diawatch_last_prediction");
    api.clearAuth();
  }, []);

  useEffect(() => {
    window.addEventListener("auth:session_expired", handleSessionExpired);
    return () => {
      window.removeEventListener("auth:session_expired", handleSessionExpired);
    };
  }, [handleSessionExpired]);

  const login = async (username: string, password: string) => {
    try {
      await api.login(username, password);
      setIsAuthenticated(true);
      setIsLoading(false);
    } catch (error) {
      setIsAuthenticated(false);
      setIsLoading(false);
      throw error; // Re-throw so components can catch and show error
    }
  };

  const register = async (
    email: string,
    password: string,
    linkGuest: boolean
  ) => {
    try {
      await api.register(email, password, linkGuest);
      setIsAuthenticated(true);
      setIsLoading(false);
    } catch (error) {
      setIsAuthenticated(false);
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      // Always clear state even if API fails
      setIsAuthenticated(false);
      setIsLoading(false);
      router.push("/");
    }
  };

  // Prevent hydration mismatch by not rendering children until mounted
  // This ensures server and client initial render match
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isLoading, login, logout, register }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
