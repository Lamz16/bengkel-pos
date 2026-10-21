import React, {useRef, useState} from 'react';
import {motion} from 'motion/react';
import {format} from 'date-fns';
import html2canvas from 'html2canvas-pro';
import {jsPDF} from 'jspdf';
import {Download, FileText, X, ShieldCheck, Share2, Printer} from 'lucide-react';
import {WorkshopService, CompanySettings} from '../types';
import {activeProfile, loadPreferences, savePreferences, defaults} from '../printing/profiles';
import {PrintProfileSettings} from '../printing/PrintProfileSettings';
import {calibratedPdf} from '../printing/layout';

interface InvoiceModalProps {
    service: WorkshopService | undefined;
    settings: CompanySettings;
    onClose: () => void;
}

const rupiah = (amount: number) => `Rp ${(amount || 0).toLocaleString('id-ID')}`;

const toWhatsAppNumber = (phone?: string) => {
    const digits = phone?.replace(/\D/g, '') || '';
    if (!digits) return undefined;

    const international = digits.startsWith('62')
        ? digits
        : digits.startsWith('0')
            ? `62${digits.slice(1)}`
            : digits.startsWith('8')
                ? `62${digits}`
                : undefined;

    return international && international.length >= 10 && international.length <= 15
        ? international
        : undefined;
};

