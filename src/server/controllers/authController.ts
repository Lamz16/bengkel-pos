import { Request, Response } from 'express';
import { staffRepository, settingsRepository } from '../container';

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { email, password, role } = req.body;
      
      let user = null;
      if (email && email.trim()) {
        user = await staffRepository.findByEmail(email.trim());
      } else if (role) {
        user = await staffRepository.findByRole(role);
      }

      // 1. Apabila user tidak ada -> fallback "Email tidak terdaftar."
      if (!user) {
        return res.status(401).json({ 
          error: 'Email tidak terdaftar.' 
        });
      }

      // 2. Apabila password salah -> fallback "Password salah."
      const expectedPassword = user.password || 'akundemo';
      if (!password || password !== expectedPassword) {
        return res.status(401).json({ 
          error: 'Password salah.' 
        });
      }

      const { password: _, ...userSafe } = user;
      res.json(userSafe);
    } catch (err: any) {
      console.error('[AuthController] login error:', err);
      res.status(500).json({ error: 'Gagal melakukan otentikasi server' });
    }
  }

  async register(req: Request, res: Response) {
    try {
      const { workshopName, email, password } = req.body;
      
      if (!email || !email.trim()) {
        return res.status(400).json({ error: 'Email wajib diisi untuk pendaftaran.' });
      }

      const existingUser = await staffRepository.findByEmail(email.trim());
      if (existingUser) {
        return res.status(400).json({ error: `Email "${email}" sudah terdaftar. Silakan gunakan menu Masuk/Login.` });
      }

      const user = await staffRepository.createUser({
        name: workshopName ? `Pemilik ${workshopName}` : 'Pemilik Bengkel',
        email: email.trim(),
        password: password || 'akundemo',
        role: 'Owner',
        workshopName: workshopName || 'BengkelPro Mandiri'
      });

      if (workshopName) {
        await settingsRepository.update({ name: workshopName });
      }

      const { password: _, ...userSafe } = user;
      res.json(userSafe);
    } catch (err: any) {
      console.error('[AuthController] register error:', err);
      res.status(500).json({ error: 'Gagal mendaftarkan akun bengkel' });
    }
  }
}

export const authController = new AuthController();

