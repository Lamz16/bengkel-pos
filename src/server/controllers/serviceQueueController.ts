import { Request, Response } from 'express';
import { serviceQueueService, workshopService } from '../container';
import { recordAudit } from '../services/auditLogService';

export class ServiceQueueController {
  async list(req: Request, res: Response) { try { res.json(await serviceQueueService.list({ page: Number(req.query.page || 1), limit: Number(req.query.limit || 25), search: req.query.search as string, status: req.query.status as string })); } catch (e: any) { res.status(500).json({ error: e.message || 'Gagal memuat antrean.' }); } }
  async get(req: Request, res: Response) { const item = await serviceQueueService.get(req.params.id); if (!item) return res.status(404).json({ error: 'Antrean tidak ditemukan.' }); res.json(item); }
  async create(req: Request, res: Response) { try { const item = await serviceQueueService.create(req.body); await recordAudit(req, { action: 'Membuat antrean servis', entity: 'ServiceQueue', entityId: item.id, after: item, description: `Antrean ${item.queueCode} dibuat.` }); res.status(201).json(item); } catch (e: any) { res.status(400).json({ error: e.message }); } }
  async update(req: Request, res: Response) { try { const item = await serviceQueueService.update(req.params.id, req.body); if (!item) return res.status(404).json({ error: 'Antrean tidak ditemukan.' }); res.json(item); } catch (e: any) { res.status(409).json({ error: e.message }); } }
  async cancel(req: Request, res: Response) { try { const item = await serviceQueueService.cancel(req.params.id); if (!item) return res.status(404).json({ error: 'Antrean tidak ditemukan.' }); res.json(item); } catch (e: any) { res.status(400).json({ error: e.message }); } }
  async convert(req: Request, res: Response) {
    try {
      const queue = await serviceQueueService.get(req.params.id);
      if (!queue) return res.status(404).json({ error: 'Antrean tidak ditemukan.' });
      if (queue.status === 'Converted' || queue.status === 'Cancelled') return res.status(409).json({ error: 'Antrean ini tidak dapat dikonversi.' });
      const transaction = await workshopService.createService({ ...req.body, originQueueId: queue.id, customerId: queue.customerId || '', customerName: queue.customerName, customerPhone: queue.customerPhone, vehicleId: queue.vehicleId || '', vehiclePlate: queue.vehiclePlate, vehicleModel: queue.vehicleModel, kilometers: queue.kilometers || 0, complaint: queue.complaint, diagnosis: req.body.diagnosis || queue.diagnosis || queue.internalNotes, mechanicId: queue.mechanicId, mechanicName: queue.mechanicName, receiptType: 'SERVICE' }, req.authUser);
      await recordAudit(req, { action: 'Mengonversi antrean menjadi transaksi', entity: 'ServiceQueue', entityId: queue.id, after: transaction, description: `Antrean ${queue.queueCode} dikonversi ke transaksi ${transaction.id}.` });
      res.status(201).json(transaction);
    } catch (e: any) { res.status(/sudah dikonversi|statusnya telah berubah|Unique constraint/.test(String(e.message)) ? 409 : 400).json({ error: e.message || 'Konversi antrean gagal.' }); }
  }
}
export const serviceQueueController = new ServiceQueueController();
