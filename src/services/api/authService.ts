/**
 * Authentication & Staff REST API Client
 */

import { httpClient } from './httpClient';
import { ENDPOINTS } from './endpoints';
import { User } from '../../types';
import { setAuthToken, removeAuthToken, getAuthToken } from './config';
import { ApiResponse, ApiRequestOptions } from './types';

export interface LoginCredentials {
  email?: string;
  username?: string;
  password?: string;
  phone?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
}

export const authApi = {
  /**
   * Log into backend REST API
   */
  async login(credentials: LoginCredentials, options?: ApiRequestOptions): Promise<AuthResponse> {
    const res = await httpClient.post<AuthResponse | ApiResponse<AuthResponse>>(
      ENDPOINTS.AUTH.LOGIN,
      credentials,
      { ...options, skipAuth: true }
    );

    const payload: AuthResponse = (res && typeof res === 'object' && 'data' in res) 
      ? (res as ApiResponse<AuthResponse>).data 
      : (res as AuthResponse);

    if (payload?.token) {
      setAuthToken(payload.token);
    }

    return payload;
  },

  /**
   * Logout user and revoke token
   */
  async logout(options?: ApiRequestOptions): Promise<void> {
    try {
      await httpClient.post(ENDPOINTS.AUTH.LOGOUT, {}, options);
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      removeAuthToken();
    }
  },

  /**
   * Fetch current authenticated user info
   */
  async getMe(options?: ApiRequestOptions): Promise<User | null> {
    if (!getAuthToken()) {
      return null;
    }
    const res = await httpClient.get<User | ApiResponse<User>>(
      ENDPOINTS.AUTH.ME,
      options
    );
    return (res && typeof res === 'object' && 'data' in res) ? (res as ApiResponse<User>).data : (res as User);
  },

  /**
   * Get all staff / users
   */
  async getStaff(options?: ApiRequestOptions): Promise<any[]> {
    const res = await httpClient.get<any[] | ApiResponse<any[]>>(
      ENDPOINTS.AUTH.STAFF,
      options
    );
    if (res && typeof res === 'object' && 'data' in res && Array.isArray(res.data)) {
      return res.data;
    }
    return Array.isArray(res) ? res : [];
  },

  /**
   * Create new staff / operator
   */
  async createStaff(staffData: any, options?: ApiRequestOptions): Promise<any> {
    const res = await httpClient.post<any | ApiResponse<any>>(
      ENDPOINTS.AUTH.STAFF,
      staffData,
      options
    );
    return (res && typeof res === 'object' && 'data' in res) ? (res as ApiResponse<any>).data : res;
  },

  /**
   * Update staff info
   */
  async updateStaff(id: string, staffData: any, options?: ApiRequestOptions): Promise<any> {
    const res = await httpClient.put<any | ApiResponse<any>>(
      ENDPOINTS.AUTH.STAFF_BY_ID(id),
      staffData,
      options
    );
    return (res && typeof res === 'object' && 'data' in res) ? (res as ApiResponse<any>).data : res;
  },

  /**
   * Delete staff
   */
  async deleteStaff(id: string, options?: ApiRequestOptions): Promise<{ success: boolean }> {
    return await httpClient.delete<{ success: boolean }>(
      ENDPOINTS.AUTH.STAFF_BY_ID(id),
      options
    );
  },
};
