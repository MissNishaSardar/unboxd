<!-- BEGIN:nextjs-agent-rules -->

# This is not the Next.js you know

This version has breaking changes. APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Stack

| Pkg           | Ver                | Note                                                                                                                                                                                                                                         |
| ------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Next.js       | ^16.2              | `reactCompiler: true`, `typedRoutes: true`                                                                                                                                                                                                   |
| React         | ^19.2              |                                                                                                                                                                                                                                              |
| TypeScript    | ^5.9               | strict, ESNext module, bundler resolution                                                                                                                                                                                                    |
| Prisma        | ^7.9               | Uses `prisma-client` generator (not `prisma-client-js`). Output: `generated/prisma`. Driver adapter: `@prisma/adapter-libsql` for SQLite. Config: `prisma.config.ts`. SQLite rejects `@db.*` native annotations (P1012), omit until Postgres |
| shadcn/ui     | base-vega style    | Components in `src/components/shadcnui/`. Aliased as `@/components/shadcnui`                                                                                                                                                                 |
| Base UI React | ^1.6               | Primitive provider for shadcn components (e.g., `@base-ui/react/button`)                                                                                                                                                                     |
| Tailwind CSS  | ^4.3               | `@tailwindcss/postcss` plugin, `tw-animate-css`, `shadcn/tailwind.css`                                                                                                                                                                       |
| Zod           | ^4.4               | Schema validation                                                                                                                                                                                                                            |
| env           | @t3-oss/env-nextjs | Split: `src/lib/env/serverEnv.ts` + `clientEnv.ts`                                                                                                                                                                                           |

Path aliases map `@/*` to `./src/*` and `@generated/*` to `./generated/*`.

## Style

Never use em dashes anywhere in this project. This covers code, comments, docs, commit messages, and generated text. Use periods or commas instead. En dashes and hyphen as dash substitutes are also banned. This is a hard user preference confirmed 2026-09-11. Remember it for all future turns and all file types including src, docs, and generated output. Replace any existing em or en dash with a comma or period.

## Agent behavior

- **Ask questions.** Ask when ambiguous or before destructive actions. Ask exactly one question per turn.
- **Work queue.** Agreed plan items form an ordered queue, applied one by one in order. New information never skips queued items. If new input arrives mid-implementation, finish the current step to a safe point, then ask whether to queue the new item behind or interrupt. Never silently swap.
- **Update this file.** Add non-obvious gotchas, fixes, or conventions when you find them.
- **Use skills plus MCPs.** Check them before writing code matching `prisma-*`, `next-*`, `better-auth-*`, `zod`, and similar. Use `shadcn` MCP for component add, search, and audit. Use `better-auth` MCP for auth docs.

## Verification

- **Lint.** `bun lint` runs `eslint` only (the package.json `lint` script, no typegen or tsc)
- **Type check.** `bun run typecheck` runs `next typegen && tsc --noEmit`
- **Build gate.** `bun run build` runs `prisma generate && next build`
- **Full prod.** `bun prod` runs `prisma generate && next build && next start` (use before schema or env changes)
- **Seed.** `bun run seed` (or `bunx --bun prisma db seed`) is idempotent. Use `bunx --bun prisma migrate reset` to wipe and re-seed
- **Gotcha.** A running `next dev` server writes `.next/dev/types` concurrently with `next typegen` or `tsc`. This produces torn files and cascading false LSP and type errors (e.g. "Property 'refresh' does not exist on AppRouterInstance"). To fix, kill the dev server, run `Remove-Item -Recurse -Force .next/dev/types`, then re-run typegen.

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
    (auth)/         # Auth shell (AuthBackButton only): /auth/login, /auth/register
    (private)/      # Authed shell (sidebar + sign out): dashboard, orders, profile, settings
      admin/        # /admin keeps its own "unboxd Admin" layout
      cart, checkout/ # Minimal shell (logo + secure note, no sidebar) via PrivateLayout pathname branch
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
    cart/atoms.ts   # jotai cart store, addToCart(), FREE_SHIPPING_THRESHOLD; items keyed (productId, sku), localStorage 'cart-v4'
    dbClient/       # Prisma singleton with libSQL adapter
    env/            # serverEnv.ts, clientEnv.ts (t3-env)
    fonts.ts        # next/font (Geist, Inter)
    types.ts        # LayoutProps
    utils.ts        # cn() helper (clsx + tailwind-merge)
  server/           # Server actions: catalog.ts, admin/
  proxy.ts          # Route protection (Next 16 middleware replacement): PROTECTED session-cookie redirect, ADMIN role check → /forbidden, ADMIN sets x-route-shell header for group-layout pass-through
