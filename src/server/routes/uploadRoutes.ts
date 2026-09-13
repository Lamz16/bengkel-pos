import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

export const uploadRouter = Router();

// Ensure local directory exists for part images
const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'parts');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * POST /api/upload/image
 * Receives base64 encoded WebP image payload or image file data
 * Saves to local folder `/uploads/parts/` and returns public URL
 */
uploadRouter.post('/image', (req: Request, res: Response) => {
  try {
    const { image, folder = 'parts' } = req.body;

    if (!image || typeof image !== 'string') {
      res.status(400).json({ error: 'Payload gambar tidak valid atau kosong.' });
      return;
    }

    // Match base64 data URL
    const matches = image.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
    let buffer: Buffer;
    let extension = 'webp';

    if (matches && matches.length === 3) {
      extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      // Direct base64 string
      buffer = Buffer.from(image, 'base64');
    }

    const targetDir = path.join(process.cwd(), 'uploads', folder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filename = `part-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${extension}`;
    const filePath = path.join(targetDir, filename);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${folder}/${filename}`;

    res.json({
      success: true,
      url: publicUrl,
      filename,
      size: buffer.length,
    });
  } catch (err) {
    console.error('[UploadRouter] Failed to save image:', err);
    res.status(500).json({ error: 'Gagal menyimpan berkas gambar ke penyimpan lokal.' });
  }
});
