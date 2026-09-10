import { Request, Response } from 'express';
import { supplierService } from '../container';

export class SupplierController {
  async getSuppliers(_req: Request, res: Response) {
    try {
      const suppliers = await supplierService.getSuppliers();
      res.json(suppliers);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal memuat pemasok' });
    }
  }

  async createSupplier(req: Request, res: Response) {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Nama supplier wajib diisi.' });
      }
      const supplier = await supplierService.createSupplier(req.body);
      res.status(201).json(supplier);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal menambahkan pemasok' });
    }
  }

  async updateSupplier(req: Request, res: Response) {
    try {
      const updated = await supplierService.updateSupplier(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'Pemasok tidak ditemukan' });
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal memperbarui pemasok' });
    }
  }

  async deleteSupplier(req: Request, res: Response) {
    try {
      await supplierService.deleteSupplier(req.params.id);
      res.json({ success: true, message: 'Pemasok berhasil dihapus' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal menghapus pemasok' });
    }
  }
}

export const supplierController = new SupplierController();
