import { IServiceRepository, PaginationParams } from './interfaces';
import { WorkshopService, PaginatedResult } from '../../types';
import { prisma, isDbConnected } from '../db/connection';
import { memoryStore } from '../db/memoryStore';

export class ServiceRepository implements IServiceRepository {
  async getAll(): Promise<WorkshopService[]> {
    if (isDbConnected()) {
      try {
        const list = await prisma.workshopService.findMany({
          include: { partsUsed: true, serviceItems: true },
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
            normalPriceAtTime: p.normalPriceAtTime == null ? undefined : Number(p.normalPriceAtTime),
            wholesaleType: p.wholesaleType as any || undefined,
            wholesaleValue: p.wholesaleValue == null ? undefined : Number(p.wholesaleValue),
            wholesaleUnitPrice: p.wholesaleUnitPrice == null ? undefined : Number(p.wholesaleUnitPrice),
            purchasePriceAtTime: p.purchasePriceAtTime == null ? undefined : Number(p.purchasePriceAtTime),
            hasProductWarranty: p.hasProductWarranty,
            warrantyDurationDays: p.warrantyDurationDays,
            warrantyTerms: p.warrantyTerms || undefined,
            warrantyExpiresAt: p.warrantyExpiresAt?.toISOString(),
          })),
          serviceItems: s.serviceItems.map(item => ({ name: item.name, price: Number(item.price) })),
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
          receiptType: s.receiptType as 'SERVICE' | 'SALE',
          receiptHeaderSnapshot: s.receiptHeaderSnapshot || undefined,
          receiptFooterSnapshot: s.receiptFooterSnapshot || undefined,
          serviceWarrantyDurationDays: s.serviceWarrantyDurationDays || 0,
          serviceWarrantyTermsSnapshot: s.serviceWarrantyTermsSnapshot || undefined,
          serviceWarrantyExpiresAt: s.serviceWarrantyExpiresAt?.toISOString(),
          version: s.version || 1,
        }));
      } catch (err) {
        console.error('[ServiceRepo] Prisma getAll error:', err);
      }
    }
    return memoryStore.services;
  }

  async getPaginated(params: PaginationParams): Promise<PaginatedResult<WorkshopService>> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, params.limit || 10);
    const search = params.search?.trim().toLowerCase() || '';
    const status = params.status;

    if (isDbConnected()) {
      try {
        const whereConditions: any[] = [];
        if (search) {
          whereConditions.push({
            OR: [
              { customerName: { contains: search, mode: 'insensitive' as const } },
              { vehiclePlate: { contains: search, mode: 'insensitive' as const } },
              { vehicleModel: { contains: search, mode: 'insensitive' as const } },
              { serviceType: { contains: search, mode: 'insensitive' as const } },
              { id: { contains: search, mode: 'insensitive' as const } },
            ],
          });
        }

        if (status && status !== 'All') {
          whereConditions.push({ status });
        }

        const where = whereConditions.length > 0 ? { AND: whereConditions } : {};

        const total = await prisma.workshopService.count({ where });
        const list = await prisma.workshopService.findMany({
          where,
          include: { partsUsed: true, serviceItems: true },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        });

        return {
          data: list.map(s => ({
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
            normalPriceAtTime: p.normalPriceAtTime == null ? undefined : Number(p.normalPriceAtTime),
            wholesaleType: p.wholesaleType as any || undefined,
            wholesaleValue: p.wholesaleValue == null ? undefined : Number(p.wholesaleValue),
            wholesaleUnitPrice: p.wholesaleUnitPrice == null ? undefined : Number(p.wholesaleUnitPrice),
              hasProductWarranty: p.hasProductWarranty,
              warrantyDurationDays: p.warrantyDurationDays,
              warrantyTerms: p.warrantyTerms || undefined,
              warrantyExpiresAt: p.warrantyExpiresAt?.toISOString(),
            })),
            serviceItems: s.serviceItems.map(item => ({ name: item.name, price: Number(item.price) })),
            laborFee: Number(s.laborFee),
            totalAmount: Number(s.totalAmount),
            paymentStatus: s.paymentStatus as any,
            discountAmount: s.discountAmount == null ? undefined : Number(s.discountAmount),
            discountReason: s.discountReason || undefined,
            mechanicId: s.mechanicId || undefined,
            mechanicName: s.mechanicName || undefined,
            mechanicBonusPercent: s.mechanicBonusPercent || undefined,
            mechanicBonusAmount: s.mechanicBonusAmount == null ? undefined : Number(s.mechanicBonusAmount),
            receiptType: s.receiptType as 'SERVICE' | 'SALE',
            receiptHeaderSnapshot: s.receiptHeaderSnapshot || undefined,
            receiptFooterSnapshot: s.receiptFooterSnapshot || undefined,
            serviceWarrantyDurationDays: s.serviceWarrantyDurationDays || 0,
            serviceWarrantyTermsSnapshot: s.serviceWarrantyTermsSnapshot || undefined,
            serviceWarrantyExpiresAt: s.serviceWarrantyExpiresAt?.toISOString(),
            hasWarrantyClaim: s.hasWarrantyClaim,
            warrantyClaimDate: s.warrantyClaimDate ? s.warrantyClaimDate.toISOString() : undefined,
            warrantyClaimReason: s.warrantyClaimReason || undefined,
            isMechanicAbsentOnClaim: s.isMechanicAbsentOnClaim || undefined,
            warrantyDeductionAmount: s.warrantyDeductionAmount == null ? undefined : Number(s.warrantyDeductionAmount),
            version: s.version || 1,
          })),
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
        };
      } catch (err) {
        console.error('[ServiceRepo] Prisma getPaginated error:', err);
      }
    }

    let filtered = memoryStore.services;
    if (search) {
      filtered = filtered.filter(s =>
        s.customerName.toLowerCase().includes(search) ||
        s.vehiclePlate.toLowerCase().includes(search) ||
        s.vehicleModel.toLowerCase().includes(search) ||
        s.serviceType.toLowerCase().includes(search) ||
        s.id.toLowerCase().includes(search)
      );
    }
    if (status && status !== 'All') {
      filtered = filtered.filter(s => s.status === status);
    }

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginatedData = filtered.slice(startIndex, startIndex + limit);

    return {
      data: paginatedData,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  async getById(id: string): Promise<WorkshopService | null> {
    if (isDbConnected()) {
      try {
        const s = await prisma.workshopService.findUnique({
          where: { id },
          include: { partsUsed: true, serviceItems: true }
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
            normalPriceAtTime: p.normalPriceAtTime == null ? undefined : Number(p.normalPriceAtTime),
            wholesaleType: p.wholesaleType as any || undefined,
            wholesaleValue: p.wholesaleValue == null ? undefined : Number(p.wholesaleValue),
            wholesaleUnitPrice: p.wholesaleUnitPrice == null ? undefined : Number(p.wholesaleUnitPrice),
              hasProductWarranty: p.hasProductWarranty,
              warrantyDurationDays: p.warrantyDurationDays,
              warrantyTerms: p.warrantyTerms || undefined,
              warrantyExpiresAt: p.warrantyExpiresAt?.toISOString(),
            })),
            serviceItems: s.serviceItems.map(item => ({ name: item.name, price: Number(item.price) })),
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
            receiptType: data.receiptType || (data.serviceType === 'Retail' ? 'SALE' : 'SERVICE'),
            receiptHeaderSnapshot: data.receiptHeaderSnapshot,
            receiptFooterSnapshot: data.receiptFooterSnapshot,
            serviceWarrantyDurationDays: data.serviceWarrantyDurationDays || 0,
            serviceWarrantyTermsSnapshot: data.serviceWarrantyTermsSnapshot,
            serviceWarrantyExpiresAt: data.serviceWarrantyExpiresAt ? new Date(data.serviceWarrantyExpiresAt) : null,
            serviceItems: { create: (data.serviceItems || []).map(item => ({ name: item.name, price: item.price })) },
            partsUsed: {
              create: data.partsUsed.map(p => ({
                partId: p.partId,
                name: p.name,
                quantity: p.quantity,
                priceAtTime: p.priceAtTime,
                normalPriceAtTime: p.normalPriceAtTime,
                wholesaleType: p.wholesaleType || null,
                wholesaleValue: p.wholesaleValue,
                wholesaleUnitPrice: p.wholesaleUnitPrice,
                purchasePriceAtTime: p.purchasePriceAtTime,
                hasProductWarranty: !!p.hasProductWarranty,
                warrantyDurationDays: p.hasProductWarranty ? p.warrantyDurationDays || 0 : 0,
                warrantyTerms: p.hasProductWarranty ? p.warrantyTerms || null : null,
                warrantyExpiresAt: p.warrantyExpiresAt ? new Date(p.warrantyExpiresAt) : null,
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

  async updateStatus(id: string, status: string, expectedVersion?: number): Promise<WorkshopService | null> {
    if (isDbConnected()) {
      try {
        const current = await prisma.workshopService.findUnique({ where: { id } });
        if (!current) return null;

        if (expectedVersion !== undefined && current.version !== expectedVersion) {
          throw new Error(`Status servis '${id}' telah diubah oleh kasir lain (Versi DB: ${current.version}, versi Anda: ${expectedVersion}). Silakan muat ulang data.`);
        }

        await prisma.workshopService.update({
          where: { id },
          data: { 
            status,
            version: { increment: 1 }
          }
        });
      } catch (err: any) {
        console.error('[ServiceRepo] Prisma updateStatus error:', err);
        throw err;
      }
    }
    const idx = memoryStore.services.findIndex(s => s.id === id);
    if (idx === -1) return null;

    const current = memoryStore.services[idx];
    if (expectedVersion !== undefined && (current.version || 1) !== expectedVersion) {
      throw new Error(`Status servis '${id}' telah diubah oleh kasir lain. Silakan muat ulang data.`);
    }

    const newVersion = (current.version || 1) + 1;
    memoryStore.services[idx] = { 
      ...current, 
      status: status as any,
      version: newVersion
    };
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
