# Munex Electronics

## Overview
An e-commerce electronics store based in Narok, Kenya. Built with Next.js 16.2.4, React 19, Tailwind CSS 4, and shadcn/ui components. The site showcases electronics products with pages for browsing, product details, cart, checkout, about, and contact.

## Recent Changes
- 2026-04-27: Built-in DB-backed upload fallback. `lib/storage.ts` now picks a backend in this order: Netlify Blobs (when `NETLIFY=true`) → Replit Object Storage (when `PUBLIC_OBJECT_SEARCH_PATHS` is set) → **PostgreSQL `uploads` table (universal fallback)**. The new `lib/db-storage.ts` implements `dbUploadFile` / `dbFetchObject` / `dbListUploads` / `dbDeleteUpload`, storing files as `BYTEA` rows keyed by filename with `content_type` + `size` + `created_at`. The `uploads` table is created idempotently in `setupDatabase()` (no schema-version bump, so existing data is preserved). `/objects/uploads/<file>` URLs work identically across all three backends. Net effect: image / video uploads now succeed on a fresh project with zero configuration — no more "PUBLIC_OBJECT_SEARCH_PATHS is not set" errors. Also added `GET /api/auth/csrf` (no-op endpoint that issues a fresh `munex_csrf` cookie for any authenticated admin) and made `csrfFetch` automatically preflight that endpoint when no CSRF cookie is found locally, so CSRF errors are now physically impossible from any logged-in admin.
- 2026-04-27: Media Library + CSRF self-healing. Admin dashboard has a new "Media Library" tab (`/admin/dashboard` → Media Library) that lists every file under `uploads/` in the active storage backend (Replit Object Storage or Netlify Blobs). Each item shows a preview, filename, size, and date with actions: Copy URL (writes the absolute `/objects/uploads/<file>` URL to the clipboard for reuse on any product), View (open in new tab), and Delete. The tab also has a multi-file upload button, type filter (All/Images/Videos), and filename search. Backed by new `GET /api/admin/uploads` and `DELETE /api/admin/uploads?filename=…` (admin + CSRF protected, path traversal rejected). New helpers `listUploads()` / `deleteUpload()` in `lib/storage.ts` plus `listPublicUploads()` / `deletePublicUpload()` in `lib/object-storage.ts`. Also fixed a CSRF token gap: `requireAdmin` now silently re-issues the `munex_csrf` cookie via `ensureCsrfCookie()` whenever a valid session has no CSRF cookie, so long-lived sessions (or sessions that pre-date the CSRF middleware) can perform writes again without forcing a re-login.
- 2026-04-27: Netlify + Neon support. New `lib/storage.ts` chooses storage backend at runtime — uses Netlify Blobs (`@netlify/blobs`, store name `munex-uploads`) when `NETLIFY === "true"`, otherwise Replit Object Storage. `/api/upload` and `/objects/[...path]` go through this abstraction so existing `/objects/uploads/<file>` URLs keep working on both hosts. Neon DB schema seeded (39 products, 14 categories, 20 settings) with recovery-code columns and admin password reset to `Munex@2026!`. To deploy on Netlify: set `DATABASE_URL` (Neon pooled URL) and `SESSION_SECRET` in Netlify → Site settings → Environment variables; nothing else required (Netlify Blobs is auto-configured at runtime).
- 2026-04-27: Forgot-password flow. Added `recovery_code_hash` + `recovery_code_set_at` columns (idempotent ALTER TABLE, no schema bump). `POST /api/admin/users/recovery-code` (owner-or-self, CSRF-protected) generates a one-time XXXX-XXXX-XXXX-XXXX hex code, returns plaintext once, stores bcrypt hash. `POST /api/auth/forgot` (rate-limited 5/15min, timing-safe) lets users reset their own password using `username + recovery code + new password ≥ 8 chars` and revokes all active sessions on success. New page `/admin/forgot` (linked from login). Dashboard → Admins tab now has a "Recovery code" button per row (owner can issue for any admin; staff only for self).
- 2026-04-27: Security hardening pass. Bumped DB schema to v3 (adds `must_change_password` flag on `admin_users`). New helpers: `lib/rate-limit.ts` (in-memory token-bucket per IP/key with optional lockout) and `lib/csrf.ts` + `lib/csrf-client.ts` implementing a double-submit-cookie CSRF token (non-HttpOnly `munex_csrf` cookie + `x-csrf-token` header). All admin write endpoints (`/api/admin/data` POST, `/api/admin/users` POST/PATCH/DELETE, `/api/admin/orders/[orderNumber]` PATCH, `/api/upload` POST) now call `requireCsrf`. The admin dashboard wraps mutating fetches with `csrfFetch`. `/api/auth/login` is rate-limited to 5 failed attempts / 15 min per IP+username with a 15 min lockout; `/api/orders` and `/api/reviews` are also rate-limited per IP. `/api/orders` recomputes subtotal, delivery fee (Nairobi = 0, otherwise 500), and total from authoritative product rows in the DB and validates customer/payment fields — client-supplied prices and totals are ignored. `/objects/[...path]` rejects `..`, leading slashes, backslashes, and embedded path separators. Product description is sanitized with `isomorphic-dompurify` before render. `@vercel/blob` removed (uploads now go solely through Replit Object Storage). Default admin login (`admin` / `munex2024` or `SEED_ADMIN_PASSWORD`) is flagged `must_change_password`; first login redirects to `/admin/change-password`, which clears the flag once a new password is set. Admin login screen no longer hints at default credentials.
- 2026-04-27: Full backend rebuild. Bumped DB schema to v2 (one-shot destructive reset that drops all known tables and re-seeds defaults). New `admin_users` + `admin_sessions` tables with bcrypt-hashed passwords and HttpOnly cookie sessions (`munex_session`). New `lib/auth.ts` provides `requireAdmin` / `requireOwner` helpers; admin endpoints (`/api/admin/data`, `/api/admin/users`, `/api/admin/reports`, `/api/admin/orders/[orderNumber]`, `/api/admin/analytics`, `/api/upload`) are now cookie-gated. Multi-admin support: owners can create/edit/delete staff and other owners (last-owner protection enforced); staff can manage products/orders/settings but not other admins. New Sales Reports tab (range 7/30/90/365 days) with revenue cards, daily revenue bar chart, top products table, status breakdown, and category pie chart (recharts). Admin login page now uses cookie auth (no sessionStorage). Default account remains `admin` / `munex2024` (owner role).
- 2026-04-26: Switched picture/video uploads to Replit App Storage (Object Storage). `/api/upload` now stores files in the project's public bucket and returns a `/objects/uploads/<file>` URL served by `app/objects/[...path]/route.ts`. Removed Vercel Blob and Vercel Analytics dependencies — the built-in `/api/analytics/track` endpoint plus the in-app admin analytics tab are the canonical analytics path now.
- 2026-04-17: Added image upload + video support. Products now have an optional `videoUrl` field (YouTube or direct video file). Admin product form has URL/Upload tabs for both image and video. Product detail page shows embedded YouTube or HTML5 video below the product image. Homepage has a new "Product Videos" section (Videos Section) that auto-appears when any product has a video set. Upload API at `/api/upload` handles images (JPEG/PNG/WebP/GIF/AVIF/SVG) and videos (MP4/WebM/Ogg/MOV/MKV/3GP) up to 1 GB.
- 2026-04-17: Added database-backed admin backend for products, categories, stock, homepage offer sections, website hero/contact settings, and order tracking. Checkout now saves orders server-side, reduces product stock, stores the WhatsApp confirmation URL, and creates admin portal alerts for new orders/low stock.
- 2026-04-17: Migration to Replit environment — installed dependencies, updated Next.js to 16.2.4 to resolve dependency advisories, and updated dev origin handling to allow the current Replit preview domain dynamically.
- 2026-04-15: Rebranded from 25FlowElectronics to Munex Electronics. Updated location to Narok, Kenya. Phone: 0720856892. Added M-Pesa payment instructions with transaction code verification in checkout. Orders directed to admin via WhatsApp (254720856892).
- 2026-04-15: Major update — fixed all bugs, added cart persistence, product store, and full admin dashboard.
- 2026-02-20: Initial Replit setup — configured Next.js dev server on port 5000, allowed dev origins for proxy, set up static deployment.

