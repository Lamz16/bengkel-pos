import { Request, Response } from 'express';
import { workshopService } from '../container';
import { recordAudit } from '../services/auditLogService';

export class ServiceController {
  async getServices(req: Request, res: Response) {
    try {
      const requestedPage = Number(req.query.page || 1);
      const requestedLimit = Number(req.query.limit || 25);
      const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
      // Batas ini menjaga satu respons tetap kecil, termasuk ketika sebuah
      // transaksi mempunyai banyak item sparepart/jasa.
      const limit = Number.isSafeInteger(requestedLimit)
        ? Math.min(Math.max(requestedLimit, 1), 100)
        : 25;
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;

      // Riwayat transaksi selalu dipaginasi. Jangan kembalikan seluruh tabel
      // saat parameter query tidak diberikan.
      const paginated = await workshopService.getPaginatedServices({ page, limit, search, status });
      return res.json(paginated);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal memuat daftar servis' });
    }
  }

  async createService(req: Request, res: Response) {
    try {
      const { customerName, vehiclePlate, receiptType, totalAmount } = req.body;
      const isSale = receiptType === 'SALE';
      if (!customerName?.trim() || totalAmount === undefined || (!isSale && !vehiclePlate?.trim())) {
        return res.status(400).json({ error: 'Data transaksi tidak lengkap.', details: { customerName: !customerName?.trim() ? 'Nama pelanggan wajib diisi.' : undefined, vehiclePlate: !isSale && !vehiclePlate?.trim() ? 'Nomor polisi wajib diisi untuk transaksi servis.' : undefined, totalAmount: totalAmount === undefined ? 'Total transaksi wajib diisi.' : undefined, receiptType: receiptType || 'SERVICE' } });
      }
      const service = await workshopService.createService(req.body);
      await recordAudit(req, { action: 'Membuat transaksi', entity: 'WorkshopService', entityId: service.id, after: service, description: `Transaksi ${service.invoiceNumber || service.id} dibuat.` });
      res.status(201).json(service);
    } catch (err: any) {
      const status = String(err.message).includes('tidak mencukupi') ? 409 : 500;
      res.status(status).json({ error: err.message || 'Gagal membuat order servis' });
    }
  }

  async updateService(req: Request, res: Response) {
    try {
      const { version, expectedVersion } = req.body;
      const expVer = expectedVersion !== undefined ? Number(expectedVersion) : (version !== undefined ? Number(version) : undefined);
      const before = await workshopService.getService(req.params.id);
      const updated = await workshopService.updateService(req.params.id, req.body, expVer);
      if (!updated) return res.status(404).json({ error: 'Order servis tidak ditemukan.' });
      await recordAudit(req, { action: 'Mengubah transaksi', entity: 'WorkshopService', entityId: updated.id, before, after: updated, description: `Transaksi ${updated.invoiceNumber || updated.id} diperbarui.` });
      res.json(updated);
    } catch (err: any) {
      const message = err.message || 'Gagal mengubah order servis';
      const conflict = /telah diubah/.test(message);
      res.status(conflict ? 409 : /tidak lengkap|tidak valid|tidak mencukupi|tidak dapat diedit/.test(message) ? 400 : 500).json({ error: message });
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const { status, version, expectedVersion } = req.body;
      if (!status) {
        return res.status(400).json({ error: 'Status pengerjaan servis wajib diisi.' });
      }
      const expVer = expectedVersion !== undefined ? Number(expectedVersion) : (version !== undefined ? Number(version) : undefined);
      const before = await workshopService.getService(req.params.id);
      const updated = await (workshopService as any).serviceRepo.updateStatus(req.params.id, status, expVer);
      if (!updated) {
        return res.status(404).json({ error: 'Order servis tidak ditemukan' });
      }
      await recordAudit(req, { action: 'Mengubah status transaksi', entity: 'WorkshopService', entityId: updated.id, before, after: updated, description: `Status transaksi ${updated.invoiceNumber || updated.id} diubah menjadi ${status}.` });
      res.json(updated);
    } catch (err: any) {
      const isConflict = String(err.message).includes('Optimistic Lock') || String(err.message).includes('telah diubah oleh kasir');
      res.status(isConflict ? 409 : 500).json({ error: err.message || 'Gagal memperbarui status servis' });
    }
  }

  async markPaid(req: Request, res: Response) {
    try {
      const { version, expectedVersion } = req.body;
      const expVer = expectedVersion !== undefined ? Number(expectedVersion) : (version !== undefined ? Number(version) : undefined);
      const before = await workshopService.getService(req.params.id);
      const updated = await (workshopService as any).serviceRepo.markPaid(req.params.id, expVer);
      if (!updated) return res.status(404).json({ error: 'Order servis tidak ditemukan' });
      await recordAudit(req, { action: 'Melunasi transaksi', entity: 'WorkshopService', entityId: updated.id, before, after: updated, description: `Pembayaran transaksi ${updated.invoiceNumber || updated.id} ditandai lunas.` });
      res.json(updated);
    } catch (err: any) {
      const isConflict = String(err.message).includes('telah diubah oleh kasir');
      res.status(isConflict ? 409 : 500).json({ error: err.message || 'Gagal memperbarui status pembayaran servis' });
    }
  }

  async claimWarranty(req: Request, res: Response) {
    try {
      const { reason, isAbsentNextDay } = req.body;
      if (!reason) {
        return res.status(400).json({ error: 'Alasan klaim garansi wajib diisi.' });
      }
      const result = await workshopService.applyWarrantyClaim({
        serviceId: req.params.id,
        reason,
        isAbsentNextDay: !!isAbsentNextDay,
      });
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal memproses klaim garansi' });
    }
  }  async processReturn(req: Request, res: Response) {
    try {
      const before = await workshopService.getService(req.params.id);
      const result = await workshopService.processReturn({ serviceId: req.params.id, reason: req.body.reason, items: req.body.items || [] });
      await recordAudit(req, { action: 'Memproses retur transaksi', entity: 'WorkshopService', entityId: result.id, before, after: result, description: `Retur diproses untuk transaksi ${result.invoiceNumber || result.id}.` });
      res.json(result);
    } catch (err: any) {
      const message = err.message || 'Gagal memproses retur barang';
      res.status(/tidak ditemukan|melebihi|hanya dapat|Pilih minimal/.test(message) ? 400 : 500).json({ error: message });
    }
  }

}

export const serviceController = new ServiceController();
