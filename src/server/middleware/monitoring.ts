import { Request, Response, NextFunction } from 'express';
import { isDbConnected } from '../db/connection';

interface ErrorLog {
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  message: string;
  stack?: string;
}

class SystemMonitor {
  private startTime = Date.now();
  private totalRequests = 0;
  private totalResponseTimeMs = 0;
  private errorCount4xx = 0;
  private errorCount5xx = 0;
  private recentErrors: ErrorLog[] = [];
  private maxErrorLogs = 50;

  public logRequest(req: Request, res: Response, durationMs: number) {
    this.totalRequests++;
    this.totalResponseTimeMs += durationMs;

    const status = res.statusCode;
    if (status >= 500) {
      this.errorCount5xx++;
    } else if (status >= 400) {
      this.errorCount4xx++;
    }
  }

  public logError(req: Request, err: any, statusCode: number = 500) {
    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode,
      message: err?.message || String(err),
      stack: err?.stack,
    };

    this.recentErrors.unshift(errorLog);
    if (this.recentErrors.length > this.maxErrorLogs) {
      this.recentErrors.pop();
    }
  }

  public getMetrics() {
    const mem = process.memoryUsage();
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    const avgResponseTimeMs = this.totalRequests > 0 
      ? Math.round((this.totalResponseTimeMs / this.totalRequests) * 10) / 10 
      : 0;

    return {
      uptimeSeconds,
      memoryUsageMb: {
        rss: Math.round(mem.rss / (1024 * 1024) * 10) / 10,
        heapTotal: Math.round(mem.heapTotal / (1024 * 1024) * 10) / 10,
        heapUsed: Math.round(mem.heapUsed / (1024 * 1024) * 10) / 10,
      },
      requestsTotal: this.totalRequests,
      errorCount5xx: this.errorCount5xx,
      errorCount4xx: this.errorCount4xx,
      avgResponseTimeMs,
      dbStatus: isDbConnected() ? 'Connected (PostgreSQL/Prisma)' : 'Memory Fallback Store',
      recentErrors: this.recentErrors,
    };
  }
}

export const systemMonitor = new SystemMonitor();

export function performanceMonitoringMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    systemMonitor.logRequest(req, res, duration);
  });

  next();
}

export function errorMonitoringMiddleware(err: any, req: Request, res: Response, next: NextFunction) {
  const statusCode = err.status || err.statusCode || 500;
  systemMonitor.logError(req, err, statusCode);
  res.locals.activityError = err;

  res.status(statusCode).json({
    error: err.message || 'Terjadi kesalahan pada server',
    statusCode,
  });
}
