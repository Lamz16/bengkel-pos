import { 
  IServiceRepository, 
  IPartRepository, 
  ICustomerRepository, 
  IDeductionRepository,
  IMechanicRepository 
} from '../repositories/interfaces';
import { WorkshopService } from '../../types';

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
