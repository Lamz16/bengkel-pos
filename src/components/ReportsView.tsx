import React, { useState, useMemo } from 'react';
import { 
  format, 
  parseISO, 
  startOfDay, 
  endOfDay, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear, 
  isWithinInterval 
} from 'date-fns';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  BarChart, 
  Bar, 
  CartesianGrid, 
  XAxis, 
  YAxis 
} from 'recharts';
import { WorkshopService, Expense } from '../types';
import { cn } from '../lib/utils';

interface ReportsViewProps {
  services: WorkshopService[];
  expenses: Expense[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ services, expenses }) => {
  const [filterType, setFilterType] = useState<'day' | 'month' | 'year' | 'custom'>('month');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [customRange, setCustomRange] = useState({ 
    start: format(new Date(), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });

  const filteredData = useMemo(() => {
    let start: Date;
    let end: Date;

    if (filterType === 'day') {
      const d = parseISO(selectedDate);
      start = startOfDay(d);
      end = endOfDay(d);
    } else if (filterType === 'month') {
      const d = parseISO(`${selectedMonth}-01`);
      start = startOfMonth(d);
      end = endOfMonth(d);
    } else if (filterType === 'year') {
      const d = new Date(selectedYear, 0, 1);
      start = startOfYear(d);
      end = endOfYear(d);
    } else {
      start = startOfDay(parseISO(customRange.start));
      end = endOfDay(parseISO(customRange.end));
    }

    const filteredServices = services.filter(s => {
      const date = parseISO(s.createdAt);
      return isWithinInterval(date, { start, end });
    });

    const filteredExpenses = expenses.filter(e => {
      const date = parseISO(e.date);
      return isWithinInterval(date, { start, end });
    });

    return { filteredServices, filteredExpenses };
  }, [services, expenses, filterType, selectedDate, selectedMonth, selectedYear, customRange]);

  const stats = useMemo(() => {
    const { filteredServices, filteredExpenses } = filteredData;
    const totalRevenue = filteredServices.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
    const totalExpenses = filteredExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
    const labor = filteredServices.reduce((acc, s) => acc + (s.laborFee || 0), 0);
    const partsRevenue = totalRevenue - labor;
    const netProfit = totalRevenue - totalExpenses;
    return { totalRevenue, totalExpenses, labor, partsRevenue, netProfit };
  }, [filteredData]);

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444'];
  const pieData = [
    { name: 'Labor', value: stats.labor },
    { name: 'Parts', value: stats.partsRevenue },
  ];

  const summaryData = [
    { label: 'Total Sales', value: stats.totalRevenue, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Expenses', value: stats.totalExpenses, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Net Profit', value: stats.netProfit, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  const performanceData = useMemo(() => {
    const { filteredServices } = filteredData;
    const serviceGroups: Record<string, number> = {};
    filteredServices.forEach(s => {
      serviceGroups[s.serviceType] = (serviceGroups[s.serviceType] || 0) + 1;
    });
    return Object.entries(serviceGroups).map(([name, val]) => ({ name, val }));
  }, [filteredData]);

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-100">
            {[
              { id: 'day', label: 'Harian' },
              { id: 'month', label: 'Bulanan' },
              { id: 'year', label: 'Tahunan' },
              { id: 'custom', label: 'Custom' }
            ].map(type => (
              <button
                key={type.id}
                onClick={() => setFilterType(type.id as any)}
                className={cn(
                  "flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                  filterType === type.id 
                    ? "bg-white text-blue-600 shadow-sm" 
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                {type.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 items-end">
            {filterType === 'day' && (
              <div className="flex-1 min-w-[200px] space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Tanggal</label>
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-blue-200"
                />
              </div>
            )}
            {filterType === 'month' && (
              <div className="flex-1 min-w-[200px] space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Bulan</label>
                <input 
                  type="month"
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-blue-200"
                />
              </div>
            )}
            {filterType === 'year' && (
              <div className="flex-1 min-w-[200px] space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Tahun</label>
                <select 
                  value={selectedYear}
                  onChange={e => setSelectedYear(Number(e.target.value))}
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-blue-200"
                >
                  {[0, 1, 2, 3, 4].map(i => {
                    const year = new Date().getFullYear() - i;
                    return <option key={year} value={year}>{year}</option>;
                  })}
                </select>
              </div>
            )}
            {filterType === 'custom' && (
              <div className="flex flex-1 gap-3 min-w-[300px]">
                <div className="flex-1 space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Mulai</label>
                  <input 
                    type="date"
                    value={customRange.start}
                    onChange={e => setCustomRange({...customRange, start: e.target.value})}
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-blue-200"
                  />
                </div>
                <div className="flex-1 space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Sampai</label>
                  <input 
                    type="date"
                    value={customRange.end}
                    onChange={e => setCustomRange({...customRange, end: e.target.value})}
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-blue-200"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {summaryData.map((s) => (
          <div key={s.label} className={cn("p-4 rounded-3xl border border-slate-100 shadow-sm", s.bg)}>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
            <p className={cn("text-xs sm:text-sm font-black", s.color)}>Rp {(s.value >= 1000 || s.value < 0 ? (s.value / 1000).toFixed(1) + 'k' : s.value)}</p>
          </div>
        ))}
      </div>

      <div className="p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Revenue Breakdown</h3>
        <div className="h-[200px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `Rp ${(value || 0).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-4">
           {pieData.map((d, i) => (
             <div key={d.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />
                <span className="text-[10px] font-bold text-slate-500 uppercase">{d.name}</span>
             </div>
           ))}
        </div>
      </div>

      <div className="p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Top Performance</h3>
        <div className="h-[200px] w-full">
           <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="val" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
           </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
