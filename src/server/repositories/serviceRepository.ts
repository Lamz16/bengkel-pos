import { IServiceRepository } from './interfaces';
import { WorkshopService } from '../../types';
import { prisma, isDbConnected } from '../db/connection';
import { memoryStore } from '../db/memoryStore';

export class ServiceRepository implements IServiceRepository {
  async getAll(): Promise<WorkshopService[]> {
    if (isDbConnected()) {
      try {
        const list = await prisma.workshopService.findMany({
          include: { partsUsed: true },
          orderBy: { createdAt: 'desc' }
        });
        return list.map(s => ({
          id: s.id,
          customerId: s.customerId || '',
          customerName: s.customerName,
          customerPhone: s.customerPhone || undefined,
          vehicleId: s.vehicleId || '',
          vehiclePlate: s.vehiclePlate,
          vehicleModel: s.vehicleModel,
          kilometers: s.kilometers,
          serviceType: s.serviceType,
          complaint: s.complaint,
          diagnosis: s.diagnosis || undefined,
          status: s.status as any,
          createdAt: s.createdAt.toISOString(),
          partsUsed: s.partsUsed.map(p => ({
            partId: p.partId,
            name: p.name,
            quantity: p.quantity,
            priceAtTime: Number(p.priceAtTime),
          })),
          laborFee: Number(s.laborFee),
          totalAmount: Number(s.totalAmount),
          paymentStatus: s.paymentStatus as any,
          discountAmount: s.discountAmount == null ? undefined : Number(s.discountAmount),
          discountReason: s.discountReason || undefined,
          mechanicId: s.mechanicId || undefined,
          mechanicName: s.mechanicName || undefined,
          mechanicBonusPercent: s.mechanicBonusPercent || undefined,
          mechanicBonusAmount: s.mechanicBonusAmount == null ? undefined : Number(s.mechanicBonusAmount),
          hasWarrantyClaim: s.hasWarrantyClaim,
          warrantyClaimDate: s.warrantyClaimDate ? s.warrantyClaimDate.toISOString() : undefined,
          warrantyClaimReason: s.warrantyClaimReason || undefined,
          isMechanicAbsentOnClaim: s.isMechanicAbsentOnClaim || undefined,
          warrantyDeductionAmount: s.warrantyDeductionAmount == null ? undefined : Number(s.warrantyDeductionAmount),
        }));
      } catch (err) {
        console.error('[ServiceRepo] Prisma getAll error:', err);
      }
    }
    return memoryStore.services;
  }

  async getById(id: string): Promise<WorkshopService | null> {
    if (isDbConnected()) {
      try {
        const s = await prisma.workshopService.findUnique({
          where: { id },
          include: { partsUsed: true }
        });
        if (s) {
          return {
            id: s.id,
            customerId: s.customerId || '',
            customerName: s.customerName,
            customerPhone: s.customerPhone || undefined,
            vehicleId: s.vehicleId || '',
            vehiclePlate: s.vehiclePlate,
            vehicleModel: s.vehicleModel,
            kilometers: s.kilometers,
            serviceType: s.serviceType,
            complaint: s.complaint,
            diagnosis: s.diagnosis || undefined,
            status: s.status as any,
            createdAt: s.createdAt.toISOString(),
            partsUsed: s.partsUsed.map(p => ({
              partId: p.partId,
              name: p.name,
              quantity: p.quantity,
              priceAtTime: Number(p.priceAtTime),
            })),
            laborFee: Number(s.laborFee),
            totalAmount: Number(s.totalAmount),
            paymentStatus: s.paymentStatus as any,
            discountAmount: s.discountAmount == null ? undefined : Number(s.discountAmount),
            discountReason: s.discountReason || undefined,
            mechanicId: s.mechanicId || undefined,
            mechanicName: s.mechanicName || undefined,
            mechanicBonusPercent: s.mechanicBonusPercent || undefined,
            mechanicBonusAmount: s.mechanicBonusAmount == null ? undefined : Number(s.mechanicBonusAmount),
            hasWarrantyClaim: s.hasWarrantyClaim,
            warrantyClaimDate: s.warrantyClaimDate ? s.warrantyClaimDate.toISOString() : undefined,
            warrantyClaimReason: s.warrantyClaimReason || undefined,
            isMechanicAbsentOnClaim: s.isMechanicAbsentOnClaim || undefined,
            warrantyDeductionAmount: s.warrantyDeductionAmount == null ? undefined : Number(s.warrantyDeductionAmount),
          };
        }
      } catch (err) {
        console.error('[ServiceRepo] Prisma getById error:', err);
      }
    }
    return memoryStore.services.find(s => s.id === id) || null;
  }

