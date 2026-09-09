import React, { useState } from 'react';
import { SparePart, Supplier } from '../../types';
import { Sparkles, MapPin, Hash, Barcode as BarcodeIcon, Layers } from 'lucide-react';
import { generatePartSKU, DEFAULT_RACK_LIST } from '../../utils/inventory';

interface PartFormProps {
  part?: SparePart;
  suppliers: Supplier[];
  existingParts?: SparePart[];
  onSave: (p: SparePart) => void;
  onCancel: () => void;
}

export const PartForm: React.FC<PartFormProps> = ({ 
  part, 
  suppliers, 
  existingParts = [], 
  onSave, 
  onCancel 
}) => {
  const [formData, setFormData] = useState<SparePart>(() => {
    if (part && part.id) return part;
    const initialCategory = 'Oli';
    const autoSku = generatePartSKU(initialCategory, existingParts);
    return {
      id: 'P' + Math.floor(Math.random() * 1000),
      sku: autoSku,
      barcode: '',
      name: '',
      price: 0,
      purchasePrice: 0,
      stock: 0,
      minStock: 5,
      category: initialCategory,
      rackCode: 'Rak A',
      shelfLevel: 'Tingkat 1',
      binNumber: 'Kotak 01',
      rackZone: 'Gudang Utama',
      locationNotes: '',
      lastUpdated: new Date().toISOString(),
      supplierId: ''
    };
  });

  const handleCategoryChange = (newCategory: string) => {
    // If SKU is empty or follows the standard prefix pattern, update it automatically
    let updatedSku = formData.sku;
    if (!formData.sku || formData.sku.includes('-')) {
      updatedSku = generatePartSKU(newCategory, existingParts);
    }
    setFormData({ ...formData, category: newCategory, sku: updatedSku });
  };

  const handleGenerateSku = () => {
    const newSku = generatePartSKU(formData.category || 'Oli', existingParts);
    setFormData({ ...formData, sku: newSku });
  };

  const previewLocation = [
    formData.rackCode || 'Tanpa Rak',
    formData.shelfLevel,
    formData.binNumber ? `(${formData.binNumber})` : null
  ].filter(Boolean).join(' • ');

  return (
    <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
      {/* Basic Part Info */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nama Part / Barang *</label>
        <input 
          placeholder="Contoh: Oli Mesin 1L MPX2, Kampas Rem Vario..."
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold text-slate-900 focus:border-blue-500 transition-colors"
        />
      </div>

      {/* SKU / Part Numbering & Barcode */}
      <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-blue-700">
            <Hash className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-wider">Identitas & Penomoran Barang</span>
          </div>
          <button
            type="button"
            onClick={handleGenerateSku}
            className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-white px-2 py-1 rounded-lg border border-blue-200 shadow-2xs hover:bg-blue-50 transition-colors"
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            Auto-Generate SKU
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
              Nomor SKU / Kode Part *
            </label>
            <input 
              placeholder="e.g. OLI-001, REM-004..."
              value={formData.sku || ''}
              onChange={e => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
              className="w-full h-10 px-3 bg-white border border-blue-200 rounded-xl outline-none text-xs font-mono font-bold text-slate-900"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 flex items-center gap-1">
              <BarcodeIcon className="w-3 h-3 text-slate-400" />
              Barcode / No. Seri (Opsional)
            </label>
            <input 
              placeholder="e.g. 899123450011"
              value={formData.barcode || ''}
              onChange={e => setFormData({ ...formData, barcode: e.target.value })}
              className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl outline-none text-xs font-mono text-slate-700"
            />
          </div>
        </div>
      </div>

      {/* Warehouse & Rack Location Management */}
      <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200/60 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-amber-800">
            <MapPin className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-[10px] font-black uppercase tracking-wider">Letak Barang di Rak & Gudang</span>
          </div>
          <div className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md flex items-center gap-1">
            <span>📍 {previewLocation}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Kode Rak */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-600 uppercase ml-1">
              Kode Rak *
            </label>
            <input 
              list="rack-presets"
              placeholder="e.g. Rak A, Rak B..."
              value={formData.rackCode || ''}
              onChange={e => setFormData({ ...formData, rackCode: e.target.value })}
              className="w-full h-10 px-3 bg-white border border-amber-200 rounded-xl outline-none text-xs font-bold text-slate-900"
            />
            <datalist id="rack-presets">
              {DEFAULT_RACK_LIST.map(r => (
                <option key={r.code} value={r.code}>{r.name}</option>
              ))}
            </datalist>
          </div>

          {/* Tingkat / Ambalan */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-600 uppercase ml-1">
              Tingkat / Ambalan
            </label>
            <input 
              list="shelf-presets"
              placeholder="e.g. Tingkat 1, Tingkat 2..."
              value={formData.shelfLevel || ''}
              onChange={e => setFormData({ ...formData, shelfLevel: e.target.value })}
              className="w-full h-10 px-3 bg-white border border-amber-200 rounded-xl outline-none text-xs font-semibold text-slate-800"
            />
            <datalist id="shelf-presets">
              <option value="Tingkat 1 (Bawah)">Tingkat 1 (Bawah)</option>
              <option value="Tingkat 2 (Tengah)">Tingkat 2 (Tengah)</option>
              <option value="Tingkat 3 (Atas)">Tingkat 3 (Atas)</option>
              <option value="Tingkat 4 (Paling Atas)">Tingkat 4 (Paling Atas)</option>
              <option value="Gantungan Baris 1">Gantungan Baris 1</option>
              <option value="Etalase Kaca Depan">Etalase Kaca Depan</option>
            </datalist>
          </div>

          {/* Kotak / Bin / Slot */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-600 uppercase ml-1">
              Nomor Kotak / Bin
            </label>
            <input 
              placeholder="e.g. Kotak 01, Slot A, Bin 04..."
              value={formData.binNumber || ''}
              onChange={e => setFormData({ ...formData, binNumber: e.target.value })}
              className="w-full h-10 px-3 bg-white border border-amber-200 rounded-xl outline-none text-xs font-semibold text-slate-800"
            />
          </div>
        </div>

        {/* Zona & Catatan Petunjuk */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
              Zona / Ruang Gudang
            </label>
            <select
              value={formData.rackZone || 'Gudang Utama'}
              onChange={e => setFormData({ ...formData, rackZone: e.target.value })}
              className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl outline-none text-xs font-bold text-slate-700"
            >
              <option value="Gudang Utama">Gudang Utama</option>
              <option value="Toko Kasir">Toko Kasir / Etalase Depan</option>
              <option value="Gudang Belakang">Gudang Belakang</option>
              <option value="Area Servis Luar">Area Servis Luar</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">
              Petunjuk Tambahan Posisi
            </label>
            <input 
              placeholder="e.g. Dekat pintu kiri, susunan paling depan"
              value={formData.locationNotes || ''}
              onChange={e => setFormData({ ...formData, locationNotes: e.target.value })}
              className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl outline-none text-xs text-slate-700"
            />
          </div>
        </div>
      </div>

      {/* Pricing & Stock Details */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Harga Jual (Rp) *</label>
          <input 
            type="number"
            value={formData.price}
            onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold text-slate-900"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Harga Modal / Beli (Rp)</label>
          <input 
            type="number"
            value={formData.purchasePrice}
            onChange={e => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold text-slate-900"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Jumlah Stok Saat Ini</label>
          <input 
            type="number"
            value={formData.stock}
            onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold text-slate-900"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Kategori Barang</label>
          <select 
            value={formData.category}
            onChange={e => handleCategoryChange(e.target.value)}
            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold text-slate-900"
          >
            {['Oli', 'Rem', 'Busi', 'Filter', 'Kelistrikan', 'Ban', 'Mesin', 'CVT', 'Aksesoris'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Pemasok / Supplier Terhubung</label>
        <select 
          value={formData.supplierId || ''}
          onChange={e => setFormData({ ...formData, supplierId: e.target.value || undefined })}
          className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold text-slate-900"
        >
          <option value="">-- Tanpa Hubungan Supplier (Atur Nanti) --</option>
          {suppliers.map(s => (
            <option key={s.id} value={s.id}>{s.name} ({s.contact})</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 pt-4">
        <button 
          type="button"
          onClick={onCancel} 
          className="flex-1 h-14 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest transition-colors"
        >
          Batal
        </button>
        <button 
          type="button"
          onClick={() => onSave(formData)} 
          className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-200 transition-colors"
        >
          Simpan Part
        </button>
      </div>
    </div>
  );
};

