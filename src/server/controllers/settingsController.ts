import { Request, Response } from 'express';
import { settingsService } from '../container';
import { prisma, isDbConnected } from '../db/connection';
import { memoryStore } from '../db/memoryStore';
import { randomUUID } from 'crypto';
import { recordAudit } from '../services/auditLogService';

export class SettingsController {
  async getSettings(_req: Request, res: Response) {
    try {
      const settings = await settingsService.getSettings();
      res.json(settings);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal memuat pengaturan bengkel' });
    }
  }

  async updateSettings(req: Request, res: Response) {
    try {
      const before = await settingsService.getSettings();
      const updated = await settingsService.updateSettings(req.body);
      await recordAudit(req, { action: 'Mengubah pengaturan bengkel', entity: 'CompanySettings', entityId: updated.id || 'settings-default', before, after: updated, description: 'Pengaturan bengkel diperbarui.' });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal memperbarui pengaturan bengkel' });
    }
  }

  async getLoyaltyTiers(_req: Request, res: Response) {
    try {
      const tiers = isDbConnected()
        ? await prisma.loyaltyTier.findMany({ where: { companySettingsId: 'settings-default' }, orderBy: [{ minimumVisits: 'asc' }, { sortOrder: 'asc' }] })
        : memoryStore.loyaltyTiers;
      res.json(tiers);
    } catch (err: any) { res.status(500).json({ error: err.message || 'Gagal memuat tier loyalitas' }); }
  }

  async createLoyaltyTier(req: Request, res: Response) {
    try {
      const { name, minimumVisits, discountPercent = 0, sortOrder = 0, isActive = true } = req.body;
      if (!String(name || '').trim() || !Number.isInteger(Number(minimumVisits)) || Number(minimumVisits) < 0 || Number(discountPercent) < 0 || Number(discountPercent) > 100) {
        return res.status(400).json({ error: 'Nama, minimum kunjungan (0 atau lebih), dan diskon 0–100 wajib valid.' });
      }
      const data = { name: String(name).trim(), minimumVisits: Number(minimumVisits), discountPercent: Number(discountPercent), sortOrder: Number(sortOrder), isActive: Boolean(isActive) };
      const tier = isDbConnected()
        ? await prisma.loyaltyTier.create({ data: { ...data, companySettingsId: 'settings-default' } })
        : { id: randomUUID(), ...data };
      if (!isDbConnected()) memoryStore.loyaltyTiers.push(tier);
      await recordAudit(req, { action: 'Menambah tier loyalitas', entity: 'LoyaltyTier', entityId: tier.id, after: tier, description: `Tier ${tier.name} ditambahkan.` });
      res.status(201).json(tier);
    } catch (err: any) { res.status(400).json({ error: err.code === 'P2002' ? 'Nama atau minimum kunjungan tier sudah digunakan.' : (err.message || 'Gagal menambah tier loyalitas') }); }
  }

  async updateLoyaltyTier(req: Request, res: Response) {
    try {
      const { id } = req.params; const { name, minimumVisits, discountPercent, sortOrder, isActive } = req.body;
      const data: any = {};
      if (name !== undefined) data.name = String(name).trim();
      if (minimumVisits !== undefined) data.minimumVisits = Number(minimumVisits);
      if (discountPercent !== undefined) data.discountPercent = Number(discountPercent);
      if (sortOrder !== undefined) data.sortOrder = Number(sortOrder);
      if (isActive !== undefined) data.isActive = Boolean(isActive);
      if (!data.name && name !== undefined || data.minimumVisits < 0 || data.discountPercent < 0 || data.discountPercent > 100) return res.status(400).json({ error: 'Data tier tidak valid.' });
      const before = isDbConnected() ? await prisma.loyaltyTier.findUnique({ where: { id } }) : memoryStore.loyaltyTiers.find(item => item.id === id);
      if (!before) return res.status(404).json({ error: 'Tier loyalitas tidak ditemukan.' });
      const tier = isDbConnected() ? await prisma.loyaltyTier.update({ where: { id }, data }) : { ...before, ...data };
      if (!isDbConnected()) memoryStore.loyaltyTiers = memoryStore.loyaltyTiers.map(item => item.id === id ? tier : item);
      await recordAudit(req, { action: 'Mengubah tier loyalitas', entity: 'LoyaltyTier', entityId: id, before, after: tier, description: `Tier ${tier.name} diperbarui.` });
      res.json(tier);
    } catch (err: any) { res.status(400).json({ error: err.code === 'P2002' ? 'Nama atau minimum kunjungan tier sudah digunakan.' : (err.message || 'Gagal memperbarui tier loyalitas') }); }
  }

