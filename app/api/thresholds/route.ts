import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { type ThresholdSettings, DEFAULT_THRESHOLDS } from "@/lib/types"

export async function GET() {
  try {
    const db = await getDatabase()
    const collection = db.collection("thresholds")

    const thresholds = await collection.findOne({ type: "global" })

    return NextResponse.json({
      thresholds: thresholds || DEFAULT_THRESHOLDS,
      success: true,
    })
  } catch (error) {
    console.error("Failed to fetch thresholds:", error)
    return NextResponse.json({ error: "Failed to fetch thresholds", success: false }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDatabase()
    const collection = db.collection("thresholds")

    const thresholds: ThresholdSettings = await request.json()

    await collection.updateOne(
      { type: "global" },
      { $set: { ...thresholds, type: "global", updatedAt: new Date() } },
      { upsert: true },
    )

    return NextResponse.json({ success: true, thresholds })
  } catch (error) {
    console.error("Failed to save thresholds:", error)
    return NextResponse.json({ error: "Failed to save thresholds", success: false }, { status: 500 })
  }
}
