export type WeatherState = 'clear' | 'cloudy' | 'rain' | 'snow' | 'fog' | 'storm'

export type MoonPhase = {
  label: string
  illumination: number
  phase: number
  waxing: boolean
}

export type WeatherReport = {
  state: WeatherState
  label: string
  temperature: number
  apparentTemperature: number
  windSpeed: number
  windDirection: number
  windGusts: number
  cloudCover: number
  humidity: number
  precipitation: number
  pressure: number
  code: number
  coordinates: {
    latitude: number
    longitude: number
  }
}

type OpenMeteoResponse = {
  current: {
    weather_code: number
    temperature_2m: number
    apparent_temperature: number
    relative_humidity_2m: number
    precipitation: number
    pressure_msl: number
    cloud_cover: number
    wind_speed_10m: number
    wind_direction_10m: number
    wind_gusts_10m: number
  }
}

export const weatherLabels: Record<WeatherState, string> = {
  clear: 'Clear skies',
  cloudy: 'Cloudy',
  rain: 'Rain',
  snow: 'Snow',
  fog: 'Fog',
  storm: 'Storm',
}

export function mapWeatherCode(code: number): WeatherState {
  if ([0, 1].includes(code)) return 'clear'
  if ([2, 3].includes(code)) return 'cloudy'
  if ([45, 48].includes(code)) return 'fog'
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snow'
  if ([95, 96, 99].includes(code)) return 'storm'
  if (
    [
      51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82,
    ].includes(code)
  ) {
    return 'rain'
  }

  return 'cloudy'
}

export function getMoonPhase(date: Date): MoonPhase {
  const synodicMonth = 29.530588853
  const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14)
  const daysSinceKnownNewMoon = (date.getTime() - knownNewMoon) / 86_400_000
  const phase = ((daysSinceKnownNewMoon % synodicMonth) + synodicMonth) % synodicMonth
  const normalized = phase / synodicMonth
  const illumination = (1 - Math.cos(normalized * Math.PI * 2)) / 2
  const waxing = normalized < 0.5

  let label = 'New moon'
  if (normalized >= 0.03 && normalized < 0.22) label = 'Waxing crescent'
  else if (normalized >= 0.22 && normalized < 0.28) label = 'First quarter'
  else if (normalized >= 0.28 && normalized < 0.47) label = 'Waxing gibbous'
  else if (normalized >= 0.47 && normalized < 0.53) label = 'Full moon'
  else if (normalized >= 0.53 && normalized < 0.72) label = 'Waning gibbous'
  else if (normalized >= 0.72 && normalized < 0.78) label = 'Last quarter'
  else if (normalized >= 0.78 && normalized < 0.97) label = 'Waning crescent'

  return { label, illumination, phase: normalized, waxing }
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  if (!navigator.geolocation) {
    return Promise.reject(new Error('Geolocation is not supported by this browser.'))
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      maximumAge: 10 * 60 * 1000,
      timeout: 10_000,
    })
  })
}

export async function fetchLocalWeather(): Promise<WeatherReport> {
  const position = await getCurrentPosition()
  const { latitude, longitude } = position.coords
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current:
      'weather_code,temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,pressure_msl,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m',
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
    precipitation_unit: 'inch',
    timezone: 'auto',
  })

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)

  if (!response.ok) {
    throw new Error('Weather data is unavailable right now.')
  }

  const data = (await response.json()) as OpenMeteoResponse
  const state = mapWeatherCode(data.current.weather_code)

  return {
    state,
    label: weatherLabels[state],
    temperature: Math.round(data.current.temperature_2m),
    apparentTemperature: Math.round(data.current.apparent_temperature),
    windSpeed: Math.round(data.current.wind_speed_10m),
    windDirection: Math.round(data.current.wind_direction_10m),
    windGusts: Math.round(data.current.wind_gusts_10m),
    cloudCover: Math.round(data.current.cloud_cover),
    humidity: Math.round(data.current.relative_humidity_2m),
    precipitation: Number(data.current.precipitation.toFixed(2)),
    pressure: Math.round(data.current.pressure_msl),
    code: data.current.weather_code,
    coordinates: { latitude, longitude },
  }
}
