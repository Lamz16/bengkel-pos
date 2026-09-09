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
  RotateCcw,
  Sparkles,
  Smartphone,
  Eye,
  Sliders,
  DollarSign,
  Server,
  Activity,
  Key,
  Copy,
  Check,
  RefreshCw,
  Terminal,
  Code
} from 'lucide-react';
import { CompanySettings, Mechanic, UserRole } from '../types';
import { 
  getApiBaseUrl, 
  setApiBaseUrl, 
  resetApiBaseUrl, 
  getAuthToken, 
  setAuthToken, 
  healthApi, 
  ApiHealthStatus, 
  ENDPOINTS 
} from '../services/api';

interface SettingsViewProps {
  settings: CompanySettings;
  mechanics: Mechanic[];
  currentUserRole?: UserRole;
  onUpdateSettings: (newSettings: CompanySettings) => void;
  onBatchUpdateMechanicBonus?: (newPercent: number) => void;
  onSwitchRole?: (newRole: UserRole) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  mechanics,
  currentUserRole = 'Owner',
  onUpdateSettings,
  onBatchUpdateMechanicBonus,
  onSwitchRole
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'bonus' | 'receipt' | 'api'>('profile');
  const [formData, setFormData] = useState<CompanySettings>(settings);
  const [savedNotification, setSavedNotification] = useState<string | null>(null);
  const [simLaborFee, setSimLaborFee] = useState<number>(100000);

