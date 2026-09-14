import { DistributorInvoice, DistributorInvoiceItem, DistributorPayment } from '../../types';
import { prisma, isDbConnected } from '../db/connection';
import { memoryStore } from '../db/memoryStore';

export class DistributorInvoiceRepository {
  async getAll(): Promise<DistributorInvoice[]> {
    if (isDbConnected()) {
      try {
        const list = await prisma.distributorInvoice.findMany({
          include: {
            items: true,
            payments: true,
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
      }
    }
    return (memoryStore as any).distributorInvoices || [];
  }

  async getById(id: string): Promise<DistributorInvoice | null> {
    if (isDbConnected()) {
      try {
        const inv = await prisma.distributorInvoice.findUnique({
          where: { id },
          include: { items: true, payments: true }
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
      }
    }
    const memList = (memoryStore as any).distributorInvoices || [];
    return memList.find((inv: any) => inv.id === id) || null;
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

    if (isDbConnected()) {
      try {
        const created = await prisma.distributorInvoice.create({
          data: {
            id,
            invoiceNumber: data.invoiceNumber || `INV-SUP-${Date.now().toString().slice(-4)}`,
            supplierId: data.supplierId || null,
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

        if (!(memoryStore as any).distributorInvoices) (memoryStore as any).distributorInvoices = [];
        (memoryStore as any).distributorInvoices.unshift(formatted);
        return formatted;
      } catch (err) {
        console.error('[DistributorInvoiceRepo] Prisma create error:', err);
      }
    }

    const formatted: DistributorInvoice = {
      id,
      invoiceNumber: data.invoiceNumber || `INV-SUP-${Date.now().toString().slice(-4)}`,
      supplierId: data.supplierId,
      supplierName: data.supplierName,
      branchName: data.branchName || 'Bengkel Pusat',
      branchType: data.branchType || 'Pusat',
      totalAmount,
      paidAmount,
      remainingAmount,
      issueDate: data.issueDate || new Date().toISOString(),
      dueDate: data.dueDate,
      status,
      paymentMethod: data.paymentMethod || 'Transfer',
      notes: data.notes,
      items: items.map(i => ({ ...i, id: i.id || `ITEM-${Math.random().toString(36).substring(2, 7)}` })),
      payments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!(memoryStore as any).distributorInvoices) (memoryStore as any).distributorInvoices = [];
    (memoryStore as any).distributorInvoices.unshift(formatted);
    return formatted;
  }

  async addPayment(invoiceId: string, paymentData: { amount: number; paymentMethod: string; referenceNo?: string; notes?: string; paymentDate?: string }): Promise<DistributorInvoice | null> {
    const paymentId = `PAY-${Date.now().toString().slice(-6)}`;
    const payDate = paymentData.paymentDate ? new Date(paymentData.paymentDate) : new Date();

    if (isDbConnected()) {
      try {
        await prisma.$transaction(async tx => {
          const inv = await tx.distributorInvoice.findUnique({ where: { id: invoiceId } });
          if (!inv) throw new Error('NOT_FOUND');
          const newPaid = Number(inv.paidAmount) + paymentData.amount;
          if (paymentData.amount <= 0 || newPaid > Number(inv.totalAmount)) throw new Error('INVALID_PAYMENT');
          const newRemaining = Number(inv.totalAmount) - newPaid;
          const newStatus = newRemaining === 0 ? 'Paid' : 'Partial';
          await tx.distributorPayment.create({ data: {
            id: paymentId,
            invoiceId,
            amount: paymentData.amount,
            paymentDate: payDate,
            paymentMethod: paymentData.paymentMethod || 'Transfer',
            referenceNo: paymentData.referenceNo || null,
            notes: paymentData.notes || null,
          }});
          await tx.distributorInvoice.update({
          where: { id: invoiceId },
          data: {
            paidAmount: newPaid,
            remainingAmount: newRemaining,
            status: newStatus,
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

    const memList = (memoryStore as any).distributorInvoices || [];
    const idx = memList.findIndex((i: any) => i.id === invoiceId);
    if (idx === -1) return null;

    const target = memList[idx];
    const newPaid = target.paidAmount + paymentData.amount;
    const newRemaining = Math.max(0, target.totalAmount - newPaid);
    const newStatus = newRemaining === 0 ? 'Paid' : 'Partial';

    const paymentObj: DistributorPayment = {
      id: paymentId,
      invoiceId,
      amount: paymentData.amount,
      paymentDate: payDate.toISOString(),
      paymentMethod: paymentData.paymentMethod || 'Transfer',
      referenceNo: paymentData.referenceNo,
      notes: paymentData.notes,
      createdAt: new Date().toISOString()
    };

    target.paidAmount = newPaid;
    target.remainingAmount = newRemaining;
    target.status = newStatus;
    target.payments = target.payments || [];
    target.payments.push(paymentObj);

    return target;
  }

  async delete(id: string): Promise<boolean> {
    if (isDbConnected()) {
      try {
        await prisma.distributorInvoice.delete({ where: { id } });
      } catch (err) {
        console.error('[DistributorInvoiceRepo] Prisma delete error:', err);
      }
    }
    if ((memoryStore as any).distributorInvoices) {
      (memoryStore as any).distributorInvoices = (memoryStore as any).distributorInvoices.filter((i: any) => i.id !== id);
    }
    return true;
  }
}

export const distributorInvoiceRepository = new DistributorInvoiceRepository();
