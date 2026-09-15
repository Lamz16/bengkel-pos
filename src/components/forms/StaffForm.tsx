import React, { useState } from 'react';
import { cn } from '../../lib/utils';

interface StaffFormProps {
  staff?: any;
  onSave: (s: any) => void;
  onCancel: () => void;
}

export const StaffForm: React.FC<StaffFormProps> = ({ staff, onSave, onCancel }) => {
  const [formData, setFormData] = useState(staff || {
    id: 'STF-' + Math.floor(Math.random() * 1000),
    name: '',
    role: 'Admin',
    status: 'Active',
    shifts: 'Pagi',
    email: '',
    password: ''
  });

  return (
    <div className="space-y-4">
      <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-[11px] text-blue-800 font-medium">
        💡 <strong>Info Akun:</strong> Form ini untuk akun login pengoperasian sistem (Admin / PIC atau Superadmin). Data mekanik teknisi lapangan dikelola pada menu <strong>Mekanik & Gaji</strong>.
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nama Karyawan / PIC</label>
        <input 
          required
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm font-bold"
          placeholder="e.g. Rian Herlambang"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Peran Akses Login</label>
          <select 
            value={formData.role}
            onChange={e => setFormData({ ...formData, role: e.target.value })}
            className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm font-bold"
          >
            <option value="Admin">Admin / PIC</option>
            <option value="Owner">Superadmin / Owner</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Shift Kerja</label>
          <select 
            value={formData.shifts}
            onChange={e => setFormData({ ...formData, shifts: e.target.value })}
            className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm font-bold"
          >
            <option value="Pagi">Pagi (08:00 - 16:00)</option>
            <option value="Sore">Sore (13:00 - 21:00)</option>
            <option value="Full">Full Day</option>
          </select>
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Status Karyawan</label>
        <div className="flex gap-2">
          {['Active', 'Inactive'].map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setFormData({...formData, status: s})}
              className={cn(
                "flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                formData.status === s ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-400 border-slate-100 hover:border-slate-200"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Email Login Karyawan</label>
        <input
          required
          type="email"
          value={formData.email}
          onChange={e => setFormData({ ...formData, email: e.target.value })}
          className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm font-bold shadow-inner"
          placeholder="nama@bengkel.com"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Password Login Karyawan</label>
        <input 
          required
          minLength={8}
          type="password"
          value={formData.password}
          onChange={e => setFormData({ ...formData, password: e.target.value })}
          className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm font-bold shadow-inner"
          placeholder="Password untuk login karyawan"
        />
      </div>

      <div className="flex gap-2 pt-4">
        <button onClick={onCancel} className="flex-1 h-14 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest">Batal</button>
        <button disabled={!formData.name || !formData.email || formData.password.length < 8} onClick={() => onSave(formData)} className="flex-1 h-14 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed">Simpan</button>
      </div>
    </div>
  );
};
