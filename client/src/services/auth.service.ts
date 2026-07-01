import api from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

export interface AuthPayload {
  token: string;
  user: User;
}

interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

/**
 * Authentication Service.
 * Manages queries to the backend auth controller endpoints.
 */
export const authService = {
  /**
   * Register a new account.
   */
  register: async (name: string, email: string, password: string): Promise<AuthPayload> => {
    const response = await api.post<ApiResponse<AuthPayload>>('/auth/register', {
      name,
      email,
      password,
    });
    return response.data.data;
  },

  /**
   * Log into an existing account.
   */
  login: async (email: string, password: string): Promise<AuthPayload> => {
    const response = await api.post<ApiResponse<AuthPayload>>('/auth/login', {
      email,
      password,
    });
    return response.data.data;
  },

  /**
   * Fetch current session profile info using active token.
   */
  getMe: async (): Promise<{ user: User }> => {
    const response = await api.get<ApiResponse<{ user: User }>>('/auth/me');
    return response.data.data;
  },

  /**
   * Update user profile (name & email).
   */
  updateProfile: async (data: { name?: string; email?: string }): Promise<User> => {
    const response = await api.put<ApiResponse<{ user: User }>>('/user/profile', data);
    return response.data.data.user;
  },

  /**
   * Change user password.
   */
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.put('/user/password', { currentPassword, newPassword });
  },

  /**
   * Permanently delete user account and all data.
   */
  deleteAccount: async (): Promise<void> => {
    await api.delete('/user/account');
  },
};

export default authService;

