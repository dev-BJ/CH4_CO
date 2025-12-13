import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    const collection = db.collection("readings")

    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get("format") || "json"
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    const query: Record<string, unknown> = {}
    if (from || to) {
      query.timestamp = {}
      if (from) (query.timestamp as Record<string, Date>).$gte = new Date(from)
      if (to) (query.timestamp as Record<string, Date>).$lte = new Date(to)
    }

    const readings = await collection.find(query).sort({ timestamp: -1 }).toArray()

    if (format === "csv") {
      const headers = ["Device ID", "CH4 (ppm)", "CO2 (ppm)", "Humidity (%)", "Temperature (°C)", "Timestamp"]
      const rows = readings.map((r) =>
        [r.deviceId, r.ch4, r.co2, r.humidity, r.temperature, new Date(r.timestamp).toISOString()].join(","),
      )
      const csv = [headers.join(","), ...rows].join("\n")

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="sensor-data-${Date.now()}.csv"`,
        },
      })
    }

    return NextResponse.json({ readings, exportedAt: new Date().toISOString() })
  } catch (error) {
    console.error("Failed to export data:", error)
    return NextResponse.json({ error: "Failed to export data", success: false }, { status: 500 })
  }
}
