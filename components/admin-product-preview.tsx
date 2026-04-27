"use client"

import Image from "next/image"
import { Star, ShoppingCart, Zap } from "lucide-react"
import type { Product } from "@/lib/products"
import { formatPrice } from "@/lib/products"

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
}

export function AdminProductPreview({ product }: { product: Partial<Product> }) {
  const name = product.name?.trim() || "Product name"
  const brand = product.brand?.trim() || "Brand"
  const description = product.description ? stripHtml(product.description) : "Product description will appear here…"
  const rating = Number(product.rating) || 0
  const reviews = Number(product.reviews) || 0
  const price = Number(product.price) || 0
  const originalPrice = product.originalPrice ? Number(product.originalPrice) : undefined
  const stock = Number(product.stock ?? 0)
  const outOfStock = stock <= 0
  const image = product.image?.trim()
  const extraImages = (product.images || []).filter(Boolean)

  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Live homepage preview
      </p>
      <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-secondary">
          {image ? (
            <Image
              src={image}
              alt={name}
              fill
              sizes="288px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              No image yet
            </div>
          )}
          {product.badge && (
            <span className="absolute left-3 top-3 rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
              {product.badge}
            </span>
          )}
          {extraImages.length > 0 && (
            <span className="absolute right-3 top-3 rounded-md bg-foreground/80 px-2 py-1 text-[10px] font-semibold text-background">
              +{extraImages.length} photos
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {brand}
            </span>
            {product.size && (
              <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {product.size}
              </span>
            )}
          </div>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
            {name}
          </h3>
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.floor(rating)
                      ? "fill-foreground text-foreground"
                      : "fill-muted text-muted"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">({reviews})</span>
          </div>

          {/* Price */}
          <div className="mt-auto flex items-baseline gap-2">
            <span className="text-lg font-bold text-foreground">{formatPrice(price)}</span>
            {originalPrice && originalPrice > price && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>
          <p className={`text-xs font-medium ${outOfStock ? "text-red-500" : "text-muted-foreground"}`}>
            {outOfStock ? "Out of stock" : `${stock} in stock`}
          </p>

          {/* Buttons (visual only) */}
          <div className="mt-2 flex gap-2">
            <div className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground opacity-80">
              <ShoppingCart className="h-3.5 w-3.5" />
              Add &amp; Checkout
            </div>
            <div className="flex items-center justify-center rounded-lg border border-border px-3 py-2.5 text-xs font-semibold text-foreground opacity-80">
              <Zap className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground">
        This is exactly how your product will appear on the homepage and product listings.
      </p>
    </div>
  )
}