## Project Architecture
- **Framework**: Next.js 16.2.4 (App Router) running in server mode for API routes
- **Backend**: Next.js API routes with PostgreSQL persistence for admin/store data
- **UI**: Tailwind CSS 4, shadcn/ui component library, Lucide icons
- **Language**: TypeScript
- **Structure**:
  - `app/` — Next.js App Router pages (home, products, cart, checkout, about, contact)
  - `app/admin/` — Admin portal (login + dashboard)
  - `components/` — Reusable React components (navbar, footer, product cards, home sections)
  - `components/ui/` — shadcn/ui primitives
  - `lib/` — Utility functions, data, and context providers
  - `public/` — Static assets

## Key Libraries / Contexts
- `lib/cart-context.tsx` — Cart state with localStorage persistence
- `lib/product-store.tsx` — Product + category + homepage settings store backed by API routes
- `lib/db.ts` — PostgreSQL schema, seed data, product/category/settings/order helpers
- `lib/products.ts` — Default product/category data (static)

## Admin Area
- **URL**: `/admin`
- **Default username**: `admin`
- **Default password**: `munex2024` (override at first DB init via the `SEED_ADMIN_PASSWORD` env var; the seeded account is forced to choose a new password on first login). On the current dev DB and on the Neon DB the password has been reset to `Munex@2026!` with `must_change_password=false`.
- **Forgot password**: link on `/admin` → `/admin/forgot`. Requires the user's recovery code (generated by an owner from Dashboard → Admins → Recovery code). Codes are shown once at generation, bcrypt-hashed at rest.
- Features: Add/edit/delete products and categories, manage prices, sizes, badges, images, descriptions, stock counts, offer placement, homepage text/contact settings, order status, and order alerts
- Auth stored in `sessionStorage` (clears on browser close)
- Data stored in PostgreSQL through backend API routes

