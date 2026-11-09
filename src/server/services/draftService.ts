import { randomUUID } from 'node:crypto';
import { prisma, isDbConnected } from '../db/connection';
import { memoryStore } from '../db/memoryStore';
import { TransactionDraft } from '../../types';

function mapDraft(row: any): TransactionDraft {
  return {
    id: row.id,
    draftCode: row.draftCode,
    receiptType: row.receiptType || 'SERVICE',
    customerName: row.customerName,
    customerPhone: row.customerPhone || undefined,
    customerId: row.customerId || undefined,
    vehiclePlate: row.vehiclePlate || undefined,
    vehicleModel: row.vehicleModel || undefined,
    vehicleId: row.vehicleId || undefined,
    kilometers: row.kilometers != null ? Number(row.kilometers) : undefined,
    complaint: row.complaint || undefined,
    diagnosis: row.diagnosis || undefined,
    laborFee: Number(row.laborFee || 0),
    totalAmount: Number(row.totalAmount || 0),
    discountAmount: Number(row.discountAmount || 0),
    discountReason: row.discountReason || undefined,
    mechanicId: row.mechanicId || undefined,
    mechanicName: row.mechanicName || undefined,
    mechanicBonusPercent: row.mechanicBonusPercent != null ? Number(row.mechanicBonusPercent) : undefined,
    originQueueId: row.originQueueId || undefined,
    note: row.note || undefined,
    itemsPayload: typeof row.itemsPayload === 'string'
      ? JSON.parse(row.itemsPayload)
      : (row.itemsPayload || { partsUsed: [], serviceItems: [] }),
    createdById: row.createdById || undefined,
    createdByName: row.createdByName || undefined,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt || new Date().toISOString()),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt || new Date().toISOString()),
  };
}

function generateDraftCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `DFT-${num}`;
}

