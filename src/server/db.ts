// Facade and backward-compatibility layer delegating to modular SOLID services
export { checkDbConnection, prisma, isDbConnected } from './db/connection';
export { memoryStore } from './db/memoryStore';

import {
  customerService,
  inventoryService,
  workshopService,
  mechanicService,
  supplierService,
  financeService,
  settingsService,
} from './container';

import {
  CompanySettings,
  Customer,
  Vehicle,
  SparePart,
  WorkshopService,
  Mechanic,
  MechanicDeduction,
  Supplier,
  Expense,
  PurchaseRecord,
} from '../types';

export const dbService = {
  // Settings
  getSettings: (): Promise<CompanySettings> => settingsService.getSettings(),
  updateSettings: (data: Partial<CompanySettings>): Promise<CompanySettings> => settingsService.updateSettings(data),

  // Customers & Vehicles
  getCustomers: (): Promise<Customer[]> => customerService.getCustomers(),
  createCustomer: (data: Omit<Customer, 'id'>): Promise<Customer> => customerService.createCustomer(data),
  updateCustomer: (id: string, data: Partial<Customer>): Promise<Customer | null> => customerService.updateCustomer(id, data),
  deleteCustomer: (id: string): Promise<boolean> => customerService.deleteCustomer(id),

  getVehicles: (): Promise<Vehicle[]> => customerService.getVehicles(),
  createVehicle: (data: Omit<Vehicle, 'id'>): Promise<Vehicle> => customerService.createVehicle(data),
  deleteVehicle: (id: string): Promise<boolean> => customerService.deleteVehicle(id),

  // Inventory / Parts
  getParts: (): Promise<SparePart[]> => inventoryService.getParts(),
  createPart: (data: Omit<SparePart, 'id' | 'lastUpdated'>): Promise<SparePart> => inventoryService.createPart(data),
  updatePart: (id: string, data: Partial<SparePart>): Promise<SparePart | null> => inventoryService.updatePart(id, data),
  deletePart: (id: string): Promise<boolean> => inventoryService.deletePart(id),
  addStock: (id: string, amount: number, supplierId: string, costPrice: number): Promise<SparePart | null> =>
    inventoryService.addStock(id, amount, supplierId, costPrice),

  // Services & Warranty
  getServices: (): Promise<WorkshopService[]> => workshopService.getServices(),
  createService: (data: WorkshopService): Promise<WorkshopService> => workshopService.createService(data),
  updateServiceStatus: (id: string, status: string): Promise<WorkshopService | null> => workshopService.updateStatus(id, status),
  claimWarranty: (serviceId: string, reason: string, isAbsentNextDay: boolean) =>
    workshopService.applyWarrantyClaim({ serviceId, reason, isAbsentNextDay }),

  // Mechanics & Deductions
  getMechanics: (): Promise<Mechanic[]> => mechanicService.getMechanics(),
  createMechanic: (data: Omit<Mechanic, 'id'>): Promise<Mechanic> => mechanicService.createMechanic(data),
  updateMechanic: (id: string, data: Partial<Mechanic>): Promise<Mechanic | null> => mechanicService.updateMechanic(id, data),
  deleteMechanic: (id: string): Promise<boolean> => mechanicService.deleteMechanic(id),

  getDeductions: (): Promise<MechanicDeduction[]> => mechanicService.getDeductions(),
  createDeduction: (data: Omit<MechanicDeduction, 'id'>): Promise<MechanicDeduction> => mechanicService.createDeduction(data),
  deleteDeduction: (id: string): Promise<boolean> => mechanicService.deleteDeduction(id),

  // Suppliers
  getSuppliers: (): Promise<Supplier[]> => supplierService.getSuppliers(),
  createSupplier: (data: Omit<Supplier, 'id'>): Promise<Supplier> => supplierService.createSupplier(data),
  updateSupplier: (id: string, data: Partial<Supplier>): Promise<Supplier | null> => supplierService.updateSupplier(id, data),
  deleteSupplier: (id: string): Promise<boolean> => supplierService.deleteSupplier(id),

  // Expenses & Purchases
  getExpenses: (): Promise<Expense[]> => financeService.getExpenses(),
  createExpense: (data: Omit<Expense, 'id'>): Promise<Expense> => financeService.createExpense(data),
  deleteExpense: (id: string): Promise<boolean> => financeService.deleteExpense(id),
  getPurchases: (): Promise<PurchaseRecord[]> => financeService.getPurchases(),

  // Staff
  getStaff: (): Promise<any[]> => settingsService.getStaff(),
  createStaff: (data: any): Promise<any> => settingsService.createStaff(data),
};
