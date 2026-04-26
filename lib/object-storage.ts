import { Storage, type File } from "@google-cloud/storage"

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106"

const globalForStorage = globalThis as unknown as { munexStorage?: Storage }

export const objectStorageClient: Storage =
  globalForStorage.munexStorage ??
  new Storage({
    credentials: {
      audience: "replit",
      subject_token_type: "access_token",
      token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
      type: "external_account",
      credential_source: {
        url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
        format: { type: "json", subject_token_field_name: "access_token" },
      },
      universe_domain: "googleapis.com",
    },
    projectId: "",
  })

if (process.env.NODE_ENV !== "production") globalForStorage.munexStorage = objectStorageClient

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found")
    this.name = "ObjectNotFoundError"
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype)
  }
}

function parseObjectPath(path: string): { bucketName: string; objectName: string } {
  const trimmed = path.startsWith("/") ? path : `/${path}`
  const parts = trimmed.split("/")
  if (parts.length < 3) throw new Error("Invalid object path")
  return { bucketName: parts[1], objectName: parts.slice(2).join("/") }
}

function getPublicBucketRoot(): { bucketName: string; prefix: string } {
  const raw = (process.env.PUBLIC_OBJECT_SEARCH_PATHS || "").split(",").map((p) => p.trim()).filter(Boolean)
  if (raw.length === 0) {
    throw new Error("PUBLIC_OBJECT_SEARCH_PATHS is not set. Configure object storage in Replit.")
  }
  const { bucketName, objectName } = parseObjectPath(raw[0])
  return { bucketName, prefix: objectName }
}

function getPublicSearchRoots(): Array<{ bucketName: string; prefix: string }> {
  const raw = (process.env.PUBLIC_OBJECT_SEARCH_PATHS || "").split(",").map((p) => p.trim()).filter(Boolean)
  if (raw.length === 0) {
    throw new Error("PUBLIC_OBJECT_SEARCH_PATHS is not set. Configure object storage in Replit.")
  }
  return raw.map((p) => {
    const { bucketName, objectName } = parseObjectPath(p)
    return { bucketName, prefix: objectName }
  })
}

export async function uploadPublicObject(opts: {
  buffer: Buffer
  contentType: string
  filename: string
}): Promise<{ objectName: string; publicUrl: string }> {
  const { bucketName, prefix } = getPublicBucketRoot()
  const objectName = `${prefix}/uploads/${opts.filename}`
  const file = objectStorageClient.bucket(bucketName).file(objectName)
  await file.save(opts.buffer, {
    contentType: opts.contentType,
    resumable: false,
    metadata: { contentType: opts.contentType, cacheControl: "public, max-age=31536000, immutable" },
  })
  return { objectName, publicUrl: `/objects/uploads/${opts.filename}` }
}

export async function findPublicObject(relativePath: string): Promise<File | null> {
  const trimmed = relativePath.replace(/^\/+/, "")
  for (const { bucketName, prefix } of getPublicSearchRoots()) {
    const fullName = `${prefix}/${trimmed}`
    const file = objectStorageClient.bucket(bucketName).file(fullName)
    const [exists] = await file.exists()
    if (exists) return file
  }
  return null
}
