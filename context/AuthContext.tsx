import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { getCurrentUser, saveCurrentUser } from '@/utils/storage';
import { router } from 'expo-router';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (email: string, password: string, role: User['role']) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user from storage on startup
    const loadUser = async () => {
      try {
        const storedUser = await getCurrentUser();
        setUser(storedUser);
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Mock login function (in a real app, this would authenticate with a server)
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Check for permanent admin user
      if (email === 'sethh@tristate-bearing.com' && password === 'Knight_88@') {
        const adminUser: User = {
          id: 'admin-sethh',
          email: 'sethh@tristate-bearing.com',
          role: 'admin',
          createdAt: Date.now(),
        };
        
        // Save user to storage
        await saveCurrentUser(adminUser);
        setUser(adminUser);
        
        return true;
      }
      
      // Mock authentication for other users (replace with actual API call)
      if (password.length < 6) {
        return false;
      }
      
      // Create mock user
      const mockUser: User = {
        id: email,
        email,
        role: 'manager',
        createdAt: Date.now(),
      };
      
      // Save user to storage
      await saveCurrentUser(mockUser);
      setUser(mockUser);
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await saveCurrentUser(null);
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mock register function
  const register = async (
    email: string,
    password: string,
    role: User['role']
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Mock registration (replace with actual API call)
      if (password.length < 6) {
        return false;
      }
      
      // Create mock user
      const mockUser: User = {
        id: email,
        email,
        role,
        createdAt: Date.now(),
      };
      
      // Save user to storage
      await saveCurrentUser(mockUser);
      setUser(mockUser);
      
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}