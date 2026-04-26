"use client"

import Link from "next/link"
import { useState } from "react"
import { ShoppingCart, Search, Menu, X, Zap, Lock, ChevronDown, LayoutGrid } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { useProductStore } from "@/lib/product-store"
import { useRouter } from "next/navigation"

export function Navbar() {
  const { totalItems } = useCart()
  const { settings, categories } = useProductStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false)
  const [desktopCategoriesOpen, setDesktopCategoriesOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery("")
      setMobileMenuOpen(false)
    }
  }

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ]

  const logoText = settings.logoText || "Munex Electronics"
  const logoUrl = settings.logoUrl || ""
  const visibleCategories = (categories || []).slice(0, 12)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          {logoUrl ? (
            <img src={logoUrl} alt={logoText} className="h-9 w-auto rounded-lg object-contain" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
          <span className="text-lg font-bold tracking-tight text-foreground">{logoText}</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}

          {/* Categories dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setDesktopCategoriesOpen(true)}
            onMouseLeave={() => setDesktopCategoriesOpen(false)}
          >
            <button
              type="button"
              onClick={() => setDesktopCategoriesOpen((v) => !v)}
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              aria-haspopup="true"
              aria-expanded={desktopCategoriesOpen}
            >
              <LayoutGrid className="h-4 w-4" />
              Categories
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${desktopCategoriesOpen ? "rotate-180" : ""}`} />
            </button>
            {desktopCategoriesOpen && visibleCategories.length > 0 && (
              <div className="absolute left-1/2 top-full z-50 mt-2 w-[480px] -translate-x-1/2 rounded-xl border border-border bg-card p-3 shadow-lg">
                <div className="grid grid-cols-2 gap-1">
                  {visibleCategories.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/products?category=${cat.slug}`}
                      onClick={() => setDesktopCategoriesOpen(false)}
                      className="rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
                <Link
                  href="/products"
                  onClick={() => setDesktopCategoriesOpen(false)}
                  className="mt-2 block rounded-lg border border-border px-3 py-2 text-center text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  Browse all products →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Search + Cart */}
        <div className="hidden items-center gap-3 md:flex">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-56 rounded-lg border border-border bg-secondary pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </form>
          <Link
            href="/cart"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-secondary"
          >
            <ShoppingCart className="h-5 w-5 text-foreground" />
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {totalItems}
              </span>
            )}
            <span className="sr-only">Shopping cart</span>
          </Link>
          <Link
            href="/admin"
            className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            title="Admin Portal"
          >
            <Lock className="h-3.5 w-3.5" />
            Admin
          </Link>
        </div>

        {/* Mobile: Cart + Hamburger */}
        <div className="flex items-center gap-3 md:hidden">
          <Link href="/cart" className="relative flex h-9 w-9 items-center justify-center">
            <ShoppingCart className="h-5 w-5 text-foreground" />
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {totalItems}
              </span>
            )}
            <span className="sr-only">Shopping cart</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 text-foreground" />
            ) : (
              <Menu className="h-5 w-5 text-foreground" />
            )}
          </button>
        </div>
      </nav>

      {/* Desktop categories quick bar (always visible under main nav) */}
      <div className="hidden border-t border-border bg-secondary/40 md:block">
        <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2 lg:px-8">
          <span className="flex flex-shrink-0 items-center gap-1 pr-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <LayoutGrid className="h-3.5 w-3.5" />
            Shop:
          </span>
          {visibleCategories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/products?category=${cat.slug}`}
              className="flex-shrink-0 whitespace-nowrap rounded-full border border-transparent px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:bg-background hover:text-foreground"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-background px-4 pb-4 md:hidden">
          <form onSubmit={handleSearch} className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-secondary pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </form>
          <div className="mt-3 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}

            {/* Mobile categories accordion */}
            <button
              type="button"
              onClick={() => setMobileCategoriesOpen((v) => !v)}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-expanded={mobileCategoriesOpen}
            >
              <span className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                Categories
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${mobileCategoriesOpen ? "rotate-180" : ""}`} />
            </button>
            {mobileCategoriesOpen && (
              <div className="ml-2 grid grid-cols-2 gap-1 rounded-lg border border-border bg-secondary/40 p-2">
                {visibleCategories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/products?category=${cat.slug}`}
                    onClick={() => { setMobileMenuOpen(false); setMobileCategoriesOpen(false) }}
                    className="rounded-md px-2 py-2 text-xs font-medium text-foreground transition-colors hover:bg-background"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}

            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-1 flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Lock className="h-4 w-4" />
              Admin Portal
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
