import { randomUUID } from 'node:crypto';
import { prisma } from '../db/connection';
import { PaginatedResult, ServiceQueue } from '../../types';

type QueueInput = Omit<ServiceQueue, 'id' | 'queueDate' | 'queueNumber' | 'queueCode' | 'status' | 'createdAt' | 'updatedAt'>;

function mapQueue(q: any): ServiceQueue {
  return {
    id: q.id, queueDate: q.queueDate.toISOString(), queueNumber: q.queueNumber, queueCode: q.queueCode,
    customerId: q.customerId || undefined, customerName: q.customerName, customerPhone: q.customerPhone || undefined,
    vehicleId: q.vehicleId || undefined, vehiclePlate: q.vehiclePlate, vehicleModel: q.vehicleModel,
    kilometers: q.kilometers ?? undefined, complaint: q.complaint, estimateNote: q.estimateNote || undefined,
    diagnosis: q.diagnosis || undefined, internalNotes: q.internalNotes || undefined, mechanicId: q.mechanicId || undefined,
    mechanicName: q.mechanicName || undefined, status: q.status, calledAt: q.calledAt?.toISOString(),
    startedAt: q.startedAt?.toISOString(), readyAt: q.readyAt?.toISOString(), convertedAt: q.convertedAt?.toISOString(),
    transactionId: q.transaction?.id, createdAt: q.createdAt.toISOString(), updatedAt: q.updatedAt?.toISOString(), version: q.version,
  };
}

export class ServiceQueueService {
  async list(params: { page?: number; limit?: number; search?: string; status?: string }): Promise<PaginatedResult<ServiceQueue>> {
    const page = Math.max(1, params.page || 1); const limit = Math.min(100, Math.max(1, params.limit || 25));
    const where: any = { AND: [] };
    if (params.status && params.status !== 'All') where.AND.push({ status: params.status });
    if (params.search?.trim()) where.AND.push({ OR: [
      { customerName: { contains: params.search.trim(), mode: 'insensitive' } },
      { vehiclePlate: { contains: params.search.trim(), mode: 'insensitive' } },
      { queueCode: { contains: params.search.trim(), mode: 'insensitive' } },
    ] });
    if (!where.AND.length) delete where.AND;
    const [total, rows] = await prisma.$transaction([
      prisma.serviceQueue.count({ where }),
      prisma.serviceQueue.findMany({ where, include: { transaction: { select: { id: true } } }, orderBy: [{ queueDate: 'desc' }, { queueNumber: 'asc' }], skip: (page - 1) * limit, take: limit }),
    ]);
    return { data: rows.map(mapQueue), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
  }

  async get(id: string): Promise<ServiceQueue | null> {
    const row = await prisma.serviceQueue.findUnique({ where: { id }, include: { transaction: { select: { id: true } } } });
    return row ? mapQueue(row) : null;
  }

  async create(data: QueueInput): Promise<ServiceQueue> {
    if (!data.customerName?.trim() || !data.vehiclePlate?.trim() || !data.vehicleModel?.trim() || !data.complaint?.trim()) throw new Error('Pelanggan, kendaraan, plat nomor, dan keluhan wajib diisi.');
    const now = new Date();
    const queueDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
    const next = await prisma.$transaction(async tx => {
      // The daily unique key and SERIALIZABLE transaction make issuing queue
      // numbers safe even when two receptionists submit at the same time.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${queueDay}))`;
      // Cast isolates a temporary stale generated-client condition while the
      // running Windows server holds Prisma's engine DLL. `prisma generate`
      // refreshes this declaration during deployment.
      const queueTable: any = tx.serviceQueue;
      const last = await queueTable.aggregate({ where: { queueDay }, _max: { queueNumber: true } });
      const queueNumber = (last._max.queueNumber || 0) + 1;
      return queueTable.create({ data: {
        id: randomUUID(), queueDate: now, queueDay, queueNumber, queueCode: `A-${String(queueNumber).padStart(3, '0')}`,
        customerId: data.customerId || null, customerName: data.customerName.trim(), customerPhone: data.customerPhone?.trim() || null,
        vehicleId: data.vehicleId || null, vehiclePlate: data.vehiclePlate.trim().toUpperCase(), vehicleModel: data.vehicleModel.trim(),
        kilometers: data.kilometers ?? null, complaint: data.complaint.trim(), estimateNote: data.estimateNote?.trim() || null,
        diagnosis: data.diagnosis?.trim() || null, internalNotes: data.internalNotes?.trim() || null,
        mechanicId: data.mechanicId || null, mechanicName: data.mechanicName?.trim() || null,
      }, include: { transaction: { select: { id: true } } } });
    }, { isolationLevel: 'Serializable' });
    return mapQueue(next);
  }

  async update(id: string, data: Partial<QueueInput>): Promise<ServiceQueue | null> {
    const current = await this.get(id); if (!current) return null;
    if (current.status === 'Converted') throw new Error('Antrean yang telah dikonversi tidak dapat diubah.');
    const row = await prisma.serviceQueue.update({ where: { id }, data: {
      customerId: data.customerId === undefined ? undefined : data.customerId || null, customerName: data.customerName?.trim(), customerPhone: data.customerPhone === undefined ? undefined : data.customerPhone?.trim() || null,
      vehicleId: data.vehicleId === undefined ? undefined : data.vehicleId || null, vehiclePlate: data.vehiclePlate?.trim().toUpperCase(), vehicleModel: data.vehicleModel?.trim(), kilometers: data.kilometers === undefined ? undefined : data.kilometers,
      complaint: data.complaint?.trim(), estimateNote: data.estimateNote === undefined ? undefined : data.estimateNote?.trim() || null, diagnosis: data.diagnosis === undefined ? undefined : data.diagnosis?.trim() || null, internalNotes: data.internalNotes === undefined ? undefined : data.internalNotes?.trim() || null,
      mechanicId: data.mechanicId === undefined ? undefined : data.mechanicId || null, mechanicName: data.mechanicName === undefined ? undefined : data.mechanicName?.trim() || null, version: { increment: 1 },
    }, include: { transaction: { select: { id: true } } } });
    return mapQueue(row);
  }

  async cancel(id: string): Promise<ServiceQueue | null> {
    const current = await this.get(id); if (!current) return null;
    if (current.status === 'Converted') throw new Error('Antrean yang telah dikonversi tidak dapat diubah.');
    if (current.status === 'Cancelled') throw new Error('Antrean sudah dibatalkan.');
    const row = await prisma.serviceQueue.update({ where: { id }, data: { status: 'Cancelled', cancelledAt: new Date(), version: { increment: 1 } }, include: { transaction: { select: { id: true } } } });
    return mapQueue(row);
  }
}
