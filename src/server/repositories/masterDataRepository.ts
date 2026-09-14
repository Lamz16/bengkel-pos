import { PartCategory, WarehouseRack, WarehouseZone } from '../../types';
import { prisma, isDbConnected } from '../db/connection';
import { memoryStore } from '../db/memoryStore';

export class MasterDataInUseError extends Error {}
export class MasterDataDuplicateError extends Error {}

const clean = (value?: string) => value?.trim() || undefined;

export class MasterDataRepository {
  async getCategories(): Promise<PartCategory[]> {
    if (isDbConnected()) {
      const rows = await prisma.partCategory.findMany({ orderBy: { name: 'asc' } });
      return rows.map(({ id, name, skuPrefix, description }) => ({
        id, name, skuPrefix, description: description || undefined,
      }));
    }
    return memoryStore.categories;
  }

  async createCategory(data: Omit<PartCategory, 'id'>): Promise<PartCategory> {
    const name = clean(data.name)!;
    const skuPrefix = (clean(data.skuPrefix) || name.slice(0, 3) || 'PRT').toUpperCase();
    if (isDbConnected()) {
      try {
        const row = await prisma.partCategory.create({
          data: { name, skuPrefix, description: clean(data.description) },
        });
        return { ...row, description: row.description || undefined };
      } catch (error: any) {
        if (error?.code === 'P2002') throw new MasterDataDuplicateError('Nama kategori atau prefix SKU sudah digunakan.');
        throw error;
      }
    }
    if (memoryStore.categories.some(c => c.name.toLowerCase() === name.toLowerCase() || c.skuPrefix === skuPrefix)) {
      throw new MasterDataDuplicateError('Nama kategori atau prefix SKU sudah digunakan.');
    }
    const row = { id: `cat-${Date.now()}`, name, skuPrefix, description: clean(data.description) };
    memoryStore.categories.push(row);
    return row;
  }

  async updateCategory(id: string, data: Partial<PartCategory>): Promise<PartCategory> {
    if (isDbConnected()) {
      try {
        const row = await prisma.partCategory.update({
          where: { id },
          data: {
            name: clean(data.name),
            skuPrefix: data.skuPrefix ? data.skuPrefix.trim().toUpperCase() : undefined,
            description: data.description === undefined ? undefined : clean(data.description) || null,
          },
        });
        return { ...row, description: row.description || undefined };
      } catch (error: any) {
        if (error?.code === 'P2002') throw new MasterDataDuplicateError('Nama kategori atau prefix SKU sudah digunakan.');
        throw error;
      }
    }
    const index = memoryStore.categories.findIndex(c => c.id === id);
    if (index < 0) throw new Error('Kategori tidak ditemukan.');
    memoryStore.categories[index] = { ...memoryStore.categories[index], ...data };
    return memoryStore.categories[index];
  }

  async deleteCategory(id: string): Promise<void> {
    if (isDbConnected()) {
      if (await prisma.sparePart.count({ where: { categoryId: id } })) {
        throw new MasterDataInUseError('Kategori masih digunakan oleh barang dan tidak dapat dihapus.');
      }
      await prisma.partCategory.delete({ where: { id } });
      return;
    }
    const category = memoryStore.categories.find(c => c.id === id);
    if (category && memoryStore.parts.some(p => p.categoryId === id || p.category === category.name)) {
      throw new MasterDataInUseError('Kategori masih digunakan oleh barang dan tidak dapat dihapus.');
    }
    memoryStore.categories = memoryStore.categories.filter(c => c.id !== id);
  }

  async getZones(): Promise<WarehouseZone[]> {
    if (isDbConnected()) {
      const rows = await prisma.warehouseZone.findMany({ orderBy: { name: 'asc' } });
      return rows.map(({ id, name, description }) => ({ id, name, description: description || undefined }));
    }
    return memoryStore.zones;
  }

  async createZone(data: Omit<WarehouseZone, 'id'>): Promise<WarehouseZone> {
    const name = clean(data.name)!;
    if (isDbConnected()) {
      try {
        const row = await prisma.warehouseZone.create({ data: { name, description: clean(data.description) } });
        return { ...row, description: row.description || undefined };
      } catch (error: any) {
        if (error?.code === 'P2002') throw new MasterDataDuplicateError('Nama gudang sudah digunakan.');
        throw error;
      }
    }
    if (memoryStore.zones.some(z => z.name.toLowerCase() === name.toLowerCase())) throw new MasterDataDuplicateError('Nama gudang sudah digunakan.');
    const row = { id: `zone-${Date.now()}`, name, description: clean(data.description) };
    memoryStore.zones.push(row);
    return row;
  }

