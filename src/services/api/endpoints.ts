/**
 * Centralized REST API Endpoints Registry
 * Facilitates strict URL contract management across the application.
 */

export const ENDPOINTS = {
  // Health & Ping
  HEALTH: '/health',
  PING: '/ping',

  // Authentication & Staff
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    REFRESH: '/auth/refresh',
    STAFF: '/staff',
    STAFF_BY_ID: (id: string) => `/staff/${id}`,
  },

  // Services / SPK (Work Orders)
  SERVICES: {
    LIST: '/services',
    CREATE: '/services',
    DETAIL: (id: string) => `/services/${id}`,
    UPDATE: (id: string) => `/services/${id}`,
    UPDATE_STATUS: (id: string) => `/services/${id}/status`,
    WARRANTY_CLAIM: (id: string) => `/services/${id}/warranty-claim`,
    DELETE: (id: string) => `/services/${id}`,
  },

  // Spare Parts & Inventory
  PARTS: {
    LIST: '/parts',
    CREATE: '/parts',
    DETAIL: (id: string) => `/parts/${id}`,
    UPDATE: (id: string) => `/parts/${id}`,
    DELETE: (id: string) => `/parts/${id}`,
    ADD_STOCK: (id: string) => `/parts/${id}/stock`,
    LOW_STOCK_ALERTS: '/parts/alerts/low-stock',
  },

  // Mechanics & Payroll
  MECHANICS: {
    LIST: '/mechanics',
    CREATE: '/mechanics',
    DETAIL: (id: string) => `/mechanics/${id}`,
    UPDATE: (id: string) => `/mechanics/${id}`,
    DELETE: (id: string) => `/mechanics/${id}`,
    DEDUCTIONS: (id: string) => `/mechanics/${id}/deductions`,
    ALL_DEDUCTIONS: '/mechanics/deductions',
    DELETE_DEDUCTION: (id: string) => `/mechanics/deductions/${id}`,
    PAYROLL_SUMMARY: '/mechanics/payroll/summary',
  },

  // Customers & Vehicles
  CUSTOMERS: {
    LIST: '/customers',
    CREATE: '/customers',
    DETAIL: (id: string) => `/customers/${id}`,
    UPDATE: (id: string) => `/customers/${id}`,
    DELETE: (id: string) => `/customers/${id}`,
    VEHICLES: (id: string) => `/customers/${id}/vehicles`,
  },

  // Vehicles
  VEHICLES: {
    LIST: '/vehicles',
    CREATE: '/vehicles',
    DETAIL: (id: string) => `/vehicles/${id}`,
    UPDATE: (id: string) => `/vehicles/${id}`,
    DELETE: (id: string) => `/vehicles/${id}`,
  },

  // Suppliers & Purchases
  SUPPLIERS: {
    LIST: '/suppliers',
    CREATE: '/suppliers',
    DETAIL: (id: string) => `/suppliers/${id}`,
    UPDATE: (id: string) => `/suppliers/${id}`,
    DELETE: (id: string) => `/suppliers/${id}`,
  },

  PURCHASES: {
    LIST: '/purchases',
    CREATE: '/purchases',
    DETAIL: (id: string) => `/purchases/${id}`,
    DELETE: (id: string) => `/purchases/${id}`,
  },

  // Operational Expenses
  EXPENSES: {
    LIST: '/expenses',
    CREATE: '/expenses',
    DETAIL: (id: string) => `/expenses/${id}`,
    UPDATE: (id: string) => `/expenses/${id}`,
    DELETE: (id: string) => `/expenses/${id}`,
  },

  // Reports & Analytics
  REPORTS: {
    SUMMARY: '/reports/summary',
    REVENUE: '/reports/revenue',
    EXPENSES: '/reports/expenses',
    MECHANIC_PERFORMANCE: '/reports/mechanics',
    EXPORT: '/reports/export',
  },

  // Company Settings
  SETTINGS: {
    COMPANY: '/settings/company',
    RECEIPT: '/settings/receipt',
  },
} as const;
