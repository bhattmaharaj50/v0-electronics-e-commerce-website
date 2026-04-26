"use client"

import { useState, useMemo, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useProductStore } from "@/lib/product-store"
import { ProductCard } from "@/components/product-card"
import { SlidersHorizontal, X } from "lucide-react"
import { formatPrice } from "@/lib/products"

type StoreProduct = ReturnType<typeof useProductStore>["products"][number]

function getBrandsByCategory(products: StoreProduct[], category: string): string[] {
  const filtered = category ? products.filter((p) => p.category === category) : products
  return [...new Set(filtered.map((p) => p.brand).filter(Boolean))].sort()
}

function getSizesByCategory(products: StoreProduct[], category: string): string[] {
  const filtered = category ? products.filter((p) => p.category === category) : products
  return [...new Set(filtered.map((p) => p.size).filter(Boolean) as string[])].sort()
}

function getColorsByCategory(products: StoreProduct[], category: string): string[] {
  const filtered = category ? products.filter((p) => p.category === category) : products
  return [...new Set(filtered.map((p) => p.color).filter(Boolean) as string[])].sort()
}

function getPriceRange(products: StoreProduct[], category: string): { min: number; max: number } {
  const filtered = category ? products.filter((p) => p.category === category) : products
  if (filtered.length === 0) return { min: 0, max: 0 }
  const prices = filtered.map((p) => p.price)
  return { min: Math.min(...prices), max: Math.max(...prices) }
}

