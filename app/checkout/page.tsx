"use client"

import { useState } from "react"
import { useCart } from "@/lib/cart-context"
import { formatPrice, type Product } from "@/lib/products"
import { useProductStore } from "@/lib/product-store"
import { CheckCircle2, ArrowLeft, Phone, MessageCircle, Copy, Check } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

type PaymentMethod = "mpesa" | "pay-on-delivery"
type CheckoutStep = "details" | "payment" | "confirmation"

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart()
  const { settings, refreshStore } = useProductStore()
  const [step, setStep] = useState<CheckoutStep>("details")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mpesa")
  const [orderNumber] = useState(() => `MNX-${Date.now().toString(36).toUpperCase()}`)
  const [copied, setCopied] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [orderError, setOrderError] = useState("")
  const [confirmedItems, setConfirmedItems] = useState<Array<{ product: Product; quantity: number }>>([])
  const [confirmedTotals, setConfirmedTotals] = useState({ subtotal: 0, deliveryFee: 0, total: 0 })

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    mpesaCode: "",
  })

  const isNairobi = (formData.city || "").trim().toLowerCase() === "nairobi"
  const deliveryFee = isNairobi ? 0 : 500
  const grandTotal = totalPrice + deliveryFee

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStep("payment")
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()

    if (paymentMethod === "mpesa") {
      const code = (formData.mpesaCode || "").trim().toUpperCase()
      if (!/^[A-Z0-9]{8,12}$/.test(code)) {
        setOrderError("Please enter a valid M-Pesa transaction code (8-12 letters/numbers from your SMS).")
        return
      }
    }

    setPlacing(true)
    setOrderError("")

    try {
      const orderItems = items.map((item) => ({ product: item.product, quantity: item.quantity }))
      const totals = { subtotal: totalPrice, deliveryFee, total: grandTotal }
      const whatsappUrl = `https://wa.me/${settings.adminPhone}?text=${buildWhatsAppMessage(orderItems, totals)}`

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber,
          customer: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
          },
          items: orderItems,
          subtotal: totals.subtotal,
          deliveryFee: totals.deliveryFee,
          total: totals.total,
          paymentMethod,
          mpesaCode: paymentMethod === "mpesa" ? formData.mpesaCode.trim().toUpperCase() : "",
          whatsappUrl,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || "Unable to place order")
      }

      setConfirmedItems(orderItems)
      setConfirmedTotals(totals)
      setStep("confirmation")
      clearCart()
      await refreshStore()
    } catch (error) {
      setOrderError(error instanceof Error ? error.message : "Unable to place order")
    } finally {
      setPlacing(false)
    }
  }

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(orderNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const buildWhatsAppMessage = (
    orderItems = confirmedItems.length ? confirmedItems : items,
    totals = confirmedTotals.total ? confirmedTotals : { subtotal: totalPrice, deliveryFee, total: grandTotal }
  ) => {
    const itemLines = orderItems
      .map(
        ({ product, quantity }) =>
          `- ${product.name} (x${quantity}) = ${formatPrice(product.price * quantity)}`
      )
      .join("\n")

    const mpesaLine =
      paymentMethod === "mpesa"
        ? `\nM-Pesa Code: ${formData.mpesaCode}`
        : ""

    const message = `Hello Munex Electronics! I've placed an order.\n\nOrder #: ${orderNumber}\nName: ${formData.firstName} ${formData.lastName}\nPhone: ${formData.phone}\nDelivery: ${formData.address}, ${formData.city}\n\nItems:\n${itemLines}\n\nSubtotal: ${formatPrice(totals.subtotal)}\nDelivery: ${totals.deliveryFee === 0 ? "Free" : formatPrice(totals.deliveryFee)}\nTotal: ${formatPrice(totals.total)}\n\nPayment: ${paymentMethod === "mpesa" ? "M-Pesa" : "Pay on Delivery"}${mpesaLine}`

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
          Thank you for shopping with Munex Electronics. Please confirm your order on WhatsApp so
          we can process your delivery right away.
        </p>

        <a
          href={`https://wa.me/${settings.adminPhone}?text=${buildWhatsAppMessage()}`}
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
            {paymentMethod === "mpesa" && formData.mpesaCode && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">M-Pesa Code</span>
                <span className="font-medium text-foreground">{formData.mpesaCode}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery to</span>
              <span className="font-medium text-foreground">{formData.city}</span>
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
                      placeholder="07XX XXX XXX"
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
                      placeholder="e.g. Westlands, Apartment 4B"
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
                      <option value="Nairobi">Nairobi (Free delivery)</option>
                      <option value="Narok">Narok</option>
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
                        Send M-Pesa to our number and enter your transaction code to confirm.
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
                        Pay cash or M-Pesa when your order arrives.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* M-Pesa Payment Instructions */}
              {paymentMethod === "mpesa" && (
                <div className="rounded-xl border border-[#4CAF50]/30 bg-[#4CAF50]/5 p-6">
                  <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-foreground">
                    <Phone className="h-5 w-5 text-[#4CAF50]" />
                    M-Pesa Payment Instructions
                  </h2>

                  {/* Step-by-step */}
                  <ol className="mb-5 flex flex-col gap-3">
                    <li className="flex items-start gap-3 text-sm">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#4CAF50] text-xs font-bold text-white">
                        1
                      </span>
                      <span className="text-muted-foreground">
                        Go to <strong className="text-foreground">M-Pesa</strong> on your phone and select{" "}
                        <strong className="text-foreground">Send Money</strong>
                      </span>
                    </li>
                    <li className="flex items-start gap-3 text-sm">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#4CAF50] text-xs font-bold text-white">
                        2
                      </span>
                      <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground">
                          Send <strong className="text-foreground">{formatPrice(grandTotal)}</strong> to:
                        </span>
                        <div className="flex items-center gap-2 rounded-lg border border-[#4CAF50]/30 bg-background px-4 py-2">
                          <Phone className="h-4 w-4 text-[#4CAF50]" />
                          <span className="flex-1 font-mono text-base font-bold text-foreground">
                            {settings.mpesaNumber}
                          </span>
                          <span className="text-xs text-muted-foreground">Munex Electronics</span>
                        </div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3 text-sm">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#4CAF50] text-xs font-bold text-white">
                        3
                      </span>
                      <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground">
                          Use your <strong className="text-foreground">Order Number</strong> as the reference:
                        </span>
                        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2">
                          <span className="flex-1 font-mono text-sm font-semibold text-foreground">
                            {orderNumber}
                          </span>
                          <button
                            type="button"
                            onClick={copyOrderNumber}
                            className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                          >
                            {copied ? (
                              <Check className="h-3.5 w-3.5 text-[#4CAF50]" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                            {copied ? "Copied!" : "Copy"}
                          </button>
                        </div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3 text-sm">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#4CAF50] text-xs font-bold text-white">
                        4
                      </span>
                      <span className="text-muted-foreground">
                        After payment, you will receive an{" "}
                        <strong className="text-foreground">M-Pesa confirmation SMS</strong> with a
                        transaction code. Enter it below.
                      </span>
                    </li>
                  </ol>

                  {/* Transaction Code Input */}
                  <div>
                    <label
                      htmlFor="mpesaCode"
                      className="mb-1.5 block text-xs font-medium text-muted-foreground"
                    >
                      M-Pesa Transaction Code{" "}
                      <span className="text-foreground">(e.g. QHJ32ABC7)</span>
                    </label>
                    <input
                      id="mpesaCode"
                      name="mpesaCode"
                      type="text"
                      required
                      value={formData.mpesaCode}
                      onChange={(e) => setFormData((prev) => ({ ...prev, mpesaCode: e.target.value.toUpperCase().replace(/\s+/g, "").slice(0, 12) }))}
                      placeholder="e.g. QHJ32ABC7K"
                      maxLength={12}
                      pattern="[A-Za-z0-9]{8,12}"
                      title="8-12 letters and numbers from your M-Pesa SMS"
                      className="h-11 w-full rounded-lg border border-border bg-background px-3 font-mono text-sm tracking-widest text-foreground placeholder:font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      The transaction code is in the SMS M-Pesa sends after every successful payment (8-12 letters/numbers).
                    </p>
                  </div>
                </div>
              )}

              {orderError && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                  {orderError}
                </p>
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
                  disabled={placing}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60 lg:flex-none lg:px-8"
                >
                  {placing ? "Saving order..." : `Place Order — ${formatPrice(grandTotal)}`}
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

            {isNairobi ? (
              <p className="mt-3 text-center text-xs font-medium text-[#25D366]">
                Free delivery within Nairobi!
              </p>
            ) : formData.city ? (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Free delivery is available within Nairobi only.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
