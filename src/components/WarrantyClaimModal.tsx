import React, { useState, useEffect } from 'react';
import { WorkshopService, Mechanic } from '../types';
import { AlertTriangle, UserX, Wrench, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface WarrantyClaimModalProps {
  service: WorkshopService;
  mechanics: Mechanic[];
  onConfirm: (data: {
    serviceId: string;
    reason: string;
    isAbsent: boolean;
    deductionAmount: number;
  }) => void;
  onCancel: () => void;
}

export const WarrantyClaimModal: React.FC<WarrantyClaimModalProps> = ({
  service,
  mechanics,
  onConfirm,
  onCancel
}) => {
  const mechanic = mechanics.find(m => m.id === service.mechanicId);
  const basePenalty = mechanic ? mechanic.warrantyPenaltyAmount : 50000;
  const absencePenalty = mechanic ? mechanic.absencePenaltyAmount : 50000;

  const [reason, setReason] = useState('');
  const [isAbsent, setIsAbsent] = useState(true); // default true sesuai skenario user
  const [deductionAmount, setDeductionAmount] = useState<number>(basePenalty + absencePenalty);

  // Recalculate recommendation when isAbsent changes
  useEffect(() => {
    const recommended = basePenalty + (isAbsent ? absencePenalty : 0);
    setDeductionAmount(recommended);
  }, [isAbsent, basePenalty, absencePenalty]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onConfirm({
      serviceId: service.id,
      reason: reason.trim(),
      isAbsent,
      deductionAmount: Number(deductionAmount || 0)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Service & Mechanic Info Banner */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-mono font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
            {service.vehiclePlate}
          </span>
          <span className="font-bold text-slate-500">{service.vehicleModel}</span>
        </div>
        <div className="flex justify-between text-xs text-slate-600 pt-1 border-t border-slate-200">
          <span>Pelanggan: <strong>{service.customerName}</strong></span>
          <span>Jasa: <strong>Rp {(service.laborFee || 0).toLocaleString()}</strong></span>
        </div>
        <div className="flex items-center gap-2 pt-1 text-xs">
          <Wrench className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-slate-500">Mekanik Penanggung Jawab:</span>
          <span className="font-black text-slate-900">{service.mechanicName || mechanic?.name || 'Mekanik'}</span>
        </div>
      </div>

      {/* Complaint Reason */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
          Alasan Komplain / Kerusakan Servis Ulang
        </label>
        <textarea
          required
          rows={3}
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Contoh: CVT masih bergetar dan tarikan gas tersendat setelah servis kemarin..."
          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-xs font-medium focus:border-rose-300 resize-none"
        />
      </div>

      {/* Sanksi Ketidakhadiran H+1 (Highlight User Requirement) */}
      <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-2.5">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="isAbsentCheckbox"
            checked={isAbsent}
            onChange={e => setIsAbsent(e.target.checked)}
            className="w-5 h-5 mt-0.5 rounded-lg text-rose-600 border-amber-300 focus:ring-rose-500 cursor-pointer accent-rose-600"
          />
          <label htmlFor="isAbsentCheckbox" className="cursor-pointer select-none">
            <span className="text-xs font-black text-rose-900 block">
              Mekanik TIDAK MASUK (Absen/Mangkir) di hari setelah servis selesai / saat komplain masuk
            </span>
            <span className="text-[10px] text-amber-800 font-medium block mt-0.5">
              Sesuai aturan bengkel: Dikenakan denda komplain garansi (Rp {basePenalty.toLocaleString()}) PLUS penalti potong gaji ketidakhadiran (Rp {absencePenalty.toLocaleString()}).
            </span>
          </label>
        </div>

        {isAbsent && (
          <div className="flex items-center gap-2 text-[10px] font-black text-rose-700 bg-rose-100/70 p-2 rounded-xl border border-rose-200">
            <UserX className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Sanksi ganda diaktifkan: Denda Komplain + Denda Mangkir/Absen</span>
          </div>
        )}
      </div>

      {/* Deduction Amount Config */}
      <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-100 space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-black text-rose-900/70 uppercase tracking-widest">
            Nominal Potong Gaji Mekanik (Rp)
          </label>
          <span className="text-[10px] font-bold text-rose-600">
            {isAbsent ? 'Garansi + Absen' : 'Garansi Standar'}
          </span>
        </div>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500 font-black text-sm">Rp</span>
          <input
            type="number"
            min="0"
            step="5000"
            value={deductionAmount}
            onChange={e => setDeductionAmount(Number(e.target.value))}
            className="w-full h-14 pl-12 pr-4 bg-white border border-rose-200 rounded-2xl text-base font-black text-rose-700 outline-none focus:border-rose-400 shadow-sm"
          />
        </div>
        <p className="text-[10px] text-slate-500 italic">
          *Kasir/Admin dapat menyesuaikan besaran potongan secara manual jika terdapat kebijakan khusus.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 h-12 bg-slate-100 text-slate-600 rounded-xl font-black uppercase tracking-wider text-xs hover:bg-slate-200 transition-colors"
        >
          Batal
        </button>
        <button
          type="submit"
          className="flex-1 h-12 bg-rose-600 text-white rounded-xl font-black uppercase tracking-wider text-xs shadow-lg shadow-rose-200 hover:bg-rose-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <ShieldAlert className="w-4 h-4" /> Proses Potong Gaji
        </button>
      </div>
    </form>
  );
};
