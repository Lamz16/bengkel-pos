import { Router } from 'express';
import { draftController } from '../controllers/draftController';

export const draftRouter = Router();

draftRouter.get('/', (req, res) => draftController.list(req, res));
draftRouter.post('/', (req, res) => draftController.create(req, res));
draftRouter.get('/:id', (req, res) => draftController.get(req, res));
draftRouter.put('/:id', (req, res) => draftController.update(req, res));
draftRouter.delete('/:id', (req, res) => draftController.delete(req, res));
