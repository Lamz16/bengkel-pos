import { Request, Response } from 'express';
import { prisma, isDbConnected } from '../db/connection';
import { memoryStore } from '../db/memoryStore';

const makeLevelCode = (index: number) => String.fromCharCode(65 + index);
const asLocation = (location: any) => ({
  id: location.id, zoneId: location.zoneId, zoneName: location.zone?.name,
  type: location.type, code: location.code, name: location.name,
  rackId: location.rackId || undefined, levelCode: location.level?.code || undefined,
  slotCode: location.slotCode || undefined, positionNote: location.positionNote || undefined, description: location.description || location.rack?.description || undefined,
  isActive: location.isActive, stockCount: location.partStocks?.reduce((sum: number, row: any) => sum + row.quantity, 0) || 0,
});

export class StorageLocationController {
  list = async (_req: Request, res: Response) => {
    try {
      if (!isDbConnected()) return res.json((memoryStore as any).storageLocations || []);
      const locations = await (prisma as any).storageLocation.findMany({
        include: { zone: true, level: true, partStocks: true }, orderBy: [{ code: 'asc' }]
      });
      res.json(locations.map(asLocation));
    } catch (error: any) { res.status(500).json({ error: error.message || 'Gagal memuat lokasi stok.' }); }
  };

  createRackLayout = async (req: Request, res: Response) => {
    const { code, name, zoneId, description, levelCount, slotsPerLevel } = req.body;
    const levels = Number(levelCount);
    const slots = Number(slotsPerLevel);
    if (!code?.trim() || !zoneId || !Number.isInteger(levels) || levels < 1 || levels > 26 || !Number.isInteger(slots) || slots < 1 || slots > 99) {
      return res.status(400).json({ error: 'Kode, zona, jumlah tingkat (1-26), dan slot per tingkat (1-99) wajib valid.' });
    }
    try {
      if (!isDbConnected()) {
        const rack = { id: `rack-${Date.now()}`, code: code.trim().toUpperCase(), name: name?.trim() || code.trim().toUpperCase(), zoneId, description };
        const created = Array.from({ length: levels }, (_, levelIndex) => Array.from({ length: slots }, (_, slotIndex) => ({
          id: `loc-${Date.now()}-${levelIndex}-${slotIndex}`, zoneId, type: 'RACK_SLOT', code: `${rack.code}-${makeLevelCode(levelIndex)}-${String(slotIndex + 1).padStart(2, '0')}`, name: `${rack.code} Tingkat ${makeLevelCode(levelIndex)} Slot ${String(slotIndex + 1).padStart(2, '0')}`, rackId: rack.id, levelCode: makeLevelCode(levelIndex), slotCode: String(slotIndex + 1).padStart(2, '0'), description, positionNote, isActive: true, stockCount: 0
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
}
export const storageLocationController = new StorageLocationController();