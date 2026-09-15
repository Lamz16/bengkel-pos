import { Request, Response } from 'express';
import { staffRepository, settingsRepository } from '../container';
import { hashPassword, issueAccessToken, verifyPassword } from '../auth';

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const user = email?.trim() ? await staffRepository.findByEmail(email.trim()) : null;

      // 1. Apabila user tidak ada -> fallback "Email tidak terdaftar."
      if (!user) {
        return res.status(401).json({ 
          error: 'Email tidak terdaftar.' 
        });
      }

      // 2. Apabila password salah -> fallback "Password salah."
      if (!password || !(await verifyPassword(password, user.password))) {
        return res.status(401).json({ 
          error: 'Password salah.' 
        });
      }

      const { password: _, ...userSafe } = user;
      const token = issueAccessToken(userSafe);
      res.json({ user: userSafe, token });
    } catch (err: any) {
      console.error('[AuthController] login error:', err);
      res.status(500).json({ error: 'Gagal melakukan otentikasi server' });
    }
  }

  async register(req: Request, res: Response) {
    try {
      if (await staffRepository.hasAnyUser()) {
        return res.status(403).json({ error: 'Pendaftaran Owner hanya tersedia saat instalasi awal. Tambahkan akun dari menu Pengguna.' });
      }
      const { workshopName, email, password } = req.body;
      
      if (!email || !email.trim()) {
        return res.status(400).json({ error: 'Email wajib diisi untuk pendaftaran.' });
      }
      if (!password || password.length < 8) {
        return res.status(400).json({ error: 'Password wajib minimal 8 karakter.' });
      }

      const existingUser = await staffRepository.findByEmail(email.trim());
      if (existingUser) {
        return res.status(400).json({ error: `Email "${email}" sudah terdaftar. Silakan gunakan menu Masuk/Login.` });
      }

      const user = await staffRepository.createUser({
        name: workshopName ? `Pemilik ${workshopName}` : 'Pemilik Bengkel',
        email: email.trim(),
        password: await hashPassword(password),
        role: 'Owner',
        workshopName: workshopName || 'BengkelPro Mandiri'
      });

      if (workshopName) {
        await settingsRepository.update({ name: workshopName });
      }

      const { password: _, ...userSafe } = user;
      const token = issueAccessToken(userSafe);
      res.status(201).json({ user: userSafe, token });
    } catch (err: any) {
      console.error('[AuthController] register error:', err);
      res.status(500).json({ error: 'Gagal mendaftarkan akun bengkel' });
    }
  }
}

export const authController = new AuthController();
