import { Request, Response } from 'express';
import { aiDiagnosisService } from '../container';

export class AiController {
  async diagnoseComplaint(req: Request, res: Response) {
    try {
      const { model, complaint } = req.body;
      if (!complaint) {
        return res.status(400).json({ error: 'Keluhan kendaraan wajib diisi.' });
      }
      const diagnosis = await aiDiagnosisService.diagnose(model, complaint);
      res.json({ diagnosis });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal memproses diagnosa AI' });
    }
  }
}

export const aiController = new AiController();
