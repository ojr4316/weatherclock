import { useMemo, useState } from 'react'
import { WeatherScene } from '../components/WeatherScene'
import {
  getMoonPhase,
  weatherLabels,
  type MoonPhase,
  type WeatherState,
} from '../weather'

const weatherOptions: WeatherState[] = ['clear', 'cloudy', 'rain', 'snow', 'fog', 'storm']
const moonPhaseOptions = [
  'auto',
  'new',
  'waxing-crescent',
  'first-quarter',
  'waxing-gibbous',
  'full',
  'waning-gibbous',
  'last-quarter',
  'waning-crescent',
] as const

type MoonPhaseOption = (typeof moonPhaseOptions)[number]

const moonPhaseLabels: Record<MoonPhaseOption, string> = {
  auto: 'Auto from date',
  new: 'New moon',
  'waxing-crescent': 'Waxing crescent',
  'first-quarter': 'First quarter',
  'waxing-gibbous': 'Waxing gibbous',
  full: 'Full moon',
  'waning-gibbous': 'Waning gibbous',
  'last-quarter': 'Last quarter',
  'waning-crescent': 'Waning crescent',
}

const moonPhasePresets: Record<Exclude<MoonPhaseOption, 'auto'>, MoonPhase> = {
  new: { label: 'New moon', illumination: 0, phase: 0, waxing: true },
  'waxing-crescent': { label: 'Waxing crescent', illumination: 0.25, phase: 0.13, waxing: true },
  'first-quarter': { label: 'First quarter', illumination: 0.5, phase: 0.25, waxing: true },
  'waxing-gibbous': { label: 'Waxing gibbous', illumination: 0.78, phase: 0.38, waxing: true },
  full: { label: 'Full moon', illumination: 1, phase: 0.5, waxing: false },
  'waning-gibbous': { label: 'Waning gibbous', illumination: 0.78, phase: 0.62, waxing: false },
  'last-quarter': { label: 'Last quarter', illumination: 0.5, phase: 0.75, waxing: false },
  'waning-crescent': { label: 'Waning crescent', illumination: 0.25, phase: 0.88, waxing: false },
}

function dateWithTime(time: string) {
  const [hours = '0', minutes = '0'] = time.split(':')
  const date = new Date()
  date.setHours(Number(hours), Number(minutes), 0, 0)
  return date
}

export function DevPreview() {
  const [weatherState, setWeatherState] = useState<WeatherState>('clear')
  const [time, setTime] = useState('22:15')
  const [temperature, setTemperature] = useState(62)
  const [moonPhaseOption, setMoonPhaseOption] = useState<MoonPhaseOption>('auto')

  const now = useMemo(() => dateWithTime(time), [time])
  const moonPhase = useMemo(
    () =>
      moonPhaseOption === 'auto'
        ? getMoonPhase(now)
        : moonPhasePresets[moonPhaseOption],
    [moonPhaseOption, now],
  )

  return (
    <WeatherScene
      now={now}
      weatherState={weatherState}
      weatherLabel={weatherLabels[weatherState]}
      status="Manual preview controls"
      temperature={temperature}
      reduceMotion={false}
      moonPhase={moonPhase}
      mode="dev"
      metrics={[
        { label: 'Hour', value: time },
        { label: 'Phase', value: `${Math.round(moonPhase.illumination * 100)}%` },
        { label: 'Preview', fahrenheit: temperature },
      ]}
    >
      <form className="dev-panel" aria-label="Visual preview controls">
        <label>
          <span>Weather</span>
          <select
            value={weatherState}
            onChange={(event) => setWeatherState(event.target.value as WeatherState)}
          >
            {weatherOptions.map((option) => (
              <option key={option} value={option}>
                {weatherLabels[option]}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Time</span>
          <input
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
          />
        </label>

        <label>
          <span>Moon phase</span>
          <select
            value={moonPhaseOption}
            onChange={(event) => setMoonPhaseOption(event.target.value as MoonPhaseOption)}
          >
            {moonPhaseOptions.map((option) => (
              <option key={option} value={option}>
                {moonPhaseLabels[option]}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Temperature</span>
          <input
            type="range"
            min="-10"
            max="110"
            value={temperature}
            onChange={(event) => setTemperature(Number(event.target.value))}
          />
          <strong>{temperature}°F</strong>
        </label>
      </form>
    </WeatherScene>
  )
}
