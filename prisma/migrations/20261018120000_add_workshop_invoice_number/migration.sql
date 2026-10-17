-- Public receipt numbers are separate from opaque internal UUID primary keys.
CREATE SEQUENCE "WorkshopService_invoiceNumber_seq";

ALTER TABLE "WorkshopService" ADD COLUMN "invoiceNumber" TEXT;

WITH numbered AS (
  SELECT id, row_number() OVER (ORDER BY "createdAt", id) AS sequence_number
  FROM "WorkshopService"
)
UPDATE "WorkshopService" AS service
SET "invoiceNumber" = 'TRX-' || lpad(numbered.sequence_number::text, 9, '0')
FROM numbered
WHERE service.id = numbered.id;

SELECT setval(
  '"WorkshopService_invoiceNumber_seq"',
  GREATEST((SELECT COUNT(*) FROM "WorkshopService"), 1),
  (SELECT COUNT(*) > 0 FROM "WorkshopService")
);

ALTER TABLE "WorkshopService"
  ALTER COLUMN "invoiceNumber" SET DEFAULT ('TRX-' || lpad(nextval('"WorkshopService_invoiceNumber_seq"')::text, 9, '0')),
  ALTER COLUMN "invoiceNumber" SET NOT NULL;

CREATE UNIQUE INDEX "WorkshopService_invoiceNumber_key" ON "WorkshopService"("invoiceNumber");
