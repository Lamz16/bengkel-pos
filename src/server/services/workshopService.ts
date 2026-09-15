import { 
  IServiceRepository, 
  IPartRepository, 
  ICustomerRepository, 
  IDeductionRepository,
  IMechanicRepository 
} from '../repositories/interfaces';
import { WorkshopService } from '../../types';
import { isDbConnected, prisma } from '../db/connection';

export class WorkshopServiceLayer {
  constructor(
    private serviceRepo: IServiceRepository,
    private partRepo: IPartRepository,
    private customerRepo: ICustomerRepository,
    private deductionRepo: IDeductionRepository,
    private mechanicRepo: IMechanicRepository
  ) {}

  async getServices(): Promise<WorkshopService[]> {
    return this.serviceRepo.getAll();
  }

  async getServiceById(id: string): Promise<WorkshopService | null> {
    return this.serviceRepo.getById(id);
  }

  async createService(data: WorkshopService): Promise<WorkshopService> {
    if (isDbConnected()) {
      const id = data.id || `SRV-${Date.now().toString().slice(-8)}`;
      await prisma.$transaction(async tx => {
        for (const item of data.partsUsed || []) {
          if (!item.partId || item.quantity <= 0) continue;
          const changed = await tx.sparePart.updateMany({
            where: { id: item.partId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (changed.count !== 1) throw new Error(`Stok ${item.name} tidak mencukupi.`);
          await tx.stockHistory.create({ data: {
            partId: item.partId, partName: item.name, amount: item.quantity,
            type: 'Out', reason: `Pemakaian servis ${id}`,
          }});
        }

        await tx.workshopService.create({ data: {
          id, customerId: data.customerId || null, customerName: data.customerName,
          customerPhone: data.customerPhone, vehicleId: data.vehicleId || null,
          vehiclePlate: data.vehiclePlate, vehicleModel: data.vehicleModel,
          kilometers: data.kilometers, serviceType: data.serviceType, complaint: data.complaint,
          diagnosis: data.diagnosis, status: data.status, laborFee: data.laborFee,
          totalAmount: data.totalAmount, paymentStatus: data.paymentStatus,
          discountAmount: data.discountAmount, discountReason: data.discountReason,
          mechanicId: data.mechanicId || null, mechanicName: data.mechanicName,
          mechanicBonusPercent: data.mechanicBonusPercent, mechanicBonusAmount: data.mechanicBonusAmount,
          partsUsed: { create: (data.partsUsed || []).map(item => ({
            partId: item.partId, name: item.name, quantity: item.quantity, priceAtTime: item.priceAtTime,
          })) },
        }});

        if (data.customerId) await tx.customer.update({
          where: { id: data.customerId },
          data: { totalServiceCount: { increment: 1 }, totalSpent: { increment: data.totalAmount }, lastVisitDate: new Date() },
        });
      });
      const persisted = await this.serviceRepo.getById(id);
      if (!persisted) throw new Error('Transaksi servis tersimpan tetapi gagal dimuat kembali.');
      return persisted;
    }

    const created = await this.serviceRepo.create(data);

    // Business Logic: Automatically adjust inventory stock for used parts
    if (data.partsUsed && data.partsUsed.length > 0) {
      for (const part of data.partsUsed) {
        if (part.partId && part.quantity > 0) {
          await this.partRepo.adjustStock(part.partId, -part.quantity);
        }
      }
    }

    // Business Logic: Update customer visit stats and loyalty tier
    if (data.customerId) {
      await this.customerRepo.incrementStats(data.customerId, data.totalAmount);
    }

    return created;
  }

  async updateStatus(id: string, status: string): Promise<WorkshopService | null> {
    return this.serviceRepo.updateStatus(id, status);
  }

  async applyWarrantyClaim(data: {
    serviceId: string;
    reason: string;
    isAbsentNextDay: boolean;
  }): Promise<{ service: WorkshopService | null; deductionCreated: boolean }> {
    const srv = await this.serviceRepo.getById(data.serviceId);
    if (!srv) {
      throw new Error('Service order not found');
    }

    let penalty = 75000;
    if (srv.mechanicId) {
      const mec = await this.mechanicRepo.getById(srv.mechanicId);
      if (mec) {
        penalty = mec.warrantyPenaltyAmount || 75000;
        if (data.isAbsentNextDay) {
          penalty += (mec.absencePenaltyAmount || 50000);
        }
      }
    }

    const claimDate = new Date();
    const updatedSrv = await this.serviceRepo.updateWarrantyClaim({
      serviceId: data.serviceId,
      reason: data.reason,
      isAbsent: data.isAbsentNextDay,
      deductionAmount: penalty,
      claimDate,
    });

    let deductionCreated = false;
    if (srv.mechanicId) {
      await this.deductionRepo.create({
        mechanicId: srv.mechanicId,
        mechanicName: srv.mechanicName || 'Mekanik',
        serviceId: data.serviceId,
        vehiclePlate: srv.vehiclePlate,
        date: claimDate.toISOString(),
        reason: data.isAbsentNextDay
          ? `Klaim Garansi: ${data.reason} + Denda Absen Keesokan Hari`
          : `Klaim Garansi Servis Ulang: ${data.reason}`,
        type: 'Penalty',
        amount: penalty,
        isAbsentNextDay: data.isAbsentNextDay,
      });
      deductionCreated = true;
    }

    return { service: updatedSrv, deductionCreated };
  }
}
