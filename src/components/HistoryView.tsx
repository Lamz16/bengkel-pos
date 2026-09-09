import React, { useState, useMemo } from 'react';
import { Search, History, Printer } from 'lucide-react';
import { WorkshopService } from '../types';
import { cn } from '../lib/utils';

interface HistoryViewProps {
  services: WorkshopService[];
  onSelect: (id: string) => void;
  onPrint: (id: string) => void;
  initialFilter?: string;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ 
  services, 
  onSelect, 
  onPrint, 
  initialFilter 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialFilter || 'All');
  
  const filtered = useMemo(() => {
    return services.filter(s => {
      const matchSearch = s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'All' || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [services, searchTerm, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['All', 'In Progress', 'Ready', 'Done'].map(s => (
          <button 
            key={s} 
            onClick={() => setStatusFilter(s)}
            className={cn(
              "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap border transition-all",
              statusFilter === s ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-400 border-slate-100"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
          type="text" placeholder="Cari plat, nama, atau model..." value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full h-12 pl-12 pr-4 bg-white border border-slate-100 rounded-2xl shadow-sm outline-none text-sm font-bold"
        />
      </div>

      <div className="space-y-3">
        {filtered.map((service) => (
          <div 
            key={service.id} 
            onClick={() => onSelect(service.id)}
            className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center text-xs font-black uppercase shadow-inner",
                service.status === 'Done' ? 'bg-emerald-50 text-emerald-600' : 
                service.status === 'In Progress' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
              )}>
                {service.vehiclePlate.slice(-2)}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{service.vehicleModel}</p>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  <p className="text-[10px] text-slate-400 font-mono font-bold uppercase">{service.vehiclePlate}</p>
                  <span className="w-1 h-1 bg-slate-200 rounded-full" />
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{service.customerName}</p>
                  {service.mechanicName && (
                    <>
                      <span className="w-1 h-1 bg-slate-200 rounded-full" />
                      <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">
                        {service.mechanicName} ({service.mechanicBonusPercent || 0}%)
                      </span>
                    </>
                  )}
                  {service.hasWarrantyClaim && (
                    <span className="text-[9px] font-black text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 flex items-center gap-1">
                      ⚠️ Klaim Garansi
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter",
                service.status === 'Done' ? 'bg-emerald-100 text-emerald-700' :
                service.status === 'In Progress' ? 'bg-amber-100 text-amber-700' :
                'bg-blue-100 text-blue-700'
              )}>
                {service.status}
              </span>
              <p className="text-[10px] text-slate-400 mt-1 font-bold">Rp {(service.totalAmount || 0).toLocaleString()}</p>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); onPrint(service.id); }}
              aria-label="Cetak Nota"
              className="ml-4 p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all border border-slate-100"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="p-12 text-center opacity-40">
            <History className="w-12 h-12 mx-auto mb-2" />
            <p className="text-xs font-black uppercase tracking-widest">No matching history</p>
          </div>
        )}
      </div>
    </div>
  );
};
