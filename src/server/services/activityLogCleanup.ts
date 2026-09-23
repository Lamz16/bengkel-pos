import { isDbConnected, prisma } from '../db/connection';

const RETENTION_MS = 24 * 60 * 60 * 1000;

export function startActivityLogCleanup() {
  const cleanup = () => {
    if (!isDbConnected()) return;
    void prisma.activityLog.deleteMany({
      where: { createdAt: { lt: new Date(Date.now() - RETENTION_MS) } },
    }).catch(error => console.error('[ActivityLog] Gagal membersihkan log lama:', error));
  };
  cleanup();
  setInterval(cleanup, RETENTION_MS).unref();
}
