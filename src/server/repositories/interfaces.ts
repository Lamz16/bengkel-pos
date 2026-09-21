import { 
  Customer, 
  Vehicle, 
  SparePart, 
  WorkshopService, 
  Mechanic, 
  MechanicDeduction, 
  MechanicAttendance,
  Supplier, 
  PurchaseRecord, 
  Expense, 
  CompanySettings,
  PaginatedResult,
  StockHistory
} from '../../types';

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface ICustomerRepository {
  getAll(): Promise<Customer[]>;
  getPaginated(params: PaginationParams): Promise<PaginatedResult<Customer>>;
  getById(id: string): Promise<Customer | null>;
  create(data: Omit<Customer, 'id'>): Promise<Customer>;
  update(id: string, data: Partial<Customer>, expectedVersion?: number): Promise<Customer | null>;
  delete(id: string): Promise<boolean>;
  incrementStats(id: string, serviceAmount: number): Promise<void>;
}

export interface IVehicleRepository {
  getAll(): Promise<Vehicle[]>;
  getByCustomerId(customerId: string): Promise<Vehicle[]>;
  create(data: Omit<Vehicle, 'id'>): Promise<Vehicle>;
  delete(id: string): Promise<boolean>;
}

export interface IPartRepository {
  getAll(): Promise<SparePart[]>;
  getPaginated(params: PaginationParams): Promise<PaginatedResult<SparePart>>;
  getById(id: string): Promise<SparePart | null>;
  create(data: Omit<SparePart, 'id' | 'lastUpdated'>): Promise<SparePart>;
  update(id: string, data: Partial<SparePart>, expectedVersion?: number): Promise<SparePart | null>;
  delete(id: string): Promise<boolean>;
  adjustStock(id: string, delta: number, newPurchasePrice?: number): Promise<SparePart | null>;
  getStockHistoryPaginated(params: PaginationParams): Promise<PaginatedResult<StockHistory>>;
}

export interface IServiceRepository {
  getAll(): Promise<WorkshopService[]>;
  getPaginated(params: PaginationParams): Promise<PaginatedResult<WorkshopService>>;
  getById(id: string): Promise<WorkshopService | null>;
  create(data: WorkshopService): Promise<WorkshopService>;
  updateStatus(id: string, status: string, expectedVersion?: number): Promise<WorkshopService | null>;
  updateWarrantyClaim(data: {
    serviceId: string;
    reason: string;
    isAbsent: boolean;
    deductionAmount: number;
    claimDate: Date;
  }): Promise<WorkshopService | null>;
}

export interface IMechanicRepository {
  getAll(): Promise<Mechanic[]>;
  getById(id: string): Promise<Mechanic | null>;
  create(data: Omit<Mechanic, 'id'>): Promise<Mechanic>;
  update(id: string, data: Partial<Mechanic>): Promise<Mechanic | null>;
  delete(id: string): Promise<boolean>;
}

export interface IDeductionRepository {
  getAll(): Promise<MechanicDeduction[]>;
  create(data: Omit<MechanicDeduction, 'id'>): Promise<MechanicDeduction>;
  delete(id: string): Promise<boolean>;
}

export interface IAttendanceRepository {
  getAll(): Promise<MechanicAttendance[]>;
  upsert(data: Omit<MechanicAttendance, 'id'>): Promise<MechanicAttendance>;
}

export interface ISupplierRepository {
  getAll(): Promise<Supplier[]>;
  getById(id: string): Promise<Supplier | null>;
  create(data: Omit<Supplier, 'id'>): Promise<Supplier>;
  update(id: string, data: Partial<Supplier>): Promise<Supplier | null>;
  delete(id: string): Promise<boolean>;
}

export interface IFinanceRepository {
  getExpenses(): Promise<Expense[]>;
  createExpense(data: Omit<Expense, 'id'>): Promise<Expense>;
  deleteExpense(id: string): Promise<boolean>;
  getPurchases(): Promise<PurchaseRecord[]>;
  createPurchase(data: Omit<PurchaseRecord, 'id'>): Promise<PurchaseRecord>;
}

export interface ISettingsRepository {
  get(): Promise<CompanySettings>;
  update(data: Partial<CompanySettings>): Promise<CompanySettings>;
}

export interface IStaffRepository {
  getAll(): Promise<any[]>;
  create(data: any): Promise<any>;
}
