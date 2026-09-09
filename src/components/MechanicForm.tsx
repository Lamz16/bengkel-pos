import React, { useState } from 'react';
import { Mechanic } from '../types';
import { cn } from '../lib/utils';
import { Wrench, DollarSign, AlertTriangle, UserX } from 'lucide-react';

interface MechanicFormProps {
  mechanic?: Partial<Mechanic>;
  onSave: (m: Mechanic) => void;
  onCancel: () => void;
}

export const MechanicForm: React.FC<MechanicFormProps> = ({ mechanic, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Mechanic>({
    id: mechanic?.id || 'MEK-' + Math.floor(Math.random() * 10000),
    name: mechanic?.name || '',
    phone: mechanic?.phone || '',
    specialty: mechanic?.specialty || 'Servis Umum & CVT',
    status: mechanic?.status || 'Active',
    defaultBonusPercent: mechanic?.defaultBonusPercent !== undefined ? mechanic.defaultBonusPercent : 15,
    dailySalary: mechanic?.dailySalary !== undefined ? mechanic.dailySalary : 100000,
    warrantyPenaltyAmount: mechanic?.warrantyPenaltyAmount !== undefined ? mechanic.warrantyPenaltyAmount : 50000,
    absencePenaltyAmount: mechanic?.absencePenaltyAmount !== undefined ? mechanic.absencePenaltyAmount : 50000,
    joinedAt: mechanic?.joinedAt || new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl text-[11px] text-blue-700 font-medium">
        ℹ️ <strong>Mekanik Tanpa Akses Login:</strong> Data ini digunakan oleh Kasir / PIC saat mencatat servis motor. Mekanik tidak memerlukan akun login ke aplikasi.
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Nama Lengkap Mekanik</label>
        <input 
          required
          type="text"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold focus:border-blue-500"
          placeholder="e.g. Bambang Sudirgo"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Nomor WhatsApp / HP</label>
          <input 
            type="text"
            value={formData.phone}
            onChange={e => setFormData({ ...formData, phone: e.target.value })}
            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold focus:border-blue-500"
            placeholder="08123456789"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Keahlian / Spesialisasi</label>
          <input 
            type="text"
            value={formData.specialty}
            onChange={e => setFormData({ ...formData, specialty: e.target.value })}
            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold focus:border-blue-500"
            placeholder="e.g. Mesin & CVT Matic, Kelistrikan"
          />
        </div>
      </div>

      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
          <Wrench className="w-3.5 h-3.5 text-blue-600" /> Pengaturan Komisi & Gaji
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Persentase Bonus Default (%)</label>
            <div className="relative">
              <input 
                type="number"
                min="0"
                max="100"
                value={formData.defaultBonusPercent}
                onChange={e => setFormData({ ...formData, defaultBonusPercent: Number(e.target.value) })}
                className="w-full h-12 pl-4 pr-8 bg-white border border-slate-200 rounded-xl outline-none text-xs font-bold"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</span>
            </div>
            <p className="text-[9px] text-slate-400 ml-1">Diambil dari biaya jasa pengerjaan servis</p>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Gaji Pokok Harian (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">Rp</span>
              <input 
                type="number"
                min="0"
                step="5000"
                value={formData.dailySalary}
                onChange={e => setFormData({ ...formData, dailySalary: Number(e.target.value) })}
                className="w-full h-12 pl-9 pr-3 bg-white border border-slate-200 rounded-xl outline-none text-xs font-bold"
              />
            </div>
            <p className="text-[9px] text-slate-400 ml-1">Dasar gaji pokok harian</p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-100 space-y-3">
        <h4 className="text-[10px] font-black text-rose-700 uppercase tracking-widest flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Kebijakan Potong Gaji & Penalti
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-rose-900/60 uppercase ml-1">Denda Komplain Garansi (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400 font-bold text-xs">Rp</span>
              <input 
                type="number"
                min="0"
                step="5000"
                value={formData.warrantyPenaltyAmount}
                onChange={e => setFormData({ ...formData, warrantyPenaltyAmount: Number(e.target.value) })}
                className="w-full h-12 pl-9 pr-3 bg-white border border-rose-200 rounded-xl outline-none text-xs font-bold text-rose-950"
              />
            </div>
            <p className="text-[9px] text-rose-600/80 ml-1">Dipotong bila servis komplain/klaim ulang</p>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-rose-900/60 uppercase ml-1">Denda Tidak Masuk/Absen (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400 font-bold text-xs">Rp</span>
              <input 
                type="number"
                min="0"
                step="5000"
                value={formData.absencePenaltyAmount}
                onChange={e => setFormData({ ...formData, absencePenaltyAmount: Number(e.target.value) })}
                className="w-full h-12 pl-9 pr-3 bg-white border border-rose-200 rounded-xl outline-none text-xs font-bold text-rose-950"
              />
            </div>
            <p className="text-[9px] text-rose-600/80 ml-1">Tambahan denda bila mangkir setelah servis</p>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Status Mekanik</label>
        <div className="grid grid-cols-2 gap-2">
          {(['Active', 'Inactive'] as const).map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setFormData({ ...formData, status: st })}
              className={cn(
                "py-3 rounded-xl text-xs font-black uppercase tracking-wider border transition-all",
                formData.status === st 
                  ? st === 'Active' 
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-100" 
                    : "bg-slate-800 text-white border-slate-800 shadow-md"
                  : "bg-slate-50 text-slate-400 border-slate-200"
              )}
            >
              {st === 'Active' ? 'Aktif Bekerja' : 'Non-Aktif'}
            </button>
          ))}
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
          className="flex-1 h-12 bg-blue-600 text-white rounded-xl font-black uppercase tracking-wider text-xs shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors"
        >
          Simpan Data Mekanik
        </button>
      </div>
    </form>
  );
};
