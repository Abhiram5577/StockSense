import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authApi, type User } from './api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'stocksense_auth_token';
const USER_KEY = 'stocksense_auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage on client-side mount
  useEffect(() => {
    async function initAuth() {
      try {
        if (typeof window === 'undefined') return;

        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);

        if (storedToken) {
          setToken(storedToken);
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
            } catch (e) {
              // Ignore JSON parse error, getMe will refresh it
            }
          }

          // Verify token validity with backend /api/auth/me
          const response = await authApi.getMe(storedToken);
          if (response.success && response.user) {
            setUser(response.user);
            localStorage.setItem(USER_KEY, JSON.stringify(response.user));
          } else {
            // Token expired or invalid
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            setToken(null);
            setUser(null);
          }
        }
      } catch (err) {
        console.error('[Auth Error] Failed to restore session:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    }
  };

  const logout = async () => {
    try {
      await authApi.logout(token);
    } catch (err) {
      console.warn('Error during server logout acknowledgment:', err);
    } finally {
      setToken(null);
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
  };

  const refreshUser = async () => {
    if (!token) return;
    const response = await authApi.getMe(token);
    if (response.success && response.user) {
      setUser(response.user);
      if (typeof window !== 'undefined') {
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      }
    }
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
