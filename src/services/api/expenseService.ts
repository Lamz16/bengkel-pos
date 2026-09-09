/**
 * Operational Expenses REST API Client
 */

import { httpClient } from './httpClient';
import { ENDPOINTS } from './endpoints';
import { Expense } from '../../types';
import { ApiResponse, ApiRequestOptions } from './types';

export const expenseApi = {
  /**
   * Get all expenses (supports filtering by month/year/category)
   */
  async getAll(params?: { category?: string; startDate?: string; endDate?: string }, options?: ApiRequestOptions): Promise<Expense[]> {
    const res = await httpClient.get<Expense[] | ApiResponse<Expense[]>>(
      ENDPOINTS.EXPENSES.LIST,
      { ...options, params: params as any }
    );
    if (res && typeof res === 'object' && 'data' in res && Array.isArray(res.data)) {
      return res.data;
    }
    return Array.isArray(res) ? res : [];
  },

  /**
   * Log new expense
   */
  async create(expense: Partial<Expense>, options?: ApiRequestOptions): Promise<Expense> {
    const res = await httpClient.post<Expense | ApiResponse<Expense>>(
      ENDPOINTS.EXPENSES.CREATE,
      expense,
      options
    );
    return (res && typeof res === 'object' && 'data' in res) ? (res as ApiResponse<Expense>).data : (res as Expense);
  },

  /**
   * Delete expense
   */
  async delete(id: string, options?: ApiRequestOptions): Promise<{ success: boolean }> {
    return await httpClient.delete<{ success: boolean }>(
      ENDPOINTS.EXPENSES.DELETE(id),
      options
    );
  },
};
