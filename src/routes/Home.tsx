import { useEffect, useState } from 'react'
import { WeatherScene, type WeatherMetric } from '../components/WeatherScene'
import {
  fetchLocalWeather,
  getMoonPhase,
  type WeatherReport,
} from '../weather'

function useClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  return now
}

function useReducedMotion() {
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotionPreference = () => setReduceMotion(mediaQuery.matches)

    updateMotionPreference()
    mediaQuery.addEventListener('change', updateMotionPreference)

    return () => mediaQuery.removeEventListener('change', updateMotionPreference)
  }, [])

  return reduceMotion
}

function getMetrics(weather: WeatherReport | null): WeatherMetric[] {
  if (!weather) return []

  return [
    { label: 'Feels', fahrenheit: weather.apparentTemperature },
    { label: 'Clouds', value: `${weather.cloudCover}%` },
    { label: 'Wind', value: `${weather.windSpeed} mph` },
    { label: 'Gusts', value: `${weather.windGusts} mph` },
    { label: 'Humidity', value: `${weather.humidity}%` },
    { label: 'Rain', value: `${weather.precipitation} in` },
    { label: 'Pressure', value: `${weather.pressure} hPa` },
    { label: 'Direction', value: `${weather.windDirection}°` },
  ]
}

export function Home() {
  const now = useClock()
  const reduceMotion = useReducedMotion()
  const [weather, setWeather] = useState<WeatherReport | null>(null)
  const [status, setStatus] = useState('Finding your local sky...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    fetchLocalWeather()
      .then((report) => {
        if (!isMounted) return
        setWeather(report)
        setStatus('Live local conditions')
      })
      .catch((reason: unknown) => {
        if (!isMounted) return
        setError(reason instanceof Error ? reason.message : 'Weather data could not be loaded.')
        setStatus('Showing a calm fallback scene')
      })

    return () => {
      isMounted = false
    }
  }, [])

  const temperature = weather?.temperature ?? 68
  const weatherState = weather?.state ?? 'clear'
  const weatherLabel = weather
    ? weather.label
    : error
      ? 'Clear fallback'
      : 'Loading weather'

  return (
    <WeatherScene
      now={now}
      weatherState={weatherState}
      weatherLabel={weatherLabel}
      status={status}
      temperature={temperature}
      showTemperatureSummary={Boolean(weather)}
      reduceMotion={reduceMotion}
      metrics={getMetrics(weather)}
      error={error}
      moonPhase={getMoonPhase(now)}
    />
  )
}
