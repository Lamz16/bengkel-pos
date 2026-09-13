import { Router } from 'express';
import { distributorInvoiceController } from '../controllers/distributorInvoiceController';

export const distributorInvoiceRouter = Router();

distributorInvoiceRouter.get('/', (req, res) => distributorInvoiceController.getAll(req, res));
distributorInvoiceRouter.post('/', (req, res) => distributorInvoiceController.create(req, res));
distributorInvoiceRouter.post('/:id/payments', (req, res) => distributorInvoiceController.addPayment(req, res));
distributorInvoiceRouter.delete('/:id', (req, res) => distributorInvoiceController.delete(req, res));
