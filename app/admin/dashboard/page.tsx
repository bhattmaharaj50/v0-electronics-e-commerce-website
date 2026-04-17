"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Check,
  Gift,
  LayoutDashboard,
  LogOut,
  Package,
  Pencil,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  Tag,
  Trash2,
  Upload,
  Video,
  X,
  Zap,
} from "lucide-react"
import { useProductStore, type Category, type SiteSettings } from "@/lib/product-store"
import type { Product } from "@/lib/products"
import { formatPrice } from "@/lib/products"

const AUTH_KEY = "munex_admin_auth"
const ORDER_STATUSES = ["new", "confirmed", "processing", "delivered", "cancelled"]
const OFFER_TYPES = [
  { value: "", label: "No offer" },
  { value: "flash-sale", label: "Flash sale" },
  { value: "deal-of-day", label: "Deal of the day" },
  { value: "holiday-deal", label: "Holiday deal" },
]

interface OrderRecord {
  id: number
  orderNumber: string
  customer: { firstName: string; lastName: string; email: string; phone: string; address: string; city: string }
  items: Array<{ product: Product; quantity: number }>
  subtotal: number
  deliveryFee: number
  total: number
  paymentMethod: string
  mpesaCode?: string
  status: string
  whatsappUrl: string
  createdAt: string
}

type Tab = "overview" | "products" | "categories" | "orders" | "offers" | "settings"

const emptyProduct: Product = {
  id: "",
  name: "",
  price: 0,
  description: "",
  category: "",
  brand: "",
  size: "",
  image: "",
  videoUrl: "",
  rating: 4.5,
  reviews: 0,
  badge: "",
  featured: false,
  stock: 10,
  offerType: "",
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`h-10 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${props.className || ""}`} />
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{children}</label>
}

