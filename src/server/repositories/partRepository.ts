import { IPartRepository } from './interfaces';
import { SparePart } from '../../types';
import { prisma, isDbConnected } from '../db/connection';
import { memoryStore } from '../db/memoryStore';

export class PartRepository implements IPartRepository {
  async getAll(): Promise<SparePart[]> {
    if (isDbConnected()) {
      try {
        const list = await prisma.sparePart.findMany({
          orderBy: { name: 'asc' }
        });
        return list.map(p => ({
          id: p.id,
          sku: p.sku || undefined,
          barcode: p.barcode || undefined,
          name: p.name,
          category: p.category,
          price: p.price,
          purchasePrice: p.purchasePrice,
          stock: p.stock,
          minStock: p.minStock,
          supplierId: p.supplierId || undefined,
          imageUrl: p.imageUrl || undefined,
          rackCode: p.rackCode || undefined,
          shelfLevel: p.shelfLevel || undefined,
          binNumber: p.binNumber || undefined,
          rackLocation: p.rackLocation || undefined,
          rackZone: p.rackZone || undefined,
          locationNotes: p.locationNotes || undefined,
          lastUpdated: p.updatedAt.toISOString(),
        }));
      } catch (err) {
        console.error('[PartRepo] Prisma getAll error:', err);
      }
    }
    return memoryStore.parts;
  }

  async getById(id: string): Promise<SparePart | null> {
    if (isDbConnected()) {
      try {
        const p = await prisma.sparePart.findUnique({ where: { id } });
        if (p) {
          return {
            id: p.id,
            sku: p.sku || undefined,
            barcode: p.barcode || undefined,
            name: p.name,
            category: p.category,
            price: p.price,
            purchasePrice: p.purchasePrice,
            stock: p.stock,
            minStock: p.minStock,
            supplierId: p.supplierId || undefined,
            imageUrl: p.imageUrl || undefined,
            rackCode: p.rackCode || undefined,
            shelfLevel: p.shelfLevel || undefined,
            binNumber: p.binNumber || undefined,
            rackLocation: p.rackLocation || undefined,
            rackZone: p.rackZone || undefined,
            locationNotes: p.locationNotes || undefined,
            lastUpdated: p.updatedAt.toISOString(),
          };
        }
      } catch (err) {
        console.error('[PartRepo] Prisma getById error:', err);
      }
    }
    return memoryStore.parts.find(p => p.id === id) || null;
  }

