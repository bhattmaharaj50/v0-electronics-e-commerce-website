import { NextResponse } from "next/server"
import { listProductReviews, saveReview } from "@/lib/db"

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
    const body = await request.json()
    if (!body.productId || !body.name || !body.comment) {
      return NextResponse.json({ error: "Name, rating, and comment are required" }, { status: 400 })
    }
    const review = await saveReview({
      productId: String(body.productId),
      name: String(body.name),
      rating: Number(body.rating) || 5,
      comment: String(body.comment),
    })
    return NextResponse.json({ review })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save review" }, { status: 500 })
  }
}
