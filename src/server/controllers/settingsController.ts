import { Request, Response } from 'express';
import { settingsService } from '../container';

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
      const updated = await settingsService.updateSettings(req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal memperbarui pengaturan bengkel' });
    }
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
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Nama staf wajib diisi.' });
      }
      const staff = await settingsService.createStaff(req.body);
      res.status(201).json(staff);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal menambahkan staf' });
    }
  }
}

export const settingsController = new SettingsController();
