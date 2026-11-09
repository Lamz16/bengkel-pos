import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { 
  FileText, 
  Trash2, 
  ArrowRight, 
  Search, 
  Wrench, 
  ShoppingBag, 
  Clock, 
  Car, 
  User, 
  DollarSign, 
  AlertCircle 
} from 'lucide-react';
import { TransactionDraft } from '../types';
import { Modal } from './Modal';
import { cn } from '../lib/utils';

interface DraftTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  drafts: TransactionDraft[];
  onResumeDraft: (draft: TransactionDraft) => void;
  onDeleteDraft: (id: string) => Promise<void>;
}

export const DraftTransactionsModal: React.FC<DraftTransactionsModalProps> = ({
  isOpen,
  onClose,
  drafts,
  onResumeDraft,
  onDeleteDraft,
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'SERVICE' | 'SALE'>('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredDrafts = useMemo(() => {
    return drafts.filter(d => {
      const matchType = filterType === 'ALL' || d.receiptType === filterType;
      if (!matchType) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        d.draftCode.toLowerCase().includes(q) ||
        d.customerName.toLowerCase().includes(q) ||
        (d.customerPhone && d.customerPhone.toLowerCase().includes(q)) ||
        (d.vehiclePlate && d.vehiclePlate.toLowerCase().includes(q)) ||
        (d.vehicleModel && d.vehicleModel.toLowerCase().includes(q)) ||
        (d.note && d.note.toLowerCase().includes(q))
      );
    });
  }, [drafts, search, filterType]);

  const handleDelete = async (e: React.MouseEvent, id: string, code: string) => {
    e.stopPropagation();
    if (!window.confirm(`Hapus draft transaksi ${code}? Tindakan ini tidak dapat dibatalkan.`)) return;
    setDeletingId(id);
    try {
      await onDeleteDraft(id);
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <span>Draft Transaksi Tertahan</span>
          <span className="text-xs bg-blue-100 text-blue-700 font-black px-2 py-0.5 rounded-full">
            {drafts.length} Tersimpan
          </span>
        </div>
      }
      onClose={onClose}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Search & Type Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari draft: nama, plat nomor, kode draft..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-bold shrink-0">
            <button
              type="button"
              onClick={() => setFilterType('ALL')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all",
                filterType === 'ALL' ? "bg-white text-blue-600 shadow-xs font-black" : "text-slate-500 hover:text-slate-900"
              )}
            >
              Semua ({drafts.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('SERVICE')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1",
                filterType === 'SERVICE' ? "bg-white text-blue-600 shadow-xs font-black" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <Wrench className="w-3 h-3" />
              Servis
            </button>
            <button
              type="button"
              onClick={() => setFilterType('SALE')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1",
                filterType === 'SALE' ? "bg-white text-emerald-600 shadow-xs font-black" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <ShoppingBag className="w-3 h-3" />
              Penjualan
            </button>
          </div>
        </div>

        {/* Drafts List */}
        <div className="max-h-[60vh] overflow-y-auto space-y-2.5 pr-1">
          {filteredDrafts.map(draft => {
            const partsCount = draft.itemsPayload?.partsUsed?.length || 0;
            const servicesCount = draft.itemsPayload?.serviceItems?.length || 0;
            const isService = draft.receiptType === 'SERVICE';
            const createdTime = draft.createdAt ? new Date(draft.createdAt) : new Date();

            return (
              <div
                key={draft.id}
                onClick={() => onResumeDraft(draft)}
                className="p-3.5 bg-white hover:bg-blue-50/50 border border-slate-200/80 hover:border-blue-300 rounded-2xl shadow-xs transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      {draft.draftCode}
                    </span>
                    <span className={cn(
                      "text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1",
                      isService ? "bg-indigo-50 text-indigo-700 border border-indigo-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    )}>
                      {isService ? <Wrench className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}
                      {isService ? 'Servis Motor' : 'Penjualan Ritel'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(createdTime, 'dd/MM/yyyy HH:mm')}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
                    <p className="text-sm font-black text-slate-900 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {draft.customerName}
                    </p>
                    {draft.vehiclePlate && (
                      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                        <Car className="w-3 h-3 text-slate-400" />
                        {draft.vehiclePlate} {draft.vehicleModel ? `(${draft.vehicleModel})` : ''}
                      </span>
                    )}
                  </div>

                  {draft.complaint && (
                    <p className="text-[11px] text-slate-500 italic truncate max-w-md">
                      Keluhan: {draft.complaint}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-medium pt-0.5">
                    <span>
                      Rincian: <strong>{partsCount}</strong> suku cadang
                      {isService && <>, <strong>{servicesCount}</strong> jasa servis</>}
                    </span>
                    {draft.mechanicName && (
                      <span>• Mekanik: <strong>{draft.mechanicName}</strong></span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Perkiraan Total</p>
                    <p className="text-sm font-black text-slate-900 font-mono">
                      Rp {(draft.totalAmount || 0).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, draft.id, draft.draftCode)}
                      disabled={deletingId === draft.id}
                      aria-label="Hapus Draft"
                      title="Hapus Draft Ini"
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onResumeDraft(draft)}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm shadow-blue-200 transition-all active:scale-95"
                    >
                      <span>Lanjutkan</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredDrafts.length === 0 && (
            <div className="p-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <Clock className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-500">
                {drafts.length === 0
                  ? 'Belum ada draft transaksi yang disimpan.'
                  : 'Tidak ada draft yang cocok dengan pencarian.'}
              </p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Anda dapat menekan tombol <strong>"Simpan Draft"</strong> di layar kasir untuk memarkir transaksi sementara dan melayani pelanggan lain.
              </p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span className="flex items-center gap-1 text-[11px] text-slate-400">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            Draft tidak memotong stok dan belum masuk ke laporan keuangan.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
};
