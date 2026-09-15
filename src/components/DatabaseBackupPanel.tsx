import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Database, Download, Loader2, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

interface DatabaseBackupPanelProps {
  ownerEmail: string;
}

export const DatabaseBackupPanel: React.FC<DatabaseBackupPanelProps> = ({ ownerEmail }) => {
  const [password, setPassword] = useState('');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleBackup = async () => {
    if (!password) {
      setMessage({ type: 'error', text: 'Masukkan password Owner untuk mengunduh backup.' });
      return;
    }
    try {
      setIsBackingUp(true);
      setMessage(null);
      const filename = await api.downloadDatabaseBackup({ email: ownerEmail, password });
      setPassword('');
      setMessage({ type: 'success', text: `Backup berhasil diunduh: ${filename}` });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Gagal membuat backup database.' });
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <section className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">Backup Database PostgreSQL</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Unduh struktur dan seluruh data bengkel sebagai berkas SQL yang mudah diimpor kembali ke PostgreSQL.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-900 leading-relaxed">
            Backup memuat data operasional bengkel. Verifikasi password Owner diwajibkan setiap kali melakukan unduhan.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Password Owner</label>
          <input
            type="password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            onKeyDown={event => { if (event.key === 'Enter') handleBackup(); }}
            autoComplete="current-password"
            placeholder="Masukkan password akun Owner"
            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500 outline-none transition-all"
          />
        </div>

        {message && (
          <div className={`p-3 rounded-xl border text-xs font-bold flex items-start gap-2 ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
            {message.text}
          </div>
        )}

        <button
          type="button"
          onClick={handleBackup}
          disabled={isBackingUp}
          className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
        >
          {isBackingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {isBackingUp ? 'Membuat Backup...' : 'Unduh Backup Database (.sql)'}
        </button>
      </div>

      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-[32px] shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-blue-300">
          <ShieldCheck className="w-5 h-5" />
          <h3 className="text-sm font-black uppercase tracking-wider">Isi Berkas Backup</h3>
        </div>
        <ul className="space-y-3 text-xs text-slate-300">
          <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Struktur tabel, index, dan foreign key</li>
          <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Transaksi, pelanggan, barang, dan riwayat stok</li>
          <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Master kategori, rak, serta gudang</li>
          <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> SQL portable tanpa ketergantungan owner database lama</li>
        </ul>
      </div>
    </section>
  );
};
