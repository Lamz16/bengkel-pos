import {PrinterCapability, fromPrinter, validProfile} from './profiles';
export async function detectPrinters(timeoutMs = 2500): Promise<PrinterCapability[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch('http://127.0.0.1:17843/printers', {
            signal: controller.signal, credentials: 'omit', cache: 'no-store',
        });
        if (!response.ok) throw new Error('Pendamping tidak tersedia');
        const data = await response.json();
        if (data.version !== 1 || !Array.isArray(data.printers) || !data.printers.every((p: PrinterCapability) =>
            typeof p?.name === 'string' && typeof p.driver === 'string' && Array.isArray(p.papers) && validProfile(fromPrinter(p)))) {
            throw new Error('Data kemampuan printer tidak valid');
        }
        return data.printers;
    } finally { clearTimeout(timeout); }
}
