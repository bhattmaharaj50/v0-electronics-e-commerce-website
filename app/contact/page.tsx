"use client"

import { useState } from "react"
import { Phone, Mail, MapPin, MessageCircle, Send, CheckCircle2 } from "lucide-react"

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Get in Touch
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          We&apos;d love to hear from you. Reach out via any of the channels below.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Contact Info + Map */}
        <div className="flex flex-col gap-6">
          {/* Contact Cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            <a
              href="https://wa.me/254700000000"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-muted-foreground/30"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#25D366]/10">
                <MessageCircle className="h-5 w-5 text-[#25D366]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">WhatsApp</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">Chat with us directly</p>
              </div>
            </a>

            <a
              href="tel:+254700000000"
              className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-muted-foreground/30"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <Phone className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Phone</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">+254 700 000 000</p>
              </div>
            </a>

            <a
              href="mailto:info@25flowelectronics.co.ke"
              className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-muted-foreground/30"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <Mail className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Email</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">info@25flowelectronics.co.ke</p>
              </div>
            </a>

            <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <MapPin className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Location</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">Nairobi CBD, Kenya</p>
              </div>
            </div>
          </div>

          {/* Nairobi Map Embed */}
          <div className="overflow-hidden rounded-xl border border-border">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15955.201944593675!2d36.81196503!3d-1.28333335!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f10d6448e5c97%3A0x311b16ee2c225bca!2sNairobi%20CBD%2C%20Nairobi!5e0!3m2!1sen!2ske!4v1700000000000!5m2!1sen!2ske"
              width="100%"
              height="300"
              style={{ border: 0, filter: "invert(90%) hue-rotate(180deg)" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="25FlowElectronics location in Nairobi"
            />
          </div>
        </div>

        {/* Contact Form */}
        <div className="rounded-xl border border-border bg-card p-6 lg:p-8">
          {submitted ? (
            <div className="flex flex-col items-center py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-foreground" />
              <h2 className="mt-4 text-xl font-bold text-foreground">Message Sent!</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                We&apos;ll get back to you within 24 hours.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false)
                  setFormData({ name: "", email: "", subject: "", message: "" })
                }}
                className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <>
              <h2 className="mb-6 text-lg font-bold text-foreground">Send Us a Message</h2>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label htmlFor="contactEmail" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Email
                  </label>
                  <input
                    id="contactEmail"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Subject
                  </label>
                  <input
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full resize-none rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <Send className="h-4 w-4" />
                  Send Message
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
