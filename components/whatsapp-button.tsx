"use client"

import { MessageCircle } from "lucide-react"

export function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/254793823013?text=Hello%2025FlowElectronics!%20I'm%20interested%20in%20your%20products."
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg transition-transform hover:scale-110"
    >
      <MessageCircle className="h-7 w-7 text-[#fff]" />
    </a>
  )
}
