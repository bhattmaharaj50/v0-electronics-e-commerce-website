import path from "path"

export type StorageBackend = "netlify" | "replit" | "db"

export function getStorageBackend(): StorageBackend {
  if (process.env.NETLIFY === "true" || process.env.NETLIFY_BLOBS_CONTEXT) {
    return "netlify"
  }
  // Only use Replit Object Storage if a bucket has actually been provisioned.
  if (process.env.PUBLIC_OBJECT_SEARCH_PATHS) {
    return "replit"
  }
  // Universal fallback: store uploads in the application database. This means
  // image / video uploads work out of the box on any host without requiring
  // the user to manually create a bucket first.
  return "db"
}

const NETLIFY_STORE_NAME = "munex-uploads"

export interface UploadResult {
  publicUrl: string
}

export interface FetchedObject {
  body: ReadableStream<Uint8Array>
  contentType: string
  cacheControl: string
  size?: number
}

export async function uploadFile(opts: {
  buffer: Buffer
  contentType: string
  filename: string
}): Promise<UploadResult> {
  const backend = getStorageBackend()
  if (backend === "netlify") {
    const { getStore } = await import("@netlify/blobs")
    const store = getStore({ name: NETLIFY_STORE_NAME, consistency: "strong" })
    const ab = opts.buffer.buffer.slice(
      opts.buffer.byteOffset,
      opts.buffer.byteOffset + opts.buffer.byteLength,
    ) as ArrayBuffer
    await store.set(opts.filename, ab, {
      metadata: { contentType: opts.contentType, cacheControl: "public, max-age=31536000, immutable" },
    })
    return { publicUrl: `/objects/uploads/${opts.filename}` }
  }
  if (backend === "replit") {
    const { uploadPublicObject } = await import("@/lib/object-storage")
    const result = await uploadPublicObject(opts)
    return { publicUrl: result.publicUrl }
  }
  const { dbUploadFile } = await import("@/lib/db-storage")
  return dbUploadFile(opts)
}

export async function fetchObject(relativePath: string): Promise<FetchedObject | null> {
  const backend = getStorageBackend()
  const trimmed = relativePath.replace(/^\/+/, "")

  if (backend === "netlify") {
    const { getStore } = await import("@netlify/blobs")
    const store = getStore({ name: NETLIFY_STORE_NAME, consistency: "strong" })
    const key = trimmed.startsWith("uploads/") ? trimmed.slice("uploads/".length) : trimmed
    const result = await store.getWithMetadata(key, { type: "stream" })
    if (!result) return null
    const meta = (result.metadata || {}) as { contentType?: string; cacheControl?: string }
    return {
      body: result.data as unknown as ReadableStream<Uint8Array>,
      contentType: meta.contentType || guessContentType(key),
      cacheControl: meta.cacheControl || "public, max-age=3600",
    }
  }

  if (backend === "replit") {
    const { findPublicObject } = await import("@/lib/object-storage")
    const file = await findPublicObject(trimmed)
    if (!file) return null
    const [metadata] = await file.getMetadata()
    const stream = file.createReadStream() as unknown as NodeJS.ReadableStream
    const webStream = new ReadableStream<Uint8Array>({
      start(controller) {
        stream.on("data", (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)))
        stream.on("end", () => controller.close())
        stream.on("error", (err) => controller.error(err))
      },
      cancel() {
        ;(stream as unknown as { destroy?: () => void }).destroy?.()
      },
    })
    return {
      body: webStream,
      contentType: metadata.contentType || "application/octet-stream",
      cacheControl: metadata.cacheControl || "public, max-age=3600",
      size: typeof metadata.size === "number" ? metadata.size : metadata.size ? Number(metadata.size) : undefined,
    }
  }

  const { dbFetchObject } = await import("@/lib/db-storage")
  return dbFetchObject(trimmed)
}

export interface UploadEntry {
  filename: string
  publicUrl: string
  contentType: string
  size: number
  updated: string
}

export async function listUploads(): Promise<UploadEntry[]> {
  const backend = getStorageBackend()
  if (backend === "netlify") {
    const { getStore } = await import("@netlify/blobs")
    const store = getStore({ name: NETLIFY_STORE_NAME, consistency: "strong" })
    const result = await store.list()
    const entries: UploadEntry[] = []
    for (const blob of result.blobs || []) {
      const filename = blob.key
      try {
        const meta = await store.getMetadata(filename)
        const md = ((meta?.metadata || {}) as { contentType?: string }) || {}
        entries.push({
          filename,
          publicUrl: `/objects/uploads/${filename}`,
          contentType: md.contentType || guessContentType(filename),
          size: 0,
          updated: new Date(0).toISOString(),
        })
      } catch {
        entries.push({
          filename,
          publicUrl: `/objects/uploads/${filename}`,
          contentType: guessContentType(filename),
          size: 0,
          updated: new Date(0).toISOString(),
        })
      }
    }
    return entries.sort((a, b) => (a.filename < b.filename ? 1 : -1))
  }
  if (backend === "replit") {
    const { listPublicUploads } = await import("@/lib/object-storage")
    return listPublicUploads()
  }
  const { dbListUploads } = await import("@/lib/db-storage")
  return dbListUploads()
}

export async function deleteUpload(filename: string): Promise<boolean> {
  if (!filename || filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
    return false
  }
  const backend = getStorageBackend()
  if (backend === "netlify") {
    const { getStore } = await import("@netlify/blobs")
    const store = getStore({ name: NETLIFY_STORE_NAME, consistency: "strong" })
    await store.delete(filename)
    return true
  }
  if (backend === "replit") {
    const { deletePublicUpload } = await import("@/lib/object-storage")
    return deletePublicUpload(filename)
  }
  const { dbDeleteUpload } = await import("@/lib/db-storage")
  return dbDeleteUpload(filename)
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
