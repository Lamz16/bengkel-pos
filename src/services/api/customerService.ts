/**
 * Customers & Vehicles REST API Client
 */

import { httpClient } from './httpClient';
import { ENDPOINTS } from './endpoints';
import { Customer, Vehicle } from '../../types';
import { ApiResponse, ApiRequestOptions } from './types';

export const customerApi = {
  /**
   * Get all customers (with search support)
   */
  async getAll(search?: string, options?: ApiRequestOptions): Promise<Customer[]> {
    const res = await httpClient.get<Customer[] | ApiResponse<Customer[]>>(
      ENDPOINTS.CUSTOMERS.LIST,
      { ...options, params: search ? { search } : undefined }
    );
    if (res && typeof res === 'object' && 'data' in res && Array.isArray(res.data)) {
      return res.data;
    }
    return Array.isArray(res) ? res : [];
  },

  /**
   * Get customer by ID
   */
  async getById(id: string, options?: ApiRequestOptions): Promise<Customer> {
    const res = await httpClient.get<Customer | ApiResponse<Customer>>(
      ENDPOINTS.CUSTOMERS.DETAIL(id),
      options
    );
    return (res && typeof res === 'object' && 'data' in res) ? (res as ApiResponse<Customer>).data : (res as Customer);
  },

  /**
   * Create new customer
   */
  async create(customer: Partial<Customer>, options?: ApiRequestOptions): Promise<Customer> {
    const res = await httpClient.post<Customer | ApiResponse<Customer>>(
      ENDPOINTS.CUSTOMERS.CREATE,
      customer,
      options
    );
    return (res && typeof res === 'object' && 'data' in res) ? (res as ApiResponse<Customer>).data : (res as Customer);
  },

  /**
   * Update customer
   */
  async update(id: string, customer: Partial<Customer>, options?: ApiRequestOptions): Promise<Customer> {
    const res = await httpClient.put<Customer | ApiResponse<Customer>>(
      ENDPOINTS.CUSTOMERS.UPDATE(id),
      customer,
      options
    );
    return (res && typeof res === 'object' && 'data' in res) ? (res as ApiResponse<Customer>).data : (res as Customer);
  },

  /**
   * Delete customer
   */
  async delete(id: string, options?: ApiRequestOptions): Promise<{ success: boolean }> {
    return await httpClient.delete<{ success: boolean }>(
      ENDPOINTS.CUSTOMERS.DELETE(id),
      options
    );
  },

  /**
   * Get customer's registered vehicles
   */
  async getVehicles(customerId: string, options?: ApiRequestOptions): Promise<Vehicle[]> {
    const res = await httpClient.get<Vehicle[] | ApiResponse<Vehicle[]>>(
      ENDPOINTS.CUSTOMERS.VEHICLES(customerId),
      options
    );
    if (res && typeof res === 'object' && 'data' in res && Array.isArray(res.data)) {
      return res.data;
    }
    return Array.isArray(res) ? res : [];
  },

  /**
   * Register new vehicle
   */
  async createVehicle(vehicle: Partial<Vehicle>, options?: ApiRequestOptions): Promise<Vehicle> {
    const res = await httpClient.post<Vehicle | ApiResponse<Vehicle>>(
      ENDPOINTS.VEHICLES.CREATE,
      vehicle,
      options
    );
    return (res && typeof res === 'object' && 'data' in res) ? (res as ApiResponse<Vehicle>).data : (res as Vehicle);
  },

  /**
   * Delete vehicle
   */
  async deleteVehicle(id: string, options?: ApiRequestOptions): Promise<{ success: boolean }> {
    return await httpClient.delete<{ success: boolean }>(
      ENDPOINTS.VEHICLES.DELETE(id),
      options
    );
  },
};
