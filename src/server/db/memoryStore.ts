import {
  CompanySettings, SparePart, Customer, Vehicle, WorkshopService, Mechanic,
  MechanicDeduction, MechanicAttendance, Supplier, PurchaseRecord, Expense,
  ExpenseCategory, User, DistributorInvoice, PartCategory, WarehouseRack,
  WarehouseZone, LoyaltyTier,
} from '../../types';

/**
 * State kosong untuk kompatibilitas repository saat server belum siap.
 * Endpoint bisnis dan autentikasi menolak akses tanpa PostgreSQL, sehingga
 * store ini bukan sumber data atau fallback aplikasi.
 */
export interface MemoryStore {
  settings: CompanySettings;
  loyaltyTiers: LoyaltyTier[];
  users: User[];
  customers: Customer[];
  vehicles: Vehicle[];
  parts: SparePart[];
  categories: PartCategory[];
  racks: WarehouseRack[];
  zones: WarehouseZone[];
  services: WorkshopService[];
  mechanics: Mechanic[];
  deductions: MechanicDeduction[];
  attendances: MechanicAttendance[];
  suppliers: Supplier[];
  purchases: PurchaseRecord[];
  expenses: Expense[];
  expenseCategories: ExpenseCategory[];
  staff: Array<{ id: string; name: string; role: string; status: string; shifts?: string; email?: string }>;
  distributorInvoices?: DistributorInvoice[];
}

export const memoryStore: MemoryStore = {
  settings: {} as CompanySettings,
  loyaltyTiers: [], users: [], customers: [], vehicles: [], parts: [],
  categories: [], racks: [], zones: [], services: [], mechanics: [],
  deductions: [], attendances: [], suppliers: [], purchases: [], expenses: [],
  expenseCategories: [], staff: [], distributorInvoices: [],
};
