import { Request, Response } from 'express';
import { staffRepository, settingsRepository } from '../container';

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { email, role } = req.body;
      
      let user = null;
      if (email) {
        user = await staffRepository.findByEmail(email);
      }
      
      if (!user && role) {
        user = await staffRepository.findByRole(role);
      }

      if (!user) {
        // Create user in DB if email/role provided but not existing
        user = await staffRepository.createUser({
          name: role === 'Owner' ? 'Bambang Sutrisno' : 'Rian Herlambang',
          email: email || (role === 'Owner' ? 'owner@bengkelpro.com' : 'admin@bengkelpro.com'),
          role: role || 'Owner',
          workshopName: 'BengkelPro Mandiri'
        });
      }

      res.json(user);
    } catch (err: any) {
      console.error('[AuthController] login error:', err);
      res.status(500).json({ error: 'Gagal melakukan otentikasi' });
    }
  }

  async register(req: Request, res: Response) {
    try {
      const { workshopName, email } = req.body;
      
      const user = await staffRepository.createUser({
        name: workshopName ? `Pemilik ${workshopName}` : 'Pemilik Bengkel',
        email: email || 'owner@bengkelpro.com',
        role: 'Owner',
        workshopName: workshopName || 'BengkelPro Mandiri'
      });

      if (workshopName) {
        await settingsRepository.update({ name: workshopName });
      }

      res.json(user);
    } catch (err: any) {
      console.error('[AuthController] register error:', err);
      res.status(500).json({ error: 'Gagal mendaftarkan akun bengkel' });
    }
  }
}

export const authController = new AuthController();
