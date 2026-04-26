"use client"

import { useState } from "react"
import { Play } from "lucide-react"
import { useProductStore } from "@/lib/product-store"
import { getYouTubeId } from "@/lib/video-utils"

export function AdVideoSection() {
  const { settings } = useProductStore()
  const [playing, setPlaying] = useState(false)
  const url = settings.heroAdVideoUrl
  if (!url) return null
  const ytId = getYouTubeId(url)

  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-5 lg:px-8">
        <div className="lg:col-span-2 flex flex-col justify-center">
          <span className="mb-2 inline-block w-fit rounded-full border border-border bg-secondary px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Featured Showcase
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            {settings.heroAdTitle || "See What's New"}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {settings.heroAdSubtitle || "Watch our latest product showcase"}
          </p>
        </div>
        <div className="lg:col-span-3">
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-secondary">
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
                className="group relative flex h-full w-full items-center justify-center"
                aria-label="Play featured video"
              >
                {ytId ? (
                  <img
                    src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`}
                    alt={settings.heroAdTitle || "Video thumbnail"}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).src = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-secondary">
                    <Play className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute flex h-16 w-16 items-center justify-center rounded-full bg-foreground/90 shadow-xl transition-transform group-hover:scale-110">
                  <Play className="h-7 w-7 fill-background text-background" />
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
