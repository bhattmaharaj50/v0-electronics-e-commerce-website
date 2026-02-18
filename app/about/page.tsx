import { Shield, Truck, HeadphonesIcon, Award } from "lucide-react"
import Link from "next/link"

const values = [
  {
    icon: Shield,
    title: "Authentic Products",
    description:
      "We only sell genuine, brand-new electronics sourced directly from authorized distributors across Kenya and globally.",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    description:
      "Same-day delivery in Nairobi, and swift nationwide shipping to get your products to you quickly and safely.",
  },
  {
    icon: HeadphonesIcon,
    title: "Customer Support",
    description:
      "Our dedicated support team is available via WhatsApp, phone, and email to help with any questions or concerns.",
  },
  {
    icon: Award,
    title: "Competitive Pricing",
    description:
      "We offer the best prices in Kenya with regular deals and discounts, making premium electronics accessible to everyone.",
  },
]

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      {/* Hero */}
      <div className="mx-auto mb-16 max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          About 25FlowElectronics
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          We are Kenya&apos;s trusted electronics supplier, committed to bringing you the latest
          technology at competitive prices. Founded with a passion for making premium electronics
          accessible to every Kenyan, we&apos;ve grown from a small Nairobi shop to a nationwide
          online store serving thousands of happy customers.
        </p>
      </div>

      {/* Mission */}
      <div className="mb-16 rounded-2xl border border-border bg-card p-8 md:p-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-foreground">Our Mission</h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            To empower Kenyans with access to quality, affordable electronics and exceptional
            service. We believe everyone deserves the best technology, and we work tirelessly to
            deliver it right to your doorstep with trust and reliability at every step.
          </p>
        </div>
      </div>

      {/* Values */}
      <div className="mb-16">
        <h2 className="mb-8 text-center text-2xl font-bold text-foreground">Why Choose Us</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value) => (
            <div
              key={value.title}
              className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-6 text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                <value.icon className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="text-sm font-bold text-foreground">{value.title}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">{value.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="mb-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Happy Customers", value: "10,000+" },
          { label: "Products Available", value: "500+" },
          { label: "Years in Business", value: "5+" },
          { label: "Cities Served", value: "47" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-6 text-center"
          >
            <span className="text-3xl font-bold text-foreground">{stat.value}</span>
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Ready to Shop?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Browse our extensive collection of electronics at the best prices in Kenya.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Link
            href="/products"
            className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Shop Now
          </Link>
          <Link
            href="/contact"
            className="rounded-lg border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  )
}
