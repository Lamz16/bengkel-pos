import { Request, Response } from 'express';
import { customerService } from '../container';

export class CustomerController {
  async getCustomers(_req: Request, res: Response) {
    try {
      const customers = await customerService.getCustomers();
      res.json(customers);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal memuat pelanggan' });
    }
  }

  async createCustomer(req: Request, res: Response) {
    try {
      const { name, phone } = req.body;
      if (!name || !phone) {
        return res.status(400).json({ error: 'Nama dan nomor telepon wajib diisi.' });
      }
      const customer = await customerService.createCustomer(req.body);
      res.status(201).json(customer);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal membuat pelanggan' });
    }
  }

  async updateCustomer(req: Request, res: Response) {
    try {
      const updated = await customerService.updateCustomer(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'Pelanggan tidak ditemukan' });
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal memperbarui pelanggan' });
    }
  }

  async deleteCustomer(req: Request, res: Response) {
    try {
      await customerService.deleteCustomer(req.params.id);
      res.json({ success: true, message: 'Pelanggan berhasil dihapus' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal menghapus pelanggan' });
    }
  }

  async getVehicles(_req: Request, res: Response) {
    try {
      const vehicles = await customerService.getVehicles();
      res.json(vehicles);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal memuat kendaraan' });
    }
  }

  async createVehicle(req: Request, res: Response) {
    try {
      const { plateNumber, model, customerId } = req.body;
      if (!plateNumber || !model || !customerId) {
        return res.status(400).json({ error: 'Plat nomor, tipe kendaraan, dan pelanggan wajib diisi.' });
      }
      const vehicle = await customerService.createVehicle(req.body);
      res.status(201).json(vehicle);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal mendaftarkan kendaraan' });
    }
  }

  async deleteVehicle(req: Request, res: Response) {
    try {
      await customerService.deleteVehicle(req.params.id);
      res.json({ success: true, message: 'Kendaraan berhasil dihapus' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal menghapus kendaraan' });
    }
  }
}

export const customerController = new CustomerController();
