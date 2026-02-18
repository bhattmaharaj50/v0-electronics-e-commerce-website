import Link from "next/link"
import { Zap } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-base font-bold text-foreground">
                25Flow<span className="text-muted-foreground">Electronics</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Kenya&apos;s trusted electronics supplier. Quality products, competitive prices, delivered to your doorstep.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground">
              Quick Links
            </h3>
            <ul className="flex flex-col gap-2">
              {[
                { href: "/", label: "Home" },
                { href: "/products", label: "All Products" },
                { href: "/about", label: "About Us" },
                { href: "/contact", label: "Contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground">
              Categories
            </h3>
            <ul className="flex flex-col gap-2">
              {["TVs", "Phones", "Fridges", "Headphones", "PlayStations", "Tablets"].map((cat) => (
                <li key={cat}>
                  <Link
                    href={`/products?category=${cat.toLowerCase().replace(/ /g, "-")}`}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground">
              Contact Us
            </h3>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li>Nairobi, Kenya</li>
              <li>
                <a href="tel:+254793823013" className="transition-colors hover:text-foreground">
                  +254 793 823 013
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@25flowelectronics.co.ke"
                  className="transition-colors hover:text-foreground"
                >
                  info@25flowelectronics.co.ke
                </a>
              </li>
            </ul>
            {/* Social Icons */}
            <div className="mt-4 flex gap-3">
              {["Facebook", "Twitter", "Instagram"].map((social) => (
                <a
                  key={social}
                  href="#"
                  aria-label={social}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <span className="text-xs font-bold">{social[0]}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} 25FlowElectronics. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
