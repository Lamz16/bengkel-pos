import { Router } from 'express';
import { masterDataController } from '../controllers/masterDataController';

export const masterDataRouter = Router();
masterDataRouter.get('/categories', masterDataController.getCategories);
masterDataRouter.post('/categories', masterDataController.createCategory);
masterDataRouter.put('/categories/:id', masterDataController.updateCategory);
masterDataRouter.delete('/categories/:id', masterDataController.deleteCategory);
masterDataRouter.get('/zones', masterDataController.getZones);
masterDataRouter.post('/zones', masterDataController.createZone);
masterDataRouter.put('/zones/:id', masterDataController.updateZone);
masterDataRouter.delete('/zones/:id', masterDataController.deleteZone);
masterDataRouter.get('/racks', masterDataController.getRacks);
masterDataRouter.post('/racks', masterDataController.createRack);
masterDataRouter.put('/racks/:id', masterDataController.updateRack);
masterDataRouter.delete('/racks/:id', masterDataController.deleteRack);
