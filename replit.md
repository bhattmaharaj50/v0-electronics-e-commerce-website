# 25Flow Electronics

## Overview
An e-commerce electronics store website built with Next.js 16, React 19, Tailwind CSS 4, and shadcn/ui components. The site showcases electronics products with pages for browsing, product details, cart, checkout, about, and contact.

## Recent Changes
- 2026-02-20: Initial Replit setup — configured Next.js dev server on port 5000, allowed dev origins for proxy, set up static deployment.

## Project Architecture
- **Framework**: Next.js 16 (App Router) with static export (`output: 'export'`)
- **UI**: Tailwind CSS 4, shadcn/ui component library, Lucide icons
- **Language**: TypeScript
- **Structure**:
  - `app/` — Next.js App Router pages (home, products, cart, checkout, about, contact)
  - `components/` — Reusable React components (navbar, footer, product cards, home sections)
  - `components/ui/` — shadcn/ui primitives
  - `lib/` — Utility functions and data
  - `public/` — Static assets

## Development
- Run: `npx next dev -H 0.0.0.0 -p 5000`
- Build: `npm run build` (outputs to `out/` directory)
- Deploy: Static site from `out/` directory
