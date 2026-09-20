import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { FileText, X, ShieldCheck, Share2, Printer } from 'lucide-react';
import { WorkshopService, CompanySettings } from '../types';

interface InvoiceModalProps {
  service: WorkshopService | undefined;
  settings: CompanySettings;
  onClose: () => void;
}

const rupiah = (amount: number) => `Rp ${(amount || 0).toLocaleString('id-ID')}`;
const escapeXml = (value: string | number | undefined) =>
  String(value ?? '').replace(/[<>&'"]/g, char => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;'
  }[char] ?? char));

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ service, settings, onClose }) => {
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('80mm');
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!service) return null;

  const serviceItems = service.serviceItems?.length
    ? service.serviceItems
    : service.serviceType !== 'Retail'
      ? [{ name: 'Jasa Mekanik', price: service.laborFee || 0 }]
      : [];
  const productWarrantyItems = service.partsUsed.filter(
    item => item.hasProductWarranty && (item.warrantyDurationDays || 0) > 0
  );
  const invoiceNumber = `INV-${service.id.slice(0, 8).toUpperCase()}`;
  const invoiceDate = format(new Date(service.createdAt), 'dd MMM yyyy • HH:mm');

  const handlePrint = () => {
    const receipt = receiptRef.current;
    if (!receipt || isPrinting) return;

    const printWindow = window.open('', '_blank', 'width=480,height=720');
    if (!printWindow) {
      alert('Popup cetak diblokir browser. Izinkan popup untuk aplikasi ini, lalu coba lagi.');
      return;
    }

    setIsPrinting(true);

    // Jendela print adalah dokumen baru, jadi stylesheet Vite/Tailwind wajib
    // disalin agar struktur grid, ukuran teks, spacing, dan warna preview tetap terbaca.
    const appStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(element => element.outerHTML)
      .join('\n');
    const printStyle = `
      <style>
        @page { size: ${paperWidth} auto; margin: 0; }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; background: #fff !important; }
        body { width: ${paperWidth}; background: #fff !important; }
        .printable-area {
          width: ${paperWidth} !important; min-height: 0 !important; height: auto !important;
          padding: 4mm !important; overflow: visible !important; background: #fff !important;
        }

        /* Pertahankan layout preview, tetapi jadikan semua output aman untuk thermal B/W. */
        .printable-area, .printable-area * {
          color: #000 !important; text-shadow: none !important; box-shadow: none !important;
        }
        .printable-area [class*="bg-"] { background-color: #fff !important; }
        .printable-area [class*="border-"] { border-color: #000 !important; }
        .printable-area .bg-gradient-to-r { background: #000 !important; }
        .printable-area img { filter: grayscale(1) contrast(2); }
      </style>`;

    printWindow.document.open();
    printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Nota ${invoiceNumber}</title>${appStyles}${printStyle}</head><body>${receipt.outerHTML}</body></html>`);
    printWindow.document.close();

    const cleanup = () => {
      setIsPrinting(false);
      printWindow.close();
    };
    printWindow.addEventListener('afterprint', cleanup, { once: true });
    // Beri waktu stylesheet hasil bundling dimuat di dokumen baru sebelum dialog cetak muncul.
    window.setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 800);
  };

  const buildShareImage = () => {
    const lineItems = [
      ...serviceItems.map(item => ({
        title: item.name,
        subtitle: 'Jasa Servis',
        amount: rupiah(item.price || 0)
      })),
      ...service.partsUsed.map(item => ({
        title: item.name || 'Sparepart',
        subtitle: `${item.quantity || 1} pcs x ${rupiah(item.priceAtTime || 0)}`,
        amount: rupiah((item.quantity || 1) * (item.priceAtTime || 0))
      }))
    ];
    const itemRows = lineItems.map((item, index) => {
      const y = 312 + index * 50;
      return `<text x="42" y="${y}" class="title">${escapeXml(item.title)}</text>
        <text x="42" y="${y + 16}" class="muted">${escapeXml(item.subtitle)}</text>
        <text x="558" y="${y}" class="amount" text-anchor="end">${escapeXml(item.amount)}</text>`;
    }).join('');
    const discountY = 312 + lineItems.length * 50;
    const totalY = discountY + (service.discountAmount && service.discountAmount > 0 ? 74 : 38);
    const footerY = totalY + 106;
    const height = footerY + 135;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="${height}" viewBox="0 0 600 ${height}">
      <style>
        .brand{font:800 23px Arial,sans-serif;fill:#0f172a}.tag{font:700 10px Arial,sans-serif;fill:#64748b}
        .meta{font:700 11px Arial,sans-serif;fill:#475569}.title{font:700 13px Arial,sans-serif;fill:#0f172a}
        .muted{font:500 10px Arial,sans-serif;fill:#64748b}.amount{font:700 13px Arial,sans-serif;fill:#0f172a}
        .total-label{font:700 10px Arial,sans-serif;fill:#64748b}.total{font:800 23px Arial,sans-serif;fill:#2563eb}
      </style>
      <rect width="600" height="${height}" fill="#fff"/><rect width="600" height="7" fill="#2563eb"/>
      <text x="300" y="48" class="brand" text-anchor="middle">${escapeXml(settings.name || 'NAMA BENGKEL')}</text>
      <text x="300" y="66" class="tag" text-anchor="middle">${escapeXml(settings.slogan || '')}</text>
      <text x="300" y="83" class="muted" text-anchor="middle">${escapeXml(settings.address || '')}</text>
      <text x="300" y="100" class="meta" text-anchor="middle">${settings.phone ? `Telp/WA: ${escapeXml(settings.phone)}` : ''}</text>
      ${settings.receiptHeader ? `<rect x="185" y="112" width="230" height="22" rx="7" fill="#f1f5f9"/><text x="300" y="127" class="meta" text-anchor="middle">${escapeXml(settings.receiptHeader)}</text>` : ''}
      <line x1="36" y1="148" x2="564" y2="148" stroke="#cbd5e1" stroke-dasharray="5 4"/>
      <text x="42" y="171" class="muted">No. Nota</text><text x="42" y="187" class="meta">${escapeXml(invoiceNumber)}</text>
      <text x="558" y="171" class="muted" text-anchor="end">Tanggal</text><text x="558" y="187" class="meta" text-anchor="end">${escapeXml(invoiceDate)}</text>
      <text x="42" y="214" class="muted">Pelanggan</text><text x="42" y="230" class="title">${escapeXml(service.customerName)}</text>
      ${settings.showCustomerPhoneOnReceipt && service.customerPhone ? `<text x="42" y="246" class="muted">${escapeXml(service.customerPhone)}</text>` : ''}
      <text x="558" y="214" class="muted" text-anchor="end">Kendaraan</text><text x="558" y="230" class="title" text-anchor="end">${escapeXml(service.vehiclePlate)}</text>
      <text x="558" y="246" class="muted" text-anchor="end">${escapeXml(service.vehicleModel)}</text>
      ${settings.showOdometerOnReceipt && service.kilometers ? `<text x="42" y="269" class="meta">KM: ${escapeXml(service.kilometers.toLocaleString('id-ID'))} KM</text>` : ''}
      ${settings.showMechanicOnReceipt && service.mechanicName ? `<text x="558" y="269" class="meta" text-anchor="end">Mekanik: ${escapeXml(service.mechanicName)}</text>` : ''}
      <line x1="36" y1="285" x2="564" y2="285" stroke="#cbd5e1" stroke-dasharray="5 4"/>
      ${itemRows}
      ${service.discountAmount && service.discountAmount > 0 ? `<text x="42" y="${discountY + 18}" class="title" fill="#047857">${escapeXml(service.discountReason || 'Diskon')}</text><text x="558" y="${discountY + 18}" class="amount" fill="#047857" text-anchor="end">- ${escapeXml(rupiah(service.discountAmount))}</text>` : ''}
      <rect x="36" y="${totalY}" width="528" height="62" rx="12" fill="#f8fafc" stroke="#e2e8f0"/>
      <text x="54" y="${totalY + 26}" class="total-label">TOTAL PEMBAYARAN</text><text x="54" y="${totalY + 43}" class="meta">${service.paymentStatus === 'Paid' ? 'LUNAS' : 'BELUM LUNAS'}</text>
      <text x="546" y="${totalY + 39}" class="total" text-anchor="end">${escapeXml(rupiah(service.totalAmount))}</text>
      ${settings.showWarrantyOnReceipt && service.serviceType !== 'Retail' && settings.warrantyTerms ? `<rect x="36" y="${totalY + 76}" width="528" height="48" rx="10" fill="#eff6ff"/><text x="52" y="${totalY + 95}" class="meta">GARANSI SERVIS</text><text x="52" y="${totalY + 112}" class="muted">${escapeXml(settings.warrantyTerms)}</text>` : ''}
      <text x="300" y="${footerY}" class="title" text-anchor="middle">${escapeXml(settings.name || 'BENGKEL KITA')} • TERIMA KASIH</text>
      <text x="300" y="${footerY + 20}" class="muted" text-anchor="middle">${escapeXml(settings.footerNote || '')}</text>
      ${settings.receiptContactHelp ? `<text x="300" y="${footerY + 42}" class="meta" text-anchor="middle">☎ ${escapeXml(settings.receiptContactHelp)}</text>` : ''}
    </svg>`;
  };

  const handleShareWhatsApp = async () => {
    if (isSharing) return;
    setIsSharing(true);
    try {
      const svg = buildShareImage();
      const file = new File([svg], `nota-${invoiceNumber}.svg`, { type: 'image/svg+xml' });
      const shareData = {
        title: `Nota ${settings.name}`,
        text: `Nota ${invoiceNumber} • Total ${rupiah(service.totalAmount)}`,
        files: [file]
      };

      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share(shareData);
      } else {
        const text = encodeURIComponent(`Nota ${invoiceNumber}\n${settings.name}\nTotal: ${rupiah(service.totalAmount)}\n\nGambar nota berwarna dapat dibagikan dari perangkat mobile melalui tombol ini.`);
        window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        alert('Nota belum dapat dibagikan. Coba gunakan browser modern atau perangkat mobile.');
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 no-print">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[95vh]"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 no-print">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" /> Nota Digital
          </h2>
          <button onClick={onClose} aria-label="Tutup" className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Struktur ini disengaja sama dengan preview di SettingsView > subtab receipt. */}
        <div ref={receiptRef} className="printable-area flex-1 overflow-y-auto p-6 sm:p-8 font-sans bg-white text-slate-800 space-y-4">
          <div className="h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 -mx-6 sm:-mx-8 -mt-6 sm:-mt-8 mb-4" />

          <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-200 receipt-divider">
            <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">{settings.name || 'NAMA BENGKEL'}</h4>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{settings.slogan || 'Slogan Bengkel Anda'}</p>
            {settings.address && <p className="text-[9px] text-slate-400 font-medium leading-tight max-w-[240px] mx-auto">{settings.address}</p>}
            {settings.phone && <p className="text-[9px] font-bold text-blue-600">Telp/WA: {settings.phone}</p>}
            {settings.receiptHeader && <div className="pt-2"><span className="text-[9px] font-black uppercase bg-slate-100 px-2.5 py-0.5 rounded text-slate-700">{settings.receiptHeader}</span></div>}
          </div>

          <div className="grid grid-cols-2 text-[10px] gap-2 pb-3 border-b border-dashed border-slate-200 receipt-divider">
            <div><span className="text-slate-400 block font-bold">No. Nota:</span><span className="font-mono font-bold text-slate-800">{invoiceNumber}</span></div>
            <div className="text-right"><span className="text-slate-400 block font-bold">Tanggal:</span><span className="font-bold text-slate-800">{invoiceDate}</span></div>
            <div>
              <span className="text-slate-400 block font-bold">Pelanggan:</span>
              <span className="font-bold text-slate-900 uppercase">{service.customerName}</span>
              {settings.showCustomerPhoneOnReceipt && service.customerPhone && <span className="text-[9px] text-slate-500 block">{service.customerPhone}</span>}
            </div>
            <div className="text-right">
              <span className="text-slate-400 block font-bold">Kendaraan:</span>
              <span className="font-mono font-black text-slate-900 uppercase bg-slate-100 px-1.5 py-0.5 rounded">{service.vehiclePlate}</span>
              <span className="text-[9px] text-slate-500 block">{service.vehicleModel}</span>
            </div>
            {settings.showOdometerOnReceipt && service.kilometers > 0 && <div><span className="text-slate-400 block font-bold">Kilometer (KM):</span><span className="font-bold text-slate-800 font-mono">{service.kilometers.toLocaleString('id-ID')} KM</span></div>}
            {settings.showMechanicOnReceipt && service.mechanicName && <div className={settings.showOdometerOnReceipt && service.kilometers > 0 ? 'text-right' : 'col-span-2'}><span className="text-slate-400 block font-bold">Mekanik Penanggung Jawab:</span><span className="font-black text-blue-700">{service.mechanicName}</span></div>}
          </div>

          <div className="space-y-2 text-xs pb-3 border-b border-dashed border-slate-200 receipt-divider">
            {serviceItems.map((item, index) => <div key={`service-${index}`} className="flex justify-between items-start"><div><p className="font-bold text-slate-900">{item.name}</p><p className="text-[9px] text-slate-400">Jasa Servis</p></div><span className="font-bold text-slate-800">{rupiah(item.price || 0)}</span></div>)}
            {service.partsUsed.map((item, index) => <div key={`part-${index}`} className="flex justify-between items-start"><div><p className="font-bold text-slate-900">{item.name || 'Sparepart'}</p><p className="text-[9px] text-slate-400">{item.quantity || 1} pcs x {rupiah(item.priceAtTime || 0)}</p></div><span className="font-bold text-slate-800">{rupiah((item.quantity || 1) * (item.priceAtTime || 0))}</span></div>)}
            {service.discountAmount && service.discountAmount > 0 && <div className="flex justify-between items-start pt-2 text-emerald-700"><div><p className="font-bold">{service.discountReason || 'Diskon Transaksi'}</p><p className="text-[9px]">Potongan harga</p></div><span className="font-bold">- {rupiah(service.discountAmount)}</span></div>}
          </div>

          <div className="receipt-total bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex justify-between items-center">
            <div><span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Pembayaran</span><span className="text-[10px] font-black text-emerald-600 uppercase">{service.paymentStatus === 'Paid' ? 'Lunas' : 'Belum Lunas'}</span></div>
            <span className="text-lg font-black text-blue-600 tracking-tight">{rupiah(service.totalAmount)}</span>
          </div>

          {settings.showWarrantyOnReceipt && service.serviceType !== 'Retail' && settings.warrantyTerms && <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl space-y-1"><div className="flex items-center gap-1.5 text-blue-900 text-[10px] font-black uppercase tracking-wider"><ShieldCheck className="w-3.5 h-3.5 text-blue-600" /><span>Ketentuan Garansi Servis:</span></div><p className="text-[10px] text-blue-800 leading-relaxed font-medium">{settings.warrantyTerms}</p></div>}

          {productWarrantyItems.length > 0 && <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl space-y-1"><div className="flex items-center gap-1.5 text-emerald-900 text-[10px] font-black uppercase tracking-wider"><ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /><span>Garansi Produk / Sparepart</span></div>{productWarrantyItems.map((item, index) => <p key={`${item.partId}-${index}`} className="text-[10px] text-emerald-800"><b>{item.name}</b> — {item.warrantyDurationDays} hari{item.warrantyExpiresAt ? `, sampai ${format(new Date(item.warrantyExpiresAt), 'dd MMM yyyy')}` : ''}</p>)}</div>}

          {settings.receiptContactHelp && <div className="text-center text-[10px] text-slate-600 font-bold bg-slate-50 p-2 rounded-lg">📞 {settings.receiptContactHelp}</div>}
          <div className="text-center space-y-1 pt-2"><p className="text-[10px] font-black uppercase tracking-wider text-slate-700">{settings.name || 'BENGKEL KITA'} • TERIMA KASIH</p><p className="text-[9px] text-slate-400 font-medium leading-normal max-w-[280px] mx-auto italic">"{settings.footerNote}"</p></div>
          <div className="pt-2 text-center text-[10px] font-mono text-slate-300">- - - - - - - - - - - - - - - - - - - - - - -</div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-white grid grid-cols-1 sm:grid-cols-3 gap-4 no-print">
          <div className="space-y-2">
            <select value={paperWidth} onChange={e => setPaperWidth(e.target.value as '58mm' | '80mm')} aria-label="Lebar kertas printer thermal" className="w-full h-8 px-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600">
              <option value="58mm">Thermal 58 mm</option><option value="80mm">Thermal 80 mm</option>
            </select>
            <p className="text-[9px] text-slate-400 leading-tight">Cetak dipaksa hitam-putih agar aman untuk thermal printer.</p>
          </div>
          <button onClick={handleShareWhatsApp} disabled={isSharing} className="h-14 bg-slate-50 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors border border-slate-100 disabled:opacity-60">
            <Share2 className="w-4 h-4" /> {isSharing ? 'Menyiapkan…' : 'Share WA Berwarna'}
          </button>
          <button onClick={handlePrint} disabled={isPrinting} className="h-14 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-100 hover:bg-blue-700 transition-colors">
            <Printer className="w-4 h-4" /> {isPrinting ? 'Menyiapkan Cetak…' : 'Cetak Nota B/W'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
