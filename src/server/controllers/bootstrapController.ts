import { Request, Response } from 'express';
import {
  settingsService,
  customerService,
  inventoryService,
  workshopService,
  mechanicService,
  supplierService,
  financeService,
} from '../container';
import { distributorInvoiceRepository } from '../repositories/distributorInvoiceRepository';

export class BootstrapController {
  async getBootstrapData(_req: Request, res: Response) {
    try {
      const [
        settings,
        customers,
        vehicles,
        parts,
        services,
        mechanics,
        deductions,
        suppliers,
        purchases,
        expenses,
        staff,
        distributorInvoices,
      ] = await Promise.all([
        settingsService.getSettings(),
        customerService.getCustomers(),
        customerService.getVehicles(),
        inventoryService.getParts(),
        workshopService.getServices(),
        mechanicService.getMechanics(),
        mechanicService.getDeductions(),
        supplierService.getSuppliers(),
        financeService.getPurchases(),
        financeService.getExpenses(),
        settingsService.getStaff(),
        distributorInvoiceRepository.getAll(),
      ]);

      res.json({
        settings,
        customers,
        vehicles,
        parts,
        services,
        mechanics,
        deductions,
        suppliers,
        purchases,
        expenses,
        staff,
        distributorInvoices,
      });

    } catch (err: any) {
      console.error('Bootstrap API error:', err);
      res.status(500).json({ error: 'Gagal memuat data awal sistem' });
    }
  }
}

export const bootstrapController = new BootstrapController();
