Your plan is architecturally sound and the stack is fully documentation-validated — here's the 14-day ultimate build plan that takes you from a blank repo to a portfolio-grade production deploy. Since Better Auth is already configured, Day 2 focuses on layering the Admin plugin and RBAC on top of your existing setup rather than starting auth from scratch.

## Phase A — Foundation (Days 1–2)

### Day 1 · Prisma Schema + Seed (Electronics Catalog)

**Goal:** A production-grade relational schema with product variants, inventory snapshots, and order integrity — designed once, portable across SQLite→Postgres.

**Key tasks:**

- Lock `schema.prisma` with `provider = "sqlite"` for dev (env-driven later).
- Model `User` (Better Auth fields: `role`, `banned`, `banReason`, `banExpires`), `Session`, `Account`, `Verification` — generate via `npx auth@latest generate` after adding the admin plugin on Day 2.【turn1fetch0】
- Design the catalog: `Category` (self-referencing parent for sub-categories like Audio → Headphones), `Product`, `ProductVariant` (RAM/storage/color for electronics), `ProductImage`. **Decision: no separate `Inventory` table — stock lives on `ProductVariant.stock`** (the original plan named an `Inventory` model, but every downstream reference — checkout decrement, Day 10 low-stock dashboard — reads `stock` on the variant; a second table would duplicate state).
- Order models: `Order`, `OrderItem` (with `priceSnapshot` and `nameSnapshot` — never reference live product price after purchase), `Address`.
- Wishlist model: `WishlistItem` with composite unique `@@unique([userId, productId])` — folded into Day 1 so Day 5's server-backed wishlist (`upsert` on the pair) needs no schema migration. Wishlist seed rows wait for Day 2's user seed.
- Seed 26 electronics products (phones, laptops, audio, accessories, cases, chargers) with variants via a `prisma/seed.ts` script run through `bunx prisma db seed`. Idempotent: skips if products already exist.

**Deliverable:** `prisma migrate dev --name init` runs clean; `bun run seed` populates a realistic catalog.

<details>
<summary><strong>📦 Module Card — Prisma Schema (core models)</strong></summary>

```prisma
// schema.prisma — designed for SQLite→Postgres portability
// ⚠️ No native enums (SQLite doesn't support them) — use String + app-level validation
// ⚠️ No @db.* native type annotations on SQLite — Prisma rejects them (P1012);
//    re-add @db.Text / @db.Decimal(10, 2) during the Day 13 Postgres migration.
datasource db {
  provider = "sqlite" // → "postgresql" in prod
  url      = env("DATABASE_URL")
}

model Product {
  id            String   @id @default(cuid())
  slug          String   @unique
  name          String
  description   String   // Postgres: @db.Text
  basePrice     Decimal  // Postgres: @db.Decimal(10, 2)
  isActive      Boolean  @default(true)
  featured      Boolean  @default(false)
  categoryId    String
  category      Category @relation(fields: [categoryId], references: [id])
  variants      ProductVariant[]
  images        ProductImage[]
  wishlistItems WishlistItem[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  @@index([categoryId])
  @@index([isActive, featured])
}

model ProductVariant {
  id        String  @id @default(cuid())
  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  sku       String  @unique
  name      String  // "8GB / 256GB / Black"
  priceDiff Decimal @default(0) // Postgres: @db.Decimal(10, 2)
  stock     Int     @default(0)
  @@index([productId])
}

model Order {
  id           String      @id @default(cuid())
  userId       String
  user         User        @relation(fields: [userId], references: [id])
  status       String      @default("PENDING") // PENDING|CONFIRMED|SHIPPED|DELIVERED|CANCELLED|RETURNED
  paymentMethod String     @default("COD")
  subtotal     Decimal     // Postgres: @db.Decimal(10, 2)
  shipping     Decimal     @default(0) // Postgres: @db.Decimal(10, 2)
  total        Decimal     // Postgres: @db.Decimal(10, 2)
  items        OrderItem[]
  address      Address?
  createdAt    DateTime    @default(now())
  @@index([userId])
  @@index([status])
}

model OrderItem {
  id            String  @id @default(cuid())
  orderId       String
  order         Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId     String
  variantId     String?
  nameSnapshot  String  // freeze at purchase time
  priceSnapshot Decimal // Postgres: @db.Decimal(10, 2)
  quantity      Int
  @@index([orderId])
}

model WishlistItem {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([userId, productId])
  @@index([userId])
}
```

