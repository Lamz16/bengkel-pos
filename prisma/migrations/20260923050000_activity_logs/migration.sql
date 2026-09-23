CREATE TABLE IF NOT EXISTS "ActivityLog" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT,
  "userName" TEXT,
  "role" TEXT,
  "method" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "statusCode" INTEGER NOT NULL,
  "success" BOOLEAN NOT NULL,
  "description" TEXT NOT NULL,
  CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "ActivityLog_statusCode_createdAt_idx" ON "ActivityLog"("statusCode", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "ActivityLog_role_createdAt_idx" ON "ActivityLog"("role", "createdAt" DESC);
