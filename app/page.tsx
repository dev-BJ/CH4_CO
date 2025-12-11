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
      <Footer />
    </div>
  )
}

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-4 mt-8">
      <div className="container mx-auto text-center">
        <p className="text-md">CH4 and CO2 monitoring system constructed and designed by <em className="font-bold">Opeseyi Qoyum Adegboyega (249044030)</em>, A student of the <em className="font-bold">University of Lagos</em>.</p>
      </div>
    </footer>
  )
}
