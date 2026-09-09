/**
 * Mechanics, Commissions & Payroll REST API Client
 */

import { httpClient } from './httpClient';
import { ENDPOINTS } from './endpoints';
import { Mechanic, MechanicDeduction } from '../../types';
import { ApiResponse, ApiRequestOptions } from './types';

export interface MechanicPayrollSummary {
  mechanicId: string;
  mechanicName: string;
  baseSalary: number;
  totalCommissions: number;
  totalDeductions: number;
  netSalary: number;
  completedJobsCount: number;
}

export const mechanicApi = {
  /**
   * Get all registered mechanics
   */
  async getAll(options?: ApiRequestOptions): Promise<Mechanic[]> {
    const res = await httpClient.get<Mechanic[] | ApiResponse<Mechanic[]>>(
      ENDPOINTS.MECHANICS.LIST,
      options
    );
    if (res && typeof res === 'object' && 'data' in res && Array.isArray(res.data)) {
      return res.data;
    }
    return Array.isArray(res) ? res : [];
  },

  /**
   * Get mechanic by ID
   */
  async getById(id: string, options?: ApiRequestOptions): Promise<Mechanic> {
    const res = await httpClient.get<Mechanic | ApiResponse<Mechanic>>(
      ENDPOINTS.MECHANICS.DETAIL(id),
      options
    );
    return (res && typeof res === 'object' && 'data' in res) ? (res as ApiResponse<Mechanic>).data : (res as Mechanic);
  },

  /**
   * Register new mechanic
   */
  async create(mechanic: Partial<Mechanic>, options?: ApiRequestOptions): Promise<Mechanic> {
    const res = await httpClient.post<Mechanic | ApiResponse<Mechanic>>(
      ENDPOINTS.MECHANICS.CREATE,
      mechanic,
      options
    );
    return (res && typeof res === 'object' && 'data' in res) ? (res as ApiResponse<Mechanic>).data : (res as Mechanic);
  },

  /**
   * Update mechanic profile / salary rate / bonus rate
   */
  async update(id: string, mechanic: Partial<Mechanic>, options?: ApiRequestOptions): Promise<Mechanic> {
    const res = await httpClient.put<Mechanic | ApiResponse<Mechanic>>(
      ENDPOINTS.MECHANICS.UPDATE(id),
      mechanic,
      options
    );
    return (res && typeof res === 'object' && 'data' in res) ? (res as ApiResponse<Mechanic>).data : (res as Mechanic);
  },

  /**
   * Delete mechanic
   */
  async delete(id: string, options?: ApiRequestOptions): Promise<{ success: boolean }> {
    return await httpClient.delete<{ success: boolean }>(
      ENDPOINTS.MECHANICS.DELETE(id),
      options
    );
  },

  /**
   * Get deductions/penalties (all or filtered by mechanicId)
   */
  async getDeductions(mechanicId?: string, options?: ApiRequestOptions): Promise<MechanicDeduction[]> {
    const endpoint = mechanicId ? ENDPOINTS.MECHANICS.DEDUCTIONS(mechanicId) : ENDPOINTS.MECHANICS.ALL_DEDUCTIONS;
    const res = await httpClient.get<MechanicDeduction[] | ApiResponse<MechanicDeduction[]>>(endpoint, options);
    if (res && typeof res === 'object' && 'data' in res && Array.isArray(res.data)) {
      return res.data;
    }
    return Array.isArray(res) ? res : [];
  },

  /**
   * Add penalty/deduction for absent or warranty claim
   */
  async addDeduction(deduction: Partial<MechanicDeduction>, options?: ApiRequestOptions): Promise<MechanicDeduction> {
    const res = await httpClient.post<MechanicDeduction | ApiResponse<MechanicDeduction>>(
      ENDPOINTS.MECHANICS.ALL_DEDUCTIONS,
      deduction,
      options
    );
    return (res && typeof res === 'object' && 'data' in res) ? (res as ApiResponse<MechanicDeduction>).data : (res as MechanicDeduction);
  },

  /**
   * Cancel/delete deduction record
   */
  async deleteDeduction(id: string, options?: ApiRequestOptions): Promise<{ success: boolean }> {
    return await httpClient.delete<{ success: boolean }>(
      ENDPOINTS.MECHANICS.DELETE_DEDUCTION(id),
      options
    );
  },

  /**
   * Get aggregated payroll summary
   */
  async getPayrollSummary(params?: { month?: string; year?: number }, options?: ApiRequestOptions): Promise<MechanicPayrollSummary[]> {
    const res = await httpClient.get<MechanicPayrollSummary[] | ApiResponse<MechanicPayrollSummary[]>>(
      ENDPOINTS.MECHANICS.PAYROLL_SUMMARY,
      { ...options, params: params as any }
    );
    if (res && typeof res === 'object' && 'data' in res && Array.isArray(res.data)) {
      return res.data;
    }
    return Array.isArray(res) ? res : [];
  },
};
