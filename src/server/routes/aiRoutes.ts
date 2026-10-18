import { Router } from 'express';
import { aiController } from '../controllers/aiController';
import { ownerOnly } from '../auth';

export const aiRouter = Router();
aiRouter.use(ownerOnly);
aiRouter.post('/diagnose', (req, res) => aiController.diagnoseComplaint(req, res));
