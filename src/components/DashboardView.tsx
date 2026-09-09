import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Search, 
  History, 
  Printer 
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { WorkshopService, SparePart, User } from '../types';
import { cn } from '../lib/utils';

interface DashboardViewProps {
  services: WorkshopService[];
  parts: SparePart[];
  user: User;
  onPrint: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ services, parts, user, onPrint }) => {
  const [historySearch, setHistorySearch] = useState('');
  
  const searchResults = useMemo(() => {
    if (!historySearch.trim()) return [];
    return services.filter(s => 
      s.vehiclePlate.toLowerCase().includes(historySearch.toLowerCase()) ||
      s.customerName.toLowerCase().includes(historySearch.toLowerCase()) ||
      s.vehicleModel.toLowerCase().includes(historySearch.toLowerCase())
    ).slice(0, 5);
  }, [historySearch, services]);

  const stats = useMemo(() => {
    const totalRevenue = services.filter(s => s.status === 'Done').reduce((acc, s) => acc + s.totalAmount, 0);
    const activeJobs = services.filter(s => s.status !== 'Done').length;
    const completedJobs = services.filter(s => s.status === 'Done').length;
    const lowStockCount = parts.filter(p => p.stock <= p.minStock).length;

    const items: { label: string, value: number | string, icon: any, color: string, bg: string }[] = [
      { label: 'Active', value: activeJobs, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Done', value: completedJobs, icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Low Stock', value: lowStockCount, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
    ];

    items.unshift({ label: "Revenue", value: `Rp ${(totalRevenue / 1000).toFixed(0)}k`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' });

    return items;
  }, [services, parts, user]);

  const topServices = useMemo(() => {
    const counts: Record<string, number> = {};
    services.forEach(s => {
      counts[s.serviceType] = (counts[s.serviceType] || 0) + 1;
    });
    return Object.entries(counts)
      .filter(([name]) => name !== 'Retail')
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [services]);

  const bestSellingParts = useMemo(() => {
    const counts: Record<string, number> = {};
    services.forEach(s => {
      s.partsUsed.forEach(p => {
        counts[p.name] = (counts[p.name] || 0) + p.quantity;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [services]);

  // Real chart data from services
  const dailyRevenue = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return format(d, 'EEE');
    });

    return last7Days.map(day => {
      const dayTotal = services
        .filter(s => format(new Date(s.createdAt), 'EEE') === day)
        .reduce((acc, s) => acc + s.totalAmount, 0);
      return { name: day, value: dayTotal };
    });
  }, [services]);

  return (
    <div className="space-y-6">
      {/* Stats - 2x2 Grid on Mobile */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            key={stat.label} 
            className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col"
          >
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-3", stat.bg)}>
              <stat.icon className={cn("w-4 h-4", stat.color)} />
            </div>
            <h3 className="text-lg font-black text-slate-900 leading-none">{stat.value}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-wider">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Vehicle History Quick Search */}
      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
        <div className="mb-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Cetak Riwayat Kendaraan</h3>
          <p className="text-[10px] text-slate-400 font-bold">Cari cepat riwayat servis berdasarkan Plat Nomor atau Nama</p>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            value={historySearch}
            onChange={e => setHistorySearch(e.target.value)}
            className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-bold placeholder:text-slate-300 focus:border-blue-200 transition-colors"
            placeholder="Cari B 1234 ABC..."
          />
        </div>
        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            {searchResults.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 hover:bg-white transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400 border border-slate-100">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 uppercase">{s.vehiclePlate}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">{s.vehicleModel} • {s.serviceType}</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-900 uppercase">Rp {(s.totalAmount || 0).toLocaleString()}</p>
                    <p className="text-[8px] text-slate-400 font-bold">{format(new Date(s.createdAt), 'dd/MM/yy')}</p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onPrint(s.id); }}
                    aria-label="Cetak Nota"
                    className="p-2 bg-white text-slate-400 rounded-lg border border-slate-100 hover:text-blue-600 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Revenue Chart - Simplified labels */}
        <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Revenue Trend</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyRevenue} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <Tooltip 
                  formatter={(value: number) => [`Rp ${(value || 0).toLocaleString()}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px', fontSize: '10px' }}
                />
                <Area type="monotone" dataKey="value" stroke="#2563eb" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Analytics - Mobile Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Top Services</h3>
            <div className="space-y-3">
              {topServices.map(([name, count]) => (
                <div key={name} className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">{name}</span>
                  <span className="text-xs font-black text-blue-600">{count}x</span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Best Selling Parts</h3>
            <div className="space-y-3">
              {bestSellingParts.map(([name, count]) => (
                <div key={name} className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 truncate mr-2">{name}</span>
                  <span className="text-xs font-black text-emerald-600">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Active Queue - Card Based */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ongoing Repairs</h3>
          </div>
          <div className="space-y-3">
            {services.slice(0, 3).map((service) => (
              <div key={service.id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between active:scale-[0.98] transition-transform">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-black text-xs uppercase shadow-inner">
                    {service.vehiclePlate.slice(-2)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{service.vehicleModel}</p>
                    <p className="text-[10px] text-slate-400 font-mono font-bold">{service.vehiclePlate}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter",
                    service.status === 'Done' ? 'bg-emerald-100 text-emerald-700' :
                    service.status === 'In Progress' ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  )}>
                    {service.status === 'In Progress' ? 'REPAIR' : service.status.toUpperCase()}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1 font-bold">20m ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
