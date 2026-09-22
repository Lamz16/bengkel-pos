import { IFinanceRepository } from './interfaces';
import { Expense, ExpenseCategory, PurchaseRecord } from '../../types';
import { prisma, isDbConnected } from '../db/connection';
import { memoryStore } from '../db/memoryStore';

export class FinanceRepository implements IFinanceRepository {
  private readonly defaultExpenseCategories = [
    { name: 'Pembelian Suku Cadang', description: 'Belanja stok dan komponen' },
    { name: 'Operasional', description: 'Listrik, air, internet, dan kebutuhan harian' },
    { name: 'Sewa Tempat', description: null },
    { name: 'Gaji Karyawan', description: null },
    { name: 'Lainnya', description: null },
  ];

  async getExpenseCategories(): Promise<ExpenseCategory[]> {
    if (isDbConnected()) {
      await prisma.expenseCategory.createMany({ data: this.defaultExpenseCategories, skipDuplicates: true });
      const rows = await prisma.expenseCategory.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
      return rows.map(row => ({ id: row.id, name: row.name, description: row.description || undefined, isActive: row.isActive }));
    }
    return memoryStore.expenseCategories.filter(category => category.isActive !== false);
  }

  async createExpenseCategory(data: Omit<ExpenseCategory, 'id'>): Promise<ExpenseCategory> {
    const name = data.name?.trim();
    if (!name) throw new Error('Nama kategori pengeluaran wajib diisi.');
    if (isDbConnected()) {
      const row = await prisma.expenseCategory.create({ data: { name, description: data.description?.trim() || null } });
      return { id: row.id, name: row.name, description: row.description || undefined, isActive: row.isActive };
    }
    if (memoryStore.expenseCategories.some(category => category.name.toLowerCase() === name.toLowerCase())) throw new Error('Nama kategori pengeluaran sudah digunakan.');
    const category = { id: `exp-cat-${Date.now()}`, name, description: data.description?.trim() || undefined, isActive: true };
    memoryStore.expenseCategories.push(category);
    return category;
  }

  async updateExpenseCategory(id: string, data: Partial<ExpenseCategory>): Promise<ExpenseCategory> {
    const name = data.name?.trim();
    if (isDbConnected()) {
      const row = await prisma.expenseCategory.update({ where: { id }, data: { name: name || undefined, description: data.description === undefined ? undefined : data.description.trim() || null } });
      return { id: row.id, name: row.name, description: row.description || undefined, isActive: row.isActive };
    }
    const index = memoryStore.expenseCategories.findIndex(category => category.id === id);
    if (index < 0) throw new Error('Kategori pengeluaran tidak ditemukan.');
    memoryStore.expenseCategories[index] = { ...memoryStore.expenseCategories[index], ...data, ...(name ? { name } : {}) };
    return memoryStore.expenseCategories[index];
  }

  async deleteExpenseCategory(id: string): Promise<void> {
    if (isDbConnected()) {
      // Riwayat tetap aman karena relasi memakai SetNull dan Expense menyimpan snapshot nama kategori.
      await prisma.expenseCategory.delete({ where: { id } });
      return;
    }
    memoryStore.expenseCategories = memoryStore.expenseCategories.filter(category => category.id !== id);
    memoryStore.expenses = memoryStore.expenses.map(expense => expense.categoryId === id ? { ...expense, categoryId: undefined } : expense);
  }

  async getExpenses(): Promise<Expense[]> {
    if (isDbConnected()) {
      try {
        const list = await prisma.expense.findMany({
          orderBy: { date: 'desc' }
        });
        return list.map(e => ({
          id: e.id,
          category: e.category,
          categoryId: e.categoryId || undefined,
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
        const category = data.categoryId
          ? await prisma.expenseCategory.findFirst({ where: { id: data.categoryId, isActive: true } })
          : await prisma.expenseCategory.findFirst({ where: { name: { equals: data.category, mode: 'insensitive' }, isActive: true } });
        if (!category) throw new Error('Kategori pengeluaran tidak valid. Pilih dari manajemen kategori.');
        const created = await prisma.expense.create({
          data: {
            id,
            category: category.name,
            categoryId: category.id,
            amount: data.amount,
            note: data.note,
            date: now,
          }
        });
        const exp: Expense = {
          id: created.id,
          category: created.category,
          categoryId: created.categoryId || undefined,
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
    const category = memoryStore.expenseCategories.find(item => item.id === data.categoryId) || memoryStore.expenseCategories.find(item => item.name === data.category);
    if (!category) throw new Error('Kategori pengeluaran tidak valid. Pilih dari manajemen kategori.');
    const exp: Expense = { id, ...data, category: category.name, categoryId: category.id, date: now.toISOString() };
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
