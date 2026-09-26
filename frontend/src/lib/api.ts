/**
 * StockSense API Client for Authentication Module
 */

const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  'http://localhost:5000/api/auth';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'staff' | string;
  created_at?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  token?: string;
  user?: User;
  resetToken?: string;
}

async function handleResponse<T>(res: Response): Promise<ApiResponse<T>> {
  try {
    const data = await res.json();
    return data;
  } catch (error) {
    if (!res.ok) {
      return {
        success: false,
        message: `HTTP Error ${res.status}: ${res.statusText}`,
      };
    }
    return {
      success: true,
      message: 'Request completed',
    };
  }
}

export const authApi = {
  /**
   * Register a new user
   */
  async register(payload: { name: string; email: string; password: string; role?: string }) {
    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await handleResponse(res);
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Network error connecting to backend server',
      };
    }
  },

  /**
   * Login user with email & password
   */
  async login(payload: { email: string; password: string }) {
    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await handleResponse(res);
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Network error connecting to backend server',
      };
    }
  },

  /**
   * Fetch current user profile with JWT token
   */
  async getMe(token: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      return await handleResponse(res);
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Network error connecting to backend server',
      };
    }
  },

  /**
   * Request password reset OTP
   */
  async forgotPassword(payload: { email: string }) {
    try {
      const res = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await handleResponse(res);
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Network error connecting to backend server',
      };
    }
  },

  /**
   * Verify password reset OTP
   */
  async verifyOtp(payload: { email: string; otp: string }) {
    try {
      const res = await fetch(`${API_BASE_URL}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await handleResponse(res);
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Network error connecting to backend server',
      };
    }
  },

  /**
   * Reset password using single-use reset authorization token
   */
  async resetPassword(payload: { resetToken: string; newPassword: string }) {
    try {
      const res = await fetch(`${API_BASE_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await handleResponse(res);
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Network error connecting to backend server',
      };
    }
  },

  /**
   * Logout user
   */
  async logout(token?: string | null) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        headers,
      });
      return await handleResponse(res);
    } catch (err: any) {
      return {
        success: true,
        message: 'Logged out locally',
      };
    }
  },
};
