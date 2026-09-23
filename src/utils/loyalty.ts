import { Customer, CustomerTier, WorkshopService, CompanySettings, LoyaltyTier } from '../types';

export interface CustomerLoyaltyStats { totalVisits: number; totalSpent: number; lastVisitDate: string | null; tier: CustomerTier; tierLabel: string; tierBadgeColor: string; tierTextColor: string; tierBgLight: string; tierBorderColor: string; eligibleDiscountPercent: number; eligiblePromoTitle: string; visitsToNextTier: number; nextTier: CustomerTier | null; services: WorkshopService[]; }

const legacyTiers = (settings?: Partial<CompanySettings>): LoyaltyTier[] => [
  { id: 'legacy-silver', name: settings?.loyaltySilverName?.trim() || 'Silver', minimumVisits: settings?.loyaltySilverVisits ?? 3, discountPercent: settings?.loyaltySilverDiscountPercent ?? 5, sortOrder: 1, isActive: true },
  { id: 'legacy-gold', name: settings?.loyaltyGoldName?.trim() || 'Gold', minimumVisits: settings?.loyaltyGoldVisits ?? 6, discountPercent: settings?.loyaltyGoldDiscountPercent ?? 10, sortOrder: 2, isActive: true },
  { id: 'legacy-vip', name: settings?.loyaltyVipName?.trim() || 'VIP', minimumVisits: settings?.loyaltyVipVisits ?? 10, discountPercent: settings?.loyaltyVipDiscountPercent ?? 15, sortOrder: 3, isActive: true },
];

export function getActiveLoyaltyTiers(settings?: Partial<CompanySettings>) {
  const tiers = settings?.loyaltyTiers?.length ? settings.loyaltyTiers : legacyTiers(settings);
  return tiers.filter(tier => tier.isActive).sort((a, b) => a.minimumVisits - b.minimumVisits || a.sortOrder - b.sortOrder);
}

export function getCustomerLoyaltyStats(customer: Customer, allServices: WorkshopService[] = [], settings?: Partial<CompanySettings>): CustomerLoyaltyStats {
  const tiers = getActiveLoyaltyTiers(settings);
  const customerServices = allServices.filter(s => (s.customerId && s.customerId === customer.id) || (s.customerPhone && customer.phone && s.customerPhone === customer.phone) || (s.customerName && customer.name && s.customerName.toLowerCase().trim() === customer.name.toLowerCase().trim()));
  const totalVisits = Math.max(customer.totalServiceCount || 0, customerServices.length);
  const totalSpent = customerServices.reduce((sum, s) => sum + (s.totalAmount || 0), customer.totalSpent || 0);
  const lastVisitDate = customerServices.length ? [...customerServices].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt : customer.lastVisitDate || null;
  const matching = tiers.filter(tier => totalVisits >= tier.minimumVisits);
  const current = matching.length ? matching[matching.length - 1] : null;
  const currentIndex = current ? tiers.findIndex(tier => tier.id === current.id) : -1;
  const next = currentIndex >= 0 ? tiers[currentIndex + 1] : tiers[0];
  const tier = current?.name || (totalVisits > 0 ? 'Pelanggan' : 'Baru');
  const config = getLoyaltyBadgeConfig(tier, currentIndex);
  return { totalVisits, totalSpent, lastVisitDate, tier, tierLabel: current?.name || config.label, tierBadgeColor: config.badgeColor, tierTextColor: config.textColor, tierBgLight: config.bgLight, tierBorderColor: config.borderColor, eligibleDiscountPercent: current?.discountPercent || 0, eligiblePromoTitle: current ? `Diskon ${current.name} ${current.discountPercent}%` : next ? `Menuju ${next.name} (${Math.max(next.minimumVisits - totalVisits, 0)}x servis lagi)` : 'Belum Memenuhi Syarat Promo', visitsToNextTier: next ? Math.max(next.minimumVisits - totalVisits, 0) : 0, nextTier: next?.name || null, services: customerServices };
}

export function getLoyaltyBadgeConfig(tier: CustomerTier, index = -1) {
  const styles = [{ badgeColor: 'bg-blue-600 text-white', textColor: 'text-blue-700', bgLight: 'bg-blue-50', borderColor: 'border-blue-200' }, { badgeColor: 'bg-amber-500 text-white', textColor: 'text-amber-700', bgLight: 'bg-amber-50', borderColor: 'border-amber-200' }, { badgeColor: 'bg-purple-600 text-white', textColor: 'text-purple-700', bgLight: 'bg-purple-50', borderColor: 'border-purple-200' }, { badgeColor: 'bg-emerald-600 text-white', textColor: 'text-emerald-700', bgLight: 'bg-emerald-50', borderColor: 'border-emerald-200' }];
  return { label: tier === 'Baru' ? 'Pelanggan Baru' : tier, ...(styles[(index < 0 ? 3 : index) % styles.length]) };
}

export function generateWhatsAppPromoMessage(customer: Customer, stats: CustomerLoyaltyStats, workshopName = 'BengkelPro'): string {
  const discountText = stats.eligibleDiscountPercent > 0 ? `diskon spesial *${stats.eligibleDiscountPercent}%*` : 'promo servis menarik';
  return `Halo Kak *${customer.name}*! 👋\n\nTerima kasih atas kepercayaannya selalu merawat kendaraan di *${workshopName}*.\n\nSaat ini Kakak terdaftar sebagai *${stats.tierLabel}* kami dengan total *${stats.totalVisits}x kunjungan servis*. 🏍️✨\n\nSebagai apresiasi pelanggan setia, kami memberikan voucher ${discountText} untuk servis atau perawatan kendaraan berikutnya di bengkel kami!\n\n📍 *${workshopName}*\nYuk rawat kendaraan Kakak agar selalu prima. Tunjukkan pesan ini saat servis berikutnya ya! Terima kasih banyak 🙏`;
}
