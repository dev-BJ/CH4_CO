import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  unit: string
  icon: LucideIcon
  trend?: "up" | "down" | "stable"
  status?: "normal" | "warning" | "danger"
}

export function StatCard({ title, value, unit, icon: Icon, status = "normal" }: StatCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden",
        status === "warning" && "border-warning/50",
        status === "danger" && "border-destructive/50",
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon
          className={cn(
            "h-4 w-4",
            status === "normal" && "text-muted-foreground",
            status === "warning" && "text-warning",
            status === "danger" && "text-destructive",
          )}
        />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1">
          <span
            className={cn(
              "text-2xl font-bold",
              status === "warning" && "text-warning",
              status === "danger" && "text-destructive",
            )}
          >
            {value}
          </span>
          <span className="text-sm text-muted-foreground">{unit}</span>
        </div>
      </CardContent>
      {status !== "normal" && (
        <div
          className={cn(
            "absolute top-0 right-0 w-1 h-full",
            status === "warning" && "bg-warning",
            status === "danger" && "bg-destructive",
          )}
        />
      )}
    </Card>
  )
}
