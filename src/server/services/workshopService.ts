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
    const serviceItems = data.serviceType === 'Retail' ? [] : (data.serviceItems || []).map(item => ({
      name: item.name.trim(), price: Number(item.price || 0),
    })).filter(item => item.name && item.price >= 0);
    if (data.serviceType !== 'Retail' && serviceItems.some(item => !Number.isFinite(item.price))) {
      throw new Error('Harga jasa tidak valid.');
    }
    const laborFee = data.serviceType === 'Retail'
      ? 0
      : serviceItems.length > 0
        ? serviceItems.reduce((total, item) => total + item.price, 0)
        : Number(data.laborFee || 0);
    // Bonus mekanik hanya berasal dari nilai jasa; nilai sparepart tidak pernah
    // menjadi dasar perhitungan bonus, termasuk transaksi Retail.
    const bonusPercent = data.serviceType === 'Retail' ? 0 : Number(data.mechanicBonusPercent || 0);
    const effectiveData: WorkshopService = {
      ...data,
      serviceItems,
      laborFee,
      mechanicBonusPercent: bonusPercent,
      mechanicBonusAmount: data.serviceType === 'Retail' ? 0 : Math.round((laborFee * bonusPercent) / 100),
    };
    if (isDbConnected()) {
      const id = effectiveData.id || `SRV-${Date.now().toString().slice(-8)}`;
      const transactionDate = new Date();
      await prisma.$transaction(async tx => {
        const receiptSettings = await tx.companySettings.findFirst();
        const isSale = effectiveData.serviceType === 'Retail';
        const serviceWarrantyDurationDays = isSale
          ? 0
          : Math.max(0, Number(effectiveData.serviceWarrantyDurationDays ?? receiptSettings?.defaultServiceWarrantyDays ?? 0));
        const serviceWarrantyTermsSnapshot = isSale
          ? null
          : (effectiveData.serviceWarrantyTermsSnapshot || receiptSettings?.serviceWarrantyTerms || receiptSettings?.warrantyTerms || null);
        const receiptHeaderSnapshot = effectiveData.receiptHeaderSnapshot || (isSale
          ? (receiptSettings?.saleReceiptHeader || receiptSettings?.receiptHeader || 'NOTA PEMBELIAN BARANG')
          : (receiptSettings?.serviceReceiptHeader || receiptSettings?.receiptHeader || 'NOTA TRANSAKSI SERVIS'));
        const receiptFooterSnapshot = effectiveData.receiptFooterSnapshot || (isSale
          ? (receiptSettings?.saleReceiptFooter || receiptSettings?.footerNote || null)
          : (receiptSettings?.serviceReceiptFooter || receiptSettings?.footerNote || null));
        const partIds = [...new Set((effectiveData.partsUsed || []).map(item => item.partId).filter(Boolean))];
        const partWarranty = new Map((await tx.sparePart.findMany({
          where: { id: { in: partIds } },
          select: { id: true, hasProductWarranty: true, warrantyDurationDays: true, warrantyTerms: true },
        })).map(part => [part.id, part]));

        for (const item of effectiveData.partsUsed || []) {
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
          id, customerId: effectiveData.customerId || null, customerName: effectiveData.customerName,
          customerPhone: effectiveData.customerPhone, vehicleId: effectiveData.vehicleId || null,
          vehiclePlate: effectiveData.vehiclePlate, vehicleModel: effectiveData.vehicleModel,
          kilometers: effectiveData.kilometers, serviceType: effectiveData.serviceType, complaint: effectiveData.complaint,
          diagnosis: effectiveData.diagnosis, status: effectiveData.status, laborFee: effectiveData.laborFee,
          totalAmount: effectiveData.totalAmount, paymentStatus: effectiveData.paymentStatus,
          discountAmount: effectiveData.discountAmount, discountReason: effectiveData.discountReason,
          mechanicId: effectiveData.mechanicId || null, mechanicName: effectiveData.mechanicName,
          mechanicBonusPercent: effectiveData.mechanicBonusPercent, mechanicBonusAmount: effectiveData.mechanicBonusAmount,
          receiptType: isSale ? 'SALE' : 'SERVICE',
          receiptHeaderSnapshot,
          receiptFooterSnapshot,
          serviceWarrantyDurationDays,
          serviceWarrantyTermsSnapshot,
          serviceWarrantyExpiresAt: serviceWarrantyDurationDays > 0 ? new Date(transactionDate.getTime() + serviceWarrantyDurationDays * 86_400_000) : null,
          serviceItems: { create: (effectiveData.serviceItems || []).map(item => ({ name: item.name, price: item.price })) },
          partsUsed: { create: (effectiveData.partsUsed || []).map(item => {
            const warranty = partWarranty.get(item.partId);
            const duration = item.hasProductWarranty ? Number(item.warrantyDurationDays || 0) : 0;
            const terms = item.hasProductWarranty ? (item.warrantyTerms || warranty?.warrantyTerms || null) : null;
            return {
              partId: item.partId, name: item.name, quantity: item.quantity, priceAtTime: item.priceAtTime,
              normalPriceAtTime: item.normalPriceAtTime || item.priceAtTime,
              wholesaleType: item.wholesaleType || null,
              wholesaleValue: item.wholesaleValue || null,
              wholesaleUnitPrice: item.wholesaleUnitPrice || null,
              hasProductWarranty: !!warranty?.hasProductWarranty,
              warrantyDurationDays: duration,
              warrantyTerms: terms,
              warrantyExpiresAt: duration > 0 ? new Date(transactionDate.getTime() + duration * 86_400_000) : null,
            };
          }) },
        }});

        if (effectiveData.customerId) await tx.customer.update({
          where: { id: effectiveData.customerId },
          data: { totalServiceCount: { increment: 1 }, totalSpent: { increment: effectiveData.totalAmount }, lastVisitDate: transactionDate },
        });
      });
      const persisted = await this.serviceRepo.getById(id);
      if (!persisted) throw new Error('Transaksi servis tersimpan tetapi gagal dimuat kembali.');
      return persisted;
    }

    const created = await this.serviceRepo.create(effectiveData);

    // Business Logic: Automatically adjust inventory stock for used parts
    if (effectiveData.partsUsed && effectiveData.partsUsed.length > 0) {
      for (const part of effectiveData.partsUsed) {
        if (part.partId && part.quantity > 0) {
          await this.partRepo.adjustStock(part.partId, -part.quantity);
        }
      }
    }

    // Business Logic: Update customer visit stats and loyalty tier
    if (effectiveData.customerId) {
      await this.customerRepo.incrementStats(effectiveData.customerId, effectiveData.totalAmount);
    }

    return created;
  }

  async updateStatus(id: string, status: string): Promise<WorkshopService | null> {
    return this.serviceRepo.updateStatus(id, status);
  }

  async updateService(id: string, data: WorkshopService, expectedVersion?: number): Promise<WorkshopService | null> {
    if (!data.customerName?.trim() || !data.vehiclePlate?.trim() || !data.vehicleModel?.trim() || !data.serviceType?.trim()) {
      throw new Error('Data order servis tidak lengkap.');
    }
    const serviceItems = (data.serviceItems || []).map(item => ({ name: item.name.trim(), price: Number(item.price || 0) })).filter(item => item.name);
    if (serviceItems.some(item => !Number.isFinite(item.price) || item.price < 0)) throw new Error('Harga jasa tidak valid.');
    const laborFee = serviceItems.reduce((total, item) => total + item.price, 0);
    const totalParts = (data.partsUsed || []).reduce((total, item) => total + Number(item.priceAtTime || 0) * Number(item.quantity || 0), 0);
    const discountAmount = Math.max(0, Number(data.discountAmount || 0));
    const effectiveData = { ...data, id, serviceItems, laborFee, totalAmount: Math.max(0, totalParts + laborFee - discountAmount), mechanicBonusAmount: Math.round(laborFee * Number(data.mechanicBonusPercent || 0) / 100) };

    if (!isDbConnected()) return this.serviceRepo.update(id, effectiveData, expectedVersion);
    await prisma.$transaction(async tx => {
      const previous = await tx.workshopService.findUnique({ where: { id }, include: { partsUsed: true, returns: true } });
      if (!previous) throw new Error('Order servis tidak ditemukan.');
      if (previous.status === 'Done' || previous.returns.length > 0) throw new Error('Transaksi selesai atau yang sudah memiliki retur tidak dapat diedit.');
      if (expectedVersion !== undefined && previous.version !== expectedVersion) throw new Error(`Order servis '${id}' telah diubah oleh kasir lain. Silakan muat ulang data.`);
      const previousQuantities = new Map<string, number>();
      previous.partsUsed.forEach(item => previousQuantities.set(item.partId, (previousQuantities.get(item.partId) || 0) + item.quantity));
      const nextQuantities = new Map<string, number>();
      effectiveData.partsUsed.forEach(item => {
        if (!item.partId || !Number.isInteger(item.quantity) || item.quantity <= 0) throw new Error('Jumlah sparepart tidak valid.');
        nextQuantities.set(item.partId, (nextQuantities.get(item.partId) || 0) + item.quantity);
      });
      for (const partId of new Set([...previousQuantities.keys(), ...nextQuantities.keys()])) {
        const delta = (nextQuantities.get(partId) || 0) - (previousQuantities.get(partId) || 0);
        if (!delta) continue;
        const changed = delta > 0
          ? await tx.sparePart.updateMany({ where: { id: partId, stock: { gte: delta } }, data: { stock: { decrement: delta } } })
          : await tx.sparePart.updateMany({ where: { id: partId }, data: { stock: { increment: -delta } } });
        if (changed.count !== 1) throw new Error('Stok sparepart tidak mencukupi.');
        await tx.stockHistory.create({ data: { partId, partName: effectiveData.partsUsed.find(item => item.partId === partId)?.name || previous.partsUsed.find(item => item.partId === partId)?.name || 'Sparepart', amount: Math.abs(delta), type: delta > 0 ? 'Out' : 'In', reason: `Penyesuaian transaksi servis ${id}` } });
      }
      if (previous.customerId && previous.customerId !== effectiveData.customerId) await tx.customer.update({ where: { id: previous.customerId }, data: { totalServiceCount: { decrement: 1 }, totalSpent: { decrement: previous.totalAmount } } });
      if (effectiveData.customerId && previous.customerId !== effectiveData.customerId) await tx.customer.update({ where: { id: effectiveData.customerId }, data: { totalServiceCount: { increment: 1 }, totalSpent: { increment: effectiveData.totalAmount }, lastVisitDate: new Date() } });
      if (previous.customerId && previous.customerId === effectiveData.customerId && Number(previous.totalAmount) !== effectiveData.totalAmount) await tx.customer.update({ where: { id: previous.customerId }, data: { totalSpent: { increment: effectiveData.totalAmount - Number(previous.totalAmount) } } });
      await tx.workshopService.update({ where: { id }, data: {
        customerId: effectiveData.customerId || null, customerName: effectiveData.customerName, customerPhone: effectiveData.customerPhone, vehicleId: effectiveData.vehicleId || null,
        vehiclePlate: effectiveData.vehiclePlate, vehicleModel: effectiveData.vehicleModel, kilometers: effectiveData.kilometers, serviceType: effectiveData.serviceType, complaint: effectiveData.complaint, diagnosis: effectiveData.diagnosis,
        laborFee: effectiveData.laborFee, totalAmount: effectiveData.totalAmount, paymentStatus: effectiveData.paymentStatus, discountAmount: effectiveData.discountAmount, discountReason: effectiveData.discountReason,
        mechanicId: effectiveData.mechanicId || null, mechanicName: effectiveData.mechanicName, mechanicBonusPercent: effectiveData.mechanicBonusPercent, mechanicBonusAmount: effectiveData.mechanicBonusAmount,
        version: { increment: 1 }, serviceItems: { deleteMany: {}, create: serviceItems }, partsUsed: { deleteMany: {}, create: effectiveData.partsUsed.map(item => ({ partId: item.partId, name: item.name, quantity: item.quantity, priceAtTime: item.priceAtTime, normalPriceAtTime: item.normalPriceAtTime || item.priceAtTime, wholesaleType: item.wholesaleType || null, wholesaleValue: item.wholesaleValue || null, wholesaleUnitPrice: item.wholesaleUnitPrice || null, hasProductWarranty: !!item.hasProductWarranty, warrantyDurationDays: item.hasProductWarranty ? item.warrantyDurationDays || 0 : 0, warrantyTerms: item.hasProductWarranty ? item.warrantyTerms || null : null })) },
      }});
    });
    return this.serviceRepo.getById(id);
  }

  async markPaid(id: string): Promise<WorkshopService | null> {
    return this.serviceRepo.markPaid(id);
  }

  async processReturn(data: { serviceId: string; reason?: string; items: Array<{ partId: string; quantity: number }> }): Promise<WorkshopService> {
    if (!isDbConnected()) throw new Error('Retur memerlukan koneksi database.');
    const requests = data.items.filter(item => item.partId && Number.isInteger(item.quantity) && item.quantity > 0);
    if (!requests.length) throw new Error('Pilih minimal satu barang yang akan diretur.');

    await prisma.$transaction(async tx => {
      const service = await tx.workshopService.findUnique({
        where: { id: data.serviceId }, include: { partsUsed: true }
      });
      if (!service) throw new Error('Transaksi asal tidak ditemukan.');
      if (service.status !== 'Done') throw new Error('Retur hanya dapat diproses pada transaksi selesai.');

      let refund = 0;
      const returnItems: Array<{ servicePartId: string; partId: string; name: string; quantity: number; unitPrice: any }> = [];
      for (const request of requests) {
        const sold = service.partsUsed.find(item => item.partId === request.partId);
        if (!sold) throw new Error('Barang retur tidak ditemukan pada transaksi asal.');
        const remaining = sold.quantity - sold.returnedQuantity;
        if (request.quantity > remaining) throw new Error(`Jumlah retur ${sold.name} melebihi sisa yang dapat diretur (${remaining}).`);
        refund += Number(sold.priceAtTime) * request.quantity;
        returnItems.push({ servicePartId: sold.id, partId: sold.partId, name: sold.name, quantity: request.quantity, unitPrice: sold.priceAtTime });
      }

      const record = await tx.salesReturn.create({ data: {
        serviceId: service.id, reason: data.reason?.trim() || null, totalAmount: refund,
        items: { create: returnItems }
      }});
      for (const item of returnItems) {
        await tx.servicePartItem.update({ where: { id: item.servicePartId }, data: { returnedQuantity: { increment: item.quantity } } });
        await tx.sparePart.update({ where: { id: item.partId }, data: { stock: { increment: item.quantity } } });
        await tx.stockHistory.create({ data: { partId: item.partId, partName: item.name, amount: item.quantity, type: 'In', reason: `Retur ${record.id} dari transaksi ${service.id}` } });
      }
      await tx.workshopService.update({ where: { id: service.id }, data: { totalAmount: { decrement: refund }, version: { increment: 1 } } });
      if (service.customerId) await tx.customer.update({ where: { id: service.customerId }, data: { totalSpent: { decrement: refund } } });
    });

    const updated = await this.serviceRepo.getById(data.serviceId);
    if (!updated) throw new Error('Transaksi retur berhasil tetapi data tidak dapat dimuat.');
    return updated;
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
