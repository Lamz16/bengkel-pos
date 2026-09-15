import { Request, Response } from 'express';
import { inventoryService } from '../container';

export class PartController {
  async getParts(req: Request, res: Response) {
    try {
      const page = req.query.page ? Number(req.query.page) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const search = req.query.search as string | undefined;

      if (page || limit || search) {
        const paginated = await (inventoryService as any).partRepo.getPaginated({ page, limit, search });
        return res.json(paginated);
      }

      const parts = await inventoryService.getParts();
      res.json(parts);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal memuat suku cadang' });
    }
  }

  async getStockHistory(req: Request, res: Response) {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const search = req.query.search as string | undefined;

      const history = await (inventoryService as any).partRepo.getStockHistoryPaginated({ page, limit, search });
      res.json(history);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal memuat riwayat stok' });
    }
  }

  async createPart(req: Request, res: Response) {
    try {
      const { name, category, price } = req.body;
      if (!name || !category || price === undefined) {
        return res.status(400).json({ error: 'Nama, kategori, dan harga jual wajib diisi.' });
      }
      const part = await inventoryService.createPart(req.body);
      res.status(201).json(part);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal menambahkan suku cadang' });
    }
  }

  async updatePart(req: Request, res: Response) {
    try {
      const { version, expectedVersion } = req.body;
      const expVer = expectedVersion !== undefined ? Number(expectedVersion) : (version !== undefined ? Number(version) : undefined);
      const updated = await (inventoryService as any).partRepo.update(req.params.id, req.body, expVer);
      if (!updated) {
        return res.status(404).json({ error: 'Suku cadang tidak ditemukan' });
      }
      res.json(updated);
    } catch (err: any) {
      const isConflict = String(err.message).includes('Optimistic Lock') || String(err.message).includes('telah diubah oleh kasir');
      res.status(isConflict ? 409 : 500).json({ error: err.message || 'Gagal memperbarui suku cadang' });
    }
  }

  async deletePart(req: Request, res: Response) {
    try {
      await inventoryService.deletePart(req.params.id);
      res.json({ success: true, message: 'Suku cadang berhasil dihapus' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal menghapus suku cadang' });
    }
  }

  async addStock(req: Request, res: Response) {
    try {
      const { amount, supplierId, costPrice } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Jumlah stok harus lebih besar dari 0.' });
      }
      const updated = await inventoryService.addStock(
        req.params.id,
        Number(amount),
        supplierId,
        costPrice ? Number(costPrice) : 0
      );
      if (!updated) {
        return res.status(404).json({ error: 'Suku cadang tidak ditemukan' });
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal menambahkan stok' });
    }
  }
}

export const partController = new PartController();
