import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Copy, Download, RefreshCw, XCircle } from 'lucide-react';
import { api } from '../services/api';

type LogRow = { id: string; createdAt: string; userName?: string | null; role?: string | null; action: string; statusCode: number; success: boolean; description: string; technicalDetail?: string | null };
type Page = { page: number; totalPages: number; total: number };

const toText = (logs: LogRow[]) => ['BENGKEL POS - LOG AKTIVITAS TEKNIS', `Diekspor: ${new Date().toISOString()}`, '', ...logs.flatMap(log => {
  let technical = log.technicalDetail || '-';
  try { technical = log.technicalDetail ? JSON.stringify(JSON.parse(log.technicalDetail), null, 2) : '-'; } catch { /* keep original */ }
  return ['='.repeat(88), `Waktu       : ${new Date(log.createdAt).toISOString()}`, `ID Log      : ${log.id}`, `Pengguna    : ${log.userName || 'Sistem'}`, `Role        : ${log.role || '-'}`, `Tindakan    : ${log.action}`, `Status      : ${log.statusCode} (${log.success ? 'BERHASIL' : 'GAGAL'})`, `Keterangan  : ${log.description}`, 'Detail teknis:', technical, ''];
})].join('\n');

const downloadText = (text: string, name: string) => {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click();
  URL.revokeObjectURL(url);
};

export const ActivityLogView = () => {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [page, setPage] = useState<Page>({ page: 1, totalPages: 1, total: 0 });
  const [filter, setFilter] = useState<'all' | 'success' | 'error'>('all');
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const load = async (nextPage = 1) => { setLoading(true); try { const result = await api.getActivityLogs({ page: nextPage, status: filter }); setRows(result.data); setPage(result.pagination); setSelected([]); } finally { setLoading(false); } };
  useEffect(() => { void load(1); }, [filter]);
  const selectedRows = useMemo(() => rows.filter(row => selected.includes(row.id)), [rows, selected]);
  const downloadAll = async () => { setLoading(true); try { const blob = await api.exportActivityLogs(filter); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `bengkel-pos-log-${filter}.txt`; anchor.click(); URL.revokeObjectURL(url); } finally { setLoading(false); } };

  return <div className="space-y-5">
    <div className="bg-white border border-slate-100 rounded-3xl p-5 flex flex-wrap justify-between gap-4"><div><h2 className="font-black text-slate-900">Log Aktivitas Sistem</h2><p className="text-xs text-slate-500 mt-1">Riwayat tindakan dari penggunaan aplikasi, termasuk respons berhasil dan gagal.</p></div><div className="flex flex-wrap gap-2"><select value={filter} onChange={e => setFilter(e.target.value as typeof filter)} className="rounded-xl border border-slate-200 px-3 text-xs font-bold"><option value="all">Semua</option><option value="success">Berhasil</option><option value="error">Gagal</option></select><button onClick={() => void downloadAll()} disabled={loading} className="inline-flex items-center gap-1 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 disabled:opacity-40"><Download className="w-4 h-4"/> Ekspor filter</button><button onClick={() => downloadText(toText(selectedRows), `bengkel-pos-log-terpilih-${Date.now()}.txt`)} disabled={selectedRows.length === 0} className="inline-flex items-center gap-1 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 disabled:opacity-40"><Download className="w-4 h-4"/> Ekspor ({selectedRows.length})</button><button onClick={() => void load(page.page)} className="p-3 rounded-xl border border-slate-200 text-slate-600" aria-label="Muat ulang"><RefreshCw className={loading ? 'w-4 h-4 animate-spin' : 'w-4 h-4'} /></button></div></div>
    <div className="overflow-x-auto bg-white border border-slate-100 rounded-3xl"><table className="w-full min-w-[1010px] text-left"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="p-4"><input type="checkbox" aria-label="Pilih semua log di halaman" checked={rows.length > 0 && selected.length === rows.length} onChange={e => setSelected(e.target.checked ? rows.map(row => row.id) : [])}/></th><th className="p-4">Waktu</th><th className="p-4">Role / pengguna</th><th className="p-4">Tindakan</th><th className="p-4">Status</th><th className="p-4">Keterangan</th><th className="p-4">Teknis</th></tr></thead><tbody>{rows.map(row => <tr key={row.id} className="border-t border-slate-100 text-xs"><td className="p-4"><input type="checkbox" aria-label={`Pilih log ${row.id}`} checked={selected.includes(row.id)} onChange={e => setSelected(current => e.target.checked ? [...current, row.id] : current.filter(id => id !== row.id))}/></td><td className="p-4 whitespace-nowrap text-slate-500">{new Date(row.createdAt).toLocaleString('id-ID')}</td><td className="p-4"><p className="font-bold text-slate-800">{row.userName || 'Sistem'}</p><p className="text-[10px] text-slate-400">{row.role || '-'}</p></td><td className="p-4 font-mono text-slate-600">{row.action}</td><td className="p-4"><span className={row.success ? 'inline-flex gap-1 items-center text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg font-bold' : 'inline-flex gap-1 items-center text-rose-700 bg-rose-50 px-2 py-1 rounded-lg font-bold'}>{row.success ? <CheckCircle2 className="w-3.5 h-3.5"/> : <XCircle className="w-3.5 h-3.5"/>}{row.statusCode}</span></td><td className="p-4 text-slate-600 max-w-[320px]">{row.description}</td><td className="p-4 flex gap-1"><button disabled={!row.technicalDetail} onClick={() => row.technicalDetail && navigator.clipboard.writeText(row.technicalDetail)} className="inline-flex items-center gap-1 px-2 py-1 border rounded-lg text-slate-600 disabled:opacity-40"><Copy className="w-3.5 h-3.5"/> Salin</button><button onClick={() => downloadText(toText([row]), `bengkel-pos-log-${row.id}.txt`)} className="inline-flex items-center gap-1 px-2 py-1 border rounded-lg text-slate-600"><Download className="w-3.5 h-3.5"/> .txt</button></td></tr>)}{!loading && rows.length === 0 && <tr><td colSpan={7} className="p-12 text-center text-slate-400">Belum ada log aktivitas.</td></tr>}</tbody></table></div>
    <div className="flex items-center justify-between text-xs text-slate-500"><span>{page.total} log</span><div className="flex gap-2"><button disabled={page.page <= 1 || loading} onClick={() => void load(page.page - 1)} className="p-2 border rounded-lg disabled:opacity-40"><ChevronLeft className="w-4 h-4"/></button><span className="py-2">Halaman {page.page}/{page.totalPages}</span><button disabled={page.page >= page.totalPages || loading} onClick={() => void load(page.page + 1)} className="p-2 border rounded-lg disabled:opacity-40"><ChevronRight className="w-4 h-4"/></button></div></div>
  </div>;
};
