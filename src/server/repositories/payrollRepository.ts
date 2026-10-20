import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../db/connection';
import { PayrollReport, MechanicPayrollRow, PayrollAttendanceDetail } from '../../types';
import { calculateAttendancePayroll, datesInPayrollPeriod, PayrollPolicy } from '../services/payrollCalculation';

type Db = PrismaClient | Prisma.TransactionClient;
const zero = new Prisma.Decimal(0);

export class PayrollRepository {
  async report(from: string, to: string, mechanicId?: string, db: Db = prisma): Promise<PayrollReport> {
    const rangeStart = new Date(`${from}T00:00:00.000Z`);
    const rangeEnd = new Date(`${to}T23:59:59.999Z`);
    const [settings, mechanics, services, deductions, finalized] = await Promise.all([
      db.companySettings.findUnique({ where: { id: 'settings-default' } }),
      db.mechanic.findMany({
        where: mechanicId ? { id: mechanicId } : undefined,
        orderBy: { name: 'asc' },
        include: { attendances: { where: { date: { gte: from, lte: to } }, orderBy: { date: 'asc' } } },
      }),
      db.workshopService.findMany({ where: { status: 'Done', mechanicId: mechanicId || undefined, completedAt: { gte: rangeStart, lte: rangeEnd } }, select: { mechanicId: true, mechanicBonusAmount: true, laborFee: true, mechanicBonusPercent: true } }),
      db.mechanicDeduction.findMany({ where: { mechanicId: mechanicId || undefined, date: { gte: rangeStart, lte: rangeEnd } }, select: { mechanicId: true, amount: true } }),
      db.payrollPeriod.findMany({ where: { fromDate: from, toDate: to, status: 'Finalized', mechanicId: mechanicId || undefined }, include: { details: { orderBy: { date: 'asc' } } } }),
    ]);
    const policy: PayrollPolicy = {
      Present: Number(settings?.payrollPresentFactor ?? 1), Sick: Number(settings?.payrollSickFactor ?? 0),
      Leave: Number(settings?.payrollLeaveFactor ?? 0), OwnerLeave: Number(settings?.payrollOwnerLeaveFactor ?? 0),
      autoAbsencePenalty: settings?.payrollAutoAbsencePenalty ?? false, absencePenaltyAmount: Number(settings?.payrollAbsencePenaltyAmount ?? 0),
    };
    const bonusByMechanic = new Map<string, Prisma.Decimal>();
    services.forEach(service => {
      if (!service.mechanicId) return;
      const bonus = service.mechanicBonusAmount ?? service.laborFee.mul(service.mechanicBonusPercent ?? 0).div(100);
      bonusByMechanic.set(service.mechanicId, (bonusByMechanic.get(service.mechanicId) ?? zero).add(bonus));
    });
    const deductionsByMechanic = new Map<string, Prisma.Decimal>();
    deductions.forEach(item => deductionsByMechanic.set(item.mechanicId, (deductionsByMechanic.get(item.mechanicId) ?? zero).add(item.amount)));
    const finalizedByMechanic = new Map(finalized.map(item => [item.mechanicId, item]));
    const rows: MechanicPayrollRow[] = mechanics.map(mechanic => {
      const final = finalizedByMechanic.get(mechanic.id);
      if (final) return {
        mechanicId: mechanic.id, mechanicName: mechanic.name, dailyRate: Number(final.dailyRateSnapshot),
        attendance: final.details.reduce((acc, detail) => ({ ...acc, [detail.status]: (acc[detail.status as keyof typeof acc] || 0) + 1 }), { Present: 0, Sick: 0, Leave: 0, Absent: 0, OwnerLeave: 0, NotEntered: 0 }),
        paidDays: Number(final.paidDays), baseSalary: Number(final.baseSalary), serviceBonus: Number(final.serviceBonus),
        manualDeductions: Number(final.manualDeductions), absenceDeductions: Number(final.absenceDeductions), totalDeductions: Number(final.totalDeductions), netSalary: Number(final.netSalary),
        details: final.details.map(detail => ({ date: detail.date, status: detail.status as any, paidDayFactor: Number(detail.paidDayFactor), dailyRate: Number(detail.dailyRate), dailySalary: Number(detail.dailySalary), notes: detail.notes || undefined })),
        finalPayrollId: final.id, isFinalized: true,
      };
      const calculated = calculateAttendancePayroll(from, to, Number(mechanic.dailySalary), mechanic.attendances.map(item => ({ date: item.date, status: item.status as any, notes: item.notes || undefined })), policy);
      // Keep all persisted currency arithmetic in Decimal. The helper only
      // decides status/factor and shapes the API detail rows.
      const rate = new Prisma.Decimal(mechanic.dailySalary);
      const details = calculated.details.map(detail => ({ ...detail, dailyRate: Number(rate), dailySalary: Number(rate.mul(detail.paidDayFactor)) }));
      const paidDays = calculated.paidDays;
      const baseSalary = details.reduce((sum, detail) => sum.add(new Prisma.Decimal(detail.dailySalary)), zero);
      const absenceDeductions = policy.autoAbsencePenalty ? new Prisma.Decimal(policy.absencePenaltyAmount).mul(details.filter(detail => detail.status === 'Absent').length) : zero;
      const manualDeductions = deductionsByMechanic.get(mechanic.id) ?? zero;
      const serviceBonus = bonusByMechanic.get(mechanic.id) ?? zero;
      const totalDeductions = manualDeductions.add(absenceDeductions);
      return {
        mechanicId: mechanic.id, mechanicName: mechanic.name, dailyRate: Number(mechanic.dailySalary),
        attendance: details.reduce((acc, item) => ({ ...acc, [item.status]: (acc[item.status] || 0) + 1 }), { Present: 0, Sick: 0, Leave: 0, Absent: 0, OwnerLeave: 0, NotEntered: 0 }),
        paidDays, baseSalary: Number(baseSalary), serviceBonus: Number(serviceBonus), manualDeductions: Number(manualDeductions), absenceDeductions: Number(absenceDeductions), totalDeductions: Number(totalDeductions), netSalary: Number(baseSalary.add(serviceBonus).sub(totalDeductions)), details, isFinalized: false,
      };
    });
    return { from, to, policy, rows, totals: rows.reduce((totals, row) => ({ baseSalary: totals.baseSalary + row.baseSalary, serviceBonus: totals.serviceBonus + row.serviceBonus, totalDeductions: totals.totalDeductions + row.totalDeductions, netSalary: totals.netSalary + row.netSalary, notEntered: totals.notEntered + row.attendance.NotEntered }), { baseSalary: 0, serviceBonus: 0, totalDeductions: 0, netSalary: 0, notEntered: 0 }) };
  }

