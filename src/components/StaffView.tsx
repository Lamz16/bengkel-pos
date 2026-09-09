import React from 'react';
import { UserCircle, Edit, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface StaffViewProps {
  staff: any[];
  onAdd: () => void;
  onEdit: (s: any) => void;
  onDelete: (id: string) => void;
  onGoToMechanics?: () => void;
}

export const StaffView: React.FC<StaffViewProps> = ({ 
  staff, 
  onAdd, 
  onEdit, 
  onDelete, 
  onGoToMechanics 
}) => {
  return (
    <div className="space-y-4 pb-20">
      <div className="bg-white p-4 rounded-[28px] border border-blue-100 bg-blue-50/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div className="text-xs text-blue-950">
          <p className="font-black text-sm">Akun Login PIC & Admin Operasional</p>
          <p className="text-[11px] text-blue-800/80 mt-0.5">Sistem ini memiliki 2 peran: <strong>Superadmin/Owner</strong> dan <strong>Admin/PIC</strong>. Mekanik lapangan tidak memerlukan akun login dan dikelola di menu Mekanik.</p>
        </div>
        {onGoToMechanics && (
          <button 
            onClick={onGoToMechanics}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-blue-700 shrink-0 shadow-sm"
          >
            Buka Menu Mekanik & Gaji
          </button>
        )}
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Daftar Akun Pengguna (PIC / Admin)</h3>
        <div className="space-y-3">
          {staff.map(s => (
            <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                  <UserCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{s.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{s.role === 'Owner' ? '👑 Superadmin / Owner' : '🛠️ Admin / PIC'} • Shift {s.shifts}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[9px] font-black uppercase",
                  s.status === 'Active' ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"
                )}>
                  {s.status}
                </span>
                <button 
                  onClick={() => onEdit(s)} 
                  aria-label="Edit Karyawan"
                  className="p-2 text-slate-400 hover:text-blue-600"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => onDelete(s.id)} 
                  aria-label="Hapus Karyawan"
                  className="p-2 text-slate-400 hover:text-rose-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {staff.length === 0 && (
            <div className="text-center py-10 opacity-40">
              <UserCircle className="w-12 h-12 mx-auto mb-2" />
              <p className="text-xs font-bold uppercase tracking-widest">Belum ada akun PIC / Admin</p>
            </div>
          )}
        </div>
        <button 
          onClick={onAdd}
          className="w-full mt-6 py-4 border-2 border-dashed border-slate-100 rounded-2xl text-blue-600 font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all"
        >
          + Tambah Akun PIC / Admin Baru
        </button>
      </div>
    </div>
  );
};
