import { Router } from 'express';
import { financeController } from '../controllers/financeController';

export const expenseRouter = Router();
expenseRouter.get('/', (req, res) => financeController.getExpenses(req, res));
expenseRouter.post('/', (req, res) => financeController.createExpense(req, res));
expenseRouter.delete('/:id', (req, res) => financeController.deleteExpense(req, res));

export const purchaseRouter = Router();
purchaseRouter.get('/', (req, res) => financeController.getPurchases(req, res));
