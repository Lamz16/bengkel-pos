import { IPartRepository, IFinanceRepository } from '../repositories/interfaces';
import { SparePart, PurchaseRecord } from '../../types';

export class InventoryService {
  constructor(
    private partRepo: IPartRepository,
    private financeRepo: IFinanceRepository
  ) {}

  async getParts(): Promise<SparePart[]> {
    return this.partRepo.getAll();
  }

  async getPartById(id: string): Promise<SparePart | null> {
    return this.partRepo.getById(id);
  }

  async createPart(data: Omit<SparePart, 'id' | 'lastUpdated'>): Promise<SparePart> {
    return this.partRepo.create(data);
  }

  async updatePart(id: string, data: Partial<SparePart>): Promise<SparePart | null> {
    return this.partRepo.update(id, data);
  }

  async deletePart(id: string): Promise<boolean> {
    return this.partRepo.delete(id);
  }

  async addStock(partId: string, amount: number, supplierId: string, costPrice: number): Promise<SparePart | null> {
    const updated = await this.partRepo.adjustStock(partId, amount, costPrice);
    if (updated && supplierId) {
      await this.financeRepo.createPurchase({
        partId,
        supplierId,
        quantity: amount,
        costPrice,
        date: new Date().toISOString()
      });
    }
    return updated;
  }
}
