/**
 * Spare Parts & Inventory REST API Client
 */

import { httpClient } from './httpClient';
import { ENDPOINTS } from './endpoints';
import { SparePart } from '../../types';
import { ApiResponse, ApiRequestOptions } from './types';

export interface AddStockPayload {
  partId: string;
  quantity: number;
  supplierId: string;
  costPrice: number;
}

export const inventoryApi = {
  /**
   * Get all spare parts with stock levels
   */
  async getAll(search?: string, options?: ApiRequestOptions): Promise<SparePart[]> {
    const res = await httpClient.get<SparePart[] | ApiResponse<SparePart[]>>(
      ENDPOINTS.PARTS.LIST,
      { ...options, params: search ? { search } : undefined }
    );
    if (res && typeof res === 'object' && 'data' in res && Array.isArray(res.data)) {
      return res.data;
    }
    return Array.isArray(res) ? res : [];
  },

  /**
   * Get part by ID
   */
  async getById(id: string, options?: ApiRequestOptions): Promise<SparePart> {
    const res = await httpClient.get<SparePart | ApiResponse<SparePart>>(
      ENDPOINTS.PARTS.DETAIL(id),
      options
    );
    return (res && typeof res === 'object' && 'data' in res) ? (res as ApiResponse<SparePart>).data : (res as SparePart);
  },

  /**
   * Create new spare part
   */
  async create(part: Partial<SparePart>, options?: ApiRequestOptions): Promise<SparePart> {
    const res = await httpClient.post<SparePart | ApiResponse<SparePart>>(
      ENDPOINTS.PARTS.CREATE,
      part,
      options
    );
    return (res && typeof res === 'object' && 'data' in res) ? (res as ApiResponse<SparePart>).data : (res as SparePart);
  },

  /**
   * Update spare part info
   */
  async update(id: string, part: Partial<SparePart>, options?: ApiRequestOptions): Promise<SparePart> {
    const res = await httpClient.put<SparePart | ApiResponse<SparePart>>(
      ENDPOINTS.PARTS.UPDATE(id),
      part,
      options
    );
    return (res && typeof res === 'object' && 'data' in res) ? (res as ApiResponse<SparePart>).data : (res as SparePart);
  },

  /**
   * Delete spare part
   */
  async delete(id: string, options?: ApiRequestOptions): Promise<{ success: boolean }> {
    return await httpClient.delete<{ success: boolean }>(
      ENDPOINTS.PARTS.DELETE(id),
      options
    );
  },

  /**
   * Restock part / Purchase from supplier
   */
  async addStock(payload: AddStockPayload, options?: ApiRequestOptions): Promise<{ success: boolean; newStock: number }> {
    return await httpClient.post<{ success: boolean; newStock: number }>(
      ENDPOINTS.PARTS.ADD_STOCK(payload.partId),
      payload,
      options
    );
  },

  /**
   * Get low stock warnings
   */
  async getLowStockAlerts(options?: ApiRequestOptions): Promise<SparePart[]> {
    const res = await httpClient.get<SparePart[] | ApiResponse<SparePart[]>>(
      ENDPOINTS.PARTS.LOW_STOCK_ALERTS,
      options
    );
    if (res && typeof res === 'object' && 'data' in res && Array.isArray(res.data)) {
      return res.data;
    }
    return Array.isArray(res) ? res : [];
  },
};
