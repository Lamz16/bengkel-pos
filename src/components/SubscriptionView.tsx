import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { Sparkles, ShieldCheck, Clock, Users, Wallet, LogOut } from 'lucide-react';
import { User } from '../types';
import { cn } from '../lib/utils';

interface SubscriptionViewProps {
  user: User;
  onNavigate: (tab: string) => void;
  onLogout: () => void;
}

export const SubscriptionView: React.FC<SubscriptionViewProps> = ({ user, onNavigate, onLogout }) => {
  const isTrial = useMemo(() => {
    if (user.subscription.tier !== 'Free') return false;
    const regDate = new Date(user.createdAt);
    const now = new Date();
    const diffTime = now.getTime() - regDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays < 3;
  }, [user]);

  return (
    <div className="space-y-6 pb-20">
      <div className={cn(
        "p-8 rounded-[40px] text-white shadow-xl relative overflow-hidden",
        isTrial ? "bg-emerald-600 shadow-emerald-100" : "bg-blue-600 shadow-blue-100"
      )}>
        <Sparkles className="absolute right-[-20px] top-[-20px] w-48 h-48 opacity-10 rotate-12" />
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Status Paket</p>
              <h3 className="text-3xl font-black">
                {isTrial ? "MASA TRIAL" : user.subscription.tier.toUpperCase()}
              </h3>
            </div>
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
              {isTrial ? <Sparkles className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm font-bold opacity-80">
            <Clock className="w-4 h-4" /> 
            {isTrial ? "Trial berakhir 3 hari dari pendaftaran" : `Berlaku hingga ${format(new Date(user.subscription.expiryDate), 'd MMMM yyyy')}`}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Pengaturan Bengkel</h4>
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 flex items-center justify-between border-b border-slate-50">
            <div>
              <p className="text-xs font-bold text-slate-900">Push Notifications</p>
              <p className="text-[10px] text-slate-400 font-medium">Service ready alerts to customers</p>
            </div>
            <div className="w-10 h-6 bg-emerald-500 rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
            </div>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900">Auto Backup</p>
              <p className="text-[10px] text-slate-400 font-medium">Daily cloud transaction sync</p>
            </div>
            <div className="w-10 h-6 bg-slate-200 rounded-full relative">
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => onNavigate('staff')}
          className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center gap-3 text-center active:scale-95 transition-all"
        >
          <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 underline underline-offset-4">Akses Karyawan</span>
        </button>
        <button className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center gap-3 text-center active:scale-95 transition-all">
          <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
            <Wallet className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 underline underline-offset-4">Info Tagihan</span>
        </button>
      </div>

      <button 
        onClick={onLogout}
        className="w-full h-16 border-2 border-slate-100 rounded-2xl flex items-center justify-center gap-2 text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all active:scale-95"
      >
        <LogOut className="w-4 h-4" />
        <span className="text-xs font-black uppercase tracking-widest">Logout dari Akun</span>
      </button>
    </div>
  );
};