  // REST API Configuration States
  const [apiBaseUrl, setApiBaseUrlState] = useState<string>(getApiBaseUrl());
  const [apiTokenInput, setApiTokenInput] = useState<string>(getAuthToken() || '');
  const [healthStatus, setHealthStatus] = useState<ApiHealthStatus | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const handleTestApiConnection = async () => {
    setIsTestingConnection(true);
    setHealthStatus(null);
    try {
      const res = await healthApi.checkConnection(apiBaseUrl);
      setHealthStatus(res);
    } catch (err: any) {
      setHealthStatus({
        online: false,
        url: apiBaseUrl,
        message: err.message || 'Gagal terhubung ke REST API.',
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSaveApiSettings = () => {
    setApiBaseUrl(apiBaseUrl);
    if (apiTokenInput.trim()) {
      setAuthToken(apiTokenInput.trim());
    }
    showNotification('Konfigurasi REST API berhasil disimpan!');
  };

  const handleResetApiUrl = () => {
    resetApiBaseUrl();
    const def = getApiBaseUrl();
    setApiBaseUrlState(def);
    showNotification(`URL direset ke bawaan: ${def}`);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedEndpoint(label);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

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

          {onSwitchRole && (
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 p-3 rounded-2xl flex items-center gap-3 shrink-0">
              <div className="text-right">
                <span className="text-[10px] text-slate-300 uppercase block font-bold">Ganti Peran Aktif:</span>
                <span className="text-xs font-black text-white">
                  {currentUserRole === 'Owner' ? 'Superadmin / Owner' : 'Admin / PIC'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onSwitchRole(currentUserRole === 'Owner' ? 'Admin' : 'Owner')}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-md"
              >
                Ganti ke {currentUserRole === 'Owner' ? 'Admin/PIC' : 'Owner'}
              </button>
            </div>
          )}
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

        <button
          type="button"
          onClick={() => setActiveSubTab('api')}
          className={`flex-1 py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeSubTab === 'api'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>4. Integrasi REST API</span>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">
                  Nama Bengkel
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: BengkelPro Motor Mandiri"
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">
                  Slogan / Tagline
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
                    placeholder="Bambang Sutrisno"
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
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200/90 font-sans text-slate-800 space-y-4 relative overflow-hidden">
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

      {/* --- SUBTAB 4: INTEGRASI REST API --- */}
      {activeSubTab === 'api' && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Server className="w-5 h-5 text-blue-600" /> Integrasi REST API Backend
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hubungkan sistem BengkelPro ke server REST API kustom Anda untuk sinkronisasi data transaksi, stok, pelanggan, dan laporan.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {healthStatus?.online ? (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    API Terhubung ({healthStatus.latencyMs}ms)
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase border border-slate-200">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    Status: Siap Dikonfigurasi
                  </span>
                )}
              </div>
            </div>

            {/* Server Connection Form */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-blue-600" /> Server Base URL
                  </h4>
                  <button
                    type="button"
                    onClick={handleResetApiUrl}
                    className="text-[10px] font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset Bawaan
                  </button>
                </div>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={apiBaseUrl}
                    onChange={e => setApiBaseUrlState(e.target.value)}
                    placeholder="https://api.bengkelanda.com/v1"
                    className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:border-blue-500 outline-none"
                  />
                  <p className="text-[10px] text-slate-400">
                    Endpoint API akan diawali dengan Base URL ini (misal: <code className="text-blue-600 font-bold">{apiBaseUrl}/services</code>).
                  </p>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-slate-400" /> Authorization Bearer Token (Opsional)
                  </label>
                  <input
                    type="password"
                    value={apiTokenInput}
                    onChange={e => setApiTokenInput(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:border-blue-500 outline-none"
                  />
                  <p className="text-[10px] text-slate-400">
                    Jika REST API Anda membutuhkan autentikasi header <code>Authorization: Bearer &lt;token&gt;</code>.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveApiSettings}
                    className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow transition-all active:scale-95"
                  >
                    Simpan Konfigurasi
                  </button>
                  <button
                    type="button"
                    onClick={handleTestApiConnection}
                    disabled={isTestingConnection}
                    className="py-3 px-5 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingConnection ? 'animate-spin' : ''}`} />
                    <span>{isTestingConnection ? 'Menguji...' : 'Uji Koneksi'}</span>
                  </button>
                </div>

                {/* Live Test Status Result */}
                {healthStatus && (
                  <div className={`p-4 rounded-xl border text-xs space-y-1 ${
                    healthStatus.online 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}>
                    <div className="flex items-center gap-2 font-black uppercase text-[10px]">
                      {healthStatus.online ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                      <span>{healthStatus.online ? 'Koneksi Berhasil!' : 'Koneksi Gagal'}</span>
                    </div>
                    <p className="text-[11px] font-medium">{healthStatus.message}</p>
                    {healthStatus.latencyMs !== undefined && (
                      <p className="text-[10px] text-emerald-700 font-mono">Waktu Respons: {healthStatus.latencyMs} ms</p>
                    )}
                  </div>
                )}
              </div>

              {/* Guide & Architecture Overview */}
              <div className="p-6 bg-slate-900 text-white rounded-2xl space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-blue-400">
                    <Code className="w-4 h-4" />
                    <h4 className="text-xs font-black uppercase tracking-wider">Modul Client REST API Terintegrasi</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-normal">
                    Proyek ini sudah dilengkapi modul arsitektur REST API lengkap di folder <code className="text-amber-300 bg-slate-800 px-1.5 py-0.5 rounded">/src/services/api/</code> dengan Axios/Fetch client, interceptor bearer token, pemetaan DTO/entity, dan error handling otomatis.
                  </p>
                  <ul className="text-[11px] text-slate-400 space-y-1.5 list-disc list-inside">
                    <li><strong className="text-white">HttpClient</strong>: Otomatis menyertakan Header & Timeout</li>
                    <li><strong className="text-white">ServiceOrderApi</strong>: CRUD transaksi servis & riwayat</li>
                    <li><strong className="text-white">CustomerApi</strong>: CRUD data pelanggan & transaksi</li>
                    <li><strong className="text-white">InventoryApi</strong>: CRUD sparepart & riwayat stok</li>
                    <li><strong className="text-white">HealthApi</strong>: Ping status koneksi ke server</li>
                  </ul>
                </div>

                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 font-mono text-[10px] text-slate-300">
                  <span className="text-slate-500">// Contoh Penggunaan di Komponen:</span><br />
                  <span className="text-blue-300">import</span> &#123; serviceOrderApi, customerApi &#125; <span className="text-blue-300">from</span> <span className="text-emerald-300">'../services/api'</span>;<br />
                  <span className="text-purple-300">const</span> res = <span className="text-purple-300">await</span> serviceOrderApi.<span className="text-amber-300">getAll</span>();
                </div>
              </div>
            </div>

            {/* Endpoints Quick Reference Table */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" /> Daftar Endpoint REST API Tersedia
              </h4>
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    <tr>
                      <th className="p-3">Kategori</th>
                      <th className="p-3">Metode & Path</th>
                      <th className="p-3">Deskripsi</th>
                      <th className="p-3 text-right">Salin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { cat: 'Transaksi Servis', method: 'GET / POST', path: ENDPOINTS.SERVICES.LIST, desc: 'Daftar semua servis & buat transaksi kasir baru' },
                      { cat: 'Detail Servis', method: 'GET / PUT / DELETE', path: ENDPOINTS.SERVICES.DETAIL(':id'), desc: 'Detail, update status, atau hapus servis' },
                      { cat: 'Pelanggan & CRM', method: 'GET / POST', path: ENDPOINTS.CUSTOMERS.LIST, desc: 'Data pelanggan, total servis & riwayat kunjungan' },
                      { cat: 'Suku Cadang', method: 'GET / POST', path: ENDPOINTS.PARTS.LIST, desc: 'Stok barang, harga modal, harga jual' },
                      { cat: 'Mekanik & Bonus', method: 'GET / POST', path: ENDPOINTS.MECHANICS.LIST, desc: 'Daftar teknisi, komisi & pencatatan sanksi' },
                      { cat: 'Pengeluaran Kas', method: 'GET / POST', path: ENDPOINTS.EXPENSES.LIST, desc: 'Arus kas keluar operasional bengkel' },
                      { cat: 'Laporan Finansial', method: 'GET', path: ENDPOINTS.REPORTS.SUMMARY, desc: 'Ringkasan omset, profit bersih, dan rekap bonus' },
                      { cat: 'Health Check', method: 'GET', path: ENDPOINTS.HEALTH, desc: 'Cek koneksi & latensi server' },
                    ].map((ep, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 font-bold text-slate-900">{ep.cat}</td>
                        <td className="p-3">
                          <code className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-mono text-[11px] font-bold">
                            {ep.method} {ep.path}
                          </code>
                        </td>
                        <td className="p-3 text-slate-500 text-[11px]">{ep.desc}</td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(`${apiBaseUrl}${ep.path}`, `${idx}`)}
                            className="p-1.5 hover:bg-slate-200/80 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                            title="Salin Full URL"
                          >
                            {copiedEndpoint === `${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
