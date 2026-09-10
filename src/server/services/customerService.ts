import { ICustomerRepository, IVehicleRepository } from '../repositories/interfaces';
import { Customer, Vehicle } from '../../types';

export class CustomerService {
  constructor(
    private customerRepo: ICustomerRepository,
    private vehicleRepo: IVehicleRepository
  ) {}

  async getCustomers(): Promise<Customer[]> {
    return this.customerRepo.getAll();
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    return this.customerRepo.getById(id);
  }

  async createCustomer(data: Omit<Customer, 'id'>): Promise<Customer> {
    return this.customerRepo.create(data);
  }

  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer | null> {
    return this.customerRepo.update(id, data);
  }

  async deleteCustomer(id: string): Promise<boolean> {
    return this.customerRepo.delete(id);
  }

  async getVehicles(): Promise<Vehicle[]> {
    return this.vehicleRepo.getAll();
  }

  async getVehiclesByCustomer(customerId: string): Promise<Vehicle[]> {
    return this.vehicleRepo.getByCustomerId(customerId);
  }

  async createVehicle(data: Omit<Vehicle, 'id'>): Promise<Vehicle> {
    return this.vehicleRepo.create(data);
  }

  async deleteVehicle(id: string): Promise<boolean> {
    return this.vehicleRepo.delete(id);
  }
}
