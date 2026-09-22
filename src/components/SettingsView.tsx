import React, { useState } from 'react';
import { 
  Building2, 
  Percent, 
  FileText, 
  ShieldCheck, 
  CheckCircle2, 
  Wrench, 
  Phone, 
  MapPin, 
  Clock, 
  User, 
  AlertTriangle,
  Sparkles,
  Smartphone,
  Eye,
  Sliders,
  DollarSign,
  Package,
  Layers,
  Image as ImageIcon,
  Upload,
  Trash2,
  Settings as SettingsIcon
} from 'lucide-react';
import { CompanySettings, Mechanic, UserRole } from '../types';

interface SettingsViewProps {
  settings: CompanySettings;
  mechanics: Mechanic[];
  currentUserRole?: UserRole;
  onUpdateSettings: (newSettings: CompanySettings) => void;
  onBatchUpdateMechanicBonus?: (newPercent: number) => void;
  onOpenMasterDataModal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  mechanics,
  currentUserRole = 'Owner',
  onUpdateSettings,
  onBatchUpdateMechanicBonus,
  onOpenMasterDataModal
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'bonus' | 'receipt'>('profile');
  const [formData, setFormData] = useState<CompanySettings>(settings);
  const [savedNotification, setSavedNotification] = useState<string | null>(null);
  const [simLaborFee, setSimLaborFee] = useState<number>(100000);

  const showNotification = (msg: string) => {
    setSavedNotification(msg);
    setTimeout(() => {
      setSavedNotification(null);
    }, 3000);
  };

