import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Wrench, ChevronRight, Loader2, AlertTriangle } from 'lucide-react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthViewProps {
  onLogin: (u: User) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [step, setStep] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [workshopName, setWorkshopName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      let dbUser: User;
      if (step === 'login') {
        dbUser = await api.login({ email, password });
      } else {
        dbUser = await api.register({ workshopName, email, password });
      }
      onLogin(dbUser);
    } catch (err: any) {
      console.error('Auth error:', err);
      setErrorMsg(err.message || 'Gagal masuk. Silakan periksa kredensial Anda.');
    } finally {
      setLoading(false);
    }
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

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-xs font-semibold leading-relaxed mb-6 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-950">Gagal Masuk</p>
              <p className="text-[11px] text-rose-800 mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

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
              Password
            </label>
            <input 
              required type="password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)}
              className="w-full h-14 px-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm font-bold shadow-inner"
            />
          </div>

          {step === 'login' && (
            <div className="space-y-3">
              <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-xl text-[10px] text-blue-800 text-center font-medium leading-relaxed">
                💡 <strong>Kredensial Demo:</strong> Email: <code className="bg-blue-100 px-1 py-0.5 rounded font-mono font-bold">owner@bengkelpro.com</code> atau <code className="bg-blue-100 px-1 py-0.5 rounded font-mono font-bold">admin@bengkelpro.com</code> | Password: <code className="bg-blue-100 px-1 py-0.5 rounded font-mono font-bold">akundemo</code>
              </div>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full h-16 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-widest text-sm shadow-xl shadow-slate-200 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                {step === 'login' ? 'Masuk Sekarang' : 'Daftar Bengkel'} <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {step === 'register' && (
          <div className="mt-8 text-center">
            <button onClick={() => setStep('login')} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">
              Sudah punya akun? Masuk di sini
            </button>
          </div>
        )}
      </motion.div>
      <p className="mt-8 text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">WorkshopPro v3.1.0 • Built for Success</p>
    </div>
  );
};
