"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react"
import {
  products as defaultProducts,
  categories as defaultCategories,
  type Product,
} from "@/lib/products"

export type { Product }

export interface Category {
  slug: string
  name: string
  icon: string
}

export interface SiteSettings {
  heroBadge: string
  heroTitle: string
  heroSubtitle: string
  flashSaleTitle: string
  dealOfDayTitle: string
  holidayDealsTitle: string
  adminPhone: string
  mpesaNumber: string
  logoText: string
  logoUrl: string
  heroImageUrl: string
  heroAdVideoUrl: string
  heroAdTitle: string
  heroAdSubtitle: string
  pickupLocation: string
  businessName: string
}

interface ProductStoreContextType {
  products: Product[]
  categories: Category[]
  settings: SiteSettings
  loading: boolean
  refreshStore: () => Promise<void>
  addProduct: (product: Product) => Promise<void>
  updateProduct: (product: Product) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
  addCategory: (category: Category) => Promise<void>
  updateCategory: (category: Category) => Promise<void>
  deleteCategory: (slug: string) => Promise<void>
  updateSettings: (settings: Partial<SiteSettings>) => Promise<void>
  resetToDefaults: () => Promise<void>
}

const ProductStoreContext = createContext<ProductStoreContextType | undefined>(undefined)

export const defaultSettings: SiteSettings = {
  heroBadge: "Kenya's Trusted Electronics Store",
  heroTitle: "Premium Electronics, Delivered to Your Door",
  heroSubtitle: "Shop the latest TVs, smartphones, gaming consoles, and home appliances at competitive prices across Kenya.",
  flashSaleTitle: "Flash Sales",
  dealOfDayTitle: "Deal of the Day",
  holidayDealsTitle: "Holiday Deals",
  adminPhone: "254720856892",
  mpesaNumber: "0720856892",
  logoText: "Munex Electronics",
  logoUrl: "",
  heroImageUrl: "/images/hero-electronics.jpg",
  heroAdVideoUrl: "",
  heroAdTitle: "See What's New",
  heroAdSubtitle: "Watch our latest product showcase",
  pickupLocation: "Munex Electronics Shop, Narok Town, Main Street",
  businessName: "Munex Electronics",
}

async function requestAdminAction(action: string, payload: Record<string, unknown>) {
  const response = await fetch("/api/admin/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || "Admin update failed")
  }

  return response.json()
}

export function ProductStoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(
    defaultProducts.map((product) => ({ ...product, stock: product.stock ?? 10, offerType: product.offerType ?? "" }))
  )
  const [categories, setCategories] = useState<Category[]>(defaultCategories)
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)

  const applyData = useCallback((data: { products?: Product[]; categories?: Category[]; settings?: SiteSettings }) => {
    if (data.products) setProducts(data.products)
    if (data.categories) setCategories(data.categories)
    if (data.settings) setSettings({ ...defaultSettings, ...data.settings })
  }, [])

  const refreshStore = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/store", { cache: "no-store" })
      if (!response.ok) throw new Error("Store data failed to load")
      applyData(await response.json())
    } finally {
      setLoading(false)
    }
  }, [applyData])

  useEffect(() => {
    refreshStore().catch((error) => {
      console.error(error)
      setLoading(false)
    })
  }, [refreshStore])

  const addProduct = useCallback(async (product: Product) => {
    setProducts((prev) => [...prev, product])
    const data = await requestAdminAction("saveProduct", { product })
    applyData(data)
  }, [applyData])

  const updateProduct = useCallback(async (product: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)))
    const data = await requestAdminAction("saveProduct", { product })
    applyData(data)
  }, [applyData])

  const deleteProduct = useCallback(async (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id))
    const data = await requestAdminAction("deleteProduct", { id })
    applyData(data)
  }, [applyData])

  const addCategory = useCallback(async (category: Category) => {
    setCategories((prev) => [...prev, category])
    const data = await requestAdminAction("saveCategory", { category })
    applyData(data)
  }, [applyData])

  const updateCategory = useCallback(async (category: Category) => {
    setCategories((prev) => prev.map((c) => (c.slug === category.slug ? category : c)))
    const data = await requestAdminAction("saveCategory", { category })
    applyData(data)
  }, [applyData])

  const deleteCategory = useCallback(async (slug: string) => {
    setCategories((prev) => prev.filter((c) => c.slug !== slug))
    const data = await requestAdminAction("deleteCategory", { slug })
    applyData(data)
  }, [applyData])

  const updateSettings = useCallback(async (updates: Partial<SiteSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }))
    const data = await requestAdminAction("saveSettings", { settings: updates })
    applyData(data)
  }, [applyData])

  const resetToDefaults = useCallback(async () => {
    await refreshStore()
  }, [refreshStore])

  return (
    <ProductStoreContext.Provider
      value={{
        products,
        categories,
        settings,
        loading,
        refreshStore,
        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,
        updateCategory,
        deleteCategory,
        updateSettings,
        resetToDefaults,
      }}
    >
      {children}
    </ProductStoreContext.Provider>
  )
}

export function useProductStore() {
  const context = useContext(ProductStoreContext)
  if (!context) {
    throw new Error("useProductStore must be used within ProductStoreProvider")
  }
  return context
}
