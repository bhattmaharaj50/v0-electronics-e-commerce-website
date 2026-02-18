import type { Metadata, Viewport } from "next"
import { Inter, Space_Grotesk } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { CartProvider } from "@/lib/cart-context"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { WhatsAppButton } from "@/components/whatsapp-button"
import "./globals.css"

const _inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const _spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" })

export const metadata: Metadata = {
  title: "25FlowElectronics | Kenya's Trusted Electronics Store",
  description:
    "Shop the latest TVs, phones, fridges, gaming consoles, headphones and more at competitive prices. Fast delivery across Kenya.",
  keywords:
    "electronics, Kenya, Nairobi, TVs, phones, Samsung, iPhone, PlayStation, Xbox, fridges, headphones, online shopping",
  openGraph: {
    title: "25FlowElectronics | Kenya's Trusted Electronics Store",
    description:
      "Quality electronics at competitive prices. Delivered to your doorstep in Kenya.",
    type: "website",
    locale: "en_KE",
  },
}

export const viewport: Viewport = {
  themeColor: "#0f0f0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <CartProvider>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <WhatsAppButton />
        </CartProvider>
        <Analytics />
      </body>
    </html>
  )
}
