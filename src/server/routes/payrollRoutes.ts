import { Router } from 'express';
import { ownerOnly } from '../auth';
import { payrollController } from '../controllers/payrollController';
export const payrollRouter = Router();
payrollRouter.use(ownerOnly);
payrollRouter.get('/', (req, res) => payrollController.getReport(req, res));
payrollRouter.post('/finalize', (req, res) => payrollController.finalize(req, res));
payrollRouter.post('/:id/reopen', (req, res) => payrollController.reopen(req, res));