export const InvoiceModal: React.FC<InvoiceModalProps> = ({service, settings, onClose}) => {
    const [printPreferences, setPrintPreferences] = useState(loadPreferences);
    const profile = activeProfile(printPreferences);
    const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('80mm');
    const [isPrinting, setIsPrinting] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const digitalReceiptRef = useRef<HTMLDivElement>(null);
    const thermalReceiptRef = useRef<HTMLDivElement>(null);

    if (!service) return null;

    const isSale = service.receiptType === 'SALE';
    const receiptHeader = service.receiptHeaderSnapshot || (isSale ? settings.saleReceiptHeader : settings.serviceReceiptHeader) || settings.receiptHeader;
    const receiptFooter = service.receiptFooterSnapshot || (isSale ? settings.saleReceiptFooter : settings.serviceReceiptFooter) || settings.footerNote || '';
    const serviceWarrantyDays = service.serviceWarrantyDurationDays || 0;
    const serviceWarrantyTerms = service.serviceWarrantyTermsSnapshot || '';
    // Before the split, a few sale rows stored their transaction warranty in the
    // service fields. Read it as a sale warranty only when no new sale snapshot exists.
    const legacySaleWarranty = isSale && !service.saleWarrantyEnabled && !service.saleWarrantyStartedAt && (service.saleWarrantyDurationDays || 0) > 0;
    const saleWarrantyDays = service.saleWarrantyDurationDays || (legacySaleWarranty ? service.serviceWarrantyDurationDays || 0 : 0);
    const saleWarrantyTerms = service.saleWarrantyTermsSnapshot || (legacySaleWarranty ? service.serviceWarrantyTermsSnapshot || '' : '');
    const saleWarrantyExpiresAt = service.saleWarrantyExpiresAt || (legacySaleWarranty ? service.serviceWarrantyExpiresAt : undefined);
    const hasServiceWarranty = !!service.serviceWarrantyEnabled || (!isSale && !service.serviceWarrantyStartedAt && serviceWarrantyDays > 0);

    const serviceItems = !isSale && service.serviceItems?.length
        ? service.serviceItems
        : !isSale && service.laborFee > 0 ? [{name: 'Jasa', price: service.laborFee}] : [];
    const productWarrantyItems = service.partsUsed.filter(
        item => item.hasProductWarranty && (item.warrantyDurationDays || 0) > 0
    );
    const invoiceNumber = service.invoiceNumber || `INV-${service.id.slice(0, 8).toUpperCase()}`;
    const invoiceDate = format(new Date(service.createdAt), 'dd MMM yyyy • HH:mm');
    const receiptWidth = paperWidth === '58mm' ? '219px' : '302px';
    const companyName = service.companyNameSnapshot || settings.name;
    const companyAddress = service.companyAddressSnapshot || settings.address;
    const companyPhone = service.companyPhoneSnapshot || settings.phone;
    const companySlogan = service.companySloganSnapshot || settings.slogan;
    const cashierName = service.createdByNameSnapshot || 'Tidak tercatat';
    const cashPayments = (service.payments || []).filter(payment => payment.paymentMethod === 'Cash');

    const handlePrint = async () => {
        if (isPrinting) return;
        setIsPrinting(true);

        try {
            const canvas = await captureReceipt(thermalReceiptRef.current);
            const file = profile ? calibratedPdf(canvas, profile) : createPdfFile(canvas, 'Struk');
            const url = URL.createObjectURL(file);
            const printWindow = window.open(url, '_blank');

            if (!printWindow) {
                URL.revokeObjectURL(url);
                throw new Error('Popup cetak diblokir browser.');
            }

            const cleanup = () => {
                setIsPrinting(false);
                URL.revokeObjectURL(url);
            };
            printWindow.addEventListener('afterprint', cleanup, {once: true});
            window.setTimeout(() => {
                printWindow.focus();
                printWindow.print();
            }, 900);
            // Fallback apabila browser tidak memancarkan afterprint dari viewer PDF.
            window.setTimeout(cleanup, 30_000);
        } catch (error) {
            console.error(error);
            setIsPrinting(false);
            alert('PDF nota belum dapat dibuat. Pastikan dependensi aplikasi sudah diperbarui, lalu coba lagi.');
        }
    };


    const captureReceipt = async (source: HTMLDivElement | null) => {
        if (!source) throw new Error('Preview nota belum tersedia.');

        const originalStyle = {
            height: source.style.height,
            maxHeight: source.style.maxHeight,
            overflow: source.style.overflow,
            overflowY: source.style.overflowY,
            flex: source.style.flex,
            width: source.style.width, maxWidth: source.style.maxWidth
        };

        try {
            // Ambil elemen preview yang sama persis, termasuk semua bagian yang perlu discroll.
            source.style.height = 'auto';
            source.style.maxHeight = 'none';
            source.style.overflow = 'visible';
            source.style.overflowY = 'visible';
            source.style.flex = 'none';
            await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

            return await html2canvas(source, {
                backgroundColor: '#ffffff',
                scale: 2,
                useCORS: true,
                logging: false,
                windowWidth: source.scrollWidth,
                windowHeight: source.scrollHeight
            });
        } finally {
            source.style.height = originalStyle.height;
            source.style.maxHeight = originalStyle.maxHeight;
            source.style.overflow = originalStyle.overflow;
            source.style.overflowY = originalStyle.overflowY;
            source.style.flex = originalStyle.flex;
            source.style.width = originalStyle.width;
            source.style.maxWidth = originalStyle.maxWidth;
        }
    };

    const createPdfFile = (canvas: HTMLCanvasElement, prefix = 'Nota') => {
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: [canvas.width, canvas.height],
            hotfixes: ['px_scaling'],
            compress: true
        });
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, canvas.width, canvas.height, undefined, 'FAST');
        return new File([pdf.output('blob')], `${prefix}-${invoiceNumber}.pdf`, {type: 'application/pdf'});
    };

    const downloadFile = (file: File) => {
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 2_000);
    };

    const handleDownloadPdf = async () => {
        try {
            downloadFile(createPdfFile(await captureReceipt(digitalReceiptRef.current)));
        } catch (error) {
            console.error(error);
            alert('PDF nota belum dapat dibuat.');
        }
    };

    const handleShareWhatsApp = async () => {
        if (isSharing) return;
        setIsSharing(true);
        try {
            const file = createPdfFile(await captureReceipt(digitalReceiptRef.current));
            // Download happens first on every platform; browsers cannot silently attach
            // a local file into WhatsApp Web for security reasons.
            downloadFile(file);
            const customerNumber = toWhatsAppNumber(service.customerPhone);
            if (!customerNumber) {
                alert('PDF nota telah diunduh, tetapi nomor WhatsApp pelanggan belum tersedia atau tidak valid.');
                return;
            }

            const customerName = service.customerName?.trim() || 'Pelanggan';
            const greeting = [
                `Halo ${customerName},`,
                `Terima kasih sudah mempercayakan ${isSale ? 'pembelian' : 'servis kendaraan'} Anda di ${companyName || settings.name}.`,
                `Berikut nota transaksi ${invoiceNumber} dengan total ${rupiah(service.totalAmount)}.`,
                'Terima kasih. 🙏🏻',
            ].join('\n\n');
            const chat = window.open(`https://wa.me/${customerNumber}?text=${encodeURIComponent(greeting)}`, '_blank', 'noopener,noreferrer');
            if (!chat) alert('PDF nota telah diunduh. Izinkan pop-up browser untuk membuka chat WhatsApp pelanggan.');
        } catch (error) {
            console.error(error);
            alert('PDF nota belum dapat dibuat. Coba ulangi dari browser Chrome/Edge versi terbaru.');
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 no-print">
            <motion.div
                initial={{opacity: 0, scale: 0.95, y: 20}}
                animate={{opacity: 1, scale: 1, y: 0}}
                className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[95vh]"
            >
                <div
                    className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 no-print">
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600"/> Nota Digital
                    </h2>
                    <button onClick={onClose} aria-label="Tutup"
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <X className="w-5 h-5 text-slate-400"/>
                    </button>
                </div>

                {/* Struktur ini disengaja sama dengan preview di SettingsView > subtab receipt. */}
                <div className="flex-1 overflow-y-auto bg-slate-100 p-4 sm:p-6">
                    <div ref={digitalReceiptRef}
                         className="receipt-light mx-auto w-full rounded-3xl border border-slate-200/90 bg-white p-6 font-sans text-slate-800 shadow-xl space-y-4 relative overflow-hidden">
                        <div className="h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 -mx-6 -mt-6 mb-4"/>

                        <div
                            className="text-center space-y-1 pb-3 border-b border-dashed border-slate-200 receipt-divider">
                            {companyName &&
                                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">{companyName}</h4>}
                            {companySlogan &&
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{companySlogan}</p>}
                            {companyAddress &&
                                <p className="text-[9px] text-slate-400 font-medium leading-tight max-w-[240px] mx-auto">{companyAddress}</p>}
                            {companyPhone &&
                                <p className="text-[9px] font-bold text-blue-600">Telp/WA: {companyPhone}</p>}
                            {receiptHeader && <div className="pt-2"><span
                                className="text-[9px] font-black uppercase text-slate-700">{receiptHeader}</span></div>}
                        </div>

                        <div
                            className="grid grid-cols-2 gap-2 pb-3 text-[10px] border-b border-dashed border-slate-200 receipt-divider">
                            <div><span className="block font-bold text-slate-400">No. Nota:</span><span
                                className="font-mono font-bold text-slate-800">{invoiceNumber}</span></div>
                            <div className="text-right"><span className="block font-bold text-slate-400">Tanggal:</span><span
                                className="font-bold text-slate-800">{invoiceDate}</span></div>
                            <div><span className="block font-bold text-slate-400">Pelanggan:</span><span
                                className="font-bold text-slate-900 uppercase">{service.customerName || 'Umum'}</span>{settings.showCustomerPhoneOnReceipt && service.customerPhone &&
                                <span className="block text-[9px] text-slate-500">{service.customerPhone}</span>}</div>
                            <div className="text-right"><span
                                className="block font-bold text-slate-400">Kasir:</span><span
                                className="font-bold text-slate-800">{cashierName}</span></div>
                            {!isSale && <div className="min-w-0"><span
                                className="block font-bold text-slate-400">Kendaraan:</span><span
                                className="font-mono font-black text-slate-900 uppercase">{service.vehiclePlate}</span><span
                                className="block break-words text-[9px] text-slate-500">{service.vehicleModel}</span>
                            </div>}
                            {!isSale && settings.showOdometerOnReceipt && service.kilometers > 0 &&
                                <div className="min-w-0 text-right"><span className="block font-bold text-slate-400">Kilometer (KM):</span><span
                                    className="font-mono font-bold text-slate-800">{service.kilometers.toLocaleString('id-ID')} KM</span>
                                </div>}
                            {!isSale && settings.showMechanicOnReceipt && service.mechanicName && <div
                                className={settings.showOdometerOnReceipt && service.kilometers > 0 ? 'text-right' : 'col-span-2'}>
                                <span className="block font-bold text-slate-400">Mekanik Penanggung Jawab:</span><span
                                className="font-black text-blue-700">{service.mechanicName}</span></div>}
                        </div>

                        <div className="space-y-2 text-xs pb-3 border-b border-dashed border-slate-200 receipt-divider">
                            {serviceItems.map((item, index) => <div key={`service-${index}`}
                                                                    className="flex items-start justify-between text-[10px]">
                                <div><p className="font-mono font-black text-slate-900">{item.name}</p><p
                                    className="text-[9px] text-slate-400">Jasa</p></div>
                                <span className="font-mono font-black text-slate-900">{rupiah(item.price || 0)}</span></div>)}
                            {service.partsUsed.map((item, index) => <div key={`part-${index}`}
                                                                         className="flex items-start justify-between text-[10px]">
                                <div><p className="font-mono font-black text-slate-900">{item.name || 'Sparepart'}</p><p
                                    className="text-[9px] text-slate-400">{item.quantity || 1} pcs
                                    x {rupiah(item.priceAtTime || 0)}</p></div>
                                <span
                                    className="font-mono font-black text-slate-900">{rupiah((item.quantity || 1) * (item.priceAtTime || 0))}</span>
                            </div>)}
                            {(service.discountAmount || 0) > 0 &&
                                <div className="flex justify-between items-start pt-2 text-emerald-700">
                                    <div><p className="font-bold">{service.discountReason || 'Diskon Transaksi'}</p><p
                                        className="text-[9px]">Potongan harga</p></div>
                                    <span className="font-mono font-black">- {rupiah(service.discountAmount)}</span></div>}
                        </div>

                        <div className="receipt-total py-2 flex justify-between items-center">
                            <div><span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Pembayaran</span><span
                                className="text-[10px] font-black text-emerald-600 uppercase">{service.paymentStatus === 'Paid' ? 'Lunas' : 'Belum Lunas'}</span>
                            </div>
                            <span
                                className="text-lg font-black text-blue-600 tracking-tight">{rupiah(service.totalAmount)}</span>
                        </div>

                        {cashPayments.map(payment => <div key={payment.id}
                                                          className="space-y-1 border-b border-dashed border-slate-200 py-2 text-[10px]">
                            <div className="flex justify-between">
                                <span>Total Tagihan</span><b className="font-mono font-black">{rupiah(service.totalAmount)}</b></div>
                            <div className="flex justify-between">
                                <span>Uang Diterima</span><b className="font-mono font-black">{rupiah(payment.cashReceived ?? payment.amount)}</b></div>
                            <div className="flex justify-between">
                                <span>Pembayaran Tercatat</span><b className="font-mono font-black">{rupiah(payment.amount)}</b></div>
                            {(payment.changeAmount || 0) > 0 && <div className="flex justify-between text-emerald-700">
                                <span>Kembalian</span><b className="font-mono font-black">{rupiah(payment.changeAmount || 0)}</b></div>}
                        </div>)}

                        {settings.showWarrantyOnReceipt && !isSale && hasServiceWarranty && serviceWarrantyDays > 0 &&
                            <div className="py-2 space-y-1">
                                <div
                                    className="flex items-center gap-1.5 text-blue-900 text-[10px] font-black uppercase tracking-wider">
                                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600"/><span>Garansi Jasa Servis</span>
                                </div>
                                <p className="text-[10px] text-blue-800 leading-relaxed font-medium">{serviceWarrantyDays} hari{service.serviceWarrantyExpiresAt ? ` · hingga ${format(new Date(service.serviceWarrantyExpiresAt), 'dd MMM yyyy')}` : ''}{serviceWarrantyTerms ? ` · ${serviceWarrantyTerms}` : ''}</p>
                            </div>}

                        {isSale && (service.saleWarrantyEnabled || legacySaleWarranty) && saleWarrantyDays > 0 &&
                            <div className="py-2 space-y-1">
                                <div
                                    className="flex items-center gap-1.5 text-blue-900 text-[10px] font-black uppercase tracking-wider">
                                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600"/><span>Garansi Transaksi</span>
                                </div>
                                <p className="text-[10px] text-blue-800 leading-relaxed font-medium">{saleWarrantyDays} hari{saleWarrantyExpiresAt ? ` · hingga ${format(new Date(saleWarrantyExpiresAt), 'dd MMM yyyy')}` : ''}{saleWarrantyTerms ? ` · ${saleWarrantyTerms}` : ''}</p>
                            </div>}

                        {productWarrantyItems.length > 0 && <div className="py-2 space-y-1">
                            <div
                                className="flex items-center gap-1.5 text-emerald-900 text-[10px] font-black uppercase tracking-wider">
                                <ShieldCheck
                                    className="w-3.5 h-3.5 text-emerald-700"/><span>Garansi Produk / Sparepart</span>
                            </div>
                            {productWarrantyItems.map((item, index) => <p key={`${item.partId}-${index}`}
                                                                          className="text-[10px] text-emerald-800">
                                <b>{item.name}</b> — {item.warrantyDurationDays} hari{item.warrantyExpiresAt ? `, sampai ${format(new Date(item.warrantyExpiresAt), 'dd MMM yyyy')}` : ''}
                            </p>)}</div>}

                        {receiptFooter.trim() && <div className="pt-2 text-center"><p
                            className="text-[9px] text-slate-400 font-medium leading-normal max-w-[280px] mx-auto italic">"{receiptFooter}"</p>
                        </div>}
                        <div className="pt-2 text-center text-[10px] font-mono text-slate-300">- - - - - - - - - - - - -
                            - - - - - - - - - -
                        </div>
                    </div>
                </div>

                <div className="px-6 py-2 text-xs"><label>Mode cetak B/W <select aria-label="Mode cetak B/W" value={printPreferences.mode} onChange={e => {
                    const next = {...printPreferences, mode: e.target.value as 'thermal' | 'pdf'};
                    setPrintPreferences(savePreferences(next) ? next : defaults());
                }}><option value="thermal">Printer thermal</option><option value="pdf">Browser / Save as PDF (bawaan)</option></select></label></div>
                <PrintProfileSettings value={printPreferences} onChange={setPrintPreferences}/>
                <div className="p-6 border-t border-slate-100 bg-white grid grid-cols-1 sm:grid-cols-4 gap-4 no-print">
                    <div className="space-y-2">
                        <select value={paperWidth} onChange={e => setPaperWidth(e.target.value as '58mm' | '80mm')}
                                aria-label="Lebar kertas printer thermal"
                                className="w-full h-8 px-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600">
                            <option value="58mm">Thermal 58 mm</option>
                            <option value="80mm">Thermal 80 mm</option>
                        </select>
                        <p className="text-[9px] text-slate-400 leading-tight">Cetak dipaksa hitam-putih agar aman untuk
                            thermal printer.</p>
                    </div>
                    <button onClick={handleDownloadPdf}
                            className="h-14 bg-slate-50 text-slate-600 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-slate-100 border border-slate-100">
                        <Download className="w-4 h-4"/> Download PDF
                    </button>
                    <button onClick={handleShareWhatsApp} disabled={isSharing}
                            className="h-14 bg-slate-50 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors border border-slate-100 disabled:opacity-60">
                        <Share2 className="w-4 h-4"/> {isSharing ? 'Menyiapkan…' : 'Chat WA + PDF'}
                    </button>
                    <button onClick={handlePrint} disabled={isPrinting}
                            className="h-14 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-100 hover:bg-blue-700 transition-colors">
                        <Printer className="w-4 h-4"/> {isPrinting ? 'Menyiapkan Cetak…' : 'Cetak Nota B/W'}
                    </button>
                </div>
            </motion.div>
            <div aria-hidden="true" style={{position: 'fixed', left: '-10000px', top: 0, width: receiptWidth}}>
                <div ref={thermalReceiptRef} className={`bg-white p-3 font-mono text-[10px] leading-snug text-black ${profile ? 'bw-calibrated' : ''}`}
                     style={profile ? {width: `${profile.contentMm}mm`, padding: 0, fontSize: `${10 * profile.fontScale}px`, overflowWrap: 'anywhere'} : {width: receiptWidth, overflowWrap: 'anywhere'}}>
                    {profile && <style>{`.bw-calibrated .text-xs {font-size: ${12 * profile.fontScale}px} .bw-calibrated .flex {flex-wrap: wrap; column-gap: 4px} .bw-calibrated .flex > * {max-width: 100%; overflow-wrap: anywhere}`}</style>}
                    <div className="border-b border-dashed border-black pb-2 text-center">{companyName &&
                        <b className="block text-xs uppercase">{companyName}</b>}{companyAddress &&
                        <span className="block">{companyAddress}</span>}{companyPhone &&
                        <span className="block">Telp/WA: {companyPhone}</span>}</div>
                    <div className="border-b border-dashed border-black py-2 space-y-0.5">
                        <div>{receiptHeader}</div>
                        <div>No: {invoiceNumber}</div>
                        <div>{invoiceDate}</div>
                        <div>Pelanggan: {service.customerName || 'Umum'}</div>
                        {!isSale && <>
                            <div>Kendaraan: {service.vehiclePlate} {service.vehicleModel}</div>
                            {settings.showOdometerOnReceipt && service.kilometers > 0 &&
                                <div>Odometer: {service.kilometers.toLocaleString('id-ID')} KM</div>}{settings.showMechanicOnReceipt && service.mechanicName &&
                            <div>Mekanik: {service.mechanicName}</div>}</>}
                        <div>Kasir: {cashierName}</div>
                    </div>
                    <div
                        className="border-b border-dashed border-black py-2 space-y-2">{serviceItems.map((item, index) =>
                        <div key={`thermal-service-${index}`}><b>{item.name}</b>
                            <div className="flex justify-between">
                                <span>Jasa</span><span>{rupiah(item.price || 0)}</span></div>
                        </div>)}{service.partsUsed.map((item, index) => <div key={`thermal-part-${index}`}>
                        <b>{item.name || 'Sparepart'}</b>
                        <div className="flex justify-between gap-2">
                            <span>{item.quantity || 1} x {rupiah(item.priceAtTime || 0)}</span><span>{rupiah((item.quantity || 1) * (item.priceAtTime || 0))}</span>
                        </div>
                    </div>)}{(service.discountAmount || 0) > 0 && <div className="flex justify-between">
                        <span>Diskon {service.discountReason || ''}</span><span>-{rupiah(service.discountAmount)}</span>
                    </div>}</div>
                    <div className="border-b border-dashed border-black py-2">
                        <div className="flex justify-between font-bold text-xs">
                            <span>TOTAL</span><span>{rupiah(service.totalAmount)}</span></div>
                        <div>Status: {service.paymentStatus === 'Paid' ? 'LUNAS' : service.paymentStatus === 'Partial' ? 'SEBAGIAN' : 'BELUM LUNAS'}{service.payments?.[0] ? ` · ${service.payments[0].paymentMethod}` : ''}</div>
                    </div>
                    {cashPayments.map(payment => <div key={`thermal-cash-${payment.id}`}
                                                      className="border-b border-dashed border-black py-2 space-y-0.5">
                        <div className="flex justify-between">
                            <span>UANG DIBAYARKAN</span><b>{rupiah(payment.cashReceived ?? payment.amount)}</b></div>
                        <div className="flex justify-between">
                            <span>PEMBAYARAN DICATAT</span><b>{rupiah(payment.amount)}</b></div>
                        {(payment.changeAmount || 0) > 0 && <div className="flex justify-between"><span>KEMBALIAN</span><b>{rupiah(payment.changeAmount || 0)}</b>
                        </div>}</div>)}
                    {settings.showWarrantyOnReceipt && ((hasServiceWarranty && serviceWarrantyDays > 0) || ((service.saleWarrantyEnabled || legacySaleWarranty) && saleWarrantyDays > 0)) &&
                        <div className="border-b border-dashed border-black py-2"><b>GARANSI</b>
                            <div>{isSale ? `${saleWarrantyDays} hari${saleWarrantyTerms ? ` · ${saleWarrantyTerms}` : ''}` : `${serviceWarrantyDays} hari${serviceWarrantyTerms ? ` · ${serviceWarrantyTerms}` : ''}`}</div>
                        </div>}
                    {productWarrantyItems.length > 0 && <div className="border-b border-dashed border-black py-2"><b>GARANSI
                        PRODUK</b>{productWarrantyItems.map((item, index) => <div
                        key={`thermal-warranty-${index}`}>{item.name}: {item.warrantyDurationDays} hari</div>)}</div>}
                    {receiptFooter.trim() && <div className="pt-2 text-center">{receiptFooter}</div>}
                </div>
            </div>
        </div>
    );
};
