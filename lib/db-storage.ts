import { pool, ensureDatabase } from "@/lib/db"
import path from "path"

export interface DbUploadResult {
  publicUrl: string
}

export interface DbFetchedObject {
  body: ReadableStream<Uint8Array>
  contentType: string
  cacheControl: string
  size?: number
}

export interface DbUploadEntry {
  filename: string
  publicUrl: string
  contentType: string
  size: number
  updated: string
}

function publicUrlFor(filename: string): string {
  return `/objects/uploads/${filename}`
}

function stripUploadsPrefix(relativePath: string): string {
  const trimmed = relativePath.replace(/^\/+/, "")
  return trimmed.startsWith("uploads/") ? trimmed.slice("uploads/".length) : trimmed
}

export async function dbUploadFile(opts: {
  buffer: Buffer
  contentType: string
  filename: string
}): Promise<DbUploadResult> {
  await ensureDatabase()
  await pool.query(
    `INSERT INTO uploads (filename, content_type, size, data)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (filename) DO UPDATE
       SET content_type = EXCLUDED.content_type,
           size = EXCLUDED.size,
           data = EXCLUDED.data,
           created_at = NOW()`,
    [opts.filename, opts.contentType, opts.buffer.byteLength, opts.buffer],
  )
  return { publicUrl: publicUrlFor(opts.filename) }
}

export async function dbFetchObject(relativePath: string): Promise<DbFetchedObject | null> {
  await ensureDatabase()
  const filename = stripUploadsPrefix(relativePath)
  if (!filename || filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
    return null
  }
  const result = await pool.query(
    `SELECT content_type, size, data FROM uploads WHERE filename = $1 LIMIT 1`,
    [filename],
  )
  const row = result.rows[0]
  if (!row) return null
  const buffer: Buffer = row.data
  const bytes = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes)
      controller.close()
    },
  })
  return {
    body,
    contentType: row.content_type || guessContentType(filename),
    cacheControl: "public, max-age=31536000, immutable",
    size: typeof row.size === "number" ? row.size : Number(row.size) || buffer.byteLength,
  }
}

export async function dbListUploads(): Promise<DbUploadEntry[]> {
  await ensureDatabase()
  const result = await pool.query(
    `SELECT filename, content_type, size, created_at
     FROM uploads
     ORDER BY created_at DESC
     LIMIT 500`,
  )
  return result.rows.map((row) => ({
    filename: row.filename as string,
    publicUrl: publicUrlFor(row.filename as string),
    contentType: (row.content_type as string) || guessContentType(row.filename as string),
    size: typeof row.size === "number" ? row.size : Number(row.size) || 0,
    updated: new Date(row.created_at).toISOString(),
  }))
}

export async function dbDeleteUpload(filename: string): Promise<boolean> {
  if (!filename || filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
    return false
  }
  await ensureDatabase()
  const result = await pool.query(`DELETE FROM uploads WHERE filename = $1`, [filename])
  return (result.rowCount || 0) > 0
}

function guessContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  const map: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".avif": "image/avif",
    ".svg": "image/svg+xml",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".ogg": "video/ogg",
    ".mov": "video/quicktime",
    ".mkv": "video/x-matroska",
    ".3gp": "video/3gpp",
  }
  return map[ext] || "application/octet-stream"
}