export function ProductsContent() {
  const { products, categories } = useProductStore()
  const searchParams = useSearchParams()
  const urlCategory = searchParams.get("category") || ""
  const searchQuery = searchParams.get("search") || ""
  const showDeals = searchParams.get("deals") === "true"

  const [selectedCategory, setSelectedCategory] = useState(urlCategory)
  const [selectedBrand, setSelectedBrand] = useState("")
  const [selectedSize, setSelectedSize] = useState("")
  const [selectedColor, setSelectedColor] = useState("")
  const [minPrice, setMinPrice] = useState<string>("")
  const [maxPrice, setMaxPrice] = useState<string>("")
  const [sortBy, setSortBy] = useState("default")
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Keep the selected category in sync with the URL so clicking a category link
  // from the navbar / quick-bar while already on /products updates the view.
  // Also clears dependent filters that may not be valid for the new category.
  useEffect(() => {
    setSelectedCategory(urlCategory)
    setSelectedBrand("")
    setSelectedSize("")
    setSelectedColor("")
    setFiltersOpen(false)
  }, [urlCategory])

  const availableBrands = useMemo(
    () => getBrandsByCategory(products, selectedCategory),
    [products, selectedCategory]
  )
  const availableSizes = useMemo(
    () => getSizesByCategory(products, selectedCategory),
    [products, selectedCategory]
  )
  const availableColors = useMemo(
    () => getColorsByCategory(products, selectedCategory),
    [products, selectedCategory]
  )
  const priceBounds = useMemo(
    () => getPriceRange(products, selectedCategory),
    [products, selectedCategory]
  )

  // Reset price range whenever the category changes (so old bounds don't filter the new category to nothing)
  useEffect(() => {
    setMinPrice("")
    setMaxPrice("")
  }, [selectedCategory])

  // Spec/storage label is more meaningful for some categories
  const sizeLabel = useMemo(() => {
    if (selectedCategory === "phones" || selectedCategory === "tablets") return "Specs / Storage"
    if (selectedCategory === "tvs") return "Screen Size"
    if (selectedCategory === "fridges" || selectedCategory === "water-dispensers") return "Capacity"
    return "Size / Storage"
  }, [selectedCategory])

  const filteredProducts = useMemo(() => {
    let result = [...products]

    if (selectedCategory) {
      result = result.filter((p) => p.category === selectedCategory)
    }

    if (selectedBrand) {
      result = result.filter((p) => p.brand === selectedBrand)
    }

    if (selectedSize) {
      result = result.filter((p) => p.size === selectedSize)
    }

    if (selectedColor) {
      result = result.filter((p) => p.color === selectedColor)
    }

    const minP = minPrice === "" ? null : Number(minPrice)
    const maxP = maxPrice === "" ? null : Number(maxPrice)
    if (minP !== null && !Number.isNaN(minP)) {
      result = result.filter((p) => p.price >= minP)
    }
    if (maxP !== null && !Number.isNaN(maxP)) {
      result = result.filter((p) => p.price <= maxP)
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          (p.color || "").toLowerCase().includes(q)
      )
    }

    if (showDeals) {
      result = result.filter((p) => p.originalPrice)
    }

    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => a.price - b.price)
        break
      case "price-high":
        result.sort((a, b) => b.price - a.price)
        break
      case "rating":
        result.sort((a, b) => b.rating - a.rating)
        break
    }

    return result
  }, [
    products,
    selectedCategory,
    selectedBrand,
    selectedSize,
    selectedColor,
    minPrice,
    maxPrice,
    searchQuery,
    showDeals,
    sortBy,
  ])

  const clearAllFilters = () => {
    setSelectedCategory("")
    setSelectedBrand("")
    setSelectedSize("")
    setSelectedColor("")
    setMinPrice("")
    setMaxPrice("")
    setSortBy("default")
  }

  const priceFilterActive = minPrice !== "" || maxPrice !== ""
  const activeFilterCount =
    [selectedCategory, selectedBrand, selectedSize, selectedColor].filter(Boolean).length +
    (priceFilterActive ? 1 : 0)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {searchQuery
            ? `Results for "${searchQuery}"`
            : showDeals
              ? "Deals & Offers"
              : "All Products"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""} found
        </p>
      </div>

      <div className="flex gap-8">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-20 flex flex-col gap-6">
            {/* Categories */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Categories
              </h3>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => {
                    setSelectedCategory("")
                    setSelectedBrand("")
                    setSelectedSize("")
                    setSelectedColor("")
                  }}
                  className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                    !selectedCategory
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => {
                      setSelectedCategory(cat.slug)
                      setSelectedBrand("")
                      setSelectedSize("")
                      setSelectedColor("")
                    }}
                    className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                      selectedCategory === cat.slug
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Brands */}
            {availableBrands.length > 0 && (
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Brands
                </h3>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => setSelectedBrand("")}
                    className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                      !selectedBrand
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    All Brands
                  </button>
                  {availableBrands.map((brand) => (
                    <button
                      key={brand}
                      onClick={() => setSelectedBrand(brand)}
                      className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                        selectedBrand === brand
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes / Specs */}
            {availableSizes.length > 0 && (
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {sizeLabel}
                </h3>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => setSelectedSize("")}
                    className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                      !selectedSize
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    All
                  </button>
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                        selectedSize === size
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Colors */}
            {availableColors.length > 0 && (
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Color
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedColor("")}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      !selectedColor
                        ? "bg-primary text-primary-foreground"
                        : "border border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    All
                  </button>
                  {availableColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        selectedColor === color
                          ? "bg-primary text-primary-foreground"
                          : "border border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price */}
            {priceBounds.max > 0 && (
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Price (KES)
                </h3>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder={String(priceBounds.min)}
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="h-9 w-full rounded-lg border border-border bg-secondary px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <span className="text-xs text-muted-foreground">to</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder={String(priceBounds.max)}
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="h-9 w-full rounded-lg border border-border bg-secondary px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {formatPrice(priceBounds.min)} – {formatPrice(priceBounds.max)}
                  </p>
                </div>
              </div>
            )}

            {/* Clear All */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </aside>

        <div className="flex-1">
          {/* Toolbar */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="relative flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Active filter pills */}
            {selectedCategory && (
              <button
                onClick={() => {
                  setSelectedCategory("")
                  setSelectedBrand("")
                  setSelectedSize("")
                  setSelectedColor("")
                }}
                className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-foreground"
              >
                {categories.find((c) => c.slug === selectedCategory)?.name}
                <X className="h-3 w-3" />
              </button>
            )}
            {selectedBrand && (
              <button
                onClick={() => setSelectedBrand("")}
                className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-foreground"
              >
                {selectedBrand}
                <X className="h-3 w-3" />
              </button>
            )}
            {selectedSize && (
              <button
                onClick={() => setSelectedSize("")}
                className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-foreground"
              >
                {selectedSize}
                <X className="h-3 w-3" />
              </button>
            )}
            {selectedColor && (
              <button
                onClick={() => setSelectedColor("")}
                className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-foreground"
              >
                {selectedColor}
                <X className="h-3 w-3" />
              </button>
            )}
            {priceFilterActive && (
              <button
                onClick={() => {
                  setMinPrice("")
                  setMaxPrice("")
                }}
                className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-foreground"
              >
                {minPrice ? `≥${Number(minPrice).toLocaleString()}` : ""}
                {minPrice && maxPrice ? " " : ""}
                {maxPrice ? `≤${Number(maxPrice).toLocaleString()}` : ""}
                <X className="h-3 w-3" />
              </button>
            )}

            <div className="ml-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-9 rounded-lg border border-border bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="default">Default</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>

          {/* Mobile Filters Panel */}
          {filtersOpen && (
            <div className="mb-6 rounded-xl border border-border bg-card p-4 lg:hidden">
              {/* Mobile Categories */}
              <div className="mb-4">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Categories
                </h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setSelectedCategory("")
                      setSelectedBrand("")
                      setSelectedSize("")
                      setSelectedColor("")
                    }}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      !selectedCategory
                        ? "bg-primary text-primary-foreground"
                        : "border border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.slug}
                      onClick={() => {
                        setSelectedCategory(cat.slug)
                        setSelectedBrand("")
                        setSelectedSize("")
                        setSelectedColor("")
                      }}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        selectedCategory === cat.slug
                          ? "bg-primary text-primary-foreground"
                          : "border border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Brands */}
              {availableBrands.length > 0 && (
                <div className="mb-4">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Brands
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedBrand("")}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        !selectedBrand
                          ? "bg-primary text-primary-foreground"
                          : "border border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      All
                    </button>
                    {availableBrands.map((brand) => (
                      <button
                        key={brand}
                        onClick={() => setSelectedBrand(brand)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                          selectedBrand === brand
                            ? "bg-primary text-primary-foreground"
                            : "border border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile Sizes / Specs */}
              {availableSizes.length > 0 && (
                <div className="mb-4">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {sizeLabel}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedSize("")}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        !selectedSize
                          ? "bg-primary text-primary-foreground"
                          : "border border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      All
                    </button>
                    {availableSizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                          selectedSize === size
                            ? "bg-primary text-primary-foreground"
                            : "border border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile Colors */}
              {availableColors.length > 0 && (
                <div className="mb-4">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Color
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedColor("")}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        !selectedColor
                          ? "bg-primary text-primary-foreground"
                          : "border border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      All
                    </button>
                    {availableColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                          selectedColor === color
                            ? "bg-primary text-primary-foreground"
                            : "border border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile Price */}
              {priceBounds.max > 0 && (
                <div className="mb-4">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Price (KES)
                  </h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder={`Min ${priceBounds.min}`}
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <span className="text-xs text-muted-foreground">to</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder={`Max ${priceBounds.max}`}
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={() => setFiltersOpen(false)}
                className="w-full rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground"
              >
                Apply Filters
              </button>
            </div>
          )}

          {/* Products Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-20 text-center">
              <p className="text-lg font-semibold text-foreground">No products found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your filters or search query
              </p>
              <button
                onClick={clearAllFilters}
                className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
