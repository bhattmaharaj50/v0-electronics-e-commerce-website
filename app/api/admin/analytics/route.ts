import { NextResponse } from "next/server"
import { getTrafficAnalytics } from "@/lib/db"

export async function GET() {
  try {
    const analytics = await getTrafficAnalytics()
    return NextResponse.json({ analytics })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to load analytics" }, { status: 500 })
  }
}
