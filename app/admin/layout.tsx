import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin — Munex Electronics",
  robots: "noindex, nofollow",
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
