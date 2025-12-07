"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Bluetooth, BluetoothOff, Wifi, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"

// WebBLE Service and Characteristic UUIDs (these should match your hardware)
const WIFI_SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
const WIFI_SSID_CHAR_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8"
const WIFI_PASSWORD_CHAR_UUID = "beb5483f-36e1-4688-b7f5-ea07361b26a8"
const WIFI_STATUS_CHAR_UUID = "beb54840-36e1-4688-b7f5-ea07361b26a8"

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error"

export function BleConfig() {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected")
  const [device, setDevice] = useState<any>(null)
  const [ssid, setSsid] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [wifiStatus, setWifiStatus] = useState<string | null>(null)

  const isBleSupported = typeof navigator !== "undefined" && "bluetooth" in navigator

  const connectDevice = useCallback(async () => {
    if (!isBleSupported) {
      setMessage("Web Bluetooth is not supported in this browser")
      setStatus("error")
      return
    }

    try {
      setStatus("connecting")
      setMessage("Scanning for devices...")

      const selectedDevice = await (navigator as any)?.bluetooth.requestDevice({
        acceptAllDevices: true,
        // filters: [{ services: [WIFI_SERVICE_UUID] }],
        optionalServices: [WIFI_SERVICE_UUID],
      })

      selectedDevice.addEventListener("gattserverdisconnected", () => {
        setStatus("disconnected")
        setDevice(null)
        setMessage("Device disconnected")
      })

      setMessage("Connecting to device...")
      const server = await selectedDevice.gatt?.connect()

      if (!server) {
        throw new Error("Failed to connect to GATT server")
      }

      setDevice(selectedDevice)
      setStatus("connected")
      setMessage(`Connected to ${selectedDevice.name || "Unknown Device"}`)

      // Try to read current WiFi status
      try {
        const service = await server.getPrimaryService(WIFI_SERVICE_UUID)
        const statusChar = await service.getCharacteristic(WIFI_STATUS_CHAR_UUID)
        const value = await statusChar.readValue()
        const statusText = new TextDecoder().decode(value)
        setWifiStatus(statusText)

        const ssidChar = await service.getCharacteristic(WIFI_SSID_CHAR_UUID)
        const ssidValue = await ssidChar.readValue()
        const currentSsid = new TextDecoder().decode(ssidValue)
        setSsid(currentSsid)

        const passwordChar = await service.getCharacteristic(WIFI_PASSWORD_CHAR_UUID)
        const passwordValue = await passwordChar.readValue()
        const currentPassword = new TextDecoder().decode(passwordValue)
        setPassword(currentPassword)
      } catch {
        // Status characteristic might not exist
      }
    } catch (error) {
      if (error instanceof Error && error.name === "NotFoundError") {
        setMessage("No compatible device found")
      } else {
        setMessage(`Connection failed: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
      setStatus("error")
    }
  }, [isBleSupported])

  const disconnectDevice = useCallback(async () => {
    if (device?.gatt?.connected) {
      device.gatt.disconnect()
    }
    setDevice(null)
    setStatus("disconnected")
    setMessage("")
    setWifiStatus(null)
  }, [device])

  const sendCredentials = useCallback(async () => {
    if (!device?.gatt?.connected) {
      setMessage("Device not connected")
      return
    }

    if (!ssid.trim()) {
      setMessage("Please enter a WiFi SSID")
      return
    }

    setIsSubmitting(true)
    setMessage("Sending credentials...")

    try {
      const server = device.gatt
      const service = await server.getPrimaryService(WIFI_SERVICE_UUID)

      // Send SSID
      const ssidChar = await service.getCharacteristic(WIFI_SSID_CHAR_UUID)
      const ssidData = new TextEncoder().encode(ssid)
      await ssidChar.writeValue(ssidData)

      // Send Password
      const passwordChar = await service.getCharacteristic(WIFI_PASSWORD_CHAR_UUID)
      const passwordData = new TextEncoder().encode(password)
      await passwordChar.writeValue(passwordData)

      setMessage("WiFi credentials sent successfully!")

      // Wait and check status
      setTimeout(async () => {
        try {
          const statusChar = await service.getCharacteristic(WIFI_STATUS_CHAR_UUID)
          const value = await statusChar.readValue()
          const statusText = new TextDecoder().decode(value)
          setWifiStatus(statusText)
        } catch {
          // Ignore status read errors
        }
      }, 3000)
    } catch (error) {
      setMessage(`Failed to send credentials: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsSubmitting(false)
    }
  }, [device, ssid, password])

  return (
    <div className="space-y-6">
      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === "connected" ? (
              <Bluetooth className="h-5 w-5 text-primary" />
            ) : (
              <BluetoothOff className="h-5 w-5 text-muted-foreground" />
            )}
            Device Connection
          </CardTitle>
          <CardDescription>Connect to your IoT device via Bluetooth to configure WiFi settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isBleSupported && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Browser Not Supported</AlertTitle>
              <AlertDescription>
                Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera on desktop.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium">Status</p>
              <p className="text-sm text-muted-foreground capitalize">{status}</p>
            </div>
            {device && (
              <div className="flex-1">
                <p className="text-sm font-medium">Device</p>
                <p className="text-sm text-muted-foreground">{device.name || "Unknown Device"}</p>
              </div>
            )}
          </div>

          {message && (
            <Alert variant={status === "error" ? "destructive" : "default"}>
              {status === "connected" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : status === "connecting" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            {status === "disconnected" || status === "error" ? (
              <Button onClick={connectDevice} disabled={!isBleSupported}>
                <Bluetooth className="h-4 w-4 mr-2" />
                Connect Device
              </Button>
            ) : status === "connecting" ? (
              <Button disabled>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </Button>
            ) : (
              <Button variant="outline" onClick={disconnectDevice}>
                <BluetoothOff className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* WiFi Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            WiFi Configuration
          </CardTitle>
          <CardDescription>Enter your WiFi network credentials to configure the device</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {wifiStatus && (
            <Alert>
              <Wifi className="h-4 w-4" />
              <AlertTitle>Current WiFi Status</AlertTitle>
              <AlertDescription>{wifiStatus}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ssid">Network Name (SSID)</Label>
              <Input
                id="ssid"
                placeholder="Enter WiFi network name"
                value={ssid}
                onChange={(e) => setSsid(e.target.value)}
                disabled={status !== "connected" || isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter WiFi password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={status !== "connected" || isSubmitting}
              />
            </div>
            <Button
              onClick={sendCredentials}
              disabled={status !== "connected" || isSubmitting || !ssid.trim()}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Wifi className="h-4 w-4 mr-2" />
                  Send Credentials
                </>
              )}
            </Button>
          </div>

          {status !== "connected" && (
            <p className="text-sm text-muted-foreground text-center">
              Connect to a device first to configure WiFi settings
            </p>
          )}
        </CardContent>
      </Card>

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Make sure your IoT device is powered on and in pairing mode</li>
            <li>Click &quot;Connect Device&quot; and select your device from the list</li>
            <li>Once connected, enter your WiFi network credentials</li>
            <li>Click &quot;Send Credentials&quot; to configure the device</li>
            <li>The device will restart and connect to your WiFi network</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
