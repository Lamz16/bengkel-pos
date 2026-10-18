import { 
  IServiceRepository, 
  IPartRepository, 
  ICustomerRepository, 
  IDeductionRepository,
  IMechanicRepository 
} from '../repositories/interfaces';
import { PaginatedResult, WorkshopService } from '../../types';
import { PaginationParams } from '../repositories/interfaces';
import { isDbConnected, prisma } from '../db/connection';
import { randomUUID } from 'node:crypto';
import { AuthenticatedUser } from '../auth';

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

  async getPaginatedServices(params: PaginationParams): Promise<PaginatedResult<WorkshopService>> {
    return this.serviceRepo.getPaginated(params);
  }

  async getReceivables(params: PaginationParams): Promise<PaginatedResult<WorkshopService>> {
    return this.serviceRepo.getPaginated({ ...params, paymentStatus: 'OVERDUE' });
  }

  async getServiceById(id: string): Promise<WorkshopService | null> {
    return this.serviceRepo.getById(id);
  }

  async createService(data: WorkshopService, actor?: AuthenticatedUser): Promise<WorkshopService> {
    const serviceItems = data.receiptType === 'SALE' ? [] : (data.serviceItems || []).map(item => ({
      name: item.name.trim(), price: Number(item.price || 0),
    })).filter(item => item.name && item.price >= 0);
    if (data.receiptType !== 'SALE' && serviceItems.some(item => !Number.isFinite(item.price))) {
      throw new Error('Harga jasa tidak valid.');
    }
    const laborFee = data.receiptType === 'SALE'
      ? 0
      : serviceItems.length > 0
        ? serviceItems.reduce((total, item) => total + item.price, 0)
        : Number(data.laborFee || 0);
    // Bonus mekanik hanya berasal dari nilai jasa; nilai sparepart tidak pernah
    // menjadi dasar perhitungan bonus, termasuk transaksi Retail.
    const bonusPercent = data.receiptType === 'SALE' ? 0 : Number(data.mechanicBonusPercent || 0);
    const requestedPayments = (data.payments || []).map(payment => ({ amount: Number(payment.amount || 0), paymentMethod: payment.paymentMethod, referenceNo: payment.referenceNo, notes: payment.notes, paymentDate: payment.paymentDate })).filter(payment => Number.isFinite(payment.amount) && payment.amount > 0);
    const paidAmount = requestedPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const effectiveData: WorkshopService = {
      ...data,
      serviceItems,
      laborFee,
      mechanicBonusPercent: bonusPercent,
      mechanicBonusAmount: data.receiptType === 'SALE' ? 0 : Math.round((laborFee * bonusPercent) / 100),
    };
    if (paidAmount > effectiveData.totalAmount + 0.01) throw new Error('Nominal pembayaran melebihi total tagihan.');
    effectiveData.paymentStatus = paidAmount + 0.01 >= effectiveData.totalAmount ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Unpaid';
    if (effectiveData.paymentStatus === 'Paid') effectiveData.paymentDueDate = undefined;
    // Piutang tanpa tanggal yang dipilih kasir tetap memiliki tenggat yang jelas:
    // hari transaksi. Ini juga melindungi request API yang tidak berasal dari UI.
    if (effectiveData.paymentStatus !== 'Paid' && !effectiveData.paymentDueDate) {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      effectiveData.paymentDueDate = today.toISOString();
    }
    if (isDbConnected()) {
      // The form may carry a client-side temporary ID for React. Never persist it:
      // short SRV-xxx IDs collide under normal cashier use. The server is the
      // authority for new transaction identifiers.
      const id = randomUUID();
      const transactionDate = new Date();
      await prisma.$transaction(async tx => {
        // Conversion is atomic with the commercial transaction. A failure in
        // stock/payment creation rolls this check back and leaves the queue open.
        const originQueueId = effectiveData.originQueueId || undefined;
        if (originQueueId) {
          const queue = await tx.serviceQueue.findUnique({ where: { id: originQueueId } });
          if (!queue) throw new Error('Antrean asal tidak ditemukan.');
          if (queue.status === 'Converted') throw new Error('Antrean ini sudah dikonversi menjadi transaksi.');
          if (queue.status === 'Cancelled') throw new Error('Antrean yang dibatalkan tidak dapat dikonversi.');
        }
        const receiptSettings = await tx.companySettings.findFirst();
        const isSale = effectiveData.receiptType === 'SALE';
        // `serviceWarranty*` is labour-only.  Do not let a direct sale populate
        // this legacy field; sale-wide terms have their own immutable snapshot.
        const serviceWarrantyDurationDays = isSale ? 0 : Math.max(0, Number(effectiveData.serviceWarrantyDurationDays ?? 0));
        const serviceWarrantyEnabled = !isSale && !!effectiveData.serviceWarrantyEnabled && serviceWarrantyDurationDays > 0;
        const saleWarrantyDurationDays = isSale ? Math.max(0, Number(effectiveData.saleWarrantyDurationDays ?? 0)) : 0;
        const saleWarrantyEnabled = isSale && !!effectiveData.saleWarrantyEnabled && saleWarrantyDurationDays > 0;
        const serviceWarrantyTermsSnapshot = serviceWarrantyDurationDays > 0
          ? (effectiveData.serviceWarrantyTermsSnapshot || receiptSettings?.serviceWarrantyTerms || receiptSettings?.warrantyTerms || null)
          : null;
        const receiptHeaderSnapshot = effectiveData.receiptHeaderSnapshot || (isSale
          ? (receiptSettings?.saleReceiptHeader || receiptSettings?.receiptHeader || null)
          : (receiptSettings?.serviceReceiptHeader || receiptSettings?.receiptHeader || null));
        const receiptFooterSnapshot = effectiveData.receiptFooterSnapshot || (isSale
          ? (receiptSettings?.saleReceiptFooter || receiptSettings?.footerNote || null)
          : (receiptSettings?.serviceReceiptFooter || receiptSettings?.footerNote || null));
        const partIds = [...new Set((effectiveData.partsUsed || []).map(item => item.partId).filter(Boolean))];
        const partWarranty = new Map((await tx.sparePart.findMany({
          where: { id: { in: partIds } },
          select: { id: true, hasProductWarranty: true, warrantyDurationDays: true, warrantyTerms: true, purchasePrice: true },
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

        await (tx.workshopService as any).create({ data: {
          id, customerId: effectiveData.customerId || null, customerName: effectiveData.customerName,
          // Creator comes exclusively from authenticated server context, never
          // from the client payload, and keeps an immutable audit snapshot.
          createdByUserId: actor?.id || null,
          createdByNameSnapshot: actor?.name || null,
          createdByRoleSnapshot: actor?.role || null,
          // Merchant identity is copied with the transaction so an old receipt
          // remains truthful after the workshop profile is changed.
          companyNameSnapshot: receiptSettings?.name || null,
          companyAddressSnapshot: receiptSettings?.address || null,
          companyPhoneSnapshot: receiptSettings?.phone || null,
          companySloganSnapshot: receiptSettings?.slogan || null,
          customerPhone: effectiveData.customerPhone, vehicleId: effectiveData.vehicleId || null,
          vehiclePlate: effectiveData.vehiclePlate, vehicleModel: effectiveData.vehicleModel,
          kilometers: effectiveData.kilometers, complaint: effectiveData.complaint,
          diagnosis: effectiveData.diagnosis, status: effectiveData.status, laborFee: effectiveData.laborFee,
          totalAmount: effectiveData.totalAmount, paymentStatus: effectiveData.paymentStatus,
          paymentDueDate: effectiveData.paymentDueDate ? new Date(effectiveData.paymentDueDate) : null,
          discountAmount: effectiveData.discountAmount, discountReason: effectiveData.discountReason,
          mechanicId: effectiveData.mechanicId || null, mechanicName: effectiveData.mechanicName,
          mechanicBonusPercent: effectiveData.mechanicBonusPercent, mechanicBonusAmount: effectiveData.mechanicBonusAmount,
          receiptType: isSale ? 'SALE' : 'SERVICE',
          receiptHeaderSnapshot,
          receiptFooterSnapshot,
          saleWarrantyEnabled,
          saleWarrantyDurationDays,
          saleWarrantyTermsSnapshot: saleWarrantyEnabled ? (effectiveData.saleWarrantyTermsSnapshot?.trim() || null) : null,
          saleWarrantyStartedAt: saleWarrantyEnabled ? transactionDate : null,
          saleWarrantyExpiresAt: saleWarrantyEnabled ? new Date(transactionDate.getTime() + saleWarrantyDurationDays * 86_400_000) : null,
          serviceWarrantyEnabled,
          serviceWarrantyDurationDays,
          serviceWarrantyTermsSnapshot,
          serviceWarrantyStartedAt: serviceWarrantyEnabled ? transactionDate : null,
          serviceWarrantyExpiresAt: serviceWarrantyDurationDays > 0 ? new Date(transactionDate.getTime() + serviceWarrantyDurationDays * 86_400_000) : null,
          originQueueId: originQueueId || null,
          payments: requestedPayments.length ? { create: requestedPayments.map(payment => ({ amount: payment.amount, paymentMethod: payment.paymentMethod!, referenceNo: payment.referenceNo || null, notes: payment.notes || null, paymentDate: payment.paymentDate ? new Date(payment.paymentDate) : transactionDate })) } : undefined,
          serviceItems: { create: (effectiveData.serviceItems || []).map(item => ({ name: item.name, price: item.price })) },
          partsUsed: { create: (effectiveData.partsUsed || []).map(item => {
            const warranty = partWarranty.get(item.partId);
            // An explicit per-item value is an override; otherwise the master is
            // copied once.  Neither path mutates the master product.
            // A missing client field must never accidentally turn off a warranty
            // configured on the master item. Only an explicit cashier override may
            // replace the copied master snapshot.
            const overridden = item.productWarrantyOverride === true;
            const enabled = overridden ? !!item.hasProductWarranty : !!warranty?.hasProductWarranty;
            const duration = enabled ? Number(overridden ? (item.warrantyDurationDays ?? 0) : (warranty?.warrantyDurationDays ?? 0)) : 0;
            const terms = enabled ? (overridden ? (item.warrantyTerms ?? null) : (warranty?.warrantyTerms ?? null)) : null;
            return {
              partId: item.partId, name: item.name, quantity: item.quantity, priceAtTime: item.priceAtTime,
              normalPriceAtTime: item.normalPriceAtTime || item.priceAtTime,
              wholesaleType: item.wholesaleType || null,
              wholesaleValue: item.wholesaleValue || null,
              wholesaleUnitPrice: item.wholesaleUnitPrice || null,
              // Cost snapshots are always taken from the server-side master;
              // never trust a browser payload for financial reporting.
              purchasePriceAtTime: warranty ? warranty.purchasePrice : undefined,
              hasProductWarranty: enabled,
              warrantyDurationDays: duration,
              warrantyTerms: terms,
              warrantyStartedAt: enabled ? transactionDate : null,
              warrantyExpiresAt: duration > 0 ? new Date(transactionDate.getTime() + duration * 86_400_000) : null,
            };
          }) },
        }});

        if (effectiveData.customerId) await tx.customer.update({
          where: { id: effectiveData.customerId },
          data: { totalServiceCount: { increment: 1 }, totalSpent: { increment: effectiveData.totalAmount }, lastVisitDate: transactionDate },
        });
        if (originQueueId) {
          const converted = await tx.serviceQueue.updateMany({
            where: { id: originQueueId, status: { in: ['Waiting', 'In Progress', 'Ready'] } },
            data: { status: 'Converted', convertedAt: transactionDate, version: { increment: 1 } },
          });
          if (converted.count !== 1) throw new Error('Antrean tidak dapat dikonversi karena statusnya telah berubah.');
        }
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
    if (!data.customerName?.trim() || (data.receiptType !== 'SALE' && (!data.vehiclePlate?.trim() || !data.vehicleModel?.trim()))) {
      throw new Error('Data order servis tidak lengkap.');
    }
    const serviceItems = (data.serviceItems || []).map(item => ({ name: item.name.trim(), price: Number(item.price || 0) })).filter(item => item.name);
    if (serviceItems.some(item => !Number.isFinite(item.price) || item.price < 0)) throw new Error('Harga jasa tidak valid.');
    const laborFee = serviceItems.reduce((total, item) => total + item.price, 0);
    const totalParts = (data.partsUsed || []).reduce((total, item) => total + Number(item.priceAtTime || 0) * Number(item.quantity || 0), 0);
    const discountAmount = Math.max(0, Number(data.discountAmount || 0));
    const effectiveData = { ...data, id, serviceItems, laborFee, totalAmount: Math.max(0, totalParts + laborFee - discountAmount), mechanicBonusAmount: Math.round(laborFee * Number(data.mechanicBonusPercent || 0) / 100) };

    if (!isDbConnected()) return (this.serviceRepo as any).update?.(id, effectiveData, expectedVersion) || null;
    await prisma.$transaction(async tx => {
      const previous = await tx.workshopService.findUnique({ where: { id }, include: { partsUsed: true, returns: true } });
      if (!previous) throw new Error('Order servis tidak ditemukan.');
      if (previous.status === 'Done' || previous.returns.length > 0) throw new Error('Transaksi selesai atau yang sudah memiliki retur tidak dapat diedit.');
      if (expectedVersion !== undefined && previous.version !== expectedVersion) throw new Error(`Order servis '${id}' telah diubah oleh kasir lain. Silakan muat ulang data.`);
      const previousWarranty = new Map(previous.partsUsed.map(item => [item.partId, item]));
      const currentPartWarranty = new Map((await tx.sparePart.findMany({
        where: { id: { in: effectiveData.partsUsed.map(item => item.partId).filter(Boolean) } },
        select: { id: true, hasProductWarranty: true, warrantyDurationDays: true, warrantyTerms: true },
      })).map(item => [item.id, item]));
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
        vehiclePlate: effectiveData.vehiclePlate, vehicleModel: effectiveData.vehicleModel, kilometers: effectiveData.kilometers, complaint: effectiveData.complaint, diagnosis: effectiveData.diagnosis,
        laborFee: effectiveData.laborFee, totalAmount: effectiveData.totalAmount, paymentStatus: effectiveData.paymentStatus, paymentDueDate: effectiveData.paymentStatus === 'Paid' ? null : (effectiveData.paymentDueDate ? new Date(effectiveData.paymentDueDate) : (() => { const today = new Date(); today.setHours(23, 59, 59, 999); return today; })()), discountAmount: effectiveData.discountAmount, discountReason: effectiveData.discountReason,
        mechanicId: effectiveData.mechanicId || null, mechanicName: effectiveData.mechanicName, mechanicBonusPercent: effectiveData.mechanicBonusPercent, mechanicBonusAmount: effectiveData.mechanicBonusAmount,
        version: { increment: 1 }, serviceItems: { deleteMany: {}, create: serviceItems }, partsUsed: { deleteMany: {}, create: effectiveData.partsUsed.map(item => {
          const historic = previousWarranty.get(item.partId);
          const master = currentPartWarranty.get(item.partId);
          const overridden = item.productWarrantyOverride === true;
          // Retained lines preserve their old snapshot. A newly added line copies
          // the current master unless cashier explicitly overrides it.
          const enabled = overridden ? !!item.hasProductWarranty : (historic?.hasProductWarranty ?? !!master?.hasProductWarranty);
          const duration = enabled ? (overridden ? Number(item.warrantyDurationDays || 0) : Number(historic?.warrantyDurationDays ?? master?.warrantyDurationDays ?? 0)) : 0;
          const terms = enabled ? (overridden ? item.warrantyTerms || null : historic?.warrantyTerms || master?.warrantyTerms || null) : null;
          return { partId: item.partId, name: item.name, quantity: item.quantity, priceAtTime: item.priceAtTime, normalPriceAtTime: item.normalPriceAtTime || item.priceAtTime, wholesaleType: item.wholesaleType || null, wholesaleValue: item.wholesaleValue || null, wholesaleUnitPrice: item.wholesaleUnitPrice || null, hasProductWarranty: enabled, warrantyDurationDays: duration, warrantyTerms: terms, warrantyStartedAt: historic?.warrantyStartedAt || (enabled ? new Date() : null), warrantyExpiresAt: historic?.warrantyExpiresAt || (duration > 0 ? new Date(Date.now() + duration * 86_400_000) : null) };
        }) },
      }});
    });
    return this.serviceRepo.getById(id);
  }

  async markPaid(id: string): Promise<WorkshopService | null> {
    return this.serviceRepo.markPaid(id);
  }

  async addPayment(id: string, data: { amount?: number; cashReceived?: number; amountTendered?: number; paymentMethod: 'Cash' | 'Transfer' | 'QRIS'; referenceNo?: string; notes?: string; paymentDate?: string; expectedVersion: number }): Promise<WorkshopService | null> {
    if (!isDbConnected()) throw new Error('Pembayaran transaksi memerlukan koneksi database.');
    if (!['Cash', 'Transfer', 'QRIS'].includes(data.paymentMethod)) throw new Error('Metode pembayaran tidak valid.');
    const paymentDate = data.paymentDate ? new Date(data.paymentDate) : new Date();
    if (Number.isNaN(paymentDate.getTime())) throw new Error('Tanggal pembayaran tidak valid.');

    await prisma.$transaction(async tx => {
      const service = await tx.workshopService.findUnique({ where: { id }, include: { payments: true } });
      if (!service) throw new Error('Order servis tidak ditemukan.');
      if (service.version !== data.expectedVersion) throw new Error('Transaksi telah diubah oleh pengguna lain. Silakan muat ulang data.');
      const paid = service.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      const remaining = Number(service.totalAmount) - paid;
      if (remaining <= 0) throw new Error('Transaksi ini sudah lunas dan tidak dapat menerima pembayaran baru.');
      const tendered = Number(data.cashReceived ?? data.amountTendered ?? data.amount);
      if (!Number.isSafeInteger(tendered) || tendered <= 0) throw new Error('Nominal pembayaran harus berupa rupiah positif tanpa pecahan.');
      if (data.paymentMethod !== 'Cash' && tendered > remaining) throw new Error(`Nominal melebihi sisa tagihan (${remaining.toLocaleString('id-ID')}).`);
      const amount = data.paymentMethod === 'Cash' ? Math.min(tendered, remaining) : tendered;
      const changeAmount = data.paymentMethod === 'Cash' ? Math.max(0, tendered - remaining) : 0;
      const nextPaid = paid + amount;
      await tx.servicePayment.create({ data: { serviceId: id, amount, cashReceived: data.paymentMethod === 'Cash' ? tendered : null, changeAmount: data.paymentMethod === 'Cash' ? changeAmount : null, paymentMethod: data.paymentMethod, referenceNo: data.referenceNo || null, notes: data.notes || null, paymentDate } });
      const isPaid = nextPaid + 0.01 >= Number(service.totalAmount);
      const changed = await tx.workshopService.updateMany({
        where: { id, version: data.expectedVersion },
        data: { paymentStatus: isPaid ? 'Paid' : 'Partial', ...(isPaid ? { paymentDueDate: null } : {}), version: { increment: 1 } },
      });
      if (changed.count !== 1) throw new Error('Transaksi telah diubah oleh pengguna lain. Silakan muat ulang data.');
    }, { isolationLevel: 'Serializable' });
    return this.serviceRepo.getById(id);
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
        const returned = await tx.servicePartItem.updateMany({
          where: { id: item.servicePartId, returnedQuantity: { lte: service.partsUsed.find(part => part.id === item.servicePartId)!.quantity - item.quantity } },
          data: { returnedQuantity: { increment: item.quantity } },
        });
        if (returned.count !== 1) throw new Error(`Jumlah retur ${item.name} melebihi sisa yang dapat diretur.`);
        await tx.sparePart.update({ where: { id: item.partId }, data: { stock: { increment: item.quantity } } });
        await tx.stockHistory.create({ data: { partId: item.partId, partName: item.name, amount: item.quantity, type: 'In', reason: `Retur ${record.id} dari transaksi ${service.id}` } });
      }
      await tx.workshopService.update({ where: { id: service.id }, data: { totalAmount: { decrement: refund }, version: { increment: 1 } } });
      if (service.customerId) await tx.customer.update({ where: { id: service.customerId }, data: { totalSpent: { decrement: refund } } });
    }, { isolationLevel: 'Serializable' });

    const updated = await this.serviceRepo.getById(data.serviceId);
    if (!updated) throw new Error('Transaksi retur berhasil tetapi data tidak dapat dimuat.');
    return updated;
  }

  async applyWarrantyClaim(data: {
    serviceId: string;
    reason: string;
    isAbsentNextDay: boolean;
    applyMechanicDeduction: boolean;
  }): Promise<{ service: WorkshopService | null; deductionCreated: boolean }> {
    const srv = await this.serviceRepo.getById(data.serviceId);
    if (!srv) {
      throw new Error('Service order not found');
    }
    const hasActiveProductWarranty = srv.partsUsed.some(item => item.hasProductWarranty && (item.warrantyDurationDays || 0) > 0 && (!item.warrantyExpiresAt || new Date(item.warrantyExpiresAt) >= new Date()));
    const hasLegacySaleWarranty = srv.receiptType === 'SALE' && !srv.saleWarrantyEnabled && !srv.saleWarrantyStartedAt && (srv.serviceWarrantyDurationDays || 0) > 0;
    const saleWarrantyDays = srv.saleWarrantyDurationDays || (hasLegacySaleWarranty ? srv.serviceWarrantyDurationDays || 0 : 0);
    const saleWarrantyExpiresAt = srv.saleWarrantyExpiresAt || (hasLegacySaleWarranty ? srv.serviceWarrantyExpiresAt : undefined);
    const hasActiveSaleWarranty = (!!srv.saleWarrantyEnabled || hasLegacySaleWarranty) && saleWarrantyDays > 0 && (!saleWarrantyExpiresAt || new Date(saleWarrantyExpiresAt) >= new Date());
    if (srv.receiptType === 'SALE' && !hasActiveSaleWarranty && !hasActiveProductWarranty) throw new Error('Transaksi ini tidak memiliki garansi transaksi atau produk yang masih aktif.');
    const hasServiceWarranty = !!srv.serviceWarrantyEnabled || (!srv.serviceWarrantyStartedAt && (srv.serviceWarrantyDurationDays || 0) > 0);
    if (srv.receiptType !== 'SALE' && (!hasServiceWarranty || !srv.serviceWarrantyDurationDays || srv.serviceWarrantyDurationDays < 1)) throw new Error('Transaksi ini tidak memiliki garansi jasa aktif.');
    if (srv.receiptType !== 'SALE' && srv.serviceWarrantyExpiresAt && new Date(srv.serviceWarrantyExpiresAt) < new Date()) throw new Error('Masa garansi transaksi telah berakhir.');
    if (srv.hasWarrantyClaim) throw new Error('Klaim garansi untuk transaksi ini sudah pernah diproses.');

    let penalty = 0;
    if (srv.receiptType !== 'SALE' && data.applyMechanicDeduction && srv.mechanicId) {
      const mec = await this.mechanicRepo.getById(srv.mechanicId);
      if (mec) {
        penalty = mec.warrantyPenaltyAmount || 75000;
        if (data.isAbsentNextDay) {
          penalty += (mec.absencePenaltyAmount || 50000);
        }
      }
    }

    const claimDate = new Date();
    let deductionCreated = false;
    if (isDbConnected()) {
      await prisma.$transaction(async tx => {
        const claimed = await tx.workshopService.updateMany({ where: { id: data.serviceId, hasWarrantyClaim: false }, data: {
          hasWarrantyClaim: true, warrantyClaimDate: claimDate, warrantyClaimReason: data.reason,
          isMechanicAbsentOnClaim: data.applyMechanicDeduction && data.isAbsentNextDay,
          warrantyDeductionAmount: penalty, status: srv.receiptType === 'SALE' ? srv.status : 'In Progress', version: { increment: 1 },
        }});
        if (claimed.count !== 1) throw new Error('Klaim garansi untuk transaksi ini sudah pernah diproses.');
        if (srv.receiptType !== 'SALE' && data.applyMechanicDeduction && srv.mechanicId) {
          await tx.mechanicDeduction.create({ data: {
            mechanicId: srv.mechanicId, mechanicName: srv.mechanicName || 'Mekanik', serviceId: data.serviceId,
            vehiclePlate: srv.vehiclePlate, date: claimDate,
            reason: data.isAbsentNextDay ? `Klaim Garansi: ${data.reason} + Denda Absen Keesokan Hari` : `Klaim Garansi Servis Ulang: ${data.reason}`,
            type: 'Penalty', amount: penalty, isAbsentNextDay: data.isAbsentNextDay,
          }});
          deductionCreated = true;
        }
      });
      return { service: await this.serviceRepo.getById(data.serviceId), deductionCreated };
    }

    const updatedSrv = await this.serviceRepo.updateWarrantyClaim({
      serviceId: data.serviceId, reason: data.reason,
      isAbsent: data.applyMechanicDeduction && data.isAbsentNextDay,
      deductionAmount: penalty, claimDate,
    });
    if (srv.receiptType !== 'SALE' && data.applyMechanicDeduction && srv.mechanicId) {
      await this.deductionRepo.create({ mechanicId: srv.mechanicId, mechanicName: srv.mechanicName || 'Mekanik', serviceId: data.serviceId, vehiclePlate: srv.vehiclePlate, date: claimDate.toISOString(), reason: `Klaim Garansi Servis Ulang: ${data.reason}`, type: 'Penalty', amount: penalty, isAbsentNextDay: data.isAbsentNextDay });
      deductionCreated = true;
    }

    return { service: updatedSrv, deductionCreated };
  }
}
