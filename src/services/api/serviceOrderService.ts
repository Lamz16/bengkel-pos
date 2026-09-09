/**
 * Service / SPK (Work Orders) API Client
 */

import { httpClient } from './httpClient';
import { ENDPOINTS } from './endpoints';
import { WorkshopService, ServiceStatus } from '../../types';
import { ApiResponse, ApiPaginatedResponse, ApiRequestOptions } from './types';

export interface ServiceQueryParams {
  status?: ServiceStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
  mechanicId?: string;
  page?: number;
  limit?: number;
}

export interface WarrantyClaimPayload {
  serviceId: string;
  reason: string;
  isAbsent: boolean;
  deductionAmount: number;
}

export const serviceOrderApi = {
  /**
   * Fetch all service orders with optional filtering
   */
  async getAll(params?: ServiceQueryParams, options?: ApiRequestOptions): Promise<WorkshopService[]> {
    const res = await httpClient.get<WorkshopService[] | ApiResponse<WorkshopService[]> | ApiPaginatedResponse<WorkshopService>>(
      ENDPOINTS.SERVICES.LIST,
      { ...options, params: params as any }
    );
    // Unwraps response if wrapped in { data: ... }
    if (res && typeof res === 'object' && 'data' in res && Array.isArray(res.data)) {
      return res.data;
    }
    return Array.isArray(res) ? res : [];
  },

  /**
   * Get single service detail
   */
  async getById(id: string, options?: ApiRequestOptions): Promise<WorkshopService> {
    const res = await httpClient.get<WorkshopService | ApiResponse<WorkshopService>>(
      ENDPOINTS.SERVICES.DETAIL(id),
      options
    );
    return (res && typeof res === 'object' && 'data' in res) ? (res as ApiResponse<WorkshopService>).data : (res as WorkshopService);
  },

  /**
   * Create new service order (POS Transaction)
   */
  async create(service: WorkshopService, options?: ApiRequestOptions): Promise<WorkshopService> {
    const res = await httpClient.post<WorkshopService | ApiResponse<WorkshopService>>(
      ENDPOINTS.SERVICES.CREATE,
      service,
      options
    );
    return (res && typeof res === 'object' && 'data' in res) ? (res as ApiResponse<WorkshopService>).data : (res as WorkshopService);
  },

  /**
   * Update entire service order
   */
  async update(id: string, service: Partial<WorkshopService>, options?: ApiRequestOptions): Promise<WorkshopService> {
    const res = await httpClient.put<WorkshopService | ApiResponse<WorkshopService>>(
      ENDPOINTS.SERVICES.UPDATE(id),
      service,
      options
    );
    return (res && typeof res === 'object' && 'data' in res) ? (res as ApiResponse<WorkshopService>).data : (res as WorkshopService);
  },

  /**
   * Update work status (e.g. Queue -> In Progress -> Ready -> Done)
   */
  async updateStatus(id: string, status: ServiceStatus, options?: ApiRequestOptions): Promise<{ success: boolean; status: ServiceStatus }> {
    return await httpClient.patch<{ success: boolean; status: ServiceStatus }>(
      ENDPOINTS.SERVICES.UPDATE_STATUS(id),
      { status },
      options
    );
  },

  /**
   * Process a warranty claim on a previously serviced vehicle
   */
  async claimWarranty(claimData: WarrantyClaimPayload, options?: ApiRequestOptions): Promise<WorkshopService> {
    const res = await httpClient.post<WorkshopService | ApiResponse<WorkshopService>>(
      ENDPOINTS.SERVICES.WARRANTY_CLAIM(claimData.serviceId),
      claimData,
      options
    );
    return (res && typeof res === 'object' && 'data' in res) ? (res as ApiResponse<WorkshopService>).data : (res as WorkshopService);
  },

  /**
   * Delete or cancel service order
   */
  async delete(id: string, options?: ApiRequestOptions): Promise<{ success: boolean }> {
    return await httpClient.delete<{ success: boolean }>(
      ENDPOINTS.SERVICES.DELETE(id),
      options
    );
  },
};
