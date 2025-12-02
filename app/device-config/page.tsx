import { Navigation } from "@/components/navigation"
import { BleConfig } from "@/components/ble-config"

export default function DeviceConfigPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Device Configuration</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure your IoT device via Bluetooth</p>
        </div>
        <BleConfig />
      </main>
    </div>
  )
}
