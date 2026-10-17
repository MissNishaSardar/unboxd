<!-- BEGIN:nextjs-agent-rules -->

# This is not the Next.js you know

This version has breaking changes. APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Note on style scope

Prose style bans apply to normal sentences only. Code, commands, paths, and config stay valid. Code may keep syntax marks needed to run, for example function calls and spread use. Command output may keep its raw form.

## IMPORTANT

Prefer retrieval led reasoning over memory led reasoning for every task. Read files first. Trust tool output over training memory. Use subagents for work that can run in parallel.

## Style

Do not use em dashes anywhere. Do not use en dashes anywhere. Do not use round brackets in prose sentences. Do not use hyphen forms as dash substitutes. End the sentence or use a comma for thought separation. Never use ellipses. Speech readers fail on them. Use plain speech. Mannered prose fails. Never use em dashes or en dashes in code, comments, docs, commit messages, or generated text. Use periods or commas instead. This is a hard user preference confirmed 2026-09-11. Remember it for all future turns and all file types including src, docs, and generated output. Replace any existing em dash or en dash with a comma or period.

## Communication

State what things do. Do not describe how they feel. Keep sentences short. Split dense sentences into simple sentences. Use plain words. After tool use, give a quick summary. Say what you will do first. Give short updates while you work. Close with a full recap of what you found, what you did, and what is next. Put command output in the reply. The user sees little of it. Put important text in the main reply. Put file drafts in the main reply. Do not rely on a hidden channel for review.

## Judgment

Have opinions. React to facts. Do not list pros and cons with no verdict. Say what works. Say what fails. Say what to pick.

## Change Control

Share the plan before edits, commands, or git operations. Ask through the question tool. Wait for approval. Do not act on assumptions. Do not fold the question into a normal response. Wait for a clear order before changing files. If unclear, give info and advice. Only change when told.

## Questions

Ask one question at a time. Wait for the answer. Use the answer to shape the next question. Do not batch questions. Single ask stays for user questions. Parallel ask stays for tool calls.

## Tool Use

List needs in private first. Then ask all free items at once. Call free tools in parallel. Call linked tools in order. Never guess missing values. Think on tool results before the next move. Plan then act. Use subagents for parallel free work. Work direct for simple single work. Clean temp files at end.

## Research

Search in set order. Hold many ideas. Track trust. Judge self. Keep notes. Split hard work. Read code before claims. Never guess unseen code.

## Stack

| Pkg           | Ver                | Note                                                                                                                                                                                                                                                 |
| ------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Next.js       | ^16.2              | `reactCompiler: true`, `typedRoutes: true`                                                                                                                                                                                                           |
| React         | ^19.2              |                                                                                                                                                                                                                                                      |
| TypeScript    | ^5.9               | strict, ESNext module, bundler resolution                                                                                                                                                                                                            |
| Prisma        | ^7.9               | Uses `prisma-client` generator, not `prisma-client-js`. Output is `generated/prisma`. Driver adapter is `@prisma/adapter-libsql` for SQLite. Config is `prisma.config.ts`. SQLite rejects `@db.*` native annotations with P1012, omit until Postgres |
| shadcn/ui     | base-vega style    | Components in `src/components/shadcnui/`. Aliased as `@/components/shadcnui`                                                                                                                                                                         |
| Base UI React | ^1.6               | Primitive provider for shadcn components, for example `@base-ui/react/button`                                                                                                                                                                        |
| Tailwind CSS  | ^4.3               | `@tailwindcss/postcss` plugin, `tw-animate-css`, `shadcn/tailwind.css`                                                                                                                                                                               |
| Zod           | ^4.4               | Schema validation                                                                                                                                                                                                                                    |
| env           | @t3-oss/env-nextjs | Split: `src/lib/env/serverEnv.ts` + `clientEnv.ts`                                                                                                                                                                                                   |

Path aliases map `@/*` to `./src/*` and `@generated/*` to `./generated/*`.

## Agent behavior

