import { NextFunction, Request, Response } from 'express';
import { isDbConnected, prisma } from '../db/connection';

function describe(req: Request, statusCode: number, body: unknown) {
  const resource = req.path.split('/').filter(Boolean)[0] || 'sistem';
  const result = statusCode >= 400 ? 'gagal' : 'berhasil';
  const message = typeof body === 'object' && body && 'error' in body
    ? String((body as { error?: string }).error || '')
    : '';
  return message || `${req.method} ${resource} ${result}`;
}

export function activityLogger(req: Request, res: Response, next: NextFunction) {
  // Avoid recursively logging requests made to read the audit log itself.
  if (!isDbConnected() || req.path.startsWith('/logs')) return next();
  let responseBody: unknown;
  const originalJson = res.json.bind(res);
  res.json = (body: unknown) => {
    responseBody = body;
    return originalJson(body);
  };
  res.on('finish', () => {
    if (res.statusCode === 304 || res.headersSent === false) return;
    const user = req.authUser;
    void prisma.activityLog.create({
      data: {
        userId: user?.id || null,
        userName: user?.name || null,
        role: user?.role || null,
        method: req.method,
        path: req.path,
        action: `${req.method} ${req.path}`,
        statusCode: res.statusCode,
        success: res.statusCode >= 200 && res.statusCode < 400,
        description: describe(req, res.statusCode, responseBody),
      },
    }).catch(error => console.error('[ActivityLog] Gagal menyimpan log:', error));
  });
  next();
}
