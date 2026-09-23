import React, { useEffect, useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, RefreshCw, XCircle } from 'lucide-react';
import { api } from '../services/api';

type LogRow = { id: string; createdAt: string; userName?: string | null; role?: string | null; action: string; statusCode: number; success: boolean; description: string };
type Page = { page: number; totalPages: number; total: number };

export const ActivityLogView = () => {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [page, setPage] = useState<Page>({ page: 1, totalPages: 1, total: 0 });
  const [filter, setFilter] = useState<'all' | 'success' | 'error'>('all');
  const [loading, setLoading] = useState(false);

  const load = async (nextPage = 1) => {
    setLoading(true);
    try {
      const result = await api.getActivityLogs({ page: nextPage, status: filter });
      setRows(result.data);
      setPage(result.pagination);
    } finally { setLoading(false); }
  };
  useEffect(() => { void load(1); }, [filter]);

  return <div className="space-y-5">
    <div className="bg-white border border-slate-100 rounded-3xl p-5 flex flex-wrap justify-between gap-4">
      <div><h2 className="font-black text-slate-900">Log Aktivitas Sistem</h2><p className="text-xs text-slate-500 mt-1">Riwayat tindakan dari penggunaan aplikasi, termasuk respons berhasil dan gagal.</p></div>
      <div className="flex gap-2">
        <select value={filter} onChange={e => setFilter(e.target.value as typeof filter)} className="rounded-xl border border-slate-200 px-3 text-xs font-bold"><option value="all">Semua</option><option value="success">Berhasil</option><option value="error">Gagal</option></select>
        <button onClick={() => void load(page.page)} className="p-3 rounded-xl border border-slate-200 text-slate-600" aria-label="Muat ulang"><RefreshCw className={loading ? 'w-4 h-4 animate-spin' : 'w-4 h-4'} /></button>
      </div>
    </div>
    <div className="overflow-x-auto bg-white border border-slate-100 rounded-3xl">
      <table className="w-full min-w-[850px] text-left"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="p-4">Waktu</th><th className="p-4">Role / pengguna</th><th className="p-4">Tindakan</th><th className="p-4">Status</th><th className="p-4">Keterangan</th></tr></thead>
        <tbody>{rows.map(row => <tr key={row.id} className="border-t border-slate-100 text-xs"><td className="p-4 whitespace-nowrap text-slate-500">{new Date(row.createdAt).toLocaleString('id-ID')}</td><td className="p-4"><p className="font-bold text-slate-800">{row.userName || 'Sistem'}</p><p className="text-[10px] text-slate-400">{row.role || '-'}</p></td><td className="p-4 font-mono text-slate-600">{row.action}</td><td className="p-4"><span className={row.success ? 'inline-flex gap-1 items-center text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg font-bold' : 'inline-flex gap-1 items-center text-rose-700 bg-rose-50 px-2 py-1 rounded-lg font-bold'}>{row.success ? <CheckCircle2 className="w-3.5 h-3.5"/> : <XCircle className="w-3.5 h-3.5"/>}{row.statusCode}</span></td><td className="p-4 text-slate-600 max-w-[320px]">{row.description}</td></tr>)}
          {!loading && rows.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-slate-400">Belum ada log aktivitas.</td></tr>}</tbody></table>
    </div>
    <div className="flex items-center justify-between text-xs text-slate-500"><span>{page.total} log</span><div className="flex gap-2"><button disabled={page.page <= 1 || loading} onClick={() => void load(page.page - 1)} className="p-2 border rounded-lg disabled:opacity-40"><ChevronLeft className="w-4 h-4"/></button><span className="py-2">Halaman {page.page}/{page.totalPages}</span><button disabled={page.page >= page.totalPages || loading} onClick={() => void load(page.page + 1)} className="p-2 border rounded-lg disabled:opacity-40"><ChevronRight className="w-4 h-4"/></button></div></div>
  </div>;
};
