/**
 * Company Settings & Workshop Profile REST API Client
 */

import { httpClient } from './httpClient';
import { ENDPOINTS } from './endpoints';
import { CompanySettings } from '../../types';
import { ApiResponse, ApiRequestOptions } from './types';

export const settingsApi = {
  /**
   * Get workshop profile and configuration
   */
  async getSettings(options?: ApiRequestOptions): Promise<CompanySettings> {
    const res = await httpClient.get<CompanySettings | ApiResponse<CompanySettings>>(
      ENDPOINTS.SETTINGS.COMPANY,
      options
    );
    return (res && typeof res === 'object' && 'data' in res) 
      ? (res as ApiResponse<CompanySettings>).data 
      : (res as CompanySettings);
  },

  /**
   * Save workshop profile and configuration
   */
  async updateSettings(settings: Partial<CompanySettings>, options?: ApiRequestOptions): Promise<CompanySettings> {
    const res = await httpClient.put<CompanySettings | ApiResponse<CompanySettings>>(
      ENDPOINTS.SETTINGS.COMPANY,
      settings,
      options
    );
    return (res && typeof res === 'object' && 'data' in res) 
      ? (res as ApiResponse<CompanySettings>).data 
      : (res as CompanySettings);
  },
};
