"use client"

import { useState } from "react"
import { useCart } from "@/lib/cart-context"
import { formatPrice } from "@/lib/products"
import { CheckCircle2, ArrowLeft, Phone, MessageCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

type PaymentMethod = "mpesa" | "pay-on-delivery"
type CheckoutStep = "details" | "payment" | "confirmation"

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart()
  const [step, setStep] = useState<CheckoutStep>("details")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mpesa")
  const [orderNumber] = useState(() => `25FE-${Date.now().toString(36).toUpperCase()}`)

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    mpesaPhone: "",
  })

  const deliveryFee = totalPrice > 10000 ? 0 : 500
  const grandTotal = totalPrice + deliveryFee

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.mpesaPhone) {
      setFormData((prev) => ({ ...prev, mpesaPhone: prev.phone }))
    }
    setStep("payment")
  }

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault()
    setStep("confirmation")
    clearCart()
  }

  const buildWhatsAppMessage = () => {
    const itemLines = items
      .map(
        ({ product, quantity }) =>
          `- ${product.name} (x${quantity}) = ${formatPrice(product.price * quantity)}`
      )
      .join("\n")

    const message = `Hello 25FlowElectronics! I've placed an order.\n\nOrder #: ${orderNumber}\nName: ${formData.firstName} ${formData.lastName}\nPhone: ${formData.phone}\nDelivery: ${formData.address}, ${formData.city}\n\nItems:\n${itemLines}\n\nSubtotal: ${formatPrice(totalPrice)}\nDelivery: ${deliveryFee === 0 ? "Free" : formatPrice(deliveryFee)}\nTotal: ${formatPrice(grandTotal)}\n\nPayment: ${paymentMethod === "mpesa" ? "M-Pesa" : "Pay on Delivery"}`

    return encodeURIComponent(message)
  }

  // ---- CONFIRMATION SCREEN ----
  if (step === "confirmation") {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#25D366]/10">
          <CheckCircle2 className="h-10 w-10 text-[#25D366]" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-foreground">Order Placed Successfully!</h1>
        <p className="mt-1 text-sm font-medium text-muted-foreground">
          Order #{orderNumber}
        </p>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Thank you for shopping with 25FlowElectronics. Please confirm your order on WhatsApp so
          we can process your delivery right away.
        </p>

        <a
          href={`https://wa.me/254793823013?text=${buildWhatsAppMessage()}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex items-center gap-2 rounded-lg bg-[#25D366] px-6 py-3 text-sm font-semibold text-[#fff] transition-opacity hover:opacity-90"
        >
          <MessageCircle className="h-5 w-5" />
          Confirm Order on WhatsApp
        </a>

        <Link
          href="/products"
          className="mt-4 rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        >
          Continue Shopping
        </Link>

        {/* Order Summary Card */}
        <div className="mt-8 w-full rounded-xl border border-border bg-card p-6 text-left">
          <h2 className="mb-4 text-sm font-bold text-foreground">Order Summary</h2>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment Method</span>
              <span className="font-medium text-foreground">
                {paymentMethod === "mpesa" ? "M-Pesa" : "Pay on Delivery"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery to</span>
              <span className="font-medium text-foreground">
                {formData.city}
              </span>
            </div>
            <div className="border-t border-border pt-2">
              <div className="flex justify-between">
                <span className="text-sm font-bold text-foreground">Total Paid</span>
                <span className="text-sm font-bold text-foreground">
                  {formatPrice(grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ---- EMPTY CART ----
  if (items.length === 0 && step !== "confirmation") {
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

      <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground">Checkout</h1>

      {/* Step Indicator */}
      <div className="mb-8 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              step === "details"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            1
          </div>
          <span
            className={`text-sm font-medium ${
              step === "details" ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            Details
          </span>
        </div>
        <div className="h-px flex-1 bg-border" />
        <div className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              step === "payment"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            2
          </div>
          <span
            className={`text-sm font-medium ${
              step === "payment" ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            Payment
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Form Area */}
        <div className="flex-1">
          {step === "details" && (
            <form onSubmit={handleDetailsSubmit} className="flex flex-col gap-6">
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
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+254 7XX XXX XXX"
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
                      Street Address / Estate / Building
                    </label>
                    <input
                      id="address"
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="e.g. Kilimani, Rose Avenue Apartments"
                      className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label htmlFor="city" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      City / Town
                    </label>
                    <select
                      id="city"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select city</option>
                      <option value="Nairobi">Nairobi</option>
                      <option value="Mombasa">Mombasa</option>
                      <option value="Kisumu">Kisumu</option>
                      <option value="Nakuru">Nakuru</option>
                      <option value="Eldoret">Eldoret</option>
                      <option value="Thika">Thika</option>
                      <option value="Malindi">Malindi</option>
                      <option value="Nyeri">Nyeri</option>
                      <option value="Machakos">Machakos</option>
                      <option value="Meru">Meru</option>
                      <option value="Nanyuki">Nanyuki</option>
                      <option value="Kitale">Kitale</option>
                      <option value="Naivasha">Naivasha</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 lg:w-auto lg:px-8"
              >
                Continue to Payment
              </button>
            </form>
          )}

          {step === "payment" && (
            <form onSubmit={handlePlaceOrder} className="flex flex-col gap-6">
              {/* Payment Method Selection */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="mb-4 text-base font-bold text-foreground">Payment Method</h2>

                <div className="flex flex-col gap-3">
                  {/* M-Pesa */}
                  <label
                    className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-colors ${
                      paymentMethod === "mpesa"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="mpesa"
                      checked={paymentMethod === "mpesa"}
                      onChange={() => setPaymentMethod("mpesa")}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-[#4CAF50]" />
                        <span className="text-sm font-semibold text-foreground">M-Pesa</span>
                        <span className="rounded bg-[#4CAF50]/10 px-2 py-0.5 text-[10px] font-semibold text-[#4CAF50]">
                          Recommended
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Pay instantly via M-Pesa. You will receive an STK push to confirm payment.
                      </p>
                    </div>
                  </label>

                  {/* Pay on Delivery */}
                  <label
                    className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-colors ${
                      paymentMethod === "pay-on-delivery"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="pay-on-delivery"
                      checked={paymentMethod === "pay-on-delivery"}
                      onChange={() => setPaymentMethod("pay-on-delivery")}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          Pay on Delivery
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Pay cash or M-Pesa when your order arrives. Available in Nairobi only.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* M-Pesa Phone Number */}
              {paymentMethod === "mpesa" && (
                <div className="rounded-xl border border-border bg-card p-6">
                  <h2 className="mb-4 text-base font-bold text-foreground">M-Pesa Details</h2>
                  <div>
                    <label htmlFor="mpesaPhone" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      M-Pesa Phone Number
                    </label>
                    <input
                      id="mpesaPhone"
                      name="mpesaPhone"
                      type="tel"
                      required
                      value={formData.mpesaPhone || formData.phone}
                      onChange={handleChange}
                      placeholder="+254 7XX XXX XXX"
                      className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      You will receive an M-Pesa prompt on this number to complete payment of{" "}
                      <span className="font-semibold text-foreground">
                        {formatPrice(grandTotal)}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("details")}
                  className="rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 lg:flex-none lg:px-8"
                >
                  Place Order - {formatPrice(grandTotal)}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="w-full lg:w-80">
          <div className="sticky top-20 rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-bold text-foreground">Order Summary</h2>

            <div className="mt-4 flex flex-col gap-3">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-secondary">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {quantity}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="line-clamp-1 text-xs font-medium text-foreground">
                      {product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{product.brand}</p>
                    <p className="mt-0.5 text-xs font-semibold text-foreground">
                      {formatPrice(product.price * quantity)}
                    </p>
                  </div>
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

            {totalPrice >= 10000 && (
              <p className="mt-3 text-center text-xs font-medium text-[#25D366]">
                Free delivery on this order!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
