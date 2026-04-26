"use client"

import { useState } from "react"
import { Play } from "lucide-react"
import { useProductStore } from "@/lib/product-store"
import { getYouTubeId } from "@/lib/video-utils"

function HomepageVideoCard({ url, index }: { url: string; index: number }) {
  const [playing, setPlaying] = useState(false)
  const ytId = getYouTubeId(url)

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="relative aspect-video w-full bg-secondary">
        {playing ? (
          ytId ? (
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&playsinline=1`}
              title={`Featured video ${index + 1}`}
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
            aria-label={`Play featured video ${index + 1}`}
          >
            {ytId ? (
              <img
                src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`}
                alt={`Video ${index + 1}`}
                className="h-full w-full object-cover"
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
                className="h-full w-full object-cover"
              />
            )}
            <div className="absolute flex h-16 w-16 items-center justify-center rounded-full bg-foreground/90 shadow-xl transition-transform group-hover:scale-110">
              <Play className="h-7 w-7 fill-background text-background" />
            </div>
          </button>
        )}
      </div>
    </div>
  )
}

export function HomepageVideosSection() {
  const { settings } = useProductStore()
  const videos = (settings.heroGalleryVideos || []).filter(Boolean)
  if (videos.length === 0) return null

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <Play className="h-5 w-5 text-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Featured Videos
          </span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Watch More from Munex
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Tap any video to play
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((url, index) => (
          <HomepageVideoCard key={`${url}-${index}`} url={url} index={index} />
        ))}
      </div>
    </section>
  )
}
