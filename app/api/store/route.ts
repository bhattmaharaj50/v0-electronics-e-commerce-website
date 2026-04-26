import { NextResponse } from "next/server"
import { getStoreData } from "@/lib/db"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    const data = await getStoreData()
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to load store data" }, { status: 500 })
  }
}