  async updateZone(id: string, data: Partial<WarehouseZone>): Promise<WarehouseZone> {
    if (isDbConnected()) {
      try {
        const row = await prisma.warehouseZone.update({
          where: { id },
          data: { name: clean(data.name), description: data.description === undefined ? undefined : clean(data.description) || null },
        });
        return { ...row, description: row.description || undefined };
      } catch (error: any) {
        if (error?.code === 'P2002') throw new MasterDataDuplicateError('Nama gudang sudah digunakan.');
        throw error;
      }
    }
    const index = memoryStore.zones.findIndex(z => z.id === id);
    if (index < 0) throw new Error('Gudang tidak ditemukan.');
    memoryStore.zones[index] = { ...memoryStore.zones[index], ...data };
    return memoryStore.zones[index];
  }

  async deleteZone(id: string): Promise<void> {
    if (isDbConnected()) {
      if (await prisma.warehouseRack.count({ where: { zoneId: id } })) throw new MasterDataInUseError('Gudang masih memiliki rak dan tidak dapat dihapus.');
      await prisma.warehouseZone.delete({ where: { id } });
      return;
    }
    if (memoryStore.racks.some(r => r.zoneId === id)) throw new MasterDataInUseError('Gudang masih memiliki rak dan tidak dapat dihapus.');
    memoryStore.zones = memoryStore.zones.filter(z => z.id !== id);
  }

  async getRacks(): Promise<WarehouseRack[]> {
    if (isDbConnected()) {
      const rows = await prisma.warehouseRack.findMany({ include: { zone: true }, orderBy: { code: 'asc' } });
      return rows.map(r => ({ id: r.id, code: r.code, name: r.name, zoneId: r.zoneId, zone: r.zone.name, description: r.description || undefined }));
    }
    return memoryStore.racks;
  }

  async createRack(data: Omit<WarehouseRack, 'id'>): Promise<WarehouseRack> {
    const zoneId = data.zoneId || memoryStore.zones.find(z => z.name === data.zone)?.id;
    if (!zoneId) throw new Error('Gudang untuk rak wajib dipilih.');
    if (isDbConnected()) {
      try {
        const row = await prisma.warehouseRack.create({
          data: { code: data.code.trim(), name: data.name.trim(), zoneId, description: clean(data.description) }, include: { zone: true },
        });
        return { id: row.id, code: row.code, name: row.name, zoneId: row.zoneId, zone: row.zone.name, description: row.description || undefined };
      } catch (error: any) {
        if (error?.code === 'P2002') throw new MasterDataDuplicateError('Kode rak sudah digunakan.');
        throw error;
      }
    }
    if (memoryStore.racks.some(r => r.code.toLowerCase() === data.code.trim().toLowerCase())) throw new MasterDataDuplicateError('Kode rak sudah digunakan.');
    const zone = memoryStore.zones.find(z => z.id === zoneId)!;
    const row = { ...data, id: `rack-${Date.now()}`, code: data.code.trim(), name: data.name.trim(), zoneId, zone: zone.name };
    memoryStore.racks.push(row);
    return row;
  }

  async updateRack(id: string, data: Partial<WarehouseRack>): Promise<WarehouseRack> {
    if (isDbConnected()) {
      try {
        const row = await prisma.warehouseRack.update({
          where: { id },
          data: { code: clean(data.code), name: clean(data.name), zoneId: data.zoneId, description: data.description === undefined ? undefined : clean(data.description) || null },
          include: { zone: true },
        });
        return { id: row.id, code: row.code, name: row.name, zoneId: row.zoneId, zone: row.zone.name, description: row.description || undefined };
      } catch (error: any) {
        if (error?.code === 'P2002') throw new MasterDataDuplicateError('Kode rak sudah digunakan.');
        throw error;
      }
    }
    const index = memoryStore.racks.findIndex(r => r.id === id);
    if (index < 0) throw new Error('Rak tidak ditemukan.');
    const zone = data.zoneId ? memoryStore.zones.find(z => z.id === data.zoneId) : undefined;
    memoryStore.racks[index] = { ...memoryStore.racks[index], ...data, ...(zone ? { zone: zone.name } : {}) };
    return memoryStore.racks[index];
  }

  async deleteRack(id: string): Promise<void> {
    if (isDbConnected()) {
      if (await prisma.sparePart.count({ where: { rackId: id } })) throw new MasterDataInUseError('Rak masih digunakan oleh barang dan tidak dapat dihapus.');
      await prisma.warehouseRack.delete({ where: { id } });
      return;
    }
    const rack = memoryStore.racks.find(r => r.id === id);
    if (rack && memoryStore.parts.some(p => p.rackId === id || p.rackCode === rack.code)) throw new MasterDataInUseError('Rak masih digunakan oleh barang dan tidak dapat dihapus.');
    memoryStore.racks = memoryStore.racks.filter(r => r.id !== id);
  }
}

export const masterDataRepository = new MasterDataRepository();
