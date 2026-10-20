import { PayrollRepository } from '../repositories/payrollRepository';
export class PayrollService {
  constructor(private readonly repository: PayrollRepository) {}
  getReport(from: string, to: string, mechanicId?: string) { return this.repository.report(from, to, mechanicId); }
  finalize(from: string, to: string, user: { id: string; name: string }, mechanicId?: string) { return this.repository.finalize(from, to, user, mechanicId); }
  reopen(id: string, reason: string, user: { id: string; name: string }) { return this.repository.reopen(id, reason, user); }
}
