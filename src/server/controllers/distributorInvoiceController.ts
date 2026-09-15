import { Request, Response } from 'express';
import { distributorInvoiceRepository } from '../repositories/distributorInvoiceRepository';

export class DistributorInvoiceController {
  async getAll(req: Request, res: Response) {
    try {
      const list = await distributorInvoiceRepository.getAll();
      res.json(list);
    } catch (err: any) {
      console.error('[DistributorInvoiceController] getAll error:', err);
      res.status(500).json({ error: 'Gagal mengambil daftar nota tempo' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const created = await distributorInvoiceRepository.create(req.body);
      res.status(201).json(created);
    } catch (err: any) {
      console.error('[DistributorInvoiceController] create error:', err);
      res.status(500).json({ error: 'Gagal membuat nota tempo distributor' });
    }
  }

  async addPayment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updated = await distributorInvoiceRepository.addPayment(id, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'Nota tempo tidak ditemukan' });
      }
      res.json(updated);
    } catch (err: any) {
      console.error('[DistributorInvoiceController] addPayment error:', err);
      const invalid = err?.message === 'INVALID_PAYMENT';
      res.status(invalid ? 400 : 500).json({ error: invalid ? 'Nominal pembayaran tidak valid atau melebihi sisa tagihan.' : 'Gagal mencatat pembayaran cicilan' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await distributorInvoiceRepository.delete(id);
      res.json({ success: true, id });
    } catch (err: any) {
      console.error('[DistributorInvoiceController] delete error:', err);
      res.status(500).json({ error: 'Gagal menghapus nota tempo' });
    }
  }
}

export const distributorInvoiceController = new DistributorInvoiceController();
