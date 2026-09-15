import { IPartRepository, IFinanceRepository } from '../repositories/interfaces';
import { SparePart, PurchaseRecord } from '../../types';
import { isDbConnected, prisma } from '../db/connection';

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
    if (isDbConnected()) {
      await prisma.$transaction(async tx => {
        const part = await tx.sparePart.update({
          where: { id: partId },
          data: { stock: { increment: amount }, purchasePrice: costPrice > 0 ? costPrice : undefined },
        });
        await tx.stockHistory.create({ data: {
          partId, partName: part.name, amount, type: 'In', reason: supplierId ? 'Pembelian dari pemasok' : 'Penyesuaian stok',
        }});
        if (supplierId) await tx.purchaseRecord.create({ data: {
          id: `PR-${Date.now().toString().slice(-8)}`, partId, supplierId, quantity: amount, costPrice, date: new Date(),
        }});
      });
      return this.partRepo.getById(partId);
    }
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
