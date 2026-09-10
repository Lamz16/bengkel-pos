import { IFinanceRepository } from '../repositories/interfaces';
import { Expense, PurchaseRecord } from '../../types';

export class FinanceService {
  constructor(private financeRepo: IFinanceRepository) {}

  async getExpenses(): Promise<Expense[]> {
    return this.financeRepo.getExpenses();
  }

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
