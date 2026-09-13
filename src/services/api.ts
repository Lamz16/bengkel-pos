import {
  CompanySettings,
  Customer,
  Vehicle,
  SparePart,
  WorkshopService,
  Mechanic,
  MechanicDeduction,
  Supplier,
  PurchaseRecord,
  Expense,
  User,
  UserRole,
  ServiceStatus,
  DistributorInvoice
} from '../types';

export interface BootstrapResponse {
  settings: CompanySettings;
  customers: Customer[];
  vehicles: Vehicle[];
  parts: SparePart[];
  services: WorkshopService[];
  mechanics: Mechanic[];
  deductions: MechanicDeduction[];
  suppliers: Supplier[];
  purchases: PurchaseRecord[];
  expenses: Expense[];
  staff: any[];
  distributorInvoices?: DistributorInvoice[];
  postgresConnected: boolean;
}

const API_URL_KEY = 'bengkelpro_api_base_url';
const API_TOKEN_KEY = 'bengkelpro_api_token';

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(API_URL_KEY) || '/api';
  }
  return '/api';
}

export function setApiBaseUrl(url: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(API_URL_KEY, url);
  }
}

export function resetApiBaseUrl(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(API_URL_KEY);
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(API_TOKEN_KEY);
  }
  return null;
}

export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(API_TOKEN_KEY, token);
  }
}

export interface ApiHealthStatus {
  online: boolean;
  url: string;
  message: string;
  latencyMs?: number;
  postgresConnected?: boolean;
}

export const ENDPOINTS = {
  SERVICES: {
    LIST: '/services',
    DETAIL: (id: string) => `/services/${id}`,
  },
  CUSTOMERS: {
    LIST: '/customers',
    DETAIL: (id: string) => `/customers/${id}`,
  },
  PARTS: {
    LIST: '/parts',
    DETAIL: (id: string) => `/parts/${id}`,
  },
  MECHANICS: {
    LIST: '/mechanics',
    DETAIL: (id: string) => `/mechanics/${id}`,
  },
  EXPENSES: {
    LIST: '/expenses',
    DETAIL: (id: string) => `/expenses/${id}`,
  },
  REPORTS: {
    SUMMARY: '/reports/summary',
  },
  HEALTH: '/health',
};

