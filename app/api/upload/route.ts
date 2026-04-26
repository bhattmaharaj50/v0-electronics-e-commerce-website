import { NextResponse } from "next/server"
import path from "path"
import { uploadPublicObject } from "@/lib/object-storage"

export const runtime = "nodejs"
export const maxDuration = 60
export const dynamic = "force-dynamic"

const MAX_SIZE = 1024 * 1024 * 1024 // 1 GB

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const allowedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg", "image/avif", "image/svg+xml"]
    const allowedVideoTypes = ["video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/x-matroska", "video/3gpp"]
    const allowed = [...allowedImageTypes, ...allowedVideoTypes]

    if (!allowed.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type "${file.type}". Use JPEG, PNG, WebP, GIF, AVIF, MP4, WebM, MOV or MKV.` },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      const sizeMb = (file.size / 1024 / 1024).toFixed(1)
      return NextResponse.json(
        { error: `File too large (${sizeMb} MB). Maximum size is 1 GB.` },
        { status: 400 }
      )
    }

    const ext = path.extname(file.name).toLowerCase() || (file.type.startsWith("video/") ? ".mp4" : ".jpg")
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const { publicUrl } = await uploadPublicObject({
      buffer,
      contentType: file.type,
      filename: safeName,
    })

    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    console.error("Upload error:", error)
    const message = error instanceof Error ? error.message : "Upload failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
