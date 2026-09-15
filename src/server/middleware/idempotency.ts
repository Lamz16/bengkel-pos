import { Request, Response, NextFunction } from 'express';
import { prisma, isDbConnected } from '../db/connection';

interface CachedResponse {
  statusCode: number;
  body: any;
  timestamp: number;
  isProcessing: boolean;
}

const memoryIdempotencyStore = new Map<string, CachedResponse>();

export async function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  const idempotencyKey = 
    (req.headers['x-idempotency-key'] as string) || 
    (req.headers['idempotency-key'] as string) || 
    req.body?.idempotencyKey;

  if (!idempotencyKey || typeof idempotencyKey !== 'string') {
    return next();
  }

  const key = `idemp:${req.path}:${idempotencyKey}`;

  // 1. Check DB or Memory store for existing key
  if (isDbConnected()) {
    try {
      const record = await prisma.idempotencyRecord.findUnique({
        where: { key },
      });

      if (record) {
        console.log(`[Idempotency] Request disadap dari cache DB (Key: ${idempotencyKey})`);
        return res.status(record.statusCode).json(JSON.parse(record.response));
      }
    } catch (err) {
      console.warn('[Idempotency] Error reading idempotency DB:', err);
    }
  }

  const cached = memoryIdempotencyStore.get(key);

  if (cached) {
    if (cached.isProcessing) {
      console.warn(`[Idempotency] Request ganda terdeteksi sedang dalam proses! (Key: ${idempotencyKey})`);
      return res.status(409).json({
        error: 'Transaksi sedang diproses oleh sistem. Mohon tidak menekan tombol berturut-turut.',
        isDuplicateAttempt: true,
      });
    }

    console.log(`[Idempotency] Request disadap dari memory cache (Key: ${idempotencyKey})`);
    return res.status(cached.statusCode).json(cached.body);
  }

  // 2. Mark as processing
  memoryIdempotencyStore.set(key, {
    statusCode: 202,
    body: null,
    timestamp: Date.now(),
    isProcessing: true,
  });

  // Intercept res.json
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    const statusCode = res.statusCode;

    // Save completed response in memory
    memoryIdempotencyStore.set(key, {
      statusCode,
      body,
      timestamp: Date.now(),
      isProcessing: false,
    });

    // Save in DB if connected
    if (isDbConnected() && statusCode < 500) {
      prisma.idempotencyRecord.create({
        data: {
          key,
          path: req.path,
          statusCode,
          response: JSON.stringify(body),
        },
      }).catch(err => console.warn('[Idempotency] Failed to persist key:', err));
    }

    return originalJson(body);
  };

  next();
}
