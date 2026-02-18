"use client"

import { useState } from "react"
import { useCart } from "@/lib/cart-context"
import { formatPrice } from "@/lib/products"
import { CheckCircle2, Lock, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart()
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  })

  const deliveryFee = totalPrice > 10000 ? 0 : 500
  const grandTotal = totalPrice + deliveryFee

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setOrderPlaced(true)
    clearCart()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  if (orderPlaced) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
          <CheckCircle2 className="h-10 w-10 text-foreground" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-foreground">Order Placed Successfully!</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Thank you for shopping with 25FlowElectronics. You&apos;ll receive a confirmation email shortly with your order details.
        </p>
        <Link
          href="/products"
          className="mt-6 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Continue Shopping
        </Link>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-foreground">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">Add items before checkout.</p>
        <Link
          href="/products"
          className="mt-6 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          Shop Now
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <Link
        href="/cart"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Cart
      </Link>

      <h1 className="mb-8 text-3xl font-bold tracking-tight text-foreground">Checkout</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8 lg:flex-row">
        {/* Form Fields */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Contact Information */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-base font-bold text-foreground">Contact Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label htmlFor="phone" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+254 700 000 000"
                  className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-base font-bold text-foreground">Delivery Address</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="address" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Street Address
                </label>
                <input
                  id="address"
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label htmlFor="city" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Nairobi"
                  className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* Payment (Mock) */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">Payment</h2>
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              This is a demo checkout. No real payment will be processed.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="cardNumber" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Card Number
                </label>
                <input
                  id="cardNumber"
                  name="cardNumber"
                  required
                  value={formData.cardNumber}
                  onChange={handleChange}
                  placeholder="4242 4242 4242 4242"
                  className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label htmlFor="expiry" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Expiry Date
                </label>
                <input
                  id="expiry"
                  name="expiry"
                  required
                  value={formData.expiry}
                  onChange={handleChange}
                  placeholder="MM/YY"
                  className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label htmlFor="cvv" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  CVV
                </label>
                <input
                  id="cvv"
                  name="cvv"
                  required
                  value={formData.cvv}
                  onChange={handleChange}
                  placeholder="123"
                  className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-80">
          <div className="sticky top-20 rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-bold text-foreground">Order Summary</h2>

            <div className="mt-4 flex flex-col gap-3">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {product.name.slice(0, 25)}... x{quantity}
                  </span>
                  <span className="font-medium text-foreground">
                    {formatPrice(product.price * quantity)}
                  </span>
                </div>
              ))}

              <div className="border-t border-border pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">{formatPrice(totalPrice)}</span>
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="font-medium text-foreground">
                    {deliveryFee === 0 ? "Free" : formatPrice(deliveryFee)}
                  </span>
                </div>
              </div>

              <div className="border-t border-border pt-3">
                <div className="flex justify-between">
                  <span className="text-base font-bold text-foreground">Total</span>
                  <span className="text-base font-bold text-foreground">
                    {formatPrice(grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Lock className="h-3.5 w-3.5" />
              Place Order
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