- **Ask questions.** Ask when ambiguous or before destructive actions. Ask exactly one question per turn.
- **Work queue.** Agreed plan items form an ordered queue, applied one by one in order. New information never skips queued items. If new input arrives mid implementation, finish the current step to a safe point, then ask whether to queue the new item behind or interrupt. Never silently swap.
- **Update this file.** Add non obvious gotchas, fixes, or conventions when you find them.
- **Use skills plus MCPs.** Check them before writing code matching `prisma-*`, `next-*`, `better-auth-*`, `zod`, and similar. Use `shadcn` MCP for component add, search, and audit. Use `better-auth` MCP for auth docs.

## Verification

- **Lint.** `bun lint` runs `eslint` only. It uses the package.json `lint` script, with no typegen and no tsc.
- **Type check.** `bun run typecheck` runs `next typegen` plus `tsc --noEmit`.
- **Build gate.** `bun run build` runs `prisma generate` plus `next build`.
- **Full prod.** `bun prod` runs `prisma generate` plus `next build` plus `next start`. Use it before schema or env changes.
- **Seed.** `bun run seed` and `bunx --bun prisma db seed` do the same idempotent seed. Use `bunx --bun prisma migrate reset` to wipe and reseed.
- **Gotcha.** A running `next dev` server writes `.next/dev/types` at the same time as `next typegen` or `tsc`. This makes torn files and false LSP and type errors. For example, you may see `Property 'refresh' does not exist on AppRouterInstance`. To fix, kill the dev server, run `Remove-Item -Recurse -Force .next/dev/types`, then rerun typegen.

## Smoke testing

Playwright CLI comes from `@playwright/test` 1.63.0 with script `test:e2e`. Config is `playwright.config.ts` with test dir `./tests` and base URL `http://127.0.0.1:3000`. It uses system Chrome via channel chrome, so no browser download is needed.

Browser download from CDN times out on this machine for both full Chromium and headless shell. Do not run browser install here. Cache at `C:\Users\USER\AppData\Local\ms-playwright` has no Chromium folder. Old `chromium-1234` path is gone.

Run order is start prod server first, then `bun run test:e2e`. Kill the `next start` listener on port 3000 after testing.

Legacy note is `playwright-core` stays as devDependency. Bun WebSocket transport cannot connect to Chromium DevTools on this machine. Both launch pipe and `connectOverCDP` time out. The old manual Chrome headless workaround is retired. Tests use system Chrome via channel chrome, so no browser download and no manual Chrome process are needed.

Kill the `next start` listener on port 3000 after testing.

### Playwright CLI discipline

- Default to sliced runs. Never run the full review shots file in a live agent loop.
- Use smoke project for fast checks.
- Use one title filter for review shots.
- Always use line reporter and one worker.
- Always send full output to a temp log file. Read tail only, max 60 lines.
- Never paste full Playwright stdout into chat.
- Never open HTML report in agent loop. Use line output only.
- Start prod server before tests. Kill port 3000 listener after tests.
- Remove review screenshots after review unless user asks to keep them.

```powershell
bun run test:e2e --project=smoke --reporter=line --workers=1 > $env:TEMP\opencode\pw-smoke.log 2>&1
Get-Content $env:TEMP\opencode\pw-smoke.log -Tail 60
```

```powershell
bunx --bun playwright test review-shots.spec.ts -g "01-home" --reporter=line --workers=1 > $env:TEMP\opencode\pw-one.log 2>&1
Get-Content $env:TEMP\opencode\pw-one.log -Tail 60
```

## Project structure

