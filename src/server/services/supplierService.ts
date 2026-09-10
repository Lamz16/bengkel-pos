import { ISupplierRepository } from '../repositories/interfaces';
import { Supplier } from '../../types';

export class SupplierService {
  constructor(private supplierRepo: ISupplierRepository) {}

  async getSuppliers(): Promise<Supplier[]> {
    return this.supplierRepo.getAll();
  }

  async getSupplierById(id: string): Promise<Supplier | null> {
    return this.supplierRepo.getById(id);
  }

  async createSupplier(data: Omit<Supplier, 'id'>): Promise<Supplier> {
    return this.supplierRepo.create(data);
  }

  async updateSupplier(id: string, data: Partial<Supplier>): Promise<Supplier | null> {
    return this.supplierRepo.update(id, data);
  }

  async deleteSupplier(id: string): Promise<boolean> {
    return this.supplierRepo.delete(id);
  }
}
