import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Wrench, ChevronRight } from 'lucide-react';
import { User, UserRole } from '../types';
import { cn } from '../lib/utils';

interface AuthViewProps {
  onLogin: (u: User) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [step, setStep] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<UserRole>('Owner');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [workshopName, setWorkshopName] = useState('');
  
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    
    onLogin({
      id: 'USR-' + Math.random().toString(36).substr(2, 9),
      name: workshopName || (role === 'Owner' ? 'Bambang Sutrisno' : 'Rian Herlambang'),
      role: step === 'login' ? role : 'Owner',
      email: email || (role === 'Owner' ? 'owner@bengkelpro.com' : 'pic@bengkelpro.com'),
      workshopName: workshopName || 'BengkelPro Mandiri',
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px]">
      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 p-8 sm:p-12 border border-slate-100"
      >
        <div className="space-y-6 text-center mb-10">
          <div className="w-20 h-20 bg-blue-600 rounded-[28px] flex items-center justify-center text-white mx-auto shadow-xl shadow-blue-100">
            <Wrench className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">WorkshopPro</h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">
              Kelola Bengkel Lebih Efisien & Praktis
            </p>
          </div>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          {step === 'register' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nama Bengkel</label>
              <input 
                required type="text" placeholder="Bengkel Maju Jaya"
                value={workshopName} onChange={e => setWorkshopName(e.target.value)}
                className="w-full h-14 px-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-bold shadow-inner"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Alamat Email Bengkel</label>
            <input 
              required type="email" placeholder="pemilik@bengkel.com"
              value={email} onChange={e => setEmail(e.target.value)}
              className="w-full h-14 px-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-bold shadow-inner"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
              {role === 'Owner' ? 'Password Superadmin / Owner' : 'Password Admin / PIC'}
            </label>
            <input 
              required type="password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)}
              className="w-full h-14 px-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-bold shadow-inner"
            />
          </div>

          {step === 'login' && (
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block text-center">Pilih Peran Masuk</label>
              <div className="p-1.5 bg-slate-50 rounded-2xl flex gap-1 border border-slate-100">
                {(['Owner', 'Admin'] as UserRole[]).map((r) => (
                  <button
                    key={r} type="button" onClick={() => setRole(r)}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      role === r ? "bg-white text-blue-600 shadow-md ring-1 ring-slate-100" : "text-slate-400"
                    )}
                  >
                    {r === 'Owner' ? '👑 Superadmin / Owner' : '🛠️ Admin / PIC'}
                  </button>
                ))}
              </div>
              <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-xl text-[10px] text-blue-800 text-center font-medium leading-relaxed">
                💡 <strong>Hak Akses:</strong> <strong>Superadmin/Owner</strong> (akses penuh termasuk laporan & keuangan) dan <strong>Admin/PIC</strong> (operasional kasir POS, antrean servis, mekanik, dan stok suku cadang).
              </div>
            </div>
          )}

          <button 
            type="submit"
            className="w-full h-16 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-widest text-sm shadow-xl shadow-slate-200 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          >
            {step === 'login' ? 'Masuk Sekarang' : 'Daftar Bengkel'} <ChevronRight className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setStep(step === 'login' ? 'register' : 'login')}
            className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
          >
            {step === 'login' ? "Belum punya akun? Buat Akun Bengkel" : "Sudah punya akun? Masuk di sini"}
          </button>
        </div>
      </motion.div>
      <p className="mt-8 text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">WorkshopPro v3.1.0 • Built for Success</p>
    </div>
  );
};
