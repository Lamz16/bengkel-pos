import { Router } from 'express';
import { partController } from '../controllers/partController';

export const partRouter = Router();

partRouter.get('/', (req, res) => partController.getParts(req, res));
partRouter.post('/', (req, res) => partController.createPart(req, res));
partRouter.put('/:id', (req, res) => partController.updatePart(req, res));
partRouter.delete('/:id', (req, res) => partController.deletePart(req, res));
partRouter.post('/:id/stock', (req, res) => partController.addStock(req, res));
