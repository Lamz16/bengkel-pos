-- Password tidak lagi memiliki default plaintext. Jalankan `npm run db:seed` setelah reset
-- untuk membuat akun demo dengan hash bcrypt.
ALTER TABLE "User" ALTER COLUMN "password" DROP DEFAULT;

-- Semua nominal uang menggunakan NUMERIC(18,2), bukan floating point.
ALTER TABLE "CompanySettings"
  ALTER COLUMN "defaultAbsencePenalty" TYPE DECIMAL(18,2) USING "defaultAbsencePenalty"::DECIMAL(18,2),
  ALTER COLUMN "defaultWarrantyPenalty" TYPE DECIMAL(18,2) USING "defaultWarrantyPenalty"::DECIMAL(18,2);
ALTER TABLE "Customer" ALTER COLUMN "totalSpent" TYPE DECIMAL(18,2) USING "totalSpent"::DECIMAL(18,2);
ALTER TABLE "SparePart"
  ALTER COLUMN "price" TYPE DECIMAL(18,2) USING "price"::DECIMAL(18,2),
  ALTER COLUMN "purchasePrice" TYPE DECIMAL(18,2) USING "purchasePrice"::DECIMAL(18,2);
ALTER TABLE "WorkshopService"
  ALTER COLUMN "laborFee" TYPE DECIMAL(18,2) USING "laborFee"::DECIMAL(18,2),
  ALTER COLUMN "totalAmount" TYPE DECIMAL(18,2) USING "totalAmount"::DECIMAL(18,2),
  ALTER COLUMN "discountAmount" TYPE DECIMAL(18,2) USING "discountAmount"::DECIMAL(18,2),
  ALTER COLUMN "mechanicBonusAmount" TYPE DECIMAL(18,2) USING "mechanicBonusAmount"::DECIMAL(18,2),
  ALTER COLUMN "warrantyDeductionAmount" TYPE DECIMAL(18,2) USING "warrantyDeductionAmount"::DECIMAL(18,2);
ALTER TABLE "ServicePartItem" ALTER COLUMN "priceAtTime" TYPE DECIMAL(18,2) USING "priceAtTime"::DECIMAL(18,2);
ALTER TABLE "Mechanic"
  ALTER COLUMN "dailySalary" TYPE DECIMAL(18,2) USING "dailySalary"::DECIMAL(18,2),
  ALTER COLUMN "warrantyPenaltyAmount" TYPE DECIMAL(18,2) USING "warrantyPenaltyAmount"::DECIMAL(18,2),
  ALTER COLUMN "absencePenaltyAmount" TYPE DECIMAL(18,2) USING "absencePenaltyAmount"::DECIMAL(18,2);
ALTER TABLE "MechanicDeduction" ALTER COLUMN "amount" TYPE DECIMAL(18,2) USING "amount"::DECIMAL(18,2);
ALTER TABLE "PurchaseRecord" ALTER COLUMN "costPrice" TYPE DECIMAL(18,2) USING "costPrice"::DECIMAL(18,2);
ALTER TABLE "Expense" ALTER COLUMN "amount" TYPE DECIMAL(18,2) USING "amount"::DECIMAL(18,2);
ALTER TABLE "DistributorInvoice"
  ALTER COLUMN "totalAmount" TYPE DECIMAL(18,2) USING "totalAmount"::DECIMAL(18,2),
  ALTER COLUMN "paidAmount" TYPE DECIMAL(18,2) USING "paidAmount"::DECIMAL(18,2),
  ALTER COLUMN "remainingAmount" TYPE DECIMAL(18,2) USING "remainingAmount"::DECIMAL(18,2);
ALTER TABLE "DistributorInvoiceItem"
  ALTER COLUMN "unitPrice" TYPE DECIMAL(18,2) USING "unitPrice"::DECIMAL(18,2),
  ALTER COLUMN "totalPrice" TYPE DECIMAL(18,2) USING "totalPrice"::DECIMAL(18,2);
ALTER TABLE "DistributorPayment" ALTER COLUMN "amount" TYPE DECIMAL(18,2) USING "amount"::DECIMAL(18,2);
