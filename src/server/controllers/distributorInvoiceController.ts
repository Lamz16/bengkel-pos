import { Request, Response } from 'express';
import { distributorInvoiceRepository } from '../repositories/distributorInvoiceRepository';

export class DistributorInvoiceController {
  async getAll(req: Request, res: Response) {
    try {
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      const branchName = req.query.branchName as string | undefined;
      const supplierId = req.query.supplierId as string | undefined;

      const list = await distributorInvoiceRepository.getAll({ search, status, branchName, supplierId });
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
      const { expectedVersion, version, ...paymentData } = req.body;
      const expVer = expectedVersion !== undefined ? Number(expectedVersion) : (version !== undefined ? Number(version) : undefined);

      const updated = await distributorInvoiceRepository.addPayment(id, paymentData, expVer);
      if (!updated) {
        return res.status(404).json({ error: 'Nota tempo tidak ditemukan' });
      }
      res.json(updated);
    } catch (err: any) {
      console.error('[DistributorInvoiceController] addPayment error:', err);
      const invalid = err?.message === 'INVALID_PAYMENT';
      const isConflict = String(err?.message).includes('Optimistic Lock');
      res.status(isConflict ? 409 : (invalid ? 400 : 500)).json({
        error: isConflict 
          ? err.message 
          : (invalid ? 'Nominal pembayaran tidak valid atau melebihi sisa tagihan.' : 'Gagal mencatat pembayaran cicilan')
      });
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
