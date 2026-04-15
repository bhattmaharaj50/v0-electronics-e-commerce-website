# 25Flow Electronics

## Overview
An e-commerce electronics store website built with Next.js 16, React 19, Tailwind CSS 4, and shadcn/ui components. The site showcases electronics products with pages for browsing, product details, cart, checkout, about, and contact.

## Recent Changes
- 2026-04-15: Major update — fixed all bugs, added cart persistence, product store, and full admin dashboard.
- 2026-02-20: Initial Replit setup — configured Next.js dev server on port 5000, allowed dev origins for proxy, set up static deployment.

## Project Architecture
- **Framework**: Next.js 16 (App Router) with static export (`output: 'export'`)
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
- `lib/product-store.tsx` — Product + category store with localStorage persistence (admin edits persist)
- `lib/products.ts` — Default product/category data (static)

## Admin Area
- **URL**: `/admin`
- **Username**: `admin`
- **Password**: `25flow2024`
- Features: Add/edit/delete products and categories, manage prices, sizes, badges, images, descriptions
- Auth stored in `sessionStorage` (clears on browser close)
- Data stored in `localStorage` under keys `25flow_products` and `25flow_categories`

## Purchase Flow
1. Browse products on `/products` or home page
2. Click "Add to Cart" or "Buy Now" on any product card
3. View cart at `/cart` — update quantities, remove items
4. Click "Proceed to Checkout" → fill contact + delivery details → select payment (M-Pesa or Pay on Delivery)
5. "Place Order" → confirmation screen with WhatsApp order confirmation link

## Bug Fixes Applied
- Fixed nested `<a>` hydration error in `ProductCard` (was `<Link>` wrapping another `<Link>`)
- Fixed raw HTML showing in product card descriptions (now strips HTML)
- Fixed cart not persisting across page refreshes (now uses localStorage)
- Fixed Next.js 16 async `params` in product detail page

## Development
- Run: `npx next dev -H 0.0.0.0 -p 5000`
- Build: `npm run build` (outputs to `out/` directory)
- Deploy: Static site from `out/` directory
