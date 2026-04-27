"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Activity,
  BarChart3,
  Check,
  Gift,
  Image as ImageIcon,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MapPin,
  MessageCircle,
  Package,
  Pencil,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Star,
  Tag,
  Trash2,
  Truck,
  Upload,
  Users,
  Video,
  X,
  Zap,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useProductStore, type Category, type SiteSettings } from "@/lib/product-store"
import type { Product } from "@/lib/products"
import { formatPrice } from "@/lib/products"
import { AdminProductPreview } from "@/components/admin-product-preview"
import { csrfFetch } from "@/lib/csrf-client"

const ORDER_STATUSES = ["new", "pending_payment", "paid", "confirmed", "processing", "ready", "dispatched", "delivered", "cancelled"]
const STATUS_COLORS: Record<string, string> = {
  new: "#ef4444",
  pending_payment: "#f97316",
  paid: "#22c55e",
  confirmed: "#10b981",
  processing: "#3b82f6",
  ready: "#8b5cf6",
  dispatched: "#06b6d4",
  delivered: "#16a34a",
  cancelled: "#6b7280",
}
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
  pickupLocation?: string
  customerWhatsappUrl?: string
  paidAt?: string
  readyAt?: string
  dispatchedAt?: string
  createdAt: string
}

interface ReviewItem {
  id: number
  productId: string
  name: string
  rating: number
  comment: string
  createdAt: string
}

interface AnalyticsData {
  totalViews: number
  uniqueVisitors: number
  viewsLast24h: number
  viewsLast7d: number
  viewsLast30d: number
  topPages: Array<{ path: string; views: number }>
  topCountries: Array<{ label: string; views: number }>
  topCities: Array<{ label: string; views: number }>
  topReferrers: Array<{ label: string; views: number }>
  recentVisits: Array<{ path: string; country: string; city: string; referrer: string; userAgent: string; createdAt: string }>
  dailySeries: Array<{ day: string; views: number }>
}

type Tab = "overview" | "products" | "categories" | "orders" | "offers" | "reviews" | "reports" | "analytics" | "admins" | "settings"

type AdminRole = "owner" | "staff"

interface AdminUserItem {
  id: number
  username: string
  fullName: string
  role: AdminRole
  createdAt: string
  lastLoginAt: string | null
  hasRecoveryCode?: boolean
}

interface SalesReportData {
  range: number
  totalRevenue: number
  paidRevenue: number
  totalOrders: number
  paidOrders: number
  pendingOrders: number
  averageOrderValue: number
  revenueByDay: Array<{ day: string; revenue: number; orders: number }>
  topProducts: Array<{ id: string; name: string; quantity: number; revenue: number }>
  statusCounts: Record<string, number>
  salesByCategory: Array<{ category: string; revenue: number; quantity: number }>
}

