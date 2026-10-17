import { Request, Response } from 'express';
import { transactionReportService } from '../container';

const date = (value: unknown, end = false) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const result = new Date(`${value}T${end ? '23:59:59.999' : '00:00:00.000'}`);
  return Number.isNaN(result.valueOf()) ? undefined : result;
};
export class TransactionReportController {
  async listCompleted(req: Request, res: Response) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1), limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
      const sort = ['completedAt', 'revenue', 'cost', 'profit'].includes(String(req.query.sort)) ? req.query.sort as any : 'completedAt';
      const result = await transactionReportService.getCompletedTransactions({ page, limit, search: typeof req.query.search === 'string' ? req.query.search.trim() : undefined, from: date(req.query.from), to: date(req.query.to, true), receiptType: req.query.receiptType === 'SERVICE' || req.query.receiptType === 'SALE' ? req.query.receiptType : undefined, paymentStatus: typeof req.query.paymentStatus === 'string' ? req.query.paymentStatus : undefined, mechanicId: typeof req.query.mechanicId === 'string' ? req.query.mechanicId : undefined, paymentMethod: typeof req.query.paymentMethod === 'string' ? req.query.paymentMethod : undefined, sort, direction: req.query.direction === 'asc' ? 'asc' : 'desc' });
      res.json(result);
    } catch (error: any) { res.status(500).json({ error: error.message || 'Gagal memuat laporan transaksi selesai.' }); }
  }
}
export const transactionReportController = new TransactionReportController();
