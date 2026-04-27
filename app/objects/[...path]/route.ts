import { NextResponse } from "next/server"
import { findPublicObject, ObjectNotFoundError } from "@/lib/object-storage"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await context.params
    const segments = path || []
    // Reject path-traversal and absolute-path tricks. Bucket scoping on its own
    // is not enough — `..` segments would let a request escape the public prefix.
    for (const seg of segments) {
      if (!seg || seg === "." || seg === ".." || seg.includes("\\") || seg.includes("/")) {
        return NextResponse.json({ error: "Object not found" }, { status: 404 })
      }
    }
    const relativePath = segments.join("/")
    if (!relativePath) {
      return NextResponse.json({ error: "Object not found" }, { status: 404 })
    }

    const file = await findPublicObject(relativePath)
    if (!file) {
      return NextResponse.json({ error: "Object not found" }, { status: 404 })
    }

    const [metadata] = await file.getMetadata()
    const contentType = metadata.contentType || "application/octet-stream"
    const cacheControl = metadata.cacheControl || "public, max-age=3600"

    const stream = file.createReadStream() as unknown as NodeJS.ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        stream.on("data", (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)))
        stream.on("end", () => controller.close())
        stream.on("error", (err) => controller.error(err))
      },
      cancel() {
        ;(stream as any).destroy?.()
      },
    })

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": cacheControl,
    }
    if (metadata.size) headers["Content-Length"] = String(metadata.size)

    return new Response(webStream, { headers })
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      return NextResponse.json({ error: "Object not found" }, { status: 404 })
    }
    console.error("Object fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch object" }, { status: 500 })
  }
}
