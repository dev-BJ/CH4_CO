import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { type SensorReading, DEFAULT_THRESHOLDS } from "@/lib/types"
import { handlePush } from "../push/send/route"
import { z } from "zod"

// GET - Fetch sensor readings
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    const collection = db.collection<SensorReading>("readings")

    const searchParams = request.nextUrl.searchParams
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const since = searchParams.get("since")

    const query: Record<string, unknown> = {}
    if (since) {
      query.timestamp = { $gt: new Date(since) }
    }

    const readings = await collection.find(query).sort({ timestamp: -1 }).limit(limit).toArray()

    return NextResponse.json({ readings, success: true })
  } catch (error) {
    console.error("Failed to fetch readings:", error)
    return NextResponse.json({ error: "Failed to fetch readings", success: false }, { status: 500 })
  }
}

// POST - Receive data from hardware device
export async function POST(request: NextRequest) {
  try {
    const headless_param = Boolean(request.nextUrl.searchParams.get("headless")) || false
    const db = await getDatabase()
    const collection = db.collection<SensorReading>("readings")
    const thresholdsCollection = db.collection("thresholds")

    const data: Omit<SensorReading, "_id" | "timestamp"> = await request.json()

    const dataSchema = z.object({
      deviceId: z.string(),
      ch4: z.number(),
      co2: z.number(),
      humidity: z.number(),
      temperature: z.number(),
    })

    const validationResult = await dataSchema.safeParseAsync(data) // Validate incoming data

    if (!validationResult.success) {
      console.error("Invalid data received:", validationResult.error)
      return NextResponse.json({ error: "Invalid data received", success: false }, { status: 400 })
    }

    const reading: SensorReading = {
      ...data,
      timestamp: new Date(),
    }

    await collection.insertOne(reading)

    // Check thresholds for push notifications
    const thresholdDoc = await thresholdsCollection.findOne({ type: "global" })
    const thresholds = thresholdDoc || DEFAULT_THRESHOLDS

    const alerts: string[] = []
    if (reading.ch4 > thresholds.ch4Max) {
      alerts.push(`CH4 level (${reading.ch4} ppm) exceeds threshold`)
    }
    if (reading.co2 > thresholds.coMax) {
      alerts.push(`CO level (${reading.co2} ppm) exceeds threshold`)
    }
    if (reading.humidity < thresholds.humidityMin || reading.humidity > thresholds.humidityMax) {
      alerts.push(`Humidity (${reading.humidity}%) out of range`)
    }
    if (reading.temperature < thresholds.temperatureMin || reading.temperature > thresholds.temperatureMax) {
      alerts.push(`Temperature (${reading.temperature}°C) out of range`)
    }

    // send push notifications
    if (alerts.length > 0) {
      await handlePush({
        title: "Gas Dash Alert",
        body: alerts.join("\n"),
        data: reading,
      })
    }

    if (headless_param) {
      return NextResponse.json({ success: true })
    }
    return NextResponse.json({
      success: true,
      reading,
      alerts: alerts.length > 0 ? alerts : null,
    })
  } catch (error) {
    console.error("Failed to save reading:", error)
    if (request.nextUrl.searchParams.get("headless")) {
      return NextResponse.json({ success: false }, { status: 500 })
    }
    return NextResponse.json({ error: "Failed to save reading", success: false }, { status: 500 })
  }
}