</details>

### Day 2 · RBAC + Route Protection (proxy.ts)

**Goal:** Admin/customer role separation with server-side enforcement — no admin route reachable by a regular user.

**Key tasks:**

- Add the Better Auth admin plugin: `plugins: [admin({ defaultRole: "user" })]` — this injects `role`, `banned`, `banReason`, `banExpires` into your `user` table and gives you `createUser`, `listUsers`, `setRole`, `banUser`, `impersonateUser` endpoints.【turn1fetch0】
- Run `npx auth migrate` to apply the new fields, then promote your seed admin user: `auth.api.setRole({ body: { userId, role: "admin" } })`.
- Create `src/proxy.ts` (Next.js 16 renamed `middleware.ts` → `proxy.ts`). Match `/admin/*` and `/dashboard/*`, `/orders/*`, `/checkout`, `/settings`, `/profile`. For `/admin/*`, verify the session cookie has `role: "admin"` — Better Auth stores the role in the session, so read it via `auth.api.getSession({ headers })` inside a lightweight check or decode the session cookie for performance.【turn0search2】【turn0search3】
- Build a `requireAdmin()` server helper for admin Server Actions: fetch session, throw 403 if `session.user.role !== "admin"`.
- Seed one admin + two customer accounts.

**Deliverable:** `/admin` redirects non-admins to `/`; admin can sign in and reach the (empty) dashboard shell.

<details>
<summary><strong>🔐 Module Card — Better Auth RBAC + proxy.ts</strong></summary>

```ts
// src/lib/auth.ts — extend your existing config
import { admin } from "better-auth/plugins";

export const auth = betterAuth({
  // ...your existing config
  plugins: [
    admin({
      defaultRole: "user", // new signups are customers
      adminRoles: ["admin"], // only "admin" can hit admin endpoints
    }),
  ],
});
```

```ts
// src/proxy.ts — Next.js 16 (replaces middleware.ts)
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";

const PROTECTED = [
  "/dashboard",
  "/checkout",
  "/orders",
  "/settings",
  "/profile",
  "/wishlist",
];
const ADMIN = ["/admin"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (![...PROTECTED, ...ADMIN].some((p) => pathname.startsWith(p))) return;

  // Cheap check: decode session cookie without DB hit for the proxy layer
  const session = await auth.api.getSession({
    headers: req.headers as unknown as Headers,
  });

  if (
    !session &&
    [...PROTECTED, ...ADMIN].some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (
    ADMIN.some((p) => pathname.startsWith(p)) &&
    session?.user.role !== "admin"
  ) {
    return NextResponse.redirect(new URL("/", req.url));
  }
}
```

```ts
// src/lib/guard.ts — for Server Actions
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") throw new Error("FORBIDDEN");
  return session;
}
```

</details>

---

## Phase B — Storefront (Days 3–5)

### Day 3 · Homepage + Product Catalog + Caching

**Goal:** Fast, cacheable, shareable product listing with type-safe filters.

**Key tasks:**

- Homepage (`(public)/page.tsx`): server component fetching featured products + categories. Use Next.js 16's `"use cache"` directive (replaces `unstable_cache`) for the featured-products query with a `cacheTag("products")` so admin edits can invalidate it.【turn0search5】【turn0search7】
- `/products` page: read `searchParams` server-side, pass to Prisma `where` clause. Wire `nuqs` on the client for category, sort, price range, and page number.
- Wrap root `layout.tsx` in `<NuqsAdapter>` from `nuqs/adapters/next/app` — **non-negotiable**, hooks throw without it.【turn0search17】
- Build `<ProductCard>`, `<Pagination>`, `<FilterSidebar>` as Shadcn-based components.
- Add `loading.tsx` skeletons per route segment.

