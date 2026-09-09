import { GoogleGenAI } from "@google/genai";

let genAI: GoogleGenAI | null = null;

function getGenAI() {
  const apiKey = typeof process !== "undefined" ? process.env?.GEMINI_API_KEY : undefined;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not defined. AI features will be disabled.");
    return null;
  }
  if (!genAI) {
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

export async function getAIDiagnosis(complaint: string, model: string) {
  try {
    const ai = getGenAI();
    if (!ai) {
      return "Fitur diagnosis AI tidak tersedia karena API Key belum dikonfigurasi.";
    }
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Anda adalah asisten mekanik bengkel profesional. Pelanggan datang dengan keluhan pada mobil/motor mereka: "${complaint}". Model kendaraan adalah "${model}". Berikan diagnosis singkat dalam 2-3 poin teknis mengenai apa yang mungkin harus diperiksa dan estimasi suku cadang yang diperlukan. Gunakan bahasa Indonesia yang santai tapi profesional.`,
      config: {
        temperature: 0.7,
      }
    });

    return response.text;
  } catch (error) {
    console.error("AI Diagnosis Error:", error);
    return "Maaf, sistem diagnosis AI sedang sibuk atau API Key tidak valid. Silakan lakukan pengecekan manual.";
  }
}
