/**
 * Suppliers & Purchases REST API Client
 */

import { httpClient } from './httpClient';
import { ENDPOINTS } from './endpoints';
import { Supplier, PurchaseRecord } from '../../types';
import { ApiResponse, ApiRequestOptions } from './types';

export const supplierApi = {
  /**
   * Get all suppliers
   */
  async getAll(options?: ApiRequestOptions): Promise<Supplier[]> {
    const res = await httpClient.get<Supplier[] | ApiResponse<Supplier[]>>(
      ENDPOINTS.SUPPLIERS.LIST,
      options
    );
    if (res && typeof res === 'object' && 'data' in res && Array.isArray(res.data)) {
      return res.data;
    }
    return Array.isArray(res) ? res : [];
  },

  /**
   * Get supplier by ID
   */
  async getById(id: string, options?: ApiRequestOptions): Promise<Supplier> {
    const res = await httpClient.get<Supplier | ApiResponse<Supplier>>(
      ENDPOINTS.SUPPLIERS.DETAIL(id),
      options
    );
    return (res && typeof res === 'object' && 'data' in res) ? (res as ApiResponse<Supplier>).data : (res as Supplier);
  },

  /**
   * Create supplier
   */
  async create(supplier: Partial<Supplier>, options?: ApiRequestOptions): Promise<Supplier> {
    const res = await httpClient.post<Supplier | ApiResponse<Supplier>>(
      ENDPOINTS.SUPPLIERS.CREATE,
      supplier,
      options
    );
    return (res && typeof res === 'object' && 'data' in res) ? (res as ApiResponse<Supplier>).data : (res as Supplier);
  },

  /**
   * Update supplier
   */
  async update(id: string, supplier: Partial<Supplier>, options?: ApiRequestOptions): Promise<Supplier> {
    const res = await httpClient.put<Supplier | ApiResponse<Supplier>>(
      ENDPOINTS.SUPPLIERS.UPDATE(id),
      supplier,
      options
    );
    return (res && typeof res === 'object' && 'data' in res) ? (res as ApiResponse<Supplier>).data : (res as Supplier);
  },

  /**
   * Delete supplier
   */
  async delete(id: string, options?: ApiRequestOptions): Promise<{ success: boolean }> {
    return await httpClient.delete<{ success: boolean }>(
      ENDPOINTS.SUPPLIERS.DELETE(id),
      options
    );
  },

  /**
   * Get purchase records (restock transactions from suppliers)
   */
  async getPurchases(params?: { supplierId?: string; partId?: string }, options?: ApiRequestOptions): Promise<PurchaseRecord[]> {
    const res = await httpClient.get<PurchaseRecord[] | ApiResponse<PurchaseRecord[]>>(
      ENDPOINTS.PURCHASES.LIST,
      { ...options, params: params as any }
    );
    if (res && typeof res === 'object' && 'data' in res && Array.isArray(res.data)) {
      return res.data;
    }
    return Array.isArray(res) ? res : [];
  },

  /**
   * Record new supplier purchase transaction
   */
  async createPurchase(purchase: Partial<PurchaseRecord>, options?: ApiRequestOptions): Promise<PurchaseRecord> {
    const res = await httpClient.post<PurchaseRecord | ApiResponse<PurchaseRecord>>(
      ENDPOINTS.PURCHASES.CREATE,
      purchase,
      options
    );
    return (res && typeof res === 'object' && 'data' in res) ? (res as ApiResponse<PurchaseRecord>).data : (res as PurchaseRecord);
  },
};
