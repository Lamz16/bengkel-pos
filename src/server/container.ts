import { CustomerRepository } from './repositories/customerRepository';
import { VehicleRepository } from './repositories/vehicleRepository';
import { PartRepository } from './repositories/partRepository';
import { ServiceRepository } from './repositories/serviceRepository';
import { MechanicRepository, DeductionRepository, AttendanceRepository } from './repositories/mechanicRepository';
import { SupplierRepository } from './repositories/supplierRepository';
import { FinanceRepository } from './repositories/financeRepository';
import { SettingsRepository } from './repositories/settingsRepository';
import { StaffRepository } from './repositories/staffRepository';

import { CustomerService } from './services/customerService';
import { InventoryService } from './services/inventoryService';
import { WorkshopServiceLayer } from './services/workshopService';
import { MechanicService } from './services/mechanicService';
import { SupplierService } from './services/supplierService';
import { FinanceService } from './services/financeService';
import { SettingsService } from './services/settingsService';
import { AiDiagnosisService } from './services/aiDiagnosisService';

// Repositories (Data Access Layer)
export const customerRepository = new CustomerRepository();
export const vehicleRepository = new VehicleRepository();
export const partRepository = new PartRepository();
export const serviceRepository = new ServiceRepository();
export const mechanicRepository = new MechanicRepository();
export const deductionRepository = new DeductionRepository();
export const attendanceRepository = new AttendanceRepository();
export const supplierRepository = new SupplierRepository();
export const financeRepository = new FinanceRepository();
export const settingsRepository = new SettingsRepository();
export const staffRepository = new StaffRepository();

// Services (Business Logic Layer)
export const customerService = new CustomerService(customerRepository, vehicleRepository);
export const inventoryService = new InventoryService(partRepository, financeRepository);
export const workshopService = new WorkshopServiceLayer(
  serviceRepository,
  partRepository,
  customerRepository,
  deductionRepository,
  mechanicRepository
);
export const mechanicService = new MechanicService(mechanicRepository, deductionRepository, attendanceRepository);
export const supplierService = new SupplierService(supplierRepository);
export const financeService = new FinanceService(financeRepository);
export const settingsService = new SettingsService(settingsRepository, staffRepository);
export const aiDiagnosisService = new AiDiagnosisService();
