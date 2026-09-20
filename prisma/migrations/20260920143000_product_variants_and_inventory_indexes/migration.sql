-- Produk induk dinormalisasi dari item stok yang sebelumnya berdiri sendiri.
-- Satu produk dapat memiliki banyak variasi ukuran/tipe; stok dan lokasi tetap
-- dicatat per variasi agar pengambilan barang di gudang akurat.
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

INSERT INTO "Product" ("id", "name", "categoryId", "updatedAt")
SELECT md5('product:' || "categoryId" || ':' || "name"), "name", "categoryId", CURRENT_TIMESTAMP
FROM "SparePart"
GROUP BY "name", "categoryId";

ALTER TABLE "SparePart" ADD COLUMN "productId" TEXT;
ALTER TABLE "SparePart" ADD COLUMN "variantName" TEXT NOT NULL DEFAULT 'Standar';
ALTER TABLE "SparePart" ADD COLUMN "size" TEXT NOT NULL DEFAULT '';

UPDATE "SparePart"
SET "productId" = md5('product:' || "categoryId" || ':' || "name");

ALTER TABLE "SparePart" ALTER COLUMN "productId" SET NOT NULL;
CREATE UNIQUE INDEX "Product_name_categoryId_key" ON "Product"("name", "categoryId");
CREATE INDEX "Product_categoryId_name_idx" ON "Product"("categoryId", "name");
CREATE INDEX "SparePart_productId_idx" ON "SparePart"("productId");
CREATE INDEX "SparePart_rackId_shelfLevel_binNumber_idx" ON "SparePart"("rackId", "shelfLevel", "binNumber");
CREATE UNIQUE INDEX "SparePart_productId_variantName_size_key" ON "SparePart"("productId", "variantName", "size");

ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "PartCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SparePart" ADD CONSTRAINT "SparePart_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
