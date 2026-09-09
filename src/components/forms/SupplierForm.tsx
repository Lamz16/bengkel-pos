import React, { useState } from 'react';
import { Supplier } from '../../types';

interface SupplierFormProps {
  supplier?: Supplier;
  onSave: (s: Supplier) => void;
  onCancel: () => void;
}

export const SupplierForm: React.FC<SupplierFormProps> = ({ supplier, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Supplier>(supplier || {
    id: 'SUP-' + Math.floor(Math.random() * 1000),
    name: '',
    contact: '',
    address: ''
  });

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nama Pemasok</label>
        <input 
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm font-bold"
          placeholder="e.g. Toko Onderdil Berkah"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Kontak (HP/WA)</label>
        <input 
          value={formData.contact}
          onChange={e => setFormData({ ...formData, contact: e.target.value })}
          className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm font-bold"
          placeholder="08xxxxxxxxxx"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Alamat / Lokasi</label>
        <input 
          value={formData.address}
          onChange={e => setFormData({ ...formData, address: e.target.value })}
          className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm font-bold"
          placeholder="Alamat supplier"
        />
      </div>
      <div className="flex gap-2 pt-4">
        <button onClick={onCancel} className="flex-1 h-14 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest">Batal</button>
        <button onClick={() => onSave(formData)} className="flex-1 h-14 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-100">Simpan Supplier</button>
      </div>
    </div>
  );
};
