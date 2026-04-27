import { NextResponse } from "next/server"
import { fetchObject } from "@/lib/storage"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await context.params
    const segments = path || []
    for (const seg of segments) {
      if (!seg || seg === "." || seg === ".." || seg.includes("\\") || seg.includes("/")) {
        return NextResponse.json({ error: "Object not found" }, { status: 404 })
      }
    }
    const relativePath = segments.join("/")
    if (!relativePath) {
      return NextResponse.json({ error: "Object not found" }, { status: 404 })
    }

    const obj = await fetchObject(relativePath)
    if (!obj) {
      return NextResponse.json({ error: "Object not found" }, { status: 404 })
    }

    const headers: Record<string, string> = {
      "Content-Type": obj.contentType,
      "Cache-Control": obj.cacheControl,
    }
    if (obj.size) headers["Content-Length"] = String(obj.size)

    return new Response(obj.body, { headers })
  } catch (error) {
    console.error("Object fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch object" }, { status: 500 })
  }
}
