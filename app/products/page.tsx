"use client"

import { Suspense } from "react"
import { ProductsContent } from "@/components/products-content"

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-secondary" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-xl bg-secondary" />
            ))}
          </div>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  )
}