export class DraftService {
  async list(): Promise<TransactionDraft[]> {
    if (isDbConnected()) {
      try {
        const rows = await (prisma as any).transactionDraft.findMany({
          orderBy: { createdAt: 'desc' },
        });
        return rows.map(mapDraft);
      } catch (err) {
        console.error('[DraftService] list error:', err);
      }
    }
    return [...memoryStore.drafts].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async get(id: string): Promise<TransactionDraft | null> {
    if (isDbConnected()) {
      try {
        const row = await (prisma as any).transactionDraft.findUnique({
          where: { id },
        });
        return row ? mapDraft(row) : null;
      } catch (err) {
        console.error('[DraftService] get error:', err);
      }
    }
    return memoryStore.drafts.find(d => d.id === id) || null;
  }

  async create(data: Partial<TransactionDraft>, user?: { id?: string; name?: string }): Promise<TransactionDraft> {
    const id = data.id || randomUUID();
    const draftCode = data.draftCode || generateDraftCode();
    const customerName = data.customerName?.trim() || 'Pelanggan Umum';
    const now = new Date();

    const itemsPayload = data.itemsPayload || {
      partsUsed: [],
      serviceItems: [],
    };

    if (isDbConnected()) {
      const created = await (prisma as any).transactionDraft.create({
        data: {
          id,
          draftCode,
          receiptType: data.receiptType || 'SERVICE',
          customerName,
          customerPhone: data.customerPhone?.trim() || null,
          customerId: data.customerId || null,
          vehiclePlate: data.vehiclePlate?.trim()?.toUpperCase() || null,
          vehicleModel: data.vehicleModel?.trim() || null,
          vehicleId: data.vehicleId || null,
          kilometers: data.kilometers != null ? Number(data.kilometers) : 0,
          complaint: data.complaint?.trim() || null,
          diagnosis: data.diagnosis?.trim() || null,
          laborFee: Number(data.laborFee || 0),
          totalAmount: Number(data.totalAmount || 0),
          discountAmount: Number(data.discountAmount || 0),
          discountReason: data.discountReason?.trim() || null,
          mechanicId: data.mechanicId || null,
          mechanicName: data.mechanicName || null,
          mechanicBonusPercent: data.mechanicBonusPercent != null ? Number(data.mechanicBonusPercent) : 0,
          originQueueId: data.originQueueId || null,
          note: data.note?.trim() || null,
          itemsPayload,
          createdById: user?.id || null,
          createdByName: user?.name || null,
          createdAt: now,
          updatedAt: now,
        },
      });
      const mapped = mapDraft(created);
      memoryStore.drafts = [mapped, ...memoryStore.drafts.filter(d => d.id !== id)];
      return mapped;
    }

    const newDraft: TransactionDraft = {
      id,
      draftCode,
      receiptType: data.receiptType || 'SERVICE',
      customerName,
      customerPhone: data.customerPhone?.trim(),
      customerId: data.customerId,
      vehiclePlate: data.vehiclePlate?.trim()?.toUpperCase(),
      vehicleModel: data.vehicleModel?.trim(),
      vehicleId: data.vehicleId,
      kilometers: data.kilometers != null ? Number(data.kilometers) : 0,
      complaint: data.complaint?.trim(),
      diagnosis: data.diagnosis?.trim(),
      laborFee: Number(data.laborFee || 0),
      totalAmount: Number(data.totalAmount || 0),
      discountAmount: Number(data.discountAmount || 0),
      discountReason: data.discountReason?.trim(),
      mechanicId: data.mechanicId,
      mechanicName: data.mechanicName,
      mechanicBonusPercent: data.mechanicBonusPercent != null ? Number(data.mechanicBonusPercent) : 0,
      originQueueId: data.originQueueId,
      note: data.note?.trim(),
      itemsPayload,
      createdById: user?.id,
      createdByName: user?.name,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    memoryStore.drafts.unshift(newDraft);
    return newDraft;
  }

  async update(id: string, data: Partial<TransactionDraft>): Promise<TransactionDraft | null> {
    const now = new Date();
    if (isDbConnected()) {
      try {
        const updated = await (prisma as any).transactionDraft.update({
          where: { id },
          data: {
            receiptType: data.receiptType,
            customerName: data.customerName?.trim(),
            customerPhone: data.customerPhone !== undefined ? (data.customerPhone?.trim() || null) : undefined,
            customerId: data.customerId,
            vehiclePlate: data.vehiclePlate !== undefined ? (data.vehiclePlate?.trim()?.toUpperCase() || null) : undefined,
            vehicleModel: data.vehicleModel !== undefined ? (data.vehicleModel?.trim() || null) : undefined,
            vehicleId: data.vehicleId,
            kilometers: data.kilometers != null ? Number(data.kilometers) : undefined,
            complaint: data.complaint !== undefined ? (data.complaint?.trim() || null) : undefined,
            diagnosis: data.diagnosis !== undefined ? (data.diagnosis?.trim() || null) : undefined,
            laborFee: data.laborFee != null ? Number(data.laborFee) : undefined,
            totalAmount: data.totalAmount != null ? Number(data.totalAmount) : undefined,
            discountAmount: data.discountAmount != null ? Number(data.discountAmount) : undefined,
            discountReason: data.discountReason !== undefined ? (data.discountReason?.trim() || null) : undefined,
            mechanicId: data.mechanicId,
            mechanicName: data.mechanicName,
            mechanicBonusPercent: data.mechanicBonusPercent != null ? Number(data.mechanicBonusPercent) : undefined,
            originQueueId: data.originQueueId,
            note: data.note !== undefined ? (data.note?.trim() || null) : undefined,
            itemsPayload: data.itemsPayload,
            updatedAt: now,
          },
        });
        const mapped = mapDraft(updated);
        const idx = memoryStore.drafts.findIndex(d => d.id === id);
        if (idx >= 0) memoryStore.drafts[idx] = mapped;
        return mapped;
      } catch (err) {
        console.error('[DraftService] update error:', err);
      }
    }

    const idx = memoryStore.drafts.findIndex(d => d.id === id);
    if (idx < 0) return null;
    const current = memoryStore.drafts[idx];
    const updated: TransactionDraft = {
      ...current,
      ...data,
      updatedAt: now.toISOString(),
    };
    memoryStore.drafts[idx] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    if (isDbConnected()) {
      try {
        await (prisma as any).transactionDraft.delete({
          where: { id },
        });
      } catch (err: any) {
        if (err?.code !== 'P2025') {
          console.error('[DraftService] delete error:', err);
          throw err;
        }
      }
    }
    memoryStore.drafts = memoryStore.drafts.filter(d => d.id !== id);
    return true;
  }
}
