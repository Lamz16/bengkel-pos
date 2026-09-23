import { Customer, CustomerTier, WorkshopService, CompanySettings } from '../types';

export interface CustomerLoyaltyStats {
  totalVisits: number;
  totalSpent: number;
  lastVisitDate: string | null;
  tier: CustomerTier;
  tierLabel: string;
  tierBadgeColor: string;
  tierTextColor: string;
  tierBgLight: string;
  tierBorderColor: string;
  eligibleDiscountPercent: number;
  eligiblePromoTitle: string;
  visitsToNextTier: number;
  nextTier: CustomerTier | null;
  services: WorkshopService[];
}

/**
 * Calculates real-time loyalty statistics, lifetime spend, and promo eligibility
 * for any customer based on service history and workshop loyalty thresholds.
 */
export function getCustomerLoyaltyStats(
  customer: Customer,
  allServices: WorkshopService[] = [],
  settings?: Partial<CompanySettings>
): CustomerLoyaltyStats {
  const silverThreshold = settings?.loyaltySilverVisits ?? 3;
  const goldThreshold = settings?.loyaltyGoldVisits ?? 6;
  const vipThreshold = settings?.loyaltyVipVisits ?? 10;

  const silverDiscount = settings?.loyaltySilverDiscountPercent ?? 5;
  const goldDiscount = settings?.loyaltyGoldDiscountPercent ?? 10;
  const vipDiscount = settings?.loyaltyVipDiscountPercent ?? 15;
  const silverName = settings?.loyaltySilverName?.trim() || 'Silver';
  const goldName = settings?.loyaltyGoldName?.trim() || 'Gold';
  const vipName = settings?.loyaltyVipName?.trim() || 'VIP';

  // Filter services related to this customer (by ID or matching name/phone)
  const customerServices = allServices.filter(s => 
    (s.customerId && s.customerId === customer.id) ||
    (s.customerPhone && customer.phone && s.customerPhone === customer.phone) ||
    (s.customerName && customer.name && s.customerName.toLowerCase().trim() === customer.name.toLowerCase().trim())
  );

  // Total completed or paid visits
  const totalVisits = Math.max(customer.totalServiceCount || 0, customerServices.length);

  // Total money spent
  const totalSpent = customerServices.reduce((sum, s) => sum + (s.totalAmount || 0), customer.totalSpent || 0);

  // Last visit date
  let lastVisitDate: string | null = customer.lastVisitDate || null;
  if (customerServices.length > 0) {
    const sorted = [...customerServices].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    lastVisitDate = sorted[0].createdAt;
  }

  // Determine Loyalty Tier
  let tier: CustomerTier = 'New';
  let eligibleDiscountPercent = 0;
  let eligiblePromoTitle = 'Belum Memenuhi Syarat Promo';
  let visitsToNextTier = silverThreshold;
  let nextTier: CustomerTier | null = 'Silver';

  if (totalVisits >= vipThreshold) {
    tier = 'VIP';
    eligibleDiscountPercent = vipDiscount;
    eligiblePromoTitle = `Diskon ${vipName} ${vipDiscount}%`;
    visitsToNextTier = 0;
    nextTier = null;
  } else if (totalVisits >= goldThreshold) {
    tier = 'Gold';
    eligibleDiscountPercent = goldDiscount;
    eligiblePromoTitle = `Diskon ${goldName} ${goldDiscount}%`;
    visitsToNextTier = vipThreshold - totalVisits;
    nextTier = 'VIP';
  } else if (totalVisits >= silverThreshold) {
    tier = 'Silver';
    eligibleDiscountPercent = silverDiscount;
    eligiblePromoTitle = `Diskon ${silverName} ${silverDiscount}%`;
    visitsToNextTier = goldThreshold - totalVisits;
    nextTier = 'Gold';
  } else if (totalVisits > 0) {
    tier = 'Bronze';
    eligibleDiscountPercent = 0;
    eligiblePromoTitle = `Menuju ${silverName} (${silverThreshold - totalVisits}x servis lagi)`;
    visitsToNextTier = silverThreshold - totalVisits;
    nextTier = 'Silver';
  }

  // Visual Styling configs
  const badgeConfig = getLoyaltyBadgeConfig(tier);
  if (tier === 'Silver') badgeConfig.label = silverName;
  if (tier === 'Gold') badgeConfig.label = goldName;
  if (tier === 'VIP') badgeConfig.label = vipName;

  return {
    totalVisits,
    totalSpent,
    lastVisitDate,
    tier,
    tierLabel: badgeConfig.label,
    tierBadgeColor: badgeConfig.badgeColor,
    tierTextColor: badgeConfig.textColor,
    tierBgLight: badgeConfig.bgLight,
    tierBorderColor: badgeConfig.borderColor,
    eligibleDiscountPercent,
    eligiblePromoTitle,
    visitsToNextTier,
    nextTier,
    services: customerServices,
  };
}

export function getLoyaltyBadgeConfig(tier: CustomerTier) {
  switch (tier) {
    case 'VIP':
      return {
        label: 'VIP Member',
        icon: 'Crown',
        badgeColor: 'bg-purple-600 text-white',
        textColor: 'text-purple-700',
        bgLight: 'bg-purple-50',
        borderColor: 'border-purple-200',
      };
    case 'Gold':
      return {
        label: 'Gold Member',
        icon: 'Award',
        badgeColor: 'bg-amber-500 text-white',
        textColor: 'text-amber-700',
        bgLight: 'bg-amber-50',
        borderColor: 'border-amber-200',
      };
    case 'Silver':
      return {
        label: 'Silver Member',
        icon: 'Star',
        badgeColor: 'bg-blue-600 text-white',
        textColor: 'text-blue-700',
        bgLight: 'bg-blue-50',
        borderColor: 'border-blue-200',
      };
    case 'Bronze':
      return {
        label: 'Bronze Member',
        icon: 'UserCheck',
        badgeColor: 'bg-emerald-600 text-white',
        textColor: 'text-emerald-700',
        bgLight: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
      };
    default:
      return {
        label: 'Pelanggan Baru',
        icon: 'User',
        badgeColor: 'bg-slate-500 text-white',
        textColor: 'text-slate-600',
        bgLight: 'bg-slate-50',
        borderColor: 'border-slate-200',
      };
  }
}

/**
 * Generates an automated, friendly WhatsApp invitation promo message
 * tailored to the customer's loyalty status and visit count.
 */
export function generateWhatsAppPromoMessage(
  customer: Customer,
  stats: CustomerLoyaltyStats,
  workshopName: string = 'BengkelPro'
): string {
  const discountText = stats.eligibleDiscountPercent > 0
    ? `diskon spesial *${stats.eligibleDiscountPercent}%*`
    : `promo servis menarik`;

  return `Halo Kak *${customer.name}*! 👋

Terima kasih atas kepercayaannya selalu merawat kendaraan di *${workshopName}*. 

Saat ini Kakak terdaftar sebagai *${stats.tierLabel}* kami dengan total *${stats.totalVisits}x kunjungan servis*. 🏍️✨

Sebagai apresiasi pelanggan setia, kami memberikan voucher ${discountText} untuk servis atau perawatan kendaraan berikutnya di bengkel kami!

📍 *${workshopName}*
Yuk rawat kendaraan Kakak agar selalu prima. Tunjukkan pesan ini saat servis berikutnya ya! Terima kasih banyak 🙏`;
}
