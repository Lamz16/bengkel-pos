import { isDbConnected, prisma } from '../db/connection';

const TECHNICAL_RETENTION_MS = 24 * 60 * 60 * 1000;
const AUDIT_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

export function startActivityLogCleanup() {
  const cleanup = () => {
    if (!isDbConnected()) return;
    void prisma.activityLog.deleteMany({
      where: { OR: [
        { category: 'ACTIVITY', createdAt: { lt: new Date(Date.now() - TECHNICAL_RETENTION_MS) } },
        { category: 'AUDIT', createdAt: { lt: new Date(Date.now() - AUDIT_RETENTION_MS) } },
      ] },
    }).catch(error => console.error('[ActivityLog] Gagal membersihkan log lama:', error));
  };
  cleanup();
  setInterval(cleanup, TECHNICAL_RETENTION_MS).unref();
}
