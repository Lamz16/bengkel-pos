import { ISupplierRepository } from './interfaces';
import { Supplier } from '../../types';
import { prisma, isDbConnected } from '../db/connection';
import { memoryStore } from '../db/memoryStore';

export class SupplierRepository implements ISupplierRepository {
  async getAll(): Promise<Supplier[]> {
    if (isDbConnected()) {
      try {
        const list = await prisma.supplier.findMany({
          orderBy: { name: 'asc' }
        });
        return list.map(s => ({
          id: s.id,
          name: s.name,
          contact: s.contact,
          address: s.address,
        }));
      } catch (err) {
        console.error('[SupplierRepo] Prisma getAll error:', err);
      }
    }
    return memoryStore.suppliers;
  }

  async getById(id: string): Promise<Supplier | null> {
    if (isDbConnected()) {
      try {
        const s = await prisma.supplier.findUnique({ where: { id } });
        if (s) {
          return {
            id: s.id,
            name: s.name,
            contact: s.contact,
            address: s.address,
          };
        }
      } catch (err) {
        console.error('[SupplierRepo] Prisma getById error:', err);
      }
    }
    return memoryStore.suppliers.find(s => s.id === id) || null;
  }

  async create(data: Omit<Supplier, 'id'>): Promise<Supplier> {
    const id = `SUP-${Date.now().toString().slice(-4)}`;
    if (isDbConnected()) {
      try {
        const created = await prisma.supplier.create({
          data: { id, name: data.name, contact: data.contact, address: data.address }
        });
        const sup: Supplier = { id: created.id, name: created.name, contact: created.contact, address: created.address };
        memoryStore.suppliers.push(sup);
        return sup;
      } catch (err) {
        console.error('[SupplierRepo] Prisma create error:', err);
      }
    }
    const sup: Supplier = { id, ...data };
    memoryStore.suppliers.push(sup);
    return sup;
  }

  async update(id: string, data: Partial<Supplier>): Promise<Supplier | null> {
    if (isDbConnected()) {
      try {
        const updated = await prisma.supplier.update({
          where: { id },
          data: { name: data.name, contact: data.contact, address: data.address }
        });
        const sup: Supplier = { id: updated.id, name: updated.name, contact: updated.contact, address: updated.address };
        const idx = memoryStore.suppliers.findIndex(s => s.id === id);
        if (idx !== -1) memoryStore.suppliers[idx] = sup;
        return sup;
      } catch (err) {
        console.error('[SupplierRepo] Prisma update error:', err);
      }
    }
    const idx = memoryStore.suppliers.findIndex(s => s.id === id);
    if (idx === -1) return null;
    memoryStore.suppliers[idx] = { ...memoryStore.suppliers[idx], ...data };
    return memoryStore.suppliers[idx];
  }

  async delete(id: string): Promise<boolean> {
    if (isDbConnected()) {
      try {
        await prisma.supplier.delete({ where: { id } });
      } catch (err) {
        console.error('[SupplierRepo] Prisma delete error:', err);
      }
    }
    memoryStore.suppliers = memoryStore.suppliers.filter(s => s.id !== id);
    return true;
  }
}
