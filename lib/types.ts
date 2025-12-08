export interface SensorReading {
  _id?: string
  deviceId: string
  ch4: number // Methane in ppm
  co2: number // Carbon Monoxide in ppm
  humidity: number // Percentage
  temperature: number // Celsius
  timestamp: Date | string
}

export interface ThresholdSettings {
  ch4Max: number
  coMax: number
  humidityMin: number
  humidityMax: number
  temperatureMin: number
  temperatureMax: number
}

export interface WiFiCredentials {
  ssid: string
  password: string
}

export const DEFAULT_THRESHOLDS: ThresholdSettings = {
  ch4Max: 1000, // ppm
  coMax: 35, // ppm (OSHA limit)
  humidityMin: 30,
  humidityMax: 70,
  temperatureMin: 15,
  temperatureMax: 35,
}
