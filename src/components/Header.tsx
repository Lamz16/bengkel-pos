import React from 'react';
import { format } from 'date-fns';
import { Menu, ArrowLeft, Plus, AlertTriangle } from 'lucide-react';
import { User, UserRole } from '../types';
import { cn } from '../lib/utils';

interface HeaderProps {
  activeTab: string;
  showPOSForm: boolean;
  currentUser: User;
  dbStatus?: { connected: boolean; orm: string };
  lowStockCount?: number;
  onOpenLowStockModal?: () => void;
  onOpenMobileMenu: () => void;
  onClosePOSForm: () => void;
  onOpenPOSForm: () => void;
  onSwitchRole: (nextRole: UserRole) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  showPOSForm,
  currentUser,
  dbStatus,
  lowStockCount = 0,
  onOpenLowStockModal,
  onOpenMobileMenu,
  onClosePOSForm,
  onOpenPOSForm,
  onSwitchRole
}) => {
  const getTitle = () => {
    if (showPOSForm) return 'Kasir Baru';
    switch (activeTab) {
      case 'dashboard': return 'Overview';
      case 'pos': return 'Transaksi';
      case 'pos_history': return 'Antrean Servis';
      case 'mechanics': return 'Mekanik & Gaji';
      case 'customers': return 'Pelanggan';
      case 'inventory': return 'Stok Barang';
      case 'suppliers': return 'Pemasok';
      case 'expenses': return 'Pengeluaran';
      case 'reports': return 'Laporan';
      case 'staff': return 'Pengguna';
      case 'settings': return 'Pengaturan';
      default: return activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 z-30">
      <div className="flex items-center gap-3">
        {!showPOSForm ? (
          <button 
            onClick={onOpenMobileMenu}
            aria-label="Buka Menu"
            className="p-2 -ml-2 text-slate-500 lg:hidden"
          >
            <Menu className="w-6 h-6" />
          </button>
        ) : (
          <button 
            onClick={onClosePOSForm} 
            aria-label="Kembali"
            className="p-2 rounded-full hover:bg-slate-100 lg:hidden"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
        )}
        <div>
          <h2 className="text-lg font-bold text-slate-900 leading-tight">
            {getTitle()}
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{format(new Date(), 'EEEE, d MMMM')}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {lowStockCount > 0 && onOpenLowStockModal && (
          <button
            onClick={onOpenLowStockModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-black transition-all shadow-2xs animate-pulse"
            title={`Terdapat ${lowStockCount} barang stok menipis/habis. Klik untuk membuka monitoring.`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Stok Menipis ({lowStockCount})</span>
          </button>
        )}

        {dbStatus && (
          <div 
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide border border-slate-200 bg-slate-50 text-slate-700"
            title={dbStatus.connected ? "Database PostgreSQL aktif via Prisma ORM" : "Mode Fallback Data (Siap terhubung ke PostgreSQL lokal via Prisma)"}
          >
            <span className={cn("w-2 h-2 rounded-full", dbStatus.connected ? "bg-emerald-500 animate-pulse" : "bg-emerald-600")} />
            <span>PostgreSQL (Prisma)</span>
          </div>
        )}

        <button
          onClick={() => {
            const nextRole: UserRole = currentUser.role === 'Owner' ? 'Admin' : 'Owner';
            onSwitchRole(nextRole);
          }}
          className={cn(
            "hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider border transition-all shadow-sm active:scale-95",
            currentUser.role === 'Owner'
              ? "bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100"
              : "bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100"
          )}
          title="Ganti peran instan untuk pengujian (Superadmin/Owner <-> Admin/PIC)"
        >
          <span>{currentUser.role === 'Owner' ? '👑 Superadmin' : '🛠️ Admin PIC'}</span>
          <span className="text-[9px] opacity-60 font-semibold">(Ganti)</span>
        </button>

        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden hidden sm:block">
           <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`} alt="avatar" />
        </div>
      </div>
    </header>
  );
};
