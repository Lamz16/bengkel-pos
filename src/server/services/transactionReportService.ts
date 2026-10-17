import { TransactionReportRepository, CompletedTransactionReportParams } from '../repositories/transactionReportRepository';

export class TransactionReportService {
  constructor(private readonly repository: TransactionReportRepository) {}
  getCompletedTransactions(params: CompletedTransactionReportParams) { return this.repository.getCompletedTransactions(params); }
}
