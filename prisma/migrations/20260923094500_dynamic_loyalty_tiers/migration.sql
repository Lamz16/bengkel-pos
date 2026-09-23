CREATE TABLE IF NOT EXISTS "LoyaltyTier" (
  "id" TEXT NOT NULL,
  "companySettingsId" TEXT NOT NULL DEFAULT 'settings-default',
  "name" TEXT NOT NULL,
  "minimumVisits" INTEGER NOT NULL,
  "discountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LoyaltyTier_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LoyaltyTier_companySettingsId_fkey" FOREIGN KEY ("companySettingsId") REFERENCES "CompanySettings"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "LoyaltyTier_companySettingsId_name_key" ON "LoyaltyTier"("companySettingsId", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "LoyaltyTier_companySettingsId_minimumVisits_key" ON "LoyaltyTier"("companySettingsId", "minimumVisits");
CREATE INDEX IF NOT EXISTS "LoyaltyTier_companySettingsId_isActive_minimumVisits_idx" ON "LoyaltyTier"("companySettingsId", "isActive", "minimumVisits");

INSERT INTO "LoyaltyTier" ("id", "companySettingsId", "name", "minimumVisits", "discountPercent", "sortOrder")
SELECT 'legacy-silver', id, COALESCE("loyaltySilverName", 'Silver'), COALESCE("loyaltySilverVisits", 3), COALESCE("loyaltySilverDiscountPercent", 5), 1 FROM "CompanySettings"
ON CONFLICT ("companySettingsId", "name") DO NOTHING;
INSERT INTO "LoyaltyTier" ("id", "companySettingsId", "name", "minimumVisits", "discountPercent", "sortOrder")
SELECT 'legacy-gold', id, COALESCE("loyaltyGoldName", 'Gold'), COALESCE("loyaltyGoldVisits", 6), COALESCE("loyaltyGoldDiscountPercent", 10), 2 FROM "CompanySettings"
ON CONFLICT ("companySettingsId", "name") DO NOTHING;
INSERT INTO "LoyaltyTier" ("id", "companySettingsId", "name", "minimumVisits", "discountPercent", "sortOrder")
SELECT 'legacy-vip', id, COALESCE("loyaltyVipName", 'VIP'), COALESCE("loyaltyVipVisits", 10), COALESCE("loyaltyVipDiscountPercent", 15), 3 FROM "CompanySettings"
ON CONFLICT ("companySettingsId", "name") DO NOTHING;
