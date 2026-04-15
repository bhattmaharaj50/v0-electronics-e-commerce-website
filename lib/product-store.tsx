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

interface ProductStoreContextType {
  products: Product[]
  categories: Category[]
  addProduct: (product: Product) => void
  updateProduct: (product: Product) => void
  deleteProduct: (id: string) => void
  addCategory: (category: Category) => void
  updateCategory: (category: Category) => void
  deleteCategory: (slug: string) => void
  resetToDefaults: () => void
}

const ProductStoreContext = createContext<ProductStoreContextType | undefined>(
  undefined
)

const PRODUCTS_KEY = "25flow_products"
const CATEGORIES_KEY = "25flow_categories"

export function ProductStoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(defaultProducts)
  const [categories, setCategories] = useState<Category[]>(defaultCategories)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const savedProducts = localStorage.getItem(PRODUCTS_KEY)
      if (savedProducts) setProducts(JSON.parse(savedProducts))
      const savedCategories = localStorage.getItem(CATEGORIES_KEY)
      if (savedCategories) setCategories(JSON.parse(savedCategories))
    } catch {
      // ignore
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products))
    } catch {
      // ignore
    }
  }, [products, hydrated])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
    } catch {
      // ignore
    }
  }, [categories, hydrated])

  const addProduct = useCallback((product: Product) => {
    setProducts((prev) => [...prev, product])
  }, [])

  const updateProduct = useCallback((product: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? product : p))
    )
  }, [])

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const addCategory = useCallback((category: Category) => {
    setCategories((prev) => [...prev, category])
  }, [])

  const updateCategory = useCallback((category: Category) => {
    setCategories((prev) =>
      prev.map((c) => (c.slug === category.slug ? category : c))
    )
  }, [])

  const deleteCategory = useCallback((slug: string) => {
    setCategories((prev) => prev.filter((c) => c.slug !== slug))
  }, [])

  const resetToDefaults = useCallback(() => {
    setProducts(defaultProducts)
    setCategories(defaultCategories)
    localStorage.removeItem(PRODUCTS_KEY)
    localStorage.removeItem(CATEGORIES_KEY)
  }, [])

  return (
    <ProductStoreContext.Provider
      value={{
        products,
        categories,
        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,
        updateCategory,
        deleteCategory,
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
