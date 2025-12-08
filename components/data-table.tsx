"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { type SensorReading, type ThresholdSettings, DEFAULT_THRESHOLDS } from "@/lib/types"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"

interface DataTableProps {
  data: SensorReading[]
  thresholds?: ThresholdSettings
}

const PAGE_SIZE = 10

export function DataTable({ data, thresholds = DEFAULT_THRESHOLDS }: DataTableProps) {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState("")

  const filteredData = data.filter((reading) => reading.deviceId.toLowerCase().includes(search.toLowerCase()) || new Date(reading.timestamp).toLocaleString().includes(search.toLowerCase()))

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE)
  const paginatedData = filteredData.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const getCellClass = (type: keyof Pick<SensorReading, "ch4" | "co2" | "humidity" | "temperature">, value: number) => {
    switch (type) {
      case "ch4":
        return value > thresholds.ch4Max ? "text-destructive font-medium" : ""
      case "co2":
        return value > thresholds.coMax ? "text-destructive font-medium" : ""
      case "humidity":
        return value < thresholds.humidityMin || value > thresholds.humidityMax ? "text-warning font-medium" : ""
      case "temperature":
        return value < thresholds.temperatureMin || value > thresholds.temperatureMax ? "text-warning font-medium" : ""
      default:
        return ""
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by device ID or Timestamp..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
            className="pl-9"
          />
        </div>
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Device ID</TableHead>
              <TableHead className="font-semibold">CH4 (ppm)</TableHead>
              <TableHead className="font-semibold">CO2 (ppm)</TableHead>
              <TableHead className="font-semibold">Humidity (%)</TableHead>
              <TableHead className="font-semibold">Temp (°C)</TableHead>
              <TableHead className="font-semibold">Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No data available
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((reading, index) => (
                <TableRow key={reading._id || index}>
                  <TableCell className="font-mono text-sm">{reading.deviceId}</TableCell>
                  <TableCell className={cn(getCellClass("ch4", reading.ch4))}>{Number(reading.ch4).toFixed(2)}</TableCell>
                  <TableCell className={cn(getCellClass("co2", reading.co2))}>{Number(reading.co2).toFixed(2)}</TableCell>
                  <TableCell className={cn(getCellClass("humidity", reading.humidity))}>
                    {Number(reading.humidity).toFixed(1)}
                  </TableCell>
                  <TableCell className={cn(getCellClass("temperature", reading.temperature))}>
                    {Number(reading.temperature).toFixed(1)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(reading.timestamp).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {page * PAGE_SIZE + 1} to {Math.min((page + 1) * PAGE_SIZE, filteredData.length)} of{" "}
            {filteredData.length} entries
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
