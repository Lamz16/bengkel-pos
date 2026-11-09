import { Request, Response } from 'express';
import { draftService } from '../container';
import { recordAudit } from '../services/auditLogService';

export class DraftController {
  async list(_req: Request, res: Response) {
    try {
      const items = await draftService.list();
      res.json(items);
    } catch (e: any) {
      console.error('[DraftController] list error:', e);
      res.status(500).json({ error: e.message || 'Gagal memuat draft transaksi.' });
    }
  }

  async get(req: Request, res: Response) {
    try {
      const item = await draftService.get(req.params.id);
      if (!item) return res.status(404).json({ error: 'Draft transaksi tidak ditemukan.' });
      res.json(item);
    } catch (e: any) {
      console.error('[DraftController] get error:', e);
      res.status(500).json({ error: e.message || 'Gagal memuat detail draft.' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const item = await draftService.create(req.body, (req as any).authUser);
      await recordAudit(req, {
        action: 'Menyimpan draft transaksi',
        entity: 'TransactionDraft',
        entityId: item.id,
        after: item,
        description: `Draft transaksi ${item.draftCode} (${item.customerName}) disimpan.`,
      });
      res.status(201).json(item);
    } catch (e: any) {
      console.error('[DraftController] create error:', e);
      res.status(400).json({ error: e.message || 'Gagal menyimpan draft transaksi.' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const before = await draftService.get(req.params.id);
      if (!before) return res.status(404).json({ error: 'Draft transaksi tidak ditemukan.' });
      const updated = await draftService.update(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Draft transaksi tidak ditemukan.' });
      res.json(updated);
    } catch (e: any) {
      console.error('[DraftController] update error:', e);
      res.status(400).json({ error: e.message || 'Gagal memperbarui draft transaksi.' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const before = await draftService.get(req.params.id);
      if (!before) return res.status(404).json({ error: 'Draft transaksi tidak ditemukan.' });
      await draftService.delete(req.params.id);
      await recordAudit(req, {
        action: 'Menghapus draft transaksi',
        entity: 'TransactionDraft',
        entityId: req.params.id,
        before,
        description: `Draft transaksi ${before.draftCode} dihapus.`,
      });
      res.json({ success: true, message: 'Draft transaksi berhasil dihapus.' });
    } catch (e: any) {
      console.error('[DraftController] delete error:', e);
      res.status(500).json({ error: e.message || 'Gagal menghapus draft transaksi.' });
    }
  }
}

export const draftController = new DraftController();
