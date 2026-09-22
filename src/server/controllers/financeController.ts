import { Request, Response } from 'express';
import { financeService } from '../container';

export class FinanceController {
  async getExpenseCategories(_req: Request, res: Response) {
    try { res.json(await financeService.getExpenseCategories()); } catch (err: any) { res.status(500).json({ error: err.message || 'Gagal memuat kategori pengeluaran' }); }
  }
  async createExpenseCategory(req: Request, res: Response) {
    try {
      if (!req.body.name?.trim()) return res.status(400).json({ error: 'Nama kategori pengeluaran wajib diisi.' });
      res.status(201).json(await financeService.createExpenseCategory(req.body));
    } catch (err: any) { res.status(err?.code === 'P2002' ? 409 : 500).json({ error: err.message || 'Gagal membuat kategori pengeluaran' }); }
  }
  async updateExpenseCategory(req: Request, res: Response) {
    try { res.json(await financeService.updateExpenseCategory(req.params.id, req.body)); } catch (err: any) { res.status(err?.code === 'P2002' ? 409 : 500).json({ error: err.message || 'Gagal memperbarui kategori pengeluaran' }); }
  }
  async deleteExpenseCategory(req: Request, res: Response) {
    try { await financeService.deleteExpenseCategory(req.params.id); res.json({ success: true }); } catch (err: any) { res.status(500).json({ error: err.message || 'Gagal menghapus kategori pengeluaran' }); }
  }
  async getExpenses(_req: Request, res: Response) {
    try {
      const expenses = await financeService.getExpenses();
      res.json(expenses);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal memuat pengeluaran' });
    }
  }

  async createExpense(req: Request, res: Response) {
    try {
      const { category, amount } = req.body;
      if (!category || amount === undefined) {
        return res.status(400).json({ error: 'Kategori dan jumlah pengeluaran wajib diisi.' });
      }
      const expense = await financeService.createExpense(req.body);
      res.status(201).json(expense);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal mencatat pengeluaran' });
    }
  }

  async deleteExpense(req: Request, res: Response) {
    try {
      await financeService.deleteExpense(req.params.id);
      res.json({ success: true, message: 'Pengeluaran berhasil dihapus' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal menghapus pengeluaran' });
    }
  }

  async getPurchases(_req: Request, res: Response) {
    try {
      const purchases = await financeService.getPurchases();
      res.json(purchases);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal memuat riwayat pembelian' });
    }
  }
}

export const financeController = new FinanceController();
