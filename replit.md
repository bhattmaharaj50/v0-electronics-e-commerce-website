# Munex Electronics

## Overview
An e-commerce electronics store based in Narok, Kenya. Built with Next.js 16.2.4, React 19, Tailwind CSS 4, and shadcn/ui components. The site showcases electronics products with pages for browsing, product details, cart, checkout, about, and contact.

## Recent Changes
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
- **Username**: `admin`
- **Password**: `munex2024`
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
