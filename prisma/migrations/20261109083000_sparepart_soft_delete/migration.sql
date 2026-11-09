ALTER TABLE "SparePart"
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS "SparePart_isActive_idx" ON "SparePart"("isActive");
