/**
 * Reports & Financial Analytics REST API Client
 */

import { httpClient } from './httpClient';
import { ENDPOINTS } from './endpoints';
import { ApiResponse, ApiRequestOptions } from './types';

export interface ReportSummaryData {
  totalRevenue: number;
  totalExpenses: number;
  laborRevenue: number;
  partsRevenue: number;
  netProfit: number;
  totalTransactions: number;
  pendingServicesCount: number;
}

export interface ReportFilterParams {
  period?: 'day' | 'month' | 'year' | 'custom';
  date?: string;
  month?: string;
  year?: number;
  startDate?: string;
  endDate?: string;
}

export const reportApi = {
  /**
   * Get overall financial summary
   */
  async getSummary(params?: ReportFilterParams, options?: ApiRequestOptions): Promise<ReportSummaryData> {
    const res = await httpClient.get<ReportSummaryData | ApiResponse<ReportSummaryData>>(
      ENDPOINTS.REPORTS.SUMMARY,
      { ...options, params: params as any }
    );
    return (res && typeof res === 'object' && 'data' in res) ? (res as ApiResponse<ReportSummaryData>).data : (res as ReportSummaryData);
  },

  /**
   * Get revenue breakdown (services vs parts)
   */
  async getRevenue(params?: ReportFilterParams, options?: ApiRequestOptions): Promise<any> {
    return await httpClient.get<any>(
      ENDPOINTS.REPORTS.REVENUE,
      { ...options, params: params as any }
    );
  },

  /**
   * Get top performance breakdown by service type
   */
  async getPerformance(params?: ReportFilterParams, options?: ApiRequestOptions): Promise<any> {
    return await httpClient.get<any>(
      ENDPOINTS.REPORTS.MECHANIC_PERFORMANCE,
      { ...options, params: params as any }
    );
  },
};
