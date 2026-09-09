import React from 'react';
import { format } from 'date-fns';
import { Wallet, CreditCard, Trash2 } from 'lucide-react';
import { Expense } from '../types';

interface ExpenseViewProps {
  expenses: Expense[];
  onAdd: () => void;
  onDelete: (id: string) => void;
}

export const ExpenseView: React.FC<ExpenseViewProps> = ({ expenses, onAdd, onDelete }) => {
  return (
    <div className="space-y-4 pb-20">
      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-600" /> Pengeluaran Operasional
          </h2>
        </div>
        <div className="space-y-3">
          {expenses.map((e) => (
            <div key={e.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 uppercase mb-0.5">{e.category}</p>
                  <p className="text-[10px] text-slate-400 font-bold">{e.note || 'Tidak ada catatan'}</p>
                  <p className="text-[9px] text-slate-400 font-medium">{format(new Date(e.date), 'dd MMM yyyy')}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-black text-rose-600">-Rp {(e.amount || 0).toLocaleString()}</span>
                <button 
                  onClick={() => onDelete(e.id)} 
                  aria-label="Hapus Pengeluaran"
                  className="p-2 text-slate-300 hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {expenses.length === 0 && (
            <div className="text-center py-10 opacity-30">
              <Wallet className="w-12 h-12 mx-auto mb-2" />
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Belum ada pengeluaran</p>
            </div>
          )}
        </div>
        <button 
          onClick={onAdd}
          className="w-full mt-6 py-4 border-2 border-dashed border-slate-100 rounded-2xl text-blue-600 font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all"
        >
          + Catat Pengeluaran Baru
        </button>
      </div>
    </div>
  );
};
