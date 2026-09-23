import { Router } from 'express';
import { settingsController } from '../controllers/settingsController';
import { authorize } from '../auth';

export const settingsRouter = Router();
settingsRouter.get('/', (req, res) => settingsController.getSettings(req, res));
settingsRouter.put('/', (req, res) => settingsController.updateSettings(req, res));
settingsRouter.get('/loyalty-tiers', (req, res) => settingsController.getLoyaltyTiers(req, res));
settingsRouter.post('/loyalty-tiers', (req, res) => settingsController.createLoyaltyTier(req, res));
settingsRouter.put('/loyalty-tiers/:id', (req, res) => settingsController.updateLoyaltyTier(req, res));
settingsRouter.delete('/loyalty-tiers/:id', (req, res) => settingsController.deleteLoyaltyTier(req, res));

export const staffRouter = Router();
staffRouter.use(authorize('Owner'));
staffRouter.get('/', (req, res) => settingsController.getStaff(req, res));
staffRouter.post('/', (req, res) => settingsController.createStaff(req, res));
