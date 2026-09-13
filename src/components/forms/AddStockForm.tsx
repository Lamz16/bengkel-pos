import React, { useState, useMemo, useEffect } from 'react';
import { SparePart, Supplier } from '../../types';

interface AddStockFormProps {
  parts: SparePart[];
  suppliers: Supplier[];
  initialPartId?: string;
  onSave: (partId: string, amount: number, supplierId: string, costPrice: number) => void;
}

export const AddStockForm: React.FC<AddStockFormProps> = ({ parts, suppliers, initialPartId, onSave }) => {
  const [selectedPartId, setSelectedPartId] = useState(initialPartId || parts[0]?.id || '');
  const [amount, setAmount] = useState('0');

  useEffect(() => {
    if (initialPartId) {
      setSelectedPartId(initialPartId);
    }
  }, [initialPartId]);
  
  const currentPart = useMemo(() => parts.find(p => p.id === selectedPartId), [parts, selectedPartId]);
  const [costPrice, setCostPrice] = useState('0');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');

  useEffect(() => {
    if (currentPart) {
      setCostPrice(String(currentPart.purchasePrice || 0));
      setSelectedSupplierId(currentPart.supplierId || suppliers[0]?.id || '');
    }
  }, [selectedPartId, currentPart, suppliers]);

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Pilih Sparepart</label>
        <select 
          value={selectedPartId}
          onChange={e => setSelectedPartId(e.target.value)}
          className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-bold"
        >
          {parts.map(p => <option key={p.id} value={p.id}>{p.name} (Stok: {p.stock})</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Jumlah Tambahan</label>
          <input 
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-bold"
            placeholder="0"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Harga Beli Baru (per Pcs)</label>
          <input 
            type="number"
            value={costPrice}
            onChange={e => setCostPrice(e.target.value)}
            className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-bold"
            placeholder="0"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Pilih Pemasok / Supplier</label>
        <select 
          value={selectedSupplierId}
          onChange={e => setSelectedSupplierId(e.target.value)}
          className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-bold"
        >
          {suppliers.length === 0 && <option value="">-- Daftarkan supplier terlebih dahulu --</option>}
          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.contact})</option>)}
        </select>
      </div>

      <button 
        onClick={() => onSave(selectedPartId, Number(amount), selectedSupplierId, Number(costPrice))}
        disabled={!selectedSupplierId || Number(amount) <= 0}
        className="w-full h-14 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-200 active:scale-95 transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
      >
        Tambah Stok & Simpan Transaksi
      </button>
    </div>
  );
};
