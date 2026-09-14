import { IPartRepository } from './interfaces';
import { SparePart } from '../../types';
import { prisma, isDbConnected } from '../db/connection';
import { memoryStore } from '../db/memoryStore';

type PartWithMasterData = any;
const includeMasterData = { category: true, rack: { include: { zone: true } } } as const;
const toSparePart = (p: PartWithMasterData): SparePart => ({
  id: p.id, sku: p.sku || undefined, barcode: p.barcode || undefined, name: p.name,
  categoryId: p.categoryId, category: p.category.name, price: Number(p.price),
  purchasePrice: Number(p.purchasePrice), stock: p.stock, minStock: p.minStock,
  supplierId: p.supplierId || undefined, imageUrl: p.imageUrl || undefined,
  rackId: p.rackId || undefined, rackCode: p.rack?.code || undefined,
  shelfLevel: p.shelfLevel || undefined, binNumber: p.binNumber || undefined,
  rackLocation: p.rack?.code || undefined, rackZone: p.rack?.zone?.name || undefined,
  locationNotes: p.locationNotes || undefined, lastUpdated: p.updatedAt.toISOString(),
});

export class PartRepository implements IPartRepository {
  private async resolveMasterIds(data: Partial<SparePart>) {
    let categoryId = data.categoryId;
    let rackId = data.rackId;
    if (!categoryId && data.category) {
      categoryId = (await prisma.partCategory.findFirst({
        where: { name: { equals: data.category, mode: 'insensitive' } }, select: { id: true },
      }))?.id;
    }
    if (!categoryId) throw new Error('Kategori barang tidak valid. Pilih kategori dari data master.');
    if (!rackId && data.rackCode) {
      rackId = (await prisma.warehouseRack.findFirst({
        where: { code: { equals: data.rackCode, mode: 'insensitive' } }, select: { id: true },
      }))?.id;
    }
    if ((data.rackId || data.rackCode) && !rackId) throw new Error('Rak tidak valid. Pilih rak dari data master.');
    return { categoryId, rackId: rackId || null };
  }

  async getAll(): Promise<SparePart[]> {
    if (isDbConnected()) {
      try {
        const list = await prisma.sparePart.findMany({ include: includeMasterData, orderBy: { name: 'asc' } });
        return list.map(toSparePart);
      } catch (err) { console.error('[PartRepo] Prisma getAll error:', err); }
    }
    return memoryStore.parts;
  }

  async getById(id: string): Promise<SparePart | null> {
    if (isDbConnected()) {
      try {
        const part = await prisma.sparePart.findUnique({ where: { id }, include: includeMasterData });
        return part ? toSparePart(part) : null;
      } catch (err) { console.error('[PartRepo] Prisma getById error:', err); }
    }
    return memoryStore.parts.find(p => p.id === id) || null;
  }

  async create(data: Omit<SparePart, 'id' | 'lastUpdated'>): Promise<SparePart> {
    const id = `P${Date.now().toString().slice(-8)}`;
    if (isDbConnected()) {
      const { categoryId, rackId } = await this.resolveMasterIds(data);
      const created = await prisma.sparePart.create({
        data: {
          id, sku: data.sku, barcode: data.barcode, name: data.name, categoryId,
          price: data.price, purchasePrice: data.purchasePrice || 0, stock: data.stock || 0,
          minStock: data.minStock ?? 5, supplierId: data.supplierId || null, imageUrl: data.imageUrl,
          rackId, shelfLevel: data.shelfLevel, binNumber: data.binNumber, locationNotes: data.locationNotes,
        }, include: includeMasterData,
      });
      const part = toSparePart(created);
      memoryStore.parts.unshift(part);
      return part;
    }
    const part: SparePart = { id, lastUpdated: new Date().toISOString(), ...data };
    memoryStore.parts.unshift(part);
    return part;
  }

  async update(id: string, data: Partial<SparePart>): Promise<SparePart | null> {
    if (isDbConnected()) {
      const masterIds = data.categoryId || data.category || data.rackId || data.rackCode
        ? await this.resolveMasterIds(data) : undefined;
      const updated = await prisma.sparePart.update({
        where: { id },
        data: {
          sku: data.sku, barcode: data.barcode, name: data.name, categoryId: masterIds?.categoryId,
          price: data.price, purchasePrice: data.purchasePrice, stock: data.stock, minStock: data.minStock,
          supplierId: data.supplierId, imageUrl: data.imageUrl, rackId: masterIds?.rackId,
          shelfLevel: data.shelfLevel, binNumber: data.binNumber, locationNotes: data.locationNotes,
        }, include: includeMasterData,
      });
      const part = toSparePart(updated);
      const index = memoryStore.parts.findIndex(p => p.id === id);
      if (index >= 0) memoryStore.parts[index] = part;
      return part;
    }
    const index = memoryStore.parts.findIndex(p => p.id === id);
    if (index < 0) return null;
    memoryStore.parts[index] = { ...memoryStore.parts[index], ...data, lastUpdated: new Date().toISOString() };
    return memoryStore.parts[index];
  }

  async delete(id: string): Promise<boolean> {
    if (isDbConnected()) await prisma.sparePart.delete({ where: { id } });
    memoryStore.parts = memoryStore.parts.filter(p => p.id !== id);
    return true;
  }

  async adjustStock(id: string, delta: number, newPurchasePrice?: number): Promise<SparePart | null> {
    if (isDbConnected()) {
      const updated = await prisma.sparePart.update({
        where: { id },
        data: { stock: { increment: delta }, purchasePrice: newPurchasePrice && newPurchasePrice > 0 ? newPurchasePrice : undefined },
        include: includeMasterData,
      });
      const part = toSparePart(updated);
      const index = memoryStore.parts.findIndex(p => p.id === id);
      if (index >= 0) memoryStore.parts[index] = part;
      return part;
    }
    const index = memoryStore.parts.findIndex(p => p.id === id);
    if (index < 0) return null;
    memoryStore.parts[index] = {
      ...memoryStore.parts[index], stock: Math.max(0, memoryStore.parts[index].stock + delta),
      purchasePrice: newPurchasePrice && newPurchasePrice > 0 ? newPurchasePrice : memoryStore.parts[index].purchasePrice,
      lastUpdated: new Date().toISOString(),
    };
    return memoryStore.parts[index];
  }
}