  async create(data: WorkshopService): Promise<WorkshopService> {
    const id = data.id || `SRV-${Date.now().toString().slice(-4)}`;
    const newService = { ...data, id };

    if (isDbConnected()) {
      try {
        await prisma.workshopService.create({
          data: {
            id,
            customerId: data.customerId || null,
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            vehicleId: data.vehicleId || null,
            vehiclePlate: data.vehiclePlate,
            vehicleModel: data.vehicleModel,
            kilometers: data.kilometers,
            serviceType: data.serviceType,
            complaint: data.complaint,
            diagnosis: data.diagnosis,
            status: data.status,
            laborFee: data.laborFee,
            totalAmount: data.totalAmount,
            paymentStatus: data.paymentStatus,
            discountAmount: data.discountAmount,
            discountReason: data.discountReason,
            mechanicId: data.mechanicId || null,
            mechanicName: data.mechanicName,
            mechanicBonusPercent: data.mechanicBonusPercent,
            mechanicBonusAmount: data.mechanicBonusAmount,
            partsUsed: {
              create: data.partsUsed.map(p => ({
                partId: p.partId,
                name: p.name,
                quantity: p.quantity,
                priceAtTime: p.priceAtTime,
              }))
            }
          }
        });
      } catch (err) {
        console.error('[ServiceRepo] Prisma create error:', err);
      }
    }

    memoryStore.services.unshift(newService);
    return newService;
  }

  async updateStatus(id: string, status: string): Promise<WorkshopService | null> {
    if (isDbConnected()) {
      try {
        await prisma.workshopService.update({
          where: { id },
          data: { status }
        });
      } catch (err) {
        console.error('[ServiceRepo] Prisma updateStatus error:', err);
      }
    }
    const idx = memoryStore.services.findIndex(s => s.id === id);
    if (idx === -1) return null;
    memoryStore.services[idx] = { ...memoryStore.services[idx], status: status as any };
    return memoryStore.services[idx];
  }

  async updateWarrantyClaim(data: {
    serviceId: string;
    reason: string;
    isAbsent: boolean;
    deductionAmount: number;
    claimDate: Date;
  }): Promise<WorkshopService | null> {
    if (isDbConnected()) {
      try {
        await prisma.workshopService.update({
          where: { id: data.serviceId },
          data: {
            hasWarrantyClaim: true,
            warrantyClaimDate: data.claimDate,
            warrantyClaimReason: data.reason,
            isMechanicAbsentOnClaim: data.isAbsent,
            warrantyDeductionAmount: data.deductionAmount,
            status: 'In Progress'
          }
        });
      } catch (err) {
        console.error('[ServiceRepo] Prisma updateWarrantyClaim error:', err);
      }
    }

    const srv = memoryStore.services.find(s => s.id === data.serviceId);
    if (srv) {
      srv.hasWarrantyClaim = true;
      srv.warrantyClaimDate = data.claimDate.toISOString();
      srv.warrantyClaimReason = data.reason;
      srv.isMechanicAbsentOnClaim = data.isAbsent;
      srv.warrantyDeductionAmount = data.deductionAmount;
      srv.status = 'In Progress';
    }
    return srv || null;
  }
}
