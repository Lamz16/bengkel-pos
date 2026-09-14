import { Request, Response } from 'express';
import { masterDataRepository, MasterDataDuplicateError, MasterDataInUseError } from '../repositories/masterDataRepository';

const handleError = (res: Response, error: any) => {
  if (error instanceof MasterDataDuplicateError) return res.status(409).json({ error: error.message });
  if (error instanceof MasterDataInUseError) return res.status(409).json({ error: error.message });
  if (error?.code === 'P2025') return res.status(404).json({ error: 'Data master tidak ditemukan.' });
  return res.status(500).json({ error: error?.message || 'Gagal memproses data master.' });
};

export class MasterDataController {
  getCategories = async (_req: Request, res: Response) => res.json(await masterDataRepository.getCategories());
  createCategory = async (req: Request, res: Response) => {
    try {
      if (!req.body.name?.trim()) return res.status(400).json({ error: 'Nama kategori wajib diisi.' });
      res.status(201).json(await masterDataRepository.createCategory(req.body));
    } catch (error) { handleError(res, error); }
  };
  updateCategory = async (req: Request, res: Response) => {
    try { res.json(await masterDataRepository.updateCategory(req.params.id, req.body)); } catch (error) { handleError(res, error); }
  };
  deleteCategory = async (req: Request, res: Response) => {
    try { await masterDataRepository.deleteCategory(req.params.id); res.json({ success: true }); } catch (error) { handleError(res, error); }
  };

  getZones = async (_req: Request, res: Response) => res.json(await masterDataRepository.getZones());
  createZone = async (req: Request, res: Response) => {
    try {
      if (!req.body.name?.trim()) return res.status(400).json({ error: 'Nama gudang wajib diisi.' });
      res.status(201).json(await masterDataRepository.createZone(req.body));
    } catch (error) { handleError(res, error); }
  };
  updateZone = async (req: Request, res: Response) => {
    try { res.json(await masterDataRepository.updateZone(req.params.id, req.body)); } catch (error) { handleError(res, error); }
  };
  deleteZone = async (req: Request, res: Response) => {
    try { await masterDataRepository.deleteZone(req.params.id); res.json({ success: true }); } catch (error) { handleError(res, error); }
  };

  getRacks = async (_req: Request, res: Response) => res.json(await masterDataRepository.getRacks());
  createRack = async (req: Request, res: Response) => {
    try {
      if (!req.body.code?.trim() || !req.body.zoneId) return res.status(400).json({ error: 'Kode rak dan gudang wajib diisi.' });
      res.status(201).json(await masterDataRepository.createRack(req.body));
    } catch (error) { handleError(res, error); }
  };
  updateRack = async (req: Request, res: Response) => {
    try { res.json(await masterDataRepository.updateRack(req.params.id, req.body)); } catch (error) { handleError(res, error); }
  };
  deleteRack = async (req: Request, res: Response) => {
    try { await masterDataRepository.deleteRack(req.params.id); res.json({ success: true }); } catch (error) { handleError(res, error); }
  };
}

export const masterDataController = new MasterDataController();
