/**
 * REST API Health Check & Connection Diagnostic Utility
 */

import { getApiBaseUrl } from './config';
import { ApiHealthStatus } from './types';

export const healthApi = {
  /**
   * Ping backend to test connectivity, CORS, and response latency
   */
  async checkConnection(customUrl?: string): Promise<ApiHealthStatus> {
    const targetUrl = (customUrl || getApiBaseUrl()).replace(/\/+$/, '');
    const startTime = performance.now();

    // Check health endpoint first, fallback to root if 404
    const endpointsToTry = ['/health', '/ping', ''];

    for (const ep of endpointsToTry) {
      const fullUrl = `${targetUrl}${ep}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      try {
        const res = await fetch(fullUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const latencyMs = Math.round(performance.now() - startTime);

        if (res.ok || res.status === 401 || res.status === 403) {
          // If 401/403, the server is alive and responding with auth guard
          return {
            online: true,
            url: targetUrl,
            latencyMs,
            statusCode: res.status,
            message: `Koneksi berhasil (${latencyMs}ms). Server REST API aktif.`,
          };
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        // If aborted or error, try next or return offline
        if (ep === endpointsToTry[endpointsToTry.length - 1]) {
          return {
            online: false,
            url: targetUrl,
            message: err.name === 'AbortError' 
              ? 'Waktu koneksi habis (timeout > 6 detik). Pastikan server aktif.' 
              : `Gagal terhubung (${err.message || 'Network / CORS error'}). Periksa apakah backend mengizinkan CORS dari origin ini.`,
          };
        }
      }
    }

    return {
      online: false,
      url: targetUrl,
      message: 'Server tidak merespons pada endpoint /health atau /ping.',
    };
  },
};
