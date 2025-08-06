import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { getCurrentUser, saveCurrentUser } from '@/utils/storage';
import { AUTHORIZED_USERS } from '@/constants/users';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, role: User['role']) => Promise<boolean>;
  logout: () => Promise<void>;
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

  // Login function using hardcoded authorized users
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log('Attempting login for:', email);
      
      // Find user in authorized users list
      const authorizedUser = AUTHORIZED_USERS.find(
        user => user.email === email && user.password === password
      );
      
      if (!authorizedUser) {
        console.log('Login failed: invalid credentials');
        return false;
      }
      
      // Create user object
      const user: User = {
        id: authorizedUser.email,
        email: authorizedUser.email,
        role: authorizedUser.role,
        createdAt: Date.now(),
      };
      
      // Save user to storage
      await saveCurrentUser(user);
      setUser(user);
      console.log('Login successful');
      
      // Don't navigate here, let the index.tsx handle navigation
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, role: User['role']): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log('Attempting registration for:', email);
      
      // Check if user already exists
      const existingUser = AUTHORIZED_USERS.find(user => user.email === email);
      if (existingUser) {
        console.log('Registration failed: user already exists');
        return false;
      }
      
      // For demo purposes, we'll just create a user object and save it
      // In a real app, you'd send this to your backend
      const user: User = {
        id: email,
        email: email,
        role: role,
        createdAt: Date.now(),
      };
      
      // Save user to storage
      await saveCurrentUser(user);
      setUser(user);
      console.log('Registration successful');
      
      // Don't navigate here, let the index.tsx handle navigation
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
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
      console.log('User logged out');
      
      // Don't navigate here, let the index.tsx handle navigation
    } catch (error) {
      console.error('Logout failed:', error);
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
        register,
        logout,
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