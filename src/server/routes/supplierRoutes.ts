import { Router } from 'express';
import { supplierController } from '../controllers/supplierController';

export const supplierRouter = Router();

supplierRouter.get('/', (req, res) => supplierController.getSuppliers(req, res));
supplierRouter.post('/', (req, res) => supplierController.createSupplier(req, res));
supplierRouter.put('/:id', (req, res) => supplierController.updateSupplier(req, res));
supplierRouter.delete('/:id', (req, res) => supplierController.deleteSupplier(req, res));
