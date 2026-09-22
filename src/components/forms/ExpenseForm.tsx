import React, { useState } from 'react';
import { Expense, ExpenseCategory } from '../../types';
import { CurrencyInput } from '../CurrencyInput';

interface ExpenseFormProps {
  expense?: Expense;
  categories: ExpenseCategory[];
  onSave: (e: Expense) => void;
  onCancel: () => void;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ expense, categories, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Expense>(expense || {
    id: 'EXP-' + Math.floor(Math.random() * 10000),
    category: categories[0]?.name || '',
    categoryId: categories[0]?.id,
    amount: 0,
    note: '',
    date: new Date().toISOString()
  });

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Kategori Pengeluaran</label>
        <select
          value={formData.categoryId || ''}
          onChange={e => {
            const category = categories.find(item => item.id === e.target.value);
            setFormData({ ...formData, category: category?.name || '', categoryId: category?.id });
          }}
          className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm font-bold"
        >
          <option value="" disabled>Pilih kategori pengeluaran</option>
          {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        {categories.length === 0 && <p className="text-[10px] text-rose-600 font-bold">Belum ada kategori. Kelola kategori terlebih dahulu.</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Jumlah (Rp)</label>
        <CurrencyInput
          value={formData.amount}
          onValueChange={amount => setFormData({ ...formData, amount })}
          className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm font-bold"
          placeholder="0"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Catatan Tambahan</label>
        <textarea 
          value={formData.note}
          onChange={e => setFormData({ ...formData, note: e.target.value })}
          className="w-full h-24 p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm font-bold resize-none"
          placeholder="e.g. Pembayaran listrik April 2024"
        />
      </div>
      <div className="flex gap-2 pt-4">
        <button onClick={onCancel} className="flex-1 h-14 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest">Batal</button>
        <button disabled={!formData.categoryId || !formData.amount} onClick={() => onSave(formData)} className="flex-1 h-14 bg-blue-600 disabled:bg-slate-300 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-100">Simpan Catatan</button>
      </div>
    </div>
  );
};
