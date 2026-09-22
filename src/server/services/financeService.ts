import { IFinanceRepository } from '../repositories/interfaces';
import { Expense, ExpenseCategory, PurchaseRecord } from '../../types';

export class FinanceService {
  constructor(private financeRepo: IFinanceRepository) {}

  async getExpenses(): Promise<Expense[]> {
    return this.financeRepo.getExpenses();
  }
  async getExpenseCategories(): Promise<ExpenseCategory[]> { return this.financeRepo.getExpenseCategories(); }
  async createExpenseCategory(data: Omit<ExpenseCategory, 'id'>): Promise<ExpenseCategory> { return this.financeRepo.createExpenseCategory(data); }
  async updateExpenseCategory(id: string, data: Partial<ExpenseCategory>): Promise<ExpenseCategory> { return this.financeRepo.updateExpenseCategory(id, data); }
  async deleteExpenseCategory(id: string): Promise<void> { return this.financeRepo.deleteExpenseCategory(id); }

  async createExpense(data: Omit<Expense, 'id'>): Promise<Expense> {
    return this.financeRepo.createExpense(data);
  }

  async deleteExpense(id: string): Promise<boolean> {
    return this.financeRepo.deleteExpense(id);
  }

  async getPurchases(): Promise<PurchaseRecord[]> {
    return this.financeRepo.getPurchases();
  }
}
