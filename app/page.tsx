import { Navigation } from "@/components/navigation"
import { Dashboard } from "@/components/dashboard"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time environmental monitoring</p>
        </div>
        <Dashboard />
      </main>
    </div>
  )
}
