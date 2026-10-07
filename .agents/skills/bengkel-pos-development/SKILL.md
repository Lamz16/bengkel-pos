---
name: bengkel-pos-development
description: Build, fix, and review the BengkelPro POS workshop application. Use for changes touching its React UI, Express API, Prisma schema/migrations, or transaction workflows.
---

# BengkelPro POS Development

Work within the existing React 19 + Express + Prisma application for Indonesian motorcycle-workshop operations. First identify the affected flow, then change every affected layer deliberately; this project does not treat a frontend-only change as complete when it changes persisted business data.

## Orienting yourself

- Start from the named view in `src/components/`, then trace its API method in `src/services/api.ts`, its route/controller/service/repository, and the Prisma model it uses.
- Use `src/types.ts` for the frontend contract and `prisma/schema.prisma` for persisted truth. Map Prisma `Decimal` and `DateTime` values explicitly at repository boundaries.
- New server dependencies are composed in `src/server/container.ts`; business routes are registered in `src/server/routes/apiRouter.ts`.
- Read [the architecture and safety map](references/architecture.md) before changing a workflow involving stock, payment, service orders, customer totals, receipts, warranty, or database availability.

## Implementation rules that matter here

- Keep UI types, API payloads, controller validation, service logic, repository mapping, and Prisma schema consistent. Extend `src/services/api.ts` rather than bypassing its authenticated request helper.
- Make a schema change as a timestamped Prisma migration in `prisma/migrations/`; use `db:push` only for explicitly disposable local experiments. Regenerate Prisma client after schema changes.
- Keep multi-record financial or inventory changes in a Prisma transaction. Preserve atomic stock guards such as `updateMany({ where: { stock: { gte: quantity }}})`; never replace them with a read-then-write sequence.
- Preserve historical snapshots on a completed sale/service: price and cost, receipt copy, warranty terms/duration, and payment records must not silently change when master data changes.
- Treat service order edits, payments, and returns as concurrency-sensitive. Preserve version checks where they exist and preserve idempotency for writes.
- Business endpoints require JWT authentication, role authorization, database availability, activity logging, and idempotency through `apiRouter`; do not mount a new business route before that middleware chain unless it is intentionally public infrastructure.
- PostgreSQL is mandatory for business writes. Do not introduce a RAM fallback for routes guarded by `requireDatabase`, and never relax production database requirements.
- Avoid emitting secrets or copying `.env` values. Use `.env.example` only to document new configuration.

## Validation and delivery

- Run `npm run lint` for every TypeScript change. Run `npm run build` when feasible for routing, Vite, server-entry, or Prisma-impacting work.
- For schema changes, run `npm run db:generate`; apply migrations only when the task authorizes touching a configured database.
- State any validation that was not run and why. Preserve unrelated workspace changes, especially `.idea/workspace.xml` unless the user specifically asks for IDE configuration.
