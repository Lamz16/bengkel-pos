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
import { masterDataRepository } from '../repositories/masterDataRepository';
import { isDbConnected } from '../db/connection';

export class BootstrapController {
  async getBootstrapData(_req: Request, res: Response) {
    try {
      const [
        settings,
        customers,
        vehicles,
        parts,
        servicePage,
        mechanics,
        deductions,
        attendances,
        suppliers,
        purchases,
        expenses,
        staff,
        distributorInvoices,
        categories,
        racks,
        zones,
      ] = await Promise.all([
        settingsService.getSettings(),
        customerService.getCustomers(),
        customerService.getVehicles(),
        inventoryService.getParts(),
        // Riwayat transaksi adalah tabel yang paling cepat tumbuh. Bootstrap
        // hanya membawa halaman pertama agar login tidak mengirim seluruh
        // data transaksi dan seluruh itemnya ke browser.
        workshopService.getPaginatedServices({ page: 1, limit: 25 }),
        mechanicService.getMechanics(),
        mechanicService.getDeductions(),
        mechanicService.getAttendances(),
        supplierService.getSuppliers(),
        financeService.getPurchases(),
        financeService.getExpenses(),
        settingsService.getStaff(),
        distributorInvoiceRepository.getAll(),
        masterDataRepository.getCategories(),
        masterDataRepository.getRacks(),
        masterDataRepository.getZones(),
      ]);

      res.json({
        settings,
        customers,
        vehicles,
        parts,
        services: servicePage.data,
        servicesPagination: servicePage.pagination,
        mechanics,
        deductions,
        attendances,
        suppliers,
        purchases,
        expenses,
        staff,
        distributorInvoices,
        categories,
        racks,
        zones,
        postgresConnected: isDbConnected(),
      });

    } catch (err: any) {
      console.error('Bootstrap API error:', err);
      res.status(500).json({ error: 'Gagal memuat data awal sistem' });
    }
  }
}

export const bootstrapController = new BootstrapController();
