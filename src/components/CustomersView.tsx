import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  User as UserIcon, 
  Edit, 
  Trash2, 
  Crown, 
  Award, 
  Star, 
  UserCheck, 
  Phone, 
  History, 
  Sparkles, 
  Send, 
  Tag, 
  ArrowUpDown, 
  Check, 
  Copy,
  ExternalLink,
  Wrench,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Customer, WorkshopService, CompanySettings } from '../types';
import { getCustomerLoyaltyStats, generateWhatsAppPromoMessage, CustomerLoyaltyStats } from '../utils/loyalty';
import { Modal } from './Modal';
import { format } from 'date-fns';

interface CustomersViewProps {
  customers: Customer[];
  services?: WorkshopService[];
  settings?: CompanySettings;
  onAdd: () => void;
  onEdit: (c: Customer) => void;
  onDelete: (id: string) => void;
  onSelectCustomerForPOS?: (customer: Customer, promoPercent?: number) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ 
  customers, 
  services = [],
  settings,
  onAdd, 
  onEdit, 
  onDelete,
  onSelectCustomerForPOS
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'frequent' | 'vip_gold' | 'new'>('all');
  const [sortBy, setSortBy] = useState<'visits_desc' | 'spent_desc' | 'name_asc'>('visits_desc');

  // Selected customer for modals
  const [historyCustomer, setHistoryCustomer] = useState<{ customer: Customer; stats: CustomerLoyaltyStats } | null>(null);
  const [promoModalCustomer, setPromoModalCustomer] = useState<{ customer: Customer; stats: CustomerLoyaltyStats; message: string } | null>(null);
  const [copiedPromo, setCopiedPromo] = useState(false);

  // Compute stats for all customers
  const customersWithStats = useMemo(() => {
    return customers.map(c => ({
      customer: c,
      stats: getCustomerLoyaltyStats(c, services, settings)
    }));
  }, [customers, services, settings]);

  // Overall Loyalty Summary Metrics
  const summary = useMemo(() => {
    const totalCust = customersWithStats.length;
    const frequentCust = customersWithStats.filter(item => item.stats.totalVisits >= (settings?.loyaltySilverVisits ?? 3)).length;
    const vipGoldCust = customersWithStats.filter(item => item.stats.totalVisits >= (settings?.loyaltyGoldVisits ?? 6)).length;
    const totalLoyalSpent = customersWithStats
      .filter(item => item.stats.totalVisits >= (settings?.loyaltySilverVisits ?? 3))
      .reduce((acc, curr) => acc + curr.stats.totalSpent, 0);

    return { totalCust, frequentCust, vipGoldCust, totalLoyalSpent };
  }, [customersWithStats, settings]);

