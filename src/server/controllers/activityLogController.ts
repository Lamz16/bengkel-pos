import { Request, Response } from 'express';
import { prisma } from '../db/connection';

export class ActivityLogController {
  async list(req: Request, res: Response) {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 25)));
    const status = req.query.status === 'error' ? false : req.query.status === 'success' ? true : undefined;
    const where = status === undefined ? {} : { success: status };
    const [total, data] = await Promise.all([
      prisma.activityLog.count({ where }),
      prisma.activityLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
    ]);
    res.json({ data, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
  }
}
export const activityLogController = new ActivityLogController();
