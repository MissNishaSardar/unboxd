# Route File Structure — `src/app/`

> Package manager: **Bun**  
> Auth: **Better Auth** (`api/auth/[...all]`)  
> ORM: **Prisma**

---

## Directory Tree

```
src/app/
├── layout.tsx
├── loading.tsx
├── error.tsx
├── not-found.tsx
├── globals.css
│
├── (public)/
│   ├── layout.tsx
│   ├── page.tsx              →  /  # Homepage
│   ├── auth/
│       ├── login/
│       │   └── page.tsx    # Login form
│       └── register/
│           └── page.tsx    # Registration form
│   ├── products/
│   │   ├── page.tsx          →  /products
│   │   └── [slug]/
│   │       └── page.tsx      →  /products/:slug
│   ├── categories/
│   │   └── [slug]/
│   │       └── page.tsx      →  /categories/:slug
│   ├── search/
│   │   └── page.tsx          →  /search
│   ├── about/
│   │   └── page.tsx          →  /about
│   └── contact/
│       └── page.tsx          →  /contact
│
├── (private)/              # Route Group — Authenticated Area
│   ├── layout.tsx              # Dashboard shell (sidebar, auth gate)
│   ├── dashboard/
│   │   └── page.tsx          →  /dashboard  # User dashboard overview
│   ├── cart/
│   │   └── page.tsx          →  /cart
│   ├── checkout/
│   │   └── page.tsx          →  /checkout
│   ├── orders/
│   │   ├── page.tsx          →  /orders
│   │   └── [id]/
│   │       └── page.tsx      →  /orders/:id
│   ├── wishlist/
│   │   └── page.tsx          →  /wishlist
│   ├── settings/
│   │   └── page.tsx          →  /settings
│   └── profile/
│       └── page.tsx          →  /profile
│
└── api/
    └── auth/
        └── [...all]/
            └── route.ts      →  /api/auth/*  (Better Auth catch-all)
```

---

## Route Meanings

### Root Layout & Global Files

| File            | Purpose                                                                 |
| --------------- | ----------------------------------------------------------------------- |
| `layout.tsx`    | Root layout — wraps **all** routes. Shared HTML shell, fonts, metadata. |
| `loading.tsx`   | Global loading UI — shown while any child segment is loading.           |
| `error.tsx`     | Global error boundary — catches errors in any child segment.            |
| `not-found.tsx` | Global 404 page — rendered when `notFound()` is called.                 |
| `globals.css`   | Global styles, Tailwind directives, CSS variables.                      |

---

### `(public)` — Unauthenticated Route Group

> The `(public)` group name is **omitted from the URL**.  
> All pages inside are accessible without signing in.

| Route               | File                                                                        | Meaning                                           |
| ------------------- | --------------------------------------------------------------------------- | ------------------------------------------------- |
| `/` (`page.tsx`)    | Homepage. Static marketing content + featured products fetched server-side. |
| `/register`         | `(public)/register/page.tsx`                                                | Sign-up / registration page.                      |
| `/products`         | `(public)/products/page.tsx`                                                | Product listing / catalog page.                   |
| `/products/:slug`   | `(public)/products/[slug]/page.tsx`                                         | Individual product detail page (dynamic segment). |
| `/categories/:slug` | `(public)/categories/[slug]/page.tsx`                                       | Category filter page (dynamic segment).           |
| `/search`           | `(public)/search/page.tsx`                                                  | Search results page.                              |
| `/about`            | `(public)/about/page.tsx`                                                   | About / marketing page.                           |
| `/contact`          | `(public)/contact/page.tsx`                                                 | Contact page.                                     |

**`(public)/layout.tsx`** — Public layout (minimal header, no cart drawer, centered auth forms).

---

### `(private)` — Authenticated Route Group

> The `(private)` group name is **omitted from the URL**.  
> Protected by `src/proxy.ts` (Next.js 16+) — redirects unauthenticated users to `/`.

| Route         | File                             | Meaning                                          |
| ------------- | -------------------------------- | ------------------------------------------------ |
| `/dashboard`  | `(private)/dashboard/page.tsx`   | User dashboard / account overview.               |
| `/cart`       | `(private)/cart/page.tsx`        | Shopping cart review page.                       |
| `/checkout`   | `(private)/checkout/page.tsx`    | Checkout & payment flow.                         |
| `/orders`     | `(private)/orders/page.tsx`      | Order history list.                              |
| `/orders/:id` | `(private)/orders/[id]/page.tsx` | Single order detail / receipt (dynamic segment). |
| `/wishlist`   | `(private)/wishlist/page.tsx`    | Saved / favorite products.                       |
| `/settings`   | `(private)/settings/page.tsx`    | Account settings (email, password, preferences). |
| `/profile`    | `(private)/profile/page.tsx`     | Public profile / personal info.                  |

**`(private)/layout.tsx`** — Private layout (sidebar navigation, cart provider, user menu).

---

### `api` — API Routes

| Route         | File                         | Meaning                                                                                                                               |
| ------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/auth/*` | `api/auth/[...all]/route.ts` | **Better Auth catch-all handler**. Handles sign-in, sign-up, session, callbacks, and all auth endpoints. Must use `[...all]` segment. |

---

## Conventions Used

| Convention                                | Description                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Route Groups** `(public)` / `(private)` | Organize routes under shared layouts without affecting the URL path.                                   |
| **Dynamic Segments** `[slug]`, `[id]`     | Match any value in that URL position. Passed as `params` to the page component.                        |
| **Catch-All** `[...all]`                  | Matches **all** sub-paths under `/api/auth/`. Required by Better Auth.                                 |
| **Co-location**                           | Files without `page.tsx` or `route.ts` are **not routable** — safe for helper files inside any folder. |
| **`page.tsx`**                            | Exposes a route to the browser.                                                                        |
| **`layout.tsx`**                          | Shared UI wrapper for a segment and all its children.                                                  |
| **`loading.tsx`**                         | Suspense fallback shown while data is fetching.                                                        |
| **`error.tsx`**                           | Error boundary for catching runtime errors.                                                            |
| **`not-found.tsx`**                       | UI shown when `notFound()` is triggered or a route doesn't exist.                                      |
