"use client"

import { useEffect, useState, useCallback } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/stat-card"
import { SensorChart } from "@/components/sensor-chart"
import { DataTable } from "@/components/data-table"
import { type SensorReading, type ThresholdSettings, DEFAULT_THRESHOLDS } from "@/lib/types"
import { Flame, Wind, Droplets, Thermometer, RefreshCw, Wifi, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function Dashboard() {
  const [isPolling, setIsPolling] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const {
    data: readingsData,
    error: readingsError,
    mutate: refreshReadings,
  } = useSWR<{
    readings: SensorReading[]
    success: boolean
  }>("/api/readings?limit=100", fetcher, { refreshInterval: isPolling ? 5000 : 0 })

  const { data: thresholdsData } = useSWR<{
    thresholds: ThresholdSettings
    success: boolean
  }>("/api/thresholds", fetcher)

  const readings = readingsData?.readings || []
  const thresholds = thresholdsData?.thresholds || DEFAULT_THRESHOLDS
  const latestReading = readings[0]

  useEffect(() => {
    if (readings.length > 0) {
      setLastUpdate(new Date())
    }
  }, [readings])

  const getStatus = useCallback(
    (type: "ch4" | "co" | "humidity" | "temperature", value: number) => {
      switch (type) {
        case "ch4":
          if (value > thresholds.ch4Max) return "danger"
          if (value > thresholds.ch4Max * 0.8) return "warning"
          return "normal"
        case "co":
          if (value > thresholds.coMax) return "danger"
          if (value > thresholds.coMax * 0.8) return "warning"
          return "normal"
        case "humidity":
          if (value < thresholds.humidityMin || value > thresholds.humidityMax) return "warning"
          return "normal"
        case "temperature":
          if (value < thresholds.temperatureMin || value > thresholds.temperatureMax) return "warning"
          return "normal"
        default:
          return "normal"
      }
    },
    [thresholds],
  )

  if (readingsError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive font-medium">Failed to load sensor data</p>
          <p className="text-sm text-muted-foreground mt-1">Make sure your MongoDB connection is configured</p>
          <Button variant="outline" className="mt-4 bg-transparent" onClick={() => refreshReadings()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {isPolling ? (
              <Wifi className="h-4 w-4 text-success" />
            ) : (
              <WifiOff className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm text-muted-foreground">
              {isPolling ? "Live updates enabled" : "Live updates paused"}
            </span>
          </div>
          {lastUpdate && (
            <span className="text-sm text-muted-foreground">Last update: {lastUpdate.toLocaleTimeString()}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsPolling(!isPolling)}>
            {isPolling ? "Pause" : "Resume"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refreshReadings()}>
            <RefreshCw className={cn("h-4 w-4 mr-2", !readingsData && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Methane (CH4)"
          value={latestReading?.ch4?.toFixed(2) || "--"}
          unit="ppm"
          icon={Flame}
          status={latestReading ? getStatus("ch4", latestReading.ch4) : "normal"}
        />
        <StatCard
          title="Carbon Monoxide (CO)"
          value={latestReading?.co?.toFixed(2) || "--"}
          unit="ppm"
          icon={Wind}
          status={latestReading ? getStatus("co", latestReading.co) : "normal"}
        />
        <StatCard
          title="Humidity"
          value={latestReading?.humidity?.toFixed(1) || "--"}
          unit="%"
          icon={Droplets}
          status={latestReading ? getStatus("humidity", latestReading.humidity) : "normal"}
        />
        <StatCard
          title="Temperature"
          value={latestReading?.temperature?.toFixed(1) || "--"}
          unit="°C"
          icon={Thermometer}
          status={latestReading ? getStatus("temperature", latestReading.temperature) : "normal"}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <SensorChart
          title="Methane (CH4)"
          data={readings}
          dataKey="ch4"
          unit="ppm"
          color="#ffffffff"
          threshold={{ max: thresholds.ch4Max }}
        />
        <SensorChart
          title="Carbon Monoxide (CO)"
          data={readings}
          dataKey="co"
          unit="ppm"
          color="#ffffffff"
          threshold={{ max: thresholds.coMax }}
        />
        <SensorChart
          title="Humidity"
          data={readings}
          dataKey="humidity"
          unit="%"
          color="#ffffffff"
          threshold={{ min: thresholds.humidityMin, max: thresholds.humidityMax }}
        />
        <SensorChart
          title="Temperature"
          data={readings}
          dataKey="temperature"
          unit="°C"
          color="#ffffffff"
          threshold={{ min: thresholds.temperatureMin, max: thresholds.temperatureMax }}
        />
      </div>

      {/* Data table */}
      <Card>
        <CardHeader>
          <CardTitle>Sensor Readings</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable data={readings} thresholds={thresholds} />
        </CardContent>
      </Card>
    </div>
  )
}
