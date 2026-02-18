"use client"

import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { formatPrice } from "@/lib/products"

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, totalPrice } = useCart()

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center lg:px-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
          <ShoppingBag className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-foreground">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Looks like you haven&apos;t added anything to your cart yet.
        </p>
        <Link
          href="/products"
          className="mt-6 flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Start Shopping
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-foreground">Shopping Cart</h1>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Cart Items */}
        <div className="flex-1">
          <div className="flex flex-col gap-4">
            {items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex gap-4 rounded-xl border border-border bg-card p-4"
              >
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-secondary">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>

                <div className="flex flex-1 flex-col gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{product.name}</h3>
                  <p className="text-lg font-bold text-foreground">{formatPrice(product.price)}</p>

                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border transition-colors hover:bg-secondary"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3.5 w-3.5 text-foreground" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-foreground">
                        {quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border transition-colors hover:bg-secondary"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3.5 w-3.5 text-foreground" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-80">
          <div className="sticky top-20 rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-bold text-foreground">Order Summary</h2>

            <div className="mt-4 flex flex-col gap-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery</span>
                <span className="font-medium text-foreground">
                  {totalPrice > 10000 ? "Free" : formatPrice(500)}
                </span>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex justify-between">
                  <span className="text-base font-bold text-foreground">Total</span>
                  <span className="text-base font-bold text-foreground">
                    {formatPrice(totalPrice > 10000 ? totalPrice : totalPrice + 500)}
                  </span>
                </div>
              </div>
            </div>

            <Link
              href="/checkout"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Proceed to Checkout
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/products"
              className="mt-3 flex w-full items-center justify-center rounded-lg border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              Continue Shopping
            </Link>

            {totalPrice < 10000 && (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Add {formatPrice(10000 - totalPrice)} more for free delivery
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
