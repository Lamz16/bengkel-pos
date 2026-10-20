import { PayrollAttendanceDetail, PayrollAttendanceStatus } from '../../types';

export type PayrollPolicy = { Present: number; Sick: number; Leave: number; OwnerLeave: number; autoAbsencePenalty: boolean; absencePenaltyAmount: number };
export type AttendanceInput = { date: string; status: Exclude<PayrollAttendanceStatus, 'NotEntered'>; notes?: string };

export function datesInPayrollPeriod(from: string, to: string): string[] {
  const dates: string[] = [];
  for (let cursor = new Date(`${from}T00:00:00.000Z`), end = new Date(`${to}T00:00:00.000Z`); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) dates.push(cursor.toISOString().slice(0, 10));
  return dates;
}

export function calculateAttendancePayroll(from: string, to: string, dailyRate: number, attendance: AttendanceInput[], policy: PayrollPolicy) {
  const byDate = new Map(attendance.map(item => [item.date, item]));
  const details: PayrollAttendanceDetail[] = datesInPayrollPeriod(from, to).map(date => {
    const saved = byDate.get(date); const status = saved?.status ?? 'NotEntered';
    const paidDayFactor = status === 'Present' || status === 'Sick' || status === 'Leave' || status === 'OwnerLeave' ? policy[status] : 0;
    return { date, status, paidDayFactor, dailyRate, dailySalary: dailyRate * paidDayFactor, notes: saved?.notes };
  });
  const paidDays = details.reduce((total, detail) => total + detail.paidDayFactor, 0);
  const baseSalary = details.reduce((total, detail) => total + detail.dailySalary, 0);
  const absenceDeductions = policy.autoAbsencePenalty ? details.filter(detail => detail.status === 'Absent').length * policy.absencePenaltyAmount : 0;
  return { details, paidDays, baseSalary, absenceDeductions };
}
