import { Request, Response } from 'express';
import { prisma, isDbConnected } from '../db/connection';
import { memoryStore } from '../db/memoryStore';

const makeLevelCode = (index: number) => String.fromCharCode(65 + index);
const asLocation = (location: any) => ({
  id: location.id, zoneId: location.zoneId, zoneName: location.zone?.name,
  type: location.type, code: location.code, name: location.name,
  rackId: location.rackId || undefined, rackName: location.rack?.name || undefined,
  levelCode: location.level?.code || undefined,
  slotCode: location.slotCode || undefined, positionNote: location.positionNote || undefined, description: location.description || location.rack?.description || undefined,
  isActive: location.isActive, stockCount: location.partStocks?.reduce((sum: number, row: any) => sum + row.quantity, 0) || 0,
});

export class StorageLocationController {
  list = async (_req: Request, res: Response) => {
    try {
      if (!isDbConnected()) return res.json((memoryStore as any).storageLocations || []);
      const locations = await (prisma as any).storageLocation.findMany({
        include: { zone: true, rack: true, level: true, partStocks: true }, orderBy: [{ code: 'asc' }]
      });
      res.json(locations.map(asLocation));
    } catch (error: any) { res.status(500).json({ error: error.message || 'Gagal memuat lokasi stok.' }); }
  };

  createRackLayout = async (req: Request, res: Response) => {
    const { code, name, zoneId, description, positionNote, levelCount, slotsPerLevel } = req.body;
    const levels = Number(levelCount);
    const slots = Number(slotsPerLevel);
    if (!code?.trim() || !zoneId || !Number.isInteger(levels) || levels < 1 || levels > 26 || !Number.isInteger(slots) || slots < 1 || slots > 99) {
      return res.status(400).json({ error: 'Kode, zona, jumlah tingkat (1-26), dan slot per tingkat (1-99) wajib valid.' });
    }
    try {
      if (!isDbConnected()) {
        const rack = { id: `rack-${Date.now()}`, code: code.trim().toUpperCase(), name: name?.trim() || code.trim().toUpperCase(), zoneId, description };
        const created = Array.from({ length: levels }, (_, levelIndex) => Array.from({ length: slots }, (_, slotIndex) => ({
          id: `loc-${Date.now()}-${levelIndex}-${slotIndex}`, zoneId, type: 'RACK_SLOT', code: `${rack.code}-${makeLevelCode(levelIndex)}-${String(slotIndex + 1).padStart(2, '0')}`, name: `${rack.code} Tingkat ${makeLevelCode(levelIndex)} Slot ${String(slotIndex + 1).padStart(2, '0')}`, rackId: rack.id, rackName: rack.name, levelCode: makeLevelCode(levelIndex), slotCode: String(slotIndex + 1).padStart(2, '0'), description, positionNote, isActive: true, stockCount: 0
        }))).flat();
        (memoryStore as any).storageLocations = [...((memoryStore as any).storageLocations || []), ...created];
        return res.status(201).json({ rack, locations: created });
      }
      const result = await (prisma as any).$transaction(async (tx: any) => {
        const rack = await tx.warehouseRack.create({ data: { code: code.trim().toUpperCase(), name: name?.trim() || code.trim().toUpperCase(), zoneId, description: description || null } });
        const locations: any[] = [];
        for (let levelIndex = 0; levelIndex < levels; levelIndex += 1) {
          const level = await tx.rackLevel.create({ data: { rackId: rack.id, code: makeLevelCode(levelIndex), sortOrder: levelIndex + 1, slotCount: slots } });
          for (let slotIndex = 0; slotIndex < slots; slotIndex += 1) {
            const slotCode = String(slotIndex + 1).padStart(2, '0');
            locations.push(await tx.storageLocation.create({ data: { zoneId, type: 'RACK_SLOT', code: `${rack.code}-${level.code}-${slotCode}`, name: `${rack.code} Tingkat ${level.code} Slot ${slotCode}`, rackId: rack.id, levelId: level.id, slotCode, description: description || null, positionNote: positionNote || null } }));
          }
        }
        return { rack, locations };
      });
      res.status(201).json(result);
    } catch (error: any) { res.status(error?.code === 'P2002' ? 409 : 500).json({ error: error.message || 'Gagal membuat peta rak.' }); }
  };

