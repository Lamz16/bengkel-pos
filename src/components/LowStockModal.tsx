import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  PackageX, 
  Search, 
  PlusCircle, 
  Edit, 
  MapPin, 
  Building2, 
  ArrowRight,
  CheckCircle2,
  ZoomIn,
  PackageCheck,
  Tag
} from 'lucide-react';
import { SparePart, Supplier } from '../types';
import { Modal } from './Modal';
import { cn } from '../lib/utils';
import { formatPartLocation } from '../utils/inventory';

interface LowStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  parts: SparePart[];
  suppliers: Supplier[];
  onAddStock: (partId?: string) => void;
  onEditPart: (part: SparePart) => void;
  onGoToInventory?: () => void;
}

type FilterType = 'all' | 'out_of_stock' | 'low_stock';

export const LowStockModal: React.FC<LowStockModalProps> = ({
  isOpen,
  onClose,
  parts,
  suppliers,
  onAddStock,
  onEditPart,
  onGoToInventory
}) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Filter low stock parts
  const allLowStock = useMemo(() => {
    return parts.filter(p => p.stock <= p.minStock);
  }, [parts]);

  const outOfStockCount = useMemo(() => {
    return allLowStock.filter(p => p.stock === 0).length;
  }, [allLowStock]);

  const warningCount = useMemo(() => {
    return allLowStock.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
  }, [allLowStock]);

  const filteredParts = useMemo(() => {
    return allLowStock.filter(p => {
      // Filter tab
      if (filter === 'out_of_stock' && p.stock > 0) return false;
      if (filter === 'low_stock' && p.stock === 0) return false;

      // Search term
      if (!search.trim()) return true;
      const term = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(term) ||
        (p.sku && p.sku.toLowerCase().includes(term)) ||
        p.category.toLowerCase().includes(term) ||
        (p.rackCode && p.rackCode.toLowerCase().includes(term))
      );
    });
  }, [allLowStock, filter, search]);

  const getSupplierName = (supplierId?: string) => {
    if (!supplierId) return 'Tidak terikat supplier';
    const s = suppliers.find(sup => sup.id === supplierId);
    return s ? s.name : 'Supplier Lain';
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="⚠️ Monitoring Stok Menipis & Habis"
      maxWidth="4xl"
    >
      <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
        {/* Top Summary Banner */}
        <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl shadow-sm border border-slate-700/70 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Monitoring Kebutuhan Restok</h3>
                <p className="text-[11px] text-slate-300">
                  Total <strong className="text-rose-400 font-black">{allLowStock.length} barang</strong> berada di bawah batas minimum stok aman.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onAddStock();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              Tambah Stok Baru
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-700/60">
            <div className="flex items-center justify-between p-2.5 bg-rose-950/40 rounded-xl border border-rose-800/40">
              <span className="text-[11px] font-bold text-rose-300 flex items-center gap-1.5">
                <PackageX className="w-3.5 h-3.5 text-rose-400" />
                Stok Habis (0 Pcs)
              </span>
              <span className="text-base font-black text-rose-400">{outOfStockCount} Part</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-amber-950/40 rounded-xl border border-amber-800/40">
              <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Hampir Habis (≤ Min)
              </span>
              <span className="text-base font-black text-amber-400">{warningCount} Part</span>
            </div>
          </div>
        </div>

        {/* Filter Tabs & Search */}
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Sub Tab Filters */}
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold flex-1">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-[11px] font-black transition-all",
                filter === 'all' ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Semua ({allLowStock.length})
            </button>
            <button
              onClick={() => setFilter('out_of_stock')}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-[11px] font-black transition-all flex items-center justify-center gap-1",
                filter === 'out_of_stock' ? "bg-rose-600 text-white shadow-2xs" : "text-rose-600 hover:bg-rose-50"
              )}
            >
              Habis ({outOfStockCount})
            </button>
            <button
              onClick={() => setFilter('low_stock')}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-[11px] font-black transition-all flex items-center justify-center gap-1",
                filter === 'low_stock' ? "bg-amber-500 text-white shadow-2xs" : "text-amber-700 hover:bg-amber-50"
              )}
            >
              Menipis ({warningCount})
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama / SKU / rak..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* List of Low Stock Parts */}
        {filteredParts.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
            {allLowStock.length === 0 ? (
              <>
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                  <PackageCheck className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-black text-slate-800">Semua Stok Barang Aman!</h4>
                <p className="text-xs text-slate-500">Tidak ada barang yang berada di bawah batas minimum stok saat ini.</p>
              </>
            ) : (
              <>
                <AlertTriangle className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-600">Tidak ada barang yang cocok dengan pencarian / filter ini.</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredParts.map(part => {
              const isZero = part.stock === 0;
              const percent = Math.min(100, Math.round((part.stock / Math.max(1, part.minStock)) * 100));

              return (
                <div 
                  key={part.id}
                  className={cn(
                    "p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row gap-3 sm:items-center justify-between",
                    isZero 
                      ? "bg-rose-50/50 border-rose-200 hover:border-rose-300" 
                      : "bg-amber-50/40 border-amber-200 hover:border-amber-300"
                  )}
                >
                  {/* Left info: Image & Details */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Image / Stock Badge */}
                    {part.imageUrl ? (
                      <div 
                        onClick={() => setSelectedImage(part.imageUrl || null)}
                        className="relative w-14 h-14 rounded-xl bg-slate-900 border border-slate-200 overflow-hidden shrink-0 cursor-pointer group/img shadow-2xs"
                        title="Klik untuk melihat foto"
                      >
                        <img 
                          src={part.imageUrl} 
                          alt={part.name} 
                          className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <ZoomIn className="w-4 h-4" />
                        </div>
                      </div>
                    ) : (
                      <div className={cn(
                        "w-14 h-14 rounded-xl flex flex-col items-center justify-center text-xs font-black shrink-0 border",
                        isZero ? "bg-rose-600 text-white border-rose-700" : "bg-amber-500 text-white border-amber-600"
                      )}>
                        <span className="text-base font-black leading-none">{part.stock}</span>
                        <span className="text-[8px] font-bold uppercase mt-0.5">Pcs</span>
                      </div>
                    )}

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                          {part.category}
                        </span>
                        {part.sku && (
                          <span className="text-[10px] font-mono font-bold text-slate-500">
                            SKU: {part.sku}
                          </span>
                        )}
                        <span className={cn(
                          "text-[10px] font-black px-2 py-0.5 rounded-full border",
                          isZero ? "bg-rose-100 text-rose-700 border-rose-200" : "bg-amber-100 text-amber-800 border-amber-200"
                        )}>
                          {isZero ? '❌ STOK HABIS (0 Pcs)' : `⚠️ TERSISA ${part.stock} Pcs`}
                        </span>
                      </div>

                      <h4 className="text-sm font-black text-slate-900 truncate leading-snug">
                        {part.name}
                      </h4>

                      {/* Stock Ratio Progress Bar */}
                      <div className="space-y-1 pt-0.5 max-w-xs">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                          <span>Stok: <strong className={isZero ? "text-rose-600" : "text-amber-700"}>{part.stock} Pcs</strong></span>
                          <span>Batas Min: {part.minStock} Pcs</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full rounded-full transition-all duration-500", isZero ? "bg-rose-600" : "bg-amber-500")}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5 flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-600" />
                          <strong>Lokasi:</strong> {formatPartLocation(part)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {getSupplierName(part.supplierId)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex sm:flex-col gap-2 shrink-0 justify-end sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onAddStock(part.id);
                      }}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm transition-colors"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Restok Sekarang
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onEditPart(part);
                      }}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors"
                    >
                      <Edit className="w-3 h-3 text-slate-500" />
                      Edit Part
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-between items-center border-t border-slate-200">
          <p className="text-[11px] font-bold text-slate-400">
            *Daftar ini secara otomatis diperbarui dari transaksi kasir & pemasukan barang.
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onGoToInventory && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGoToInventory();
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-black transition-colors"
              >
                Ke Halaman Stok Barang
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* Image Zoom Modal inside LowStockModal */}
      {selectedImage && (
        <Modal
          isOpen={Boolean(selectedImage)}
          onClose={() => setSelectedImage(null)}
          title="Foto Barang"
        >
          <div className="space-y-3">
            <div className="aspect-square w-full rounded-2xl bg-slate-950 overflow-hidden border border-slate-800 flex items-center justify-center">
              <img src={selectedImage} alt="Preview Foto" className="w-full h-full object-contain" />
            </div>
            <button
              onClick={() => setSelectedImage(null)}
              className="w-full h-10 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs"
            >
              Tutup Foto
            </button>
          </div>
        </Modal>
      )}
    </Modal>
  );
};
