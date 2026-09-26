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

const BASE_URL = API_BASE_URL.replace('/auth', '');

export const warehouseApi = {
  async getAll(token: string) {
    try {
      const res = await fetch(`${BASE_URL}/warehouses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await handleResponse(res);
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },
  async getById(id: string | number, token: string) {
    try {
      const res = await fetch(`${BASE_URL}/warehouses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await handleResponse(res);
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },
  async create(payload: { name: string; location_address?: string }, token: string) {
    try {
      const res = await fetch(`${BASE_URL}/warehouses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      return await handleResponse(res);
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },
  async update(id: string | number, payload: { name?: string; location_address?: string }, token: string) {
    try {
      const res = await fetch(`${BASE_URL}/warehouses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      return await handleResponse(res);
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },
  async delete(id: string | number, token: string) {
    try {
      const res = await fetch(`${BASE_URL}/warehouses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      return await handleResponse(res);
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }
};

export const locationApi = {
  async getByWarehouse(warehouseId: string | number, token: string) {
    try {
      const res = await fetch(`${BASE_URL}/locations/warehouse/${warehouseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await handleResponse(res);
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },
  async create(warehouseId: string | number, payload: { name: string; type?: string }, token: string) {
    try {
      const res = await fetch(`${BASE_URL}/locations/warehouse/${warehouseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      return await handleResponse(res);
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },
  async update(id: string | number, payload: { name?: string; type?: string }, token: string) {
    try {
      const res = await fetch(`${BASE_URL}/locations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      return await handleResponse(res);
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },
  async delete(id: string | number, token: string) {
    try {
      const res = await fetch(`${BASE_URL}/locations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      return await handleResponse(res);
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }
};

export const categoryApi = {
  async getAll(token: string) {
    try {
      const res = await fetch(`${BASE_URL}/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await handleResponse(res);
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },
  async create(payload: { name: string; description?: string }, token: string) {
    try {
      const res = await fetch(`${BASE_URL}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      return await handleResponse(res);
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },
  async update(id: string | number, payload: { name?: string; description?: string }, token: string) {
    try {
      const res = await fetch(`${BASE_URL}/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      return await handleResponse(res);
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },
  async delete(id: string | number, token: string) {
    try {
      const res = await fetch(`${BASE_URL}/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      return await handleResponse(res);
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }
};

export const productApi = {
  async getAll(token: string) {
    try {
      const res = await fetch(`${BASE_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await handleResponse(res);
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },
  async getById(id: string | number, token: string) {
    try {
      const res = await fetch(`${BASE_URL}/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await handleResponse(res);
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },
  async create(payload: { name: string; sku: string; category_id?: number | null; uom?: string; reorder_level?: number }, token: string) {
    try {
      const res = await fetch(`${BASE_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      return await handleResponse(res);
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },
  async update(id: string | number, payload: { name?: string; sku?: string; category_id?: number | null; uom?: string; reorder_level?: number }, token: string) {
    try {
      const res = await fetch(`${BASE_URL}/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      return await handleResponse(res);
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },
  async delete(id: string | number, token: string) {
    try {
      const res = await fetch(`${BASE_URL}/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      return await handleResponse(res);
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }
};

export const stockApi = {
  async getSummary(token: string) {
    try {
      const res = await fetch(`${BASE_URL}/stock/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await handleResponse(res);
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },
  async getByProduct(productId: string | number, token: string) {
    try {
      const res = await fetch(`${BASE_URL}/stock/product/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await handleResponse(res);
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },
  async getByWarehouse(warehouseId: string | number, token: string) {
    try {
      const res = await fetch(`${BASE_URL}/stock/warehouse/${warehouseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await handleResponse(res);
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },
  async getLedger(token: string) {
    try {
      const res = await fetch(`${BASE_URL}/stock/ledger`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await handleResponse(res);
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },
  async performOperation(payload: { 
    type: string; 
    productId: number; 
    quantity: number;
    sourceWarehouseId?: number;
    sourceLocationId?: number;
    destWarehouseId?: number;
    destLocationId?: number;
    reference?: string;
  }, token: string) {
    try {
      const res = await fetch(`${BASE_URL}/stock/operation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      return await handleResponse(res);
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },
  async performAdjustment(payload: {
    productId: number;
    warehouseId: number;
    locationId?: number;
    difference: number;
    reference?: string;
  }, token: string) {
    try {
      const res = await fetch(`${BASE_URL}/stock/adjustment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      return await handleResponse(res);
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }
};
