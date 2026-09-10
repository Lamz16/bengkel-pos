import { Request, Response } from 'express';
import { inventoryService } from '../container';

export class PartController {
  async getParts(_req: Request, res: Response) {
    try {
      const parts = await inventoryService.getParts();
      res.json(parts);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal memuat suku cadang' });
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
      const updated = await inventoryService.updatePart(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'Suku cadang tidak ditemukan' });
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal memperbarui suku cadang' });
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
