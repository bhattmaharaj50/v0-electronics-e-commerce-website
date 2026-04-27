# Munex Electronics

## Overview
An e-commerce electronics store based in Narok, Kenya. Built with Next.js 16.2.4, React 19, Tailwind CSS 4, and shadcn/ui components. The site showcases electronics products with pages for browsing, product details, cart, checkout, about, and contact.

## Recent Changes
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
- **Default password**: `munex2024` (override at first DB init via the `SEED_ADMIN_PASSWORD` env var; the seeded account is forced to choose a new password on first login)
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
- Deploy: Server-rendered Next.js app so backend API routes remain available

## Categories
Default categories live in `lib/products.ts` and are seeded on every boot via `ensureDatabase()` (uses `ON CONFLICT DO NOTHING`, so admin renames are preserved). Current defaults: tvs, soundbars, fridges, washing-machines, cookers, chargers-accessories, phones, tablets, headphones, water-dispensers, iron-boxes, microwaves, ovens, airfryers.

## Product filters
Products are filtered on `/products` by category, brand, size/specs, color, and price range. The `color` field is a `TEXT` column on `products` (added via `ALTER TABLE … ADD COLUMN IF NOT EXISTS color`) and is editable in the admin product form. The "Size / Specs" label adapts per category (Specs/Storage for phones/tablets, Screen Size for TVs, Capacity for fridges/water dispensers).
