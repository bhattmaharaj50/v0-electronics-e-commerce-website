import { NextResponse } from "next/server"

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "munex2024"

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  if (body.username === ADMIN_USERNAME && body.password === ADMIN_PASSWORD) {
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: "Invalid username or password" }, { status: 401 })
}
