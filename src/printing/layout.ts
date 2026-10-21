import {jsPDF} from 'jspdf';
import {PrintProfile} from './profiles';
// Only calibrated B/W output uses physical millimetres. Legacy and colour PDFs keep their existing path.
export function calibratedPdf(canvas: HTMLCanvasElement, profile: PrintProfile): Blob {
    const height = canvas.height / canvas.width * profile.contentMm;
    // PDF has a 14,400-point page limit. Split exceptionally long rolls without dropping pixels.
    const maxHeightMm = 5000;
    const pageHeight = Math.max(Math.min(height, maxHeightMm), profile.paperMm + 1);
    const pdf = new jsPDF({unit: 'mm', format: [profile.paperMm, pageHeight], compress: true});
    const pixelsPerPage = Math.max(1, Math.floor(maxHeightMm / profile.contentMm * canvas.width));
    for (let top = 0; top < canvas.height; top += pixelsPerPage) {
        const slice = document.createElement('canvas');
        slice.width = canvas.width; slice.height = Math.min(pixelsPerPage, canvas.height - top);
        slice.getContext('2d')!.drawImage(canvas, 0, top, canvas.width, slice.height, 0, 0, canvas.width, slice.height);
        const sliceHeight = slice.height / slice.width * profile.contentMm;
        if (top) pdf.addPage([profile.paperMm, Math.max(sliceHeight, profile.paperMm + 1)]);
        pdf.addImage(slice.toDataURL('image/png'), 'PNG', profile.leftMm + profile.offsetMm, 0, profile.contentMm, sliceHeight);
    }
    return pdf.output('blob');
}
export function openPrintFile(file: Blob, ready: () => void) {
    const url = URL.createObjectURL(file);
    const popup = window.open(url, '_blank');
    if (!popup) { URL.revokeObjectURL(url); ready(); throw new Error('Izinkan popup browser untuk membuka PDF cetak.'); }
    const cleanup = () => { ready(); URL.revokeObjectURL(url); };
    popup.addEventListener('afterprint', cleanup, {once: true});
    window.setTimeout(() => {
        try { if (!popup.closed) { popup.focus(); popup.print(); } } finally { ready(); }
    }, 900);
    window.setTimeout(cleanup, 30_000);
}
export function printCalibration(profile: PrintProfile) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(profile.contentMm * 96 / 25.4 * 2); canvas.height = 600;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'white'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'black'; ctx.strokeRect(2, 2, canvas.width - 4, 596);
    ctx.fillStyle = 'black'; ctx.font = `${20 * profile.fontScale}px monospace`;
    ['BengkelPro - UJI KALIBRASI', `Area isi: ${profile.contentMm} mm`, 'Ukur garis 20 mm di bawah.', 'Nama barang panjang:', ...Array(4).fill('SPAREPART-PANJANG-1234567890')].forEach((text, i) => {
        // Wrap sample text to the calibrated content area.
        const chunks = text.match(new RegExp(`.{1,${Math.max(1, Math.floor(canvas.width / (12 * profile.fontScale)))}}`, 'g')) || [];
        chunks.forEach((chunk, j) => ctx.fillText(chunk, 8, 35 + i * 55 + j * 22));
    });
    ctx.beginPath(); ctx.moveTo(8, 560); ctx.lineTo(8 + 20 * 96 / 25.4 * 2, 560); ctx.stroke();
    openPrintFile(calibratedPdf(canvas, profile), () => {});
}
