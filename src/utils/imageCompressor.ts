/**
 * Image Compressor & WebP Formatter Utility
 * Converts image files (PNG, JPG, WEBP, GIF, HEIC) to compressed WebP format.
 */

export interface CompressionResult {
  webpBlob: Blob;
  webpDataUrl: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  compressionRatio: number;
}

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0 to 1
}

export async function compressAndConvertToWebP(
  file: File | Blob,
  options: CompressOptions = {}
): Promise<CompressionResult> {
  const { maxWidth = 1000, maxHeight = 1000, quality = 0.82 } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Gagal membaca berkas gambar.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Format gambar tidak didukung atau berkas rusak.'));
      img.onload = () => {
        // Calculate new dimensions respecting aspect ratio
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Gagal menginisialisasi canvas untuk kompresi.'));
        }

        // Draw image onto canvas
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP Data URL
        const webpDataUrl = canvas.toDataURL('image/webp', quality);

        // Convert canvas to WebP Blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('Gagal mengonversi gambar ke format WebP.'));
            }

            const originalSize = file.size;
            const compressedSize = blob.size;
            const compressionRatio = Math.round((1 - compressedSize / originalSize) * 100);

            resolve({
              webpBlob: blob,
              webpDataUrl,
              originalSize,
              compressedSize,
              width,
              height,
              compressionRatio: Math.max(0, compressionRatio),
            });
          },
          'image/webp',
          quality
        );
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