  createNonRack = async (req: Request, res: Response) => {
    const { zoneId, type, code, name, positionNote, description } = req.body;
    if (!zoneId || !['CARTON', 'DISPLAY', 'TEMPORARY'].includes(type) || !code?.trim()) return res.status(400).json({ error: 'Zona, tipe, dan kode lokasi wajib diisi.' });
    try {
      if (!isDbConnected()) {
        const item = { id: `loc-${Date.now()}`, zoneId, type, code: code.trim().toUpperCase(), name: name?.trim() || code.trim().toUpperCase(), positionNote, description, isActive: true, stockCount: 0 };
        (memoryStore as any).storageLocations = [...((memoryStore as any).storageLocations || []), item];
        return res.status(201).json(item);
      }
      const item = await (prisma as any).storageLocation.create({ data: { zoneId, type, code: code.trim().toUpperCase(), name: name?.trim() || code.trim().toUpperCase(), positionNote: positionNote || null, description: description || null } });
      res.status(201).json(asLocation(item));
    } catch (error: any) { res.status(error?.code === 'P2002' ? 409 : 500).json({ error: error.message || 'Gagal membuat lokasi.' }); }
  };

  updateRack = async (req: Request, res: Response) => {
    const { name, description, positionNote } = req.body;
    try {
      if (!isDbConnected()) {
        const locations = (memoryStore as any).storageLocations || [];
        (memoryStore as any).storageLocations = locations.map((item: any) => item.rackId === req.params.rackId ? { ...item, rackName: name || item.rackName, description, positionNote } : item);
        return res.json({ success: true });
      }
      const result = await (prisma as any).$transaction(async (tx: any) => {
        const rack = await tx.warehouseRack.update({ where: { id: req.params.rackId }, data: { ...(name ? { name } : {}), description: description || null } });
        await tx.storageLocation.updateMany({ where: { rackId: req.params.rackId }, data: { description: description || null, positionNote: positionNote || null } });
        return rack;
      });
      res.json(result);
    } catch (error: any) { res.status(error?.code === 'P2025' ? 404 : 500).json({ error: error.message || 'Gagal memperbarui rak.' }); }
  };

  deleteRack = async (req: Request, res: Response) => {
    try {
      if (!isDbConnected()) {
        (memoryStore as any).storageLocations = ((memoryStore as any).storageLocations || []).filter((item: any) => item.rackId !== req.params.rackId);
        return res.json({ success: true });
      }
      const stockCount = await (prisma as any).partLocationStock.count({ where: { location: { rackId: req.params.rackId }, quantity: { gt: 0 } } });
      if (stockCount > 0) return res.status(409).json({ error: 'Rak tidak dapat dihapus karena masih memiliki stok. Pindahkan stok terlebih dahulu.' });
      await (prisma as any).$transaction(async (tx: any) => {
        await tx.sparePart.updateMany({ where: { rackId: req.params.rackId }, data: { rackId: null, shelfLevel: null, binNumber: null } });
        await tx.warehouseRack.delete({ where: { id: req.params.rackId } });
      });
      res.json({ success: true });
    } catch (error: any) { res.status(error?.code === 'P2025' ? 404 : 500).json({ error: error.message || 'Gagal menghapus rak.' }); }
  };

  updateNonRack = async (req: Request, res: Response) => {
    try {
      if (!isDbConnected()) {
        (memoryStore as any).storageLocations = ((memoryStore as any).storageLocations || []).map((item: any) => item.id === req.params.id ? { ...item, ...req.body } : item);
        return res.json({ success: true });
      }
      const item = await (prisma as any).storageLocation.update({ where: { id: req.params.id }, data: { name: req.body.name, positionNote: req.body.positionNote || null, description: req.body.description || null } });
      res.json(asLocation(item));
    } catch (error: any) { res.status(error?.code === 'P2025' ? 404 : 500).json({ error: error.message || 'Gagal memperbarui lokasi.' }); }
  };

  deleteNonRack = async (req: Request, res: Response) => {
    try {
      if (!isDbConnected()) {
        (memoryStore as any).storageLocations = ((memoryStore as any).storageLocations || []).filter((item: any) => item.id !== req.params.id);
        return res.json({ success: true });
      }
      const stockCount = await (prisma as any).partLocationStock.count({ where: { locationId: req.params.id, quantity: { gt: 0 } } });
      if (stockCount > 0) return res.status(409).json({ error: 'Lokasi tidak dapat dihapus karena masih memiliki stok.' });
      await (prisma as any).storageLocation.delete({ where: { id: req.params.id } });
      res.json({ success: true });
    } catch (error: any) { res.status(error?.code === 'P2025' ? 404 : 500).json({ error: error.message || 'Gagal menghapus lokasi.' }); }
  };
}
export const storageLocationController = new StorageLocationController();
