import { IPartRepository, PaginationParams } from './interfaces';
import { SparePart, PaginatedResult, StockHistory } from '../../types';
import { prisma, isDbConnected } from '../db/connection';
import { memoryStore } from '../db/memoryStore';

type PartWithMasterData = any;
const includeMasterData = { category: true, product: true, rack: { include: { zone: true } } } as const;
const toSparePart = (p: PartWithMasterData): SparePart => ({
  id: p.id, sku: p.sku || undefined, barcode: p.barcode || undefined, name: p.product?.name || p.name,
  productId: p.productId || undefined, variantName: p.variantName || 'Standar', size: p.size || undefined,
  categoryId: p.categoryId, category: p.category?.name || 'Umum', price: Number(p.price),
  purchasePrice: Number(p.purchasePrice), stock: p.stock, minStock: p.minStock,
  supplierId: p.supplierId || undefined, imageUrl: p.imageUrl || undefined,
  rackId: p.rackId || undefined, rackCode: p.rack?.code || undefined,
  shelfLevel: p.shelfLevel || undefined, binNumber: p.binNumber || undefined,
  rackLocation: p.rack?.code || undefined, rackZone: p.rack?.zone?.name || undefined,
  locationNotes: p.locationNotes || undefined, version: p.version || 1, lastUpdated: p.updatedAt ? p.updatedAt.toISOString() : new Date().toISOString(),
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

  async getPaginated(params: PaginationParams): Promise<PaginatedResult<SparePart>> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, params.limit || 10);
    const search = params.search?.trim().toLowerCase() || '';

    if (isDbConnected()) {
      try {
        const where = search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { sku: { contains: search, mode: 'insensitive' as const } },
            { barcode: { contains: search, mode: 'insensitive' as const } },
          ],
        } : {};

        const total = await prisma.sparePart.count({ where });
        const list = await prisma.sparePart.findMany({
          where,
          include: includeMasterData,
          orderBy: { name: 'asc' },
          skip: (page - 1) * limit,
          take: limit,
        });

        return {
          data: list.map(toSparePart),
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
        };
      } catch (err) {
        console.error('[PartRepo] Prisma getPaginated error:', err);
      }
    }

    let filtered = memoryStore.parts;
    if (search) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(search) ||
        (p.sku && p.sku.toLowerCase().includes(search)) ||
        (p.barcode && p.barcode.toLowerCase().includes(search))
      );
    }

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginatedData = filtered.slice(startIndex, startIndex + limit);

    return {
      data: paginatedData,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
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
    if (data.stock != null && data.stock < 0) {
      throw new Error('Stok barang tidak boleh negatif.');
    }
    const id = `P${Date.now().toString().slice(-8)}`;
    if (isDbConnected()) {
      const { categoryId, rackId } = await this.resolveMasterIds(data);
      const created = await prisma.$transaction(async tx => {
        const product = data.productId
          ? await tx.product.findUnique({ where: { id: data.productId } })
          : await tx.product.upsert({
              where: { name_categoryId: { name: data.name.trim(), categoryId } },
              create: { name: data.name.trim(), categoryId },
              update: {},
            });
        if (!product) throw new Error('Produk induk tidak ditemukan.');
        return tx.sparePart.create({ data: {
          id, sku: data.sku, barcode: data.barcode, name: data.name, productId: product.id,
          variantName: data.variantName?.trim() || 'Standar', size: data.size?.trim() || '', categoryId,
          price: data.price, purchasePrice: data.purchasePrice || 0, stock: data.stock || 0,
          minStock: data.minStock ?? 5, supplierId: data.supplierId || null, imageUrl: data.imageUrl,
          rackId, shelfLevel: data.shelfLevel, binNumber: data.binNumber, locationNotes: data.locationNotes,
          version: 1,
        }, include: includeMasterData });
      });
      const part = toSparePart(created);
      memoryStore.parts.unshift(part);
      return part;
    }
    const part: SparePart = { id, lastUpdated: new Date().toISOString(), version: 1, ...data };
    memoryStore.parts.unshift(part);
    return part;
  }

  async update(id: string, data: Partial<SparePart>, expectedVersion?: number): Promise<SparePart | null> {
    if (data.stock != null && data.stock < 0) {
      throw new Error('Stok barang tidak boleh negatif.');
    }

    if (isDbConnected()) {
      const current = await prisma.sparePart.findUnique({ where: { id } });
      if (!current) return null;

      if (expectedVersion !== undefined && current.version !== expectedVersion) {
        throw new Error(`Data barang '${current.name}' telah diubah oleh kasir/pengguna lain (Versi saat ini: ${current.version}, versi Anda: ${expectedVersion}). Silakan muat ulang data.`);
      }

      const masterIds = data.categoryId || data.category || data.rackId || data.rackCode
        ? await this.resolveMasterIds(data) : undefined;

      const updated = await prisma.sparePart.update({
        where: { id },
        data: {
          sku: data.sku, barcode: data.barcode, name: data.name, categoryId: masterIds?.categoryId,
          variantName: data.variantName, size: data.size,
          price: data.price, purchasePrice: data.purchasePrice, stock: data.stock, minStock: data.minStock,
          supplierId: data.supplierId, imageUrl: data.imageUrl, rackId: masterIds?.rackId,
          shelfLevel: data.shelfLevel, binNumber: data.binNumber, locationNotes: data.locationNotes,
          version: { increment: 1 },
        }, include: includeMasterData,
      });

      const part = toSparePart(updated);
      const index = memoryStore.parts.findIndex(p => p.id === id);
      if (index >= 0) memoryStore.parts[index] = part;
      return part;
    }

    const index = memoryStore.parts.findIndex(p => p.id === id);
    if (index < 0) return null;
    const current = memoryStore.parts[index];

    if (expectedVersion !== undefined && (current.version || 1) !== expectedVersion) {
      throw new Error(`Data barang '${current.name}' telah diubah oleh kasir/pengguna lain. Silakan muat ulang data.`);
    }

    const newVersion = (current.version || 1) + 1;
    memoryStore.parts[index] = { 
      ...current, 
      ...data, 
      version: newVersion, 
      lastUpdated: new Date().toISOString() 
    };
    return memoryStore.parts[index];
  }

  async delete(id: string): Promise<boolean> {
    if (isDbConnected()) await prisma.sparePart.delete({ where: { id } });
    memoryStore.parts = memoryStore.parts.filter(p => p.id !== id);
    return true;
  }

  async adjustStock(id: string, delta: number, newPurchasePrice?: number): Promise<SparePart | null> {
    if (isDbConnected()) {
      const current = await prisma.sparePart.findUnique({ where: { id } });
      if (!current) return null;

      if (current.stock + delta < 0) {
        throw new Error(`Stok barang '${current.name}' tidak mencukupi (Tersedia: ${current.stock}, Dibutuhkan: ${Math.abs(delta)}). Stok tidak boleh negatif.`);
      }

      const updated = await prisma.sparePart.update({
        where: { id },
        data: { 
          stock: { increment: delta }, 
          purchasePrice: newPurchasePrice && newPurchasePrice > 0 ? newPurchasePrice : undefined,
          version: { increment: 1 },
        },
        include: includeMasterData,
      });
      const part = toSparePart(updated);
      const index = memoryStore.parts.findIndex(p => p.id === id);
      if (index >= 0) memoryStore.parts[index] = part;
      return part;
    }

    const index = memoryStore.parts.findIndex(p => p.id === id);
    if (index < 0) return null;
    const current = memoryStore.parts[index];

    if (current.stock + delta < 0) {
      throw new Error(`Stok barang '${current.name}' tidak mencukupi (Tersedia: ${current.stock}, Dibutuhkan: ${Math.abs(delta)}). Stok tidak boleh negatif.`);
    }

    memoryStore.parts[index] = {
      ...current, 
      stock: current.stock + delta,
      version: (current.version || 1) + 1,
      purchasePrice: newPurchasePrice && newPurchasePrice > 0 ? newPurchasePrice : current.purchasePrice,
      lastUpdated: new Date().toISOString(),
    };
    return memoryStore.parts[index];
  }

  async getStockHistoryPaginated(params: PaginationParams): Promise<PaginatedResult<StockHistory>> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, params.limit || 10);
    const search = params.search?.trim().toLowerCase() || '';

    if (isDbConnected()) {
      try {
        const where = search ? {
          OR: [
            { partName: { contains: search, mode: 'insensitive' as const } },
            { reason: { contains: search, mode: 'insensitive' as const } },
          ],
        } : {};

        const total = await prisma.stockHistory.count({ where });
        const list = await prisma.stockHistory.findMany({
          where,
          orderBy: { date: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        });

        return {
          data: list.map(sh => ({
            id: sh.id,
            partId: sh.partId,
            partName: sh.partName,
            amount: sh.amount,
            type: sh.type as 'In' | 'Out',
            reason: sh.reason,
            date: sh.date.toISOString(),
          })),
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
        };
      } catch (err) {
        console.error('[PartRepo] Prisma getStockHistoryPaginated error:', err);
      }
    }

    // Fallback using memoryStore history or mock history
    const historyList: StockHistory[] = (memoryStore as any).stockHistories || [];
    let filtered = historyList;
    if (search) {
      filtered = filtered.filter(h => 
        h.partName.toLowerCase().includes(search) || 
        h.reason.toLowerCase().includes(search)
      );
    }

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginatedData = filtered.slice(startIndex, startIndex + limit);

    return {
      data: paginatedData,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  }
}