  async deleteLoyaltyTier(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const before = isDbConnected() ? await prisma.loyaltyTier.findUnique({ where: { id } }) : memoryStore.loyaltyTiers.find(item => item.id === id);
      if (!before) return res.status(404).json({ error: 'Tier loyalitas tidak ditemukan.' });
      if (isDbConnected()) await prisma.loyaltyTier.delete({ where: { id } }); else memoryStore.loyaltyTiers = memoryStore.loyaltyTiers.filter(item => item.id !== id);
      await recordAudit(req, { action: 'Menghapus tier loyalitas', entity: 'LoyaltyTier', entityId: id, before, description: `Tier ${before.name} dihapus.` });
      res.status(204).end();
    } catch (err: any) { res.status(500).json({ error: err.message || 'Gagal menghapus tier loyalitas' }); }
  }

  async getStaff(_req: Request, res: Response) {
    try {
      const staff = await settingsService.getStaff();
      res.json(staff);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal memuat data staf' });
    }
  }

  async createStaff(req: Request, res: Response) {
    try {
      const { name, email, password, role } = req.body;
      if (!name || !email || !password || password.length < 8) {
        return res.status(400).json({ error: 'Nama, email, dan password minimal 8 karakter wajib diisi.' });
      }
      if (!['Owner', 'Admin'].includes(role)) return res.status(400).json({ error: 'Peran staf tidak valid.' });
      const staff = await settingsService.createStaff(req.body);
      res.status(201).json(staff);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal menambahkan staf' });
    }
  }

  async updateStaff(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const before = await settingsService.getStaffById(id);
      if (!before) return res.status(404).json({ error: 'Akun pengguna tidak ditemukan.' });

      const { name, email, password, role, status, shifts } = req.body;
      if (!name || !email) return res.status(400).json({ error: 'Nama dan email wajib diisi.' });
      if (password && password.length < 8) return res.status(400).json({ error: 'Password minimal 8 karakter.' });
      if (!['Owner', 'Admin'].includes(role)) return res.status(400).json({ error: 'Peran staf tidak valid.' });
      if (!['Active', 'Inactive'].includes(status)) return res.status(400).json({ error: 'Status staf tidak valid.' });
      if (before.role === 'Owner' && (role !== 'Owner' || status !== 'Active') && !(await settingsService.hasAnotherOwner(id))) {
        return res.status(400).json({ error: 'Tidak dapat menonaktifkan atau mengubah peran Owner terakhir.' });
      }

      const updated = await settingsService.updateStaff(id, { name: name.trim(), email: email.trim(), password, role, status, shifts });
      await recordAudit(req, { action: 'Mengubah akun pengguna', entity: 'User', entityId: id, before, after: updated, description: `Akun ${before.name} diperbarui.` });
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.code === 'P2002' ? 'Email sudah digunakan oleh akun lain.' : (err.message || 'Gagal memperbarui akun pengguna') });
    }
  }

  async deleteStaff(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (id === req.authUser?.id) return res.status(400).json({ error: 'Akun yang sedang digunakan tidak dapat dihapus.' });
      const before = await settingsService.getStaffById(id);
      if (!before) return res.status(404).json({ error: 'Akun pengguna tidak ditemukan.' });
      if (before.role === 'Owner' && !(await settingsService.hasAnotherOwner(id))) {
        return res.status(400).json({ error: 'Owner terakhir tidak dapat dihapus.' });
      }
      await settingsService.deleteStaff(id);
      await recordAudit(req, { action: 'Menghapus akun pengguna', entity: 'User', entityId: id, before, description: `Akun ${before.name} dihapus.` });
      res.status(204).end();
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal menghapus akun pengguna' });
    }
  }
}

export const settingsController = new SettingsController();