const emptyProduct: Product = {
  id: "",
  name: "",
  price: 0,
  description: "",
  category: "",
  brand: "",
  size: "",
  color: "",
  image: "",
  images: [],
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
  const response = await csrfFetch("/api/admin/data", {
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

function buildDispatchWhatsAppUrl(order: OrderRecord, pickupLocation: string, businessName: string) {
  const phoneRaw = (order.customer.phone || "").replace(/\D/g, "")
  let phone = phoneRaw
  if (phone.startsWith("0")) phone = "254" + phone.slice(1)
  else if (phone.startsWith("7") || phone.startsWith("1")) phone = "254" + phone
  const itemSummary = order.items
    .map((item) => `• ${item.product.name} x${item.quantity}`)
    .join("\n")
  const message =
    `Hello ${order.customer.firstName}, your order ${order.orderNumber} from ${businessName} is READY for pickup!\n\n` +
    `Items:\n${itemSummary}\n\nTotal: ${formatPrice(order.total)}\n\n` +
    `Pickup location:\n${pickupLocation}\n\nPlease come over with your order number. Thank you!`
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
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
  const [currentUser, setCurrentUser] = useState<AdminUserItem | null>(null)
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [allReviews, setAllReviews] = useState<ReviewItem[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [report, setReport] = useState<SalesReportData | null>(null)
  const [reportRange, setReportRange] = useState<number>(30)
  const [reportLoading, setReportLoading] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)
  const [adminUsers, setAdminUsers] = useState<AdminUserItem[]>([])
  const [adminUsersLoading, setAdminUsersLoading] = useState(false)
  const [adminUsersError, setAdminUsersError] = useState<string | null>(null)
  const [adminFormOpen, setAdminFormOpen] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<AdminUserItem | null>(null)
  const [adminForm, setAdminForm] = useState<{ username: string; fullName: string; password: string; role: AdminRole }>({
    username: "",
    fullName: "",
    password: "",
    role: "staff",
  })
  const [savingAdmin, setSavingAdmin] = useState(false)
  const [adminDataError, setAdminDataError] = useState<string | null>(null)
  const [adminDataLoading, setAdminDataLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null)
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
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [uploadingHeroImage, setUploadingHeroImage] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingHeroVideo, setUploadingHeroVideo] = useState(false)
  const [uploadingHeroGalleryImage, setUploadingHeroGalleryImage] = useState(false)
  const [uploadingHeroGalleryVideo, setUploadingHeroGalleryVideo] = useState(false)
  const [newGalleryImageUrl, setNewGalleryImageUrl] = useState("")
  const [newGalleryVideoUrl, setNewGalleryVideoUrl] = useState("")
  const [uploadingBrandLogo, setUploadingBrandLogo] = useState(false)
  const [newBrandLogoUrl, setNewBrandLogoUrl] = useState("")
  const [extraImageUrl, setExtraImageUrl] = useState("")
  const [pickupInputs, setPickupInputs] = useState<Record<string, string>>({})
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null)
  const [reviewEditForm, setReviewEditForm] = useState({ name: "", rating: 5, comment: "" })
  const [reviewAddOpen, setReviewAddOpen] = useState(false)
  const [reviewAddForm, setReviewAddForm] = useState({ productId: "", name: "", rating: 5, comment: "" })
  const [savingReview, setSavingReview] = useState(false)
  const [offerProductPicker, setOfferProductPicker] = useState<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (res) => {
        if (cancelled) return
        if (!res.ok) {
          router.replace("/admin")
          return
        }
        const payload = await res.json().catch(() => ({}))
        if (payload?.user) setCurrentUser(payload.user as AdminUserItem)
      })
      .catch(() => {
        if (!cancelled) router.replace("/admin")
      })
    return () => {
      cancelled = true
    }
  }, [router])

  useEffect(() => {
    setSettingsForm(settings)
  }, [settings])

  useEffect(() => {
    loadAdminData()
  }, [])

  useEffect(() => {
    if (tab === "analytics") loadAnalytics()
    if (tab === "reports") loadReport(reportRange)
    if (tab === "admins") loadAdminUsers()
  }, [tab])

  useEffect(() => {
    if (tab === "reports") loadReport(reportRange)
  }, [reportRange])

  async function loadAdminData() {
    setAdminDataLoading(true)
    setAdminDataError(null)
    try {
      const response = await fetch("/api/admin/data", { cache: "no-store" })
      const text = await response.text()
      let payload: any = null
      try { payload = text ? JSON.parse(text) : null } catch { /* keep raw text */ }
      if (!response.ok) {
        const detail = payload?.error || text?.slice(0, 200) || `HTTP ${response.status}`
        throw new Error(detail)
      }
      setOrders(payload?.orders || [])
      setAllReviews(payload?.allReviews || [])
      // The API may include a partial-failure warning (e.g. orders query
      // timed out but store data loaded). Surface it without blocking the UI.
      if (payload?.warning) {
        setAdminDataError(`Partial load: ${payload.warning}`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load admin data"
      setAdminDataError(message)
    } finally {
      setAdminDataLoading(false)
    }
  }

  async function loadAnalytics() {
    setAnalyticsLoading(true)
    setAnalyticsError(null)
    try {
      const response = await fetch("/api/admin/analytics", { cache: "no-store" })
      const text = await response.text()
      let payload: any = null
      try { payload = text ? JSON.parse(text) : null } catch { /* keep raw text */ }
      if (!response.ok) {
        const detail = payload?.error || text?.slice(0, 200) || `HTTP ${response.status}`
        throw new Error(detail)
      }
      if (!payload || !payload.analytics) {
        throw new Error("Server returned no analytics data")
      }
      setAnalytics(payload.analytics)
      // Backend now degrades gracefully and may include a `warning` field
      // when some queries failed. Show it as a soft notice, not a blocker.
      if (payload.warning) {
        setAnalyticsError(`Partial data: ${payload.warning}`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load analytics"
      setAnalyticsError(message)
      setAnalytics(null)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  function showToast(message: string, tone: "success" | "error" = "success") {
    setToast({ message, tone })
    const duration = tone === "error" ? 6000 : 4000
    setTimeout(() => setToast(null), duration)
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {}
    router.push("/admin")
  }

  async function loadReport(range: number) {
    setReportLoading(true)
    setReportError(null)
    try {
      const res = await fetch(`/api/admin/reports?range=${range}`, { cache: "no-store" })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload?.error || `HTTP ${res.status}`)
      setReport(payload.report as SalesReportData)
    } catch (err) {
      setReportError(err instanceof Error ? err.message : "Unable to load report")
      setReport(null)
    } finally {
      setReportLoading(false)
    }
  }

  async function loadAdminUsers() {
    setAdminUsersLoading(true)
    setAdminUsersError(null)
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload?.error || `HTTP ${res.status}`)
      setAdminUsers((payload.users || []) as AdminUserItem[])
    } catch (err) {
      setAdminUsersError(err instanceof Error ? err.message : "Unable to load admins")
    } finally {
      setAdminUsersLoading(false)
    }
  }

  function openAddAdmin() {
    setEditingAdmin(null)
    setAdminForm({ username: "", fullName: "", password: "", role: "staff" })
    setAdminFormOpen(true)
  }

  function openEditAdmin(user: AdminUserItem) {
    setEditingAdmin(user)
    setAdminForm({ username: user.username, fullName: user.fullName, password: "", role: user.role })
    setAdminFormOpen(true)
  }

  async function saveAdmin(e: React.FormEvent) {
    e.preventDefault()
    setSavingAdmin(true)
    try {
      if (editingAdmin) {
        const body: Record<string, unknown> = { id: editingAdmin.id, fullName: adminForm.fullName, role: adminForm.role }
        if (adminForm.password) body.password = adminForm.password
        const res = await csrfFetch("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        const payload = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(payload?.error || "Update failed")
        showToast(`✓ ${adminForm.username || editingAdmin.username} updated`)
      } else {
        const res = await csrfFetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(adminForm),
        })
        const payload = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(payload?.error || "Create failed")
        showToast(`✓ Admin "${adminForm.username}" created`)
      }
      setAdminFormOpen(false)
      await loadAdminUsers()
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Save failed", "error")
    } finally {
      setSavingAdmin(false)
    }
  }

  async function removeAdmin(user: AdminUserItem) {
    if (!confirm(`Delete admin "${user.username}"? This cannot be undone.`)) return
    try {
      const res = await csrfFetch(`/api/admin/users?id=${user.id}`, { method: "DELETE" })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload?.error || "Delete failed")
      showToast(`Admin "${user.username}" deleted`)
      await loadAdminUsers()
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Delete failed", "error")
    }
  }

  async function generateRecoveryCode(user: AdminUserItem) {
    const message = user.hasRecoveryCode
      ? `Replace the existing recovery code for "${user.username}"?\n\nThe old code will stop working immediately.`
      : `Generate a recovery code for "${user.username}"?\n\nThis code lets the user reset their password without help.`
    if (!confirm(message)) return
    try {
      const res = await csrfFetch("/api/admin/users/recovery-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload?.error || "Could not generate recovery code")
      const code = payload.recoveryCode as string
      window.prompt(
        `Recovery code for "${user.username}".\n\nSave this somewhere safe NOW — it will not be shown again.\n\nUse it on the "Forgot password?" page to reset the password.`,
        code
      )
      await loadAdminUsers()
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not generate recovery code", "error")
    }
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
  const newOrders = orders.filter((order) => order.status === "new" || order.status === "pending_payment")

  function openAddProduct() {
    setEditingProduct(null)
    setProductForm({ ...emptyProduct, id: `prod-${Date.now()}`, images: [] })
    setImageMode("url")
    setVideoMode("url")
    setExtraImageUrl("")
    setProductFormOpen(true)
  }

  function openEditProduct(product: Product) {
    setEditingProduct(product)
    setProductForm({ ...emptyProduct, ...product, images: [...(product.images || [])] })
    setImageMode("url")
    setVideoMode("url")
    setExtraImageUrl("")
    setProductFormOpen(true)
  }

  function openHomePreview() {
    if (typeof window !== "undefined") {
      window.open("/", "_blank", "noopener,noreferrer")
    }
  }

  async function saveProduct(e: React.FormEvent, andPreview = false) {
    e.preventDefault()
    const product: Product = {
      ...productForm,
      price: Number(productForm.price) || 0,
      originalPrice: productForm.originalPrice ? Number(productForm.originalPrice) : undefined,
      rating: Number(productForm.rating) || 4.5,
      reviews: Number(productForm.reviews) || 0,
      stock: Number(productForm.stock) || 0,
      size: productForm.size || undefined,
      color: productForm.color || undefined,
      badge: productForm.badge || undefined,
      offerType: productForm.offerType || "",
      videoUrl: productForm.videoUrl || undefined,
      images: (productForm.images || []).filter(Boolean),
    }
    if (!product.id || !product.name || !product.category || !product.brand || !product.image) {
      const missing: string[] = []
      if (!product.name) missing.push("name")
      if (!product.category) missing.push("category")
      if (!product.brand) missing.push("brand")
      if (!product.image) missing.push("main image")
      showToast(`Missing required fields: ${missing.join(", ")}`, "error")
      return
    }

    try {
      const wasEditing = Boolean(editingProduct)
      if (wasEditing) await updateProduct(product)
      else await addProduct(product)
      setProductFormOpen(false)
      await refreshStore()
      showToast(wasEditing ? `✓ "${product.name}" updated successfully` : `✓ "${product.name}" added successfully — now live on your store`)
      if (andPreview) openHomePreview()
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to save product", "error")
    }
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

  async function uploadFile(file: File): Promise<string> {
    const fd = new FormData()
    fd.append("file", file)
    const res = await csrfFetch("/api/upload", { method: "POST", body: fd })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Upload failed")
    return data.url as string
  }

  async function handleFileUpload(file: File, type: "image" | "video", onSuccess: (url: string) => void) {
    const setter = type === "image" ? setUploadingImage : setUploadingVideo
    setter(true)
    try {
      const url = await uploadFile(file)
      onSuccess(url)
      showToast(`${type === "image" ? "Image" : "Video"} uploaded`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setter(false)
    }
  }

  async function handleGalleryFiles(files: FileList) {
    setUploadingGallery(true)
    try {
      const uploaded: string[] = []
      for (const file of Array.from(files)) {
        const url = await uploadFile(file)
        uploaded.push(url)
      }
      setProductForm((prev) => ({ ...prev, images: [...(prev.images || []), ...uploaded] }))
      showToast(`Added ${uploaded.length} image(s) to gallery`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploadingGallery(false)
    }
  }

  function addExtraImage() {
    if (!extraImageUrl.trim()) return
    setProductForm((prev) => ({ ...prev, images: [...(prev.images || []), extraImageUrl.trim()] }))
    setExtraImageUrl("")
  }

  function removeGalleryImage(index: number) {
    setProductForm((prev) => ({ ...prev, images: (prev.images || []).filter((_, i) => i !== index) }))
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

  async function saveSiteSettings(e: React.FormEvent, andPreview = false) {
    e.preventDefault()
    try {
      await updateSettings(settingsForm)
      await refreshStore()
      showToast("✓ Homepage & site settings saved — changes are now live")
      if (andPreview) openHomePreview()
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to save settings", "error")
    }
  }

  async function changeOrderStatus(orderNumber: string, status: string) {
    const data = await adminAction("updateOrderStatus", { orderNumber, status })
    setOrders(data.orders || [])
    showToast("Order status updated")
  }

  async function deleteOrderRow(orderNumber: string) {
    if (!confirm("Delete this order permanently?")) return
    const data = await adminAction("deleteOrder", { orderNumber })
    setOrders(data.orders || [])
    showToast("Order deleted")
  }

  async function clearAllOrders() {
    if (!confirm(`Delete all ${orders.length} orders? This cannot be undone.`)) return
    for (const order of orders) {
      await adminAction("deleteOrder", { orderNumber: order.orderNumber }).catch(() => {})
    }
    await loadAdminData()
    showToast("All orders cleared")
  }

  async function markPaid(orderNumber: string) {
    const data = await adminAction("markOrderPaid", { orderNumber })
    setOrders(data.orders || [])
    showToast("Order marked as paid")
  }

  async function markReadyAndDispatch(order: OrderRecord) {
    const pickupLocation = (pickupInputs[order.orderNumber] || settings.pickupLocation || "").trim()
    if (!pickupLocation) {
      showToast("Enter a pickup location first")
      return
    }
    const dispatchUrl = buildDispatchWhatsAppUrl(order, pickupLocation, settings.businessName || "Munex Electronics")
    await adminAction("markOrderReady", { orderNumber: order.orderNumber, pickupLocation })
    const data = await adminAction("markOrderDispatched", { orderNumber: order.orderNumber, customerWhatsappUrl: dispatchUrl })
    setOrders(data.orders || [])
    showToast("Customer notified — WhatsApp opened")
    window.open(dispatchUrl, "_blank")
  }

  async function deleteReview(id: number) {
    if (!confirm("Delete this review?")) return
    const data = await adminAction("deleteReview", { id })
    setAllReviews(data.allReviews || [])
    await refreshStore()
    showToast("Review deleted")
  }

  function openEditReview(review: ReviewItem) {
    setEditingReviewId(review.id)
    setReviewEditForm({ name: review.name, rating: review.rating, comment: review.comment })
  }

  async function saveReviewEdit() {
    if (editingReviewId === null) return
    const data = await adminAction("updateReview", {
      id: editingReviewId,
      name: reviewEditForm.name,
      rating: reviewEditForm.rating,
      comment: reviewEditForm.comment,
    })
    setAllReviews(data.allReviews || [])
    setEditingReviewId(null)
    await refreshStore()
    showToast("Review updated")
  }

  function openAddReview() {
    setReviewAddForm({ productId: products[0]?.id || "", name: "", rating: 5, comment: "" })
    setReviewAddOpen(true)
  }

  async function saveNewReview(e: React.FormEvent) {
    e.preventDefault()
    if (!reviewAddForm.productId || !reviewAddForm.name.trim() || !reviewAddForm.comment.trim()) {
      showToast("Please choose a product and fill in name + comment")
      return
    }
    setSavingReview(true)
    try {
      const data = await adminAction("addReview", {
        productId: reviewAddForm.productId,
        name: reviewAddForm.name.trim(),
        rating: reviewAddForm.rating,
        comment: reviewAddForm.comment.trim(),
      })
      setAllReviews(data.allReviews || [])
      setReviewAddOpen(false)
      await refreshStore()
      showToast("Review added")
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to add review")
    } finally {
      setSavingReview(false)
    }
  }

  async function attachProductToOffer(offerValue: string) {
    const productId = offerProductPicker[offerValue]
    if (!productId) {
      showToast("Choose a product first")
      return
    }
    const product = products.find((p) => p.id === productId)
    if (!product) return
    await updateProduct({ ...product, offerType: offerValue as Product["offerType"] })
    setOfferProductPicker((prev) => ({ ...prev, [offerValue]: "" }))
    await refreshStore()
    showToast(`Added "${product.name}" to ${OFFER_TYPES.find((o) => o.value === offerValue)?.label}`)
  }

  async function removeProductFromOffer(product: Product) {
    if (!confirm(`Remove "${product.name}" from this offer?`)) return
    await updateProduct({ ...product, offerType: "" })
    await refreshStore()
    showToast("Removed from offer")
  }

  async function uploadHomepageAsset(file: File, kind: "logo" | "heroImage" | "heroVideo") {
    const setter = kind === "logo" ? setUploadingLogo : kind === "heroImage" ? setUploadingHeroImage : setUploadingHeroVideo
    setter(true)
    try {
      const url = await uploadFile(file)
      const key = kind === "logo" ? "logoUrl" : kind === "heroImage" ? "heroImageUrl" : "heroAdVideoUrl"
      setSettingsForm((prev) => ({ ...prev, [key]: url }))
      await updateSettings({ [key]: url } as Partial<SiteSettings>)
      await refreshStore()
      showToast(`✓ ${kind === "logo" ? "Logo" : kind === "heroImage" ? "Hero image" : "Hero video"} uploaded — now showing on your homepage`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Upload failed", "error")
    } finally {
      setter(false)
    }
  }

  async function persistSettingField(key: keyof SiteSettings, value: unknown, label: string) {
    try {
      setSettingsForm((prev) => ({ ...prev, [key]: value as never }))
      await updateSettings({ [key]: value } as Partial<SiteSettings>)
      await refreshStore()
      showToast(`✓ ${label} saved — live on your homepage`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : `Failed to save ${label}`, "error")
    }
  }

  async function addHeroGalleryImage(url: string) {
    const trimmed = url.trim()
    if (!trimmed) return
    const next = [...(settingsForm.heroGalleryImages || []), trimmed]
    await persistSettingField("heroGalleryImages", next, "Homepage gallery image")
    setNewGalleryImageUrl("")
  }

  async function uploadHeroGalleryFiles(files: FileList) {
    setUploadingHeroGalleryImage(true)
    try {
      const uploads: string[] = []
      for (const file of Array.from(files)) {
        const url = await uploadFile(file)
        uploads.push(url)
      }
      const next = [...(settingsForm.heroGalleryImages || []), ...uploads]
      await persistSettingField("heroGalleryImages", next, `${uploads.length} homepage image${uploads.length === 1 ? "" : "s"}`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Upload failed", "error")
    } finally {
      setUploadingHeroGalleryImage(false)
    }
  }

  async function removeHeroGalleryImage(index: number) {
    const next = (settingsForm.heroGalleryImages || []).filter((_, i) => i !== index)
    await persistSettingField("heroGalleryImages", next, "Homepage gallery image removed")
  }

  async function moveHeroGalleryImage(index: number, dir: -1 | 1) {
    const arr = [...(settingsForm.heroGalleryImages || [])]
    const target = index + dir
    if (target < 0 || target >= arr.length) return
    ;[arr[index], arr[target]] = [arr[target], arr[index]]
    await persistSettingField("heroGalleryImages", arr, "Image order")
  }

  async function addHeroGalleryVideo(url: string) {
    const trimmed = url.trim()
    if (!trimmed) return
    const next = [...(settingsForm.heroGalleryVideos || []), trimmed]
    await persistSettingField("heroGalleryVideos", next, "Homepage video")
    setNewGalleryVideoUrl("")
  }

  async function uploadHeroGalleryVideoFile(file: File) {
    setUploadingHeroGalleryVideo(true)
    try {
      const url = await uploadFile(file)
      const next = [...(settingsForm.heroGalleryVideos || []), url]
      await persistSettingField("heroGalleryVideos", next, "Homepage video uploaded")
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Upload failed", "error")
    } finally {
      setUploadingHeroGalleryVideo(false)
    }
  }

  async function removeHeroGalleryVideo(index: number) {
    const next = (settingsForm.heroGalleryVideos || []).filter((_, i) => i !== index)
    await persistSettingField("heroGalleryVideos", next, "Homepage video removed")
  }

  async function moveHeroGalleryVideo(index: number, dir: -1 | 1) {
    const arr = [...(settingsForm.heroGalleryVideos || [])]
    const target = index + dir
    if (target < 0 || target >= arr.length) return
    ;[arr[index], arr[target]] = [arr[target], arr[index]]
    await persistSettingField("heroGalleryVideos", arr, "Video order")
  }

  async function addBrandLogo(url: string) {
    const trimmed = url.trim()
    if (!trimmed) return
    const next = [...(settingsForm.brandLogos || []), trimmed]
    await persistSettingField("brandLogos", next, "Brand logo")
    setNewBrandLogoUrl("")
  }

  async function uploadBrandLogoFiles(files: FileList) {
    setUploadingBrandLogo(true)
    try {
      const uploads: string[] = []
      for (const file of Array.from(files)) {
        const url = await uploadFile(file)
        uploads.push(url)
      }
      const next = [...(settingsForm.brandLogos || []), ...uploads]
      await persistSettingField("brandLogos", next, `${uploads.length} brand logo${uploads.length === 1 ? "" : "s"}`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Upload failed", "error")
    } finally {
      setUploadingBrandLogo(false)
    }
  }

  async function removeBrandLogo(index: number) {
    const next = (settingsForm.brandLogos || []).filter((_, i) => i !== index)
    await persistSettingField("brandLogos", next, "Brand logo removed")
  }

  async function moveBrandLogo(index: number, dir: -1 | 1) {
    const arr = [...(settingsForm.brandLogos || [])]
    const target = index + dir
    if (target < 0 || target >= arr.length) return
    ;[arr[index], arr[target]] = [arr[target], arr[index]]
    await persistSettingField("brandLogos", arr, "Brand order")
  }

  const tabs: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: "products", label: "Products & Stock", icon: <Package className="h-4 w-4" /> },
    { id: "categories", label: "Categories", icon: <Tag className="h-4 w-4" /> },
    { id: "orders", label: "Orders", icon: <ShoppingBag className="h-4 w-4" /> },
    { id: "offers", label: "Offers", icon: <Gift className="h-4 w-4" /> },
    { id: "reviews", label: "Reviews", icon: <Star className="h-4 w-4" /> },
    { id: "reports", label: "Sales Reports", icon: <BarChart3 className="h-4 w-4" /> },
    { id: "analytics", label: "Analytics", icon: <Activity className="h-4 w-4" /> },
    ...(currentUser?.role === "owner"
      ? ([{ id: "admins" as Tab, label: "Admin Users", icon: <ShieldCheck className="h-4 w-4" /> }])
      : []),
    { id: "settings", label: "Homepage & Settings", icon: <Settings className="h-4 w-4" /> },
  ]

  return (
    <div className="min-h-screen bg-background">
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed left-1/2 top-4 z-[100] flex max-w-md -translate-x-1/2 items-center gap-3 rounded-xl px-5 py-3.5 text-sm font-semibold shadow-2xl ring-1 transition-all ${
            toast.tone === "error"
              ? "bg-red-600 text-white ring-red-400"
              : "bg-green-600 text-white ring-green-400"
          }`}
        >
          {toast.tone === "error" ? <X className="h-5 w-5 shrink-0" /> : <Check className="h-5 w-5 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-base font-bold text-foreground">{settings.businessName || "Munex"} Admin</span>
              {newOrders.length > 0 && <span className="ml-2 rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">{newOrders.length} new</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {currentUser && (
              <span className="hidden items-center gap-1.5 rounded-lg border border-border bg-secondary px-2.5 py-1.5 text-xs font-medium text-muted-foreground sm:inline-flex">
                <Users className="h-3.5 w-3.5" />
                {currentUser.username}
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${currentUser.role === "owner" ? "bg-primary/20 text-primary" : "bg-muted text-foreground/70"}`}>
                  {currentUser.role}
                </span>
              </span>
            )}
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

        {adminDataError && (
          <div className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-red-500/40 bg-red-500/10 p-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-red-500">Couldn't load orders &amp; reviews</p>
              <p className="mt-1 break-all text-xs text-red-400">{adminDataError}</p>
            </div>
            <button
              onClick={() => loadAdminData()}
              disabled={adminDataLoading}
              className="shrink-0 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
            >
              {adminDataLoading ? "Retrying…" : "Try again"}
            </button>
          </div>
        )}

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
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${order.status === "new" || order.status === "pending_payment" ? "bg-red-600/20 text-red-500" : order.status === "delivered" ? "bg-green-600/20 text-green-500" : "bg-secondary text-muted-foreground"}`}>{order.status}</span>
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
                  <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3 text-left">Product</th><th className="px-4 py-3 text-left">Category</th><th className="px-4 py-3 text-left">Price</th><th className="px-4 py-3 text-left">Stock</th><th className="px-4 py-3 text-left">Photos</th><th className="px-4 py-3 text-left">Offer</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
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
                        <td className="px-4 py-3 text-muted-foreground">{1 + (product.images?.length || 0)}{product.videoUrl ? " + video" : ""}</td>
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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">{orders.length} orders</p>
              {orders.length > 0 && (
                <button onClick={clearAllOrders} className="rounded-lg border border-destructive/50 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10">
                  Clear all orders
                </button>
              )}
            </div>
            {orders.length === 0 ? <p className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">No orders yet.</p> : orders.map((order) => {
              const pickupValue = pickupInputs[order.orderNumber] !== undefined ? pickupInputs[order.orderNumber] : (order.pickupLocation || settings.pickupLocation || "")
              return (
                <div key={order.orderNumber} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-foreground">{order.orderNumber}</h3>
                      <p className="text-sm text-muted-foreground">{order.customer.firstName} {order.customer.lastName} · {order.customer.phone} · {new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select value={order.status} onChange={(e) => changeOrderStatus(order.orderNumber, e.target.value)} className="h-9 rounded-lg border border-border bg-secondary px-3 text-sm text-foreground">{ORDER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select>
                      <button onClick={() => deleteOrderRow(order.orderNumber)} className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Delete order">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Items</p>
                      {order.items.map((item) => <p key={item.product.id} className="mt-1 text-sm text-foreground">{item.product.name} x{item.quantity} — {formatPrice(item.product.price * item.quantity)}</p>)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Delivery & Payment</p>
                      <p className="mt-1 text-sm text-foreground">{order.customer.address}, {order.customer.city}</p>
                      <p className="text-sm text-foreground">{order.paymentMethod}{order.mpesaCode ? ` · ${order.mpesaCode}` : ""}</p>
                      <p className="mt-2 font-bold text-foreground">{formatPrice(order.total)}</p>
                      <a href={order.whatsappUrl} target="_blank" className="mt-3 inline-flex rounded-lg bg-[#25D366] px-3 py-2 text-xs font-semibold text-white">Open WhatsApp message</a>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 rounded-xl border border-border bg-secondary/40 p-4 lg:grid-cols-2">
                    <div>
                      <Label>Pickup location / instructions</Label>
                      <textarea
                        value={pickupValue}
                        onChange={(e) => setPickupInputs((prev) => ({ ...prev, [order.orderNumber]: e.target.value }))}
                        className="min-h-20 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder={settings.pickupLocation || "e.g. Munex Electronics, Narok Town, Main Street"}
                      />
                    </div>
                    <div className="flex flex-col justify-between gap-2">
                      <div className="flex flex-wrap gap-2">
                        {order.paidAt && <span className="rounded-full bg-green-600/20 px-2 py-0.5 text-xs font-semibold text-green-600">Paid {new Date(order.paidAt).toLocaleDateString()}</span>}
                        {order.readyAt && <span className="rounded-full bg-blue-600/20 px-2 py-0.5 text-xs font-semibold text-blue-500">Ready {new Date(order.readyAt).toLocaleDateString()}</span>}
                        {order.dispatchedAt && <span className="rounded-full bg-emerald-600/20 px-2 py-0.5 text-xs font-semibold text-emerald-500">Dispatched {new Date(order.dispatchedAt).toLocaleDateString()}</span>}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {!order.paidAt && order.paymentMethod === "mpesa" && (
                          <button onClick={() => markPaid(order.orderNumber)} className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700">
                            <Check className="h-3.5 w-3.5" />Mark Paid
                          </button>
                        )}
                        <button onClick={() => markReadyAndDispatch(order)} className="flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-2 text-xs font-semibold text-white hover:opacity-90">
                          <Truck className="h-3.5 w-3.5" />Mark Ready & WhatsApp Customer
                        </button>
                        {order.customerWhatsappUrl && (
                          <a href={order.customerWhatsappUrl} target="_blank" className="flex items-center gap-1.5 rounded-lg border border-[#25D366] px-3 py-2 text-xs font-semibold text-[#25D366] hover:bg-[#25D366]/10">
                            <MessageCircle className="h-3.5 w-3.5" />Re-open dispatch message
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {tab === "offers" && (
          <div className="grid gap-4 lg:grid-cols-3">
            {OFFER_TYPES.filter((offer) => offer.value).map((offer) => {
              const inOffer = products.filter((p) => p.offerType === offer.value)
              const available = products.filter((p) => p.offerType !== offer.value)
              const pickerValue = offerProductPicker[offer.value] || ""
              return (
                <div key={offer.value} className="rounded-xl border border-border bg-card p-5">
                  <h3 className="font-bold text-foreground">{offer.label}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{inOffer.length} product{inOffer.length === 1 ? "" : "s"} in this slot</p>

                  <div className="mt-4 flex gap-2">
                    <select
                      value={pickerValue}
                      onChange={(e) => setOfferProductPicker((prev) => ({ ...prev, [offer.value]: e.target.value }))}
                      className="h-9 flex-1 rounded-lg border border-border bg-secondary px-2 text-xs text-foreground"
                    >
                      <option value="">+ Add product…</option>
                      {available.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <button
                      onClick={() => attachProductToOffer(offer.value)}
                      disabled={!pickerValue}
                      className="rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>

                  <div className="mt-4 space-y-2">
                    {inOffer.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted-foreground">No products yet</p>
                    ) : inOffer.map((product) => (
                      <div key={product.id} className="flex items-center gap-2 rounded-lg bg-secondary p-2">
                        {product.image && <img src={product.image} alt="" className="h-10 w-10 rounded object-cover" />}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{formatPrice(product.price)}</p>
                        </div>
                        <button onClick={() => openEditProduct(product)} title="Edit product" className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => removeProductFromOffer(product)} title="Remove from offer" className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {tab === "reviews" && (
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">Customer Reviews</h2>
                <p className="text-xs text-muted-foreground">{allReviews.length} review{allReviews.length === 1 ? "" : "s"} total</p>
              </div>
              <button
                onClick={openAddReview}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                <Plus className="h-4 w-4" /> Add Review
              </button>
            </div>
            {allReviews.length === 0 ? <p className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">No reviews yet. Click "Add Review" to create one.</p> : allReviews.map((review) => {
              const product = products.find((p) => p.id === review.productId)
              const isEditing = editingReviewId === review.id
              return (
                <div key={review.id} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <Input value={reviewEditForm.name} onChange={(e) => setReviewEditForm({ ...reviewEditForm, name: e.target.value })} placeholder="Reviewer name" />
                      ) : (
                        <p className="font-semibold text-foreground">{review.name}</p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">{product?.name || review.productId} · {new Date(review.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <select
                          value={reviewEditForm.rating}
                          onChange={(e) => setReviewEditForm({ ...reviewEditForm, rating: Number(e.target.value) })}
                          className="h-9 rounded-lg border border-border bg-secondary px-2 text-sm text-foreground"
                        >
                          {[1, 2, 3, 4, 5].map((r) => <option key={r} value={r}>{r} ★</option>)}
                        </select>
                      ) : (
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-4 w-4 ${i < review.rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`} />
                          ))}
                        </div>
                      )}
                      {isEditing ? (
                        <>
                          <button onClick={saveReviewEdit} className="rounded-lg bg-primary p-2 text-primary-foreground" title="Save">
                            <Check className="h-4 w-4" />
                          </button>
                          <button onClick={() => setEditingReviewId(null)} className="rounded-lg border border-border p-2 text-muted-foreground hover:text-foreground" title="Cancel">
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => openEditReview(review)} className="rounded-lg border border-border p-2 text-muted-foreground hover:text-foreground" title="Edit review">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => deleteReview(review.id)} className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Delete review">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {isEditing ? (
                    <textarea
                      value={reviewEditForm.comment}
                      onChange={(e) => setReviewEditForm({ ...reviewEditForm, comment: e.target.value })}
                      rows={3}
                      className="mt-3 w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  ) : (
                    <p className="mt-2 text-sm text-foreground">{review.comment}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {tab === "analytics" && (
          <div className="grid gap-4">
            {analyticsError && !analytics ? (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-5">
                <p className="text-sm font-semibold text-red-500">Couldn't load analytics</p>
                <p className="mt-1 text-xs text-red-400 break-all">{analyticsError}</p>
                <button
                  onClick={() => loadAnalytics()}
                  disabled={analyticsLoading}
                  className="mt-3 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                >
                  {analyticsLoading ? "Retrying…" : "Try again"}
                </button>
              </div>
            ) : !analytics ? <p className="text-sm text-muted-foreground">Loading analytics…</p> : (
              <>
                {analyticsError && (
                  <div className="flex items-start justify-between gap-3 rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-yellow-500">Showing what we could load</p>
                      <p className="mt-1 break-all text-xs text-yellow-400/80">{analyticsError}</p>
                    </div>
                    <button
                      onClick={() => loadAnalytics()}
                      disabled={analyticsLoading}
                      className="shrink-0 rounded-lg border border-yellow-500/60 px-3 py-1.5 text-xs font-semibold text-yellow-300 hover:bg-yellow-500/20 disabled:opacity-50"
                    >
                      {analyticsLoading ? "Refreshing…" : "Refresh"}
                    </button>
                  </div>
                )}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                  <Stat title="Total views" value={analytics.totalViews} />
                  <Stat title="Unique visitors" value={analytics.uniqueVisitors} />
                  <Stat title="Last 24h" value={analytics.viewsLast24h} />
                  <Stat title="Last 7 days" value={analytics.viewsLast7d} />
                  <Stat title="Last 30 days" value={analytics.viewsLast30d} />
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <AnalyticsCard title="Top pages" rows={analytics.topPages.map((r) => ({ label: r.path, value: r.views }))} />
                  <AnalyticsCard title="Top countries" rows={analytics.topCountries.map((r) => ({ label: r.label, value: r.views }))} />
                  <AnalyticsCard title="Top cities" rows={analytics.topCities.map((r) => ({ label: r.label, value: r.views }))} />
                  <AnalyticsCard title="Top referrers" rows={analytics.topReferrers.map((r) => ({ label: r.label, value: r.views }))} />
                </div>
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="mb-3 font-bold text-foreground">Daily views (last 14 days)</h3>
                  {analytics.dailySeries.length === 0 ? <p className="text-sm text-muted-foreground">No data yet.</p> : (
                    <div className="flex h-32 items-end gap-2">
                      {analytics.dailySeries.map((d) => {
                        const max = Math.max(...analytics.dailySeries.map((x) => x.views), 1)
                        const height = Math.round((d.views / max) * 100)
                        return (
                          <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                            <div className="w-full rounded-t bg-primary/80" style={{ height: `${height}%`, minHeight: 2 }} title={`${d.day}: ${d.views} views`} />
                            <span className="truncate text-[10px] text-muted-foreground">{d.day.slice(5)}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="mb-3 font-bold text-foreground">Recent visits</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
                        <tr><th className="px-3 py-2 text-left">When</th><th className="px-3 py-2 text-left">Page</th><th className="px-3 py-2 text-left">Country</th><th className="px-3 py-2 text-left">City</th><th className="px-3 py-2 text-left">Referrer</th></tr>
                      </thead>
                      <tbody>
                        {analytics.recentVisits.map((visit, i) => (
                          <tr key={i} className="border-t border-border">
                            <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(visit.createdAt).toLocaleString()}</td>
                            <td className="px-3 py-2 text-xs text-foreground">{visit.path}</td>
                            <td className="px-3 py-2 text-xs text-foreground">{visit.country}</td>
                            <td className="px-3 py-2 text-xs text-foreground">{visit.city}</td>
                            <td className="px-3 py-2 text-xs text-muted-foreground">{visit.referrer}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {tab === "reports" && (
          <div className="grid gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">Sales Reports</h2>
                <p className="text-xs text-muted-foreground">Revenue, top products, and order trends over the selected period.</p>
              </div>
              <div className="flex gap-2 rounded-lg border border-border bg-card p-1">
                {[7, 30, 90, 365].map((days) => (
                  <button
                    key={days}
                    onClick={() => setReportRange(days)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold ${reportRange === days ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {days === 365 ? "1 year" : `${days} days`}
                  </button>
                ))}
              </div>
            </div>

            {reportError && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-500">
                {reportError}
              </div>
            )}

            {reportLoading && !report ? (
              <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">Loading report…</div>
            ) : report ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Stat title={`Revenue (${report.range}d)`} value={formatPrice(report.totalRevenue)} />
                  <Stat title="Confirmed Revenue" value={formatPrice(report.paidRevenue)} />
                  <Stat title="Orders" value={report.totalOrders} />
                  <Stat title="Avg Order Value" value={formatPrice(Math.round(report.averageOrderValue))} />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Stat title="Paid / Confirmed" value={report.paidOrders} />
                  <Stat title="Pending" value={report.pendingOrders} tone={report.pendingOrders ? "warning" : "normal"} />
                  <Stat title="Other statuses" value={Math.max(0, report.totalOrders - report.paidOrders - report.pendingOrders)} />
                </div>

                <section className="rounded-xl border border-border bg-card p-5">
                  <h3 className="mb-3 text-base font-bold text-foreground">Daily Revenue</h3>
                  {report.revenueByDay.every((d) => d.revenue === 0) ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">No revenue recorded in this period yet.</p>
                  ) : (
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={report.revenueByDay}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={Math.max(0, Math.floor(report.revenueByDay.length / 8) - 1)} />
                          <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                          <Tooltip formatter={(value: number) => formatPrice(value)} />
                          <Bar dataKey="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </section>

                <div className="grid gap-4 lg:grid-cols-2">
                  <section className="rounded-xl border border-border bg-card p-5">
                    <h3 className="mb-3 text-base font-bold text-foreground">Top Products</h3>
                    {report.topProducts.length === 0 ? (
                      <p className="py-6 text-center text-sm text-muted-foreground">No sales recorded yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                              <th className="py-2">Product</th>
                              <th className="py-2 text-right">Qty</th>
                              <th className="py-2 text-right">Revenue</th>
                            </tr>
                          </thead>
                          <tbody>
                            {report.topProducts.map((p) => (
                              <tr key={p.id || p.name} className="border-b border-border/50">
                                <td className="py-2 pr-2 text-foreground">{p.name}</td>
                                <td className="py-2 text-right text-muted-foreground">{p.quantity}</td>
                                <td className="py-2 text-right font-semibold text-foreground">{formatPrice(p.revenue)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  <section className="rounded-xl border border-border bg-card p-5">
                    <h3 className="mb-3 text-base font-bold text-foreground">Order Status Breakdown</h3>
                    {Object.keys(report.statusCounts).length === 0 ? (
                      <p className="py-6 text-center text-sm text-muted-foreground">No orders to break down.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {Object.entries(report.statusCounts).map(([status, count]) => (
                          <div key={status} className="rounded-lg border border-border bg-secondary p-3">
                            <div className="text-xs uppercase tracking-wide text-muted-foreground" style={{ color: STATUS_COLORS[status] || undefined }}>
                              {status.replace(/_/g, " ")}
                            </div>
                            <div className="mt-1 text-2xl font-bold text-foreground">{count}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>

                <section className="rounded-xl border border-border bg-card p-5">
                  <h3 className="mb-3 text-base font-bold text-foreground">Sales by Category</h3>
                  {report.salesByCategory.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">No category sales yet.</p>
                  ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={report.salesByCategory} dataKey="revenue" nameKey="category" outerRadius={90} label={(entry: { category: string }) => entry.category}>
                              {report.salesByCategory.map((_, i) => (
                                <Cell key={i} fill={[
                                  "#22c55e", "#3b82f6", "#8b5cf6", "#f97316",
                                  "#ec4899", "#06b6d4", "#eab308", "#ef4444",
                                  "#14b8a6", "#a855f7",
                                ][i % 10]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => formatPrice(value)} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                              <th className="py-2">Category</th>
                              <th className="py-2 text-right">Qty</th>
                              <th className="py-2 text-right">Revenue</th>
                            </tr>
                          </thead>
                          <tbody>
                            {report.salesByCategory.map((row) => (
                              <tr key={row.category} className="border-b border-border/50">
                                <td className="py-2 text-foreground capitalize">{row.category}</td>
                                <td className="py-2 text-right text-muted-foreground">{row.quantity}</td>
                                <td className="py-2 text-right font-semibold text-foreground">{formatPrice(row.revenue)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </section>
              </>
            ) : null}
          </div>
        )}

        {tab === "admins" && currentUser?.role === "owner" && (
          <div className="grid gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">Admin Users</h2>
                <p className="text-xs text-muted-foreground">Add, edit, or remove users who can sign in to this dashboard. Owners can manage other admins; staff can only sign in.</p>
              </div>
              <button onClick={openAddAdmin} className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
                <Plus className="h-4 w-4" /> Add admin
              </button>
            </div>

            {adminUsersError && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-500">{adminUsersError}</div>
            )}

            <div className="overflow-hidden rounded-xl border border-border bg-card">
              {adminUsersLoading && adminUsers.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">Loading…</p>
              ) : adminUsers.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">No admins yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase text-muted-foreground">
                      <th className="px-4 py-3">Username</th>
                      <th className="px-4 py-3">Full name</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Last login</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map((u) => (
                      <tr key={u.id} className="border-b border-border/50 last:border-0">
                        <td className="px-4 py-3 font-semibold text-foreground">
                          {u.username}
                          {u.id === currentUser?.id && <span className="ml-2 rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">YOU</span>}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{u.fullName || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-bold uppercase ${u.role === "owner" ? "bg-primary/20 text-primary" : "bg-secondary text-foreground"}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "Never"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <button onClick={() => openEditAdmin(u)} className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary">
                              <Pencil className="inline h-3 w-3" /> Edit
                            </button>
                            {(currentUser?.role === "owner" || u.id === currentUser?.id) && (
                              <button
                                onClick={() => generateRecoveryCode(u)}
                                className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary"
                                title={u.hasRecoveryCode ? "Replace recovery code" : "Generate recovery code"}
                              >
                                <KeyRound className="inline h-3 w-3" /> {u.hasRecoveryCode ? "New code" : "Recovery code"}
                              </button>
                            )}
                            {u.id !== currentUser?.id && (
                              <button onClick={() => removeAdmin(u)} className="rounded-lg border border-red-500/40 px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-500/10">
                                <Trash2 className="inline h-3 w-3" /> Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {tab === "settings" && (
          <form onSubmit={saveSiteSettings} className="grid gap-6">
            <section className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-3 text-base font-bold text-foreground">Branding & Contact</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Business name</Label>
                  <Input value={settingsForm.businessName} onChange={(e) => setSettingsForm({ ...settingsForm, businessName: e.target.value })} />
                </div>
                <div>
                  <Label>Logo text (shown in navbar)</Label>
                  <Input value={settingsForm.logoText} onChange={(e) => setSettingsForm({ ...settingsForm, logoText: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <Label>Logo image (optional, replaces lightning icon)</Label>
                  <div className="flex flex-wrap items-center gap-3">
                    <Input value={settingsForm.logoUrl} onChange={(e) => setSettingsForm({ ...settingsForm, logoUrl: e.target.value })} placeholder="https://... or upload" />
                    <label className={`flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary ${uploadingLogo ? "opacity-50 pointer-events-none" : ""}`}>
                      <Upload className="h-3.5 w-3.5" />{uploadingLogo ? "Uploading…" : "Upload logo"}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadHomepageAsset(f, "logo") }} />
                    </label>
                    {settingsForm.logoUrl && <img src={settingsForm.logoUrl} alt="logo preview" className="h-12 rounded-lg border border-border object-contain" />}
                  </div>
                </div>
                <div>
                  <Label>WhatsApp / admin number (international)</Label>
                  <Input value={settingsForm.adminPhone} onChange={(e) => setSettingsForm({ ...settingsForm, adminPhone: e.target.value })} placeholder="254720856892" />
                </div>
                <div>
                  <Label>M-Pesa number</Label>
                  <Input value={settingsForm.mpesaNumber} onChange={(e) => setSettingsForm({ ...settingsForm, mpesaNumber: e.target.value })} placeholder="0720856892" />
                </div>
                <div className="md:col-span-2">
                  <Label>Default pickup location (used in dispatch WhatsApp)</Label>
                  <Input value={settingsForm.pickupLocation} onChange={(e) => setSettingsForm({ ...settingsForm, pickupLocation: e.target.value })} placeholder="Shop address & directions" />
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-3 text-base font-bold text-foreground">Hero Section</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Hero badge</Label>
                  <Input value={settingsForm.heroBadge} onChange={(e) => setSettingsForm({ ...settingsForm, heroBadge: e.target.value })} />
                </div>
                <div>
                  <Label>Hero title</Label>
                  <Input value={settingsForm.heroTitle} onChange={(e) => setSettingsForm({ ...settingsForm, heroTitle: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <Label>Hero subtitle</Label>
                  <Input value={settingsForm.heroSubtitle} onChange={(e) => setSettingsForm({ ...settingsForm, heroSubtitle: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <Label>Hero background image (main slide)</Label>
                  <div className="flex flex-wrap items-center gap-3">
                    <Input
                      value={settingsForm.heroImageUrl}
                      onChange={(e) => setSettingsForm({ ...settingsForm, heroImageUrl: e.target.value })}
                      onBlur={(e) => {
                        const val = e.target.value.trim()
                        if (val !== settings.heroImageUrl) persistSettingField("heroImageUrl", val, "Hero image URL")
                      }}
                      placeholder="https://... or upload"
                    />
                    <label className={`flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary ${uploadingHeroImage ? "opacity-50 pointer-events-none" : ""}`}>
                      <ImageIcon className="h-3.5 w-3.5" />{uploadingHeroImage ? "Uploading…" : "Upload image"}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadHomepageAsset(f, "heroImage") }} />
                    </label>
                  </div>
                  {settingsForm.heroImageUrl && <img src={settingsForm.heroImageUrl} alt="hero preview" className="mt-2 h-32 w-full rounded-lg border border-border object-cover" />}
                  <p className="mt-1 text-xs text-muted-foreground">URL changes save automatically when you click outside the box.</p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-1 text-base font-bold text-foreground">Homepage Hero Gallery Images</h3>
              <p className="mb-3 text-xs text-muted-foreground">Add multiple images to rotate as a slideshow on your homepage hero. Each image saves automatically.</p>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Input
                  value={newGalleryImageUrl}
                  onChange={(e) => setNewGalleryImageUrl(e.target.value)}
                  placeholder="https://image-url.jpg"
                  className="flex-1 min-w-[220px]"
                />
                <button
                  type="button"
                  onClick={() => addHeroGalleryImage(newGalleryImageUrl)}
                  className="rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-secondary"
                >
                  Add URL
                </button>
                <label className={`flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary ${uploadingHeroGalleryImage ? "opacity-50 pointer-events-none" : ""}`}>
                  <Upload className="h-3.5 w-3.5" />
                  {uploadingHeroGalleryImage ? "Uploading…" : "Upload images"}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => { const f = e.target.files; if (f && f.length) uploadHeroGalleryFiles(f) }}
                  />
                </label>
              </div>
              {(settingsForm.heroGalleryImages || []).length === 0 ? (
                <p className="rounded-lg border border-dashed border-border bg-secondary/40 p-4 text-center text-xs text-muted-foreground">
                  No gallery images yet. Add your first image above to start a homepage slideshow.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {(settingsForm.heroGalleryImages || []).map((url, i) => (
                    <div key={`${url}-${i}`} className="group relative overflow-hidden rounded-lg border border-border bg-secondary">
                      <img src={url} alt={`Gallery ${i + 1}`} className="aspect-video w-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/80 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <div className="flex gap-1">
                          <button type="button" onClick={() => moveHeroGalleryImage(i, -1)} disabled={i === 0} className="rounded bg-background/90 px-1.5 py-0.5 text-xs font-bold disabled:opacity-30">←</button>
                          <button type="button" onClick={() => moveHeroGalleryImage(i, 1)} disabled={i === (settingsForm.heroGalleryImages || []).length - 1} className="rounded bg-background/90 px-1.5 py-0.5 text-xs font-bold disabled:opacity-30">→</button>
                        </div>
                        <button type="button" onClick={() => removeHeroGalleryImage(i)} className="rounded bg-red-600 px-1.5 py-0.5 text-xs font-bold text-white hover:bg-red-700">
                          <X className="inline h-3 w-3" />
                        </button>
                      </div>
                      <div className="absolute left-1 top-1 rounded bg-foreground/80 px-1.5 py-0.5 text-[10px] font-bold text-background">#{i + 1}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-1 text-base font-bold text-foreground">Homepage Videos (multiple)</h3>
              <p className="mb-3 text-xs text-muted-foreground">Add multiple YouTube links or upload videos to display in the "Watch More" section. Saves instantly.</p>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Input
                  value={newGalleryVideoUrl}
                  onChange={(e) => setNewGalleryVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=... or https://video.mp4"
                  className="flex-1 min-w-[260px]"
                />
                <button
                  type="button"
                  onClick={() => addHeroGalleryVideo(newGalleryVideoUrl)}
                  className="rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-secondary"
                >
                  Add YouTube / URL
                </button>
                <label className={`flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary ${uploadingHeroGalleryVideo ? "opacity-50 pointer-events-none" : ""}`}>
                  <Video className="h-3.5 w-3.5" />
                  {uploadingHeroGalleryVideo ? "Uploading…" : "Upload video"}
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadHeroGalleryVideoFile(f) }}
                  />
                </label>
              </div>
              {(settingsForm.heroGalleryVideos || []).length === 0 ? (
                <p className="rounded-lg border border-dashed border-border bg-secondary/40 p-4 text-center text-xs text-muted-foreground">
                  No featured videos yet. Add a YouTube link or upload to feature on your homepage.
                </p>
              ) : (
                <div className="space-y-2">
                  {(settingsForm.heroGalleryVideos || []).map((url, i) => (
                    <div key={`${url}-${i}`} className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 p-2">
                      <div className="rounded bg-foreground px-2 py-1 text-[10px] font-bold text-background">#{i + 1}</div>
                      <div className="flex-1 truncate text-xs text-foreground" title={url}>{url}</div>
                      <button type="button" onClick={() => moveHeroGalleryVideo(i, -1)} disabled={i === 0} className="rounded border border-border px-2 py-1 text-xs disabled:opacity-30">↑</button>
                      <button type="button" onClick={() => moveHeroGalleryVideo(i, 1)} disabled={i === (settingsForm.heroGalleryVideos || []).length - 1} className="rounded border border-border px-2 py-1 text-xs disabled:opacity-30">↓</button>
                      <button type="button" onClick={() => removeHeroGalleryVideo(i)} className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700">
                        <X className="inline h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-1 text-base font-bold text-foreground">Featured Brands Carousel</h3>
              <p className="mb-3 text-xs text-muted-foreground">Upload brand logos (Samsung, LG, Sony, Hisense, etc.) to display in a scrolling carousel on the homepage. Add 4+ for an auto-scrolling marquee. Saves instantly.</p>
              <div className="mb-3">
                <Label>Section title</Label>
                <Input
                  value={settingsForm.brandsTitle || ""}
                  onChange={(e) => setSettingsForm({ ...settingsForm, brandsTitle: e.target.value })}
                  onBlur={(e) => persistSettingField("brandsTitle", e.target.value, "Brands section title")}
                  placeholder="Trusted Brands We Stock"
                />
              </div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Input
                  value={newBrandLogoUrl}
                  onChange={(e) => setNewBrandLogoUrl(e.target.value)}
                  placeholder="https://example.com/brand-logo.png"
                  className="flex-1 min-w-[260px]"
                />
                <button
                  type="button"
                  onClick={() => addBrandLogo(newBrandLogoUrl)}
                  className="rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-secondary"
                >
                  Add URL
                </button>
                <label className={`flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary ${uploadingBrandLogo ? "opacity-50 pointer-events-none" : ""}`}>
                  <Upload className="h-3.5 w-3.5" />
                  {uploadingBrandLogo ? "Uploading…" : "Upload logos"}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => { const f = e.target.files; if (f && f.length) uploadBrandLogoFiles(f) }}
                  />
                </label>
              </div>
              {(settingsForm.brandLogos || []).length === 0 ? (
                <p className="rounded-lg border border-dashed border-border bg-secondary/40 p-4 text-center text-xs text-muted-foreground">
                  No brand logos yet. Upload logos to feature trusted brands on your homepage.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {(settingsForm.brandLogos || []).map((url, i) => (
                    <div key={`${url}-${i}`} className="group relative overflow-hidden rounded-lg border border-border bg-white p-3">
                      <img src={url} alt={`Brand ${i + 1}`} className="aspect-video w-full object-contain" />
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/80 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <div className="flex gap-1">
                          <button type="button" onClick={() => moveBrandLogo(i, -1)} disabled={i === 0} className="rounded bg-background/90 px-1.5 py-0.5 text-xs font-bold disabled:opacity-30">←</button>
                          <button type="button" onClick={() => moveBrandLogo(i, 1)} disabled={i === (settingsForm.brandLogos || []).length - 1} className="rounded bg-background/90 px-1.5 py-0.5 text-xs font-bold disabled:opacity-30">→</button>
                        </div>
                        <button type="button" onClick={() => removeBrandLogo(i)} className="rounded bg-red-600 px-1.5 py-0.5 text-xs font-bold text-white hover:bg-red-700">
                          <X className="inline h-3 w-3" />
                        </button>
                      </div>
                      <div className="absolute left-1 top-1 rounded bg-foreground/80 px-1.5 py-0.5 text-[10px] font-bold text-background">#{i + 1}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-3 text-base font-bold text-foreground">Featured Showcase Video</h3>
              <p className="mb-3 text-xs text-muted-foreground">Add an advertisement video to feature on your homepage. Supports YouTube links and direct video uploads.</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Video title</Label>
                  <Input value={settingsForm.heroAdTitle} onChange={(e) => setSettingsForm({ ...settingsForm, heroAdTitle: e.target.value })} />
                </div>
                <div>
                  <Label>Video subtitle</Label>
                  <Input value={settingsForm.heroAdSubtitle} onChange={(e) => setSettingsForm({ ...settingsForm, heroAdSubtitle: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <Label>Video URL (YouTube or MP4)</Label>
                  <div className="flex flex-wrap items-center gap-3">
                    <Input value={settingsForm.heroAdVideoUrl} onChange={(e) => setSettingsForm({ ...settingsForm, heroAdVideoUrl: e.target.value })} onBlur={(e) => persistSettingField("heroAdVideoUrl", e.target.value, "Featured video")} placeholder="https://youtube.com/watch?v=... or https://..." />
                    <label className={`flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary ${uploadingHeroVideo ? "opacity-50 pointer-events-none" : ""}`}>
                      <Video className="h-3.5 w-3.5" />{uploadingHeroVideo ? "Uploading…" : "Upload video"}
                      <input type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadHomepageAsset(f, "heroVideo") }} />
                    </label>
                    {settingsForm.heroAdVideoUrl && (
                      <button type="button" onClick={() => { setSettingsForm({ ...settingsForm, heroAdVideoUrl: "" }); updateSettings({ heroAdVideoUrl: "" }).catch(() => {}) }} className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10">
                        Remove video
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-3 text-base font-bold text-foreground">Section Titles</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div><Label>Flash sale title</Label><Input value={settingsForm.flashSaleTitle} onChange={(e) => setSettingsForm({ ...settingsForm, flashSaleTitle: e.target.value })} /></div>
                <div><Label>Deal of the day title</Label><Input value={settingsForm.dealOfDayTitle} onChange={(e) => setSettingsForm({ ...settingsForm, dealOfDayTitle: e.target.value })} /></div>
                <div><Label>Holiday deals title</Label><Input value={settingsForm.holidayDealsTitle} onChange={(e) => setSettingsForm({ ...settingsForm, holidayDealsTitle: e.target.value })} /></div>
              </div>
            </section>

            <div className="flex flex-wrap justify-end gap-3">
              <button type="button" onClick={(e) => saveSiteSettings(e as unknown as React.FormEvent, true)} className="rounded-lg border border-border bg-secondary px-6 py-3 text-sm font-semibold text-foreground hover:bg-secondary/80">Save &amp; Preview Homepage</button>
              <button className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">Save All Settings</button>
            </div>
          </form>
        )}
      </div>

      {adminFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <form onSubmit={saveAdmin} className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">{editingAdmin ? `Edit ${editingAdmin.username}` : "Add admin"}</h2>
              <button type="button" onClick={() => setAdminFormOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="grid gap-3">
              <div>
                <Label>Username</Label>
                <Input
                  required
                  disabled={!!editingAdmin}
                  value={adminForm.username}
                  onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, "") })}
                  placeholder="e.g. mary"
                  minLength={3}
                />
                {editingAdmin && <p className="mt-1 text-xs text-muted-foreground">Username can't be changed.</p>}
              </div>
              <div>
                <Label>Full name (optional)</Label>
                <Input
                  value={adminForm.fullName}
                  onChange={(e) => setAdminForm({ ...adminForm, fullName: e.target.value })}
                  placeholder="e.g. Mary Wanjiku"
                />
              </div>
              <div>
                <Label>{editingAdmin ? "New password (leave blank to keep current)" : "Password"}</Label>
                <Input
                  type="password"
                  required={!editingAdmin}
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  placeholder="Min 6 characters"
                  minLength={6}
                />
              </div>
              <div>
                <Label>Role</Label>
                <select
                  value={adminForm.role}
                  onChange={(e) => setAdminForm({ ...adminForm, role: e.target.value === "owner" ? "owner" : "staff" })}
                  className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="staff">Staff — can manage products, orders, settings</option>
                  <option value="owner">Owner — can also manage admins</option>
                </select>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setAdminFormOpen(false)} className="rounded-lg border border-border px-5 py-2.5 text-sm">Cancel</button>
              <button type="submit" disabled={savingAdmin} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                {savingAdmin ? "Saving…" : editingAdmin ? "Save changes" : "Create admin"}
              </button>
            </div>
          </form>
        </div>
      )}

      {reviewAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <form onSubmit={saveNewReview} className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Add Review</h2>
              <button type="button" onClick={() => setReviewAddOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="mb-3">
              <Label>Product *</Label>
              <select
                required
                value={reviewAddForm.productId}
                onChange={(e) => setReviewAddForm({ ...reviewAddForm, productId: e.target.value })}
                className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select product</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <Label>Reviewer name *</Label>
              <Input required value={reviewAddForm.name} onChange={(e) => setReviewAddForm({ ...reviewAddForm, name: e.target.value })} placeholder="e.g. James K" />
            </div>
            <div className="mb-3">
              <Label>Rating</Label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setReviewAddForm({ ...reviewAddForm, rating: value })}
                    aria-label={`Rate ${value} stars`}
                    className="p-1"
                  >
                    <Star className={`h-6 w-6 ${value <= reviewAddForm.rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`} />
                  </button>
                ))}
                <span className="ml-2 text-sm text-muted-foreground">{reviewAddForm.rating}/5</span>
              </div>
            </div>
            <div className="mb-5">
              <Label>Comment *</Label>
              <textarea
                required
                value={reviewAddForm.comment}
                onChange={(e) => setReviewAddForm({ ...reviewAddForm, comment: e.target.value })}
                rows={4}
                placeholder="What did the customer say about this product?"
                className="min-h-24 w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setReviewAddOpen(false)} className="rounded-lg border border-border px-5 py-2.5 text-sm">Cancel</button>
              <button type="submit" disabled={savingReview} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                {savingReview ? "Saving…" : "Save Review"}
              </button>
            </div>
          </form>
        </div>
      )}

      {productFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-background/80 p-4 backdrop-blur-sm">
          <div className="mx-auto flex max-h-[90vh] w-full max-w-5xl flex-col rounded-2xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border p-5"><h2 className="text-lg font-bold text-foreground">{editingProduct ? "Edit Product" : "Add Product"}</h2><button onClick={() => setProductFormOpen(false)}><X className="h-5 w-5" /></button></div>
            <div className="flex flex-1 flex-col overflow-y-auto md:flex-row">
            <aside className="order-first border-b border-border bg-card p-5 md:order-last md:w-80 md:flex-shrink-0 md:border-b-0 md:border-l">
              <div className="md:sticky md:top-0">
                <AdminProductPreview product={productForm} />
              </div>
            </aside>
            <form onSubmit={saveProduct} className="grid flex-1 gap-4 p-5 md:grid-cols-2">
              <div className="md:col-span-2"><Label>Product name *</Label><Input required value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} /></div>
              <div><Label>Price *</Label><Input required type="number" value={productForm.price || ""} onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })} /></div>
              <div><Label>Original price</Label><Input type="number" value={productForm.originalPrice || ""} onChange={(e) => setProductForm({ ...productForm, originalPrice: e.target.value ? Number(e.target.value) : undefined })} /></div>
              <div><Label>Category *</Label><select required value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground"><option value="">Select category</option>{categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}</select></div>
              <div><Label>Brand *</Label><Input required value={productForm.brand} onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })} /></div>
              <div><Label>Stock *</Label><Input required type="number" value={productForm.stock ?? 0} onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })} /></div>
              <div><Label>Offer placement</Label><select value={productForm.offerType || ""} onChange={(e) => setProductForm({ ...productForm, offerType: e.target.value as Product["offerType"] })} className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground">{OFFER_TYPES.map((offer) => <option key={offer.value} value={offer.value}>{offer.label}</option>)}</select></div>
              <div><Label>Size / Specs</Label><Input placeholder="e.g. 128GB, 6.5 inch" value={productForm.size || ""} onChange={(e) => setProductForm({ ...productForm, size: e.target.value })} /></div>
              <div><Label>Color</Label><Input placeholder="e.g. Black, Silver" value={productForm.color || ""} onChange={(e) => setProductForm({ ...productForm, color: e.target.value })} /></div>
              <div><Label>Badge</Label><Input value={productForm.badge || ""} onChange={(e) => setProductForm({ ...productForm, badge: e.target.value })} /></div>
              <div><Label>Rating</Label><Input type="number" step="0.1" min="0" max="5" value={productForm.rating} onChange={(e) => setProductForm({ ...productForm, rating: Number(e.target.value) })} /></div>
              <div><Label>Reviews</Label><Input type="number" value={productForm.reviews} onChange={(e) => setProductForm({ ...productForm, reviews: Number(e.target.value) })} /></div>

              {/* Main image */}
              <div className="md:col-span-2">
                <div className="mb-2 flex items-center justify-between">
                  <Label>Main product image *</Label>
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
                    <span>{uploadingImage ? "Uploading…" : "Click to upload main image"}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, "image", (url) => { setProductForm((prev) => ({ ...prev, image: url })); setImageMode("url") }) }} />
                  </label>
                )}
                {productForm.image && <img src={productForm.image} alt="preview" className="mt-2 h-20 rounded-lg object-cover border border-border" onError={(e) => (e.currentTarget.style.display = "none")} />}
              </div>

              {/* Gallery — multiple additional images */}
              <div className="md:col-span-2">
                <Label>Additional product images (gallery)</Label>
                <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-4">
                  <div className="flex flex-wrap gap-2">
                    {(productForm.images || []).map((img, idx) => (
                      <div key={`${img}-${idx}`} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-border">
                        <img src={img} alt="gallery" className="h-full w-full object-cover" />
                        <button type="button" onClick={() => removeGalleryImage(idx)} className="absolute right-1 top-1 hidden rounded-full bg-destructive p-1 text-destructive-foreground group-hover:block">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {(productForm.images || []).length === 0 && (
                      <p className="text-xs text-muted-foreground">No additional images yet. Add as many as you want.</p>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Input value={extraImageUrl} onChange={(e) => setExtraImageUrl(e.target.value)} placeholder="Paste image URL and click Add" className="flex-1 min-w-48" />
                    <button type="button" onClick={addExtraImage} className="rounded-lg border border-border px-3 py-2 text-xs">Add URL</button>
                    <label className={`flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary ${uploadingGallery ? "opacity-50 pointer-events-none" : ""}`}>
                      <Upload className="h-3.5 w-3.5" />{uploadingGallery ? "Uploading…" : "Upload images"}
                      <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { const f = e.target.files; if (f && f.length) handleGalleryFiles(f) }} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Video — URL (YouTube/direct) or file upload */}
              <div className="md:col-span-2">
                <div className="mb-2 flex items-center justify-between">
                  <Label><Video className="inline h-3.5 w-3.5 mr-1" />Product video (optional)</Label>
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
              <div className="md:col-span-2 flex flex-wrap justify-end gap-3"><button type="button" onClick={() => setProductFormOpen(false)} className="rounded-lg border border-border px-5 py-2.5 text-sm">Cancel</button><button type="button" onClick={(e) => saveProduct(e as unknown as React.FormEvent, true)} className="rounded-lg border border-border bg-secondary px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary/80">Save &amp; Preview Homepage</button><button className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Save Product</button></div>
            </form>
            </div>
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

function AnalyticsCard({ title, rows }: { title: string; rows: Array<{ label: string; value: number }> }) {
  const max = Math.max(...rows.map((r) => r.value), 1)
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-3 font-bold text-foreground">{title}</h3>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">No data yet.</p> : (
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={`${row.label}-${i}`}>
              <div className="mb-1 flex justify-between gap-3 text-xs">
                <span className="truncate text-foreground" title={row.label}>{row.label}</span>
                <span className="font-semibold text-muted-foreground">{row.value}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full bg-primary" style={{ width: `${(row.value / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
