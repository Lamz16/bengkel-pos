import { ISettingsRepository } from './interfaces';
import { CompanySettings } from '../../types';
import { prisma, isDbConnected } from '../db/connection';
import { memoryStore } from '../db/memoryStore';

export class SettingsRepository implements ISettingsRepository {
  async get(): Promise<CompanySettings> {
    if (isDbConnected()) {
      try {
        const found = await prisma.companySettings.findFirst();
        if (found) {
          return {
            name: found.name,
            logoUrl: found.logoUrl || undefined,
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
            footerNote: found.footerNote,
            warrantyTerms: found.warrantyTerms,
            showMechanicOnReceipt: found.showMechanicOnReceipt,
            showWarrantyOnReceipt: found.showWarrantyOnReceipt,
            showOdometerOnReceipt: found.showOdometerOnReceipt,
            showCustomerPhoneOnReceipt: found.showCustomerPhoneOnReceipt,
            receiptContactHelp: found.receiptContactHelp || undefined,
            loyaltySilverVisits: found.loyaltySilverVisits || undefined,
            loyaltyGoldVisits: found.loyaltyGoldVisits || undefined,
            loyaltyVipVisits: found.loyaltyVipVisits || undefined,
            loyaltySilverDiscountPercent: found.loyaltySilverDiscountPercent || undefined,
            loyaltyGoldDiscountPercent: found.loyaltyGoldDiscountPercent || undefined,
            loyaltyVipDiscountPercent: found.loyaltyVipDiscountPercent || undefined,
          };
        }
      } catch (err) {
        console.error('[SettingsRepo] Prisma get error:', err);
      }
    }
    return memoryStore.settings;
  }

  async update(data: Partial<CompanySettings>): Promise<CompanySettings> {
    if (isDbConnected()) {
      try {
        const updated = await prisma.companySettings.upsert({
          where: { id: 'settings-default' },
          update: data,
          create: {
            id: 'settings-default',
            name: data.name || "BengkelPro Mandiri",
            slogan: data.slogan || "Solusi Perawatan & Servis Terpercaya",
            address: data.address || "Jl. Otomotif Raya No. 123",
            phone: data.phone || "0812-3456-7890",
            footerNote: data.footerNote || "Terima kasih",
            warrantyTerms: data.warrantyTerms || "Garansi 7 hari",
            ...data
          },
        });
        return {
          ...memoryStore.settings,
          ...data,
          name: updated.name,
          logoUrl: updated.logoUrl || undefined,
          slogan: updated.slogan,
          address: updated.address,
          phone: updated.phone,
        };
      } catch (err) {
        console.error('[SettingsRepo] Prisma update error:', err);
      }
    }
    memoryStore.settings = { ...memoryStore.settings, ...data };
    return memoryStore.settings;
  }
}
