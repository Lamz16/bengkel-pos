import { Request, Response, NextFunction } from 'express';
import { prisma, isDbConnected } from '../db/connection';

const RETENTION_MS = 24 * 60 * 60 * 1000;
const PROCESSING_STATUS = 102;

/**
 * DB is the source of truth, so duplicate writes remain protected even when
 * the API runs in more than one process. A unique key is inserted before
 * the handler starts; this closes the old check-then-act race.
 */
export async function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();

  const suppliedKey = (req.headers['x-idempotency-key'] as string)
    || (req.headers['idempotency-key'] as string)
    || req.body?.idempotencyKey;
  if (!suppliedKey || typeof suppliedKey !== 'string' || suppliedKey.length > 160) return next();

  const key = `idemp:${req.method}:${req.baseUrl}${req.path}:${suppliedKey}`;
  if (!isDbConnected()) return next(); // API route rejects DB outages first.

  const now = new Date();
  const expiresAt = new Date(now.getTime() + RETENTION_MS);
  try {
    // The expiresAt index keeps this cleanup bounded and the table small.
    await prisma.idempotencyRecord.deleteMany({ where: { expiresAt: { lt: now } } });
    await prisma.idempotencyRecord.create({
      data: {
        key,
        path: req.path,
        statusCode: PROCESSING_STATUS,
        response: JSON.stringify({ error: 'Transaksi sedang diproses.' }),
        expiresAt,
      },
    });
  } catch (err: any) {
    if (err?.code !== 'P2002') return next(err);

    const existing = await prisma.idempotencyRecord.findUnique({ where: { key } });
    if (!existing || existing.expiresAt < now) return next();
    if (existing.statusCode === PROCESSING_STATUS) {
      return res.status(409).json({ error: 'Transaksi dengan kunci yang sama sedang diproses.', code: 'IDEMPOTENCY_IN_PROGRESS' });
    }
    try {
      return res.status(existing.statusCode).json(JSON.parse(existing.response));
    } catch {
      return res.status(existing.statusCode).json({ error: 'Respons transaksi sebelumnya tidak dapat dibaca.' });
    }
  }

  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    // The lock already exists before the handler executes. A second request
    // sees PENDING and cannot create a duplicate while this response is saved.
    void prisma.idempotencyRecord.update({
      where: { key },
      data: { path: req.path, statusCode: res.statusCode, response: JSON.stringify(body), expiresAt },
    }).catch(error => console.error('[Idempotency] Gagal menyimpan respons:', error));
    return originalJson(body);
  };
  next();
}
