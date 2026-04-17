import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const allowedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"]
    const allowedVideoTypes = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"]
    const allowed = [...allowedImageTypes, ...allowedVideoTypes]

    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file type. Use JPEG, PNG, WebP, MP4, or WebM." }, { status: 400 })
    }

    const maxSize = 100 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large. Maximum size is 100MB." }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const ext = path.extname(file.name).toLowerCase() || (file.type.startsWith("video/") ? ".mp4" : ".jpg")
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
    const uploadsDir = path.join(process.cwd(), "public", "uploads")

    await mkdir(uploadsDir, { recursive: true })
    await writeFile(path.join(uploadsDir, safeName), buffer)

    const url = `/uploads/${safeName}`
    return NextResponse.json({ url })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
