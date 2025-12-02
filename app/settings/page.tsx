import { Navigation } from "@/components/navigation"
import { SettingsPanel } from "@/components/settings-panel"

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure thresholds, notifications, and export data</p>
        </div>
        <SettingsPanel />
      </main>
    </div>
  )
}
