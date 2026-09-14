import { Request, Response } from 'express';
import { spawn } from 'node:child_process';
import { staffRepository } from '../container';
import { verifyPassword } from '../auth';

const MAX_BACKUP_BYTES = 100 * 1024 * 1024;

function runCommand(command: string, args: string[], env: NodeJS.ProcessEnv): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { env, windowsHide: true, shell: false });
    const output: Buffer[] = [];
    const errors: Buffer[] = [];
    let size = 0;

    child.stdout.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BACKUP_BYTES) {
        child.kill();
        reject(new Error('Ukuran backup melebihi batas 100 MB.'));
        return;
      }
      output.push(chunk);
    });
    child.stderr.on('data', (chunk: Buffer) => errors.push(chunk));
    child.on('error', reject);
    child.on('close', code => {
      if (code === 0) resolve(Buffer.concat(output));
      else reject(new Error(Buffer.concat(errors).toString('utf8').trim() || `pg_dump berhenti dengan kode ${code}`));
    });
  });
}

export class DatabaseController {
  async downloadBackup(req: Request, res: Response) {
    const { email, password } = req.body;
    const user = email ? await staffRepository.findByEmail(String(email).trim()) : null;
    if (!user || user.id !== req.authUser?.id || user.role !== 'Owner' || !password || !(await verifyPassword(password, user.password))) {
      return res.status(401).json({ error: 'Email atau password Owner tidak valid.' });
    }
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) return res.status(503).json({ error: 'DATABASE_URL belum dikonfigurasi.' });

    try {
      const db = new URL(connectionString);
      const database = decodeURIComponent(db.pathname.replace(/^\//, ''));
      const username = decodeURIComponent(db.username);
      const password = decodeURIComponent(db.password);
      const commonArgs = ['--clean', '--if-exists', '--no-owner', '--no-privileges', '--format=plain', '--encoding=UTF8'];
      let backup: Buffer;

      try {
        backup = await runCommand('pg_dump', [
          ...commonArgs, '--host', db.hostname, '--port', db.port || '5432', '--username', username, database,
        ], { ...process.env, PGPASSWORD: password });
      } catch (localError: any) {
        const container = process.env.POSTGRES_CONTAINER || 'bengkelpro-db';
        backup = await runCommand('docker', [
          'exec', '-e', `PGPASSWORD=${password}`, container, 'pg_dump',
          ...commonArgs, '--username', username, database,
        ], process.env);
        console.info(`[DatabaseBackup] pg_dump lokal tidak tersedia, memakai container ${container}: ${localError.message}`);
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `bengkel-pos-${database}-${timestamp}.sql`;
      res.setHeader('Content-Type', 'application/sql; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-store');
      return res.send(backup);
    } catch (error: any) {
      console.error('[DatabaseBackup] Gagal membuat backup:', error);
      return res.status(500).json({
        error: 'Gagal membuat backup PostgreSQL.',
        detail: error?.message || 'Kesalahan tidak diketahui',
      });
    }
  }
}

export const databaseController = new DatabaseController();
