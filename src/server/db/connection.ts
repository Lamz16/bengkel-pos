import { PrismaClient } from '@prisma/client';

let _prismaClient: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient | null {
  if (!process.env.DATABASE_URL) return null;
  if (!_prismaClient) {
    try {
      _prismaClient = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
      });
    } catch (err) {
      console.warn('⚠️ [DB] Gagal menginisialisasi PrismaClient:', err);
      return null;
    }
  }
  return _prismaClient;
}

// Lazy proxy to ensure existing prisma.* calls work without module-load crashes
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    if (!client) {
      throw new Error('Database client not initialized or DATABASE_URL not provided');
    }
    const val = (client as any)[prop];
    if (typeof val === 'function') {
      return val.bind(client);
    }
    return val;
  }
});

let isPostgresConnected = false;

export function isDbConnected(): boolean {
  return isPostgresConnected;
}

export async function checkDbConnection(): Promise<boolean> {
  if (!process.env.DATABASE_URL) {
    console.log('ℹ️ [DB] DATABASE_URL tidak ditemukan. Menggunakan fallback storage dalam memori untuk preview.');
    isPostgresConnected = false;
    return false;
  }

  const client = getPrismaClient();
  if (!client) {
    isPostgresConnected = false;
    return false;
  }

  try {
    await client.$queryRaw`SELECT 1`;
    isPostgresConnected = true;
    console.log('✅ [DB] Terhubung ke database PostgreSQL via Prisma ORM!');
    return true;
  } catch (error: any) {
    isPostgresConnected = false;
    console.warn('⚠️ [DB] Tidak dapat terhubung ke PostgreSQL. Mengaktifkan fallback data:', error.message || error);
    return false;
  }
}
