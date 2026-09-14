import { Router } from 'express';
import { databaseController } from '../controllers/databaseController';

export const databaseRouter = Router();
databaseRouter.post('/backup', (req, res) => databaseController.downloadBackup(req, res));
