import React, { useMemo, useState } from 'react';
import {
  format, parseISO, startOfDay, endOfDay, startOfMonth, endOfMonth,
  startOfYear, endOfYear, isWithinInterval
} from 'date-fns';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar,
  CartesianGrid, XAxis, YAxis
} from 'recharts';
import { WalletCards, ReceiptText, TrendingUp, Package, Wrench, UsersRound } from 'lucide-react';
import { WorkshopService, Expense, SparePart } from '../types';
import { cn } from '../lib/utils';

interface ReportsViewProps {
  services: WorkshopService[];
  expenses: Expense[];
  parts: SparePart[];
}

const money = (amount: number) => `Rp ${amount.toLocaleString('id-ID')}`;

export const ReportsView: React.FC<ReportsViewProps> = ({ services, expenses, parts }) => {
  const [filterType, setFilterType] = useState<'day' | 'month' | 'year' | 'custom'>('month');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [customRange, setCustomRange] = useState({ start: format(new Date(), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') });

  const filteredData = useMemo(() => {
    let start: Date;
    let end: Date;
    if (filterType === 'day') {
      const date = parseISO(selectedDate); start = startOfDay(date); end = endOfDay(date);
    } else if (filterType === 'month') {
      const date = parseISO(`${selectedMonth}-01`); start = startOfMonth(date); end = endOfMonth(date);
    } else if (filterType === 'year') {
      const date = new Date(selectedYear, 0, 1); start = startOfYear(date); end = endOfYear(date);
    } else {
      start = startOfDay(parseISO(customRange.start)); end = endOfDay(parseISO(customRange.end));
    }
    return {
      // Hanya transaksi selesai yang diakui sebagai penjualan/laba.
      filteredServices: services.filter(service =>
        service.status === 'Done' && isWithinInterval(parseISO(service.createdAt), { start, end })
      ),
      filteredExpenses: expenses.filter(expense =>
        isWithinInterval(parseISO(expense.date), { start, end })
      )
    };
  }, [services, expenses, filterType, selectedDate, selectedMonth, selectedYear, customRange]);

  const stats = useMemo(() => {
    const { filteredServices, filteredExpenses } = filteredData;
    const partPurchasePrices = new Map(parts.map(part => [part.id, part.purchasePrice || 0]));

    let partSales = 0;
    let partCost = 0;
    let serviceSales = 0;
    let mechanicBonus = 0;

    filteredServices.forEach(service => {
      serviceSales += service.laborFee || 0;
      mechanicBonus += service.mechanicBonusAmount ??
        Math.round((service.laborFee || 0) * (service.mechanicBonusPercent || 0) / 100);

      service.partsUsed.forEach(item => {
        const quantity = item.quantity || 0;
        partSales += (item.priceAtTime || 0) * quantity;
        // Snapshot digunakan untuk transaksi baru; harga master hanya fallback untuk data lama.
        partCost += (item.purchasePriceAtTime ?? partPurchasePrices.get(item.partId) ?? 0) * quantity;
      });
    });

    const totalSales = filteredServices.reduce((total, service) => total + (service.totalAmount || 0), 0);
    const totalExpenses = filteredExpenses.reduce((total, expense) => total + (expense.amount || 0), 0);
    const partProfit = partSales - partCost;
    const serviceProfit = serviceSales - mechanicBonus;
    const netProfit = partProfit + serviceProfit;

    return {
      totalSales, totalExpenses, partSales, partCost, partProfit,
      serviceSales, mechanicBonus, serviceProfit, netProfit,
      transactionCount: filteredServices.length
    };
  }, [filteredData, parts]);

  const summaryData = [
    { label: 'Total Penjualan', value: stats.totalSales, description: 'Seluruh transaksi selesai', icon: ReceiptText, color: 'text-blue-700', bg: 'bg-blue-50', iconBg: 'bg-blue-600' },
    { label: 'Pengeluaran', value: stats.totalExpenses, description: 'Dicatat terpisah, tidak mengurangi laba', icon: WalletCards, color: 'text-rose-700', bg: 'bg-rose-50', iconBg: 'bg-rose-600' },
    { label: 'Laba Bersih', value: stats.netProfit, description: 'Margin barang + laba jasa setelah bonus mekanik', icon: TrendingUp, color: 'text-emerald-700', bg: 'bg-emerald-50', iconBg: 'bg-emerald-600' }
  ];

  const salesComposition = [
    { name: 'Penjualan Jasa', value: stats.serviceSales },
    { name: 'Penjualan Barang', value: stats.partSales }
  ];
  const COLORS = ['#2563eb', '#10b981'];

  const performanceData = useMemo(() => {
    const groups: Record<string, number> = {};
    filteredData.filteredServices.forEach(service => {
      groups[service.serviceType] = (groups[service.serviceType] || 0) + 1;
    });
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-100">
            {[
              { id: 'day', label: 'Harian' }, { id: 'month', label: 'Bulanan' },
              { id: 'year', label: 'Tahunan' }, { id: 'custom', label: 'Custom' }
            ].map(type => (
              <button key={type.id} onClick={() => setFilterType(type.id as typeof filterType)}
                className={cn('flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all', filterType === type.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600')}>
                {type.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 items-end">
            {filterType === 'day' && <DateField label="Pilih Tanggal" type="date" value={selectedDate} onChange={setSelectedDate} />}
            {filterType === 'month' && <DateField label="Pilih Bulan" type="month" value={selectedMonth} onChange={setSelectedMonth} />}
            {filterType === 'year' && <div className="flex-1 min-w-[200px] space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Tahun</label><select value={selectedYear} onChange={event => setSelectedYear(Number(event.target.value))} className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none">{[0, 1, 2, 3, 4].map(offset => { const year = new Date().getFullYear() - offset; return <option key={year} value={year}>{year}</option>; })}</select></div>}
            {filterType === 'custom' && <div className="flex flex-1 gap-3 min-w-[300px]"><DateField label="Mulai" type="date" value={customRange.start} onChange={value => setCustomRange({ ...customRange, start: value })} /><DateField label="Sampai" type="date" value={customRange.end} onChange={value => setCustomRange({ ...customRange, end: value })} /></div>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {summaryData.map(summary => <div key={summary.label} className={cn('p-5 rounded-3xl border border-slate-100 shadow-sm', summary.bg)}><div className="flex justify-between gap-3"><div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{summary.label}</p><p className={cn('mt-2 text-xl font-black tracking-tight', summary.color)}>{money(summary.value)}</p></div><div className={cn('w-10 h-10 rounded-2xl text-white flex items-center justify-center shrink-0', summary.iconBg)}><summary.icon className="w-5 h-5" /></div></div><p className="mt-2 text-[10px] leading-relaxed text-slate-500 font-medium">{summary.description}</p></div>)}
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-4 h-4 text-emerald-600" /><h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Rincian Perhitungan Laba Bersih</h3></div>
        <p className="text-[11px] text-slate-500 mb-5">Pengeluaran operasional ditampilkan sendiri dan tidak dikurangkan dari laba bersih di bawah ini.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ProfitSection title="Laba Barang" icon={Package} color="blue" rows={[
            ['Penjualan barang', stats.partSales], ['Modal barang terjual', stats.partCost]
          ]} result={['Laba barang', stats.partProfit]} />
          <ProfitSection title="Laba Jasa" icon={Wrench} color="emerald" rows={[
            ['Pendapatan jasa', stats.serviceSales], ['Bonus mekanik', stats.mechanicBonus]
          ]} result={['Laba jasa', stats.serviceProfit]} />
        </div>
        <div className="mt-4 p-4 bg-slate-900 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-white"><div><p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Laba bersih periode ini</p><p className="text-[11px] text-slate-300">Laba barang + laba jasa, tanpa pengurangan pengeluaran.</p></div><p className="text-2xl font-black">{money(stats.netProfit)}</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm"><h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Komposisi Penjualan</h3><div className="h-[200px] w-full"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={salesComposition} cx="50%" cy="50%" innerRadius={55} outerRadius={78} paddingAngle={5} dataKey="value">{salesComposition.map((entry, index) => <Cell key={entry.name} fill={COLORS[index]} />)}</Pie><Tooltip formatter={(value: number) => money(value || 0)} /></PieChart></ResponsiveContainer></div><div className="flex justify-center gap-5">{salesComposition.map((item, index) => <div key={item.name} className="flex items-center gap-2 text-[10px] font-bold text-slate-500"><span className="w-2 h-2 rounded-full" style={{ background: COLORS[index] }} />{item.name}</div>)}</div></div>
        <div className="p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm"><div className="flex items-center justify-between mb-4"><h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Jenis Transaksi Selesai</h3><span className="text-[10px] font-black text-blue-600 flex items-center gap-1"><UsersRound className="w-3.5 h-3.5" /> {stats.transactionCount} transaksi</span></div><div className="h-[200px] w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={performanceData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} /><Tooltip cursor={{ fill: '#f8fafc' }} /><Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={24} /></BarChart></ResponsiveContainer></div></div>
      </div>
    </div>
  );
};

const DateField = ({ label, type, value, onChange }: { label: string; type: 'date' | 'month'; value: string; onChange: (value: string) => void }) => <div className="flex-1 min-w-[140px] space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label><input type={type} value={value} onChange={event => onChange(event.target.value)} className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-blue-200" /></div>;

const ProfitSection = ({ title, icon: Icon, color, rows, result }: { title: string; icon: React.ComponentType<{ className?: string }>; color: 'blue' | 'emerald'; rows: [string, number][]; result: [string, number] }) => <section className={cn('p-4 rounded-2xl border', color === 'blue' ? 'bg-blue-50/60 border-blue-100' : 'bg-emerald-50/60 border-emerald-100')}><div className="flex items-center gap-2 mb-4"><Icon className={cn('w-4 h-4', color === 'blue' ? 'text-blue-600' : 'text-emerald-600')} /><h4 className="text-xs font-black text-slate-800 uppercase">{title}</h4></div>{rows.map(([label, value]) => <div key={label} className="flex justify-between py-2 border-b border-slate-200/60 text-xs"><span className="text-slate-500">{label}</span><span className="font-bold text-slate-800">{money(value)}</span></div>)}<div className="flex justify-between pt-3 text-xs"><span className="font-black text-slate-800 uppercase">{result[0]}</span><span className={cn('font-black', color === 'blue' ? 'text-blue-700' : 'text-emerald-700')}>{money(result[1])}</span></div></section>;
