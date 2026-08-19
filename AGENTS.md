<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Stack

| Pkg           | Ver                | Note                                                                                                                                                                                                                                          |
| ------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Next.js       | ^16.2              | `reactCompiler: true`, `typedRoutes: true`                                                                                                                                                                                                    |
| React         | ^19.2              |                                                                                                                                                                                                                                               |
| TypeScript    | ^5.9               | strict, ESNext module, bundler resolution                                                                                                                                                                                                     |
| Prisma        | ^7.9               | Uses `prisma-client` generator (not `prisma-client-js`). Output: `generated/prisma`. Driver adapter: `@prisma/adapter-libsql` for SQLite. Config: `prisma.config.ts`. SQLite rejects `@db.*` native annotations (P1012) — omit until Postgres |
| shadcn/ui     | base-vega style    | Components in `src/components/shadcnui/`. Aliased as `@/components/shadcnui`                                                                                                                                                                  |
| Base UI React | ^1.6               | Primitive provider for shadcn components (e.g., `@base-ui/react/button`)                                                                                                                                                                      |
| Tailwind CSS  | ^4.3               | `@tailwindcss/postcss` plugin, `tw-animate-css`, `shadcn/tailwind.css`                                                                                                                                                                        |
| Zod           | ^4.4               | Schema validation                                                                                                                                                                                                                             |
| env           | @t3-oss/env-nextjs | Split: `src/lib/env/serverEnv.ts` + `clientEnv.ts`                                                                                                                                                                                            |

Path aliases: `@/*` → `./src/*`, `@generated/*` → `./generated/*`.

## Agent behavior

- **Ask questions** when ambiguous or before destructive actions. Prefer one batched question.
- **Update this file** when you discover non-obvious gotchas, fixes, or conventions.
- **Use skills + MCPs** before writing code matching `prisma-*`, `next-*`, `better-auth-*`, `zod`, etc. Use `shadcn` MCP for component add/search/audit. Use `better-auth` MCP for auth docs.

## Verification

- **Lint**: `bun lint` — runs `eslint` only (the package.json `lint` script; no typegen/tsc)
- **Type check**: `bun run typecheck` — `next typegen && tsc --noEmit`
- **Build gate**: `bun run build` — `prisma generate && next build`
- **Full prod**: `bun prod` — `prisma generate && next build && next start` (before schema/env changes)
- **Seed**: `bun run seed` (or `bunx --bun prisma db seed`) — idempotent; use `bunx --bun prisma migrate reset` to wipe + re-seed
- **Gotcha**: a running `next dev` server writes `.next/dev/types` concurrently with `next typegen`/`tsc`, producing torn files and cascading false LSP/type errors (e.g. "Property 'refresh' does not exist on AppRouterInstance"). Fix: kill the dev server, `Remove-Item -Recurse -Force .next/dev/types`, re-run typegen.

## Smoke testing (Playwright)

`playwright-core` is a devDependency. Bun's WebSocket transport cannot connect to Chromium DevTools on this machine (launch pipe and `connectOverCDP` both time out). Workaround: launch Chrome headless manually, then connect and run the script with `node`:

```powershell
Start-Process "C:\Users\USER\AppData\Local\ms-playwright\chromium-1234\chrome-win64\chrome.exe" -ArgumentList "--headless=new","--remote-debugging-port=9222","--no-sandbox","--user-data-dir=C:\Users\USER\AppData\Local\Temp\opencode\cdp-profile","about:blank"
node smoke.mjs   # uses chromium.connectOverCDP("http://127.0.0.1:9222")
```

Kill the chrome process and the `next start` listener (port 3000) after testing.

## Project structure

