import { ICustomerRepository } from './interfaces';
import { Customer } from '../../types';
import { prisma, isDbConnected } from '../db/connection';
import { memoryStore } from '../db/memoryStore';

export class CustomerRepository implements ICustomerRepository {
  async getAll(): Promise<Customer[]> {
    if (isDbConnected()) {
      try {
        const list = await prisma.customer.findMany({
          orderBy: { createdAt: 'desc' }
        });
        return list.map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          totalServiceCount: c.totalServiceCount,
          totalSpent: Number(c.totalSpent),
          lastVisitDate: c.lastVisitDate ? c.lastVisitDate.toISOString() : undefined,
          loyaltyTier: (c.loyaltyTier as any) || 'Bronze',
          notes: c.notes || undefined,
        }));
      } catch (err) {
        console.error('[CustomerRepo] Prisma getAll error:', err);
      }
    }
    return memoryStore.customers;
  }

  async getById(id: string): Promise<Customer | null> {
    if (isDbConnected()) {
      try {
        const c = await prisma.customer.findUnique({ where: { id } });
        if (c) {
          return {
            id: c.id,
            name: c.name,
            phone: c.phone,
            totalServiceCount: c.totalServiceCount,
            totalSpent: Number(c.totalSpent),
            lastVisitDate: c.lastVisitDate ? c.lastVisitDate.toISOString() : undefined,
            loyaltyTier: (c.loyaltyTier as any) || 'Bronze',
            notes: c.notes || undefined,
          };
        }
      } catch (err) {
        console.error('[CustomerRepo] Prisma getById error:', err);
      }
    }
    return memoryStore.customers.find(c => c.id === id) || null;
  }

  async create(data: Omit<Customer, 'id'>): Promise<Customer> {
    const id = `CUST-${Date.now().toString().slice(-4)}`;
    if (isDbConnected()) {
      try {
        const created = await prisma.customer.create({
          data: {
            id,
            name: data.name,
            phone: data.phone,
            totalServiceCount: data.totalServiceCount || 0,
            totalSpent: data.totalSpent || 0,
            loyaltyTier: data.loyaltyTier || 'Bronze',
            notes: data.notes,
          }
        });
        const cust: Customer = {
          id: created.id,
          name: created.name,
          phone: created.phone,
          totalServiceCount: created.totalServiceCount,
          totalSpent: Number(created.totalSpent),
          loyaltyTier: (created.loyaltyTier as any) || 'Bronze',
          notes: created.notes || undefined,
        };
        memoryStore.customers.unshift(cust);
        return cust;
      } catch (err) {
        console.error('[CustomerRepo] Prisma create error:', err);
      }
    }
    const newCust: Customer = { id, ...data };
    memoryStore.customers.unshift(newCust);
    return newCust;
  }

  async update(id: string, data: Partial<Customer>): Promise<Customer | null> {
    if (isDbConnected()) {
      try {
        const updated = await prisma.customer.update({
          where: { id },
          data: {
            name: data.name,
            phone: data.phone,
            totalServiceCount: data.totalServiceCount,
            totalSpent: data.totalSpent,
            loyaltyTier: data.loyaltyTier,
            notes: data.notes,
          }
        });
        const cust: Customer = {
          id: updated.id,
          name: updated.name,
          phone: updated.phone,
          totalServiceCount: updated.totalServiceCount,
          totalSpent: Number(updated.totalSpent),
          loyaltyTier: (updated.loyaltyTier as any) || 'Bronze',
          notes: updated.notes || undefined,
        };
        const idx = memoryStore.customers.findIndex(c => c.id === id);
        if (idx !== -1) memoryStore.customers[idx] = cust;
        return cust;
      } catch (err) {
        console.error('[CustomerRepo] Prisma update error:', err);
      }
    }
    const idx = memoryStore.customers.findIndex(c => c.id === id);
    if (idx === -1) return null;
    memoryStore.customers[idx] = { ...memoryStore.customers[idx], ...data };
    return memoryStore.customers[idx];
  }

  async delete(id: string): Promise<boolean> {
    if (isDbConnected()) {
      try {
        await prisma.customer.delete({ where: { id } });
      } catch (err) {
        console.error('[CustomerRepo] Prisma delete error:', err);
      }
    }
    memoryStore.customers = memoryStore.customers.filter(c => c.id !== id);
    memoryStore.vehicles = memoryStore.vehicles.filter(v => v.customerId !== id);
    return true;
  }

  async incrementStats(id: string, serviceAmount: number): Promise<void> {
    if (isDbConnected()) {
      try {
        await prisma.customer.update({
          where: { id },
          data: {
            totalServiceCount: { increment: 1 },
            totalSpent: { increment: serviceAmount },
            lastVisitDate: new Date()
          }
        });
      } catch (err) {
        console.error('[CustomerRepo] Prisma incrementStats error:', err);
      }
    }

    const cIdx = memoryStore.customers.findIndex(c => c.id === id);
    if (cIdx !== -1) {
      const currentCount = (memoryStore.customers[cIdx].totalServiceCount || 0) + 1;
      const currentSpent = (memoryStore.customers[cIdx].totalSpent || 0) + serviceAmount;
      let loyaltyTier: any = memoryStore.customers[cIdx].loyaltyTier || 'Bronze';
      if (currentCount >= 10) loyaltyTier = 'VIP';
      else if (currentCount >= 6) loyaltyTier = 'Gold';
      else if (currentCount >= 3) loyaltyTier = 'Silver';

      memoryStore.customers[cIdx] = {
        ...memoryStore.customers[cIdx],
        totalServiceCount: currentCount,
        totalSpent: currentSpent,
        loyaltyTier,
        lastVisitDate: new Date().toISOString()
      };
    }
  }
}
