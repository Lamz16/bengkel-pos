import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { checkDbConnection, isDbConnected } from './src/server/db/connection';
import { apiRouter } from './src/server/routes';
import { performanceMonitoringMiddleware, errorMonitoringMiddleware } from './src/server/middleware/monitoring';

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Performance Monitoring Middleware
  app.use(performanceMonitoringMiddleware);

  // Body parser Middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Static serving for uploaded assets
  const uploadsPath = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsPath));

  // Check Database connection (Prisma with PostgreSQL)
  let isDbReady = false;
  try {
    isDbReady = await checkDbConnection();
  } catch (err) {
    console.error('Error during initial DB check:', err);
  }

  // ==========================================
  // MODULAR REST API ROUTES (SOLID Architecture)
  // ==========================================
  app.use('/api', apiRouter);
  app.use(errorMonitoringMiddleware);

  // ==========================================
  // VITE MIDDLEWARE (Dev) or STATIC SERVING (Prod)
  // ==========================================
  const distPath = path.join(process.cwd(), 'dist');
  const hasDist = fs.existsSync(path.join(distPath, 'index.html'));
  const isProd = process.env.NODE_ENV === 'production' || hasDist;

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Application build not found');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 BengkelPro Backend Server berjalan pada http://0.0.0.0:${PORT}`);
    console.log(`🗄️  Prisma ORM & PostgreSQL status: ${isDbConnected() ? 'Connected' : 'Fallback Mode (Ready for local PostgreSQL)'}`);
  });
}

startServer();
