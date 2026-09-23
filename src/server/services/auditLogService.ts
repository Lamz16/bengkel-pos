import { Request } from 'express';
import { isDbConnected, prisma } from '../db/connection';

type AuditInput = { action: string; entity: string; entityId: string; before?: unknown; after?: unknown; description: string };
const SENSITIVE = new Set(['password', 'passwordHash', 'token', 'authorization']);

function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, child]) => [key, SENSITIVE.has(key) ? '[DISENSOR]' : sanitize(child)]));
  return value;
}

function serialize(value: unknown) { return value === undefined ? null : JSON.stringify(sanitize(value)); }

function changed(before: unknown, after: unknown): string[] {
  if (!before || !after || typeof before !== 'object' || typeof after !== 'object') return [];
  const left = before as Record<string, unknown>; const right = after as Record<string, unknown>;
  return [...new Set([...Object.keys(left), ...Object.keys(right)])].filter(key => !['updatedAt', 'version'].includes(key) && JSON.stringify(sanitize(left[key])) !== JSON.stringify(sanitize(right[key])));
}

export async function recordAudit(req: Request, input: AuditInput): Promise<void> {
  if (!isDbConnected()) return;
  const fields = changed(input.before, input.after);
  await prisma.activityLog.create({ data: {
    userId: req.authUser?.id || null, userName: req.authUser?.name || null, role: req.authUser?.role || null,
    method: req.method, path: req.path, action: input.action, statusCode: 200, success: true, category: 'AUDIT',
    entity: input.entity, entityId: input.entityId, changedFields: fields.length ? JSON.stringify(fields) : null,
    beforeData: serialize(input.before), afterData: serialize(input.after), description: input.description,
    technicalDetail: JSON.stringify({ entity: input.entity, entityId: input.entityId, changedFields: fields }, null, 2),
  }});
}
