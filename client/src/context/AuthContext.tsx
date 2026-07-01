import React, { createContext, useContext, useEffect, useState } from 'react';
import { type User, authService } from '../services/auth.service';
import toast from 'react-hot-toast';


interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check storage on boot to verify session integrity
  const checkSession = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const result = await authService.getMe();
      setUser(result.user);
    } catch (error) {
      console.warn('[Session Verify] Invalid token. Purging cache.');
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  // Login handler
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const payload = await authService.login(email, password);
      localStorage.setItem('token', payload.token);
      setUser(payload.user);
      toast.success(`Welcome back, ${payload.user.name}!`);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Login failed. Please check credentials.';
      toast.error(errorMsg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Registration handler
  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const payload = await authService.register(name, email, password);
      localStorage.setItem('token', payload.token);
      setUser(payload.user);
      toast.success(`Account created! Welcome, ${payload.user.name}`);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(errorMsg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast.success('Logged out successfully');
  };

  // Update user in context (used by Settings page)
  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
