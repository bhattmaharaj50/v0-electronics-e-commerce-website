"use client"

import { useState } from "react"
import Image from "next/image"
import { Star, ShoppingCart, Heart, Share2, ArrowLeft, Minus, Plus } from "lucide-react"
import Link from "next/link"
import { products, formatPrice } from "@/lib/products"
import { useCart } from "@/lib/cart-context"

export default function ProductDetailClient({ id }: { id: string }) {
  const product = products.find((p) => p.id === id)
  const [quantity, setQuantity] = useState(1)
  const { addToCart } = useCart()

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center lg:px-8">
        <h1 className="text-3xl font-bold text-foreground">Product not found</h1>
        <p className="mt-4 text-muted-foreground">The product you&apos;re looking for doesn&apos;t exist.</p>
        <Link
          href="/products"
          className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          Back to Products
        </Link>
      </div>
    )
  }

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product)
    }
  }

  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <Link
        href="/products"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Products
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex items-center justify-center">
          <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border bg-secondary">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
            {product.badge && (
              <span className="absolute left-4 top-4 rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                {product.badge}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {product.brand}
              </span>
              {product.size && (
                <span className="rounded bg-secondary px-2 py-1 text-xs font-medium text-muted-foreground">
                  {product.size}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-foreground">{product.name}</h1>
            <div
              className="mt-2 text-sm text-muted-foreground prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(product.rating)
                      ? "fill-foreground text-foreground"
                      : "fill-muted text-muted"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {product.rating} ({product.reviews} reviews)
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
            {product.originalPrice && (
              <span className="text-sm font-semibold text-green-600">
                Save {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground">Quantity:</span>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 hover:text-foreground"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-2 hover:text-foreground"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <ShoppingCart className="h-5 w-5" />
              Add to Cart
            </button>
            <button className="flex items-center justify-center rounded-lg border border-border px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary">
              <Heart className="h-5 w-5" />
            </button>
            <button className="flex items-center justify-center rounded-lg border border-border px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary">
              <Share2 className="h-5 w-5" />
            </button>
          </div>

          <div className="border-t border-border pt-6">
            <h3 className="mb-3 font-semibold text-foreground">Product Details</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex justify-between">
                <span>Brand:</span>
                <span className="text-foreground">{product.brand}</span>
              </li>
              <li className="flex justify-between">
                <span>Category:</span>
                <span className="text-foreground capitalize">{product.category}</span>
              </li>
              {product.size && (
                <li className="flex justify-between">
                  <span>Size/Storage:</span>
                  <span className="text-foreground">{product.size}</span>
                </li>
              )}
              <li className="flex justify-between">
                <span>Rating:</span>
                <span className="text-foreground">{product.rating} / 5</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="mt-16 border-t border-border pt-12">
          <h2 className="mb-6 text-2xl font-bold text-foreground">Related Products</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((relatedProduct) => (
              <Link
                key={relatedProduct.id}
                href={`/products/${relatedProduct.id}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-muted-foreground/30"
              >
                <div className="relative aspect-square overflow-hidden bg-secondary">
                  <Image
                    src={relatedProduct.image}
                    alt={relatedProduct.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h3 className="line-clamp-2 text-sm font-semibold text-foreground">{relatedProduct.name}</h3>
                  <p className="text-lg font-bold text-foreground">{formatPrice(relatedProduct.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
