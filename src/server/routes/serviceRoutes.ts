import { Router } from 'express';
import { serviceController } from '../controllers/serviceController';

export const serviceRouter = Router();

serviceRouter.get('/', (req, res) => serviceController.getServices(req, res));
serviceRouter.post('/', (req, res) => serviceController.createService(req, res));
serviceRouter.put('/:id/status', (req, res) => serviceController.updateStatus(req, res));
serviceRouter.post('/:id/warranty', (req, res) => serviceController.claimWarranty(req, res));
