import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { 
  AlertTriangle, 
  Search, 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Hash, 
  Layers, 
  Boxes, 
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Warehouse,
  ChevronRight,
  Filter
} from 'lucide-react';
import { SparePart, Supplier, PurchaseRecord } from '../types';
import { cn } from '../lib/utils';
import { formatPartLocation, groupPartsByRack, DEFAULT_RACK_LIST } from '../utils/inventory';
import { Modal } from './Modal';

interface InventoryViewProps {
  parts: SparePart[];
  suppliers: Supplier[];
  purchases: PurchaseRecord[];
  onAdd: () => void;
  onAddStock: () => void;
  onEdit: (p: SparePart) => void;
  onDelete: (id: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ 
  parts, 
  suppliers, 
  purchases, 
  onAdd, 
  onAddStock, 
  onEdit, 
  onDelete 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'stock' | 'rack_locator' | 'purchases'>('stock');
  const [selectedRackFilter, setSelectedRackFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  
  // Quick rack edit modal state
  const [quickRackPart, setQuickRackPart] = useState<SparePart | null>(null);
  const [editRackCode, setEditRackCode] = useState('');
  const [editShelfLevel, setEditShelfLevel] = useState('');
  const [editBinNumber, setEditBinNumber] = useState('');
  const [editRackZone, setEditRackZone] = useState('');
  const [editLocationNotes, setEditLocationNotes] = useState('');

  // Locator search term in Rack Locator tab
  const [locatorSearch, setLocatorSearch] = useState('');

  // Distinct rack list for filtering
  const availableRacks = useMemo(() => {
    const set = new Set<string>();
    parts.forEach(p => {
      if (p.rackCode && p.rackCode.trim() !== '') {
        set.add(p.rackCode.trim());
      }
    });
    return Array.from(set).sort();
  }, [parts]);

  // Distinct categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    parts.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [parts]);

  // Filtered parts for the stock list tab
  const filteredParts = useMemo(() => {
    return parts.filter(p => {
      const matchSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.barcode && p.barcode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.rackCode && p.rackCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.shelfLevel && p.shelfLevel.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.binNumber && p.binNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.rackLocation && p.rackLocation.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchRack = 
        selectedRackFilter === 'all' ? true :
        selectedRackFilter === 'unassigned' ? (!p.rackCode || p.rackCode.trim() === '') :
        p.rackCode === selectedRackFilter;

      const matchCategory = 
        selectedCategoryFilter === 'all' ? true : p.category === selectedCategoryFilter;

      return matchSearch && matchRack && matchCategory;
    });
  }, [parts, searchTerm, selectedRackFilter, selectedCategoryFilter]);

  // Grouped racks summary for the Warehouse Rack Locator tab
  const rackGroups = useMemo(() => {
    return groupPartsByRack(parts);
  }, [parts]);

  // Parts found by locator in Rack Locator tab
  const locatorFoundParts = useMemo(() => {
    if (!locatorSearch.trim()) return [];
    const q = locatorSearch.toLowerCase();
    return parts.filter(p => 
      p.name.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      p.category.toLowerCase().includes(q) ||
      (p.rackCode && p.rackCode.toLowerCase().includes(q))
    );
  }, [parts, locatorSearch]);

  const openQuickRackEditor = (part: SparePart) => {
    setQuickRackPart(part);
    setEditRackCode(part.rackCode || 'Rak A');
    setEditShelfLevel(part.shelfLevel || 'Tingkat 1');
    setEditBinNumber(part.binNumber || 'Kotak 01');
    setEditRackZone(part.rackZone || 'Gudang Utama');
    setEditLocationNotes(part.locationNotes || '');
  };

  const handleSaveQuickRack = () => {
    if (!quickRackPart) return;
    const updated: SparePart = {
      ...quickRackPart,
      rackCode: editRackCode.trim() || undefined,
      shelfLevel: editShelfLevel.trim() || undefined,
      binNumber: editBinNumber.trim() || undefined,
      rackZone: editRackZone.trim() || 'Gudang Utama',
      locationNotes: editLocationNotes.trim() || undefined,
      lastUpdated: new Date().toISOString()
    };
    onEdit(updated);
    setQuickRackPart(null);
  };

  const lowStockCount = parts.filter(p => p.stock <= p.minStock).length;
  const totalUnits = parts.reduce((acc, p) => acc + (p.stock || 0), 0);

  return (
    <div className="space-y-4 pb-20">
      {/* Sub Tab Navigation */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200/60 shadow-inner">
        <button
          onClick={() => setActiveSubTab('stock')}
          className={cn(
            "flex-1 py-2.5 text-center text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5",
            activeSubTab === 'stock' 
              ? "bg-white text-blue-600 shadow-sm" 
              : "text-slate-400 hover:text-slate-600"
          )}
        >
          <Package className="w-3.5 h-3.5" />
          Daftar Stok & Rak
        </button>
        <button
          onClick={() => setActiveSubTab('rack_locator')}
          className={cn(
            "flex-1 py-2.5 text-center text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5",
            activeSubTab === 'rack_locator' 
              ? "bg-white text-blue-600 shadow-sm" 
              : "text-slate-400 hover:text-slate-600"
          )}
        >
          <MapPin className="w-3.5 h-3.5" />
          Peta & Cari Rak Gudang
        </button>
        <button
          onClick={() => setActiveSubTab('purchases')}
          className={cn(
            "flex-1 py-2.5 text-center text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5",
            activeSubTab === 'purchases' 
              ? "bg-white text-blue-600 shadow-sm" 
              : "text-slate-400 hover:text-slate-600"
          )}
        >
          <Boxes className="w-3.5 h-3.5" />
          Transaksi Masuk
        </button>
      </div>

      {/* ================= TAB 1: DAFTAR STOK & LOKASI RAK ================= */}
      {activeSubTab === 'stock' && (
        <>
          {/* Quick Stat Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-2xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Jenis Part</p>
              <p className="text-lg font-black text-slate-900 mt-0.5">{parts.length} Item</p>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-2xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Unit Fisik</p>
              <p className="text-lg font-black text-blue-600 mt-0.5">{totalUnits} Pcs</p>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-2xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Rak Terdaftar</p>
              <p className="text-lg font-black text-amber-600 mt-0.5">{availableRacks.length} Rak</p>
            </div>
            <div className={cn(
              "p-3 rounded-2xl border shadow-2xs flex items-center justify-between",
              lowStockCount > 0 ? "bg-rose-50 border-rose-100" : "bg-emerald-50 border-emerald-100"
            )}>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Stok Menipis</p>
                <p className={cn("text-lg font-black mt-0.5", lowStockCount > 0 ? "text-rose-600" : "text-emerald-600")}>
                  {lowStockCount} Item
                </p>
              </div>
              {lowStockCount > 0 && (
                <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              )}
            </div>
          </div>

          {/* Search and Action Buttons */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari nama part, SKU (e.g. OLI-001), kode rak (e.g. Rak A)..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none text-sm font-bold text-slate-900 focus:border-blue-500 transition-colors"
              />
            </div>
            <button 
              onClick={onAddStock} 
              className="hidden md:flex items-center gap-2 h-12 px-5 bg-amber-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-amber-100 hover:bg-amber-600 transition-colors shrink-0"
            >
              <Package className="w-4 h-4" />
              Tambah Stok
            </button>
            <button 
              onClick={onAdd} 
              aria-label="Tambah Sparepart Baru"
              className="h-12 px-4 bg-blue-600 text-white rounded-2xl flex items-center justify-center gap-1.5 shadow-lg shadow-blue-100 shrink-0 hover:bg-blue-700 transition-colors font-black text-xs uppercase tracking-wider"
            >
               <Plus className="w-5 h-5" />
               <span className="hidden sm:inline">Part Baru</span>
            </button>
          </div>

          {/* Filter by Rak & Kategori */}
          <div className="space-y-2">
            {/* Filter Rak Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0 mr-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-500" /> Rak:
              </span>
              <button
                onClick={() => setSelectedRackFilter('all')}
                className={cn(
                  "px-3 py-1.5 rounded-xl font-bold whitespace-nowrap text-xs transition-colors shrink-0",
                  selectedRackFilter === 'all'
                    ? "bg-amber-600 text-white shadow-2xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                )}
              >
                Semua Rak ({parts.length})
              </button>
              {availableRacks.map(rack => {
                const count = parts.filter(p => p.rackCode === rack).length;
                return (
                  <button
                    key={rack}
                    onClick={() => setSelectedRackFilter(rack)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl font-bold whitespace-nowrap text-xs transition-colors shrink-0 flex items-center gap-1",
                      selectedRackFilter === rack
                        ? "bg-amber-600 text-white shadow-2xs"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    <span>{rack}</span>
                    <span className={cn(
                      "text-[9px] px-1 rounded-md",
                      selectedRackFilter === rack ? "bg-amber-700 text-white" : "bg-slate-100 text-slate-500"
                    )}>
                      {count}
                    </span>
                  </button>
                );
              })}
              {parts.some(p => !p.rackCode) && (
                <button
                  onClick={() => setSelectedRackFilter('unassigned')}
                  className={cn(
                    "px-3 py-1.5 rounded-xl font-bold whitespace-nowrap text-xs transition-colors shrink-0",
                    selectedRackFilter === 'unassigned'
                      ? "bg-rose-600 text-white shadow-2xs"
                      : "bg-white text-rose-600 border border-rose-200 hover:bg-rose-50"
                  )}
                >
                  Belum Ada Rak ({parts.filter(p => !p.rackCode).length})
                </button>
              )}
            </div>

            {/* Filter Kategori Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3 text-blue-500" /> Kategori:
              </span>
              <button
                onClick={() => setSelectedCategoryFilter('all')}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-bold whitespace-nowrap text-[11px] transition-colors shrink-0",
                  selectedCategoryFilter === 'all'
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                Semua
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg font-bold whitespace-nowrap text-[11px] transition-colors shrink-0",
                    selectedCategoryFilter === cat
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* List of Spare Parts with SKU & Rack details */}
          <div className="space-y-3">
            {filteredParts.map((part) => {
              const supplier = suppliers.find(s => s.id === part.supplierId);
              const locationStr = formatPartLocation(part);
              const hasRack = Boolean(part.rackCode);

              return (
                <div 
                  key={part.id} 
                  className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-blue-200 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      {/* Stock indicator badge */}
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex flex-col items-center justify-center text-xs font-black shrink-0",
                        part.stock <= part.minStock ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
                      )}>
                        <span className="text-sm font-black leading-none">{part.stock}</span>
                        <span className="text-[8px] font-bold uppercase mt-0.5">Pcs</span>
                      </div>

                      {/* Part Information */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-black text-slate-900 truncate">{part.name}</p>
                          {part.sku ? (
                            <span className="text-[10px] font-mono font-black bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100 flex items-center gap-0.5">
                              <Hash className="w-2.5 h-2.5" />
                              {part.sku}
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              ID: {part.id}
                            </span>
                          )}
                        </div>

                        {/* RACK LOCATION BADGE (PROMINENT) */}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <div 
                            onClick={() => openQuickRackEditor(part)}
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all border",
                              hasRack 
                                ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 hover:border-amber-300" 
                                : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                            )}
                            title="Klik untuk ubah letak rak barang ini"
                          >
                            <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="font-black">
                              {hasRack ? locationStr : '⚠️ Belum Diatur Raknya'}
                            </span>
                            <span className="text-[9px] text-amber-700 underline ml-0.5">Ubah</span>
                          </div>

                          {part.rackZone && (
                            <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              {part.rackZone}
                            </span>
                          )}

                          <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                            {part.category}
                          </span>

                          {supplier && (
                            <span className="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md font-bold">
                              Supplier: {supplier.name}
                            </span>
                          )}
                        </div>

                        {/* Location Notes if available */}
                        {part.locationNotes && (
                          <p className="text-[11px] text-slate-500 italic mt-1.5 flex items-center gap-1">
                            <span className="text-amber-500 font-bold">💡 Catatan Letak:</span>
                            {part.locationNotes}
                          </p>
                        )}

                        {/* Pricing details */}
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 font-bold">
                          <p>Harga Jual: <span className="text-blue-600 font-black">Rp {(part.price || 0).toLocaleString()}</span></p>
                          <p className="text-slate-300">•</p>
                          <p>Modal: <span className="text-slate-700">Rp {(part.purchasePrice || 0).toLocaleString()}</span></p>
                          {part.barcode && (
                            <>
                              <p className="text-slate-300">•</p>
                              <p className="font-mono text-slate-400">Barcode: {part.barcode}</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button 
                        onClick={() => openQuickRackEditor(part)} 
                        aria-label="Atur Rak"
                        title="Atur Letak Rak"
                        className="p-2 text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors"
                      >
                        <MapPin className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onEdit(part)} 
                        aria-label="Edit Sparepart"
                        title="Edit Data Lengkap"
                        className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-xl transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDelete(part.id)} 
                        aria-label="Hapus Sparepart"
                        title="Hapus Part"
                        className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredParts.length === 0 && (
              <div className="p-12 text-center text-slate-400 text-xs font-bold bg-white rounded-3xl border border-dashed border-slate-200 space-y-2">
                <Package className="w-8 h-8 mx-auto text-slate-300" />
                <p>Tidak ada sparepart yang sesuai dengan filter atau kata kunci pencarian.</p>
                <button
                  onClick={() => { setSearchTerm(''); setSelectedRackFilter('all'); setSelectedCategoryFilter('all'); }}
                  className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl font-black text-xs hover:bg-blue-100 transition-colors"
                >
                  Reset Filter
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ================= TAB 2: PETA & CARI RAK GUDANG (WAREHOUSE LOCATOR) ================= */}
      {activeSubTab === 'rack_locator' && (
        <div className="space-y-4">
          {/* Instant Search Bar: "Cari Letak Barang" */}
          <div className="p-4 bg-linear-to-r from-blue-600 to-indigo-700 text-white rounded-3xl shadow-lg space-y-3">
            <div className="flex items-center gap-2">
              <Warehouse className="w-5 h-5 text-amber-300" />
              <div>
                <h3 className="text-sm font-black tracking-wide">Pencari Posisi & Letak Rak Barang</h3>
                <p className="text-[11px] text-blue-100">Ketik nama suku cadang atau SKU untuk langsung tahu posisi rak dan tingkatannya di gudang</p>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Ketik nama part (misal: Oli, Kampas, Filter, Busi, dll)..." 
                value={locatorSearch}
                onChange={e => setLocatorSearch(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-white text-slate-900 border-none rounded-2xl shadow-md outline-none text-sm font-bold placeholder:text-slate-400"
              />
              {locatorSearch && (
                <button
                  onClick={() => setLocatorSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-100 px-2 py-1 rounded-lg"
                >
                  Hapus
                </button>
              )}
            </div>

            {/* Live Search Results Highlight */}
            {locatorSearch.trim() !== '' && (
              <div className="pt-2 space-y-2">
                <p className="text-xs font-bold text-blue-100">
                  Ditemukan {locatorFoundParts.length} barang cocok:
                </p>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {locatorFoundParts.map(part => (
                    <div 
                      key={part.id}
                      className="p-3 bg-white/95 text-slate-900 rounded-xl shadow-xs flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-black text-slate-900">{part.name}</p>
                          {part.sku && (
                            <span className="text-[9px] font-mono font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                              {part.sku}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-black text-amber-700 mt-1 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>{formatPartLocation(part)}</span>
                        </p>
                        {part.locationNotes && (
                          <p className="text-[10px] text-slate-500 italic mt-0.5">
                            💡 {part.locationNotes}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className={cn(
                          "text-xs font-black px-2 py-1 rounded-lg inline-block",
                          part.stock <= part.minStock ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                        )}>
                          Sisa: {part.stock} Pcs
                        </span>
                      </div>
                    </div>
                  ))}

                  {locatorFoundParts.length === 0 && (
                    <div className="p-4 text-center bg-white/10 rounded-xl text-xs font-bold text-blue-100">
                      Tidak ada barang dengan nama atau kode tersebut.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Warehouse Rack Grid Map */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Denah & Daftar Rak Gudang ({rackGroups.length} Kelompok Rak)
                </h4>
                <p className="text-[11px] text-slate-400">
                  Rincian stok barang yang tersimpan di setiap rak
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {rackGroups.map((group) => {
                const isUnassigned = group.rackCode === 'Tanpa Rak';
                return (
                  <div 
                    key={group.rackCode}
                    className={cn(
                      "p-4 rounded-3xl border shadow-xs transition-all bg-white",
                      isUnassigned ? "border-rose-200" : "border-slate-200/80 hover:border-amber-300"
                    )}
                  >
                    {/* Rack Header */}
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          "w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm",
                          isUnassigned ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-700"
                        )}>
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{group.rackCode}</p>
                          <p className="text-[10px] text-slate-400 font-bold">
                            {group.itemCount} Jenis Barang • {group.totalUnits} Total Unit
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedRackFilter(isUnassigned ? 'unassigned' : group.rackCode);
                          setActiveSubTab('stock');
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1"
                      >
                        <span>Buka</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Parts list inside this rack */}
                    <div className="pt-3 space-y-2">
                      {group.parts.map(p => (
                        <div 
                          key={p.id}
                          className="p-2.5 bg-slate-50 hover:bg-amber-50/50 rounded-xl border border-slate-100 flex items-center justify-between text-xs transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-slate-900 truncate">{p.name}</p>
                              {p.sku && (
                                <span className="text-[9px] font-mono font-black bg-white text-blue-700 border border-slate-200 px-1 rounded">
                                  {p.sku}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-amber-800 font-medium mt-0.5">
                              {p.shelfLevel || 'Tingkat -'} {p.binNumber ? `• ${p.binNumber}` : ''}
                            </p>
                          </div>
                          <div className="text-right shrink-0 pl-2">
                            <span className={cn(
                              "font-black text-xs",
                              p.stock <= p.minStock ? "text-rose-600" : "text-slate-800"
                            )}>
                              {p.stock} pcs
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: TRANSAKSI MASUK SUPPLIER ================= */}
      {activeSubTab === 'purchases' && (
        <div className="space-y-3">
          {purchases.map((pr) => {
            const part = parts.find(p => p.id === pr.partId);
            const supplier = suppliers.find(s => s.id === pr.supplierId);
            return (
              <div key={pr.id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-950">{part?.name || 'Part Terhapus'}</p>
                    {part?.sku && (
                      <span className="text-[9px] font-mono font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                        {part.sku}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-blue-600 font-extrabold uppercase mt-0.5 tracking-wider">
                    Supplier: {supplier?.name || 'Umum'}
                  </p>
                  <p className="text-[9px] text-slate-400 font-semibold mt-1">
                    {format(new Date(pr.date), 'dd/MM/yyyy HH:mm')}
                  </p>
                  {part?.rackCode && (
                    <p className="text-[10px] text-amber-700 font-bold mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Lokasi Simpan: {formatPartLocation(part)}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-emerald-600 font-mono">+{pr.quantity} Pcs</p>
                  <p className="text-[9px] text-slate-400 font-bold">@Rp {(pr.costPrice || 0).toLocaleString()}</p>
                  <p className="text-xs font-black text-slate-900 mt-1">Total: Rp {((pr.costPrice || 0) * pr.quantity).toLocaleString()}</p>
                </div>
              </div>
            );
          })}
          {purchases.length === 0 && (
            <div className="p-12 text-center text-slate-400 text-xs font-extrabold bg-white rounded-[32px] border border-dashed border-slate-200">
              Belum ada transaksi barang masuk dari pemasok.
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL CEPAT UBAH LETAK RAK ================= */}
      {quickRackPart && (
        <Modal 
          title={`Atur Letak Rak: ${quickRackPart.name}`} 
          onClose={() => setQuickRackPart(null)}
        >
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 space-y-1">
              <p className="text-[10px] font-black uppercase text-amber-800 tracking-wider">Barang yang Diatur</p>
              <p className="text-sm font-black text-slate-900">{quickRackPart.name}</p>
              <p className="text-xs font-mono text-blue-600 font-bold">SKU: {quickRackPart.sku || quickRackPart.id}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Kode Rak *</label>
                <input 
                  list="quick-rack-list"
                  placeholder="e.g. Rak A, Rak B"
                  value={editRackCode}
                  onChange={e => setEditRackCode(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold text-slate-900 focus:border-amber-500"
                />
                <datalist id="quick-rack-list">
                  {DEFAULT_RACK_LIST.map(r => (
                    <option key={r.code} value={r.code}>{r.name}</option>
                  ))}
                </datalist>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Tingkat / Ambalan</label>
                <input 
                  list="quick-shelf-list"
                  placeholder="e.g. Tingkat 1, Tingkat 2"
                  value={editShelfLevel}
                  onChange={e => setEditShelfLevel(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold text-slate-900 focus:border-amber-500"
                />
                <datalist id="quick-shelf-list">
                  <option value="Tingkat 1 (Bawah)">Tingkat 1 (Bawah)</option>
                  <option value="Tingkat 2 (Tengah)">Tingkat 2 (Tengah)</option>
                  <option value="Tingkat 3 (Atas)">Tingkat 3 (Atas)</option>
                  <option value="Tingkat 4 (Paling Atas)">Tingkat 4 (Paling Atas)</option>
                  <option value="Etalase Kaca">Etalase Kaca</option>
                  <option value="Gantungan Ban">Gantungan Ban</option>
                </datalist>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Kotak / Bin / Slot</label>
                <input 
                  placeholder="e.g. Kotak 01, Slot A"
                  value={editBinNumber}
                  onChange={e => setEditBinNumber(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold text-slate-900 focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Zona / Area Gudang</label>
                <select
                  value={editRackZone}
                  onChange={e => setEditRackZone(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold text-slate-900"
                >
                  <option value="Gudang Utama">Gudang Utama</option>
                  <option value="Toko Kasir">Toko Kasir / Etalase Depan</option>
                  <option value="Gudang Belakang">Gudang Belakang</option>
                  <option value="Area Servis Luar">Area Servis Luar</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Catatan Tambahan Petunjuk</label>
                <input 
                  placeholder="e.g. Dekat pintu kiri atau dus bagian bawah"
                  value={editLocationNotes}
                  onChange={e => setEditLocationNotes(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs text-slate-800"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Hasil Label Lokasi:</span>
              <span className="text-xs font-black text-amber-700 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {[editRackCode || 'Tanpa Rak', editShelfLevel, editBinNumber ? `(${editBinNumber})` : null].filter(Boolean).join(' • ')}
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                type="button"
                onClick={() => setQuickRackPart(null)}
                className="flex-1 h-12 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-black uppercase text-xs tracking-wider transition-colors"
              >
                Batal
              </button>
              <button 
                type="button"
                onClick={handleSaveQuickRack}
                className="flex-1 h-12 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black uppercase text-xs tracking-wider shadow-md shadow-amber-200 transition-colors"
              >
                Simpan Letak Rak
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
