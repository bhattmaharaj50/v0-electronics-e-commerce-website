"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  Plus,
  Pencil,
  Trash2,
  LogOut,
  Zap,
  Search,
  X,
  Package,
  Tag,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react"
import { useProductStore } from "@/lib/product-store"
import type { Product, Category } from "@/lib/product-store"
import { formatPrice } from "@/lib/products"

const AUTH_KEY = "25flow_admin_auth"

const ICON_OPTIONS = [
  "Tv", "Speaker", "Refrigerator", "WashingMachine", "Flame",
  "Cable", "Smartphone", "Laptop", "Headphones", "Camera",
  "Gamepad", "Watch", "Tablet", "Printer", "Monitor",
]

const EMPTY_PRODUCT: Partial<Product> = {
  id: "",
  name: "",
  price: 0,
  originalPrice: undefined,
  description: "",
  category: "",
  brand: "",
  size: "",
  image: "",
  rating: 4.5,
  reviews: 0,
  badge: "",
  featured: false,
}

type Tab = "products" | "categories"

export default function AdminDashboardPage() {
  const router = useRouter()
  const {
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
    resetToDefaults,
  } = useProductStore()

  const [tab, setTab] = useState<Tab>("products")
  const [search, setSearch] = useState("")
  const [filterCategory, setFilterCategory] = useState("")
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productForm, setProductForm] = useState<Partial<Product>>({ ...EMPTY_PRODUCT })
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryForm, setCategoryForm] = useState<Partial<Category>>({ slug: "", name: "", icon: "Package" })
  const [deleteCategoryConfirm, setDeleteCategoryConfirm] = useState<string | null>(null)

  const [resetConfirm, setResetConfirm] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [expandedDescription, setExpandedDescription] = useState<string | null>(null)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(AUTH_KEY) !== "true") {
        router.replace("/admin")
      }
    } catch {
      router.replace("/admin")
    }
  }, [router])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function handleLogout() {
    try { sessionStorage.removeItem(AUTH_KEY) } catch { /* ignore */ }
    router.push("/admin")
  }

  // --- Products ---
  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    const matchesCategory = !filterCategory || p.category === filterCategory
    return matchesSearch && matchesCategory
  })

  function openAddProduct() {
    setEditingProduct(null)
    setProductForm({ ...EMPTY_PRODUCT, id: `prod-${Date.now()}` })
    setShowProductForm(true)
  }

  function openEditProduct(product: Product) {
    setEditingProduct(product)
    setProductForm({ ...product })
    setShowProductForm(true)
  }

  function handleProductFormChange(field: keyof Product, value: unknown) {
    setProductForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault()
    const product = {
      ...productForm,
      price: Number(productForm.price) || 0,
      originalPrice: productForm.originalPrice ? Number(productForm.originalPrice) : undefined,
      rating: Number(productForm.rating) || 4.5,
      reviews: Number(productForm.reviews) || 0,
      size: productForm.size || undefined,
      badge: productForm.badge || undefined,
    } as Product

    if (!product.id || !product.name || !product.price || !product.category) {
      showToast("Please fill in all required fields")
      return
    }

    if (editingProduct) {
      updateProduct(product)
      showToast("Product updated successfully")
    } else {
      addProduct(product)
      showToast("Product added successfully")
    }
    setShowProductForm(false)
  }

  function handleDeleteProduct(id: string) {
    deleteProduct(id)
    setDeleteConfirm(null)
    showToast("Product deleted")
  }

  // --- Categories ---
  function openAddCategory() {
    setEditingCategory(null)
    setCategoryForm({ slug: "", name: "", icon: "Package" })
    setShowCategoryForm(true)
  }

  function openEditCategory(cat: Category) {
    setEditingCategory(cat)
    setCategoryForm({ ...cat })
    setShowCategoryForm(true)
  }

  function handleSaveCategory(e: React.FormEvent) {
    e.preventDefault()
    const cat = categoryForm as Category
    if (!cat.slug || !cat.name) {
      showToast("Please fill in all required fields")
      return
    }
    if (editingCategory) {
      updateCategory(cat)
      showToast("Category updated")
    } else {
      addCategory(cat)
      showToast("Category added")
    }
    setShowCategoryForm(false)
  }

  function handleDeleteCategory(slug: string) {
    deleteCategory(slug)
    setDeleteCategoryConfirm(null)
    showToast("Category deleted")
  }

  function handleReset() {
    resetToDefaults()
    setResetConfirm(false)
    showToast("Reset to defaults")
  }

  function stripHtml(html: string) {
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 120)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-background shadow-lg">
          <Check className="h-4 w-4 text-green-400" />
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-base font-bold text-foreground">Admin Dashboard</span>
              <span className="ml-2 hidden text-xs text-muted-foreground sm:inline">25FlowElectronics</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="hidden rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary sm:block"
            >
              View Store
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Total Products</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{products.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Categories</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{categories.length}</p>
          </div>
          <div className="col-span-2 flex items-center justify-between rounded-xl border border-border bg-card p-4 sm:col-span-1">
            <div>
              <p className="text-xs text-muted-foreground">Deals Active</p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {products.filter((p) => p.originalPrice).length}
              </p>
            </div>
            <Tag className="h-8 w-8 text-muted-foreground/30" />
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex items-center gap-1 rounded-xl border border-border bg-card p-1 w-fit">
          <button
            onClick={() => setTab("products")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === "products"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Package className="h-4 w-4" />
            Products
          </button>
          <button
            onClick={() => setTab("categories")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === "categories"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Tag className="h-4 w-4" />
            Categories
          </button>
        </div>

        {/* ===================== PRODUCTS TAB ===================== */}
        {tab === "products" && (
          <div>
            {/* Toolbar */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-secondary pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="h-9 rounded-lg border border-border bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
              <button
                onClick={openAddProduct}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Add Product
              </button>
              <button
                onClick={() => setResetConfirm(true)}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            </div>

            <p className="mb-3 text-xs text-muted-foreground">
              Showing {filteredProducts.length} of {products.length} products
            </p>

            {/* Products Table */}
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Size</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rating</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product, idx) => (
                      <tr
                        key={product.id}
                        className={`border-b border-border transition-colors hover:bg-secondary/30 ${
                          idx % 2 === 0 ? "" : "bg-secondary/10"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-3">
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-secondary">
                              <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground line-clamp-1">{product.name}</p>
                              <p className="text-xs text-muted-foreground">{product.brand}</p>
                              <button
                                onClick={() => setExpandedDescription(expandedDescription === product.id ? null : product.id)}
                                className="mt-0.5 flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground"
                              >
                                {expandedDescription === product.id ? (
                                  <><ChevronUp className="h-3 w-3" />Hide</>
                                ) : (
                                  <><ChevronDown className="h-3 w-3" />Description</>
                                )}
                              </button>
                              {expandedDescription === product.id && (
                                <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                                  {stripHtml(product.description)}...
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-muted-foreground capitalize">
                            {categories.find((c) => c.slug === product.category)?.name || product.category}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-semibold text-foreground">{formatPrice(product.price)}</p>
                            {product.originalPrice && (
                              <p className="text-xs text-muted-foreground line-through">{formatPrice(product.originalPrice)}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{product.size || "—"}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{product.rating} ⭐</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditProduct(product)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(product.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredProducts.length === 0 && (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    No products found
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===================== CATEGORIES TAB ===================== */}
        {tab === "categories" && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{categories.length} categories</p>
              <button
                onClick={openAddCategory}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Add Category
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((cat) => (
                <div
                  key={cat.slug}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
                >
                  <div>
                    <p className="font-semibold text-foreground">{cat.name}</p>
                    <p className="text-xs text-muted-foreground">
                      slug: {cat.slug} · icon: {cat.icon}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {products.filter((p) => p.category === cat.slug).length} products
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditCategory(cat)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteCategoryConfirm(cat.slug)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ===================== PRODUCT FORM MODAL ===================== */}
      {showProductForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/80 backdrop-blur-sm p-4 pt-8">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-bold text-foreground">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <button
                onClick={() => setShowProductForm(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="flex flex-col gap-5 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Product Name *</Label>
                  <Input
                    required
                    value={productForm.name || ""}
                    onChange={(v) => handleProductFormChange("name", v)}
                    placeholder="e.g. Samsung 65 inch 4K TV"
                  />
                </div>
                <div>
                  <Label>Price (KES) *</Label>
                  <Input
                    required
                    type="number"
                    min="0"
                    value={productForm.price || ""}
                    onChange={(v) => handleProductFormChange("price", v)}
                    placeholder="e.g. 75000"
                  />
                </div>
                <div>
                  <Label>Original Price (KES) — for deals</Label>
                  <Input
                    type="number"
                    min="0"
                    value={productForm.originalPrice || ""}
                    onChange={(v) => handleProductFormChange("originalPrice", v || undefined)}
                    placeholder="e.g. 90000"
                  />
                </div>
                <div>
                  <Label>Category *</Label>
                  <select
                    required
                    value={productForm.category || ""}
                    onChange={(e) => handleProductFormChange("category", e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.slug} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Brand *</Label>
                  <Input
                    required
                    value={productForm.brand || ""}
                    onChange={(v) => handleProductFormChange("brand", v)}
                    placeholder="e.g. Samsung"
                  />
                </div>
                <div>
                  <Label>Size / Storage</Label>
                  <Input
                    value={productForm.size || ""}
                    onChange={(v) => handleProductFormChange("size", v)}
                    placeholder="e.g. 65&quot; or 512GB"
                  />
                </div>
                <div>
                  <Label>Badge</Label>
                  <Input
                    value={productForm.badge || ""}
                    onChange={(v) => handleProductFormChange("badge", v)}
                    placeholder='e.g. "New" or "Hot Deal"'
                  />
                </div>
                <div>
                  <Label>Rating (1-5)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    value={productForm.rating || 4.5}
                    onChange={(v) => handleProductFormChange("rating", v)}
                  />
                </div>
                <div>
                  <Label>Reviews Count</Label>
                  <Input
                    type="number"
                    min="0"
                    value={productForm.reviews || ""}
                    onChange={(v) => handleProductFormChange("reviews", v)}
                    placeholder="e.g. 120"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Image URL *</Label>
                  <Input
                    required
                    value={productForm.image || ""}
                    onChange={(v) => handleProductFormChange("image", v)}
                    placeholder="https://..."
                  />
                  {productForm.image && (
                    <div className="mt-2 relative h-24 w-24 overflow-hidden rounded-lg border border-border bg-secondary">
                      <Image src={productForm.image} alt="preview" fill className="object-cover" sizes="96px" />
                    </div>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <Label>Description (HTML supported)</Label>
                  <textarea
                    rows={5}
                    value={productForm.description || ""}
                    onChange={(e) => handleProductFormChange("description", e.target.value)}
                    className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="<p>Product description...</p>"
                  />
                </div>
                <div className="sm:col-span-2 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={productForm.featured || false}
                    onChange={(e) => handleProductFormChange("featured", e.target.checked)}
                    className="h-4 w-4 rounded border-border"
                  />
                  <label htmlFor="featured" className="text-sm font-medium text-foreground">
                    Mark as Featured
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setShowProductForm(false)}
                  className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  {editingProduct ? "Save Changes" : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== CATEGORY FORM MODAL ===================== */}
      {showCategoryForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-bold text-foreground">
                {editingCategory ? "Edit Category" : "Add Category"}
              </h2>
              <button
                onClick={() => setShowCategoryForm(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveCategory} className="flex flex-col gap-4 p-6">
              <div>
                <Label>Category Name *</Label>
                <Input
                  required
                  value={categoryForm.name || ""}
                  onChange={(v) => setCategoryForm((p) => ({ ...p, name: v }))}
                  placeholder="e.g. Smartphones"
                />
              </div>
              <div>
                <Label>Slug * (used in URL)</Label>
                <Input
                  required
                  value={categoryForm.slug || ""}
                  onChange={(v) =>
                    setCategoryForm((p) => ({
                      ...p,
                      slug: v.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
                    }))
                  }
                  placeholder="e.g. smartphones"
                />
              </div>
              <div>
                <Label>Icon Name</Label>
                <select
                  value={categoryForm.icon || "Package"}
                  onChange={(e) => setCategoryForm((p) => ({ ...p, icon: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {ICON_OPTIONS.map((icon) => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setShowCategoryForm(false)}
                  className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  {editingCategory ? "Save Changes" : "Add Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== DELETE PRODUCT CONFIRM ===================== */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h3 className="text-base font-bold text-foreground">Delete Product?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              This will permanently remove the product from the store.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProduct(deleteConfirm)}
                className="flex-1 rounded-lg bg-destructive py-2.5 text-sm font-semibold text-white hover:opacity-90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== DELETE CATEGORY CONFIRM ===================== */}
      {deleteCategoryConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h3 className="text-base font-bold text-foreground">Delete Category?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              This will remove the category. Products in this category won&apos;t be deleted but will have an unassigned category.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setDeleteCategoryConfirm(null)}
                className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCategory(deleteCategoryConfirm)}
                className="flex-1 rounded-lg bg-destructive py-2.5 text-sm font-semibold text-white hover:opacity-90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== RESET CONFIRM ===================== */}
      {resetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h3 className="text-base font-bold text-foreground">Reset to Defaults?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              All your custom products and categories will be replaced with the original defaults. This cannot be undone.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setResetConfirm(false)}
                className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="flex-1 rounded-lg bg-destructive py-2.5 text-sm font-semibold text-white hover:opacity-90"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{children}</label>
  )
}

function Input({
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  min,
  max,
  step,
}: {
  value: string | number
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  required?: boolean
  min?: string
  max?: string
  step?: string
}) {
  return (
    <input
      type={type}
      required={required}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
    />
  )
}
