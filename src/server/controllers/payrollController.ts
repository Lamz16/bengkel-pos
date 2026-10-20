import { Request, Response } from 'express';
import { payrollService } from '../container';
import { recordAudit } from '../services/auditLogService';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
function period(req: Request) {
  const from = String(req.query.from || req.body?.from || '');
  const to = String(req.query.to || req.body?.to || '');
  if (!DATE.test(from) || !DATE.test(to) || from > to) throw new Error('Pilih periode penggajian yang valid.');
  return { from, to, mechanicId: req.query.mechanicId || req.body?.mechanicId || undefined };
}

export class PayrollController {
  async getReport(req: Request, res: Response) {
    try { const { from, to, mechanicId } = period(req); res.json(await payrollService.getReport(from, to, String(mechanicId || '') || undefined)); }
    catch (err: any) { console.error('[Payroll] Gagal memuat rekap:', err); res.status(400).json({ error: 'Data rekap gaji belum dapat dimuat. Silakan periksa periode yang dipilih.' }); }
  }
  async finalize(req: Request, res: Response) {
    try {
      const { from, to, mechanicId } = period(req);
      const report = await payrollService.finalize(from, to, { id: req.authUser!.id, name: req.authUser!.name }, String(mechanicId || '') || undefined);
      await recordAudit(req, { action: 'Finalisasi payroll mekanik', entity: 'PayrollPeriod', entityId: `${from}:${to}:${mechanicId || 'all'}`, after: report, description: `Payroll ${from} s.d. ${to} difinalkan.` });
      res.json(report);
    } catch (err: any) { console.error('[Payroll] Gagal finalisasi:', err); res.status(err.message?.includes('sudah difinalkan') ? 409 : 400).json({ error: err.message?.includes('sudah difinalkan') ? 'Gaji untuk periode ini telah difinalkan.' : 'Gaji belum dapat difinalkan. Silakan coba kembali.' }); }
  }
  async reopen(req: Request, res: Response) {
    try {
      const reason = String(req.body?.reason || '').trim();
      if (!reason) return res.status(400).json({ error: 'Alasan membuka kembali payroll wajib diisi.' });
      const payroll = await payrollService.reopen(req.params.id, reason, { id: req.authUser!.id, name: req.authUser!.name });
      await recordAudit(req, { action: 'Membuka kembali payroll', entity: 'PayrollPeriod', entityId: payroll.id, after: payroll, description: `Payroll dibuka kembali: ${reason}` });
      res.json(payroll);
    } catch (err: any) { console.error('[Payroll] Gagal membuka kembali:', err); res.status(400).json({ error: 'Gaji belum dapat dibuka kembali. Silakan coba lagi.' }); }
  }
}
export const payrollController = new PayrollController();
