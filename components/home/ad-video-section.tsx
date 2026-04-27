"use client"

import { useState } from "react"
import { Play, ArrowRight } from "lucide-react"
import { useProductStore } from "@/lib/product-store"
import { getYouTubeId } from "@/lib/video-utils"
import Link from "next/link"

export function AdVideoSection() {
  const { settings } = useProductStore()
  const [playing, setPlaying] = useState(false)
  const url = settings.heroAdVideoUrl
  if (!url) return null
  const ytId = getYouTubeId(url)

  return (
    <section className="relative overflow-hidden border-y border-white/5 bg-card/40">
      {/* Glow accents */}
      <div className="pointer-events-none absolute -left-32 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-white/[0.03] blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-1/4 h-96 w-96 rounded-full bg-white/[0.04] blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:py-24">
        <div className="lg:col-span-5">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <Play className="h-3 w-3" />
            Featured Showcase
          </span>
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
            {settings.heroAdTitle || "See What's New"}
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
            {settings.heroAdSubtitle || "Watch our latest product showcase."}
          </p>
          <Link
            href="/products"
            className="group mt-7 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background shadow-xl shadow-white/5 transition-transform hover:-translate-y-0.5"
          >
            Explore Showcase
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="lg:col-span-7">
          <div className="group relative">
            <div className="absolute -inset-3 -z-10 rounded-3xl bg-gradient-to-br from-white/15 via-white/5 to-transparent opacity-60 blur-2xl transition-opacity group-hover:opacity-100" />
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-secondary shadow-2xl shadow-black/40">
              {playing ? (
                ytId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&playsinline=1`}
                    title={settings.heroAdTitle || "Featured product video"}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video src={url} controls autoPlay playsInline className="h-full w-full object-cover" />
                )
              ) : (
                <button
                  onClick={() => setPlaying(true)}
                  className="relative flex h-full w-full items-center justify-center"
                  aria-label="Play featured video"
                >
                  {ytId ? (
                    <img
                      src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`}
                      alt={settings.heroAdTitle || "Video thumbnail"}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={(e) => {
                        ;(e.currentTarget as HTMLImageElement).src = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
                      }}
                    />
                  ) : (
                    <video
                      src={url}
                      muted
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-background/0 to-background/0" />

                  <div className="absolute flex h-20 w-20 items-center justify-center rounded-full bg-foreground/95 shadow-2xl shadow-black/40 transition-transform group-hover:scale-110">
                    <Play className="h-7 w-7 fill-background text-background" />
                  </div>

                  <div className="absolute bottom-5 left-5 flex items-center gap-2 rounded-full border border-white/20 bg-background/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-foreground backdrop-blur-md">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                    Now Playing
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
