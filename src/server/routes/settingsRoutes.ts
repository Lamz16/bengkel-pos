import { Router } from 'express';
import { settingsController } from '../controllers/settingsController';
import { ownerOnly } from '../auth';

export const settingsRouter = Router();
settingsRouter.use(ownerOnly);
settingsRouter.get('/', (req, res) => settingsController.getSettings(req, res));
settingsRouter.put('/', (req, res) => settingsController.updateSettings(req, res));
settingsRouter.get('/loyalty-tiers', (req, res) => settingsController.getLoyaltyTiers(req, res));
settingsRouter.post('/loyalty-tiers', (req, res) => settingsController.createLoyaltyTier(req, res));
settingsRouter.put('/loyalty-tiers/:id', (req, res) => settingsController.updateLoyaltyTier(req, res));
settingsRouter.delete('/loyalty-tiers/:id', (req, res) => settingsController.deleteLoyaltyTier(req, res));

export const staffRouter = Router();
staffRouter.use(ownerOnly);
staffRouter.get('/', (req, res) => settingsController.getStaff(req, res));
staffRouter.post('/', (req, res) => settingsController.createStaff(req, res));
staffRouter.put('/:id', (req, res) => settingsController.updateStaff(req, res));
staffRouter.delete('/:id', (req, res) => settingsController.deleteStaff(req, res));