async function adminAction(action: string, payload: Record<string, unknown>) {
  const response = await fetch("/api/admin/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || "Admin action failed")
  }
  return response.json()
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const {
    products,
    categories,
    settings,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
    updateSettings,
    refreshStore,
  } = useProductStore()

  const [tab, setTab] = useState<Tab>("overview")
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [search, setSearch] = useState("")
  const [toast, setToast] = useState<string | null>(null)
  const [productFormOpen, setProductFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productForm, setProductForm] = useState<Product>(emptyProduct)
  const [categoryFormOpen, setCategoryFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryForm, setCategoryForm] = useState<Category>({ slug: "", name: "", icon: "Package" })
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(settings)
  const [stockEdits, setStockEdits] = useState<Record<string, number>>({})
  const [imageMode, setImageMode] = useState<"url" | "upload">("url")
  const [videoMode, setVideoMode] = useState<"url" | "upload">("url")
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(AUTH_KEY) !== "true") router.replace("/admin")
    } catch {
      router.replace("/admin")
    }
  }, [router])

  useEffect(() => {
    setSettingsForm(settings)
  }, [settings])

  useEffect(() => {
    loadAdminData().catch((error) => showToast(error.message))
  }, [])

  async function loadAdminData() {
    const response = await fetch("/api/admin/data", { cache: "no-store" })
    if (!response.ok) throw new Error("Unable to load admin data")
    const data = await response.json()
    setOrders(data.orders || [])
  }

  function showToast(message: string) {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  function logout() {
    sessionStorage.removeItem(AUTH_KEY)
    router.push("/admin")
  }

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase()
    return products.filter((product) =>
      !q ||
      product.name.toLowerCase().includes(q) ||
      product.brand.toLowerCase().includes(q) ||
      product.category.toLowerCase().includes(q)
    )
  }, [products, search])

  const lowStockProducts = products.filter((product) => (product.stock ?? 0) <= 3)
  const activeOffers = products.filter((product) => product.offerType || product.originalPrice)
  const newOrders = orders.filter((order) => order.status === "new")

  function openAddProduct() {
    setEditingProduct(null)
    setProductForm({ ...emptyProduct, id: `prod-${Date.now()}` })
    setImageMode("url")
    setVideoMode("url")
    setProductFormOpen(true)
  }

  function openEditProduct(product: Product) {
    setEditingProduct(product)
    setProductForm({ ...emptyProduct, ...product })
    setImageMode("url")
    setVideoMode("url")
    setProductFormOpen(true)
  }

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault()
    const product: Product = {
      ...productForm,
      price: Number(productForm.price) || 0,
      originalPrice: productForm.originalPrice ? Number(productForm.originalPrice) : undefined,
      rating: Number(productForm.rating) || 4.5,
      reviews: Number(productForm.reviews) || 0,
      stock: Number(productForm.stock) || 0,
      size: productForm.size || undefined,
      badge: productForm.badge || undefined,
      offerType: productForm.offerType || "",
      videoUrl: productForm.videoUrl || undefined,
    }
    if (!product.id || !product.name || !product.category || !product.brand || !product.image) {
      showToast("Please fill all required product fields")
      return
    }

    if (editingProduct) await updateProduct(product)
    else await addProduct(product)
    setProductFormOpen(false)
    await refreshStore()
    showToast(editingProduct ? "Product updated" : "Product added")
  }

  async function removeProduct(id: string) {
    if (!confirm("Delete this product?")) return
    await deleteProduct(id)
    await refreshStore()
    showToast("Product deleted")
  }

  async function saveStockQuick(product: Product) {
    const newStock = stockEdits[product.id]
    if (newStock === undefined || newStock === (product.stock ?? 0)) return
    await updateProduct({ ...product, stock: newStock })
    setStockEdits((prev) => { const next = { ...prev }; delete next[product.id]; return next })
    showToast(`Stock updated to ${newStock}`)
  }

  async function handleFileUpload(
    file: File,
    type: "image" | "video",
    onSuccess: (url: string) => void
  ) {
    const setter = type === "image" ? setUploadingImage : setUploadingVideo
    setter(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")
      onSuccess(data.url)
      showToast(`${type === "image" ? "Image" : "Video"} uploaded successfully`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setter(false)
    }
  }

  function openAddCategory() {
    setEditingCategory(null)
    setCategoryForm({ slug: "", name: "", icon: "Package" })
    setCategoryFormOpen(true)
  }

  function openEditCategory(category: Category) {
    setEditingCategory(category)
    setCategoryForm(category)
    setCategoryFormOpen(true)
  }

  async function saveCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!categoryForm.slug || !categoryForm.name) return showToast("Category slug and name are required")
    if (editingCategory) await updateCategory(categoryForm)
    else await addCategory(categoryForm)
    setCategoryFormOpen(false)
    showToast(editingCategory ? "Category updated" : "Category added")
  }

  async function removeCategory(slug: string) {
    if (!confirm("Delete this category? Products in this category will keep their category slug.")) return
    await deleteCategory(slug)
    showToast("Category deleted")
  }

  async function saveSiteSettings(e: React.FormEvent) {
    e.preventDefault()
    await updateSettings(settingsForm)
    showToast("Website text and contact settings updated")
  }

  async function changeOrderStatus(orderNumber: string, status: string) {
    const data = await adminAction("updateOrderStatus", { orderNumber, status })
    setOrders(data.orders || [])
    showToast("Order status updated")
  }

  const tabs: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: "products", label: "Products & Stock", icon: <Package className="h-4 w-4" /> },
    { id: "categories", label: "Categories", icon: <Tag className="h-4 w-4" /> },
    { id: "orders", label: "Orders", icon: <ShoppingBag className="h-4 w-4" /> },
    { id: "offers", label: "Offers", icon: <Gift className="h-4 w-4" /> },
    { id: "settings", label: "Website Text", icon: <Settings className="h-4 w-4" /> },
  ]

  return (
    <div className="min-h-screen bg-background">
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-background shadow-lg">
          <Check className="h-4 w-4 text-green-400" />
          {toast}
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-base font-bold text-foreground">Munex Admin Backend</span>
              {newOrders.length > 0 && <span className="ml-2 rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">{newOrders.length} new</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary">View Store</a>
            <button onClick={logout} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary">
              <LogOut className="h-3.5 w-3.5" /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <div className="mb-6 flex flex-wrap gap-2 rounded-xl border border-border bg-card p-1">
          {tabs.map((item) => (
            <button key={item.id} onClick={() => setTab(item.id)} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${tab === item.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {item.icon}{item.label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Stat title="Products" value={products.length} />
            <Stat title="Low Stock" value={lowStockProducts.length} tone={lowStockProducts.length ? "warning" : "normal"} />
            <Stat title="Orders" value={orders.length} />
            <Stat title="Active Offers" value={activeOffers.length} />
            <div className="rounded-xl border border-border bg-card p-5 md:col-span-2">
              <h2 className="mb-3 font-bold text-foreground">Portal alerts</h2>
              {newOrders.length === 0 && lowStockProducts.length === 0 ? <p className="text-sm text-muted-foreground">No urgent alerts right now.</p> : null}
              {newOrders.map((order) => <p key={order.orderNumber} className="mb-2 rounded-lg bg-red-600/10 p-3 text-sm text-foreground">New order {order.orderNumber} from {order.customer.firstName} {order.customer.lastName}</p>)}
              {lowStockProducts.map((product) => <p key={product.id} className="mb-2 rounded-lg bg-yellow-500/10 p-3 text-sm text-foreground">Low stock: {product.name} has {product.stock ?? 0} left</p>)}
            </div>
            <div className="rounded-xl border border-border bg-card p-5 md:col-span-2">
              <h2 className="mb-3 font-bold text-foreground">Recent Orders</h2>
              {orders.length === 0 ? <p className="text-sm text-muted-foreground">No orders yet.</p> : orders.slice(0, 3).map((order) => (
                <div key={order.orderNumber} className="mb-2 flex items-center justify-between rounded-lg bg-secondary p-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">{order.customer.firstName} {order.customer.lastName} · {formatPrice(order.total)}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${order.status === "new" ? "bg-red-600/20 text-red-500" : order.status === "delivered" ? "bg-green-600/20 text-green-500" : "bg-secondary text-muted-foreground"}`}>{order.status}</span>
                </div>
              ))}
              {orders.length > 3 && <button onClick={() => setTab("orders")} className="mt-2 text-xs font-medium text-muted-foreground hover:text-foreground">View all {orders.length} orders →</button>}
            </div>
          </div>
        )}

        {tab === "products" && (
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="relative min-w-64 flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="h-10 w-full rounded-lg border border-border bg-secondary pl-9 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <button onClick={openAddProduct} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" />Add Product</button>
            </div>
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3 text-left">Product</th><th className="px-4 py-3 text-left">Category</th><th className="px-4 py-3 text-left">Price</th><th className="px-4 py-3 text-left">Stock</th><th className="px-4 py-3 text-left">Offer</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="border-t border-border">
                        <td className="px-4 py-3"><div className="flex items-center gap-3"><img src={product.image} alt="" className="h-12 w-12 rounded-lg object-cover" /><div><p className="font-medium text-foreground line-clamp-1">{product.name}</p><p className="text-xs text-muted-foreground">{product.brand}</p></div></div></td>
                        <td className="px-4 py-3 text-muted-foreground">{categories.find((cat) => cat.slug === product.category)?.name || product.category}</td>
                        <td className="px-4 py-3 font-semibold text-foreground">{formatPrice(product.price)}</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            value={stockEdits[product.id] !== undefined ? stockEdits[product.id] : (product.stock ?? 0)}
                            onChange={(e) => setStockEdits((prev) => ({ ...prev, [product.id]: Number(e.target.value) }))}
                            onBlur={() => saveStockQuick(product)}
                            className={`h-8 w-20 rounded-md border border-border bg-secondary px-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ring ${(product.stock ?? 0) <= 3 ? "text-red-500" : "text-foreground"}`}
                          />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{OFFER_TYPES.find((offer) => offer.value === (product.offerType || ""))?.label || "No offer"}</td>
                        <td className="px-4 py-3"><div className="flex justify-end gap-2"><button onClick={() => openEditProduct(product)} className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-secondary"><Pencil className="h-4 w-4" /></button><button onClick={() => removeProduct(product.id)} className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === "categories" && (
          <div>
            <div className="mb-4 flex justify-end"><button onClick={openAddCategory} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" />Add Category</button></div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <div key={category.slug} className="rounded-xl border border-border bg-card p-4">
                  <p className="font-semibold text-foreground">{category.name}</p>
                  <p className="text-xs text-muted-foreground">{category.slug} · {products.filter((p) => p.category === category.slug).length} products</p>
                  <div className="mt-3 flex gap-2"><button onClick={() => openEditCategory(category)} className="rounded-lg border border-border px-3 py-1.5 text-xs">Edit</button><button onClick={() => removeCategory(category.slug)} className="rounded-lg border border-border px-3 py-1.5 text-xs text-destructive">Delete</button></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "orders" && (
          <div className="grid gap-4">
            {orders.length === 0 ? <p className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">No orders yet.</p> : orders.map((order) => (
              <div key={order.orderNumber} className="rounded-xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><h3 className="font-bold text-foreground">{order.orderNumber}</h3><p className="text-sm text-muted-foreground">{order.customer.firstName} {order.customer.lastName} · {order.customer.phone} · {new Date(order.createdAt).toLocaleString()}</p></div>
                  <select value={order.status} onChange={(e) => changeOrderStatus(order.orderNumber, e.target.value)} className="h-9 rounded-lg border border-border bg-secondary px-3 text-sm text-foreground">{ORDER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select>
                </div>
                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                  <div className="lg:col-span-2"><p className="text-xs font-semibold uppercase text-muted-foreground">Items</p>{order.items.map((item) => <p key={item.product.id} className="mt-1 text-sm text-foreground">{item.product.name} x{item.quantity} — {formatPrice(item.product.price * item.quantity)}</p>)}</div>
                  <div><p className="text-xs font-semibold uppercase text-muted-foreground">Delivery & Payment</p><p className="mt-1 text-sm text-foreground">{order.customer.address}, {order.customer.city}</p><p className="text-sm text-foreground">{order.paymentMethod}{order.mpesaCode ? ` · ${order.mpesaCode}` : ""}</p><p className="mt-2 font-bold text-foreground">{formatPrice(order.total)}</p><a href={order.whatsappUrl} target="_blank" className="mt-3 inline-flex rounded-lg bg-[#25D366] px-3 py-2 text-xs font-semibold text-white">Open WhatsApp message</a></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "offers" && (
          <div className="grid gap-4 lg:grid-cols-3">
            {OFFER_TYPES.filter((offer) => offer.value).map((offer) => (
              <div key={offer.value} className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-bold text-foreground">{offer.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">Edit a product and choose this offer type to show it on the home page.</p>
                <div className="mt-4 space-y-2">{products.filter((product) => product.offerType === offer.value).map((product) => <button key={product.id} onClick={() => openEditProduct(product)} className="block w-full rounded-lg bg-secondary p-3 text-left text-sm text-foreground">{product.name}</button>)}</div>
              </div>
            ))}
          </div>
        )}

        {tab === "settings" && (
          <form onSubmit={saveSiteSettings} className="grid gap-4 rounded-xl border border-border bg-card p-5 md:grid-cols-2">
            <div><Label>Hero badge</Label><Input value={settingsForm.heroBadge} onChange={(e) => setSettingsForm({ ...settingsForm, heroBadge: e.target.value })} /></div>
            <div><Label>Hero title</Label><Input value={settingsForm.heroTitle} onChange={(e) => setSettingsForm({ ...settingsForm, heroTitle: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Hero subtitle</Label><Input value={settingsForm.heroSubtitle} onChange={(e) => setSettingsForm({ ...settingsForm, heroSubtitle: e.target.value })} /></div>
            <div><Label>Flash sale title</Label><Input value={settingsForm.flashSaleTitle} onChange={(e) => setSettingsForm({ ...settingsForm, flashSaleTitle: e.target.value })} /></div>
            <div><Label>Deal of the day title</Label><Input value={settingsForm.dealOfDayTitle} onChange={(e) => setSettingsForm({ ...settingsForm, dealOfDayTitle: e.target.value })} /></div>
            <div><Label>Holiday deals title</Label><Input value={settingsForm.holidayDealsTitle} onChange={(e) => setSettingsForm({ ...settingsForm, holidayDealsTitle: e.target.value })} /></div>
            <div><Label>WhatsApp number</Label><Input value={settingsForm.adminPhone} onChange={(e) => setSettingsForm({ ...settingsForm, adminPhone: e.target.value })} /></div>
            <div><Label>M-Pesa number</Label><Input value={settingsForm.mpesaNumber} onChange={(e) => setSettingsForm({ ...settingsForm, mpesaNumber: e.target.value })} /></div>
            <div className="md:col-span-2"><button className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Save Website Settings</button></div>
          </form>
        )}
      </div>

      {productFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-background/80 p-4 backdrop-blur-sm">
          <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border p-5"><h2 className="text-lg font-bold text-foreground">{editingProduct ? "Edit Product" : "Add Product"}</h2><button onClick={() => setProductFormOpen(false)}><X className="h-5 w-5" /></button></div>
            <form onSubmit={saveProduct} className="grid gap-4 p-5 md:grid-cols-2">
              <div className="md:col-span-2"><Label>Product name *</Label><Input required value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} /></div>
              <div><Label>Price *</Label><Input required type="number" value={productForm.price || ""} onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })} /></div>
              <div><Label>Original price</Label><Input type="number" value={productForm.originalPrice || ""} onChange={(e) => setProductForm({ ...productForm, originalPrice: e.target.value ? Number(e.target.value) : undefined })} /></div>
              <div><Label>Category *</Label><select required value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground"><option value="">Select category</option>{categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}</select></div>
              <div><Label>Brand *</Label><Input required value={productForm.brand} onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })} /></div>
              <div><Label>Stock *</Label><Input required type="number" value={productForm.stock ?? 0} onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })} /></div>
              <div><Label>Offer placement</Label><select value={productForm.offerType || ""} onChange={(e) => setProductForm({ ...productForm, offerType: e.target.value as Product["offerType"] })} className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground">{OFFER_TYPES.map((offer) => <option key={offer.value} value={offer.value}>{offer.label}</option>)}</select></div>
              <div><Label>Size</Label><Input value={productForm.size || ""} onChange={(e) => setProductForm({ ...productForm, size: e.target.value })} /></div>
              <div><Label>Badge</Label><Input value={productForm.badge || ""} onChange={(e) => setProductForm({ ...productForm, badge: e.target.value })} /></div>
              <div><Label>Rating</Label><Input type="number" step="0.1" min="0" max="5" value={productForm.rating} onChange={(e) => setProductForm({ ...productForm, rating: Number(e.target.value) })} /></div>
              <div><Label>Reviews</Label><Input type="number" value={productForm.reviews} onChange={(e) => setProductForm({ ...productForm, reviews: Number(e.target.value) })} /></div>
              {/* Image — URL or file upload */}
              <div className="md:col-span-2">
                <div className="mb-2 flex items-center justify-between">
                  <Label>Product Image *</Label>
                  <div className="flex rounded-lg border border-border overflow-hidden text-xs">
                    <button type="button" onClick={() => setImageMode("url")} className={`px-3 py-1 ${imageMode === "url" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}>URL</button>
                    <button type="button" onClick={() => setImageMode("upload")} className={`px-3 py-1 ${imageMode === "upload" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}><Upload className="inline h-3 w-3 mr-1" />Upload</button>
                  </div>
                </div>
                {imageMode === "url" ? (
                  <Input required value={productForm.image} onChange={(e) => setProductForm({ ...productForm, image: e.target.value })} placeholder="https://..." />
                ) : (
                  <label className={`flex h-24 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-secondary text-sm text-muted-foreground transition-colors hover:border-primary ${uploadingImage ? "opacity-60 pointer-events-none" : ""}`}>
                    <Upload className="h-5 w-5" />
                    <span>{uploadingImage ? "Uploading…" : "Click to upload image (JPG, PNG, WebP)"}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, "image", (url) => { setProductForm((prev) => ({ ...prev, image: url })); setImageMode("url") }) }} />
                  </label>
                )}
                {productForm.image && <img src={productForm.image} alt="preview" className="mt-2 h-20 rounded-lg object-cover border border-border" onError={(e) => (e.currentTarget.style.display = "none")} />}
              </div>

              {/* Video — URL (YouTube/direct) or file upload */}
              <div className="md:col-span-2">
                <div className="mb-2 flex items-center justify-between">
                  <Label><Video className="inline h-3.5 w-3.5 mr-1" />Product Video (optional)</Label>
                  <div className="flex rounded-lg border border-border overflow-hidden text-xs">
                    <button type="button" onClick={() => setVideoMode("url")} className={`px-3 py-1 ${videoMode === "url" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}>URL / YouTube</button>
                    <button type="button" onClick={() => setVideoMode("upload")} className={`px-3 py-1 ${videoMode === "upload" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}><Upload className="inline h-3 w-3 mr-1" />Upload</button>
                  </div>
                </div>
                {videoMode === "url" ? (
                  <Input value={productForm.videoUrl || ""} onChange={(e) => setProductForm({ ...productForm, videoUrl: e.target.value })} placeholder="https://youtube.com/watch?v=... or https://..." />
                ) : (
                  <label className={`flex h-24 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-secondary text-sm text-muted-foreground transition-colors hover:border-primary ${uploadingVideo ? "opacity-60 pointer-events-none" : ""}`}>
                    <Video className="h-5 w-5" />
                    <span>{uploadingVideo ? "Uploading…" : "Click to upload video (MP4, WebM)"}</span>
                    <input type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, "video", (url) => { setProductForm((prev) => ({ ...prev, videoUrl: url })); setVideoMode("url") }) }} />
                  </label>
                )}
                {productForm.videoUrl && <p className="mt-1 truncate text-xs text-muted-foreground">{productForm.videoUrl}</p>}
              </div>

              <div className="md:col-span-2"><Label>Description *</Label><textarea required value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} className="min-h-32 w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" /></div>
              <div className="md:col-span-2 flex justify-end gap-3"><button type="button" onClick={() => setProductFormOpen(false)} className="rounded-lg border border-border px-5 py-2.5 text-sm">Cancel</button><button className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Save Product</button></div>
            </form>
          </div>
        </div>
      )}

      {categoryFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <form onSubmit={saveCategory} className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold text-foreground">{editingCategory ? "Edit Category" : "Add Category"}</h2><button type="button" onClick={() => setCategoryFormOpen(false)}><X className="h-5 w-5" /></button></div>
            <div className="mb-3"><Label>Slug</Label><Input required value={categoryForm.slug} disabled={Boolean(editingCategory)} onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} /></div>
            <div className="mb-3"><Label>Name</Label><Input required value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} /></div>
            <div className="mb-5"><Label>Icon name</Label><Input value={categoryForm.icon} onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })} /></div>
            <button className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground">Save Category</button>
          </form>
        </div>
      )}
    </div>
  )
}

function Stat({ title, value, tone = "normal" }: { title: string; value: number; tone?: "normal" | "warning" }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className={`mt-1 text-3xl font-bold ${tone === "warning" ? "text-red-500" : "text-foreground"}`}>{value}</p>
    </div>
  )
}
