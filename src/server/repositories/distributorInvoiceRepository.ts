import { DistributorInvoice } from '../../types';
import { prisma, isDbConnected } from '../db/connection';

export class DistributorInvoiceRepository {
  async getAll(params?: { search?: string; status?: string; branchName?: string; supplierId?: string }): Promise<DistributorInvoice[]> {
    if (!isDbConnected()) throw new Error('DATABASE_UNAVAILABLE: Nota tempo wajib disimpan di PostgreSQL. Periksa DATABASE_URL dan koneksi database.');
    {
      try {
        const where: any = {};
        if (params?.status && params.status !== 'all') {
          where.status = params.status;
        }
        if (params?.branchName && params.branchName !== 'all') {
          where.branchName = params.branchName;
        }
        if (params?.supplierId) {
          where.supplierId = params.supplierId;
        }
        if (params?.search) {
          const q = params.search.trim();
          where.OR = [
            { invoiceNumber: { contains: q, mode: 'insensitive' } },
            { supplierName: { contains: q, mode: 'insensitive' } },
            { notes: { contains: q, mode: 'insensitive' } },
          ];
        }

        const list = await prisma.distributorInvoice.findMany({
          where,
          include: {
            items: true,
            payments: { orderBy: { paymentDate: 'desc' } },
          },
          orderBy: { dueDate: 'asc' }
        });
        return list.map(inv => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          supplierId: inv.supplierId || undefined,
          supplierName: inv.supplierName,
          branchName: inv.branchName,
          branchType: inv.branchType as any,
          totalAmount: Number(inv.totalAmount),
          paidAmount: Number(inv.paidAmount),
          remainingAmount: Number(inv.remainingAmount),
          issueDate: inv.issueDate.toISOString(),
          dueDate: inv.dueDate.toISOString(),
          status: inv.status as any,
          paymentMethod: inv.paymentMethod || undefined,
          notes: inv.notes || undefined,
          version: (inv as any).version || 1,
          items: inv.items.map(i => ({
            id: i.id,
            invoiceId: i.invoiceId,
            partId: i.partId || undefined,
            partName: i.partName,
            quantity: i.quantity,
            unitPrice: Number(i.unitPrice),
            totalPrice: Number(i.totalPrice),
          })),
          payments: inv.payments.map(p => ({
            id: p.id,
            invoiceId: p.invoiceId,
            amount: Number(p.amount),
            paymentDate: p.paymentDate.toISOString(),
            paymentMethod: p.paymentMethod,
            referenceNo: p.referenceNo || undefined,
            notes: p.notes || undefined,
            createdAt: p.createdAt.toISOString(),
          })),
          createdAt: inv.createdAt.toISOString(),
          updatedAt: inv.updatedAt.toISOString(),
        }));
      } catch (err) {
        console.error('[DistributorInvoiceRepo] Prisma getAll error:', err);
        throw err;
      }
    }
  }

  async getById(id: string): Promise<DistributorInvoice | null> {
    if (!isDbConnected()) throw new Error('DATABASE_UNAVAILABLE: Nota tempo wajib disimpan di PostgreSQL.');
    {
      try {
        const inv = await prisma.distributorInvoice.findUnique({
          where: { id },
          include: { items: true, payments: { orderBy: { paymentDate: 'desc' } } }
        });
        if (inv) {
          return {
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            supplierId: inv.supplierId || undefined,
            supplierName: inv.supplierName,
            branchName: inv.branchName,
            branchType: inv.branchType as any,
            totalAmount: Number(inv.totalAmount),
            paidAmount: Number(inv.paidAmount),
            remainingAmount: Number(inv.remainingAmount),
            issueDate: inv.issueDate.toISOString(),
            dueDate: inv.dueDate.toISOString(),
            status: inv.status as any,
            paymentMethod: inv.paymentMethod || undefined,
            notes: inv.notes || undefined,
            version: (inv as any).version || 1,
            items: inv.items.map(i => ({
              id: i.id,
              invoiceId: i.invoiceId,
              partId: i.partId || undefined,
              partName: i.partName,
              quantity: i.quantity,
              unitPrice: Number(i.unitPrice),
              totalPrice: Number(i.totalPrice),
            })),
            payments: inv.payments.map(p => ({
              id: p.id,
              invoiceId: p.invoiceId,
              amount: Number(p.amount),
              paymentDate: p.paymentDate.toISOString(),
              paymentMethod: p.paymentMethod,
              referenceNo: p.referenceNo || undefined,
              notes: p.notes || undefined,
              createdAt: p.createdAt.toISOString(),
            })),
            createdAt: inv.createdAt.toISOString(),
            updatedAt: inv.updatedAt.toISOString(),
          };
        }
      } catch (err) {
        console.error('[DistributorInvoiceRepo] Prisma getById error:', err);
        throw err;
      }
    }
    return null;
  }

  async create(data: Omit<DistributorInvoice, 'id'>): Promise<DistributorInvoice> {
    const id = `INV-DIST-${Date.now().toString().slice(-6)}`;
    const items = data.items || [];
    const totalAmount = data.totalAmount || items.reduce((acc, i) => acc + i.totalPrice, 0);
    const paidAmount = data.paidAmount || 0;
    const remainingAmount = Math.max(0, totalAmount - paidAmount);
    
    // Auto status
    let status = data.status || 'Unpaid';
    if (paidAmount >= totalAmount && totalAmount > 0) {
      status = 'Paid';
    } else if (paidAmount > 0) {
      status = 'Partial';
    } else {
      const due = new Date(data.dueDate);
      if (due < new Date()) {
        status = 'Overdue';
      }
    }

    if (!isDbConnected()) throw new Error('DATABASE_UNAVAILABLE: Nota tempo tidak dapat dibuat tanpa PostgreSQL.');
    {
      try {
        const created = await prisma.$transaction(async tx => {
          // Check if supplier exists or match supplierName
          let finalSupplierId = data.supplierId || null;
          if (!finalSupplierId && data.supplierName) {
            const matchedSupplier = await tx.supplier.findFirst({
              where: { name: { equals: data.supplierName, mode: 'insensitive' } }
            });
            if (matchedSupplier) {
              finalSupplierId = matchedSupplier.id;
            }
          }

          const inv = await tx.distributorInvoice.create({
            data: {
              id,
              invoiceNumber: data.invoiceNumber || `INV-SUP-${Date.now().toString().slice(-4)}`,
              supplierId: finalSupplierId,
              supplierName: data.supplierName,
              branchName: data.branchName || 'Bengkel Pusat',
              branchType: data.branchType || 'Pusat',
              totalAmount,
              paidAmount,
              remainingAmount,
              issueDate: new Date(data.issueDate || Date.now()),
              dueDate: new Date(data.dueDate),
              status,
              paymentMethod: data.paymentMethod || 'Transfer',
              notes: data.notes || null,
              version: 1,
              items: {
                create: items.map(item => ({
                  id: item.id || `ITEM-${Math.random().toString(36).substring(2, 7)}`,
                  partId: item.partId || null,
                  partName: item.partName,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  totalPrice: item.totalPrice,
                }))
              }
            },
            include: { items: true, payments: true }
          });

          // If items contain spare parts, auto update stock and record purchase
          for (const item of items) {
            if (item.partId) {
              const existingPart = await tx.sparePart.findUnique({ where: { id: item.partId } });
              if (existingPart) {
                await tx.sparePart.update({
                  where: { id: item.partId },
                  data: { stock: { increment: item.quantity } }
                });
                await tx.stockHistory.create({
                  data: {
                    partId: item.partId,
                    partName: item.partName,
                    amount: item.quantity,
                    type: 'In',
                    reason: `Penerimaan Stok Tempo #${inv.invoiceNumber} (${data.supplierName})`,
                    date: new Date()
                  }
                });
                if (finalSupplierId) {
                  await tx.purchaseRecord.create({
                    data: {
                      partId: item.partId,
                      supplierId: finalSupplierId,
                      quantity: item.quantity,
                      costPrice: item.unitPrice,
                      date: new Date()
                    }
                  });
                }
              }
            }
          }

          return inv;
        });

        const formatted: DistributorInvoice = {
          id: created.id,
          invoiceNumber: created.invoiceNumber,
          supplierId: created.supplierId || undefined,
          supplierName: created.supplierName,
          branchName: created.branchName,
          branchType: created.branchType as any,
          totalAmount: Number(created.totalAmount),
          paidAmount: Number(created.paidAmount),
          remainingAmount: Number(created.remainingAmount),
          issueDate: created.issueDate.toISOString(),
          dueDate: created.dueDate.toISOString(),
          status: created.status as any,
          paymentMethod: created.paymentMethod || undefined,
          notes: created.notes || undefined,
          version: (created as any).version || 1,
          items: created.items.map(i => ({
            id: i.id,
            invoiceId: i.invoiceId,
            partId: i.partId || undefined,
            partName: i.partName,
            quantity: i.quantity,
            unitPrice: Number(i.unitPrice),
            totalPrice: Number(i.totalPrice),
          })),
          payments: [],
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        };

        return formatted;
      } catch (err) {
        console.error('[DistributorInvoiceRepo] Prisma create error:', err);
        throw err;
      }
    }
  }

  async addPayment(
    invoiceId: string, 
    paymentData: { amount: number; paymentMethod: string; referenceNo?: string; notes?: string; paymentDate?: string },
    expectedVersion?: number
  ): Promise<DistributorInvoice | null> {
    const paymentId = `PAY-${Date.now().toString().slice(-6)}`;
    const payDate = paymentData.paymentDate ? new Date(paymentData.paymentDate) : new Date();

    if (!isDbConnected()) throw new Error('DATABASE_UNAVAILABLE: Pembayaran nota tempo wajib disimpan di PostgreSQL.');
    {
      try {
        await prisma.$transaction(async tx => {
          const inv = await tx.distributorInvoice.findUnique({ where: { id: invoiceId } });
          if (!inv) throw new Error('NOT_FOUND');

          if (expectedVersion !== undefined && (inv as any).version !== undefined && (inv as any).version !== expectedVersion) {
            throw new Error('Optimistic Lock Failure: Nota tempo telah diperbarui oleh pengguna lain.');
          }

          const newPaid = Number(inv.paidAmount) + paymentData.amount;
          if (paymentData.amount <= 0 || newPaid > Number(inv.totalAmount) + 0.01) {
            throw new Error('INVALID_PAYMENT');
          }

          const newRemaining = Math.max(0, Number(inv.totalAmount) - newPaid);
          const newStatus = newRemaining === 0 ? 'Paid' : 'Partial';

          await tx.distributorPayment.create({ 
            data: {
              id: paymentId,
              invoiceId,
              amount: paymentData.amount,
              paymentDate: payDate,
              paymentMethod: paymentData.paymentMethod || 'Transfer',
              referenceNo: paymentData.referenceNo || null,
              notes: paymentData.notes || null,
            }
          });

          // Sync with Expense Ledger
          await tx.expense.create({
            data: {
              id: `EXP-TEMPO-${Date.now().toString().slice(-6)}`,
              category: 'Pembayaran Tempo Distributor',
              amount: paymentData.amount,
              note: `Pelunasan/Cicilan Nota #${inv.invoiceNumber} (${inv.supplierName}) - Method: ${paymentData.paymentMethod}`,
              date: payDate,
            }
          });

          await tx.distributorInvoice.update({
            where: { id: invoiceId },
            data: {
              paidAmount: newPaid,
              remainingAmount: newRemaining,
              status: newStatus,
              version: { increment: 1 }
            }
          });
        }, { isolationLevel: 'Serializable' });

        return this.getById(invoiceId);
      } catch (err) {
        if ((err as Error).message === 'NOT_FOUND') return null;
        console.error('[DistributorInvoiceRepo] Prisma addPayment error:', err);
        throw err;
      }
    }

  }

  async delete(id: string): Promise<boolean> {
    if (!isDbConnected()) throw new Error('DATABASE_UNAVAILABLE: Nota tempo wajib disimpan di PostgreSQL.');
    {
      try {
        await prisma.distributorInvoice.delete({ where: { id } });
      } catch (err) {
        console.error('[DistributorInvoiceRepo] Prisma delete error:', err);
        throw err;
      }
    }
    return true;
  }
}

export const distributorInvoiceRepository = new DistributorInvoiceRepository();
