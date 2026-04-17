import { NextResponse } from "next/server"
import { getStoreData } from "@/lib/db"

export async function GET() {
  try {
    return NextResponse.json(await getStoreData())
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to load store data" }, { status: 500 })
  }
}
