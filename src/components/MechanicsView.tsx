import React, { useState, useMemo } from 'react';
import { Mechanic, WorkshopService, MechanicDeduction } from '../types';
import { cn } from '../lib/utils';
import { 
  Wrench, 
  Users, 
  DollarSign, 
  AlertTriangle, 
  UserX, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  CheckCircle2, 
  Percent, 
  Calendar, 
  ShieldAlert, 
  FileText,
  UserCheck,
  TrendingUp,
  Clock,
  Car
} from 'lucide-react';
import { format } from 'date-fns';

interface MechanicsViewProps {
  mechanics: Mechanic[];
  services: WorkshopService[];
  deductions: MechanicDeduction[];
  onAddMechanic: () => void;
  onEditMechanic: (m: Mechanic) => void;
  onDeleteMechanic: (id: string) => void;
  onAddDeduction: () => void;
  onDeleteDeduction: (id: string) => void;
}

export const MechanicsView: React.FC<MechanicsViewProps> = ({
  mechanics,
  services,
  deductions,
  onAddMechanic,
  onEditMechanic,
  onDeleteMechanic,
  onAddDeduction,
  onDeleteDeduction
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'data' | 'payroll'>('data');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMechanicFilter, setSelectedMechanicFilter] = useState<string>('all');

  // Filtered mechanics for Data tab
  const filteredMechanics = useMemo(() => {
    return mechanics.filter(m => 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone.includes(searchTerm)
    );
  }, [mechanics, searchTerm]);

  // Calculations for Payroll Tab
  const activeMechanics = useMemo(() => mechanics.filter(m => m.status === 'Active'), [mechanics]);

  const payrollData = useMemo(() => {
    const targetMechanics = selectedMechanicFilter === 'all' 
      ? mechanics 
      : mechanics.filter(m => m.id === selectedMechanicFilter);

    // Completed services matching filter
    const completedServices = services.filter(s => 
      s.status === 'Done' && 
      s.mechanicId && 
      (selectedMechanicFilter === 'all' || s.mechanicId === selectedMechanicFilter)
    );

    // Deductions matching filter
    const filteredDeductions = deductions.filter(d => 
      selectedMechanicFilter === 'all' || d.mechanicId === selectedMechanicFilter
    );

    // Total base salary
    const totalBaseSalary = targetMechanics.reduce((sum, m) => sum + m.dailySalary, 0);

    // Total bonus
    const totalBonus = completedServices.reduce((sum, s) => {
      const bonus = s.mechanicBonusAmount !== undefined 
        ? s.mechanicBonusAmount 
        : Math.round(((s.laborFee || 0) * (s.mechanicBonusPercent || 0)) / 100);
      return sum + bonus;
    }, 0);

    // Total deductions
    const totalDeductionAmount = filteredDeductions.reduce((sum, d) => sum + d.amount, 0);

    // Warranty complaints count
    const warrantyClaimsCount = completedServices.filter(s => s.hasWarrantyClaim).length;

    // Take-home pay
    const takeHomePay = Math.max(0, totalBaseSalary + totalBonus - totalDeductionAmount);

    return {
      targetMechanics,
      completedServices,
      filteredDeductions,
      totalBaseSalary,
      totalBonus,
      totalDeductionAmount,
      warrantyClaimsCount,
      takeHomePay
    };
  }, [mechanics, services, deductions, selectedMechanicFilter]);

  // Overall statistics for top summary
  const overallCompletedCount = useMemo(() => 
    services.filter(s => s.status === 'Done' && s.mechanicId).length,
  [services]);

  const avgBonusPercent = useMemo(() => {
    if (mechanics.length === 0) return 0;
    const sum = mechanics.reduce((acc, m) => acc + m.defaultBonusPercent, 0);
    return Math.round(sum / mechanics.length);
  }, [mechanics]);

  return (
    <div className="space-y-6 pb-24">
      {/* Header & Subtabs */}
      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100">
                Sistem Tenaga Lapangan
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
                Non-Login User
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900">Manajemen Mekanik & Penggajian</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Kelola data teknisi bengkel, persentase bonus per transaksi servis motor, dan penalti potong gaji jika terjadi komplain garansi atau ketidakhadiran.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl shrink-0 self-start md:self-auto">
            <button
              onClick={() => setActiveSubTab('data')}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                activeSubTab === 'data' 
                  ? "bg-white text-blue-600 shadow-md ring-1 ring-slate-100" 
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              Data Mekanik ({mechanics.length})
            </button>
            <button
              onClick={() => setActiveSubTab('payroll')}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                activeSubTab === 'payroll' 
                  ? "bg-white text-blue-600 shadow-md ring-1 ring-slate-100" 
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              Rekap Bonus & Gaji
            </button>
          </div>
        </div>

        {/* Notice Info Box */}
        <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-start gap-3">
          <div className="w-7 h-7 bg-blue-600 text-white rounded-xl flex items-center justify-center shrink-0 mt-0.5">
            <Wrench className="w-4 h-4" />
          </div>
          <div className="text-xs text-blue-900 leading-relaxed">
            <p className="font-bold">Ketentuan Akses Mekanik:</p>
            <p className="text-[11px] text-blue-800/80">
              Mekanik tidak perlu melakukan login atau penginputan ke aplikasi. PIC / Kasir / Admin yang bertugas mencatat transaksi servis motor dengan memilih mekanik pelaksana, menyesuaikan persentase bonus pengerjaan, dan menerapkan sanksi potongan gaji bila terjadi komplain servis ulang atau mangkir kerja.
            </p>
          </div>
        </div>
      </div>

      {/* SUBTAB 1: DATA MEKANIK */}
      {activeSubTab === 'data' && (
        <div className="space-y-4">
          {/* Top Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Mekanik Aktif</span>
              <p className="text-xl font-black text-slate-900 mt-1">{activeMechanics.length} / {mechanics.length}</p>
              <span className="text-[10px] font-bold text-emerald-600">Siap Ditugaskan</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Rata-Rata Bonus</span>
              <p className="text-xl font-black text-blue-600 mt-1">{avgBonusPercent}%</p>
              <span className="text-[10px] font-bold text-slate-400">Dari Jasa Servis</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Servis Selesai</span>
              <p className="text-xl font-black text-slate-900 mt-1">{overallCompletedCount}</p>
              <span className="text-[10px] font-bold text-emerald-600">Pengerjaan Tuntas</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Denda Garansi Default</span>
              <p className="text-xl font-black text-rose-600 mt-1">Rp 50.000</p>
              <span className="text-[10px] font-bold text-rose-500">Per Komplain Ulang</span>
            </div>
          </div>

          {/* Search & Add Button Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Cari mekanik berdasarkan nama, keahlian, atau nomor HP..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full h-12 pl-11 pr-4 bg-white border border-slate-100 rounded-2xl outline-none text-xs font-bold shadow-sm"
              />
            </div>
            <button
              onClick={onAddMechanic}
              className="w-full sm:w-auto h-12 px-6 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-wider text-xs shadow-lg shadow-blue-200 hover:bg-blue-700 flex items-center justify-center gap-2 shrink-0 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" /> Tambah Mekanik Baru
            </button>
          </div>

          {/* Mechanics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMechanics.map(m => {
              // Individual stats for this mechanic
              const mecCompletedServices = services.filter(s => s.mechanicId === m.id && s.status === 'Done');
              const mecTotalBonus = mecCompletedServices.reduce((sum, s) => {
                return sum + (s.mechanicBonusAmount !== undefined 
                  ? s.mechanicBonusAmount 
                  : Math.round(((s.laborFee || 0) * (s.mechanicBonusPercent || 0)) / 100));
              }, 0);
              const mecWarrantyClaims = mecCompletedServices.filter(s => s.hasWarrantyClaim).length;
              const mecDeductions = deductions.filter(d => d.mechanicId === m.id).reduce((sum, d) => sum + d.amount, 0);

              return (
                <div 
                  key={m.id}
                  className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-200 transition-all"
                >
                  <div>
                    {/* Header: Name & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 font-black text-sm flex items-center justify-center shadow-inner border border-blue-100">
                          {m.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">{m.name}</h3>
                          <p className="text-[10px] text-blue-600 font-black uppercase tracking-wider">{m.specialty}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{m.phone || '-'}</p>
                        </div>
                      </div>
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider",
                        m.status === 'Active' 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                          : "bg-slate-100 text-slate-500"
                      )}>
                        {m.status === 'Active' ? 'Aktif' : 'Non-Aktif'}
                      </span>
                    </div>

                    {/* Key Policies Config */}
                    <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Persentase Bonus</span>
                        <span className="font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                          {m.defaultBonusPercent}% Jasa
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Gaji Pokok Harian</span>
                        <span className="font-bold text-slate-800">Rp {m.dailySalary.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200/60">
                        <span className="text-[10px] font-bold text-rose-500 uppercase">Denda Komplain Garansi</span>
                        <span className="font-bold text-rose-600">-Rp {m.warrantyPenaltyAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[10px] font-bold text-rose-500 uppercase">Denda Absen H+1</span>
                        <span className="font-bold text-rose-600">-Rp {m.absencePenaltyAmount.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Performance Summary Pill */}
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 bg-slate-50 rounded-xl">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Motor Selesai</p>
                        <p className="text-xs font-black text-slate-900 mt-0.5">{mecCompletedServices.length}</p>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-xl">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Bonus Didapat</p>
                        <p className="text-xs font-black text-emerald-600 mt-0.5">Rp {(mecTotalBonus / 1000).toFixed(0)}k</p>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-xl">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Garansi/Absen</p>
                        <p className={cn(
                          "text-xs font-black mt-0.5",
                          mecWarrantyClaims > 0 ? "text-rose-600" : "text-slate-400"
                        )}>
                          {mecWarrantyClaims} Kasus
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center gap-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setSelectedMechanicFilter(m.id);
                        setActiveSubTab('payroll');
                      }}
                      className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-blue-100 transition-colors"
                    >
                      Lihat Rekap Gaji
                    </button>
                    <button
                      onClick={() => onEditMechanic(m)}
                      className="p-2 bg-slate-50 text-slate-500 hover:text-blue-600 rounded-xl transition-colors"
                      title="Edit Mekanik"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteMechanic(m.id)}
                      className="p-2 bg-slate-50 text-slate-400 hover:text-rose-600 rounded-xl transition-colors"
                      title="Hapus Mekanik"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredMechanics.length === 0 && (
            <div className="bg-white p-12 text-center rounded-[32px] border border-slate-100 shadow-sm">
              <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-bold text-slate-600">Tidak ada data mekanik yang cocok</p>
              <p className="text-xs text-slate-400 mt-1">Gunakan tombol "Tambah Mekanik Baru" untuk mendaftarkan tenaga teknisi Anda.</p>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: REKAP GAJI & BONUS (PAYROLL) */}
      {activeSubTab === 'payroll' && (
        <div className="space-y-6">
          {/* Filter Bar & Manual Action */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 whitespace-nowrap">
                Pilih Mekanik:
              </label>
              <select
                value={selectedMechanicFilter}
                onChange={e => setSelectedMechanicFilter(e.target.value)}
                className="h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold text-slate-900 w-full sm:w-64"
              >
                <option value="all">Semua Mekanik ({mechanics.length})</option>
                {mechanics.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.defaultBonusPercent}% Bonus)
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onAddDeduction}
              className="w-full sm:w-auto h-11 px-4 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
            >
              <AlertTriangle className="w-4 h-4 text-rose-600" /> Catat Potongan / Absen Manual
            </button>
          </div>

          {/* 4 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider">Gaji Pokok / Dasar</span>
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">
                Rp {payrollData.totalBaseSalary.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-400 font-bold mt-1">
                {selectedMechanicFilter === 'all' ? 'Total semua mekanik terdaftar' : 'Gaji pokok teknisi'}
              </p>
            </div>

            <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider">Akumulasi Bonus Servis</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-emerald-600">
                +Rp {payrollData.totalBonus.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-400 font-bold mt-1">
                Dari {payrollData.completedServices.length} motor selesai diservis
              </p>
            </div>

            <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider">Potongan Garansi & Absen</span>
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>
              <p className="text-2xl font-black text-rose-600">
                -Rp {payrollData.totalDeductionAmount.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-400 font-bold mt-1">
                {payrollData.filteredDeductions.length} catatan komplain / ketidakhadiran
              </p>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-[24px] shadow-lg shadow-slate-200">
              <div className="flex items-center justify-between text-slate-300 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-300">Take Home Pay (Gaji Bersih)</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-emerald-400">
                Rp {payrollData.takeHomePay.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-300 font-medium mt-1">
                Gaji Pokok + Bonus Servis - Potongan
              </p>
            </div>
          </div>

          {/* Section 1: Completed Services & Bonus Breakdown */}
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Rincian Pengerjaan Motor Selesai & Perolehan Bonus
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Daftar servis motor yang berhasil diselesaikan dan perhitungan bonus persentase mekanik.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-400">
                {payrollData.completedServices.length} Transaksi
              </span>
            </div>

            <div className="space-y-3">
              {payrollData.completedServices.map(service => {
                const bonus = service.mechanicBonusAmount !== undefined 
                  ? service.mechanicBonusAmount 
                  : Math.round(((service.laborFee || 0) * (service.mechanicBonusPercent || 0)) / 100);

                return (
                  <div 
                    key={service.id}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-mono font-black text-xs shrink-0">
                        {service.vehiclePlate.slice(-2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{service.vehicleModel}</span>
                          <span className="font-mono text-[10px] bg-slate-200 px-2 py-0.5 rounded font-bold uppercase text-slate-700">
                            {service.vehiclePlate}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span>Pelanggan: <strong className="text-slate-700">{service.customerName}</strong></span>
                          <span>•</span>
                          <span>Mekanik: <strong className="text-blue-600">{service.mechanicName || 'Mekanik'}</strong></span>
                          <span>•</span>
                          <span>{format(new Date(service.createdAt), 'dd/MM/yyyy')}</span>
                        </div>
                        {service.hasWarrantyClaim && (
                          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-black text-rose-700 bg-rose-100/80 px-2.5 py-1 rounded-lg w-fit">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Klaim Garansi Ulang: {service.warrantyClaimReason}</span>
                            {service.isMechanicAbsentOnClaim && (
                              <span className="bg-rose-600 text-white px-1.5 py-0.2 rounded text-[9px] uppercase ml-1">Mangkir H+1</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Jasa: Rp {(service.laborFee || 0).toLocaleString()}</p>
                      <p className="text-sm font-black text-emerald-600 mt-0.5">
                        +Rp {bonus.toLocaleString()}
                        <span className="text-[10px] font-bold text-slate-400 ml-1">({service.mechanicBonusPercent || 0}%)</span>
                      </p>
                    </div>
                  </div>
                );
              })}

              {payrollData.completedServices.length === 0 && (
                <div className="py-8 text-center text-slate-400">
                  <p className="text-xs font-bold uppercase tracking-wider">Belum ada servis selesai untuk filter ini</p>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Deductions & Penalties Breakdown */}
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-rose-700 uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  Rincian Sanksi Potong Gaji (Garansi & Ketidakhadiran)
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Rekap penalti potongan gaji mekanik akibat komplain servis ulang atau tidak hadir di hari berikutnya.
                </p>
              </div>
              <button
                onClick={onAddDeduction}
                className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Sanksi
              </button>
            </div>

            <div className="space-y-3">
              {payrollData.filteredDeductions.map(ded => (
                <div 
                  key={ded.id}
                  className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                        ded.type === 'Warranty_Complaint' ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                      )}>
                        {ded.type === 'Warranty_Complaint' ? 'Komplain Garansi Servis' : ded.type === 'Absence' ? 'Tidak Masuk / Absen' : 'Penalti'}
                      </span>
                      <span className="font-bold text-xs text-slate-900">{ded.mechanicName}</span>
                      {ded.vehiclePlate && (
                        <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-rose-200">
                          {ded.vehiclePlate}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-rose-950 font-medium">{ded.reason}</p>
                    <div className="flex items-center gap-2 text-[10px] text-rose-700 font-bold">
                      <Calendar className="w-3 h-3" />
                      <span>{format(new Date(ded.date), 'dd MMMM yyyy')}</span>
                      {ded.isAbsentNextDay && (
                        <span className="bg-rose-600 text-white px-2 py-0.5 rounded-full text-[9px] uppercase font-black">
                          ⚠️ Mekanik Mangkir H+1
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-rose-100">
                    <span className="text-base font-black text-rose-600">
                      -Rp {ded.amount.toLocaleString()}
                    </span>
                    <button
                      onClick={() => onDeleteDeduction(ded.id)}
                      className="p-2 text-rose-400 hover:text-rose-700 hover:bg-rose-100 rounded-xl transition-colors"
                      title="Batalkan Sanksi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {payrollData.filteredDeductions.length === 0 && (
                <div className="py-8 text-center text-slate-400">
                  <p className="text-xs font-bold uppercase tracking-wider">Tidak ada catatan sanksi potong gaji</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
