import { Router } from 'express';
import { partController } from '../controllers/partController';
import { ownerOnly } from '../auth';

export const partRouter = Router();

partRouter.get('/', (req, res) => partController.getParts(req, res));
partRouter.get('/history', ownerOnly, (req, res) => partController.getStockHistory(req, res));
partRouter.post('/', ownerOnly, (req, res) => partController.createPart(req, res));
partRouter.put('/:id', ownerOnly, (req, res) => partController.updatePart(req, res));
partRouter.delete('/:id', ownerOnly, (req, res) => partController.deletePart(req, res));
partRouter.post('/:id/stock', ownerOnly, (req, res) => partController.addStock(req, res));
