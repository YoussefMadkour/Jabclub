'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from '@/lib/axios';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from session on mount
  const refreshUser = async () => {
    try {
      const response = await axios.get('/auth/me');
      
      if (response.data.success && response.data.data.user) {
        setUser(response.data.data.user);
      } else {
        setUser(null);
      }
    } catch (error: any) {
      // Silently handle - user not logged in
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUser()
      .catch(() => {
        // Ignore errors during initial load
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('/auth/login', { email, password });
      
      if (response.data.success && response.data.data.user) {
        setUser(response.data.data.user);
      } else {
        throw new Error('Login failed');
      }
    } catch (error: any) {
      throw error.response?.data?.error?.message || error.message || 'Login failed';
    }
  };

  const signup = async (data: SignupData) => {
    try {
      const response = await axios.post('/auth/signup', data);
      
      if (response.data.success && response.data.data.user) {
        setUser(response.data.data.user);
      } else {
        throw new Error('Signup failed');
      }
    } catch (error: any) {
      throw error.response?.data?.error?.message || error.message || 'Signup failed';
    }
  };

  const logout = async () => {
    try {
      await axios.post('/auth/logout');
    } catch (error) {
      // Ignore logout errors
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
