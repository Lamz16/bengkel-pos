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
  DistributorInvoice,
  PartCategory,
  WarehouseRack,
  WarehouseZone,
  StorageLocation, StorageLocationType
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
  categories: PartCategory[];
  racks: WarehouseRack[];
  zones: WarehouseZone[];
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

export function clearAuthToken(): void {
  if (typeof window !== 'undefined') localStorage.removeItem(API_TOKEN_KEY);
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
  const method = (options?.method || 'GET').toUpperCase();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Automatically attach idempotency key for write requests
  if (['POST', 'PUT', 'PATCH'].includes(method) && !headers['x-idempotency-key']) {
    headers['x-idempotency-key'] = `idemp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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

  async downloadDatabaseBackup(credentials: { email: string; password: string }): Promise<string> {
    const token = getAuthToken();
    const response = await fetch('/api/database/backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(credentials),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.error || 'Gagal membuat backup database.');
    }

    const disposition = response.headers.get('Content-Disposition') || '';
    const filename = disposition.match(/filename="([^"]+)"/)?.[1] || `bengkel-pos-backup-${Date.now()}.sql`;
    const url = URL.createObjectURL(await response.blob());
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    return filename;
  },

  async getStorageLocations(): Promise<StorageLocation[]> {
    return request('/api/storage-locations');
  },
  async createRackLayout(data: { code: string; name?: string; zoneId: string; description?: string; positionNote?: string; levelCount: number; slotsPerLevel: number }): Promise<{ rack: WarehouseRack; locations: StorageLocation[] }> {
    return request('/api/storage-locations/rack-layout', { method: 'POST', body: JSON.stringify(data) });
  },
  async updateRackLayout(id: string, data: { name?: string; description?: string; positionNote?: string }): Promise<void> {
    await request(`/api/storage-locations/racks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async deleteRackLayout(id: string): Promise<void> {
    await request(`/api/storage-locations/racks/${id}`, { method: 'DELETE' });
  },
  async createNonRackLocation(data: { zoneId: string; type: StorageLocationType; code: string; name?: string; positionNote?: string; description?: string }): Promise<StorageLocation> {
    return request('/api/storage-locations/non-rack', { method: 'POST', body: JSON.stringify(data) });
  },
  async updateNonRackLocation(id: string, data: { name: string; positionNote?: string; description?: string }): Promise<StorageLocation> {
    return request(`/api/storage-locations/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async deleteNonRackLocation(id: string): Promise<void> {
    await request(`/api/storage-locations/${id}`, { method: 'DELETE' });
  },

  async createCategory(data: Omit<PartCategory, 'id'>): Promise<PartCategory> {
    return request('/api/master-data/categories', { method: 'POST', body: JSON.stringify(data) });
  },
  async updateCategory(id: string, data: Partial<PartCategory>): Promise<PartCategory> {
    return request(`/api/master-data/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async deleteCategory(id: string): Promise<void> {
    await request(`/api/master-data/categories/${id}`, { method: 'DELETE' });
  },
  async createRack(data: Omit<WarehouseRack, 'id'>): Promise<WarehouseRack> {
    return request('/api/master-data/racks', { method: 'POST', body: JSON.stringify(data) });
  },
  async updateRack(id: string, data: Partial<WarehouseRack>): Promise<WarehouseRack> {
    return request(`/api/master-data/racks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async deleteRack(id: string): Promise<void> {
    await request(`/api/master-data/racks/${id}`, { method: 'DELETE' });
  },
  async createZone(data: Omit<WarehouseZone, 'id'>): Promise<WarehouseZone> {
    return request('/api/master-data/zones', { method: 'POST', body: JSON.stringify(data) });
  },
  async updateZone(id: string, data: Partial<WarehouseZone>): Promise<WarehouseZone> {
    return request(`/api/master-data/zones/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async deleteZone(id: string): Promise<void> {
    await request(`/api/master-data/zones/${id}`, { method: 'DELETE' });
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
  async login(credentials: { email: string; password: string }): Promise<User> {
    const result = await request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    setAuthToken(result.token);
    return result.user;
  },

  async register(data: { workshopName: string; email: string; password?: string }): Promise<User> {
    const result = await request<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setAuthToken(result.token);
    return result.user;
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
