import { Router } from 'express';
import { aiController } from '../controllers/aiController';

export const aiRouter = Router();
aiRouter.post('/diagnose', (req, res) => aiController.diagnoseComplaint(req, res));
