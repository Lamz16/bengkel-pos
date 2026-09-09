import React, { useState } from 'react';
import { Mechanic, MechanicDeduction } from '../types';
import { AlertTriangle, UserX, DollarSign, Calendar } from 'lucide-react';

interface ManualDeductionFormProps {
  mechanics: Mechanic[];
  preselectedMechanicId?: string;
  onSave: (deduction: MechanicDeduction) => void;
  onCancel: () => void;
}

export const ManualDeductionForm: React.FC<ManualDeductionFormProps> = ({
  mechanics,
  preselectedMechanicId,
  onSave,
  onCancel
}) => {
  const activeMechanics = mechanics.filter(m => m.status === 'Active');
  const [mechanicId, setMechanicId] = useState(preselectedMechanicId || activeMechanics[0]?.id || mechanics[0]?.id || '');
  const [type, setType] = useState<MechanicDeduction['type']>('Absence');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState<number>(50000);
  const [isAbsentNextDay, setIsAbsentNextDay] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleMechanicChange = (id: string) => {
    setMechanicId(id);
    const mec = mechanics.find(m => m.id === id);
    if (mec) {
      if (type === 'Absence') {
        setAmount(mec.absencePenaltyAmount);
      } else if (type === 'Warranty_Complaint') {
        setAmount(mec.warrantyPenaltyAmount);
      }
    }
  };

  const handleTypeChange = (newType: MechanicDeduction['type']) => {
    setType(newType);
    const mec = mechanics.find(m => m.id === mechanicId);
    if (mec) {
      if (newType === 'Absence') {
        setAmount(mec.absencePenaltyAmount);
      } else if (newType === 'Warranty_Complaint') {
        setAmount(mec.warrantyPenaltyAmount);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mec = mechanics.find(m => m.id === mechanicId);
    if (!mec || !reason.trim()) return;

    const newDeduction: MechanicDeduction = {
      id: 'DED-' + Math.floor(Math.random() * 100000),
      mechanicId,
      mechanicName: mec.name,
      serviceId: undefined,
      vehiclePlate: vehiclePlate.trim() || undefined,
      date: new Date(date).toISOString(),
      reason: reason.trim(),
      type,
      amount: Number(amount || 0),
      isAbsentNextDay
    };

    onSave(newDeduction);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Pilih Mekanik</label>
        <select
          value={mechanicId}
          onChange={e => handleMechanicChange(e.target.value)}
          className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold focus:border-rose-300"
        >
          {mechanics.map(m => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.specialty}) {m.status === 'Inactive' ? '- Nonaktif' : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Jenis Potongan / Sanksi</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'Absence', label: 'Tidak Masuk / Absen' },
            { id: 'Warranty_Complaint', label: 'Komplain Servis' },
            { id: 'Penalty', label: 'Penalti Lain' }
          ].map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleTypeChange(t.id as any)}
              className={`py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all text-center ${
                type === t.id 
                  ? "bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-100" 
                  : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Tanggal Kejadian</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Plat Nomor (Opsional)</label>
          <input
            type="text"
            value={vehiclePlate}
            onChange={e => setVehiclePlate(e.target.value)}
            placeholder="e.g. B 1234 ABC"
            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold uppercase"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Keterangan / Alasan Sanksi</label>
        <textarea
          required
          rows={2}
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Jelaskan alasan potongan gaji atau sanksi absensi..."
          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-medium resize-none focus:border-rose-300"
        />
      </div>

      {type === 'Warranty_Complaint' && (
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-3">
          <input
            type="checkbox"
            id="manualAbsentCheck"
            checked={isAbsentNextDay}
            onChange={e => setIsAbsentNextDay(e.target.checked)}
            className="w-4 h-4 rounded text-rose-600 accent-rose-600"
          />
          <label htmlFor="manualAbsentCheck" className="text-xs font-bold text-amber-900 cursor-pointer">
            Mekanik juga tidak masuk kerja (mangkir) di hari berikutnya
          </label>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Nominal Potongan (Rp)</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500 font-bold text-xs">Rp</span>
          <input
            type="number"
            min="0"
            step="5000"
            value={amount}
            onChange={e => setAmount(Number(e.target.value))}
            className="w-full h-12 pl-12 pr-4 bg-white border border-rose-200 rounded-xl outline-none text-sm font-black text-rose-700"
          />
        </div>
      </div>

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
          className="flex-1 h-12 bg-rose-600 text-white rounded-xl font-black uppercase tracking-wider text-xs shadow-lg shadow-rose-200 hover:bg-rose-700 transition-colors"
        >
          Terapkan Potongan
        </button>
      </div>
    </form>
  );
};