```
src/
  app/ # App Router with layout, page, globals
    public group # Public shell with Header and cart provider for home, products, categories, search, about, contact, forbidden
    auth group # Auth shell with AuthBackButton only for login and register
    private group # Authed shell with sidebar and sign out for dashboard, orders, profile, settings
      admin group # Admin area with its own unboxd Admin layout
      cart and checkout # Minimal shell with logo and secure note and no sidebar via PrivateLayout pathname branch
  components/
    Auth # AuthBackButton, SignInForm, SignOutButton, SignUpForm
    Cart # CartDrawer, CartItemRow, CartProvider
    Layout # Header, ThemeToggleButton
    Orders # OrderStatusBadge, OrderTimeline
    Product # FilterSidebar, Pagination, ProductCard, ProductGallery, ProductGrid, ProductInfo
    Providers # ThemeProvider with next-themes
    shadcnui # shadcn primitives like button and toast
  hooks # use-mounted.ts
  lib/
    auth.ts # Better Auth server config with email password and admin RBAC and nextCookies
    auth-client.ts # Better Auth client
    cart/atoms.ts # jotai cart store with addToCart and FREE_SHIPPING_THRESHOLD with items keyed by productId and sku with localStorage cart-v4
    dbClient # Prisma singleton with libSQL adapter
    env # serverEnv and clientEnv with t3-env
    fonts.ts # next font with Geist and Inter
    types.ts # LayoutProps
    utils.ts # cn helper with clsx and tailwind-merge
  server # Server actions for catalog and admin
  proxy.ts # Route protection for Next 16 middleware replacement with PROTECTED session cookie redirect and ADMIN role check to forbidden and ADMIN sets x-route-shell header for group layout pass through
prisma/
  schema.prisma # Auth and catalog and orders models
  seed.ts # 26 products and 11 categories idempotent per DB conventions
  migrations # SQLite migrations to delete before the Postgres migration with P3014
generated/prisma # Prisma client output gitignored
public/uploads # User uploads with all files ignored except gitkeep
```

## DB conventions

- **No native enums, no scalar lists, no `@db.*` annotations.** P1012. Statuses are `String`. Re-add `@db.Decimal(10, 2)` and `@db.Text` during the Postgres migration.
- **CLI.** Always run `bunx --bun prisma COMMAND`. V7 `migrate dev` does not auto generate. Use `bun run migrate` with generate, or generate explicitly after any schema change.
- **Seed.** Configured through `migrations.seed` in `prisma.config.ts` with `bun prisma/seed.ts`. The guard skips when products or categories exist. This keeps partial state safe. Full reset requires `migrate reset`.
- **Money.** Use `Decimal` everywhere for basePrice, priceDiff, order totals, and snapshots. `OrderItem` freezes `nameSnapshot` plus `priceSnapshot` at purchase. Never reference live product data on receipts.
- **Discounts.** `Product.discountPercent` with range 0 to 90 applies to all variants. Customer facing price always comes from `effectivePrice()` in `src/lib/pricing.ts`, never hand rolled. `StoreSettings.maxDiscountPercent` with default 50 caps it, enforced in `createProduct` and `updateProduct`. Checkout reprices server side, cart key bumps when price semantics change.
- **Timed deals.** `Product.discountStartsAt` plus `discountEndsAt` are nullable. Null dates mean the discount is always on. Display and checkout must use `activeDiscountPercent()` with server now, never client clock. Admin enters IST through `src/lib/deals.ts`, stored as UTC. Checkout refreshes live prices with `quoteCart()` before submit and stops when totals move. Order snapshots keep the charged price.
- **Flash sales.** `FlashSale` rows in `src/server/deals.ts` carry one store wide sale. At most one discount sale overlaps in time, enforced on save with `OVERLAP`. Price uses `combineDiscountPercent()`, the greater of product deal and live sale, never the sum. Percent 0 rows are info banners. Banner ownership lives on `/admin/deals`, with legacy settings text as fallback only when no rows exist. Every sale save revalidates the products tag plus root layout.
- **Seed images.** Seed images are `placehold.co` placeholders. Swap for real uploads when the upload pipeline lands.
- **Admin stock filters.** Variant level uses `variants.some`. `low` means any variant with stock from 1 up to threshold minus 1. Threshold comes from `getStoreSettings()` with key `gt: 0, lt: lowStockThreshold` and default 5. `out` means any variant at 0. Low excludes out. Keep `getAdminAttention` low stock count in sync with the `stock=low` filter it links to.
- **Store settings.** Single row `StoreSettings` with `id = "store"` edited at `/admin/settings`. Read via cached `getStoreSettings()`. DB backed values cannot be imported by client components, pass them as props from server pages. Checkout pauses when `codEnabled` is false, with no prepaid path at this time.
- **Admin product list pagination.** The page always renders page 1 plus `Load more` via `/api/admin/products?page=N`. Filter links and search must drop `?page=` so client page state stays in sync.
- **Admin shell width.** `AdminLayout` uses `Container` with `max-w-none` so tables use the full inset width. Do not reintroduce `max-w-7xl` there. Public shells keep the capped container.
- **Admin DataTable.** Pinned at `@tanstack/react-table@8.21.3`. V9 uses a new signal API with `useTable`, classic `useReactTable` lives in its legacy entry only, so stay on V8 for the shadcn pattern. Shared shell is `src/components/Admin/DataTable.tsx` with `manualSorting` plus `manualPagination` set, server owns sort and paging. Base UI `Checkbox` takes a separate `indeterminate` boolean prop, never `checked="indeterminate"`. TanStack row selection is keyed by `getRowId`, so it survives `Load more` appends. Clear it when the URL filter or sort key changes.

