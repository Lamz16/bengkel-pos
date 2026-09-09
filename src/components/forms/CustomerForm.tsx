import React, { useState } from 'react';
import { Customer } from '../../types';

interface CustomerFormProps {
  customer?: Customer;
  onSave: (c: Customer) => void;
  onCancel: () => void;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({ customer, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Customer>(customer || {
    id: 'CUST-' + Math.floor(Math.random() * 1000),
    name: '',
    phone: '',
    email: '',
    address: '',
    totalServiceCount: 0
  });

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nama Lengkap</label>
        <input 
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm font-bold"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">No. Telepon (WhatsApp)</label>
        <input 
          value={formData.phone}
          onChange={e => setFormData({ ...formData, phone: e.target.value })}
          className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm font-bold"
        />
      </div>
      <div className="flex gap-2 pt-4">
        <button onClick={onCancel} className="flex-1 h-14 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest">Batal</button>
        <button onClick={() => onSave(formData)} className="flex-1 h-14 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-100">Simpan</button>
      </div>
    </div>
  );
};
