import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const db = await getDatabase()
    const collection = db.collection("push_subscriptions")

    const subscription = await request.json()

    await collection.updateOne(
      { endpoint: subscription.endpoint },
      { $set: { ...subscription, updatedAt: new Date() } },
      { upsert: true },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to save subscription:", error)
    return NextResponse.json({ error: "Failed to save subscription", success: false }, { status: 500 })
  }
}
