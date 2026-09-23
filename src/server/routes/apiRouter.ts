import { Router, Request, Response } from 'express';
import { isDbConnected } from '../db/connection';
import { bootstrapController } from '../controllers/bootstrapController';
import { customerRouter, vehicleRouter } from './customerRoutes';
import { partRouter } from './partRoutes';
import { serviceRouter } from './serviceRoutes';
import { mechanicRouter, deductionRouter, attendanceRouter } from './mechanicRoutes';
import { supplierRouter } from './supplierRoutes';
import { expenseRouter, purchaseRouter } from './financeRoutes';
import { settingsRouter, staffRouter } from './settingsRoutes';
import { aiRouter } from './aiRoutes';
import { authRouter } from './authRoutes';
import { distributorInvoiceRouter } from './distributorInvoiceRoutes';
import { uploadRouter } from './uploadRoutes';
import { masterDataRouter } from './masterDataRoutes';
import { databaseRouter } from './databaseRoutes';
import { storageLocationRouter } from './storageLocationRoutes';
import { authorize, requireAuth } from '../auth';
import { idempotencyMiddleware } from '../middleware/idempotency';
import { systemMonitor } from '../middleware/monitoring';
import { requireDatabase } from '../middleware/databaseRequired';
import { activityLogger } from '../middleware/activityLogger';
import { activityLogRouter } from './activityLogRoutes';

export const apiRouter = Router();

// Health Check & Monitoring
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    orm: 'prisma',
    database: 'postgresql',
    postgresConnected: isDbConnected(),
  });
});

apiRouter.get('/monitoring/metrics', (_req: Request, res: Response) => {
  res.json(systemMonitor.getMetrics());
});

// Authentication is public; every business endpoint below requires a valid Owner/Admin JWT.
apiRouter.use('/auth', authRouter);
apiRouter.use(requireAuth, authorize('Owner', 'Admin'));
apiRouter.use(requireDatabase);
apiRouter.use(activityLogger);

// Apply idempotency check for POST/PUT/PATCH write requests
apiRouter.use(idempotencyMiddleware);

// Bootstrap initial data
apiRouter.get('/bootstrap', (req, res) => bootstrapController.getBootstrapData(req, res));
apiRouter.use('/logs', activityLogRouter);

// Resource routes
apiRouter.use('/customers', customerRouter);
apiRouter.use('/vehicles', vehicleRouter);
apiRouter.use('/parts', partRouter);
apiRouter.use('/services', serviceRouter);
apiRouter.use('/mechanics', mechanicRouter);
apiRouter.use('/deductions', deductionRouter);
apiRouter.use('/attendances', attendanceRouter);
apiRouter.use('/suppliers', supplierRouter);
apiRouter.use('/expenses', expenseRouter);
apiRouter.use('/purchases', purchaseRouter);
apiRouter.use('/settings', settingsRouter);
apiRouter.use('/staff', staffRouter);
apiRouter.use('/ai', aiRouter);
apiRouter.use('/distributor-invoices', distributorInvoiceRouter);
apiRouter.use('/upload', uploadRouter);
apiRouter.use('/master-data', masterDataRouter);
apiRouter.use('/database', databaseRouter);
apiRouter.use('/storage-locations', storageLocationRouter);
