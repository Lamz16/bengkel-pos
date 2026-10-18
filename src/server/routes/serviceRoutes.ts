import { Router } from 'express';
import { serviceController } from '../controllers/serviceController';
import { ownerOnly } from '../auth';

export const serviceRouter = Router();

serviceRouter.get('/', (req, res) => serviceController.getServices(req, res));
serviceRouter.get('/receivables', ownerOnly, (req, res) => serviceController.getReceivables(req, res));
serviceRouter.post('/', (req, res) => serviceController.createService(req, res));
serviceRouter.put('/:id', (req, res) => serviceController.updateService(req, res));
serviceRouter.put('/:id/status', (req, res) => serviceController.updateStatus(req, res));
// Payment state is derived only from ServicePayment records. The legacy
// mark-paid shortcut was deliberately removed.
serviceRouter.post('/:id/payments', (req, res) => serviceController.addPayment(req, res));
serviceRouter.post('/:id/returns', ownerOnly, (req, res) => serviceController.processReturn(req, res));
serviceRouter.post('/:id/warranty', ownerOnly, (req, res) => serviceController.claimWarranty(req, res));
