"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { type ThresholdSettings, DEFAULT_THRESHOLDS } from "@/lib/types"
import {
  Bell,
  BellOff,
  Download,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileJson,
  FileSpreadsheet,
} from "lucide-react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function SettingsPanel() {
  const [thresholds, setThresholds] = useState<ThresholdSettings>(DEFAULT_THRESHOLDS)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushSupported, setPushSupported] = useState(false)
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [dateRange, setDateRange] = useState({ from: "", to: "" })
  const [isExporting, setIsExporting] = useState(false)

  const { data: thresholdsData, mutate: refreshThresholds } = useSWR<{
    thresholds: ThresholdSettings
    success: boolean
  }>("/api/thresholds", fetcher)

  useEffect(() => {
    if (thresholdsData?.thresholds) {
      setThresholds(thresholdsData.thresholds)
    }
  }, [thresholdsData])

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setPushSupported(true)
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((subscription) => {
          setPushEnabled(!!subscription)
        })
      })
    }
  }, [])

  const saveThresholds = async () => {
    setIsSaving(true)
    setSaveMessage(null)

    try {
      const response = await fetch("/api/thresholds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(thresholds),
      })

      if (!response.ok) throw new Error("Failed to save")

      setSaveMessage({ type: "success", text: "Thresholds saved successfully" })
      refreshThresholds()
    } catch {
      setSaveMessage({ type: "error", text: "Failed to save thresholds" })
    } finally {
      setIsSaving(false)
    }
  }

  const togglePushNotifications = async () => {
    if (!pushSupported) return

    setIsSubscribing(true)

    try {
      const registration = await navigator.serviceWorker.ready

      if (pushEnabled) {
        const subscription = await registration.pushManager.getSubscription()
        if (subscription) {
          await subscription.unsubscribe()
          setPushEnabled(false)
        }
      } else {
        const permission = await Notification.requestPermission()
        if (permission !== "granted") {
          throw new Error("Notification permission denied")
        }

        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!vapidPublicKey) {
          throw new Error("VAPID public key not configured")
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidPublicKey,
        })

        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription.toJSON()),
        })

        setPushEnabled(true)
        // navigator.serviceWorker.controller?.postMessage({ type: "START_POLLING" })
      }
    } catch (error) {
      console.error("Push notification error:", error)
    } finally {
      setIsSubscribing(false)
    }
  }

  const exportData = async (format: "csv" | "json") => {
    setIsExporting(true)

    try {
      const params = new URLSearchParams({ format })
      if (dateRange.from) params.set("from", dateRange.from)
      if (dateRange.to) params.set("to", dateRange.to)

      const response = await fetch(`/api/export?${params}`)

      if (format === "csv") {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `sensor-data-${Date.now()}.csv`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        const data = await response.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `sensor-data-${Date.now()}.json`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error("Export failed:", error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Threshold Settings */}
      <Card id="thresholds">
        <CardHeader>
          <CardTitle>Alert Thresholds</CardTitle>
          <CardDescription>
            Set threshold values for sensor alerts. You&apos;ll be notified when readings exceed these limits.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {saveMessage && (
            <Alert variant={saveMessage.type === "error" ? "destructive" : "default"}>
              {saveMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{saveMessage.text}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ch4Max">CH4 Maximum (ppm)</Label>
              <Input
                id="ch4Max"
                type="number"
                value={thresholds.ch4Max}
                onChange={(e) => setThresholds({ ...thresholds, ch4Max: Number.parseFloat(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">Alert when methane exceeds this value</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="coMax">CO Maximum (ppm)</Label>
              <Input
                id="coMax"
                type="number"
                value={thresholds.coMax}
                onChange={(e) => setThresholds({ ...thresholds, coMax: Number.parseFloat(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">OSHA limit is 50 ppm (8-hour TWA)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="humidityMin">Humidity Minimum (%)</Label>
              <Input
                id="humidityMin"
                type="number"
                value={thresholds.humidityMin}
                onChange={(e) => setThresholds({ ...thresholds, humidityMin: Number.parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="humidityMax">Humidity Maximum (%)</Label>
              <Input
                id="humidityMax"
                type="number"
                value={thresholds.humidityMax}
                onChange={(e) => setThresholds({ ...thresholds, humidityMax: Number.parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="temperatureMin">Temperature Minimum (°C)</Label>
              <Input
                id="temperatureMin"
                type="number"
                value={thresholds.temperatureMin}
                onChange={(e) => setThresholds({ ...thresholds, temperatureMin: Number.parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="temperatureMax">Temperature Maximum (°C)</Label>
              <Input
                id="temperatureMax"
                type="number"
                value={thresholds.temperatureMax}
                onChange={(e) => setThresholds({ ...thresholds, temperatureMax: Number.parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <Button onClick={saveThresholds} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Thresholds
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card id="notifications">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {pushEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
            Push Notifications
          </CardTitle>
          <CardDescription>Receive alerts when sensor readings exceed threshold values</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!pushSupported ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Not Supported</AlertTitle>
              <AlertDescription>
                Push notifications are not supported in this browser or VAPID keys are not configured.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notification Status</p>
                  <p className="text-sm text-muted-foreground">
                    {pushEnabled ? "You will receive alerts for threshold violations" : "Notifications are disabled"}
                  </p>
                </div>
                <Button
                  variant={pushEnabled ? "outline" : "default"}
                  onClick={togglePushNotifications}
                  disabled={isSubscribing}
                >
                  {isSubscribing ? <Loader2 className="h-4 w-4 animate-spin" /> : pushEnabled ? "Disable" : "Enable"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card id="export">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Data
          </CardTitle>
          <CardDescription>Download sensor readings as CSV or JSON files</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fromDate">From Date</Label>
              <Input
                id="fromDate"
                type="datetime-local"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="toDate">To Date</Label>
              <Input
                id="toDate"
                type="datetime-local"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Leave dates empty to export all data</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportData("csv")} disabled={isExporting}>
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 mr-2" />
              )}
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => exportData("json")} disabled={isExporting}>
              {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileJson className="h-4 w-4 mr-2" />}
              Export JSON
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
