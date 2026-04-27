import { NextResponse } from "next/server"
import { authErrorResponse, requireAdmin } from "@/lib/auth"
import { requireCsrf } from "@/lib/csrf"
import { deleteUpload, listUploads } from "@/lib/storage"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
} as const

export async function GET() {
  try {
    await requireAdmin()
    const items = await listUploads()
    return NextResponse.json({ items }, { headers: NO_STORE })
  } catch (error) {
    if ((error as { status?: number })?.status) {
      const { status, body } = authErrorResponse(error)
      return NextResponse.json(body, { status })
    }
    console.error("List uploads failed:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list uploads" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin()
    await requireCsrf(request)
    const url = new URL(request.url)
    const filename = url.searchParams.get("filename") || ""
    if (!filename) {
      return NextResponse.json({ error: "filename is required" }, { status: 400 })
    }
    if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 })
    }
    const deleted = await deleteUpload(filename)
    if (!deleted) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    if ((error as { status?: number })?.status) {
      const { status, body } = authErrorResponse(error)
      return NextResponse.json(body, { status })
    }
    console.error("Delete upload failed:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete" },
      { status: 500 },
    )
  }
}
