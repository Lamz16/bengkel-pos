import { NextFunction, Request, Response } from 'express';
import { isDbConnected } from '../db/connection';

// Memory store hanya untuk preview/development. Operasi bisnis tidak boleh
// berpindah ke RAM ketika PostgreSQL produksi sedang gagal.
export function requireDatabase(req: Request, res: Response, next: NextFunction) {
  if (isDbConnected()) return next();
  return res.status(503).json({
    error: 'Database tidak tersedia. Tidak ada perubahan yang disimpan sementara di memori.',
    code: 'DATABASE_UNAVAILABLE',
  });
}
