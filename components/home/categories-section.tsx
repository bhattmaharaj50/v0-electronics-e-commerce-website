import Link from "next/link"
import {
  Tv,
  Speaker,
  Smartphone,
  Refrigerator,
  Microwave,
  WashingMachine,
  CookingPot,
  Flame,
  Tablet,
  Headphones,
  Gamepad2,
  Joystick,
  Cable,
} from "lucide-react"
import { categories } from "@/lib/products"

const iconMap: Record<string, React.ElementType> = {
  Tv,
  Speaker,
  Smartphone,
  Refrigerator,
  Microwave,
  WashingMachine,
  CookingPot,
  Flame,
  Tablet,
  Headphones,
  Gamepad2,
  Joystick,
  Cable,
}

export function CategoriesSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <div className="mb-10 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Shop by Category
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Find exactly what you need from our wide range of electronics
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {categories.map((cat) => {
          const Icon = iconMap[cat.icon] || Tv
          return (
            <Link
              key={cat.slug}
              href={`/products?category=${cat.slug}`}
              className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-5 transition-all hover:border-muted-foreground/30 hover:bg-secondary"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary transition-colors group-hover:bg-accent">
                <Icon className="h-6 w-6 text-foreground" />
              </div>
              <span className="text-center text-xs font-medium text-foreground">{cat.name}</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
