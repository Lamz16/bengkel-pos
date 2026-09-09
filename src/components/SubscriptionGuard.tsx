import React from 'react';
import { User } from '../types';
import { ShieldAlert } from 'lucide-react';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  user: User | null;
}

export const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ children, user }) => {
  if (!user) return null;
  
  // Jika sudah bayar (bukan Free), langsung lolos
  if (user.subscription.tier !== 'Free') return <>{children}</>;

  // Cek masa trial 3 hari
  const regDate = new Date(user.createdAt);
  const now = new Date();
  const diffTime = now.getTime() - regDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 3) return <>{children}</>;

  return (
    <div className="relative min-h-[400px] flex items-center justify-center p-8 bg-slate-50 rounded-[32px] border border-slate-100 overflow-hidden">
      <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10" />
      <div className="relative z-20 text-center max-w-sm">
        <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600 mx-auto mb-6 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-2">Masa Trial Berakhir</h3>
        <p className="text-sm text-slate-500 font-medium mb-6">
          Masa percobaan 3 hari Anda telah selesai. Silakan berlangganan paket PRO untuk terus menggunakan fitur pengelolaan karyawan dan laporan mendalam.
        </p>
        <button className="w-full h-14 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-200 active:scale-95 transition-all">
          Lihat Pilihan Paket
        </button>
      </div>
      
      {/* Background patterns */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50" />
    </div>
  );
};