export const healthApi = {
  async checkConnection(baseUrl?: string): Promise<ApiHealthStatus> {
    const start = Date.now();
    const cleanBase = (baseUrl || getApiBaseUrl()).replace(/\/$/, '');
    const url = cleanBase.endsWith('/api') ? `${cleanBase}/health` : `${cleanBase}/api/health`;
    try {
      const res = await fetch(url);
      const latencyMs = Date.now() - start;
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json().catch(() => ({}));
      return {
        online: true,
        url,
        message: data.status === 'ok' ? 'Server & REST API aktif dan merespons normal.' : 'Koneksi terhubung.',
        latencyMs,
        postgresConnected: data.postgresConnected,
      };
    } catch (err: any) {
      return {
        online: false,
        url,
        message: err.message || 'Gagal menghubungi server.',
      };
    }
  }
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = path.startsWith('/api') ? path : `/api${path}`;

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Bootstrap
  async getBootstrap(): Promise<BootstrapResponse> {
    return request<BootstrapResponse>('/api/bootstrap');
  },

  // Settings
  async getSettings(): Promise<CompanySettings> {
    return request<CompanySettings>('/api/settings');
  },

  async updateSettings(data: Partial<CompanySettings>): Promise<CompanySettings> {
    return request<CompanySettings>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return request<Customer[]>('/api/customers');
  },

  async createCustomer(data: Omit<Customer, 'id'>): Promise<Customer> {
    return request<Customer>('/api/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
    return request<Customer>(`/api/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteCustomer(id: string): Promise<void> {
    await request(`/api/customers/${id}`, { method: 'DELETE' });
  },

  // Vehicles
  async getVehicles(): Promise<Vehicle[]> {
    return request<Vehicle[]>('/api/vehicles');
  },

  async createVehicle(data: Omit<Vehicle, 'id'>): Promise<Vehicle> {
    return request<Vehicle>('/api/vehicles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteVehicle(id: string): Promise<void> {
    await request(`/api/vehicles/${id}`, { method: 'DELETE' });
  },

  // Upload Assets
  async uploadImage(image: string, folder: string = 'parts'): Promise<{ success: boolean; url: string; filename: string }> {
    return request<{ success: boolean; url: string; filename: string }>('/api/upload/image', {
      method: 'POST',
      body: JSON.stringify({ image, folder }),
    });
  },

  // Spare Parts
  async getParts(): Promise<SparePart[]> {
    return request<SparePart[]>('/api/parts');
  },

  async createPart(data: Omit<SparePart, 'id' | 'lastUpdated'>): Promise<SparePart> {
    return request<SparePart>('/api/parts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updatePart(id: string, data: Partial<SparePart>): Promise<SparePart> {
    return request<SparePart>(`/api/parts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deletePart(id: string): Promise<void> {
    await request(`/api/parts/${id}`, { method: 'DELETE' });
  },

  async addPartStock(partId: string, amount: number, supplierId: string, costPrice: number): Promise<SparePart> {
    return request<SparePart>(`/api/parts/${partId}/stock`, {
      method: 'POST',
      body: JSON.stringify({ amount, supplierId, costPrice }),
    });
  },

  // Services
  async getServices(): Promise<WorkshopService[]> {
    return request<WorkshopService[]>('/api/services');
  },

  async createService(serviceData: WorkshopService): Promise<WorkshopService> {
    return request<WorkshopService>('/api/services', {
      method: 'POST',
      body: JSON.stringify(serviceData),
    });
  },

  async updateServiceStatus(id: string, status: ServiceStatus): Promise<WorkshopService> {
    return request<WorkshopService>(`/api/services/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  async applyWarrantyClaim(data: {
    serviceId: string;
    reason: string;
    isAbsent: boolean;
    deductionAmount: number;
  }): Promise<WorkshopService> {
    return request<WorkshopService>(`/api/services/${data.serviceId}/warranty`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Mechanics
  async getMechanics(): Promise<Mechanic[]> {
    return request<Mechanic[]>('/api/mechanics');
  },

  async createMechanic(data: Omit<Mechanic, 'id'>): Promise<Mechanic> {
    return request<Mechanic>('/api/mechanics', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateMechanic(id: string, data: Partial<Mechanic>): Promise<Mechanic> {
    return request<Mechanic>(`/api/mechanics/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteMechanic(id: string): Promise<void> {
    await request(`/api/mechanics/${id}`, { method: 'DELETE' });
  },

  // Deductions
  async getDeductions(): Promise<MechanicDeduction[]> {
    return request<MechanicDeduction[]>('/api/deductions');
  },

  async createDeduction(data: Omit<MechanicDeduction, 'id'>): Promise<MechanicDeduction> {
    return request<MechanicDeduction>('/api/deductions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteDeduction(id: string): Promise<void> {
    await request(`/api/deductions/${id}`, { method: 'DELETE' });
  },

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    return request<Supplier[]>('/api/suppliers');
  },

  async createSupplier(data: Omit<Supplier, 'id'>): Promise<Supplier> {
    return request<Supplier>('/api/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateSupplier(id: string, data: Partial<Supplier>): Promise<Supplier> {
    return request<Supplier>(`/api/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteSupplier(id: string): Promise<void> {
    await request(`/api/suppliers/${id}`, { method: 'DELETE' });
  },

  // Expenses
  async getExpenses(): Promise<Expense[]> {
    return request<Expense[]>('/api/expenses');
  },

  async createExpense(data: Omit<Expense, 'id'>): Promise<Expense> {
    return request<Expense>('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteExpense(id: string): Promise<void> {
    await request(`/api/expenses/${id}`, { method: 'DELETE' });
  },

  // Purchases
  async getPurchases(): Promise<PurchaseRecord[]> {
    return request<PurchaseRecord[]>('/api/purchases');
  },

  // Staff
  async getStaff(): Promise<any[]> {
    return request<any[]>('/api/staff');
  },

  async createStaff(data: any): Promise<any> {
    return request<any>('/api/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // AI Diagnosis
  async getAIDiagnosis(vehicleModel: string, complaint: string): Promise<string> {
    try {
      const res = await request<{ diagnosis: string }>('/api/ai/diagnose', {
        method: 'POST',
        body: JSON.stringify({ vehicleModel, complaint }),
      });
      return res.diagnosis;
    } catch (err) {
      console.error('Failed to get AI diagnosis from backend:', err);
      return `Pemeriksaan mekanik langsung disarankan untuk keluhan "${complaint}" pada ${vehicleModel}.`;
    }
  },

  // Auth
  async login(credentials: { email?: string; password?: string; role?: UserRole }): Promise<User> {
    return request<User>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  async register(data: { workshopName: string; email: string; password?: string }): Promise<User> {
    return request<User>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Distributor Invoices (Nota Tempo)
  async getDistributorInvoices(): Promise<DistributorInvoice[]> {
    return request<DistributorInvoice[]>('/api/distributor-invoices');
  },

  async createDistributorInvoice(data: Partial<DistributorInvoice>): Promise<DistributorInvoice> {
    return request<DistributorInvoice>('/api/distributor-invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async addDistributorPayment(invoiceId: string, payment: { amount: number; paymentMethod: string; referenceNo?: string; notes?: string; paymentDate?: string }): Promise<DistributorInvoice> {
    return request<DistributorInvoice>(`/api/distributor-invoices/${invoiceId}/payments`, {
      method: 'POST',
      body: JSON.stringify(payment),
    });
  },

  async deleteDistributorInvoice(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/distributor-invoices/${id}`, {
      method: 'DELETE',
    });
  }
};

