/**
 * Unified REST API Module Export
 * Provides convenient, structured access to all domain API services and configurations.
 */

// Configuration & Token Managers
export * from './config';

// Endpoints Dictionary
export * from './endpoints';

// HTTP Client & Error Handling
export * from './httpClient';

// Request/Response Types
export * from './types';

// Domain Services
export * from './serviceOrderService';
export * from './inventoryService';
export * from './mechanicService';
export * from './customerService';
export * from './supplierService';
export * from './expenseService';
export * from './reportService';
export * from './authService';
export * from './settingsService';
export * from './healthService';

// Consolidated API Object
import { serviceOrderApi } from './serviceOrderService';
import { inventoryApi } from './inventoryService';
import { mechanicApi } from './mechanicService';
import { customerApi } from './customerService';
import { supplierApi } from './supplierService';
import { expenseApi } from './expenseService';
import { reportApi } from './reportService';
import { authApi } from './authService';
import { settingsApi } from './settingsService';
import { healthApi } from './healthService';
import { httpClient } from './httpClient';
import { getApiBaseUrl, setApiBaseUrl, resetApiBaseUrl, getAuthToken, setAuthToken, removeAuthToken } from './config';
import { ENDPOINTS } from './endpoints';

export const api = {
  services: serviceOrderApi,
  inventory: inventoryApi,
  mechanics: mechanicApi,
  customers: customerApi,
  suppliers: supplierApi,
  expenses: expenseApi,
  reports: reportApi,
  auth: authApi,
  settings: settingsApi,
  health: healthApi,
  http: httpClient,
  endpoints: ENDPOINTS,
  config: {
    getBaseUrl: getApiBaseUrl,
    setBaseUrl: setApiBaseUrl,
    resetBaseUrl: resetApiBaseUrl,
    getToken: getAuthToken,
    setToken: setAuthToken,
    removeToken: removeAuthToken,
  },
};

export default api;
