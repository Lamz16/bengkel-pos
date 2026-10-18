import { Router } from 'express';
import { storageLocationController } from '../controllers/storageLocationController';
import { ownerOnly } from '../auth';

export const storageLocationRouter = Router();
storageLocationRouter.use(ownerOnly);

storageLocationRouter.get('/', storageLocationController.list);
storageLocationRouter.post('/rack-layout', storageLocationController.createRackLayout);
storageLocationRouter.post('/non-rack', storageLocationController.createNonRack);

storageLocationRouter.put('/racks/:rackId', storageLocationController.updateRack);
storageLocationRouter.delete('/racks/:rackId', storageLocationController.deleteRack);
storageLocationRouter.put('/:id', storageLocationController.updateNonRack);
storageLocationRouter.delete('/:id', storageLocationController.deleteNonRack);
