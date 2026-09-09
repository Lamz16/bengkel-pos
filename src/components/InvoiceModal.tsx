import React from 'react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { FileText, X, ShieldCheck, Share2, Printer } from 'lucide-react';
import { WorkshopService, CompanySettings } from '../types';

interface InvoiceModalProps {
  service: WorkshopService | undefined;
  settings: CompanySettings;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ service, settings, onClose }) => {
  if (!service) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 no-print">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[95vh] printable-area-container"
      >
        {/* Header - Non printable */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 no-print">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" /> Nota Digital
          </h2>
          <button onClick={onClose} aria-label="Tutup" className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Invoice Body */}
        <div className="flex-1 overflow-y-auto p-8 sm:p-10 font-sans bg-white printable-area space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black text-blue-600 tracking-tighter uppercase italic leading-none mb-1">{settings.name}</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{settings.slogan}</p>
              {settings.address && <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{settings.address}</p>}
              {settings.phone && <p className="text-[8px] font-bold text-slate-400 uppercase">Telp: {settings.phone}</p>}
              {settings.receiptHeader && (
                <div className="pt-2">
                  <span className="px-2.5 py-0.5 bg-slate-100 rounded text-[9px] font-black uppercase text-slate-700 inline-block">
                    {settings.receiptHeader}
                  </span>
                </div>
              )}
            </div>
            <div className="text-right">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">INV#{service.id.slice(0, 8)}</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase">{format(new Date(service.createdAt), 'dd MMM yyyy • HH:mm')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100 border-dashed">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Pelanggan</p>
              <div className="flex flex-col gap-0.5">
                <p className="text-xs font-black text-slate-900 uppercase">{service.customerName}</p>
                {settings.showCustomerPhoneOnReceipt && service.customerPhone && (
                  <p className="text-[10px] text-slate-500 font-bold">{service.customerPhone}</p>
                )}
                <p className="px-2 py-0.5 bg-slate-100 rounded-lg text-[10px] font-black text-slate-600 uppercase w-fit mt-1">{service.vehiclePlate}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase">{service.vehicleModel}</p>
                {settings.showOdometerOnReceipt && service.kilometers && (
                  <p className="text-[9px] font-bold text-slate-400 mt-0.5">KM: {service.kilometers.toLocaleString()} km</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Rincian Servis</p>
              <div className="flex flex-col gap-1 items-end">
                <p className="text-xs font-black text-slate-900 uppercase">{service.serviceType}</p>
                <p className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${
                  service.status === 'Done' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  Status: {service.status}
                </p>
                {settings.showMechanicOnReceipt && service.mechanicName && (
                  <div className="mt-1 text-right">
                    <span className="text-[9px] text-slate-400 block uppercase font-bold">Mekanik Pelaksana:</span>
                    <span className="text-xs font-black text-blue-700 uppercase">{service.mechanicName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">
              <span>Rincian Pekerjaan</span>
              <span>Subtotal</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex-1 pr-6">
                  <p className="text-xs font-black text-slate-900 uppercase leading-none mb-1">Jasa Mekanik</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Biaya Penanganan & Analisis</p>
                </div>
                <span className="text-xs font-black text-slate-900 tracking-tight">Rp {(service.laborFee || 0).toLocaleString()}</span>
              </div>
              {service.partsUsed.map((p, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <div className="flex-1 pr-6">
                    <p className="text-xs font-black text-slate-900 uppercase leading-none mb-1">{p.name || 'Sparepart'}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Jumlah: {p.quantity || 1} • @Rp {(p.priceAtTime || 0).toLocaleString()}</p>
                  </div>
                  <span className="text-xs font-black text-slate-900 tracking-tight">Rp {((p.priceAtTime || 0) * (p.quantity || 1)).toLocaleString()}</span>
                </div>
              ))}

              {service.discountAmount !== undefined && service.discountAmount > 0 && (
                <div className="flex justify-between items-start pt-2 border-t border-emerald-100 bg-emerald-50/50 p-2.5 rounded-xl">
                  <div className="flex-1 pr-6">
                    <p className="text-xs font-black text-emerald-800 uppercase leading-none mb-1">
                      {service.discountReason || 'Potongan Promo Pelanggan'}
                    </p>
                    <p className="text-[9px] text-emerald-600 font-bold uppercase">Diskon Transaksi Diberikan</p>
                  </div>
                  <span className="text-xs font-black text-emerald-700 tracking-tight">
                    - Rp {service.discountAmount.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-50 p-5 rounded-[24px] border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16" />
            <div className="relative z-10 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Bayar</p>
                <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-tight">Lunas & Selesai</p>
              </div>
              <p className="text-3xl font-black text-blue-600 tracking-tighter">Rp {(service.totalAmount || 0).toLocaleString()}</p>
            </div>
          </div>

          {/* Garansi Servis */}
          {settings.showWarrantyOnReceipt && settings.warrantyTerms && (
            <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl space-y-1">
              <div className="flex items-center gap-1.5 text-blue-900 text-[10px] font-black uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Ketentuan Garansi Servis</span>
              </div>
              <p className="text-[9px] text-blue-800 leading-relaxed font-medium">
                {settings.warrantyTerms}
              </p>
            </div>
          )}

          {settings.receiptContactHelp && (
            <div className="text-center text-[10px] text-slate-600 font-bold bg-slate-50 p-2 rounded-xl border border-slate-100">
              📞 {settings.receiptContactHelp}
            </div>
          )}

          <div className="text-center space-y-2 pt-2 opacity-80">
            <div className="w-12 h-0.5 bg-slate-200 mx-auto" />
            <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest italic">{settings.name} • Terima Kasih</p>
            <p className="text-[8px] font-bold text-slate-400 max-w-[260px] mx-auto uppercase tracking-tight">{settings.footerNote}</p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-slate-100 bg-white grid grid-cols-2 gap-4 no-print">
          <button 
            className="h-14 bg-slate-50 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors border border-slate-100"
          >
            <Share2 className="w-4 h-4" /> Share WA
          </button>
          <button 
            onClick={handlePrint}
            className="h-14 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-100 hover:bg-blue-700 transition-colors"
          >
            <Printer className="w-4 h-4" /> Cetak Nota
          </button>
        </div>
      </motion.div>
    </div>
  );
};
