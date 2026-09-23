ALTER TABLE "ActivityLog"
  ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'ACTIVITY',
  ADD COLUMN IF NOT EXISTS "entity" TEXT,
  ADD COLUMN IF NOT EXISTS "entityId" TEXT,
  ADD COLUMN IF NOT EXISTS "changedFields" TEXT,
  ADD COLUMN IF NOT EXISTS "beforeData" TEXT,
  ADD COLUMN IF NOT EXISTS "afterData" TEXT;

CREATE INDEX IF NOT EXISTS "ActivityLog_category_createdAt_idx" ON "ActivityLog"("category", "createdAt");
CREATE INDEX IF NOT EXISTS "ActivityLog_entity_entityId_createdAt_idx" ON "ActivityLog"("entity", "entityId", "createdAt");
