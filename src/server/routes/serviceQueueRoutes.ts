import { Router } from 'express';
import { serviceQueueController } from '../controllers/serviceQueueController';
export const serviceQueueRouter = Router();
serviceQueueRouter.get('/', (req, res) => serviceQueueController.list(req, res));
serviceQueueRouter.post('/', (req, res) => serviceQueueController.create(req, res));
serviceQueueRouter.get('/:id', (req, res) => serviceQueueController.get(req, res));
serviceQueueRouter.put('/:id', (req, res) => serviceQueueController.update(req, res));
serviceQueueRouter.put('/:id/cancel', (req, res) => serviceQueueController.cancel(req, res));
serviceQueueRouter.post('/:id/convert', (req, res) => serviceQueueController.convert(req, res));
