import { Router } from 'express';
import { activityLogController } from '../controllers/activityLogController';
import { authorize } from '../auth';

export const activityLogRouter = Router();
activityLogRouter.get('/export', authorize('Owner'), (req, res) => activityLogController.export(req, res));
activityLogRouter.get('/', authorize('Owner'), (req, res) => activityLogController.list(req, res));
