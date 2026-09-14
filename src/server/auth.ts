import bcrypt from 'bcryptjs';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';

export type AuthorizedRole = 'Owner' | 'Admin';
export interface AuthenticatedUser { id: string; email: string; role: AuthorizedRole; name: string }

declare global {
  namespace Express {
    interface Request { authUser?: AuthenticatedUser }
  }
}

const JWT_TTL = '8h';
const BCRYPT_ROUNDS = 12;

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET wajib diisi minimal 32 karakter.');
  return secret;
}

export const hashPassword = (password: string) => bcrypt.hash(password, BCRYPT_ROUNDS);
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

export function issueAccessToken(user: AuthenticatedUser): string {
  return jwt.sign({ email: user.email, role: user.role, name: user.name }, jwtSecret(), {
    subject: user.id, expiresIn: JWT_TTL, issuer: 'bengkel-pos', audience: 'bengkel-pos-web',
  });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return res.status(401).json({ error: 'Sesi login diperlukan.' });
  try {
    const payload = jwt.verify(token, jwtSecret(), {
      issuer: 'bengkel-pos', audience: 'bengkel-pos-web',
    }) as JwtPayload;
    if (!payload.sub || !payload.email || !['Owner', 'Admin'].includes(payload.role)) {
      return res.status(401).json({ error: 'Token sesi tidak valid.' });
    }
    req.authUser = { id: payload.sub, email: payload.email, role: payload.role, name: payload.name || '' };
    next();
  } catch {
    return res.status(401).json({ error: 'Sesi login tidak valid atau sudah kedaluwarsa.' });
  }
}

export function authorize(...roles: AuthorizedRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.authUser || !roles.includes(req.authUser.role)) {
      return res.status(403).json({ error: 'Anda tidak memiliki hak akses untuk tindakan ini.' });
    }
    next();
  };
}
