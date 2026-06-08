import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { WeatherCanvas } from './WeatherCanvas';
import type { MoonPhase, WeatherState } from '../weather';

export type WeatherMetric = {
  label: string;
  value?: string;
  fahrenheit?: number;
};

type TimeFormat = '12h' | '24h';
type TemperatureUnit = 'fahrenheit' | 'celsius';

type DisplaySettings = {
  showSeconds: boolean;
  showMoreWeatherInfo: boolean;
  timeFormat: TimeFormat;
  hideAmPm: boolean;
  temperatureUnit: TemperatureUnit;
};

const settingsStorageKey = 'weather-scene-display-settings';

const defaultDisplaySettings: DisplaySettings = {
  showSeconds: false,
  showMoreWeatherInfo: false,
  timeFormat: '12h',
  hideAmPm: false,
  temperatureUnit: 'fahrenheit',
};

type WeatherSceneProps = {
  now: Date;
  weatherState: WeatherState;
  weatherLabel: string;
  status: string;
  temperature: number;
  showTemperatureSummary?: boolean;
  reduceMotion?: boolean;
  metrics?: WeatherMetric[];
  error?: string | null;
  moonPhase: MoonPhase;
  mode?: 'live' | 'dev';
  children?: ReactNode;
};

export function WeatherScene({
  now,
  weatherState,
  weatherLabel,
  status,
  temperature,
  showTemperatureSummary = true,
  reduceMotion = false,
  metrics = [],
  error = null,
  moonPhase,
  mode = 'live',
  children,
}: WeatherSceneProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<DisplaySettings>(() =>
    loadDisplaySettings(),
  );
  const settingsButtonRef = useRef<HTMLButtonElement | null>(null);
  const settingsPanelRef = useRef<HTMLFormElement | null>(null);

  const updateSettings = (nextSettings: Partial<DisplaySettings>) => {
    setSettings((current) => {
      const updatedSettings = { ...current, ...nextSettings };
      saveDisplaySettings(updatedSettings);
      return updatedSettings;
    });
  };

  const timeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: settings.showSeconds ? '2-digit' : undefined,
    hour12: settings.timeFormat === '12h',
  });

  const timeLabel =
    settings.timeFormat === '12h' && settings.hideAmPm
      ? timeFormatter
          .formatToParts(now)
          .filter((part) => part.type !== 'dayPeriod')
          .map((part) => part.value)
          .join('')
          .trim()
      : timeFormatter.format(now);

  const dateLabel = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(now);
  const formattedTemperature = formatTemperature(
    temperature,
    settings.temperatureUnit,
  );
  const visibleMetrics = settings.showMoreWeatherInfo ? metrics : [];
  const summary = showTemperatureSummary
    ? `${weatherLabel}, ${formattedTemperature}`
    : weatherLabel;
  const heroClasses = [
    'hero-panel',
    settings.showMoreWeatherInfo ? 'hero-panel--expanded' : '',
    settings.showSeconds ? 'hero-panel--seconds' : '',
  ]
    .filter(Boolean)
    .join(' ');

  useEffect(() => {
    if (!settingsOpen) return;

    const closeSettingsOnOutsideClick = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;

      if (
        settingsButtonRef.current?.contains(target) ||
        settingsPanelRef.current?.contains(target)
      ) {
        return;
      }

      setSettingsOpen(false);
    };

    document.addEventListener('pointerdown', closeSettingsOnOutsideClick);

    return () => {
      document.removeEventListener('pointerdown', closeSettingsOnOutsideClick);
    };
  }, [settingsOpen]);

  return (
    <main className="weather-app">
      <WeatherCanvas
        weatherState={weatherState}
        now={now}
        temperature={temperature}
        moonPhase={moonPhase}
        reduceMotion={reduceMotion}
      />

      {mode == 'dev' && (
        <nav className="route-nav" aria-label="Weather app routes">
          <Link to="/">Live</Link>
          <Link to="/dev">Dev</Link>
        </nav>
      )}

      <button
        ref={settingsButtonRef}
        className="settings-button"
        type="button"
        aria-label="Open display settings"
        aria-expanded={settingsOpen}
        onClick={() => setSettingsOpen((isOpen) => !isOpen)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 8.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2Zm8.2 3.6c0-.5-.1-1-.2-1.5l2-1.5-2-3.5-2.4 1a8 8 0 0 0-2.6-1.5L14.7 2H9.3L9 5a8 8 0 0 0-2.6 1.5l-2.4-1-2 3.5 2 1.5a8.4 8.4 0 0 0 0 3l-2 1.5 2 3.5 2.4-1A8 8 0 0 0 9 19l.3 3h5.4l.3-3a8 8 0 0 0 2.6-1.5l2.4 1 2-3.5-2-1.5c.1-.5.2-1 .2-1.5Zm-8.2 5.6a5.6 5.6 0 1 1 0-11.2 5.6 5.6 0 0 1 0 11.2Z" />
        </svg>
      </button>

      {settingsOpen ? (
        <form
          ref={settingsPanelRef}
          className="settings-panel"
          aria-label="Display settings"
        >
          <label>
            <input
              type="checkbox"
              checked={settings.showSeconds}
              onChange={(event) =>
                updateSettings({ showSeconds: event.target.checked })
              }
            />
            Show seconds
          </label>

          <label>
            <input
              type="checkbox"
              checked={settings.showMoreWeatherInfo}
              onChange={(event) =>
                updateSettings({ showMoreWeatherInfo: event.target.checked })
              }
            />
            Show more weather info
          </label>

          <fieldset>
            <legend>Time format</legend>
            <label>
              <input
                type="radio"
                name="time-format"
                checked={settings.timeFormat === '12h'}
                onChange={() => updateSettings({ timeFormat: '12h' })}
              />
              12 hour
            </label>
            <label>
              <input
                type="radio"
                name="time-format"
                checked={settings.timeFormat === '24h'}
                onChange={() => updateSettings({ timeFormat: '24h' })}
              />
              24 hour
            </label>
          </fieldset>

          <label
            className={
              settings.timeFormat === '24h' ? 'is-disabled' : undefined
            }
          >
            <input
              type="checkbox"
              checked={settings.hideAmPm}
              disabled={settings.timeFormat === '24h'}
              onChange={(event) =>
                updateSettings({ hideAmPm: event.target.checked })
              }
            />
            Hide AM/PM
          </label>

          <fieldset>
            <legend>Temperature</legend>
            <label>
              <input
                type="radio"
                name="temperature-unit"
                checked={settings.temperatureUnit === 'fahrenheit'}
                onChange={() =>
                  updateSettings({ temperatureUnit: 'fahrenheit' })
                }
              />
              Fahrenheit
            </label>
            <label>
              <input
                type="radio"
                name="temperature-unit"
                checked={settings.temperatureUnit === 'celsius'}
                onChange={() => updateSettings({ temperatureUnit: 'celsius' })}
              />
              Celsius
            </label>
          </fieldset>
        </form>
      ) : null}

      <section className={heroClasses} aria-label="Current time and weather">
        <p className="eyebrow">{mode === 'dev' ? 'Preview mode' : dateLabel}</p>
        <h1>{timeLabel}</h1>
        <p className="weather-summary">{summary}</p>

        <div className="status-card">
          <span
            className={`weather-dot weather-dot--${weatherState}`}
            aria-hidden="true"
          />
          <span>{status}</span>
        </div>

        <dl className="metrics" aria-label="Weather details">
          <div>
            <dt>Temp</dt>
            <dd>{formattedTemperature}</dd>
          </div>
          <div>
            <dt>Moon</dt>
            <dd>{moonPhase.label}</dd>
          </div>
          {visibleMetrics.slice(0, 4).map((metric) => (
            <div key={metric.label}>
              <dt>{metric.label}</dt>
              <dd>{formatMetric(metric, settings.temperatureUnit)}</dd>
            </div>
          ))}
        </dl>

        {error ? <p className="error-message">{error}</p> : null}
      </section>

      {children}
    </main>
  );
}

