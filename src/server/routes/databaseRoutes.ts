import { Router } from 'express';
import { databaseController } from '../controllers/databaseController';
import { authorize } from '../auth';

export const databaseRouter = Router();
databaseRouter.get('/backup-history', authorize('Owner'), (req, res) => databaseController.getBackupHistory(req, res));
databaseRouter.post('/backup', authorize('Owner'), (req, res) => databaseController.downloadBackup(req, res));
