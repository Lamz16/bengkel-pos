import { Request, Response } from 'express';
import { prisma } from '../db/connection';

export class ActivityLogController {
  private getFilter(statusQuery: unknown) {
    return statusQuery === 'error' ? false : statusQuery === 'success' ? true : undefined;
  }

  async list(req: Request, res: Response) {
    try {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(100, Math.max(1, Number(req.query.limit || 25)));
      const status = this.getFilter(req.query.status);
      const where = status === undefined ? {} : { success: status };
      const [total, data] = await Promise.all([
        prisma.activityLog.count({ where }),
        prisma.activityLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      ]);
      res.json({ data, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Gagal memuat log aktivitas.' });
    }
  }

  async export(req: Request, res: Response) {
    try {
      const status = this.getFilter(req.query.status);
      const where = status === undefined ? {} : { success: status };
      const filename = `bengkel-pos-log-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
      res.status(200);
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.write('BENGKEL POS - LOG AKTIVITAS TEKNIS\\n');
      res.write(`Diekspor: ${new Date().toISOString()}\\nFilter: ${req.query.status || 'all'}\\n\\n`);

      // Batched output prevents the 24-hour retention window from being loaded fully into memory.
      let cursor: { createdAt: Date; id: string } | undefined;
      while (true) {
        const batch = await prisma.activityLog.findMany({
          where: cursor ? { AND: [where, { OR: [{ createdAt: { lt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { lt: cursor.id } }] }] } : where,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 500,
        });
        if (batch.length === 0) break;
        for (const log of batch) {
          res.write(`${'='.repeat(88)}\\nWaktu       : ${log.createdAt.toISOString()}\\nID Log      : ${log.id}\\nPengguna    : ${log.userName || 'Sistem'}\\nRole        : ${log.role || '-'}\\nTindakan    : ${log.action}\\nStatus      : ${log.statusCode} (${log.success ? 'BERHASIL' : 'GAGAL'})\\nKeterangan  : ${log.description}\\n`);
          if (log.technicalDetail) {
            res.write('Detail teknis:\\n');
            try { res.write(`${JSON.stringify(JSON.parse(log.technicalDetail), null, 2)}\\n`); }
            catch { res.write(`${log.technicalDetail}\\n`); }
          }
          res.write('\\n');
        }
        if (batch.length < 500) break;
        const last = batch[batch.length - 1];
        cursor = { createdAt: last.createdAt, id: last.id };
      }
      res.end();
    } catch (error: any) {
      if (!res.headersSent) res.status(500).json({ error: error.message || 'Gagal mengekspor log aktivitas.' });
      else res.end();
    }
  }
}
export const activityLogController = new ActivityLogController();
