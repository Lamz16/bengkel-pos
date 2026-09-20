import React, { useState, useRef } from 'react';
import { SparePart, Supplier, PartCategory, WarehouseRack, WarehouseZone } from '../../types';
import { Sparkles, MapPin, Hash, Barcode as BarcodeIcon, Image as ImageIcon, Upload, Trash2, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';
import { generatePartSKU, DEFAULT_RACK_LIST, DEFAULT_PART_CATEGORIES, DEFAULT_WAREHOUSE_ZONES } from '../../utils/inventory';
import { compressAndConvertToWebP, formatBytes, CompressionResult } from '../../utils/imageCompressor';
import { api } from '../../services/api';
import { CurrencyInput } from '../CurrencyInput';

interface PartFormProps {
  part?: SparePart;
  suppliers: Supplier[];
  existingParts?: SparePart[];
  categories?: PartCategory[];
  racks?: WarehouseRack[];
  zones?: WarehouseZone[];
  onSave: (p: SparePart) => void;
  onCancel: () => void;
}

export const PartForm: React.FC<PartFormProps> = ({ 
  part, 
  suppliers, 
  existingParts = [], 
  categories = DEFAULT_PART_CATEGORIES,
  racks,
  zones = DEFAULT_WAREHOUSE_ZONES,
  onSave, 
  onCancel 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [compressionMeta, setCompressionMeta] = useState<CompressionResult | null>(null);

  const [formData, setFormData] = useState<SparePart>(() => {
    if (part && part.id) return part;
    const initialCategory = categories[0] || DEFAULT_PART_CATEGORIES[0];
    const initialRack = racks?.[0];
    const autoSku = generatePartSKU(initialCategory.name, existingParts, categories);
    return {
      id: 'P' + Math.floor(Math.random() * 1000),
      sku: autoSku,
      barcode: '',
      name: '',
      variantName: 'Ukuran',
      size: '',
      price: 0,
      purchasePrice: 0,
      stock: 0,
      minStock: 5,
      hasProductWarranty: false,
      warrantyDurationDays: 0,
      warrantyTerms: '',
      category: initialCategory.name,
      categoryId: initialCategory.id,
      rackCode: initialRack?.code,
      rackId: initialRack?.id,
      shelfLevel: 'Tingkat 1',
      binNumber: 'Kotak 01',
      rackZone: initialRack?.zone,
      locationNotes: '',
      lastUpdated: new Date().toISOString(),
      supplierId: '',
      imageUrl: ''
    };
  });

  const handleCategoryChange = (categoryId: string) => {
    const selected = categories.find(category => category.id === categoryId);
    if (!selected) return;
    // If SKU is empty or follows the standard prefix pattern, update it automatically
    let updatedSku = formData.sku;
    if (!formData.sku || formData.sku.includes('-')) {
      updatedSku = generatePartSKU(selected.name, existingParts, categories);
    }
    setFormData({ ...formData, categoryId: selected.id, category: selected.name, sku: updatedSku });
  };

  const handleGenerateSku = () => {
    const newSku = generatePartSKU(formData.category || 'Oli', existingParts, categories);
    setFormData({ ...formData, sku: newSku });
  };

  const processImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Harap pilih berkas gambar (JPG, PNG, WEBP, GIF, DLL)');
      return;
    }
    try {
      setIsCompressing(true);
      // 1. Convert & compress client-side to WebP
      const compressed = await compressAndConvertToWebP(file, { maxWidth: 900, maxHeight: 900, quality: 0.82 });
      setCompressionMeta(compressed);

      // 2. Save WebP to local server storage (/uploads/parts/)
      try {
        const res = await api.uploadImage(compressed.webpDataUrl, 'parts');
        if (res && res.url) {
          setFormData(prev => ({ ...prev, imageUrl: res.url }));
        } else {
          setFormData(prev => ({ ...prev, imageUrl: compressed.webpDataUrl }));
        }
      } catch (err) {
        console.warn('Backend upload fallback to compressed data URL:', err);
        setFormData(prev => ({ ...prev, imageUrl: compressed.webpDataUrl }));
      }
    } catch (err) {
      console.error('Error compressing image:', err);
      alert('Gagal mengompresi gambar.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const previewLocation = [
    formData.rackCode || 'Tanpa Rak',
    formData.shelfLevel,
    formData.binNumber ? `(${formData.binNumber})` : null
  ].filter(Boolean).join(' • ');

  return (
    <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
      {/* Upload Foto & Format WebP Compressor */}
      <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-sm space-y-3 border border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-400">
            <ImageIcon className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-wider">Foto Barang (WebP Formatter & Compressor)</span>
          </div>
          {formData.imageUrl && (
            <button
              type="button"
              onClick={() => {
                setFormData(prev => ({ ...prev, imageUrl: '' }));
                setCompressionMeta(null);
              }}
              className="flex items-center gap-1 text-[11px] font-bold text-rose-400 hover:text-rose-300 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus Foto
            </button>
          )}
        </div>

        <input 
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              processImageFile(e.target.files[0]);
            }
          }}
        />

        {formData.imageUrl ? (
          <div className="flex flex-col sm:flex-row gap-4 items-center bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
            <div className="relative w-28 h-28 rounded-xl bg-slate-950 overflow-hidden border border-slate-700 shrink-0 group">
              <img 
                src={formData.imageUrl} 
                alt={formData.name || 'Foto Part'} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-md hover:bg-blue-500"
                >
                  Ganti
                </button>
              </div>
            </div>

            <div className="space-y-1.5 flex-1 text-center sm:text-left">
              <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-300">Tersimpan format WebP lokal</span>
              </div>
              <p className="text-[11px] text-slate-300 font-mono break-all">
                {formData.imageUrl.length > 50 ? `${formData.imageUrl.substring(0, 45)}...` : formData.imageUrl}
              </p>
              {compressionMeta && (
                <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
                  <span className="text-[10px] bg-blue-900/60 text-blue-300 font-bold px-2 py-0.5 rounded border border-blue-700/50">
                    Dimensi: {compressionMeta.width}x{compressionMeta.height} px
                  </span>
                  <span className="text-[10px] bg-emerald-900/60 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-700/50">
                    Ukuran WebP: {formatBytes(compressionMeta.compressedSize)} (-{compressionMeta.compressionRatio}%)
                  </span>
                </div>
              )}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                  Pilih / Unggah Ulang
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              dragActive 
                ? 'border-blue-500 bg-blue-950/40 text-blue-300 scale-[0.99]' 
                : 'border-slate-700 hover:border-slate-500 bg-slate-800/40 text-slate-400 hover:text-slate-200'
            }`}
          >
            {isCompressing ? (
              <div className="space-y-2 py-2 flex flex-col items-center">
                <RefreshCw className="w-7 h-7 text-blue-400 animate-spin" />
                <p className="text-xs font-bold text-blue-300">Mengompresi & Mengonversi ke WebP...</p>
                <p className="text-[10px] text-slate-400">Mengurangi ukuran berkas secara otomatis</p>
              </div>
            ) : (
              <div className="space-y-2 py-1 flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 shadow-inner">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-200">
                    Klik atau Tarik Berkas Gambar ke Sini
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Otomatis dikompres & dikonversi ke format WebP ringan (PNG, JPG, HEIC, GIF)
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Jenis Variasi</label>
          <input
            placeholder="Contoh: Ukuran, Tipe, Warna"
            value={formData.variantName || 'Ukuran'}
            onChange={e => setFormData({ ...formData, variantName: e.target.value })}
            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold text-slate-900"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nilai Variasi / Ukuran</label>
          <input
            placeholder="Contoh: 80/90-14, 1 Liter, STD"
            value={formData.size || ''}
            onChange={e => setFormData({ ...formData, size: e.target.value })}
            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold text-slate-900"
          />
          <p className="text-[10px] text-slate-400 ml-1">Stok, harga, dan posisi rak dicatat untuk tiap variasi ini.</p>
        </div>
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
            <select
              value={formData.rackId || ''}
              onChange={e => {
                const selected = (racks || []).find(r => r.id === e.target.value);
                setFormData({ ...formData, rackId: selected?.id, rackCode: selected?.code, rackZone: selected?.zone });
              }}
              className="w-full h-10 px-3 bg-white border border-amber-200 rounded-xl outline-none text-xs font-bold text-slate-900"
            >
              <option value="">-- Tanpa Rak --</option>
              {(racks || []).map(r => (
                <option key={r.id} value={r.id}>{r.code} — {r.name} ({r.zone})</option>
              ))}
            </select>
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
            <div className="w-full h-9 px-3 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center">
              {formData.rackZone || 'Mengikuti gudang dari rak'}
            </div>
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
      <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200/70 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] font-black uppercase tracking-wider">Garansi Pembelian Barang</span>
          </div>
          <label className="flex items-center gap-2 text-xs font-black text-emerald-800 cursor-pointer">
            <input type="checkbox" checked={!!formData.hasProductWarranty}
              onChange={e => setFormData({ ...formData, hasProductWarranty: e.target.checked, warrantyDurationDays: e.target.checked ? Math.max(1, formData.warrantyDurationDays || 30) : 0 })}
              className="w-4 h-4 accent-emerald-600" /> Ada garansi
          </label>
        </div>
        {formData.hasProductWarranty && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Durasi Garansi (hari)</label>
              <input type="number" min="1" value={formData.warrantyDurationDays || ''}
                onChange={e => setFormData({ ...formData, warrantyDurationDays: Math.max(0, Number(e.target.value)) })}
                className="w-full h-10 px-3 bg-white border border-emerald-200 rounded-xl outline-none text-xs font-bold text-slate-900" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Syarat Garansi</label>
              <input placeholder="Contoh: Segel utuh, nota wajib dibawa"
                value={formData.warrantyTerms || ''}
                onChange={e => setFormData({ ...formData, warrantyTerms: e.target.value })}
                className="w-full h-10 px-3 bg-white border border-emerald-200 rounded-xl outline-none text-xs text-slate-800" />
            </div>
          </div>
        )}
      </div>

      {/* Pricing & Stock Details */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Harga Jual (Rp) *</label>
          <CurrencyInput 
            value={formData.price}
            onValueChange={price => setFormData({ ...formData, price })}
            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold text-slate-900"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Harga Modal / Beli (Rp)</label>
          <CurrencyInput 
            value={formData.purchasePrice}
            onValueChange={purchasePrice => setFormData({ ...formData, purchasePrice })}
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
            value={formData.categoryId || categories.find(c => c.name === formData.category)?.id || ''}
            onChange={e => handleCategoryChange(e.target.value)}
            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold text-slate-900"
          >
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.skuPrefix || c.name.slice(0, 3).toUpperCase()})</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
            Pemasok / Supplier Terhubung {formData.stock > 0 ? <span className="text-rose-500">*</span> : null}
          </label>
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
          onClick={() => {
            if (formData.stock > 0 && !formData.supplierId) {
              alert('Pilih pemasok untuk stok awal agar transaksi masuk dapat dicatat.');
              return;
            }
            onSave(formData);
          }} 
          className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-200 transition-colors"
        >
          Simpan Part
        </button>
      </div>
    </div>
  );
};
