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

  const isSale = service.receiptType === 'SALE' || service.serviceType === 'Retail';
  const receiptHeader = service.receiptHeaderSnapshot || (isSale ? settings.saleReceiptHeader : settings.serviceReceiptHeader) || settings.receiptHeader || (isSale ? 'NOTA PEMBELIAN BARANG' : 'NOTA TRANSAKSI SERVIS');
  const receiptFooter = service.receiptFooterSnapshot || (isSale ? settings.saleReceiptFooter : settings.serviceReceiptFooter) || settings.footerNote;
  const serviceWarrantyDays = service.serviceWarrantyDurationDays || 0;
  const serviceWarrantyTerms = service.serviceWarrantyTermsSnapshot || settings.serviceWarrantyTerms || settings.warrantyTerms;

  const serviceItems = service.serviceItems?.length
    ? service.serviceItems
    : !isSale
      ? [{ name: 'Jasa Mekanik', price: service.laborFee || 0 }]
      : [];
  const productWarrantyItems = service.partsUsed.filter(
    item => item.hasProductWarranty && (item.warrantyDurationDays || 0) > 0
  );
  const invoiceNumber = `INV-${service.id.slice(0, 8).toUpperCase()}`;
  const invoiceDate = format(new Date(service.createdAt), 'dd MMM yyyy • HH:mm');

  const buildPrintMarkup = () => {
    const itemRows = [
      ...serviceItems.map(item => ({
        title: item.name,
        detail: 'Jasa Servis',
        amount: rupiah(item.price || 0)
      })),
      ...service.partsUsed.map(item => ({
        title: item.name || 'Sparepart',
        detail: `${item.quantity || 1} pcs x ${rupiah(item.priceAtTime || 0)}`,
        amount: rupiah((item.quantity || 1) * (item.priceAtTime || 0))
      }))
    ].map(item => `
      <tr>
        <td><strong>${escapeXml(item.title)}</strong><br /><small>${escapeXml(item.detail)}</small></td>
        <td class="right"><strong>${escapeXml(item.amount)}</strong></td>
      </tr>
    `).join('');

    const optionalMeta = [
      settings.showCustomerPhoneOnReceipt && service.customerPhone
        ? `<div><span>Telepon:</span><b>${escapeXml(service.customerPhone)}</b></div>` : '',
      settings.showOdometerOnReceipt && service.kilometers > 0
        ? `<div><span>Kilometer:</span><b>${escapeXml(service.kilometers.toLocaleString('id-ID'))} KM</b></div>` : '',
      settings.showMechanicOnReceipt && service.mechanicName
        ? `<div><span>Mekanik:</span><b>${escapeXml(service.mechanicName)}</b></div>` : ''
    ].join('');

    return `<!doctype html>
      <html><head><meta charset="utf-8"><title>Nota ${escapeXml(invoiceNumber)}</title>
      <style>
        @page { size: ${paperWidth} auto; margin: 0; }
        html, body { margin: 0; padding: 0; width: ${paperWidth}; background: #fff; }
        body { font-family: Arial, Helvetica, sans-serif; color: #000; }
        .receipt { width: ${paperWidth}; padding: 4mm; box-sizing: border-box; background: #fff; }
        .accent { height: 2px; background: #000; margin: -4mm -4mm 4mm; }
        .center { text-align: center; } .title { font-size: 14px; font-weight: 800; margin: 0; text-transform: uppercase; }
        .sub { font-size: 8px; font-weight: 700; margin: 3px 0; } .muted { font-size: 8px; margin: 3px 0; }
        .header-label { display: inline-block; border: 1px solid #000; padding: 2px 5px; font-size: 8px; font-weight: 700; margin-top: 5px; }
        .dash { border-top: 1px dashed #000; margin: 9px 0; }
        .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 8px; } .meta div { min-width: 0; }
        .meta span { display: block; font-size: 7px; margin-bottom: 2px; } .meta b { font-size: 8px; word-break: break-word; }
        .right { text-align: right; } table { width: 100%; border-collapse: collapse; font-size: 8px; } td { vertical-align: top; padding: 4px 0; }
        td:first-child { padding-right: 5px; } td strong { font-size: 8px; } small { font-size: 7px; }
        .discount { display: flex; justify-content: space-between; font-size: 8px; padding: 5px 0; border-top: 1px dashed #000; }
        .total { display: flex; justify-content: space-between; align-items: center; border: 1px solid #000; padding: 7px; margin-top: 8px; }
        .total small { display: block; font-size: 7px; font-weight: 700; } .total b { font-size: 13px; }
        .box { border: 1px solid #000; padding: 6px; margin-top: 8px; font-size: 8px; line-height: 1.4; } .box strong { font-size: 8px; }
        .footer { text-align: center; margin-top: 10px; font-size: 8px; line-height: 1.4; } .footer strong { font-size: 8px; }
      </style></head>
      <body><main class="receipt">
        <div class="accent"></div>
        <header class="center">
          <h1 class="title">${escapeXml(settings.name || 'NAMA BENGKEL')}</h1>
          <p class="sub">${escapeXml(settings.slogan || '')}</p>
          ${settings.address ? `<p class="muted">${escapeXml(settings.address)}</p>` : ''}
          ${settings.phone ? `<p class="sub">Telp/WA: ${escapeXml(settings.phone)}</p>` : ''}
          ${receiptHeader ? `<span class="header-label">${escapeXml(receiptHeader)}</span>` : ''}
        </header>
        <div class="dash"></div>
        <section class="meta">
          <div><span>No. Nota:</span><b>${escapeXml(invoiceNumber)}</b></div>
          <div class="right"><span>Tanggal:</span><b>${escapeXml(invoiceDate)}</b></div>
          <div><span>Pelanggan:</span><b>${escapeXml(service.customerName)}</b></div>
          <div class="right"><span>Kendaraan:</span><b>${escapeXml(service.vehiclePlate)}</b><br /><small>${escapeXml(service.vehicleModel)}</small></div>
          ${optionalMeta}
        </section>
        <div class="dash"></div>
        <table><tbody>${itemRows}</tbody></table>
        ${(service.discountAmount || 0) > 0 ? `<div class="discount"><b>${escapeXml(service.discountReason || 'Diskon Transaksi')}</b><b>- ${escapeXml(rupiah(service.discountAmount))}</b></div>` : ''}
        <div class="total"><div><small>TOTAL PEMBAYARAN</small><small>${service.paymentStatus === 'Paid' ? 'LUNAS' : 'BELUM LUNAS'}</small></div><b>${escapeXml(rupiah(service.totalAmount))}</b></div>
        ${settings.showWarrantyOnReceipt && !isSale && serviceWarrantyDays > 0 ? `<div class="box"><strong>KETENTUAN GARANSI SERVIS</strong><br />${escapeXml(`${serviceWarrantyTerms} (${serviceWarrantyDays} hari)`)}</div>` : ''}
        ${productWarrantyItems.length ? `<div class="box"><strong>GARANSI PRODUK / SPAREPART</strong><br />${productWarrantyItems.map(item => `${escapeXml(item.name)} — ${escapeXml(item.warrantyDurationDays)} hari`).join('<br />')}</div>` : ''}
        ${settings.receiptContactHelp ? `<p class="footer">☎ ${escapeXml(settings.receiptContactHelp)}</p>` : ''}
        <footer class="footer"><strong>${escapeXml(settings.name || 'BENGKEL KITA')} • TERIMA KASIH</strong><br />${escapeXml(receiptFooter || '')}</footer>
      </main></body></html>`;
  };

  const handlePrint = () => {
    if (isPrinting) return;
    const printWindow = window.open('', '_blank', 'width=480,height=720');
    if (!printWindow) {
      alert('Popup cetak diblokir browser. Izinkan popup untuk aplikasi ini, lalu coba lagi.');
      return;
    }

    setIsPrinting(true);
    // HTML cetak sengaja mandiri, tanpa stylesheet aplikasi: menghindari aturan
    // @media print global yang sebelumnya membuat halaman preview menjadi putih kosong.
    printWindow.document.open();
    printWindow.document.write(buildPrintMarkup());
    printWindow.document.close();

    const cleanup = () => {
      setIsPrinting(false);
      printWindow.close();
    };
    printWindow.addEventListener('afterprint', cleanup, { once: true });
    window.setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  };

  const renderReceiptPreview = async () => {
    const source = receiptRef.current;
    if (!source) throw new Error('Preview nota belum tersedia.');

    const originalStyle = {
      height: source.style.height,
      maxHeight: source.style.maxHeight,
      overflow: source.style.overflow,
      overflowY: source.style.overflowY,
      flex: source.style.flex
    };

    try {
      // Render seluruh isi preview, termasuk bagian yang berada di luar area scroll.
      source.style.height = 'auto';
      source.style.maxHeight = 'none';
      source.style.overflow = 'visible';
      source.style.overflowY = 'visible';
      source.style.flex = 'none';
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

      const width = Math.ceil(source.getBoundingClientRect().width);
      const height = Math.ceil(source.scrollHeight);
      if (!width || !height) throw new Error('Ukuran preview nota tidak valid.');

      const clone = source.cloneNode(true) as HTMLElement;

      const copyComputedStyles = (from: Element, to: Element) => {
        const styles = getComputedStyle(from);
        let inlineStyle = '';
        for (let index = 0; index < styles.length; index += 1) {
          const property = styles[index];
          inlineStyle += `${property}:${styles.getPropertyValue(property)};`;
        }
        to.setAttribute('style', inlineStyle);
        Array.from(from.children).forEach((child, index) => {
          if (to.children[index]) copyComputedStyles(child, to.children[index]);
        });
      };
      copyComputedStyles(source, clone);
      clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
      clone.style.width = `${width}px`;
      clone.style.height = `${height}px`;
      clone.style.maxHeight = 'none';
      clone.style.overflow = 'visible';

      const markup = new XMLSerializer().serializeToString(clone);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><foreignObject width="100%" height="100%">${markup}</foreignObject></svg>`;
      const svgUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));

      try {
        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
          const value = new Image();
          value.onload = () => resolve(value);
          value.onerror = () => reject(new Error('Preview tidak dapat dirender menjadi PDF.'));
          value.src = svgUrl;
        });
        const scale = 2;
        const canvas = document.createElement('canvas');
        canvas.width = width * scale;
        canvas.height = height * scale;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas tidak tersedia pada browser ini.');
        context.scale(scale, scale);
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        return canvas;
      } finally {
        URL.revokeObjectURL(svgUrl);
      }
    } finally {
      source.style.height = originalStyle.height;
      source.style.maxHeight = originalStyle.maxHeight;
      source.style.overflow = originalStyle.overflow;
      source.style.overflowY = originalStyle.overflowY;
      source.style.flex = originalStyle.flex;
    }
  };

  const createPdfFile = (canvas: HTMLCanvasElement) => {
    const imageData = canvas.toDataURL('image/jpeg', 0.95).split(',')[1];
    const binary = atob(imageData);
    const jpeg = Uint8Array.from(binary, char => char.charCodeAt(0));
    const encoder = new TextEncoder();
    const chunks: Uint8Array[] = [];
    const offsets: number[] = [];
    let position = 0;
    const add = (value: string | Uint8Array) => {
      const bytes = typeof value === 'string' ? encoder.encode(value) : value;
      chunks.push(bytes);
      position += bytes.length;
    };
    const pageWidth = 320;
    const pageHeight = Math.max(180, Number((canvas.height / canvas.width * pageWidth).toFixed(2)));
    const addObject = (id: number, value: string | Uint8Array, image = false) => {
      offsets[id] = position;
      add(`${id} 0 obj\n`);
      if (image) {
        add(`<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
        add(jpeg);
        add('\nendstream\n');
      } else {
        add(value);
      }
      add('endobj\n');
    };

    add('%PDF-1.4\n');
    addObject(1, '<< /Type /Catalog /Pages 2 0 R >>\n');
    addObject(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n');
    addObject(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\n`);
    addObject(4, jpeg, true);
    const content = `q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im0 Do\nQ\n`;
    addObject(5, `<< /Length ${encoder.encode(content).length} >>\nstream\n${content}endstream\n`);
    const xrefPosition = position;
    add('xref\n0 6\n0000000000 65535 f \n');
    for (let id = 1; id <= 5; id += 1) add(`${String(offsets[id]).padStart(10, '0')} 00000 n \n`);
    add(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefPosition}\n%%EOF`);

    return new File([new Blob(chunks, { type: 'application/pdf' })], `nota-${invoiceNumber}.pdf`, { type: 'application/pdf' });
  };

  const handleShareWhatsApp = async () => {
    if (isSharing) return;
    setIsSharing(true);
    try {
      const canvas = await renderReceiptPreview();
      const file = createPdfFile(canvas);
      const shareData = {
        title: `Nota ${settings.name}`,
        text: `Nota ${invoiceNumber} • Total ${rupiah(service.totalAmount)}`,
        files: [file]
      };

      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share(shareData);
      } else {
        // Desktop browser mengunduh PDF yang sama agar dapat dilampirkan manual ke WhatsApp.
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
        window.open(`https://wa.me/?text=${encodeURIComponent(`Nota ${invoiceNumber} • Total ${rupiah(service.totalAmount)}. PDF nota telah diunduh, silakan lampirkan ke WhatsApp.`)}`, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error(error);
      alert('PDF nota belum dapat dibuat. Coba ulangi dari browser Chrome/Edge versi terbaru.');
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
            {receiptHeader && <div className="pt-2"><span className="text-[9px] font-black uppercase bg-slate-100 px-2.5 py-0.5 rounded text-slate-700">{receiptHeader}</span></div>}
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
            {(service.discountAmount || 0) > 0 && <div className="flex justify-between items-start pt-2 text-emerald-700"><div><p className="font-bold">{service.discountReason || 'Diskon Transaksi'}</p><p className="text-[9px]">Potongan harga</p></div><span className="font-bold">- {rupiah(service.discountAmount)}</span></div>}
          </div>

          <div className="receipt-total bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex justify-between items-center">
            <div><span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Pembayaran</span><span className="text-[10px] font-black text-emerald-600 uppercase">{service.paymentStatus === 'Paid' ? 'Lunas' : 'Belum Lunas'}</span></div>
            <span className="text-lg font-black text-blue-600 tracking-tight">{rupiah(service.totalAmount)}</span>
          </div>

          {settings.showWarrantyOnReceipt && !isSale && serviceWarrantyDays > 0 && <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl space-y-1"><div className="flex items-center gap-1.5 text-blue-900 text-[10px] font-black uppercase tracking-wider"><ShieldCheck className="w-3.5 h-3.5 text-blue-600" /><span>Ketentuan Garansi Servis:</span></div><p className="text-[10px] text-blue-800 leading-relaxed font-medium">{settings.warrantyTerms}</p></div>}

          {productWarrantyItems.length > 0 && <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl space-y-1"><div className="flex items-center gap-1.5 text-emerald-900 text-[10px] font-black uppercase tracking-wider"><ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /><span>Garansi Produk / Sparepart</span></div>{productWarrantyItems.map((item, index) => <p key={`${item.partId}-${index}`} className="text-[10px] text-emerald-800"><b>{item.name}</b> — {item.warrantyDurationDays} hari{item.warrantyExpiresAt ? `, sampai ${format(new Date(item.warrantyExpiresAt), 'dd MMM yyyy')}` : ''}</p>)}</div>}

          {settings.receiptContactHelp && <div className="text-center text-[10px] text-slate-600 font-bold bg-slate-50 p-2 rounded-lg">📞 {settings.receiptContactHelp}</div>}
          <div className="text-center space-y-1 pt-2"><p className="text-[10px] font-black uppercase tracking-wider text-slate-700">{settings.name || 'BENGKEL KITA'} • TERIMA KASIH</p><p className="text-[9px] text-slate-400 font-medium leading-normal max-w-[280px] mx-auto italic">"{receiptFooter}"</p></div>
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