function formatTemperature(fahrenheit: number, unit: TemperatureUnit) {
  if (unit === 'celsius') {
    return `${Math.round((fahrenheit - 32) * (5 / 9))}°C`;
  }

  return `${Math.round(fahrenheit)}°F`;
}

function formatMetric(metric: WeatherMetric, unit: TemperatureUnit) {
  if (typeof metric.fahrenheit === 'number') {
    return formatTemperature(metric.fahrenheit, unit);
  }

  return metric.value ?? '';
}

function loadDisplaySettings(): DisplaySettings {
  if (typeof window === 'undefined') return defaultDisplaySettings;

  try {
    const storedSettings = window.localStorage.getItem(settingsStorageKey);
    if (!storedSettings) return defaultDisplaySettings;

    const parsedSettings = JSON.parse(
      storedSettings,
    ) as Partial<DisplaySettings>;

    return {
      showSeconds:
        typeof parsedSettings.showSeconds === 'boolean'
          ? parsedSettings.showSeconds
          : defaultDisplaySettings.showSeconds,
      showMoreWeatherInfo:
        typeof parsedSettings.showMoreWeatherInfo === 'boolean'
          ? parsedSettings.showMoreWeatherInfo
          : defaultDisplaySettings.showMoreWeatherInfo,
      timeFormat:
        parsedSettings.timeFormat === '12h' ||
        parsedSettings.timeFormat === '24h'
          ? parsedSettings.timeFormat
          : defaultDisplaySettings.timeFormat,
      hideAmPm:
        typeof parsedSettings.hideAmPm === 'boolean'
          ? parsedSettings.hideAmPm
          : defaultDisplaySettings.hideAmPm,
      temperatureUnit:
        parsedSettings.temperatureUnit === 'fahrenheit' ||
        parsedSettings.temperatureUnit === 'celsius'
          ? parsedSettings.temperatureUnit
          : defaultDisplaySettings.temperatureUnit,
    };
  } catch {
    return defaultDisplaySettings;
  }
}

function saveDisplaySettings(settings: DisplaySettings) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
  } catch {
    // Keep controls functional even when storage is unavailable.
  }
}