  // Filter and Sort Customers
  const filtered = useMemo(() => {
    return customersWithStats
      .filter(({ customer, stats }) => {
        // Search filter
        const matchesSearch = 
          customer.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          customer.phone.includes(searchTerm);
        if (!matchesSearch) return false;

        // Tier filter
        const silverMin = settings?.loyaltySilverVisits ?? 3;
        const goldMin = settings?.loyaltyGoldVisits ?? 6;

        if (tierFilter === 'frequent') return stats.totalVisits >= silverMin;
        if (tierFilter === 'vip_gold') return stats.totalVisits >= goldMin;
        if (tierFilter === 'new') return stats.totalVisits < silverMin;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'visits_desc') return b.stats.totalVisits - a.stats.totalVisits;
        if (sortBy === 'spent_desc') return b.stats.totalSpent - a.stats.totalSpent;
        return a.customer.name.localeCompare(b.customer.name);
      });
  }, [customersWithStats, searchTerm, tierFilter, sortBy, settings]);

  const handleOpenPromoModal = (customer: Customer, stats: CustomerLoyaltyStats) => {
    const defaultMsg = generateWhatsAppPromoMessage(customer, stats, settings?.name || 'BengkelPro');
    setPromoModalCustomer({ customer, stats, message: defaultMsg });
    setCopiedPromo(false);
  };

  const handleCopyPromoMessage = () => {
    if (!promoModalCustomer) return;
    navigator.clipboard?.writeText(promoModalCustomer.message);
    setCopiedPromo(true);
    setTimeout(() => setCopiedPromo(false), 2000);
  };

  const handleSendWhatsApp = () => {
    if (!promoModalCustomer) return;
    const cleanPhone = promoModalCustomer.customer.phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? `62${cleanPhone.slice(1)}` : cleanPhone;
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(promoModalCustomer.message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Metrics Banner for Frequent Customer Tracking */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <UserIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Pelanggan</p>
            <p className="text-xl font-black text-slate-900 leading-tight">{summary.totalCust}</p>
            <span className="text-[10px] text-slate-500 font-bold">Terdaftar di sistem</span>
          </div>
        </div>

        <div 
          onClick={() => setTierFilter('frequent')}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5 cursor-pointer hover:border-blue-200 transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Star className="w-6 h-6 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-700">Pelanggan Sering (≥{settings?.loyaltySilverVisits ?? 3}x)</p>
            <p className="text-xl font-black text-slate-900 leading-tight">{summary.frequentCust}</p>
            <span className="text-[10px] text-amber-600 font-bold">Target Diskon/Promo</span>
          </div>
        </div>

        <div 
          onClick={() => setTierFilter('vip_gold')}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5 cursor-pointer hover:border-purple-200 transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-purple-700">Member VIP & Gold</p>
            <p className="text-xl font-black text-slate-900 leading-tight">{summary.vipGoldCust}</p>
            <span className="text-[10px] text-purple-600 font-bold">Tingkat Retensi Tinggi</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Omset Pelanggan Setia</p>
            <p className="text-xl font-black text-emerald-700 leading-tight">Rp {(summary.totalLoyalSpent || 0).toLocaleString()}</p>
            <span className="text-[10px] text-emerald-600 font-bold">Total Transaksi Loyal</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-[28px] border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari nama atau no. telepon pelanggan..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex items-center">
              <ArrowUpDown className="absolute left-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                aria-label="Urutkan Pelanggan"
                className="h-12 pl-9 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 appearance-none cursor-pointer"
              >
                <option value="visits_desc">Paling Sering Transaksi</option>
                <option value="spent_desc">Total Belanja Tertinggi</option>
                <option value="name_asc">Nama (A - Z)</option>
              </select>
            </div>

            <button 
              onClick={onAdd} 
              aria-label="Tambah Pelanggan Baru"
              className="h-12 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2 font-black text-xs uppercase tracking-wider shadow-md shadow-blue-100 active:scale-95 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Tambah Pelanggan</span>
            </button>
          </div>
        </div>

        {/* Loyalty Segment Filter Pills */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
          <button
            onClick={() => setTierFilter('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
              tierFilter === 'all' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Pelanggan ({customersWithStats.length})
          </button>

          <button
            onClick={() => setTierFilter('frequent')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              tierFilter === 'frequent' 
                ? 'bg-amber-500 text-white shadow-sm' 
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>Pelanggan Setia / Loyal ({summary.frequentCust})</span>
          </button>

          <button
            onClick={() => setTierFilter('vip_gold')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              tierFilter === 'vip_gold' 
                ? 'bg-purple-600 text-white shadow-sm' 
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/60'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>VIP & Gold ({summary.vipGoldCust})</span>
          </button>

          <button
            onClick={() => setTierFilter('new')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
              tierFilter === 'new' 
                ? 'bg-slate-700 text-white shadow-sm' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Pelanggan Baru (1-2x)
          </button>
        </div>
      </div>

      {/* Customer Cards List */}
      <div className="space-y-3.5">
        {filtered.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-[32px] border border-slate-100 space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">Tidak ada data pelanggan yang sesuai filter.</p>
            <button 
              onClick={() => { setSearchTerm(''); setTierFilter('all'); }} 
              className="text-xs font-black text-blue-600 uppercase tracking-wider hover:underline"
            >
              Reset Filter Pencarian
            </button>
          </div>
        ) : (
          filtered.map(({ customer, stats }) => {
            const isFrequent = stats.totalVisits >= (settings?.loyaltySilverVisits ?? 3);

            return (
              <div 
                key={customer.id} 
                className={`p-5 bg-white rounded-[24px] border transition-all hover:shadow-md ${
                  isFrequent ? 'border-amber-200/80 ring-1 ring-amber-100/50' : 'border-slate-100'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Customer Identity & Badges */}
                  <div className="flex items-start sm:items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black shrink-0 relative ${
                      stats.tier === 'VIP' ? 'bg-purple-100 text-purple-700' :
                      stats.tier === 'Gold' ? 'bg-amber-100 text-amber-700' :
                      stats.tier === 'Silver' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {stats.tier === 'VIP' ? <Crown className="w-7 h-7" /> :
                       stats.tier === 'Gold' ? <Award className="w-7 h-7" /> :
                       stats.tier === 'Silver' ? <Star className="w-7 h-7 fill-blue-600" /> :
                       <UserIcon className="w-7 h-7" />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-black text-slate-900">{customer.name}</h4>
                        
                        {/* Loyalty Tier Badge */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${stats.tierBgLight} ${stats.tierTextColor} ${stats.tierBorderColor}`}>
                          {stats.tierLabel}
                        </span>

                        {isFrequent && (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-amber-500 text-white tracking-wider flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> Pelanggan Setia
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                        {customer.phone ? (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" /> {customer.phone}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No phone recorded</span>
                        )}

                        {stats.lastVisitDate && (
                          <span className="text-slate-400 text-[11px]">
                            Terakhir servis: {format(new Date(stats.lastVisitDate), 'dd MMM yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Transaction Stats & Promo Status */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 lg:justify-end">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center min-w-[110px]">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Total Servis</p>
                      <p className="text-sm font-black text-blue-600">{stats.totalVisits}x Transaksi</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center min-w-[130px]">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Total Pengeluaran</p>
                      <p className="text-sm font-black text-emerald-600">Rp {(stats.totalSpent || 0).toLocaleString()}</p>
                    </div>

                    {/* Eligible Promo Pill */}
                    {stats.eligibleDiscountPercent > 0 ? (
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center min-w-[140px]">
                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-wider flex items-center justify-center gap-1">
                          <Tag className="w-3 h-3" /> Berhak Diskon
                        </p>
                        <p className="text-sm font-black text-emerald-700">{stats.eligibleDiscountPercent}% Promo</p>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center min-w-[140px]">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Target Promo</p>
                        <p className="text-[11px] font-bold text-slate-500">
                          {stats.visitsToNextTier > 0 ? `${stats.visitsToNextTier}x lagi -> Diskon` : 'Pelanggan Baru'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Action: Buat Transaksi dengan Promo */}
                    {onSelectCustomerForPOS && (
                      <button
                        onClick={() => onSelectCustomerForPOS(customer, stats.eligibleDiscountPercent)}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Beri Promo / Servis Baru</span>
                      </button>
                    )}

                    {/* Action: Kirim WhatsApp Promo */}
                    {customer.phone && (
                      <button
                        onClick={() => handleOpenPromoModal(customer, stats)}
                        className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-all"
                      >
                        <Send className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Kirim Promo WA</span>
                      </button>
                    )}

                    {/* Action: Riwayat Servis */}
                    <button
                      onClick={() => setHistoryCustomer({ customer, stats })}
                      className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-all"
                    >
                      <History className="w-3.5 h-3.5 text-slate-500" />
                      <span>Riwayat ({stats.services.length})</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 ml-auto">
                    <button 
                      onClick={() => onEdit(customer)} 
                      aria-label="Edit Pelanggan"
                      title="Edit Data Pelanggan"
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDelete(customer.id)} 
                      aria-label="Hapus Pelanggan"
                      title="Hapus Data Pelanggan"
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: Kirim Promo WhatsApp */}
      {promoModalCustomer && (
        <Modal 
          title="Kirim Promo & Voucher ke Pelanggan" 
          onClose={() => setPromoModalCustomer(null)}
        >
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-emerald-900">{promoModalCustomer.customer.name}</p>
                <p className="text-[11px] text-emerald-700">{promoModalCustomer.customer.phone} • {promoModalCustomer.stats.tierLabel}</p>
              </div>
              <span className="text-xs font-black bg-white text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
                {promoModalCustomer.stats.eligibleDiscountPercent > 0 
                  ? `Voucher ${promoModalCustomer.stats.eligibleDiscountPercent}%`
                  : 'Undangan Servis'}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">
                Pesan WhatsApp (Bisa Diedit Sesuai Kebutuhan)
              </label>
              <textarea
                rows={8}
                value={promoModalCustomer.message}
                onChange={e => setPromoModalCustomer({ ...promoModalCustomer, message: e.target.value })}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-emerald-500 leading-relaxed font-sans"
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={handleCopyPromoMessage}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                {copiedPromo ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedPromo ? 'Tersalin!' : 'Salin Pesan'}</span>
              </button>

              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-emerald-200 transition-all active:scale-95"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Buka WhatsApp</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: Riwayat Servis Pelanggan */}
      {historyCustomer && (
        <Modal 
          title={`Riwayat Servis: ${historyCustomer.customer.name}`}
          onClose={() => setHistoryCustomer(null)}
        >
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-slate-900">{historyCustomer.customer.name}</p>
                <p className="text-[11px] text-slate-500">{historyCustomer.customer.phone || 'Tanpa no. HP'}</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-blue-600">{historyCustomer.stats.totalVisits}x Kunjungan</span>
                <p className="text-[10px] font-bold text-emerald-600">Total: Rp {(historyCustomer.stats.totalSpent || 0).toLocaleString()}</p>
              </div>
            </div>

            {historyCustomer.stats.services.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                Belum ada rincian riwayat servis tersimpan untuk pelanggan ini di database saat ini.
              </p>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
                {historyCustomer.stats.services.map(srv => (
                  <div key={srv.id} className="p-3.5 bg-slate-50 hover:bg-blue-50/50 rounded-xl border border-slate-100 transition-colors space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800 uppercase">{srv.serviceType}</span>
                      <span className="text-xs font-black text-emerald-600">Rp {(srv.totalAmount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Plat: <strong className="text-slate-700">{srv.vehiclePlate}</strong> ({srv.vehicleModel})</span>
                      <span>{format(new Date(srv.createdAt), 'dd MMM yyyy')}</span>
                    </div>
                    {srv.discountAmount && srv.discountAmount > 0 && (
                      <div className="text-[10px] text-emerald-600 font-bold">
                        🎁 Diskon: -Rp {srv.discountAmount.toLocaleString()} ({srv.discountReason || 'Promo'})
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