prisma/
  schema.prisma     # Auth + catalog + orders models
  seed.ts           # 26 products / 11 categories, idempotent (see DB conventions)
  migrations/       # SQLite migrations; delete before the Postgres migration (P3014)
generated/prisma/   # Prisma client output (gitignored)
public/uploads/     # User uploads (all files ignored except .gitkeep)
```

## DB conventions (SQLite, Prisma 7)

- **No native enums, no scalar lists, no `@db.*` annotations.** P1012. Statuses are `String`. Re-add `@db.Decimal(10, 2)` and `@db.Text` during the Postgres migration.
- **CLI.** Always run `bunx --bun prisma ...`. V7 `migrate dev` does not auto-generate. Use `bun run migrate` (runs generate) or generate explicitly after any schema change.
- **Seed.** Configured through `migrations.seed` in `prisma.config.ts` (`bun prisma/seed.ts`). The guard skips when products or categories exist (partial-state safety). Full reset requires `migrate reset`.
- **Money.** Use `Decimal` everywhere (basePrice, priceDiff, order totals, snapshots). `OrderItem` freezes `nameSnapshot` plus `priceSnapshot` at purchase. Never reference live product data on receipts.
- **Discounts.** `Product.discountPercent` (0-100) applies to all variants. Customer-facing price always comes from `effectivePrice()` in `src/lib/pricing.ts`, never hand-rolled. `StoreSettings.maxDiscountPercent` (default 50) caps it, enforced in `createProduct`/`updateProduct`. Checkout re-prices server-side, cart key bumps when price semantics change.
- **Seed images.** Seed images are `placehold.co` placeholders. Swap for real uploads when the upload pipeline lands.
- **Admin stock filters.** Variant-level (`variants.some`): `low` means any variant with 1 to (threshold - 1) units (`gt: 0, lt: lowStockThreshold` from `getStoreSettings()`, default 5), `out` means any variant at 0. Low excludes out. Keep the `getAdminAttention` low-stock count in sync with the `stock=low` filter it links to.
- **Store settings.** Single-row `StoreSettings` (`id = "store"`) edited at `/admin/settings`. Read via cached `getStoreSettings()`. DB-backed values cannot be imported by client components, pass them as props from server pages. Checkout pauses when `codEnabled` is false (no prepaid path exists).
- **Admin product list pagination.** The page always renders page 1 plus `Load more` via `/api/admin/products?page=N`. Filter links and search must drop `?page=` so client page state stays in sync.

## Gitignore pattern

`public/uploads/*` plus `!public/uploads/.gitkeep` ignores all uploaded files but keeps the empty dir tracked through `.gitkeep`. Do not add `public/uploads/` itself to gitignore.

## Key restrictions

- **ESLint.** Locked at eslint@9.x until `eslint-plugin-react` ships v10 support. Do not bump.
- **TypeScript.** Currently ^5.9. TS 7.0 (Go-native compiler) stays blocked until typescript-eslint API stabilizes (around Oct 2026). Do not migrate.

## Form patterns

Schemas in `src/lib/zodSchema.ts` export both schema and `type X = z.infer<typeof xSchema>`.

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

Submit with `<form onSubmit={handleSubmit(handler)} noValidate>`. Disable the button while submitting and toggle the icon.

## Git commits

Use PowerShell here-strings:

```powershell
git commit -m @"
<commit message here>
"@
```

Line endings are `* text=auto` with LF in the repo and CRLF in the worktree. Bulk mtime touches leave stat dirty entries that `git status` flags with zero content diff, and CRLF warnings on stderr inflate piped line counts, so always recount with `2>$null` and confirm with `git diff --name-only` before staging. Never use `git add --renormalize` when deleted files are pending, it aborts with unable to stat, use `git add -A` instead.