```
src/
  app/              # App Router (layout.tsx, page.tsx, globals.css)
    (public)/       # Public shell (Header + cart provider): home, products, categories, search, about, contact, forbidden
      (auth)/       # Nested group, bare layout (AuthBackButton only): /auth/login, /auth/register
    (private)/      # Authed shell (sidebar + sign out): cart, checkout, dashboard, orders, profile, settings
      admin/        # /admin keeps its own "unboxd Admin" layout
  components/
    Auth/           # AuthBackButton, SignInForm, SignOutButton, SignUpForm
    Cart/           # CartDrawer, CartItemRow, CartProvider
    Layout/         # Header, ThemeToggleButton
    Orders/         # OrderStatusBadge, OrderTimeline
    Product/        # FilterSidebar, Pagination, ProductCard, ProductGallery, ProductGrid, ProductInfo
    Providers/      # ThemeProvider (next-themes)
    shadcnui/       # shadcn primitives (button.tsx, toast.tsx)
  hooks/            # use-mounted.ts
  lib/
    auth.ts         # Better Auth server config (email/password + admin RBAC + nextCookies)
    auth-client.ts  # Better Auth client
    cart/atoms.ts   # jotai cart store, addToCart(), FREE_SHIPPING_THRESHOLD; items keyed (productId, sku), localStorage 'cart-v2'
    dbClient/       # Prisma singleton with libSQL adapter
    env/            # serverEnv.ts, clientEnv.ts (t3-env)
    fonts.ts        # next/font (Geist, Inter)
    types.ts        # LayoutProps
    utils.ts        # cn() helper (clsx + tailwind-merge)
  server/           # Server actions: catalog.ts, admin/
  proxy.ts          # Route protection (Next 16 middleware replacement): PROTECTED session-cookie redirect, ADMIN role check → /forbidden, AUTH + ADMIN set x-route-shell header for group-layout pass-through
prisma/
  schema.prisma     # Auth + catalog + orders models
  seed.ts           # 26 products / 11 categories, idempotent (see DB conventions)
  migrations/       # SQLite migrations; delete before the Day 13 Postgres migration (P3014)
generated/prisma/   # Prisma client output (gitignored)
public/uploads/     # User uploads (all files ignored except .gitkeep)
```

## DB conventions (SQLite, Prisma 7)

- **No native enums, no scalar lists, no `@db.*` annotations** (P1012). Statuses are `String`; re-add `@db.Decimal(10, 2)` / `@db.Text` during the Day 13 Postgres migration (`app-execution.md` pitfall #9).
- **CLI**: always `bunx --bun prisma ...`. v7 `migrate dev` does NOT auto-generate — use `bun run migrate` (runs generate) or generate explicitly after any schema change.
- **Seed**: configured via `migrations.seed` in `prisma.config.ts` (`bun prisma/seed.ts`). Guard skips if products OR categories exist (partial-state safety); full reset requires `migrate reset`.
- **Money**: `Decimal` everywhere (basePrice, priceDiff, order totals, snapshots). `OrderItem` freezes `nameSnapshot` + `priceSnapshot` at purchase — never reference live product data on receipts.
- **Order.status**: `PENDING | CONFIRMED | SHIPPED | DELIVERED | CANCELLED | RETURNED` (COD-first; RETURNED covers delivery refusals).
- **Seed images** are `placehold.co` placeholders — swap for real uploads when the Day 8 pipeline lands.

## Gitignore pattern: uploads

`public/uploads/*` + `!public/uploads/.gitkeep` — ignores all uploaded files but keeps empty dir tracked via `.gitkeep`. Do not add `public/uploads/` itself to gitignore.

## Key restrictions

- **ESLint**: Locked at eslint@9.x until `eslint-plugin-react` ships v10 support. Do NOT bump.
- **TypeScript**: Currently ^5.9. TS 7.0 (Go-native compiler) blocked until typescript-eslint API stabilizes (~Oct 2026). Do not migrate.

## Form patterns

Schemas in `src/lib/zodSchema.ts` — export both schema and `type X = z.infer<typeof xSchema>`.

Components use `"use client"`, `react-hook-form` + `@hookform/resolvers/zod`, and shadcn primitives:

```typescript
const { handleSubmit, control, formState: { isSubmitting } } = useForm({
  resolver: zodResolver(mySchema),
  defaultValues: { ... },
  mode: "all",
});
```

Each field goes through `Controller`:

```typescript
<Controller
  name="fieldName"
  control={control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor={field.name}>Label</FieldLabel>
      <Input {...field} id={field.name} aria-invalid={fieldState.invalid} autoComplete="..." />
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

Submit: `<form onSubmit={handleSubmit(handler)} noValidate>`. Button disabled while submitting with icon toggle.

## Git commits

Use PowerShell here-strings:

```powershell
git commit -m @"
<commit message here>
"@
```