  async finalize(from: string, to: string, user: { id: string; name: string }, mechanicId?: string) {
    return prisma.$transaction(async tx => {
      const report = await this.report(from, to, mechanicId, tx);
      for (const row of report.rows) {
        if (row.isFinalized) throw new Error(`Payroll ${row.mechanicName} untuk periode ini sudah difinalkan.`);
        const existing = await tx.payrollPeriod.findUnique({ where: { mechanicId_fromDate_toDate: { mechanicId: row.mechanicId, fromDate: from, toDate: to } } });
        const payload = { mechanicName: row.mechanicName, status: 'Finalized', dailyRateSnapshot: row.dailyRate, paidDays: row.paidDays, baseSalary: row.baseSalary, serviceBonus: row.serviceBonus, manualDeductions: row.manualDeductions, absenceDeductions: row.absenceDeductions, totalDeductions: row.totalDeductions, netSalary: row.netSalary, policySnapshot: report.policy, finalizedAt: new Date(), finalizedById: user.id, finalizedByName: user.name, reopenedAt: null, reopenedById: null, reopenedByName: null, reopenReason: null };
        const payroll = existing ? await tx.payrollPeriod.update({ where: { id: existing.id }, data: payload }) : await tx.payrollPeriod.create({ data: { ...payload, mechanicId: row.mechanicId, fromDate: from, toDate: to } });
        await tx.payrollAttendanceDetail.deleteMany({ where: { payrollId: payroll.id } });
        await tx.payrollAttendanceDetail.createMany({ data: row.details.map(detail => ({ payrollId: payroll.id, ...detail })) });
      }
      return this.report(from, to, mechanicId, tx);
    });
  }

  async reopen(id: string, reason: string, user: { id: string; name: string }) {
    return prisma.payrollPeriod.update({ where: { id }, data: { status: 'Reopened', reopenedAt: new Date(), reopenedById: user.id, reopenedByName: user.name, reopenReason: reason } });
  }
}
