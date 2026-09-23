import { ISettingsRepository } from './interfaces';
import { CompanySettings } from '../../types';
import { prisma, isDbConnected } from '../db/connection';
import { memoryStore } from '../db/memoryStore';

export class SettingsRepository implements ISettingsRepository {
  async get(): Promise<CompanySettings> {
    if (isDbConnected()) {
      try {
        const found = await prisma.companySettings.findFirst({
          include: { loyaltyTiers: { orderBy: [{ minimumVisits: 'asc' }, { sortOrder: 'asc' }] } },
        });
        if (found) {
          return {
            name: found.name,
            logoUrl: found.logoUrl || undefined,
            appTitle: found.appTitle || undefined,
            faviconUrl: found.faviconUrl || undefined,
            slogan: found.slogan,
            address: found.address,
            phone: found.phone,
            email: found.email || undefined,
            operationalHours: found.operationalHours || undefined,
            ownerName: found.ownerName || undefined,
            picName: found.picName || undefined,
            defaultMechanicBonusPercent: found.defaultMechanicBonusPercent,
            defaultAbsencePenalty: Number(found.defaultAbsencePenalty),
            defaultWarrantyPenalty: Number(found.defaultWarrantyPenalty),
            allowCustomBonusPerTransaction: found.allowCustomBonusPerTransaction,
            receiptHeader: found.receiptHeader || undefined,
            serviceReceiptHeader: found.serviceReceiptHeader,
            saleReceiptHeader: found.saleReceiptHeader,
            footerNote: found.footerNote,
            serviceReceiptFooter: found.serviceReceiptFooter || undefined,
            saleReceiptFooter: found.saleReceiptFooter || undefined,
            warrantyTerms: found.warrantyTerms,
            defaultServiceWarrantyDays: found.defaultServiceWarrantyDays,
            serviceWarrantyTerms: found.serviceWarrantyTerms || undefined,
            showMechanicOnReceipt: found.showMechanicOnReceipt,
            showWarrantyOnReceipt: found.showWarrantyOnReceipt,
            showOdometerOnReceipt: found.showOdometerOnReceipt,
            showCustomerPhoneOnReceipt: found.showCustomerPhoneOnReceipt,
            receiptContactHelp: found.receiptContactHelp || undefined,
            loyaltySilverVisits: found.loyaltySilverVisits || undefined,
            loyaltySilverName: found.loyaltySilverName || undefined,
            loyaltyGoldVisits: found.loyaltyGoldVisits || undefined,
            loyaltyGoldName: found.loyaltyGoldName || undefined,
            loyaltyVipVisits: found.loyaltyVipVisits || undefined,
            loyaltyVipName: found.loyaltyVipName || undefined,
            loyaltySilverDiscountPercent: found.loyaltySilverDiscountPercent || undefined,
            loyaltyGoldDiscountPercent: found.loyaltyGoldDiscountPercent || undefined,
            loyaltyVipDiscountPercent: found.loyaltyVipDiscountPercent || undefined,
            loyaltyTiers: found.loyaltyTiers.map(tier => ({
              id: tier.id, name: tier.name, minimumVisits: tier.minimumVisits,
              discountPercent: tier.discountPercent, sortOrder: tier.sortOrder, isActive: tier.isActive,
            })),
          };
        }
      } catch (err) {
        console.error('[SettingsRepo] Prisma get error:', err);
      }
    }
    return { ...memoryStore.settings, loyaltyTiers: memoryStore.loyaltyTiers };
  }

  async update(data: Partial<CompanySettings>): Promise<CompanySettings> {
    const { loyaltyTiers: _loyaltyTiers, ...settingsData } = data;
    if (isDbConnected()) {
      try {
        const updated = await prisma.companySettings.upsert({
          where: { id: 'settings-default' },
          update: settingsData,
          create: {
            id: 'settings-default',
            name: settingsData.name || "BengkelPro Mandiri",
            slogan: settingsData.slogan || "Solusi Perawatan & Servis Terpercaya",
            address: settingsData.address || "Jl. Otomotif Raya No. 123",
            phone: settingsData.phone || "0812-3456-7890",
            footerNote: settingsData.footerNote || "Terima kasih",
            warrantyTerms: settingsData.warrantyTerms || "Garansi 7 hari",
            ...settingsData
          },
        });
        return {
          ...memoryStore.settings,
          ...settingsData,
          name: updated.name,
          logoUrl: updated.logoUrl || undefined,
          appTitle: updated.appTitle || undefined,
          faviconUrl: updated.faviconUrl || undefined,
          slogan: updated.slogan,
          address: updated.address,
          phone: updated.phone,
        };
      } catch (err) {
        console.error('[SettingsRepo] Prisma update error:', err);
      }
    }
    memoryStore.settings = { ...memoryStore.settings, ...settingsData };
    return { ...memoryStore.settings, loyaltyTiers: memoryStore.loyaltyTiers };
  }
}
