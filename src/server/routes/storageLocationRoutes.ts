import { Router } from 'express';
import { storageLocationController } from '../controllers/storageLocationController';
export const storageLocationRouter = Router();
storageLocationRouter.get('/', storageLocationController.list);
storageLocationRouter.post('/rack-layout', storageLocationController.createRackLayout);
storageLocationRouter.post('/non-rack', storageLocationController.createNonRack);
