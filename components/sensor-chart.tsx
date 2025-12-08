"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { SensorReading } from "@/lib/types"

interface SensorChartProps {
  title: string
  data: SensorReading[]
  dataKey: keyof Pick<SensorReading, "ch4" | "co2" | "humidity" | "temperature">
  unit: string
  color: string
  threshold?: { min?: number; max?: number }
}

export function SensorChart({ title, data, dataKey, unit, color, threshold }: SensorChartProps) {
  const chartData = [...data].reverse().map((reading) => ({
    ...reading,
    time: new Date(reading.timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    value: reading[dataKey],
  }))

  const values = chartData.map((d) => d.value as number)
  const minValue = Math.min(...values, threshold?.min || Number.POSITIVE_INFINITY) * 0.9
  const maxValue = Math.max(...values, threshold?.max || Number.NEGATIVE_INFINITY) * 1.1

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--destructive))" />
              <XAxis
                dataKey="time"
                tick={{ fill: "#ffffffff", fontSize: 10 }}
                tickLine={{ stroke: "hsl(var(--chart-4))" }}
                axisLine={{ stroke: "hsl(var(--chart-4))" }}
              />
              <YAxis
                domain={[minValue, maxValue]}
                tick={{ fill: "#ffffffff", fontSize: 10 }}
                tickLine={{ stroke: "hsl(var(--chart-4))" }}
                axisLine={{ stroke: "hsl(var(--chart-4))" }}
                tickFormatter={(value) => `${value}${unit}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--chart-4))",
                  borderRadius: "var(--radius)",
                }}
                labelStyle={{ color: "#ffffffff" }}
                itemStyle={{ color: "#ffffffff" }}
                formatter={(value: number) => [`${Number(value).toFixed(2)} ${unit}`, title]}
              />
              {threshold?.max && (
                <Line
                  type="monotone"
                  dataKey={() => threshold.max}
                  stroke="hsl(var(--destructive))"
                  strokeDasharray="5 5"
                  dot={false}
                  strokeWidth={1}
                />
              )}
              {threshold?.min && (
                <Line
                  type="monotone"
                  dataKey={() => threshold.min}
                  stroke="hsl(var(--warning))"
                  strokeDasharray="5 5"
                  dot={false}
                  strokeWidth={1}
                />
              )}
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: color }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
