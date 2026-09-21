import { Request, Response } from 'express';
import { mechanicService } from '../container';

export class MechanicController {
  async getMechanics(_req: Request, res: Response) {
    try {
      const mechanics = await mechanicService.getMechanics();
      res.json(mechanics);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal memuat daftar mekanik' });
    }
  }

  async createMechanic(req: Request, res: Response) {
    try {
      const { name, phone } = req.body;
      if (!name || !phone) {
        return res.status(400).json({ error: 'Nama dan nomor telepon mekanik wajib diisi.' });
      }
      const mechanic = await mechanicService.createMechanic(req.body);
      res.status(201).json(mechanic);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal menambahkan data mekanik' });
    }
  }

  async updateMechanic(req: Request, res: Response) {
    try {
      const updated = await mechanicService.updateMechanic(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'Data mekanik tidak ditemukan' });
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal memperbarui data mekanik' });
    }
  }

  async deleteMechanic(req: Request, res: Response) {
    try {
      await mechanicService.deleteMechanic(req.params.id);
      res.json({ success: true, message: 'Data mekanik berhasil dihapus' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal menghapus data mekanik' });
    }
  }

  async getDeductions(_req: Request, res: Response) {
    try {
      const deductions = await mechanicService.getDeductions();
      res.json(deductions);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal memuat data potongan/denda mekanik' });
    }
  }

  async createDeduction(req: Request, res: Response) {
    try {
      const { mechanicId, mechanicName, reason, amount } = req.body;
      if (!mechanicId || !mechanicName || !reason || amount === undefined) {
        return res.status(400).json({ error: 'Data potongan mekanik tidak lengkap.' });
      }
      const deduction = await mechanicService.createDeduction(req.body);
      res.status(201).json(deduction);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal menambahkan potongan mekanik' });
    }
  }

  async deleteDeduction(req: Request, res: Response) {
    try {
      await mechanicService.deleteDeduction(req.params.id);
      res.json({ success: true, message: 'Catatan potongan mekanik berhasil dihapus' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal menghapus potongan mekanik' });
    }
  }

  async getAttendances(_req: Request, res: Response) {
    try {
      const attendances = await mechanicService.getAttendances();
      res.json(attendances);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal memuat absensi mekanik' });
    }
  }

  async saveAttendance(req: Request, res: Response) {
    try {
      const { mechanicId, date, status } = req.body;
      if (!mechanicId || !date || !['Present', 'Absent', 'Sick', 'Leave'].includes(status)) {
        return res.status(400).json({ error: 'Mekanik, tanggal, dan status absensi wajib diisi dengan benar.' });
      }
      const attendance = await mechanicService.saveAttendance(req.body);
      res.json(attendance);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal menyimpan absensi mekanik' });
    }
  }
}

export const mechanicController = new MechanicController();