**Deliverable:** `/products?category=audio&sort=price_asc&page=2` renders server-side, filters are shareable URLs, navigation feels instant.

<details>
<summary><strong>🔧 Module Card — nuqs Filters + Pagination</strong></summary>

```tsx
// src/app/(public)/products/page.tsx — server component
import { ProductGrid } from "@/components/product/product-grid";
import { prisma } from "@/lib/prisma";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    sort?: string;
    page?: string;
    min?: string;
    max?: string;
  }>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page ?? "1");
  const where = {
    isActive: true,
    ...(sp.category && { category: { slug: sp.category } }),
    ...((sp.min || sp.max) && {
      basePrice: {
        gte: sp.min ? Number(sp.min) : undefined,
        lte: sp.max ? Number(sp.max) : undefined,
      },
    }),
  };
  const orderBy = {
    price_asc: { basePrice: "asc" as const },
    price_desc: { basePrice: "desc" as const },
    newest: { createdAt: "desc" as const },
  }[sp.sort ?? "newest"];

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * 12,
      take: 12,
      include: { images: true, variants: true },
    }),
    prisma.product.count({ where }),
  ]);

  return (
    <ProductGrid
      products={products}
      total={total}
      page={page}
    />
  );
}
```

```tsx
// src/components/product/filter-bar.tsx — client, nuqs-driven
"use client";
import { useQueryStates, parseAsInteger, parseAsString } from "nuqs";

export function FilterBar() {
  const [filters, setFilters] = useQueryStates({
    category: parseAsString.withDefault(""),
    sort: parseAsString.withDefault("newest"),
    page: parseAsInteger.withDefault(1),
    min: parseAsString.withDefault(""),
    max: parseAsString.withDefault(""),
  });
  // ...render Shadcn Select / Slider, call setFilters({ category: "audio", page: 1 })
}
```

</details>

### Day 4 · Product Detail Page

**Goal:** Conversion-optimized PDP with variant selection and stock awareness.

**Key tasks:**

- `(public)/products/[slug]/page.tsx`: server component, `generateStaticParams` for top products, `generateMetadata` for SEO.
- Variant selector: client component syncing selected variant to URL via `nuqs` (`?variant=sku`). Price updates from `basePrice + variant.priceDiff`.
- Image gallery: Shadcn carousel + `next/image` with blur placeholders. If multiple images, thumbnails swap the hero.
- Stock badge: "In Stock" / "Only 3 left" / "Out of Stock" driven by variant `stock`.
- Related products: same category, exclude current, limit 4, cached.
- "Add to Cart" button → calls a client function that updates the Jotai cart atom (built Day 5).

**Deliverable:** `/products/iphone-15-pro` renders with variant switching, live price, and SEO meta.

### Day 5 · Cart + Wishlist (Jotai + SSR-safe persistence)

**Goal:** Hydration-safe cart that survives refresh and works for guests.

**Key tasks:**

- Move `/cart` into the `(public)` route group (decided earlier) so guests can build carts.
- Create the Jotai cart store with `atomWithStorage` + the `typeof window` SSR guard — without it, static prerender crashes.【turn0search10】
- Build `<CartDrawer>` (slide-out, Motion-animated) + `/cart` page (full review, quantity steppers, remove).
- Cart atom shape: `{ items: { productId, variantId?, name, price, image, quantity, maxStock }[] }`.
- Wishlist: server-backed for logged-in users (`Wishlist` model), localStorage fallback for guests — sync on login.
- Add a `<CartProvider>` in the public layout that mounts the drawer + hydrates the atom after mount.

**Deliverable:** Add to cart → drawer slides in → refresh → cart persists → checkout button redirects guests to `/login?callbackUrl=/checkout`.

<details>
<summary><strong>🛒 Module Card — Jotai Cart (hydration-safe)</strong></summary>

