import { GoogleGenAI } from '@google/genai';

export class AiDiagnosisService {
  async diagnose(vehicleModel?: string, complaint?: string): Promise<string> {
    if (!complaint) {
      throw new Error('Keluhan kendaraan wajib diisi.');
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return `Diagnosa Awal (${vehicleModel || 'Kendaraan'}): Berdasarkan keluhan "${complaint}", periksa komponen utama seperti sistem pembakaran/busi, filter udara, dan pelumasan mesin. Lakukan test ride untuk memastikan suara abnormal.`;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Anda adalah Kepala Mekanik bengkel sepeda motor & mobil berpengalaman di Indonesia. Berikan analisa teknis singkat padat (maksimal 3 kalimat) dalam bahasa Indonesia mengenai potensi penyebab kerusakan dan saran penanganan mekanik untuk kendaraan model "${vehicleModel || 'Motor/Mobil Umum'}" dengan keluhan: "${complaint}".`,
      });
      return response.text || 'Pemeriksaan fisik langsung oleh mekanik diperlukan.';
    } catch (err) {
      console.error('[AiDiagnosisService] Gemini API error:', err);
      return 'Pengecekan fisik menyeluruh oleh mekanik disarankan.';
    }
  }
}
