import { Headphones, ShieldCheck, Smartphone, Truck } from "lucide-react"

const items = [
  {
    icon: Truck,
    title: "Fast Delivery",
    sub: "Across all 47 counties",
  },
  {
    icon: ShieldCheck,
    title: "Genuine Warranty",
    sub: "Authentic, brand-new stock",
  },
  {
    icon: Smartphone,
    title: "M-Pesa Checkout",
    sub: "Pay safely via Lipa Na M-Pesa",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    sub: "WhatsApp & call any time",
  },
]

export function TrustBand() {
  return (
    <section className="border-y border-white/5 bg-card/40">
      <div className="mx-auto grid max-w-7xl gap-px overflow-hidden bg-white/5 px-0 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ icon: Icon, title, sub }) => (
          <div
            key={title}
            className="group flex items-center gap-4 bg-card/80 px-6 py-6 transition-colors hover:bg-card"
          >
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-background/60 transition-colors group-hover:bg-background">
              <Icon className="h-5 w-5 text-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="truncate text-xs text-muted-foreground">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