```ts
// src/lib/cart/atoms.ts
import { atomWithStorage, createJSONStorage } from "jotai/utils";

export type CartItem = {
  productId: string;
  variantId?: string;
  slug: string;
  name: string;
  variantName?: string;
  price: number;
  image: string;
  quantity: number;
  maxStock: number;
};

// ⚠️ SSR guard — without this, Next.js static prerender throws
const storage = createJSONStorage(() =>
  typeof window !== "undefined" ? window.localStorage : undefined,
);

export const cartAtom = atomWithStorage<CartItem[]>("cart", [], storage);

// derived atoms
export const cartCountAtom = atom((get) =>
  get(cartAtom).reduce((sum, i) => sum + i.quantity, 0),
);
export const cartTotalAtom = atom((get) =>
  get(cartAtom).reduce((sum, i) => sum + i.price * i.quantity, 0),
);
```

```tsx
// src/components/cart/cart-drawer.tsx
"use client";
import { useAtomValue } from "jotai";
import { motion, AnimatePresence } from "motion/react"; // motion v13 import path
import { cartAtom } from "@/lib/cart/atoms";

export function CartDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const items = useAtomValue(cartAtom);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25 }}>
          {/* cart items, steppers, total */}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

</details>

---

## Phase C — Checkout & Orders (Days 6–8)

### Day 6 · Checkout + COD Order State Machine

**Goal:** A transactional checkout that never oversells stock and freezes order data.

**Key tasks:**

- `/checkout`: RHF + Zod form for shipping address (name, phone, address line, city, pincode). Zod schema shared between client and server.
- COD is the only payment method — no payment gateway, but the order state machine must be explicit: `PENDING → CONFIRMED → SHIPPED → DELIVERED` (and `CANCELLED`, `RETURNED`). COD carries delivery-refusal risk, so model `RETURNED` explicitly.【turn0search24】
- Checkout Server Action (the critical piece):
  1. Re-validate cart server-side (don't trust client cart) — fetch live prices & stock from Prisma.
  2. Wrap in `prisma.$transaction()`: create `Order` + `OrderItem`s (with price/name snapshots) + decrement `ProductVariant.stock` with a `WHERE stock >= quantity` clause to prevent overselling. If any update affects 0 rows, throw and rollback.
  3. Clear the cart atom on success.
  4. `revalidateTag("products")` so stock badges update catalog-wide.
  5. Redirect to `/orders/[id]`.
- Add `shipping` calculation (flat rate or free above threshold).

**Deliverable:** Placing an order atomically creates the order, deducts stock, and redirects to a receipt page. Refreshing the success page doesn't double-create.

<details>
<summary><strong>💳 Module Card — COD Checkout Server Action</strong></summary>

```ts
// src/app/(private)/checkout/actions.ts
"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { z } from "zod";

const CheckoutSchema = z.object({
  name: z.string().min(2),
  phone: z.string().regex(/^[0-9+\-\s]{10,15}$/),
  addressLine: z.string().min(5),
  city: z.string().min(2),
  pincode: z.string().regex(/^[0-9]{6}$/),
});

