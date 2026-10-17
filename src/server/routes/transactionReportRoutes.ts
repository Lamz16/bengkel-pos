import { Router } from 'express';
import { authorize } from '../auth';
import { transactionReportController } from '../controllers/transactionReportController';

export const transactionReportRouter = Router();
transactionReportRouter.get('/completed', authorize('Owner'), (req, res) => transactionReportController.listCompleted(req, res));
