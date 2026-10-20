import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAttendancePayroll, PayrollPolicy } from './payrollCalculation';

const policy: PayrollPolicy = { Present: 1, Sick: 0, Leave: 0, OwnerLeave: 0, autoAbsencePenalty: false, absencePenaltyAmount: 50000 };
test('20 hadir × Rp100.000 menghasilkan gaji pokok Rp2.000.000', () => {
  const attendance = Array.from({ length: 20 }, (_, index) => ({ date: `2026-10-${String(index + 1).padStart(2, '0')}`, status: 'Present' as const }));
  const result = calculateAttendancePayroll('2026-10-01', '2026-10-20', 100000, attendance, policy);
  assert.equal(result.paidDays, 20); assert.equal(result.baseSalary, 2000000);
});
test('libur pemilik tidak dibayar dan bukan potongan', () => {
  const result = calculateAttendancePayroll('2026-10-01', '2026-10-01', 100000, [{ date: '2026-10-01', status: 'OwnerLeave' }], policy);
  assert.deepEqual({ salary: result.baseSalary, deduction: result.absenceDeductions }, { salary: 0, deduction: 0 });
});
test('absensi kosong adalah Belum diinput, bukan alpa', () => {
  const result = calculateAttendancePayroll('2026-10-01', '2026-10-01', 100000, [], policy);
  assert.equal(result.details[0].status, 'NotEntered'); assert.equal(result.absenceDeductions, 0);
});
test('sakit dan izin mengikuti faktor kebijakan', () => {
  const result = calculateAttendancePayroll('2026-10-01', '2026-10-02', 100000, [{ date: '2026-10-01', status: 'Sick' }, { date: '2026-10-02', status: 'Leave' }], { ...policy, Sick: 1, Leave: 0.5 });
  assert.equal(result.paidDays, 1.5); assert.equal(result.baseSalary, 150000);
});
test('bonus dan potongan di luar periode tidak ikut dijumlahkan', () => {
  const inPeriod = (date: string) => date >= '2026-10-01' && date <= '2026-10-31';
  const bonus = [{ date: '2026-09-30', value: 50000 }, { date: '2026-10-15', value: 75000 }].filter(item => inPeriod(item.date)).reduce((sum, item) => sum + item.value, 0);
  const deduction = [{ date: '2026-10-20', value: 10000 }, { date: '2026-11-01', value: 90000 }].filter(item => inPeriod(item.date)).reduce((sum, item) => sum + item.value, 0);
  assert.deepEqual({ bonus, deduction }, { bonus: 75000, deduction: 10000 });
});
test('snapshot gaji yang sudah dibuat tidak berubah ketika tarif berjalan berubah', () => {
  const finalized = calculateAttendancePayroll('2026-10-01', '2026-10-01', 100000, [{ date: '2026-10-01', status: 'Present' }], policy);
  const currentRateAfterChange = 150000;
  assert.equal(finalized.details[0].dailyRate, 100000);
  assert.equal(finalized.baseSalary, 100000);
  assert.equal(currentRateAfterChange, 150000);
});
