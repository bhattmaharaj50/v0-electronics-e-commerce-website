"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { Star, ShoppingCart, Heart, Share2, ArrowLeft, Minus, Plus, Play } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import DOMPurify from "isomorphic-dompurify"
import { formatPrice } from "@/lib/products"
import { useCart } from "@/lib/cart-context"
import { useProductStore } from "@/lib/product-store"
import { ProductCard } from "@/components/product-card"
import { ProductReviews } from "@/components/product-reviews"

const SANITIZE_CONFIG = {
  ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "ul", "ol", "li", "a", "span", "h3", "h4", "h5"],
  ALLOWED_ATTR: ["href", "target", "rel", "class"],
}

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/\s]{11})/)
  return match ? match[1] : null
}

function ProductVideo({ url }: { url: string }) {
  const [playing, setPlaying] = useState(false)
  const ytId = getYouTubeId(url)

  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-border">
      <div className="flex items-center gap-2 border-b border-border bg-secondary/50 px-4 py-2.5">
        <Play className="h-4 w-4 text-foreground" />
        <span className="text-sm font-semibold text-foreground">Product Video</span>
      </div>
      {ytId ? (
        playing ? (
          <div className="relative aspect-video w-full">
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
              title="Product video"
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <button
            onClick={() => setPlaying(true)}
            className="group relative flex w-full items-center justify-center"
            aria-label="Play video"
          >
            <img
              src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
              alt="Video thumbnail"
              className="aspect-video w-full object-cover"
            />
            <div className="absolute flex h-16 w-16 items-center justify-center rounded-full bg-foreground/90 shadow-xl transition-transform group-hover:scale-110">
              <Play className="h-7 w-7 fill-background text-background" />
            </div>
          </button>
        )
      ) : (
        <video src={url} controls className="aspect-video w-full" preload="metadata" />
      )}
    </div>
  )
}

function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0)
  const main = images[active] || images[0]

  return (
    <div>
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border bg-secondary">
        <Image
          key={main}
          src={main}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.map((img, idx) => (
            <button
              key={`${img}-${idx}`}
              onClick={() => setActive(idx)}
              className={`relative aspect-square overflow-hidden rounded-lg border ${
                idx === active ? "border-primary ring-2 ring-primary/40" : "border-border"
              } bg-secondary`}
              aria-label={`Show image ${idx + 1}`}
            >
              <img src={img} alt={`${name} preview ${idx + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProductDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const { products, refreshStore } = useProductStore()
  const product = products.find((p) => p.id === id)
  const [quantity, setQuantity] = useState(1)
  const { addToCart } = useCart()
  const outOfStock = (product?.stock ?? 1) <= 0

  const gallery = useMemo(() => {
    if (!product) return [] as string[]
    const set = new Set<string>()
    if (product.image) set.add(product.image)
    for (const i of product.images || []) if (i) set.add(i)
    return Array.from(set)
  }, [product])

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center lg:px-8">
        <h1 className="text-3xl font-bold text-foreground">Product not found</h1>
        <p className="mt-4 text-muted-foreground">The product you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/products" className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
          Back to Products
        </Link>
      </div>
    )
  }

  const handleAddAndCheckout = () => {
    if (outOfStock) return
    for (let i = 0; i < quantity; i++) addToCart(product)
    router.push("/checkout")
  }

  const handleAddOnly = () => {
    if (outOfStock) return
    for (let i = 0; i < quantity; i++) addToCart(product)
  }

  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <Link href="/products" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to Products
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <ProductGallery images={gallery} name={product.name} />
          {product.videoUrl && <ProductVideo url={product.videoUrl} />}
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{product.brand}</span>
              {product.size && (
                <span className="rounded bg-secondary px-2 py-1 text-xs font-medium text-muted-foreground">{product.size}</span>
              )}
              {product.badge && (
                <span className="rounded bg-primary/15 px-2 py-1 text-xs font-semibold text-primary">{product.badge}</span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-foreground">{product.name}</h1>
            <div
              className="mt-2 text-sm text-muted-foreground prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(product.description || "", SANITIZE_CONFIG),
              }}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(product.rating) ? "fill-yellow-500 text-yellow-500" : "fill-muted text-muted"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {product.rating.toFixed(1)} ({product.reviews} reviews)
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
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
                disabled={outOfStock}
                className="p-2 hover:text-foreground"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock ?? quantity + 1, quantity + 1))}
                disabled={outOfStock || quantity >= (product.stock ?? quantity + 1)}
                className="p-2 hover:text-foreground"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleAddAndCheckout}
              disabled={outOfStock}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShoppingCart className="h-5 w-5" />
              {outOfStock ? "Out of Stock" : "Add to Cart & Checkout"}
            </button>
            <button
              onClick={handleAddOnly}
              disabled={outOfStock}
              className="flex items-center justify-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Heart className="h-5 w-5" />
              Keep shopping
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
                <span className="text-foreground">{product.rating.toFixed(1)} / 5</span>
              </li>
              <li className="flex justify-between">
                <span>Stock:</span>
                <span className="text-foreground">{product.stock ?? 0} available</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <ProductReviews productId={product.id} onChange={() => refreshStore()} />

      {relatedProducts.length > 0 && (
        <div className="mt-16 border-t border-border pt-12">
          <h2 className="mb-6 text-2xl font-bold text-foreground">Related Products</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
