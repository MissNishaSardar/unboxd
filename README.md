# unboxd

An electronics e-commerce storefront built with the Next.js App Router. It includes a product catalog with variants, Better Auth email and password login with admin RBAC, Jotai cart, COD checkout with atomic stock control, customer orders, and an admin dashboard.

> **Status.** In active development. Storefront (catalog, search, categories, product pages), auth (email and password plus admin RBAC), cart, COD checkout, orders, and admin dashboard (products, orders) pass lint, typecheck, and build. Image upload pipeline and Postgres migration remain.

## Tech stack

| Layer     | Tech                                                                                                |
| --------- | --------------------------------------------------------------------------------------------------- |
| Framework | [Next.js](https://nextjs.org) 16 (App Router, `reactCompiler`, `typedRoutes`) + React 19            |
| Language  | TypeScript 5.9 (strict)                                                                             |
| Database  | SQLite + [Prisma](https://prisma.io) 7 (`prisma-client` generator, `@prisma/adapter-libsql`)        |
| Auth      | [Better Auth](https://better-auth.com) (email/password + admin RBAC, Prisma adapter, `nextCookies`) |
| Forms     | react-hook-form + `@hookform/resolvers/zod` + Zod 4                                                 |
| UI        | [shadcn/ui](https://ui.shadcn.com) (base-vega style) + Tailwind CSS 4 + Base UI React               |
| Env       | `@t3-oss/env-nextjs` (server/client split)                                                          |
| Runtime   | Bun (scripts, `bunx --bun prisma ...` for all Prisma CLI)                                           |

## Getting started

Prerequisites: [Bun](https://bun.sh) and Node.js >= 24.

```bash
bun install
cp .env.example .env        # then fill in BETTER_AUTH_SECRET (32+ chars)
bun run migrate             # apply migrations + generate client
bun run seed                # 26 products, 11 categories (idempotent)
bun run dev                 # http://localhost:3000
```

## Scripts

| Script              | What it does                                           |
| ------------------- | ------------------------------------------------------ |
| `bun run dev`       | Start the dev server                                   |
| `bun run build`     | `prisma generate` + `next build`                       |
| `bun run start`     | Start the production server                            |
| `bun prod`          | Generate, build, start (full prod cycle)               |
| `bun lint`          | `eslint` (lint only)                                   |
| `bun run typecheck` | `next typegen && tsc --noEmit`                         |
| `bun run migrate`   | `prisma migrate dev` + generate (client not auto-made) |
| `bun run seed`      | Seed the catalog (idempotent; `migrate reset` to wipe) |
| `bun run studio`    | Prisma Studio (no browser auto-open)                   |

## Environment variables

| Variable                                        | Required | Description                                       |
| ----------------------------------------------- | -------- | ------------------------------------------------- |
| `DATABASE_URL`                                  | Yes      | SQLite connection string (`file:./prisma/dev.db`) |
| `BETTER_AUTH_SECRET`                            | Yes      | Auth secret, 32+ chars                            |
| `BETTER_AUTH_URL`                               | Yes      | Auth base URL (`http://localhost:3000`)           |
| `NEXT_TELEMETRY_DISABLED`, `CHECKPOINT_DISABLE` | No       | Telemetry off                                     |

Server-side vars are validated in `src/lib/env/serverEnv.ts`; add new vars there and to `.env.example`.

## Schema overview

- **Auth.** `User`, `Session`, `Account`, `Verification` (Better Auth, email and password)
- **Catalog.** `Category` (self-referencing tree), `Product`, `ProductVariant` (SKU, `priceDiff`, `stock`), `ProductImage`
- **Commerce.** `Order` (COD-only, status `PENDING`, `CONFIRMED`, `SHIPPED`, `DELIVERED`, plus `CANCELLED` and `RETURNED`), `OrderItem` (freezes `nameSnapshot` and `priceSnapshot`), `Address`

SQLite rejects native enums and `@db.*` annotations. Re-add them during the planned Postgres migration. See the **DB conventions** section in `AGENTS.md`.

## License

MIT. See [`LICENSE`](LICENSE).
