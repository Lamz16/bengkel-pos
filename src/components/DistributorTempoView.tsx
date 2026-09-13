import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  List, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Building2, 
  CreditCard, 
  Trash2, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  DollarSign,
  FileText,
  Tag
} from 'lucide-react';
import { DistributorInvoice, Supplier, SparePart, DistributorInvoiceStatus } from '../types';
import { cn } from '../lib/utils';

interface DistributorTempoViewProps {
  invoices: DistributorInvoice[];
  suppliers: Supplier[];
  parts: SparePart[];
  onAddInvoice: (newInv: Partial<DistributorInvoice>) => Promise<void>;
  onAddPayment: (invoiceId: string, paymentData: { amount: number; paymentMethod: string; referenceNo?: string; notes?: string; paymentDate?: string }) => Promise<void>;
  onDeleteInvoice: (id: string) => Promise<void>;
}

export const DistributorTempoView: React.FC<DistributorTempoViewProps> = ({
  invoices,
  suppliers,
  parts,
  onAddInvoice,
  onAddPayment,
  onDeleteInvoice
}) => {
  // View states
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // Calendar Navigation State
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState<DistributorInvoice | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<DistributorInvoice | null>(null);

  // New Invoice Form State
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    supplierName: '',
    supplierId: '',
    branchName: 'Bengkel Pusat',
    branchType: 'Pusat' as 'Pusat' | 'Cabang',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0],
    paymentMethod: 'Transfer',
    notes: '',
    items: [{ partName: '', quantity: 1, unitPrice: 0, totalPrice: 0 }]
  });

  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Transfer');
  const [paymentRefNo, setPaymentRefNo] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extract unique branch names for filter
  const branchList = useMemo(() => {
    const branches = new Set<string>();
    branches.add('Bengkel Pusat');
    invoices.forEach(inv => {
      if (inv.branchName) branches.add(inv.branchName);
    });
    return Array.from(branches);
  }, [invoices]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      // Branch filter
      if (selectedBranch !== 'all' && inv.branchName !== selectedBranch) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'all') {
        const isOverdue = new Date(inv.dueDate) < new Date() && inv.remainingAmount > 0;
        const currentEffectiveStatus = isOverdue && inv.status !== 'Paid' ? 'Overdue' : inv.status;
        if (selectedStatus === 'Overdue' && currentEffectiveStatus !== 'Overdue') return false;
        if (selectedStatus !== 'Overdue' && inv.status !== selectedStatus) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNo = inv.invoiceNumber?.toLowerCase().includes(q);
        const matchSup = inv.supplierName?.toLowerCase().includes(q);
        const matchBranch = inv.branchName?.toLowerCase().includes(q);
        const matchItem = inv.items?.some(i => i.partName?.toLowerCase().includes(q));
        if (!matchNo && !matchSup && !matchBranch && !matchItem) return false;
      }
      return true;
    });
  }, [invoices, selectedBranch, selectedStatus, searchQuery]);

  // Summary Metrics
  const metrics = useMemo(() => {
    let totalUnpaid = 0;
    let totalOverdue = 0;
    let countDueThisMonth = 0;
    let totalPaid = 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    invoices.forEach(inv => {
      totalUnpaid += inv.remainingAmount;
      totalPaid += inv.paidAmount;

      const due = new Date(inv.dueDate);
      if (due < now && inv.remainingAmount > 0) {
        totalOverdue += inv.remainingAmount;
      }
      if (due.getMonth() === currentMonth && due.getFullYear() === currentYear && inv.remainingAmount > 0) {
        countDueThisMonth++;
      }
    });

    return { totalUnpaid, totalOverdue, countDueThisMonth, totalPaid };
  }, [invoices]);

  // Calendar Days Calculation
  const calendarDays = useMemo(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Day of week index (Monday = 0, Sunday = 6)
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const daysInMonth = lastDay.getDate();

    const days: Array<{
      dateString: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      dayInvoices: DistributorInvoice[];
    }> = [];

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, d);
      const dateString = prevDate.toISOString().split('T')[0];
      days.push({
        dateString,
        dayNum: d,
        isCurrentMonth: false,
        isToday: false,
        dayInvoices: []
      });
    }

    // Current month days
    const todayStr = new Date().toISOString().split('T')[0];
    for (let d = 1; d <= daysInMonth; d++) {
      const currDate = new Date(year, month, d);
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      
      const dayInvoices = filteredInvoices.filter(inv => {
        const invDueDateStr = new Date(inv.dueDate).toISOString().split('T')[0];
        return invDueDateStr === dateString;
      });

      days.push({
        dateString,
        dayNum: d,
        isCurrentMonth: true,
        isToday: dateString === todayStr,
        dayInvoices
      });
    }

    // Next month padding to fill grid to 35 or 42
    const totalCells = days.length > 35 ? 42 : 35;
    const remainingCells = totalCells - days.length;
    for (let d = 1; d <= remainingCells; d++) {
      const nextDate = new Date(year, month + 1, d);
      const dateString = nextDate.toISOString().split('T')[0];
      days.push({
        dateString,
        dayNum: d,
        isCurrentMonth: false,
        isToday: false,
        dayInvoices: []
      });
    }

    return days;
  }, [currentCalendarDate, filteredInvoices]);

  // Form Handlers
  const handleAddItemRow = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { partName: '', quantity: 1, unitPrice: 0, totalPrice: 0 }]
    }));
  };

  const handleRemoveItemRow = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const handleItemChange = (idx: number, field: string, val: any) => {
    setFormData(prev => {
      const updated = [...prev.items];
      const item = { ...updated[idx], [field]: val };

      if (field === 'partName') {
        const found = parts.find(p => p.name.toLowerCase() === val.toLowerCase());
        if (found) {
          item.unitPrice = found.purchasePrice || found.price;
        }
      }

      if (field === 'quantity' || field === 'unitPrice') {
        item.totalPrice = Number(item.quantity) * Number(item.unitPrice);
      }

      updated[idx] = item;
      return { ...prev, items: updated };
    });
  };

  const totalCalculatedAmount = useMemo(() => {
    return formData.items.reduce((acc, i) => acc + (Number(i.totalPrice) || 0), 0);
  }, [formData.items]);

  const handleSubmitNewInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplierName) {
      alert('Nama Supplier / Distributor wajib diisi.');
      return;
    }
    if (!formData.dueDate) {
      alert('Tanggal Jatuh Tempo wajib diisi.');
      return;
    }
    if (formData.items.length === 0 || totalCalculatedAmount <= 0) {
      alert('Harap masukkan minimal 1 barang dengan nominal valid.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddInvoice({
        invoiceNumber: formData.invoiceNumber || `INV-DIST-${Date.now().toString().slice(-4)}`,
        supplierName: formData.supplierName,
        supplierId: formData.supplierId || undefined,
        branchName: formData.branchName || 'Bengkel Pusat',
        branchType: formData.branchType,
        totalAmount: totalCalculatedAmount,
        paidAmount: 0,
        remainingAmount: totalCalculatedAmount,
        issueDate: new Date(formData.issueDate).toISOString(),
        dueDate: new Date(formData.dueDate).toISOString(),
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        items: formData.items
      });
      setShowAddModal(false);
      // Reset form
      setFormData({
        invoiceNumber: '',
        supplierName: '',
        supplierId: '',
        branchName: 'Bengkel Pusat',
        branchType: 'Pusat',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0],
        paymentMethod: 'Transfer',
        notes: '',
        items: [{ partName: '', quantity: 1, unitPrice: 0, totalPrice: 0 }]
      });
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan nota tempo baru.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPaymentModal) return;

    if (paymentAmount <= 0) {
      alert('Nominal pembayaran harus lebih dari Rp 0');
      return;
    }

    if (paymentAmount > showPaymentModal.remainingAmount) {
      alert(`Nominal pembayaran melebihi sisa tagihan (Rp ${showPaymentModal.remainingAmount.toLocaleString('id-ID')})`);
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddPayment(showPaymentModal.id, {
        amount: Number(paymentAmount),
        paymentMethod,
        referenceNo: paymentRefNo,
        notes: paymentNotes,
        paymentDate
      });
      setShowPaymentModal(null);
      setPaymentAmount(0);
      setPaymentRefNo('');
      setPaymentNotes('');
    } catch (err) {
      console.error(err);
      alert('Gagal mencatat pembayaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (inv: DistributorInvoice) => {
    const due = new Date(inv.dueDate);
    const isOverdue = due < new Date() && inv.remainingAmount > 0;

    if (inv.status === 'Paid' || inv.remainingAmount === 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Lunas
        </span>
      );
    }
    if (isOverdue || inv.status === 'Overdue') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Overdue Tempo
        </span>
      );
    }
    if (inv.status === 'Partial') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
          <Clock className="w-3.5 h-3.5 text-amber-600" /> Cicilan (Parsial)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
        <Clock className="w-3.5 h-3.5 text-blue-600" /> Belum Lunas
      </span>
    );
  };

  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Nota Tempo Distributor</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-700">Multi-Cabang</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manajemen jadwal pembayaran & jatuh tempo faktur distributor untuk Bengkel Pusat dan Cabang.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Switch View Toggle */}
          <div className="bg-slate-200/80 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                viewMode === 'calendar' ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <CalendarIcon className="w-4 h-4" /> Kalender
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                viewMode === 'table' ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <List className="w-4 h-4" /> Tabel Data
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm shadow-blue-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Tambah Nota Tempo
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Hutang Tempo</span>
            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900">
            Rp {metrics.totalUnpaid.toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Sisa tagihan belum dilunasi</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Lewat Tempo (Overdue)</span>
            <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-rose-600">
            Rp {metrics.totalOverdue.toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-rose-500 font-medium mt-1">Perlu pelunasan segera</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Jatuh Tempo Bulan Ini</span>
            <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-amber-600">
            {metrics.countDueThisMonth} Nota
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Target pembayaran bulan ini</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Total Sudah Dibayar</span>
            <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-emerald-600">
            Rp {metrics.totalPaid.toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Akumulasi pelunasan & DP</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari No. Nota, Nama Supplier, atau Barang..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-500 outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Branch Filter */}
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-all"
            >
              <option value="all">🏢 Semua Cabang Bengkel</option>
              {branchList.map(b => (
                <option key={b} value={b}>{b === 'Bengkel Pusat' ? '⭐ Bengkel Pusat' : `🏪 ${b}`}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-all"
            >
              <option value="all">Semua Status</option>
              <option value="Unpaid">Belum Lunas</option>
              <option value="Partial">Cicilan (Parsial)</option>
              <option value="Overdue">⚠️ Overdue Tempo</option>
              <option value="Paid">✅ Lunas</option>
            </select>
          </div>
        </div>
      </div>

      {/* MAIN VIEW MODE: CALENDAR OR TABLE */}
      {viewMode === 'calendar' ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6 space-y-4">
          {/* Calendar Header Control */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1, 1))}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-black text-slate-900 tracking-tight min-w-[180px] text-center">
                {monthNames[currentCalendarDate.getMonth()]} {currentCalendarDate.getFullYear()}
              </h2>
              <button
                onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 1))}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={() => setCurrentCalendarDate(new Date())}
              className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors"
            >
              Bulan Ini
            </button>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-slate-400 text-xs py-2 border-b border-slate-100">
            <span>Senin</span>
            <span>Selasa</span>
            <span>Rabu</span>
            <span>Kamis</span>
            <span>Jumat</span>
            <span className="text-rose-500">Sabtu</span>
            <span className="text-rose-500">Minggu</span>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((day, idx) => (
              <div
                key={idx}
                onClick={() => {
                  if (day.dayInvoices.length > 0) {
                    setSelectedDayDate(day.dateString);
                  }
                }}
                className={cn(
                  "min-h-[100px] p-2 rounded-xl border transition-all flex flex-col justify-between group",
                  !day.isCurrentMonth ? "bg-slate-50/50 border-slate-100 text-slate-300" : "bg-white border-slate-200 text-slate-700",
                  day.isToday && "ring-2 ring-blue-500 ring-offset-1 border-blue-400 bg-blue-50/20",
                  day.dayInvoices.length > 0 && "cursor-pointer hover:border-blue-300 hover:shadow-md"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "text-xs font-black w-6 h-6 flex items-center justify-center rounded-full",
                    day.isToday ? "bg-blue-600 text-white" : "text-slate-700"
                  )}>
                    {day.dayNum}
                  </span>
                  {day.dayInvoices.length > 0 && (
                    <span className="text-[10px] font-black px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                      {day.dayInvoices.length} Nota
                    </span>
                  )}
                </div>

                {/* Invoices Badges on Cell */}
                <div className="space-y-1 mt-1 flex-1 overflow-hidden">
                  {day.dayInvoices.slice(0, 2).map((inv) => {
                    const isOverdue = new Date(inv.dueDate) < new Date() && inv.remainingAmount > 0;
                    return (
                      <div
                        key={inv.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDetailModal(inv);
                        }}
                        className={cn(
                          "px-1.5 py-1 rounded-lg text-[10px] font-bold border truncate flex items-center justify-between gap-1 transition-all hover:scale-105",
                          inv.status === 'Paid' 
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                            : isOverdue 
                            ? "bg-rose-100 text-rose-900 border-rose-300 animate-pulse" 
                            : "bg-amber-50 text-amber-900 border-amber-200"
                        )}
                        title={`${inv.supplierName} (${inv.branchName}) - Rp ${inv.remainingAmount.toLocaleString('id-ID')}`}
                      >
                        <span className="truncate">{inv.supplierName}</span>
                        <span className="shrink-0 font-extrabold text-[9px]">
                          Rp {(inv.remainingAmount / 1000).toFixed(0)}k
                        </span>
                      </div>
                    );
                  })}
                  {day.dayInvoices.length > 2 && (
                    <div className="text-[9px] font-bold text-slate-500 text-center">
                      +{day.dayInvoices.length - 2} lagi
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Selected Date Drawer/Detail view underneath calendar */}
          {selectedDayDate && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-blue-600" />
                  Tagihan Jatuh Tempo Tanggal: <span className="font-black text-blue-700">{new Date(selectedDayDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </h3>
                <button
                  onClick={() => setSelectedDayDate(null)}
                  className="p-1 hover:bg-slate-200 rounded-lg text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredInvoices
                  .filter(inv => new Date(inv.dueDate).toISOString().split('T')[0] === selectedDayDate)
                  .map(inv => (
                    <div key={inv.id} className="bg-white border border-slate-200 p-3.5 rounded-xl space-y-2 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900">{inv.invoiceNumber}</span>
                        {getStatusBadge(inv)}
                      </div>
                      <p className="text-xs font-bold text-slate-700">{inv.supplierName}</p>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                        <span className="text-slate-500 font-medium">Sisa Tagihan:</span>
                        <span className="font-black text-slate-900">Rp {inv.remainingAmount.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={() => setShowDetailModal(inv)}
                          className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Detail
                        </button>
                        {inv.remainingAmount > 0 && (
                          <button
                            onClick={() => {
                              setShowPaymentModal(inv);
                              setPaymentAmount(inv.remainingAmount);
                            }}
                            className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                          >
                            <DollarSign className="w-3.5 h-3.5" /> Bayar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>
          )}
        </div>
      ) : (
        /* TABLE VIEW MODE */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">No. Nota / PO</th>
                  <th className="py-3.5 px-4">Distributor / Supplier</th>
                  <th className="py-3.5 px-4">Cabang Bengkel</th>
                  <th className="py-3.5 px-4">Tgl. Terbit</th>
                  <th className="py-3.5 px-4">Jatuh Tempo</th>
                  <th className="py-3.5 px-4 text-right">Total Tagihan</th>
                  <th className="py-3.5 px-4 text-right">Sisa Tagihan</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      Tidak ada data nota tempo distributor yang sesuai.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {inv.supplierName}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-bold border",
                          inv.branchName === 'Bengkel Pusat'
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        )}>
                          {inv.branchName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(inv.issueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {new Date(inv.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-600">
                        Rp {inv.totalAmount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900">
                        Rp {inv.remainingAmount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {getStatusBadge(inv)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setShowDetailModal(inv)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                            title="Detail Rincian Nota"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {inv.remainingAmount > 0 && (
                            <button
                              onClick={() => {
                                setShowPaymentModal(inv);
                                setPaymentAmount(inv.remainingAmount);
                              }}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold shadow-sm transition-all"
                              title="Catat Pembayaran"
                            >
                              Bayar
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (confirm(`Hapus nota tempo ${inv.invoiceNumber}?`)) {
                                onDeleteInvoice(inv.id);
                              }
                            }}
                            className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors"
                            title="Hapus Nota"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH NOTA TEMPO DISTRIBUTOR */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-8"
            >
              <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black">Tambah Nota Tempo Distributor</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Catat faktur pascabayar / tempo baru untuk bengkel</p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitNewInvoice} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* No. Nota */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase">No. Nota / Faktur</label>
                    <input
                      type="text"
                      placeholder="e.g. INV-ASTRA-2026-009"
                      value={formData.invoiceNumber}
                      onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500 outline-none"
                    />
                  </div>

                  {/* Distributor / Supplier */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Distributor / Supplier *</label>
                    <input
                      type="text"
                      placeholder="e.g. PT Astra Otoparts"
                      list="suppliers-list"
                      value={formData.supplierName}
                      onChange={(e) => {
                        const name = e.target.value;
                        const match = suppliers.find(s => s.name.toLowerCase() === name.toLowerCase());
                        setFormData({
                          ...formData,
                          supplierName: name,
                          supplierId: match ? match.id : ''
                        });
                      }}
                      className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500 outline-none"
                    />
                    <datalist id="suppliers-list">
                      {suppliers.map(s => <option key={s.id} value={s.name} />)}
                    </datalist>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Cabang Bengkel */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Unit / Cabang Bengkel</label>
                    <input
                      type="text"
                      placeholder="e.g. Bengkel Pusat / Cabang Bandung"
                      value={formData.branchName}
                      onChange={(e) => setFormData({
                        ...formData,
                        branchName: e.target.value,
                        branchType: e.target.value.toLowerCase().includes('pusat') ? 'Pusat' : 'Cabang'
                      })}
                      className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500 outline-none"
                    />
                  </div>

                  {/* Issue Date */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Tgl. Terbit Nota</label>
                    <input
                      type="date"
                      value={formData.issueDate}
                      onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500 outline-none"
                    />
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="text-[11px] font-bold text-rose-600 uppercase">Tgl. Jatuh Tempo *</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-rose-500 outline-none"
                    />
                  </div>
                </div>

                {/* Items Section */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-blue-600" /> Rincian Barang Pembelian
                    </label>
                    <button
                      type="button"
                      onClick={handleAddItemRow}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Baris Barang
                    </button>
                  </div>

                  <div className="space-y-2">
                    {formData.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <input
                          type="text"
                          placeholder="Nama Barang / Suku Cadang"
                          list="parts-list"
                          value={item.partName}
                          onChange={(e) => handleItemChange(idx, 'partName', e.target.value)}
                          className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                        />
                        <datalist id="parts-list">
                          {parts.map(p => <option key={p.id} value={p.name} />)}
                        </datalist>

                        <input
                          type="number"
                          placeholder="Qty"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-16 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 text-center"
                        />

                        <input
                          type="number"
                          placeholder="Harga Satuan"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-28 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 text-right"
                        />

                        <div className="w-28 text-right font-black text-xs text-slate-900 px-1">
                          Rp {(item.totalPrice || 0).toLocaleString('id-ID')}
                        </div>

                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            className="p-1 hover:bg-rose-100 text-rose-500 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-xl">
                    <span className="text-xs font-bold text-blue-900">Total Nominal Tagihan Tempo:</span>
                    <span className="text-base font-black text-blue-950">
                      Rp {totalCalculatedAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Notes & Payment Method */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Rencana Metode Bayar</label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
                    >
                      <option value="Transfer">Bank Transfer</option>
                      <option value="Giro">Giro Mundur</option>
                      <option value="Cash">Tunai / Kasir</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Catatan Tambahan</label>
                    <input
                      type="text"
                      placeholder="e.g. Syarat garansi retur 14 hari"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Nota Tempo'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: CATAT PEMBAYARAN / CICILAN */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-5 bg-blue-600 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black">Catat Pembayaran Nota Tempo</h3>
                  <p className="text-xs text-blue-100 mt-0.5">{showPaymentModal.invoiceNumber} • {showPaymentModal.supplierName}</p>
                </div>
                <button
                  onClick={() => setShowPaymentModal(null)}
                  className="p-1 hover:bg-blue-700 rounded-lg text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitPayment} className="p-6 space-y-4">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Total Tagihan:</span>
                    <span className="font-bold text-slate-800">Rp {showPaymentModal.totalAmount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Sudah Dibayar:</span>
                    <span className="font-bold text-emerald-600">Rp {showPaymentModal.paidAmount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-xs font-black text-slate-900 pt-1 border-t border-slate-200">
                    <span>Sisa Tagihan Tempo:</span>
                    <span className="text-blue-600">Rp {showPaymentModal.remainingAmount.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Nominal Pembayaran (Rp) *</label>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      value={paymentAmount || ''}
                      onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:bg-white focus:border-blue-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(showPaymentModal.remainingAmount)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-700 px-2 py-1 rounded-md"
                    >
                      Pelunasan Total
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Metode Bayar</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
                    >
                      <option value="Transfer">Bank Transfer</option>
                      <option value="Giro">Giro</option>
                      <option value="Cash">Tunai / Kasir</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Tgl. Bayar</label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase">No. Referensi / Bukti Transfer</label>
                  <input
                    type="text"
                    placeholder="e.g. BCA-98210391 / No. Giro"
                    value={paymentRefNo}
                    onChange={(e) => setPaymentRefNo(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Catatan Pembayaran</label>
                  <input
                    type="text"
                    placeholder="e.g. Cicilan tahap 1"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                  >
                    {isSubmitting ? 'Proses...' : 'Simpan Pembayaran'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: DETAIL RINCIAN NOTA & HISTORI PEMBAYARAN */}
      <AnimatePresence>
        {showDetailModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden my-8"
            >
              <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black">{showDetailModal.invoiceNumber}</h3>
                    {getStatusBadge(showDetailModal)}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{showDetailModal.supplierName} • {showDetailModal.branchName}</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(null)}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-3 text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[10px]">Tanggal Terbit</p>
                    <p className="font-bold text-slate-800">{new Date(showDetailModal.issueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="text-rose-500 font-bold uppercase text-[10px]">Tanggal Jatuh Tempo</p>
                    <p className="font-black text-rose-700">{new Date(showDetailModal.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[10px]">Metode Pembayaran Rencana</p>
                    <p className="font-bold text-slate-800">{showDetailModal.paymentMethod || 'Transfer'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[10px]">Catatan</p>
                    <p className="font-semibold text-slate-700">{showDetailModal.notes || '-'}</p>
                  </div>
                </div>

                {/* Items detail */}
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2">Rincian Barang</h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-slate-500 font-bold">
                        <tr>
                          <th className="p-2.5">Nama Barang</th>
                          <th className="p-2.5 text-center">Qty</th>
                          <th className="p-2.5 text-right">Harga Satuan</th>
                          <th className="p-2.5 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {showDetailModal.items && showDetailModal.items.length > 0 ? (
                          showDetailModal.items.map((item, i) => (
                            <tr key={i}>
                              <td className="p-2.5 font-bold text-slate-800">{item.partName}</td>
                              <td className="p-2.5 text-center font-semibold">{item.quantity}</td>
                              <td className="p-2.5 text-right font-medium text-slate-600">Rp {item.unitPrice.toLocaleString('id-ID')}</td>
                              <td className="p-2.5 text-right font-bold text-slate-900">Rp {item.totalPrice.toLocaleString('id-ID')}</td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={4} className="p-4 text-center text-slate-400">Tidak ada rincian barang</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Payments History */}
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2">Riwayat Pembayaran & Cicilan</h4>
                  {showDetailModal.payments && showDetailModal.payments.length > 0 ? (
                    <div className="space-y-2">
                      {showDetailModal.payments.map((p, idx) => (
                        <div key={idx} className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-emerald-950">Rp {p.amount.toLocaleString('id-ID')} ({p.paymentMethod})</p>
                            <p className="text-[10px] text-emerald-700">Ref: {p.referenceNo || '-'} • {p.notes || 'Tanpa catatan'}</p>
                          </div>
                          <span className="text-[11px] font-bold text-emerald-800">
                            {new Date(p.paymentDate).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Belum ada riwayat pembayaran yang dicatat.</p>
                  )}
                </div>

                {/* Amount Summary */}
                <div className="p-4 bg-slate-900 text-white rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Total Tagihan:</span>
                    <span>Rp {showDetailModal.totalAmount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400">
                    <span>Total Dibayar:</span>
                    <span>Rp {showDetailModal.paidAmount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black pt-1.5 border-t border-slate-800 text-white">
                    <span>Sisa Harus Dibayar:</span>
                    <span className="text-amber-400">Rp {showDetailModal.remainingAmount.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setShowDetailModal(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl"
                >
                  Tutup
                </button>
                {showDetailModal.remainingAmount > 0 && (
                  <button
                    onClick={() => {
                      const target = showDetailModal;
                      setShowDetailModal(null);
                      setShowPaymentModal(target);
                      setPaymentAmount(target.remainingAmount);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm"
                  >
                    Catat Pembayaran Sekarang
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
