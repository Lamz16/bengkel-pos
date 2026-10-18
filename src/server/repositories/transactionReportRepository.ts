import { Prisma } from '@prisma/client';
import { prisma } from '../db/connection';

export type CompletedTransactionReportParams = {
  page: number; limit: number; search?: string; from?: Date; to?: Date;
  receiptType?: 'SERVICE' | 'SALE'; paymentStatus?: string; mechanicId?: string; paymentMethod?: string; createdByUserId?: string;
  sort?: 'completedAt' | 'revenue' | 'cost' | 'profit'; direction?: 'asc' | 'desc';
};

const number = (value: unknown) => Number(value || 0);

export class TransactionReportRepository {
  async getCompletedTransactions(params: CompletedTransactionReportParams) {
    const filters: any[] = [{ status: 'Done' }];
    if (params.from || params.to) filters.push({ OR: [
      { completedAt: { ...(params.from ? { gte: params.from } : {}), ...(params.to ? { lte: params.to } : {}) } },
      { completedAt: null, createdAt: { ...(params.from ? { gte: params.from } : {}), ...(params.to ? { lte: params.to } : {}) } },
    ] });
    if (params.receiptType) filters.push({ receiptType: params.receiptType });
    if (params.paymentStatus) filters.push({ paymentStatus: params.paymentStatus });
    if (params.mechanicId) filters.push({ mechanicId: params.mechanicId });
    if (params.createdByUserId) filters.push({ createdByUserId: params.createdByUserId });
    if (params.paymentMethod) filters.push({ payments: { some: { paymentMethod: params.paymentMethod } } });
    if (params.search) filters.push({ OR: [
      { id: { contains: params.search, mode: 'insensitive' } },
      { invoiceNumber: { contains: params.search, mode: 'insensitive' } },
      { customerName: { contains: params.search, mode: 'insensitive' } },
      { vehiclePlate: { contains: params.search, mode: 'insensitive' } },
      { serviceItems: { some: { name: { contains: params.search, mode: 'insensitive' } } } },
      { partsUsed: { some: { name: { contains: params.search, mode: 'insensitive' } } } },
    ] });
    const where = { AND: filters };
    const orderBy = params.sort === 'completedAt' || !params.sort
      ? [{ completedAt: params.direction || 'desc' }, { createdAt: params.direction || 'desc' }]
      : { createdAt: 'desc' as const };
    const aggregateFilters: Prisma.Sql[] = [Prisma.sql`s.status = 'Done'`];
    if (params.from || params.to) aggregateFilters.push(Prisma.sql`COALESCE(s."completedAt", s."createdAt") >= ${params.from || new Date(0)} AND COALESCE(s."completedAt", s."createdAt") <= ${params.to || new Date('9999-12-31')}`);
    if (params.receiptType) aggregateFilters.push(Prisma.sql`s."receiptType" = ${params.receiptType}`);
    if (params.paymentStatus) aggregateFilters.push(Prisma.sql`s."paymentStatus" = ${params.paymentStatus}`);
    if (params.mechanicId) aggregateFilters.push(Prisma.sql`s."mechanicId" = ${params.mechanicId}`);
    if (params.createdByUserId) aggregateFilters.push(Prisma.sql`s."createdByUserId" = ${params.createdByUserId}`);
    if (params.paymentMethod) aggregateFilters.push(Prisma.sql`EXISTS (SELECT 1 FROM "ServicePayment" pay WHERE pay."serviceId" = s.id AND pay."paymentMethod" = ${params.paymentMethod})`);
    if (params.search) { const like = `%${params.search}%`; aggregateFilters.push(Prisma.sql`(s.id ILIKE ${like} OR s."invoiceNumber" ILIKE ${like} OR s."customerName" ILIKE ${like} OR s."vehiclePlate" ILIKE ${like} OR EXISTS (SELECT 1 FROM "ServiceLaborItem" li WHERE li."serviceId" = s.id AND li.name ILIKE ${like}) OR EXISTS (SELECT 1 FROM "ServicePartItem" pi WHERE pi."serviceId" = s.id AND pi.name ILIKE ${like}))`); }
    const aggregateWhere = Prisma.join(aggregateFilters, ' AND ');
    const [total, rows, aggregate] = await Promise.all([
      prisma.workshopService.count({ where }),
      prisma.workshopService.findMany({ where, orderBy, skip: (params.page - 1) * params.limit, take: params.limit, include: { serviceItems: true, partsUsed: { include: { part: { select: { purchasePrice: true } } } }, payments: { orderBy: { paymentDate: 'desc' } } } }),
      prisma.$queryRaw<Array<{ transactions: bigint; revenue: unknown; labor: unknown; bonus: unknown; parts: unknown; cost: unknown }>>(Prisma.sql`WITH filtered AS (SELECT s.* FROM "WorkshopService" s WHERE ${aggregateWhere}), part_totals AS (SELECT pi."serviceId", COALESCE(SUM((pi.quantity - pi."returnedQuantity") * pi."priceAtTime"), 0) AS parts, COALESCE(SUM((pi.quantity - pi."returnedQuantity") * COALESCE(pi."purchasePriceAtTime", p."purchasePrice")), 0) AS cost FROM "ServicePartItem" pi JOIN filtered s ON s.id = pi."serviceId" JOIN "SparePart" p ON p.id = pi."partId" GROUP BY pi."serviceId") SELECT COUNT(*) AS transactions, COALESCE(SUM(s."totalAmount"), 0) AS revenue, COALESCE(SUM(s."laborFee"), 0) AS labor, COALESCE(SUM(s."mechanicBonusAmount"), 0) AS bonus, COALESCE(SUM(pt.parts), 0) AS parts, COALESCE(SUM(pt.cost), 0) AS cost FROM filtered s LEFT JOIN part_totals pt ON pt."serviceId" = s.id`),
    ]);
    const map = (row: any) => {
      const parts = row.partsUsed.map((part: any) => {
        const quantity = Math.max(0, part.quantity - part.returnedQuantity);
        const unitCost = part.purchasePriceAtTime == null ? number(part.part?.purchasePrice) : number(part.purchasePriceAtTime);
        return { name: part.name, quantity, unitPrice: number(part.priceAtTime), subtotal: quantity * number(part.priceAtTime), unitCost, cost: quantity * unitCost };
      });
      const totalParts = parts.reduce((sum: number, part: any) => sum + part.subtotal, 0);
      const cost = parts.reduce((sum: number, part: any) => sum + part.cost, 0);
      const labor = number(row.laborFee), bonus = number(row.mechanicBonusAmount), revenue = number(row.totalAmount);
      return { id: row.id, completedAt: (row.completedAt || row.createdAt).toISOString(), invoiceNumber: row.invoiceNumber, receiptType: row.receiptType, customerName: row.customerName, vehiclePlate: row.vehiclePlate, vehicleModel: row.vehicleModel, mechanicId: row.mechanicId, mechanicName: row.mechanicName, createdByUserId: row.createdByUserId, createdByNameSnapshot: row.createdByNameSnapshot || 'Data lama / Tidak diketahui', createdByRoleSnapshot: row.createdByRoleSnapshot || null, serviceItems: row.serviceItems.map((item: any) => ({ name: item.name, price: number(item.price) })), parts, totalLabor: labor, totalParts, discount: number(row.discountAmount), revenue, cost, mechanicBonus: bonus, grossProfit: (labor - bonus) + (totalParts - cost) - number(row.discountAmount), paymentStatus: row.paymentStatus, paymentMethods: [...new Set(row.payments.map((payment: any) => payment.paymentMethod))] };
    };
    const data = rows.map(map);
    if (params.sort && params.sort !== 'completedAt') {
      const field = params.sort === 'revenue' ? 'revenue' : params.sort === 'cost' ? 'cost' : 'grossProfit';
      data.sort((a: any, b: any) => (params.direction === 'asc' ? 1 : -1) * (a[field] - b[field]));
    }
    const raw = aggregate[0];
    const totals = { transactions: Number(raw?.transactions || 0), revenue: number(raw?.revenue), labor: number(raw?.labor), parts: number(raw?.parts), cost: number(raw?.cost), bonus: number(raw?.bonus), profit: 0 };
    totals.profit = (totals.labor - totals.bonus) + (totals.parts - totals.cost) - (totals.labor + totals.parts - totals.revenue);
    return { data, pagination: { page: params.page, limit: params.limit, total, totalPages: Math.ceil(total / params.limit) || 1 }, totals };
  }
}
