import { Router } from 'express';
import { financeController } from '../controllers/financeController';
import { ownerOnly } from '../auth';

export const expenseRouter = Router();
expenseRouter.use(ownerOnly);
expenseRouter.get('/categories', (req, res) => financeController.getExpenseCategories(req, res));
expenseRouter.post('/categories', (req, res) => financeController.createExpenseCategory(req, res));
expenseRouter.put('/categories/:id', (req, res) => financeController.updateExpenseCategory(req, res));
expenseRouter.delete('/categories/:id', (req, res) => financeController.deleteExpenseCategory(req, res));
expenseRouter.get('/', (req, res) => financeController.getExpenses(req, res));
expenseRouter.post('/', (req, res) => financeController.createExpense(req, res));
expenseRouter.delete('/:id', (req, res) => financeController.deleteExpense(req, res));

export const purchaseRouter = Router();
purchaseRouter.use(ownerOnly);
purchaseRouter.get('/', (req, res) => financeController.getPurchases(req, res));
