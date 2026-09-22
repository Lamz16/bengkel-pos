import { Request, Response } from 'express';
import { workshopService } from '../container';

export class ServiceController {
  async getServices(req: Request, res: Response) {
    try {
      const page = req.query.page ? Number(req.query.page) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;

      if (page || limit || search || status) {
        const paginated = await (workshopService as any).serviceRepo.getPaginated({ page, limit, search, status });
        return res.json(paginated);
      }

      const services = await workshopService.getServices();
      res.json(services);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal memuat daftar servis' });
    }
  }

  async createService(req: Request, res: Response) {
    try {
      const { customerName, vehiclePlate, serviceType, totalAmount } = req.body;
      if (!customerName || !vehiclePlate || !serviceType || totalAmount === undefined) {
        return res.status(400).json({ error: 'Data order servis tidak lengkap.' });
      }
      const service = await workshopService.createService(req.body);
      res.status(201).json(service);
    } catch (err: any) {
      const status = String(err.message).includes('tidak mencukupi') ? 409 : 500;
      res.status(status).json({ error: err.message || 'Gagal membuat order servis' });
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const { status, version, expectedVersion } = req.body;
      if (!status) {
        return res.status(400).json({ error: 'Status pengerjaan servis wajib diisi.' });
      }
      const expVer = expectedVersion !== undefined ? Number(expectedVersion) : (version !== undefined ? Number(version) : undefined);
      const updated = await (workshopService as any).serviceRepo.updateStatus(req.params.id, status, expVer);
      if (!updated) {
        return res.status(404).json({ error: 'Order servis tidak ditemukan' });
      }
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
      const updated = await (workshopService as any).serviceRepo.markPaid(req.params.id, expVer);
      if (!updated) return res.status(404).json({ error: 'Order servis tidak ditemukan' });
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
      const result = await workshopService.processReturn({ serviceId: req.params.id, reason: req.body.reason, items: req.body.items || [] });
      res.json(result);
    } catch (err: any) {
      const message = err.message || 'Gagal memproses retur barang';
      res.status(/tidak ditemukan|melebihi|hanya dapat|Pilih minimal/.test(message) ? 400 : 500).json({ error: message });
    }
  }

}

export const serviceController = new ServiceController();
