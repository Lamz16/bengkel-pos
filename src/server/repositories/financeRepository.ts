import { IFinanceRepository } from './interfaces';
import { Expense, PurchaseRecord } from '../../types';
import { prisma, isDbConnected } from '../db/connection';
import { memoryStore } from '../db/memoryStore';

export class FinanceRepository implements IFinanceRepository {
  async getExpenses(): Promise<Expense[]> {
    if (isDbConnected()) {
      try {
        const list = await prisma.expense.findMany({
          orderBy: { date: 'desc' }
        });
        return list.map(e => ({
          id: e.id,
          category: e.category,
          amount: Number(e.amount),
          note: e.note,
          date: e.date.toISOString(),
        }));
      } catch (err) {
        console.error('[FinanceRepo] Prisma getExpenses error:', err);
      }
    }
    return memoryStore.expenses;
  }

  async createExpense(data: Omit<Expense, 'id'>): Promise<Expense> {
    const id = `EXP-${Date.now().toString().slice(-4)}`;
    const now = new Date(data.date || Date.now());

    if (isDbConnected()) {
      try {
        const created = await prisma.expense.create({
          data: {
            id,
            category: data.category,
            amount: data.amount,
            note: data.note,
            date: now,
          }
        });
        const exp: Expense = {
          id: created.id,
          category: created.category,
          amount: Number(created.amount),
          note: created.note,
          date: created.date.toISOString(),
        };
        memoryStore.expenses.unshift(exp);
        return exp;
      } catch (err) {
        console.error('[FinanceRepo] Prisma createExpense error:', err);
      }
    }
    const exp: Expense = { id, ...data, date: now.toISOString() };
    memoryStore.expenses.unshift(exp);
    return exp;
  }

  async deleteExpense(id: string): Promise<boolean> {
    if (isDbConnected()) {
      try {
        await prisma.expense.delete({ where: { id } });
      } catch (err) {
        console.error('[FinanceRepo] Prisma deleteExpense error:', err);
      }
    }
    memoryStore.expenses = memoryStore.expenses.filter(e => e.id !== id);
    return true;
  }

  async getPurchases(): Promise<PurchaseRecord[]> {
    if (isDbConnected()) {
      try {
        const list = await prisma.purchaseRecord.findMany({
          orderBy: { date: 'desc' }
        });
        return list.map(p => ({
          id: p.id,
          partId: p.partId,
          supplierId: p.supplierId,
          quantity: p.quantity,
          costPrice: Number(p.costPrice),
          date: p.date.toISOString(),
        }));
      } catch (err) {
        console.error('[FinanceRepo] Prisma getPurchases error:', err);
      }
    }
    return memoryStore.purchases;
  }

  async createPurchase(data: Omit<PurchaseRecord, 'id'>): Promise<PurchaseRecord> {
    const id = `PR-${Date.now().toString().slice(-4)}`;
    const dateObj = new Date(data.date || Date.now());

    if (isDbConnected()) {
      try {
        const created = await prisma.purchaseRecord.create({
          data: {
            id,
            partId: data.partId,
            supplierId: data.supplierId,
            quantity: data.quantity,
            costPrice: data.costPrice,
            date: dateObj,
          }
        });
        const pr: PurchaseRecord = {
          id: created.id,
          partId: created.partId,
          supplierId: created.supplierId,
          quantity: created.quantity,
          costPrice: Number(created.costPrice),
          date: created.date.toISOString(),
        };
        memoryStore.purchases.unshift(pr);
        return pr;
      } catch (err) {
        console.error('[FinanceRepo] Prisma createPurchase error:', err);
      }
    }

    const pr: PurchaseRecord = { id, ...data, date: dateObj.toISOString() };
    memoryStore.purchases.unshift(pr);
    return pr;
  }
}
