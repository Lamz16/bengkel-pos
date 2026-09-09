import React from 'react';
import { Store, Edit, Trash2, Phone, MapPin } from 'lucide-react';
import { Supplier } from '../types';

interface SupplierViewProps {
  suppliers: Supplier[];
  onAdd: () => void;
  onEdit: (s: Supplier) => void;
  onDelete: (id: string) => void;
}

export const SupplierView: React.FC<SupplierViewProps> = ({ 
  suppliers, 
  onAdd, 
  onEdit, 
  onDelete 
}) => {
  return (
    <div className="space-y-4 pb-20">
      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
            <Store className="w-5 h-5 text-blue-600" /> Daftar Pemasok (Suppliers)
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suppliers.map((s) => (
            <div key={s.id} className="p-5 bg-slate-50 rounded-[28px] border border-slate-100 relative group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                  <Store className="w-6 h-6" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => onEdit(s)} 
                    aria-label="Edit Pemasok"
                    className="p-2 text-slate-400 hover:text-blue-600"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => onDelete(s.id)} 
                    aria-label="Hapus Pemasok"
                    className="p-2 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1">{s.name}</h3>
              <div className="space-y-1">
                <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                  <Phone className="w-3 h-3" /> {s.contact}
                </p>
                <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                  <MapPin className="w-3 h-3" /> {s.address}
                </p>
              </div>
            </div>
          ))}
        </div>
        <button 
          onClick={onAdd}
          className="w-full mt-6 py-4 border-2 border-dashed border-slate-100 rounded-2xl text-blue-600 font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all"
        >
          + Tambah Pemasok Baru
        </button>
      </div>
    </div>
  );
};