export async function placeOrder(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login?callbackUrl=/checkout");

  const input = CheckoutSchema.parse(Object.fromEntries(formData));

  // ⚠️ Cart comes from the client — RE-VALIDATE server-side
  const cartJson = formData.get("cart") as string;
  const clientCart = JSON.parse(cartJson) as {
    variantId: string;
    quantity: number;
  }[];

  const order = await prisma.$transaction(async (tx) => {
    // Lock & verify stock for every line item
    const variants = await Promise.all(
      clientCart.map((item) =>
        tx.productVariant.findUniqueOrThrow({
          where: { id: item.variantId },
          include: { product: true },
        }),
      ),
    );

    // Atomic stock decrement — rolls back if any item is oversold
    await Promise.all(
      clientCart.map((item) =>
        tx.productVariant.updateMany({
          where: { id: item.variantId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        }),
      ),
    ).then((results) => {
      if (results.some((r) => r.count === 0)) {
        throw new Error("OUT_OF_STOCK");
      }
    });

    const subtotal = variants.reduce(
      (sum, v, i) =>
        sum +
        Number(v.product.basePrice) +
        Number(v.priceDiff) * clientCart[i].quantity,
      0,
    );

    return tx.order.create({
      data: {
        userId: session.user.id,
        status: "CONFIRMED", // COD: confirmed, awaiting shipment
        paymentMethod: "COD",
        subtotal,
        shipping: subtotal > 5000 ? 0 : 150,
        total: subtotal + (subtotal > 5000 ? 0 : 150),
        items: {
          create: variants.map((v, i) => ({
            productId: v.productId,
            variantId: v.id,
            nameSnapshot: `${v.product.name} ${v.name}`,
            priceSnapshot: Number(v.product.basePrice) + Number(v.priceDiff),
            quantity: clientCart[i].quantity,
          })),
        },
        address: { create: input },
      },
    });
  });

  revalidateTag("products");
  redirect(`/orders/${order.id}`);
}
```

</details>

### Day 7 · Orders (History + Detail)

**Goal:** Customer-facing order visibility with status tracking.

**Key tasks:**

- `/orders`: paginated list of the user's orders (newest first), status badge, total, item count thumbnail.
- `/orders/[id]`: full receipt — items with snapshots, address, totals, status timeline, estimated delivery for COD.
- Add a `statusUpdatedAt` field per status change for a simple timeline.
- Empty states: "You haven't placed any orders yet" with a CTA to browse.
- Re-use `loading.tsx` and `error.tsx` per segment.

**Deliverable:** Customers can review past orders and see their current status.

### Day 8 · Image Upload Pipeline (use-file-picker + sharp + local storage)

**Goal:** A dev-ready upload pipeline that swaps to Backblaze B2 in prod without touching components.

**Key tasks:**

- Build `/api/upload/route.ts` as a **Route Handler** (not a Server Action) — this dodges the `sharp` + Turbopack + Vercel `ERR_DLOPEN_FAILED` crash documented on Day-1 review.【turn0search0】
- Route Handler flow: receive `FormData` → extract `File` → `await file.arrayBuffer()` → `sharp(buffer).resize(1200).webp({ quality: 80 }).toBuffer()` → write to `public/uploads` in dev or upload to B2 in prod.
- Client: `use-file-picker` for selection + drag-drop, show preview, POST to `/api/upload`, receive the final URL, set it in the RHF form.
- Abstract storage behind a `StorageAdapter` interface: `LocalStorageAdapter` (dev) and `B2StorageAdapter` (prod), selected by `NODE_ENV`.
- Validate file type/size server-side (don't trust `use-file-picker`'s client validators).

**Deliverable:** Admin can upload a product image, it's compressed to ~100KB webp, saved locally, and the URL is stored in the product.

<details>
<summary><strong>🖼️ Module Card — Image Upload (sharp Route Handler)</strong></summary>

```ts
// src/app/api/upload/route.ts — Route Handler (NOT a Server Action)
import { NextResponse } from "next/server";
import sharp from "sharp";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  // Server-side validation
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 415 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Too large" }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const processed = await sharp(buffer)
    .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const filename = `${randomUUID()}.webp`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), processed);

  return NextResponse.json({ url: `/uploads/${filename}` });
}
```

```ts
// src/lib/storage/adapter.ts — env-driven swap
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"; // B2 is S3-compatible

export interface StorageAdapter {
  save(buffer: Buffer, filename: string): Promise<string>;
}

class LocalStorage implements StorageAdapter {
  async save(buffer: Buffer, filename: string) {
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), buffer);
    return `/uploads/${filename}`;
  }
}

class B2Storage implements StorageAdapter {
  private s3 = new S3Client({
    endpoint: process.env.B2_ENDPOINT!, // https://s3.us-west-004.backblazeb2.com
    region: process.env.B2_REGION!,
    credentials: {
      accessKeyId: process.env.B2_KEY_ID!,
      secretAccessKey: process.env.B2_APP_KEY!,
    },
  });
  async save(buffer: Buffer, filename: string) {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: process.env.B2_BUCKET!,
        Key: filename,
        Body: buffer,
        ContentType: "image/webp",
      }),
    );
    return `${process.env.B2_PUBLIC_BASE}/${filename}`;
  }
}

