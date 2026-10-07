# BengkelPro architecture and transactional invariants

## Request path

The browser is a React 19 single-page app. Views in `src/components/` are orchestrated by `src/AppLayout.tsx`; frontend API calls live in `src/services/api.ts` and carry a JWT from local storage. The Express server starts from root `server.ts` and mounts `/api` from `src/server/routes/apiRouter.ts`.

Business requests pass, in order, through authentication (`requireAuth`), `Owner`/`Admin` authorization, `requireDatabase`, activity logging, then idempotency middleware. Route modules delegate to controllers, controllers to services, and services to repository interfaces. Dependencies are constructed in `src/server/container.ts`.

## Database and fallback boundary

`prisma/schema.prisma` is the relational source of truth. Repository implementations can include a memory-store path for limited preview/development behavior, but `apiRouter` now rejects unavailable database access before every protected business route with `503 DATABASE_UNAVAILABLE`. Production startup also fails without PostgreSQL. Do not build new user-facing operations on the memory store.

Use a timestamped directory in `prisma/migrations/` for persistent model changes. Migrations are applied with `npm run db:migrate`; `npm run db:push` is not a substitute for a deployable migration history.

## Core domain rules

### Services and sales

`WorkshopService` represents both service jobs and retail sales (`receiptType: SERVICE | SALE`). A sale has no labor fee or mechanic bonus. Service labor lines determine `laborFee`; mechanic bonuses are calculated from labor only, never parts. Payment status is derived from recorded payments and total amount. Non-paid orders need a due date; fully paid orders clear it.

Create, update, payment, and return paths change multiple entities. Wrap related changes in one Prisma transaction. On create/update, deduct incremental stock using a guarded query; record each stock movement. Do not allow edits after `Done` or after a return. Returns are only valid for completed services, cannot exceed remaining quantity, restore stock, reduce the service total, and reduce customer spend.

Snapshots stored on service-part rows and service rows protect past receipts/reports against later master-data edits. Preserve sale price, normal/wholesale price data, cost at time, warranty state/terms, receipt header/footer, and service warranty settings as applicable.

### Inventory

`SparePart` belongs to a normalized `Product`, `PartCategory`, and optionally a warehouse rack/location. Product variants have their own SKU, price, stock, minimum stock, and storage details. Stock additions create `StockHistory` and, when supplied, `PurchaseRecord`, together with the stock change.

### Customers, loyalty, and mechanics

Customer `totalServiceCount`, `totalSpent`, and last visit must remain synchronized with eligible completed business operations. Loyalty tiers are dynamic settings, with legacy fields retained for backward-compatible display/calculation. Warranty claims create mechanic deductions when a mechanic is attached. Preserve established receipt and warranty semantics when changing settings.

### Financial records and auditability

Do not replace payment histories with a single mutable amount. Distributor invoices track invoices, items, payments, due date, and status separately. Activity/audit middleware logs protected API writes; do not bypass it for normal business mutations.

## Data contract conventions

Frontend data shapes live in `src/types.ts`. Backend repositories must translate Prisma `Decimal` values to JavaScript numbers and dates to the string formats consumed by the UI. When adding a field, trace it through this sequence as applicable:

1. Prisma model and migration.
2. Repository selects/mappers and interfaces.
3. Service validation and transactional business updates.
4. Controller and route input/output.
5. `src/types.ts` and `src/services/api.ts`.
6. UI state, form, view, and receipt/report consumers.

## Verification commands

`npm run lint` runs TypeScript checking. `npm run build` runs Prisma generation (best effort), Vite build, and server bundling. Use `npm run db:generate` after schema changes. Never run migration or seed commands against an unknown configured database without user authorization.
