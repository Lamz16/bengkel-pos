import { Request, Response } from 'express';
import { workshopService } from '../container';

export class ServiceController {
  async getServices(_req: Request, res: Response) {
    try {
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
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: 'Status pengerjaan servis wajib diisi.' });
      }
      const updated = await workshopService.updateStatus(req.params.id, status);
      if (!updated) {
        return res.status(404).json({ error: 'Order servis tidak ditemukan' });
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal memperbarui status servis' });
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
  }
}

export const serviceController = new ServiceController();
