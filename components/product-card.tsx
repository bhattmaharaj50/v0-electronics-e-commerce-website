use client

import Image from "next/image"
import { Star, ShoppingCart } from "lucide-react"
import type { Product } from "@/lib/products"
import { formatPrice } from "@/lib/products"
import { useCart } from "@/lib/cart-context"
import Link from "next/link"

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart()

  return (
    <Link href={`/products/${product.id}`} className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-muted-foreground/30">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-secondary">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {product.badge && (
          <span className="absolute left-3 top-3 rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
            {product.badge}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {product.brand}
          </span>
          {product.size && (
            <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {product.size}
            </span>
          )}
        </div>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          {product.name}
        </h3>
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {product.description}
        </p>

        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < Math.floor(product.rating)
                    ? "fill-foreground text-foreground"
                    : "fill-muted text-muted"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            ({product.reviews})
          </span>
        </div>

        {/* Price */}
        <div className="mt-auto flex items-baseline gap-2">
          <span className="text-lg font-bold text-foreground">{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Buttons */}
        <div className="mt-2 flex gap-2">
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              addToCart(product)
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Add to Cart
          </button>
          <Link
            href="/cart"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              addToCart(product)
              window.location.href = '/cart'
            }}
            className="flex items-center justify-center rounded-lg border border-border px-3 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            Buy Now
          </Link>
        </div>
      </div>
    </Link>
  )
}