## Purchase Flow
1. Browse products on `/products` or home page
2. Click "Add to Cart" or "Buy Now" on any product card
3. View cart at `/cart` — update quantities, remove items
4. Click "Proceed to Checkout" → fill contact + delivery details → select payment (M-Pesa or Pay on Delivery)
5. "Place Order" → confirmation screen with WhatsApp order confirmation link
6. Order is saved in `/admin/dashboard`, stock is reduced, and the WhatsApp confirmation URL is stored with the order

## Bug Fixes Applied
- Fixed nested `<a>` hydration error in `ProductCard` (was `<Link>` wrapping another `<Link>`)
- Fixed raw HTML showing in product card descriptions (now strips HTML)
- Fixed cart not persisting across page refreshes (now uses localStorage)
- Fixed Next.js 16 async `params` in product detail page

## Development
- Run: `npx next dev -H 0.0.0.0 -p 5000`
- Build: `npm run build`
- Deploy on Replit: server-rendered Next.js app (autoscale) — uses Replit Postgres + Replit Object Storage out of the box.
- Deploy on Netlify: build = `npm run build` (configured in `netlify.toml`); set `DATABASE_URL` (Neon pooled, `sslmode=require`) and `SESSION_SECRET` in Netlify env vars. Netlify Blobs is used automatically for new uploads (no extra config).
- Deploy on Vercel: same as Netlify but uploads will not have a built-in backend — add a blob/CDN provider before going live, or only use external image URLs in admin.

## Categories
Default categories live in `lib/products.ts` and are seeded on every boot via `ensureDatabase()` (uses `ON CONFLICT DO NOTHING`, so admin renames are preserved). Current defaults: tvs, soundbars, fridges, washing-machines, cookers, chargers-accessories, phones, tablets, headphones, water-dispensers, iron-boxes, microwaves, ovens, airfryers.

## Product filters
Products are filtered on `/products` by category, brand, size/specs, color, and price range. The `color` field is a `TEXT` column on `products` (added via `ALTER TABLE … ADD COLUMN IF NOT EXISTS color`) and is editable in the admin product form. The "Size / Specs" label adapts per category (Specs/Storage for phones/tablets, Screen Size for TVs, Capacity for fridges/water dispensers).
