"use client"

import { useState } from "react"
import { Play, ArrowRight } from "lucide-react"
import { useProductStore } from "@/lib/product-store"
import Link from "next/link"

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/\s]{11})/)
  return match ? match[1] : null
}

function VideoCard({ productId, name, videoUrl }: { productId: string; name: string; videoUrl: string }) {
  const [playing, setPlaying] = useState(false)
  const ytId = getYouTubeId(videoUrl)

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="relative aspect-video w-full bg-secondary">
        {playing ? (
          ytId ? (
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
              title={name}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video src={videoUrl} controls autoPlay className="h-full w-full object-cover" />
          )
        ) : (
          <button
            onClick={() => setPlaying(true)}
            className="group relative flex h-full w-full items-center justify-center"
            aria-label={`Play video for ${name}`}
          >
            {ytId ? (
              <img
                src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                alt={name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-secondary">
                <Play className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            <div className="absolute flex h-14 w-14 items-center justify-center rounded-full bg-foreground/90 shadow-xl transition-transform group-hover:scale-110">
              <Play className="h-6 w-6 fill-background text-background" />
            </div>
          </button>
        )}
      </div>
      <div className="flex items-center justify-between p-4">
        <p className="line-clamp-1 text-sm font-semibold text-foreground">{name}</p>
        <Link
          href={`/products/${productId}`}
          className="ml-4 shrink-0 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          View Product →
        </Link>
      </div>
    </div>
  )
}

export function VideosSection() {
  const { products } = useProductStore()
  const withVideos = products.filter((p) => p.videoUrl)

  if (withVideos.length === 0) return null

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Play className="h-5 w-5 text-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Watch &amp; Shop</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Product Videos
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            See our products in action before you buy
          </p>
        </div>
        <Link
          href="/products"
          className="hidden items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:flex"
        >
          Shop All
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {withVideos.slice(0, 6).map((product) => (
          <VideoCard
            key={product.id}
            productId={product.id}
            name={product.name}
            videoUrl={product.videoUrl!}
          />
        ))}
      </div>
    </section>
  )
}
