import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import webpush from "web-push"

// You'll need to generate VAPID keys and set these env variables
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || ""

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails("mailto:admin@iot-monitor.com", vapidPublicKey, vapidPrivateKey)
}

export async function POST(request: NextRequest) {
  try {
    const { title, body, data } = await request.json()

    return NextResponse.json(await handlePush({ title, body, data }))
  } catch (error) {
    console.error("Failed to send notifications:", error)
    return NextResponse.json({ error: "Failed to send notifications", success: false }, { status: 500 })
  }
}

export async function handlePush({ title, body, data }: { title: string; body: string; data: any }) {
  try {
    const db = await getDatabase()
    const collection = db.collection("push_subscriptions")

    const subscriptions = await collection.find({}).toArray()

    const notifications = subscriptions.map((sub) =>
      webpush
        .sendNotification(sub as unknown as webpush.PushSubscription, JSON.stringify({ title, body, data }))
        .catch((err: any) => {
          console.error("Push notification failed:", err)
          if (err.statusCode === 410) {
            collection.deleteOne({ endpoint: sub.endpoint })
          }
        }),
    )

    await Promise.allSettled(notifications)
    return { success: true, sent: subscriptions.length }
  } catch (error) {
    console.error("Failed to send notifications:", error)
  }
}