export const storage: StorageAdapter =
  process.env.NODE_ENV === "production" ? new B2Storage() : new LocalStorage();
```

</details>

---

## Phase D — Admin Dashboard (Days 9–11)

### Day 9 · Admin Product CRUD (RHF + Zod)

**Goal:** Full product management with variant editing and image upload.

**Key tasks:**

- `/admin/products`: data table (Shadcn `DataTable`) with search, sort, pagination, stock column, edit/delete actions.
- `/admin/products/new` and `/admin/products/[id]/edit`: RHF form with nested `useFieldArray` for variants and images. Zod schema validates name, slug (auto-generated), price, category, variants (unique SKU, non-negative stock).
- Image upload: integrate the Day-8 pipeline — `use-file-picker` + preview + drag-to-reorder.
- Server Actions for create/update/delete, each gated by `requireAdmin()` and calling `revalidateTag("products")` + `revalidatePath("/products/[slug]")`.
- Soft delete (`isActive: false`) instead of hard delete to preserve order history integrity.

**Deliverable:** Admin can create a product with 3 variants and 4 images, and it appears on the storefront instantly.

### Day 10 · Admin Order + Inventory Management

**Goal:** Order fulfillment workflow + stock oversight.

**Key tasks:**

- `/admin/orders`: filterable table by status, date, customer. Bulk status updates.
- `/admin/orders/[id]`: order detail with status timeline, customer info, address, line items. Admin can advance status (`CONFIRMED → SHIPPED → DELIVERED`) or mark `CANCELLED`/`RETURNED`.
- On `CANCELLED`/`RETURNED`: restock the variants in a transaction.
- `/admin/inventory`: low-stock dashboard (variants where `stock < threshold`), quick-edit stock counts.
- Add a simple sales summary card (total orders, revenue this week) to `/admin`.

**Deliverable:** Admin can fulfill orders and spot low-stock SKUs without leaving the dashboard.

### Day 11 · Admin Categories + User Management

**Goal:** Complete the admin surface area using Better Auth's admin plugin.

**Key tasks:**

- `/admin/categories`: tree view (parent/child), CRUD with slug auto-generation. Reordering optional.
- `/admin/users`: leverage `authClient.admin.listUsers()` — built-in search, filter, pagination.【turn1fetch0】
- User actions: `setRole` (promote to admin), `banUser` / `unbanUser`, `removeUser`. Wire these to Shadcn dropdown actions.
- Impersonation: add a "View as user" button using `authClient.admin.impersonateUser()` — useful for debugging customer issues.

**Deliverable:** Admin manages the catalog tree, customer accounts, and roles from one dashboard.

---

## Phase E — Polish & Production (Days 12–14)

### Day 12 · Animations + Loading/Error States + SEO

**Goal:** Portfolio-grade UX polish.

**Key tasks:**

- Motion.dev page transitions: `<motion.div>` wrappers on route segments with `AnimatePresence` for exit animations. Stagger product cards on catalog mount.
- Micro-interactions: button hover springs, cart drawer spring physics, toast slide-ins.
- Add `loading.tsx` skeletons matching real layout shapes (not generic spinners) on every async route.
- Add `error.tsx` boundaries with retry buttons on `(public)` and `(private)` segments.
- SEO: `generateMetadata` on product/category pages, `sitemap.ts`, `robots.ts`, Open Graph images via `next/og`.
- Accessibility pass: keyboard nav, focus traps in modals/drawers, aria labels on icon buttons.

**Deliverable:** The app feels fast, polished, and accessible.

### Day 13 · Backblaze B2 + Postgres Migration + Testing

**Goal:** Production-ready storage and database with a clean migration path.

**Key tasks:**

- Set up Backblaze B2 bucket + CORS rules (required for any direct browser uploads; the Route Handler approach avoids this, but configure it anyway for future presigned-URL uploads).【turn0search18】
- Wire `B2Storage` adapter (from Day 8) with env vars. Test an admin image upload against B2 in a staging deploy.
- **Postgres migration (the careful part):**
  1. Change `provider = "sqlite"` → `"postgresql"` in `schema.prisma`.
  2. Change `DATABASE_PROVIDER` env to `"postgresql"` in your Better Auth `prismaAdapter` config (two changes, not one).【turn1fetch0】
  3. **Delete `prisma/migrations/` and `migration_lock.toml`** — migration SQL is provider-specific and will throw `P3014` otherwise.【turn0search7】
  4. Run `prisma migrate dev --name init` against Postgres, re-seed.
- Write a few critical tests: checkout transaction rollback on oversell, admin guard rejects non-admin, Zod schema rejects bad input.
- Run `bun audit` and address vulnerabilities (especially the `sharp` advisory if Next bundles an old version).【turn0search3】

**Deliverable:** App runs on Postgres + B2 with no code changes beyond env vars.

### Day 14 · README + Deploy + Final Audit

**Goal:** A GitHub repo that gets you interviews.

**Key tasks:**

- Write a killer `README.md`: architecture diagram (Excalidraw → PNG), feature list, tech stack with version pins, local setup steps, env var documentation (`.env.example`), screenshots/GIFs, live demo link.
- Clean commit history: squash WIP commits, use conventional commits (`feat:`, `fix:`, `chore:`, `refactor:`).
- Deploy to Vercel: set all env vars, configure the Postgres connection string, verify `sharp` loads in the Route Handler (the Turbopack issue is Server-Action-specific, so Route Handlers should be safe — verify in deployment logs).【turn0search0】
- Final audit pass: test the full flow as a guest → signup → cart → checkout → order → admin fulfillment. Fix any hydration warnings, console errors, or Lighthouse regressions.
- Add a `LICENSE` and pin versions in `package.json`.

**Deliverable:** Live demo + polished repo ready for your portfolio.

---

## Critical Pitfalls (read before starting)

1. **Never trust client cart data in checkout.** Always re-fetch prices and stock server-side inside the transaction. A manipulated cart payload is the #1 e-commerce bug.
2. **`sharp` must run in a Route Handler, not a Server Action** — the Vercel + Turbopack + Next 16 native-module crash is confirmed and will break production uploads silently.【turn0search0】
3. **Postgres migration requires deleting `migrations/`** — keeping SQLite migration files throws `P3014`. Plan for a clean re-seed, not a data migration (your dev data is disposable).【turn0search7】
4. **`atomWithStorage` without the `typeof window` guard crashes static prerendering** — the Jotai SSR guide is explicit about this.【turn0search10】
5. **`serverActions.bodySizeLimit` goes at the top level in Next.js 16**, not under `experimental` — leaving it in the wrong place silently keeps the 1MB cap.【turn0search10】
6. **`nuqs` requires `<NuqsAdapter>` in the root layout** — omitting it throws at runtime, not build time.【turn0search17】
7. **Order items must snapshot price and name** — referencing live product data on an order receipt means price changes retroactively alter past orders (and break accounting).
8. **COD needs a `RETURNED` status** — delivery refusals are a documented COD failure mode; modeling only happy-path statuses means you can't reconcile returned inventory.【turn0search24】
9. **SQLite rejects `@db.Text` / `@db.Decimal(10, 2)`** — the original module card claimed they're "ignored"; Prisma actually throws P1012 on schema validation. Omit them while on SQLite and re-add them during the Day 13 Postgres migration.

## Daily Routine

Each day, follow this loop: **schema/action → UI component → manual test the happy path → handle the error edge case → commit with a conventional message.** Resist the urge to build features ahead of their day — the sequence is dependency-ordered so each day's deliverable unblocks the next. If you finish a day early, spend the surplus on the polish tasks from Day 12 rather than jumping ahead.