  async create(data: Omit<SparePart, 'id' | 'lastUpdated'>): Promise<SparePart> {
    const id = `P${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString();
    if (isDbConnected()) {
      try {
        const created = await prisma.sparePart.create({
          data: {
            id,
            sku: data.sku,
            barcode: data.barcode,
            name: data.name,
            category: data.category,
            price: data.price,
            purchasePrice: data.purchasePrice || 0,
            stock: data.stock || 0,
            minStock: data.minStock || 5,
            supplierId: data.supplierId,
            imageUrl: data.imageUrl,
            rackCode: data.rackCode,
            shelfLevel: data.shelfLevel,
            binNumber: data.binNumber,
            rackLocation: data.rackLocation,
            rackZone: data.rackZone,
            locationNotes: data.locationNotes,
          }
        });
        const part: SparePart = {
          id: created.id,
          sku: created.sku || undefined,
          barcode: created.barcode || undefined,
          name: created.name,
          category: created.category,
          price: created.price,
          purchasePrice: created.purchasePrice,
          stock: created.stock,
          minStock: created.minStock,
          supplierId: created.supplierId || undefined,
          imageUrl: created.imageUrl || undefined,
          rackCode: created.rackCode || undefined,
          shelfLevel: created.shelfLevel || undefined,
          binNumber: created.binNumber || undefined,
          rackLocation: created.rackLocation || undefined,
          rackZone: created.rackZone || undefined,
          locationNotes: created.locationNotes || undefined,
          lastUpdated: created.updatedAt.toISOString(),
        };
        memoryStore.parts.unshift(part);
        return part;
      } catch (err) {
        console.error('[PartRepo] Prisma create error:', err);
      }
    }
    const part: SparePart = { id, lastUpdated: now, ...data };
    memoryStore.parts.unshift(part);
    return part;
  }

  async update(id: string, data: Partial<SparePart>): Promise<SparePart | null> {
    const now = new Date().toISOString();
    if (isDbConnected()) {
      try {
        const updated = await prisma.sparePart.update({
          where: { id },
          data: {
            sku: data.sku,
            barcode: data.barcode,
            name: data.name,
            category: data.category,
            price: data.price,
            purchasePrice: data.purchasePrice,
            stock: data.stock,
            minStock: data.minStock,
            supplierId: data.supplierId,
            imageUrl: data.imageUrl,
            rackCode: data.rackCode,
            shelfLevel: data.shelfLevel,
            binNumber: data.binNumber,
            rackLocation: data.rackLocation,
            rackZone: data.rackZone,
            locationNotes: data.locationNotes,
          }
        });
        const part: SparePart = {
          id: updated.id,
          sku: updated.sku || undefined,
          barcode: updated.barcode || undefined,
          name: updated.name,
          category: updated.category,
          price: updated.price,
          purchasePrice: updated.purchasePrice,
          stock: updated.stock,
          minStock: updated.minStock,
          supplierId: updated.supplierId || undefined,
          imageUrl: updated.imageUrl || undefined,
          rackCode: updated.rackCode || undefined,
          shelfLevel: updated.shelfLevel || undefined,
          binNumber: updated.binNumber || undefined,
          rackLocation: updated.rackLocation || undefined,
          rackZone: updated.rackZone || undefined,
          locationNotes: updated.locationNotes || undefined,
          lastUpdated: updated.updatedAt.toISOString(),
        };
        const idx = memoryStore.parts.findIndex(p => p.id === id);
        if (idx !== -1) memoryStore.parts[idx] = part;
        return part;
      } catch (err) {
        console.error('[PartRepo] Prisma update error:', err);
      }
    }
    const idx = memoryStore.parts.findIndex(p => p.id === id);
    if (idx === -1) return null;
    memoryStore.parts[idx] = { ...memoryStore.parts[idx], ...data, lastUpdated: now };
    return memoryStore.parts[idx];
  }

  async delete(id: string): Promise<boolean> {
    if (isDbConnected()) {
      try {
        await prisma.sparePart.delete({ where: { id } });
      } catch (err) {
        console.error('[PartRepo] Prisma delete error:', err);
      }
    }
    memoryStore.parts = memoryStore.parts.filter(p => p.id !== id);
    return true;
  }

  async adjustStock(id: string, delta: number, newPurchasePrice?: number): Promise<SparePart | null> {
    const now = new Date();
    if (isDbConnected()) {
      try {
        const updated = await prisma.sparePart.update({
          where: { id },
          data: {
            stock: { increment: delta },
            purchasePrice: newPurchasePrice && newPurchasePrice > 0 ? newPurchasePrice : undefined,
          }
        });
        const part: SparePart = {
          id: updated.id,
          sku: updated.sku || undefined,
          barcode: updated.barcode || undefined,
          name: updated.name,
          category: updated.category,
          price: updated.price,
          purchasePrice: updated.purchasePrice,
          stock: updated.stock,
          minStock: updated.minStock,
          supplierId: updated.supplierId || undefined,
          imageUrl: updated.imageUrl || undefined,
          rackCode: updated.rackCode || undefined,
          shelfLevel: updated.shelfLevel || undefined,
          binNumber: updated.binNumber || undefined,
          rackLocation: updated.rackLocation || undefined,
          rackZone: updated.rackZone || undefined,
          locationNotes: updated.locationNotes || undefined,
          lastUpdated: updated.updatedAt.toISOString(),
        };
        const idx = memoryStore.parts.findIndex(p => p.id === id);
        if (idx !== -1) memoryStore.parts[idx] = part;
        return part;
      } catch (err) {
        console.error('[PartRepo] Prisma adjustStock error:', err);
      }
    }

    const idx = memoryStore.parts.findIndex(p => p.id === id);
    if (idx === -1) return null;
    memoryStore.parts[idx] = {
      ...memoryStore.parts[idx],
      stock: Math.max(0, memoryStore.parts[idx].stock + delta),
      purchasePrice: newPurchasePrice && newPurchasePrice > 0 ? newPurchasePrice : memoryStore.parts[idx].purchasePrice,
      lastUpdated: now.toISOString()
    };
    return memoryStore.parts[idx];
  }
}