  const handleSave = () => {
    onUpdateSettings(formData);
    showNotification('Pengaturan berhasil disimpan!');
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran file logo terlalu besar. Harap gunakan file gambar di bawah 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setFormData(prev => ({ ...prev, logoUrl: result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/svg+xml', 'image/webp'].includes(file.type)) {
      alert('Gunakan favicon PNG, ICO, SVG, atau WebP.');
      return;
    }
    if (file.size > 512 * 1024) {
      alert('Ukuran favicon maksimal 512 KB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = event => {
      const faviconUrl = event.target?.result as string;
      if (faviconUrl) setFormData(prev => ({ ...prev, faviconUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleBatchApplyBonus = () => {
    if (onBatchUpdateMechanicBonus) {
      onBatchUpdateMechanicBonus(formData.defaultMechanicBonusPercent);
      showNotification(`Default bonus ${formData.defaultMechanicBonusPercent}% berhasil diterapkan ke seluruh ${mechanics.length} mekanik!`);
    }
  };

  // Preview Calculations
  const simMechanicBonus = Math.round((simLaborFee * formData.defaultMechanicBonusPercent) / 100);
  const simWorkshopNet = simLaborFee - simMechanicBonus;

  return (
    <div className="space-y-6 pb-24 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white p-6 sm:p-8 rounded-[32px] shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-[10px] font-black uppercase tracking-wider text-blue-300">
                Pusat Konfigurasi Bengkel
              </span>
              <span className="px-2.5 py-0.5 bg-white/10 rounded-full text-[10px] font-bold text-slate-300">
                Hak Akses: {currentUserRole === 'Owner' ? '👑 Superadmin / Owner' : '🛠️ Admin / PIC'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Pengaturan Sistem & Profil
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
              Atur profil bengkel resmi, persentase bonus komisi teknisi mekanik, dan susunan isi nota/struk digital dalam satu tempat.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onOpenMasterDataModal && (
              <button
                type="button"
                onClick={onOpenMasterDataModal}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5"
              >
                <Layers className="w-4 h-4" />
                <span>Manajemen Kategori & Rak</span>
              </button>
            )}

          </div>
        </div>
      </div>

      {/* Floating Success Toast */}
      {savedNotification && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <span>{savedNotification}</span>
        </div>
      )}

      {/* Main Tab Navigation (3 Menu Terpadu) */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-1.5">
        <button
          type="button"
          onClick={() => setActiveSubTab('profile')}
          className={`flex-1 py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeSubTab === 'profile'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>1. Profil Bengkel</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('bonus')}
          className={`flex-1 py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeSubTab === 'bonus'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>2. Atur Persentase Bonus</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('receipt')}
          className={`flex-1 py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeSubTab === 'receipt'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>3. Isi Nota & Struk</span>
        </button>

      </div>

      {/* --- SUBTAB 1: FITUR PROFIL BENGKEL --- */}
      {activeSubTab === 'profile' && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" /> Profil Bengkel & Identitas Bisnis
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Informasi resmi bengkel yang akan tampil pada nota, invoice pelanggan, dan laporan.</p>
              </div>
              <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100 w-fit">
                Identitas Resmi
              </span>
            </div>

            {/* BRANDING & LOGO PLATFORM SECTION */}
            <div className="p-5 bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-slate-50 rounded-2xl border border-blue-100/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-sm">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                      Manajemen Branding & Logo Aplikasi
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Ubah nama platform/aplikasi dan upload logo kustom yang akan tampil di sidebar, header, dan nota resmi.
                    </p>
                  </div>
                </div>

                {/* Live Preview Badge */}
                <div className="flex items-center gap-3 bg-white px-3.5 py-2 rounded-xl border border-blue-200/80 shadow-xs shrink-0">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Preview Sidebar:</span>
                  <div className="flex items-center gap-2">
                    {formData.logoUrl ? (
                      <img 
                        src={formData.logoUrl} 
                        alt="Logo Preview" 
                        className="w-7 h-7 object-contain rounded-lg border border-slate-200 bg-slate-50" 
                      />
                    ) : (
                      <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xs">
                        {(formData.name || 'W').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs font-black text-slate-900 max-w-[120px] truncate">
                      {formData.name || 'WorkshopPro'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Input Nama Platform */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" /> Nama Platform / Aplikasi & Bengkel
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: AutoCare Pro / Bengkel Mandiri Jaya"
                    className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all shadow-2xs"
                  />
                  <p className="text-[10px] text-slate-500 ml-1">Nama ini akan digunakan di seluruh header aplikasi dan cetakan nota.</p>
                </div>

                {/* Upload & URL Logo */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-blue-600" /> Logo Aplikasi / Bengkel
                  </label>
                  
                  <div className="flex flex-col sm:flex-row items-stretch gap-2">
                    {/* File Upload Button */}
                    <label className="flex-1 cursor-pointer h-12 px-4 bg-white border border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50/50 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-blue-700 transition-all shadow-2xs group">
                      <Upload className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                      <span>{formData.logoUrl ? 'Ganti Logo (File)' : 'Upload Gambar Logo'}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleLogoFileUpload} 
                        className="hidden" 
                      />
                    </label>

                    {/* Clear Logo Button if exists */}
                    {formData.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, logoUrl: undefined })}
                        className="px-3.5 h-12 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shrink-0"
                        title="Hapus Logo Custom"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Hapus Logo</span>
                      </button>
                    )}
                  </div>

                  {/* Input Direct Image URL */}
                  <div className="pt-1">
                    <input
                      type="url"
                      value={formData.logoUrl || ''}
                      onChange={e => setFormData({ ...formData, logoUrl: e.target.value || undefined })}
                      placeholder="Atau masukkan URL Gambar Logo (https://... atau Data URI)"
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-[11px] font-medium text-slate-800 focus:border-blue-500 outline-none transition-all shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                    <SettingsIcon className="w-3.5 h-3.5 text-blue-600" /> Judul Tab Browser
                  </label>
                  <input
                    type="text"
                    value={formData.appTitle || ''}
                    onChange={e => setFormData({ ...formData, appTitle: e.target.value || undefined })}
                    placeholder={formData.name || 'BengkelPro POS'}
                    className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all shadow-2xs"
                  />
                  <p className="text-[10px] text-slate-500 ml-1">Kosongkan untuk memakai nama aplikasi/bengkel secara otomatis.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-blue-600" /> Favicon Tab Browser
                  </label>
                  <div className="flex gap-2">
                    <label className="flex-1 cursor-pointer h-12 px-4 bg-white border border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50/50 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-blue-700 transition-all">
                      <Upload className="w-4 h-4" />
                      <span>{formData.faviconUrl ? 'Ganti Favicon' : 'Upload Favicon'}</span>
                      <input type="file" accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/svg+xml,image/webp" onChange={handleFaviconFileUpload} className="hidden" />
                    </label>
                    {formData.faviconUrl && <button type="button" onClick={() => setFormData({ ...formData, faviconUrl: undefined })} className="px-3.5 h-12 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                  <div className="flex items-center gap-2">
                    {formData.faviconUrl && <img src={formData.faviconUrl} alt="Preview favicon" className="w-6 h-6 rounded border border-slate-200 object-contain bg-white" />}
                    <input type="url" value={formData.faviconUrl || ''} onChange={e => setFormData({ ...formData, faviconUrl: e.target.value || undefined })} placeholder="Atau URL favicon (https://...)" className="flex-1 h-10 px-3 bg-white border border-slate-200 rounded-xl text-[11px] font-medium text-slate-800 focus:border-blue-500 outline-none" />
                  </div>
                </div>
              </div>

              {/* Quick Preset Icons / Badges */}
              <div className="pt-2 border-t border-blue-100/60 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider mr-1">Preset Logo Cepat:</span>
                
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    logoUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%232563eb" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>'
                  })}
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  <Wrench className="w-3.5 h-3.5 text-blue-600" />
                  <span>Kunci Pas Blue</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    logoUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%23059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>'
                  })}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Perisai Emerald</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    logoUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%23d97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>'
                  })}
                  className="px-2.5 py-1 bg-white hover:bg-amber-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  <Building2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Mobil Amber</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">
                  Slogan / Tagline Bengkel
                </label>
                <input
                  type="text"
                  value={formData.slogan}
                  onChange={e => setFormData({ ...formData, slogan: e.target.value })}
                  placeholder="Contoh: Solusi Perawatan Terpercaya & Cepat"
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> Nomor Telepon / WhatsApp Bengkel
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0812-3456-7890 / 021-555123"
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">
                  Email Resmi Bengkel
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="kontak@bengkelpro.com"
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Alamat Lengkap Bengkel
                </label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Jl. Otomotif Raya No. 123, Blok B4, Jakarta Selatan"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500 outline-none resize-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Jam Operasional
                </label>
                <input
                  type="text"
                  value={formData.operationalHours || ''}
                  onChange={e => setFormData({ ...formData, operationalHours: e.target.value })}
                  placeholder="Senin - Sabtu: 08:00 - 17:00 WIB"
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" /> Nama Owner
                  </label>
                  <input
                    type="text"
                    value={formData.ownerName || ''}
                    onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                    placeholder="Nama Pemilik Bengkel"
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">
                    Nama Admin / PIC
                  </label>
                  <input
                    type="text"
                    value={formData.picName || ''}
                    onChange={e => setFormData({ ...formData, picName: e.target.value })}
                    placeholder="Rian Herlambang"
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Loyalty Program & Promo Settings */}
            <div className="p-6 bg-amber-50/60 border border-amber-200/80 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" /> Aturan Program Loyalitas & Promo Pelanggan Setia
                  </h4>
                  <p className="text-[11px] text-amber-900/80 mt-0.5">
                    Tentukan batas transaksi minimum dan persentase promo diskon otomatis untuk pelanggan yang sering servis.
                  </p>
                </div>
                <span className="text-[10px] font-bold bg-white text-amber-700 px-3 py-1 rounded-full border border-amber-200 w-fit">
                  Otomatis Terdeteksi di Kasir / POS
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                {/* Silver */}
                <div className="p-4 bg-white rounded-xl border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-blue-700 uppercase">🥈 Silver Member</span>
                    <span className="text-[10px] font-bold text-slate-500">Tier 1</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Min. Servis / Transaksi</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.loyaltySilverVisits ?? 3}
                      onChange={e => setFormData({ ...formData, loyaltySilverVisits: Number(e.target.value) })}
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Diskon Promo (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.loyaltySilverDiscountPercent ?? 5}
                        onChange={e => setFormData({ ...formData, loyaltySilverDiscountPercent: Number(e.target.value) })}
                        className="w-full h-10 px-3 pr-7 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-blue-600"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                    </div>
                  </div>
                </div>

                {/* Gold */}
                <div className="p-4 bg-white rounded-xl border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-600 uppercase">🥇 Gold Member</span>
                    <span className="text-[10px] font-bold text-slate-500">Tier 2</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Min. Servis / Transaksi</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.loyaltyGoldVisits ?? 6}
                      onChange={e => setFormData({ ...formData, loyaltyGoldVisits: Number(e.target.value) })}
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Diskon Promo (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.loyaltyGoldDiscountPercent ?? 10}
                        onChange={e => setFormData({ ...formData, loyaltyGoldDiscountPercent: Number(e.target.value) })}
                        className="w-full h-10 px-3 pr-7 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-amber-600"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                    </div>
                  </div>
                </div>

                {/* VIP */}
                <div className="p-4 bg-white rounded-xl border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-purple-700 uppercase">👑 VIP Member</span>
                    <span className="text-[10px] font-bold text-slate-500">Top Tier</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Min. Servis / Transaksi</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.loyaltyVipVisits ?? 10}
                      onChange={e => setFormData({ ...formData, loyaltyVipVisits: Number(e.target.value) })}
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Diskon Promo (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.loyaltyVipDiscountPercent ?? 15}
                        onChange={e => setFormData({ ...formData, loyaltyVipDiscountPercent: Number(e.target.value) })}
                        className="w-full h-10 px-3 pr-7 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-purple-700"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Role Overview */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm">
                  {currentUserRole === 'Owner' ? '👑' : '🛠️'}
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900">
                    Sistem Peran: {currentUserRole === 'Owner' ? 'Superadmin / Owner (Akses Penuh)' : 'Admin / PIC (Operasional & Kasir)'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Mekanik lapangan tidak memiliki akun login aplikasi, seluruh pencatatan dilakukan oleh PIC / Owner.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSave}
                className="px-6 py-3 bg-blue-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md hover:bg-blue-700 active:scale-95 transition-all w-full sm:w-auto"
              >
                Simpan Profil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SUBTAB 2: ATUR PERSENTASE BONUS & DENDA MEKANIK --- */}
      {activeSubTab === 'bonus' && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Percent className="w-5 h-5 text-blue-600" /> Pengaturan Bonus & Sanksi Mekanik
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tentukan persentase bagi hasil jasa pengerjaan servis serta kebijakan sanksi garansi dan mangkir.
                </p>
              </div>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100 w-fit">
                Bagi Hasil Jasa Servis
              </span>
            </div>

            {/* Default Bonus Slider & Input */}
            <div className="p-5 bg-blue-50/70 border border-blue-100 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-black text-blue-950 uppercase tracking-wider">
                    Persentase Bonus Standar Bengkel (%)
                  </h4>
                  <p className="text-[11px] text-blue-800/80">
                    Persentase ini akan otomatis menjadi nilai default untuk mekanik baru dan transaksi servis baru.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-blue-200">
                  <span className="text-2xl font-black text-blue-600">{formData.defaultMechanicBonusPercent}</span>
                  <span className="text-sm font-black text-slate-400">%</span>
                </div>
              </div>

              {/* Range Slider */}
              <div className="space-y-2">
                <input 
                  type="range"
                  min="0"
                  max="50"
                  step="1"
                  value={formData.defaultMechanicBonusPercent}
                  onChange={e => setFormData({ ...formData, defaultMechanicBonusPercent: Number(e.target.value) })}
                  className="w-full accent-blue-600 cursor-pointer h-2 bg-blue-200 rounded-lg"
                />
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>0% (Gaji Murni)</span>
                  <span>10%</span>
                  <span>15% (Rekomendasi)</span>
                  <span>25%</span>
                  <span>50% (Bagi Rata)</span>
                </div>
              </div>

              {/* Batch Apply Button */}
              {onBatchUpdateMechanicBonus && mechanics.length > 0 && (
                <div className="pt-2 border-t border-blue-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-[11px] text-blue-900 font-medium">
                    Ingin mengubah bonus seluruh <strong>{mechanics.length} mekanik</strong> saat ini menjadi {formData.defaultMechanicBonusPercent}%?
                  </span>
                  <button
                    type="button"
                    onClick={handleBatchApplyBonus}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-wider rounded-xl shadow-sm transition-all active:scale-95 shrink-0"
                  >
                    Terapkan ke Seluruh Mekanik
                  </button>
                </div>
              )}
            </div>

            {/* Kebijakan Transaksi & Sanksi Denda */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
                    Fleksibilitas Transaksi
                  </label>
                  <Sliders className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-[11px] text-slate-500">
                  Izinkan Admin/PIC menyesuaikan persentase bonus per transaksi kasir.
                </p>
                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allowCustomBonusPerTransaction}
                      onChange={e => setFormData({ ...formData, allowCustomBonusPerTransaction: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-xs font-bold text-slate-800">Aktifkan Kustomisasi Bonus di POS</span>
                  </label>
                </div>
              </div>

              <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-100 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-rose-800 uppercase tracking-wider">
                    Denda Komplain Garansi
                  </label>
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                </div>
                <p className="text-[11px] text-rose-700/80">
                  Standar sanksi potong gaji jika hasil servis mekanik dikomplain pelanggan.
                </p>
                <div className="relative pt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={formData.defaultWarrantyPenalty}
                    onChange={e => setFormData({ ...formData, defaultWarrantyPenalty: Number(e.target.value) })}
                    className="w-full h-11 pl-9 pr-3 bg-white border border-rose-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-100 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-amber-800 uppercase tracking-wider">
                    Denda Mangkir H+1 Klaim
                  </label>
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-[11px] text-amber-700/80">
                  Denda tambahan jika mekanik tidak masuk kerja saat garansi harus diservis ulang.
                </p>
                <div className="relative pt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={formData.defaultAbsencePenalty}
                    onChange={e => setFormData({ ...formData, defaultAbsencePenalty: Number(e.target.value) })}
                    className="w-full h-11 pl-9 pr-3 bg-white border border-amber-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Live Interactive Bonus Simulation */}
            <div className="p-6 bg-slate-900 text-white rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                    Kalkulator Simulasi Bagi Hasil Jasa Servis
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Contoh Biaya Jasa:</span>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">Rp</span>
                    <input
                      type="number"
                      step="10000"
                      value={simLaborFee}
                      onChange={e => setSimLaborFee(Number(e.target.value))}
                      className="w-32 h-8 pl-7 pr-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Total Jasa Servis</p>
                  <p className="text-lg font-black text-white mt-0.5">Rp {simLaborFee.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-blue-900/40 rounded-xl border border-blue-500/30">
                  <p className="text-[10px] font-bold text-blue-300 uppercase">
                    Bonus Mekanik ({formData.defaultMechanicBonusPercent}%)
                  </p>
                  <p className="text-lg font-black text-emerald-400 mt-0.5">+Rp {simMechanicBonus.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    Bagian Bengkel ({100 - formData.defaultMechanicBonusPercent}%)
                  </p>
                  <p className="text-lg font-black text-blue-400 mt-0.5">Rp {simWorkshopNet.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSave}
                className="px-8 py-3.5 bg-blue-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md hover:bg-blue-700 active:scale-95 transition-all"
              >
                Simpan Konfigurasi Bonus & Denda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SUBTAB 3: ISI NOTA & STRUK (INVOICE CUSTOMIZATION) --- */}
      {activeSubTab === 'receipt' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form Settings (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" /> Kustomisasi Isi Nota & Struk
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pilih informasi apa saja yang dicetak pada struk kasir atau dibagikan ke WhatsApp pelanggan.
                  </p>
                </div>
                <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-3 py-1 rounded-full border border-purple-100">
                  Format Cetak & WA
                </span>
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  Elemen yang Ditampilkan di Nota
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100/70 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.showMechanicOnReceipt}
                      onChange={e => setFormData({ ...formData, showMechanicOnReceipt: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <div className="text-left">
                      <span className="text-xs font-bold text-slate-900 block">Nama Mekanik</span>
                      <span className="text-[10px] text-slate-400">Tampilkan teknisi yang mengerjakan</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100/70 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.showWarrantyOnReceipt}
                      onChange={e => setFormData({ ...formData, showWarrantyOnReceipt: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <div className="text-left">
                      <span className="text-xs font-bold text-slate-900 block">Klausul Garansi Servis</span>
                      <span className="text-[10px] text-slate-400">Jaminan perbaikan & syarat klaim</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100/70 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.showOdometerOnReceipt}
                      onChange={e => setFormData({ ...formData, showOdometerOnReceipt: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <div className="text-left">
                      <span className="text-xs font-bold text-slate-900 block">Kilometer (Odometer)</span>
                      <span className="text-[10px] text-slate-400">Catatan jarak tempuh saat masuk</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100/70 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.showCustomerPhoneOnReceipt}
                      onChange={e => setFormData({ ...formData, showCustomerPhoneOnReceipt: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <div className="text-left">
                      <span className="text-xs font-bold text-slate-900 block">Kontak Pelanggan</span>
                      <span className="text-[10px] text-slate-400">Nomor telepon pemilik kendaraan</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 rounded-2xl border border-violet-200 bg-violet-50/50 p-4">
                <div><p className="text-xs font-black text-violet-950">Dua Template Nota</p><p className="text-[10px] text-violet-700">Template dipilih otomatis sesuai transaksi: servis atau pembelian barang.</p></div>
                <label className="text-[10px] font-bold text-slate-600">Header Nota Servis<input value={formData.serviceReceiptHeader || ''} onChange={e => setFormData({ ...formData, serviceReceiptHeader: e.target.value })} className="mt-1 h-10 w-full rounded-xl border bg-white px-3 text-xs font-bold" placeholder="NOTA TRANSAKSI SERVIS" /></label>
                <label className="text-[10px] font-bold text-slate-600">Footer Nota Servis<textarea value={formData.serviceReceiptFooter || ''} onChange={e => setFormData({ ...formData, serviceReceiptFooter: e.target.value })} className="mt-1 min-h-16 w-full rounded-xl border bg-white px-3 py-2 text-xs" /></label>
                <label className="text-[10px] font-bold text-slate-600">Garansi jasa default (hari)<input type="number" min="0" value={formData.defaultServiceWarrantyDays ?? 7} onChange={e => setFormData({ ...formData, defaultServiceWarrantyDays: Number(e.target.value) })} className="mt-1 h-10 w-full rounded-xl border bg-white px-3 text-xs font-bold" /></label>
                <label className="text-[10px] font-bold text-slate-600">Ketentuan garansi jasa<textarea value={formData.serviceWarrantyTerms || ''} onChange={e => setFormData({ ...formData, serviceWarrantyTerms: e.target.value })} className="mt-1 min-h-16 w-full rounded-xl border bg-white px-3 py-2 text-xs" /></label>
                <label className="text-[10px] font-bold text-slate-600">Header Nota Pembelian<input value={formData.saleReceiptHeader || ''} onChange={e => setFormData({ ...formData, saleReceiptHeader: e.target.value })} className="mt-1 h-10 w-full rounded-xl border bg-white px-3 text-xs font-bold" placeholder="NOTA PEMBELIAN BARANG" /></label>
                <label className="text-[10px] font-bold text-slate-600">Footer Nota Pembelian<textarea value={formData.saleReceiptFooter || ''} onChange={e => setFormData({ ...formData, saleReceiptFooter: e.target.value })} className="mt-1 min-h-16 w-full rounded-xl border bg-white px-3 py-2 text-xs" /></label>
              </div>

              {/* Text Customizations */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">
                    Judul Header Nota
                  </label>
                  <input
                    type="text"
                    value={formData.receiptHeader || ''}
                    onChange={e => setFormData({ ...formData, receiptHeader: e.target.value })}
                    placeholder="Contoh: NOTA RESMI & RINCIAN SERVIS"
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">
                    Ketentuan Garansi Servis (Ditampilkan di Nota)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.warrantyTerms}
                    onChange={e => setFormData({ ...formData, warrantyTerms: e.target.value })}
                    placeholder="Contoh: Garansi servis 7 hari atau 500 KM untuk pengerjaan yang sama. Simpan nota ini sebagai bukti klaim."
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none resize-none focus:bg-white focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">
                    Kontak Bantuan & Booking WhatsApp (Di Nota)
                  </label>
                  <input
                    type="text"
                    value={formData.receiptContactHelp || ''}
                    onChange={e => setFormData({ ...formData, receiptContactHelp: e.target.value })}
                    placeholder="Contoh: WhatsApp CS: 0812-3456-7890"
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">
                    Catatan Kaki (Footer Note / Ucapan Terima Kasih)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.footerNote}
                    onChange={e => setFormData({ ...formData, footerNote: e.target.value })}
                    placeholder="Contoh: Barang yang sudah dibeli tidak dapat dikembalikan kecuali perjanjian. Terima kasih atas kepercayaan Anda merawat motor di bengkel kami."
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none resize-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleSave}
                className="w-full py-4 bg-blue-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md hover:bg-blue-700 active:scale-95 transition-all"
              >
                Simpan Format Nota
              </button>
            </div>
          </div>

          {/* Right Column: Live Struk Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-blue-600" /> Pratinjau Struk Kasir / Nota Digital
              </span>
              <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                Live Preview
              </span>
            </div>

            {/* Simulated Paper Struk */}
            <div className="receipt-light bg-white rounded-3xl p-6 shadow-xl border border-slate-200/90 font-sans text-slate-800 space-y-4 relative overflow-hidden">
              {/* Top Accent Strip */}
              <div className="h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 -mx-6 -mt-6 mb-4" />

              {/* Receipt Header */}
              <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-200">
                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                  {formData.name || 'NAMA BENGKEL'}
                </h4>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {formData.slogan || 'Slogan Bengkel Anda'}
                </p>
                {formData.address && (
                  <p className="text-[9px] text-slate-400 font-medium leading-tight max-w-[240px] mx-auto">
                    {formData.address}
                  </p>
                )}
                {formData.phone && (
                  <p className="text-[9px] font-bold text-blue-600">
                    Telp/WA: {formData.phone}
                  </p>
                )}
                {formData.receiptHeader && (
                  <div className="pt-2">
                    <span className="text-[9px] font-black uppercase bg-slate-100 px-2.5 py-0.5 rounded text-slate-700">
                      {formData.receiptHeader}
                    </span>
                  </div>
                )}
              </div>

              {/* Receipt Meta */}
              <div className="grid grid-cols-2 text-[10px] gap-2 pb-3 border-b border-dashed border-slate-200">
                <div>
                  <span className="text-slate-400 block font-bold">No. Nota:</span>
                  <span className="font-mono font-bold text-slate-800">INV-84920</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block font-bold">Tanggal:</span>
                  <span className="font-bold text-slate-800">07 Sep 2026</span>
                </div>

                <div>
                  <span className="text-slate-400 block font-bold">Pelanggan:</span>
                  <span className="font-bold text-slate-900 uppercase">Hendrawan Pratama</span>
                  {formData.showCustomerPhoneOnReceipt && (
                    <span className="text-[9px] text-slate-500 block">0812-9988-7766</span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block font-bold">Kendaraan:</span>
                  <span className="font-mono font-black text-slate-900 uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                    B 4567 ABC
                  </span>
                  <span className="text-[9px] text-slate-500 block">Honda Vario 160</span>
                </div>

                {formData.showOdometerOnReceipt && (
                  <div>
                    <span className="text-slate-400 block font-bold">Kilometer (KM):</span>
                    <span className="font-bold text-slate-800 font-mono">14.250 KM</span>
                  </div>
                )}

                {formData.showMechanicOnReceipt && (
                  <div className={formData.showOdometerOnReceipt ? "text-right" : "col-span-2"}>
                    <span className="text-slate-400 block font-bold">Mekanik Penanggung Jawab:</span>
                    <span className="font-black text-blue-700">
                      Rudi Hermawan (Teknisi)
                    </span>
                  </div>
                )}
              </div>

              {/* Line Items */}
              <div className="space-y-2 text-xs pb-3 border-b border-dashed border-slate-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-slate-900">Jasa Servis CVT & Ganti Oli</p>
                    <p className="text-[9px] text-slate-400">Pengerjaan mesin & pembersihan CVT</p>
                  </div>
                  <span className="font-bold text-slate-800">Rp 50.000</span>
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-slate-900">Oli Mesin Matic 0.8L</p>
                    <p className="text-[9px] text-slate-400">1 pcs x Rp 65.000</p>
                  </div>
                  <span className="font-bold text-slate-800">Rp 65.000</span>
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-slate-900">Roller Set Racing</p>
                    <p className="text-[9px] text-slate-400">1 set x Rp 80.000</p>
                  </div>
                  <span className="font-bold text-slate-800">Rp 80.000</span>
                </div>
              </div>

              {/* Total Card */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex justify-between items-center">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Pembayaran</span>
                  <span className="text-[10px] font-black text-emerald-600 uppercase">Lunas (Tunai)</span>
                </div>
                <span className="text-lg font-black text-blue-600 tracking-tight">Rp 195.000</span>
              </div>

              {/* Warranty Notice (if enabled) */}
              {formData.showWarrantyOnReceipt && formData.warrantyTerms && (
                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-blue-900 text-[10px] font-black uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Ketentuan Garansi Servis:</span>
                  </div>
                  <p className="text-[10px] text-blue-800 leading-relaxed font-medium">
                    {formData.warrantyTerms}
                  </p>
                </div>
              )}

              {/* Contact Help */}
              {formData.receiptContactHelp && (
                <div className="text-center text-[10px] text-slate-600 font-bold bg-slate-50 p-2 rounded-lg">
                  📞 {formData.receiptContactHelp}
                </div>
              )}

              {/* Footer Note */}
              <div className="text-center space-y-1 pt-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                  {formData.name || 'BENGKEL KITA'} • TERIMA KASIH
                </p>
                <p className="text-[9px] text-slate-400 font-medium leading-normal max-w-[280px] mx-auto italic">
                  "{formData.footerNote}"
                </p>
              </div>

              {/* Simulated Paper Bottom Zigzag accent */}
              <div className="pt-2 text-center text-[10px] font-mono text-slate-300">
                - - - - - - - - - - - - - - - - - - - - - - -
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
