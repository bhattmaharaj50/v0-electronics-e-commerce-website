import { NextResponse } from "next/server"
import { listProductReviews, saveReview } from "@/lib/db"
import { rateLimit, clientIp } from "@/lib/rate-limit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const productId = url.searchParams.get("productId")
    if (!productId) return NextResponse.json({ error: "productId is required" }, { status: 400 })
    const reviews = await listProductReviews(productId)
    return NextResponse.json({ reviews })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to fetch reviews" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Rate limit per IP: 5 reviews / 10 minutes to deter spam.
    const rl = rateLimit(`reviews:${clientIp(request)}`, { windowMs: 10 * 60 * 1000, max: 5 })
    if (!rl.ok) {
      return NextResponse.json(
        { error: "You're posting too quickly. Please try again in a few minutes." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
      )
    }

    const body = await request.json().catch(() => ({}))
    const productId = String(body.productId || "").trim()
    const name = String(body.name || "").trim()
    const comment = String(body.comment || "").trim()
    const ratingNum = Math.max(1, Math.min(5, Math.round(Number(body.rating) || 0)))

    if (!productId) return NextResponse.json({ error: "Product is required" }, { status: 400 })
    if (name.length < 2 || name.length > 80) {
      return NextResponse.json({ error: "Name must be 2 to 80 characters" }, { status: 400 })
    }
    if (comment.length < 3 || comment.length > 1000) {
      return NextResponse.json({ error: "Comment must be 3 to 1000 characters" }, { status: 400 })
    }
    if (!ratingNum) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }

    const review = await saveReview({ productId, name, rating: ratingNum, comment })
    return NextResponse.json({ review })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save review" },
      { status: 500 }
    )
  }
}