## Gitignore pattern

`public/uploads/*` plus `!public/uploads/.gitkeep` ignores all uploaded files but keeps the empty dir tracked through `.gitkeep`. Do not add `public/uploads/` itself to gitignore.

## Key restrictions

- **ESLint.** Locked at eslint@9.x until `eslint-plugin-react` ships v10 support. Do not bump.
- **TypeScript.** Currently ^5.9. TS 7.0 Go native compiler stays blocked until typescript-eslint API stabilizes around Oct 2026. Do not migrate.

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
      <Input {...field} id={field.name} aria-invalid={fieldState.invalid} autoComplete="email" />
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

Line endings are `* text=auto` with LF in the repo and CRLF in the worktree. Bulk mtime touches leave stat dirty entries that `git status` flags with zero content diff. CRLF warnings on stderr inflate piped line counts, so always recount with `2>$null` and confirm with `git diff --name-only` before staging. Never use `git add --renormalize` when deleted files are pending. It aborts with unable to stat. Use `git add -A` instead.

## Hardened conventions 2026-10-16

- **Speech safe text.** Never use three dots or the ellipsis char in UI strings, placeholders, toasts, or comments. Speech readers fail on them. Use `Loading`, `Sending`, `Deleting` with no dots.
- **No mock data in runtime.** Server returns real review rows only. `getReviewsBySlug` never mixes fakes. Fetch the vote set before mapping rows. Card rating shows zero until real ratings flow through card data.
- **Shared numbers.** Use `src/lib/constants.ts` for `DAY_MS`, `DEBOUNCE_MS`, `MOBILE_BREAKPOINT`, `LOW_STOCK_FALLBACK`, `MIN_ACTION_DELAY_MS`. Never hardcode `86400000`, `300`, or `768` in new code.
- **Seed owns brand map.** `BRAND_MAP` in `src/lib/brand.ts` exists for seed accuracy. Runtime reads brand from DB. Do not delete the map.
- **Placeholder map is load bearing.** `resolveProductImageUrl` plus `getPlaceholderPhotoUrl` cover seed placeholder images until the upload pipeline lands. Do not delete.
- **Action delay.** `withMinDelay` defaults to `MIN_ACTION_DELAY_MS` so fast actions keep a brief pending state without long waits.
- **Review shots.** The spec reads `E2E_*` env with seed tied fallbacks. Never use `waitForTimeout`. Assert with web first checks such as visible text and URL.
- **Look tokens.** Headings use Fraunces through `--font-heading`. The banner strip and cart badge use solid `bg-primary`. The shipped badge uses sky. Page motion uses `reveal` plus delay steps in `globals.css` with a reduced motion guard. Texture helpers are `texture-grid` and `texture-dots`.
- **dnd-kit DndContext id.** dnd-kit 6.3.1 builds `DndDescribedBy` ids from a module counter, so SSR and client renders never match without one. Every `DndContext` needs a stable explicit `id` prop or the drag handles hydration mismatch. `admin-categories` is set in `CategoriesTable`.
- **Category ordering contract.** Display order everywhere is `position asc`, then `name asc` in SQLite binary collation, then `id asc` as the final tiebreak. The admin drag table mirrors the binary name compare with JS `<`, never `localeCompare`, so the drop preview matches the landed order while positions tie. Creates append at `max(live sibling positions) + 1`. Manual ties from the edit form resolve through the same tiebreak.
