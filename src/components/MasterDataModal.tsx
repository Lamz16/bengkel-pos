import React, { useState } from 'react';
import { 
  FolderPlus, 
  Layers, 
  Warehouse, 
  Plus, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Tag, 
  Hash, 
  MapPin, 
  Info,
  Sliders
} from 'lucide-react';
import { PartCategory, WarehouseRack, WarehouseZone, SparePart } from '../types';
import { Modal } from './Modal';
import { cn } from '../lib/utils';

interface MasterDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: PartCategory[];
  racks: WarehouseRack[];
  zones: WarehouseZone[];
  parts: SparePart[];
  onSaveCategories: (categories: PartCategory[]) => Promise<void>;
  onSaveRacks: (racks: WarehouseRack[]) => Promise<void>;
  onSaveZones: (zones: WarehouseZone[]) => Promise<void>;
}

export const MasterDataModal: React.FC<MasterDataModalProps> = ({
  isOpen,
  onClose,
  categories,
  racks,
  zones,
  parts,
  onSaveCategories,
  onSaveRacks,
  onSaveZones
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'racks' | 'zones'>('categories');
  const [notification, setNotification] = useState<string | null>(null);

  // Category Form State
  const [editingCategory, setEditingCategory] = useState<PartCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catPrefix, setCatPrefix] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // Rack Form State
  const [editingRack, setEditingRack] = useState<WarehouseRack | null>(null);
  const [rackCode, setRackCode] = useState('');
  const [rackName, setRackName] = useState('');
  const [rackZone, setRackZone] = useState('');
  const [rackDesc, setRackDesc] = useState('');

  // Zone Form State
  const [editingZone, setEditingZone] = useState<WarehouseZone | null>(null);
  const [zoneName, setZoneName] = useState('');
  const [zoneDesc, setZoneDesc] = useState('');

  if (!isOpen) return null;

  const showSuccess = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // --- Category Handlers ---
  const handleOpenCategoryForm = (cat?: PartCategory) => {
    if (cat) {
      setEditingCategory(cat);
      setCatName(cat.name);
      setCatPrefix(cat.skuPrefix || '');
      setCatDesc(cat.description || '');
    } else {
      setEditingCategory({ id: '', name: '', skuPrefix: '', description: '' });
      setCatName('');
      setCatPrefix('');
      setCatDesc('');
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      alert('Nama kategori tidak boleh kosong');
      return;
    }

    const autoPrefix = catPrefix.trim().toUpperCase() || 
      (catName.trim().length >= 3 ? catName.trim().slice(0, 3).toUpperCase() : 'PRT');

    if (editingCategory && editingCategory.id) {
      // Update
      const updated = categories.map(c => 
        c.id === editingCategory.id 
          ? { ...c, name: catName.trim(), skuPrefix: autoPrefix, description: catDesc.trim() }
          : c
      );
      try { await onSaveCategories(updated); } catch (error: any) { alert(error.message); return; }
      showSuccess(`Kategori "${catName.trim()}" berhasil diperbarui!`);
    } else {
      // Create new
      const newCat: PartCategory = {
        id: 'cat-' + Date.now(),
        name: catName.trim(),
        skuPrefix: autoPrefix,
        description: catDesc.trim()
      };
      try { await onSaveCategories([...categories, newCat]); } catch (error: any) { alert(error.message); return; }
      showSuccess(`Kategori baru "${catName.trim()}" berhasil ditambahkan!`);
    }

    setEditingCategory(null);
  };

  const handleDeleteCategory = async (cat: PartCategory) => {
    const usageCount = parts.filter(p => p.category.toLowerCase() === cat.name.toLowerCase()).length;
    if (usageCount > 0) {
      if (!confirm(`Kategori "${cat.name}" saat ini digunakan oleh ${usageCount} barang sparepart. Yakin ingin menghapus kategori ini?`)) {
        return;
      }
    } else {
      if (!confirm(`Hapus kategori "${cat.name}"?`)) return;
    }

    const updated = categories.filter(c => c.id !== cat.id);
    try {
      await onSaveCategories(updated);
      showSuccess(`Kategori "${cat.name}" berhasil dihapus.`);
    } catch (error: any) { alert(error.message); }
  };

  // --- Rack Handlers ---
  const handleOpenRackForm = (r?: WarehouseRack) => {
    if (r) {
      setEditingRack(r);
      setRackCode(r.code);
      setRackName(r.name);
      setRackZone(r.zone || (zones[0]?.name || 'Gudang Utama'));
      setRackDesc(r.description || '');
    } else {
      setEditingRack({ id: '', code: '', name: '', zone: zones[0]?.name || 'Gudang Utama', description: '' });
      setRackCode('');
      setRackName('');
      setRackZone(zones[0]?.name || 'Gudang Utama');
      setRackDesc('');
    }
  };

  const handleSaveRack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rackCode.trim()) {
      alert('Kode Rak tidak boleh kosong (contoh: Rak A, Rak F)');
      return;
    }

    const code = rackCode.trim();
    const name = rackName.trim() || `${code} - ${rackZone || 'Gudang Utama'}`;

    if (editingRack && editingRack.id) {
      // Update
      const updated = racks.map(r => 
        r.id === editingRack.id
          ? { ...r, code, name, zone: rackZone || 'Gudang Utama', zoneId: zones.find(z => z.name === rackZone)?.id, description: rackDesc.trim() }
          : r
      );
      try { await onSaveRacks(updated); } catch (error: any) { alert(error.message); return; }
      showSuccess(`Data "${code}" berhasil diperbarui!`);
    } else {
      // Create
      const newRack: WarehouseRack = {
        id: 'rack-' + Date.now(),
        code,
        name,
        zone: rackZone || 'Gudang Utama',
        zoneId: zones.find(z => z.name === rackZone)?.id,
        description: rackDesc.trim()
      };
      try { await onSaveRacks([...racks, newRack]); } catch (error: any) { alert(error.message); return; }
      showSuccess(`Rak baru "${code}" berhasil ditambahkan!`);
    }

    setEditingRack(null);
  };

  const handleDeleteRack = async (r: WarehouseRack) => {
    const usageCount = parts.filter(p => p.rackCode === r.code).length;
    if (usageCount > 0) {
      if (!confirm(`Rak "${r.code}" saat ini memuat ${usageCount} jenis barang. Yakin ingin menghapus rak ini?`)) {
        return;
      }
    } else {
      if (!confirm(`Hapus rak "${r.code}"?`)) return;
    }

    const updated = racks.filter(item => item.id !== r.id);
    try {
      await onSaveRacks(updated);
      showSuccess(`Rak "${r.code}" berhasil dihapus.`);
    } catch (error: any) { alert(error.message); }
  };

  // --- Zone Handlers ---
  const handleOpenZoneForm = (z?: WarehouseZone) => {
    if (z) {
      setEditingZone(z);
      setZoneName(z.name);
      setZoneDesc(z.description || '');
    } else {
      setEditingZone({ id: '', name: '', description: '' });
      setZoneName('');
      setZoneDesc('');
    }
  };

  const handleSaveZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneName.trim()) {
      alert('Nama Zona Gudang tidak boleh kosong');
      return;
    }

    if (editingZone && editingZone.id) {
      const updated = zones.map(z => 
        z.id === editingZone.id 
          ? { ...z, name: zoneName.trim(), description: zoneDesc.trim() }
          : z
      );
      try { await onSaveZones(updated); } catch (error: any) { alert(error.message); return; }
      showSuccess(`Gudang/Zona "${zoneName.trim()}" berhasil diperbarui!`);
    } else {
      const newZone: WarehouseZone = {
        id: 'zone-' + Date.now(),
        name: zoneName.trim(),
        description: zoneDesc.trim()
      };
      try { await onSaveZones([...zones, newZone]); } catch (error: any) { alert(error.message); return; }
      showSuccess(`Gudang/Zona baru "${zoneName.trim()}" berhasil ditambahkan!`);
    }

    setEditingZone(null);
  };

  const handleDeleteZone = async (z: WarehouseZone) => {
    const rackCount = racks.filter(r => r.zone === z.name).length;
    if (rackCount > 0) {
      alert(`Gudang "${z.name}" tidak dapat dihapus karena masih memuat ${rackCount} rak terdaftar.`);
      return;
    }

    if (!confirm(`Hapus gudang/zona "${z.name}"?`)) return;

    const updated = zones.filter(item => item.id !== z.id);
    try {
      await onSaveZones(updated);
      showSuccess(`Gudang/Zona "${z.name}" dihapus.`);
    } catch (error: any) { alert(error.message); }
  };

  return (
    <Modal title="Manajemen Master Data Kategori & Gudang" onClose={onClose} isOpen={isOpen}>
      <div className="space-y-5">
        {/* Notification Toast */}
        {notification && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Dynamic Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={cn(
              "flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
              activeTab === 'categories'
                ? "bg-white text-blue-700 shadow-2xs font-black"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Kategori Barang ({categories.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('racks')}
            className={cn(
              "flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
              activeTab === 'racks'
                ? "bg-white text-amber-700 shadow-2xs font-black"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Rak Storage ({racks.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('zones')}
            className={cn(
              "flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
              activeTab === 'zones'
                ? "bg-white text-emerald-700 shadow-2xs font-black"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Warehouse className="w-3.5 h-3.5" />
            <span>Gudang / Zona ({zones.length})</span>
          </button>
        </div>

        {/* TAB 1: KATEGORI BARANG */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Master Kategori Sparepart</h4>
                <p className="text-[11px] text-slate-500">Tambah & sesuaikan kategori barang serta prefix SKU otomatis.</p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenCategoryForm()}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-200 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Kategori</span>
              </button>
            </div>

            {/* Category Form Inline Modal/Drawer */}
            {editingCategory && (
              <form onSubmit={handleSaveCategory} className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-3">
                <div className="flex justify-between items-center border-b border-blue-200/60 pb-2">
                  <h5 className="text-xs font-black text-blue-900 uppercase">
                    {editingCategory.id ? 'Edit Kategori' : 'Tambah Kategori Baru'}
                  </h5>
                  <button type="button" onClick={() => setEditingCategory(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Nama Kategori *</label>
                    <input 
                      type="text"
                      placeholder="e.g. Karburator, Bearing, Kampas"
                      value={catName}
                      onChange={e => {
                        setCatName(e.target.value);
                        if (!editingCategory.id && !catPrefix) {
                          setCatPrefix(e.target.value.slice(0, 3).toUpperCase());
                        }
                      }}
                      className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Prefix SKU Otomatis (3-4 Huruf)</label>
                    <input 
                      type="text"
                      placeholder="e.g. OLI, REM, BRG"
                      value={catPrefix}
                      onChange={e => setCatPrefix(e.target.value.toUpperCase())}
                      maxLength={5}
                      className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-xs font-black text-blue-700 uppercase outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Keterangan / Deskripsi (Opsional)</label>
                  <input 
                    type="text"
                    placeholder="Contoh: Aneka bearing & laker roda motor"
                    value={catDesc}
                    onChange={e => setCatDesc(e.target.value)}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditingCategory(null)}
                    className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 shadow-2xs"
                  >
                    Simpan Kategori
                  </button>
                </div>
              </form>
            )}

            {/* Category Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
              {categories.map(cat => {
                const count = parts.filter(p => p.category.toLowerCase() === cat.name.toLowerCase()).length;
                return (
                  <div 
                    key={cat.id} 
                    className="p-3 bg-white border border-slate-200 rounded-2xl shadow-2xs hover:border-blue-300 transition-colors flex items-center justify-between group"
                  >
                    <div className="space-y-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-slate-900 text-xs truncate">{cat.name}</span>
                        <span className="text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-md">
                          Prefix: {cat.skuPrefix || cat.name.slice(0, 3).toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate">{cat.description || 'Tidak ada keterangan'}</p>
                      <span className="inline-block text-[10px] font-bold text-slate-400">
                        📦 {count} Item Sparepart
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-95 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenCategoryForm(cat)}
                        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Kategori"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus Kategori"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: RAK STORAGE */}
        {activeTab === 'racks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Data Rak & Letak Penyimpanan</h4>
                <p className="text-[11px] text-slate-500">Kelola kode rak, nama rak, dan pemetaan ke zona gudang.</p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenRackForm()}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-200 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Rak Baru</span>
              </button>
            </div>

            {/* Rack Form Inline */}
            {editingRack && (
              <form onSubmit={handleSaveRack} className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-3">
                <div className="flex justify-between items-center border-b border-amber-200/60 pb-2">
                  <h5 className="text-xs font-black text-amber-900 uppercase">
                    {editingRack.id ? 'Edit Data Rak' : 'Tambah Rak Storage Baru'}
                  </h5>
                  <button type="button" onClick={() => setEditingRack(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Kode Rak *</label>
                    <input 
                      type="text"
                      placeholder="e.g. Rak F, Etalase 2, Rak Ban"
                      value={rackCode}
                      onChange={e => setRackCode(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Nama Label Rak</label>
                    <input 
                      type="text"
                      placeholder="e.g. Rak F - Suspensi & Shock"
                      value={rackName}
                      onChange={e => setRackName(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Pilih Gudang / Zona</label>
                    <select
                      value={rackZone}
                      onChange={e => setRackZone(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-amber-500"
                    >
                      {zones.map(z => (
                        <option key={z.id} value={z.name}>{z.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Keterangan Catatan Rak</label>
                  <input 
                    type="text"
                    placeholder="Contoh: Susunan paling kanan dekat lorong tengah"
                    value={rackDesc}
                    onChange={e => setRackDesc(e.target.value)}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditingRack(null)}
                    className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700 shadow-2xs"
                  >
                    Simpan Rak
                  </button>
                </div>
              </form>
            )}

            {/* Racks List */}
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {racks.map(r => {
                const count = parts.filter(p => p.rackCode === r.code).length;
                return (
                  <div 
                    key={r.id}
                    className="p-3 bg-white border border-slate-200 rounded-2xl shadow-2xs hover:border-amber-300 transition-colors flex items-center justify-between group"
                  >
                    <div className="space-y-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-slate-900 text-xs">{r.code}</span>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          📍 {r.zone}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-700">{r.name}</p>
                      {r.description && <p className="text-[10px] text-slate-500">{r.description}</p>}
                      <span className="inline-block text-[10px] font-bold text-slate-400">
                        📦 Memuat {count} Jenis Barang
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-95 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenRackForm(r)}
                        className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Edit Rak"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRack(r)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus Rak"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: ZONA GUDANG */}
        {activeTab === 'zones' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Area & Ruangan Gudang</h4>
                <p className="text-[11px] text-slate-500">Tambah lokasi ruangan/gudang untuk pengelompokan rak penyimpanan.</p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenZoneForm()}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Gudang / Zona</span>
              </button>
            </div>

            {/* Zone Form Inline */}
            {editingZone && (
              <form onSubmit={handleSaveZone} className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-3">
                <div className="flex justify-between items-center border-b border-emerald-200/60 pb-2">
                  <h5 className="text-xs font-black text-emerald-900 uppercase">
                    {editingZone.id ? 'Edit Data Gudang' : 'Tambah Gudang / Zona Baru'}
                  </h5>
                  <button type="button" onClick={() => setEditingZone(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Nama Gudang / Area *</label>
                  <input 
                    type="text"
                    placeholder="e.g. Gudang Garasi 2, Toko Lantai 2, Gudang Samping"
                    value={zoneName}
                    onChange={e => setZoneName(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Deskripsi Area Gudang</label>
                  <input 
                    type="text"
                    placeholder="Keterangan fungsi atau posisi ruangan"
                    value={zoneDesc}
                    onChange={e => setZoneDesc(e.target.value)}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditingZone(null)}
                    className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 shadow-2xs"
                  >
                    Simpan Zona
                  </button>
                </div>
              </form>
            )}

            {/* Zones Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
              {zones.map(z => {
                const rackCount = racks.filter(r => r.zone === z.name).length;
                return (
                  <div 
                    key={z.id}
                    className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs hover:border-emerald-300 transition-colors flex items-center justify-between group"
                  >
                    <div className="space-y-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <Warehouse className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-black text-slate-900 text-xs truncate">{z.name}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate">{z.description || 'Ruang tempat rak disimpan'}</p>
                      <span className="inline-block text-[10px] font-bold text-slate-400">
                        🏷️ Memuat {rackCount} Rak Terdaftar
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-95 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenZoneForm(z)}
                        className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Edit Zona"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteZone(z)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus Zona"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
