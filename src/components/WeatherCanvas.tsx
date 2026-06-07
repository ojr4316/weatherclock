import { useEffect, useRef } from 'react'
import type { MoonPhase, WeatherState } from '../weather'

type WeatherCanvasProps = {
  weatherState: WeatherState
  now: Date
  temperature: number
  moonPhase: MoonPhase
  reduceMotion?: boolean
}

type TimeOfDay = 'morning' | 'day' | 'evening' | 'night'

type SceneColors = {
  top: string
  middle: string
  bottom: string
  orb: string
  orbGlow: string
  hillBack: string
  hillFront: string
  river: string
  riverHighlight: string
  house: string
  roof: string
  bush: string
  cloud: string
  cloudShadow: string
}

const palettes: Record<TimeOfDay, SceneColors> = {
  morning: {
    top: '#8fd3ff',
    middle: '#ffd6a5',
    bottom: '#fff1bd',
    orb: '#fff3a0',
    orbGlow: 'rgba(255, 218, 128, 0.42)',
    hillBack: '#6fcf97',
    hillFront: '#2fbf71',
    river: '#4fb5ff',
    riverHighlight: 'rgba(255, 255, 255, 0.42)',
    house: '#fff0c2',
    roof: '#ef6f6c',
    bush: '#16884f',
    cloud: '#ffffff',
    cloudShadow: '#d9ecff',
  },
  day: {
    top: '#45b7ff',
    middle: '#7dd7ff',
    bottom: '#c9f1ff',
    orb: '#ffe66d',
    orbGlow: 'rgba(255, 230, 109, 0.38)',
    hillBack: '#65d88c',
    hillFront: '#28b463',
    river: '#29a9ff',
    riverHighlight: 'rgba(255, 255, 255, 0.5)',
    house: '#fff4cc',
    roof: '#f06d5e',
    bush: '#118748',
    cloud: '#ffffff',
    cloudShadow: '#cbe8f9',
  },
  evening: {
    top: '#5c6bc0',
    middle: '#ff8a80',
    bottom: '#ffd180',
    orb: '#ffb74d',
    orbGlow: 'rgba(255, 138, 128, 0.42)',
    hillBack: '#7cc576',
    hillFront: '#2e9d63',
    river: '#7a9eff',
    riverHighlight: 'rgba(255, 216, 174, 0.44)',
    house: '#ffe3a3',
    roof: '#b95766',
    bush: '#257c54',
    cloud: '#fff5e6',
    cloudShadow: '#f3b2a6',
  },
  night: {
    top: '#111936',
    middle: '#25315f',
    bottom: '#5661a8',
    orb: '#f8f7ff',
    orbGlow: 'rgba(216, 219, 255, 0.26)',
    hillBack: '#254b66',
    hillFront: '#16324f',
    river: '#283f7c',
    riverHighlight: 'rgba(190, 203, 255, 0.28)',
    house: '#425778',
    roof: '#26344f',
    bush: '#183f46',
    cloud: '#dfe7ff',
    cloudShadow: '#9ca8d8',
  },
}

function getTimeOfDay(date: Date): TimeOfDay {
  const hour = date.getHours()
  if (hour >= 5 && hour < 10) return 'morning'
  if (hour >= 10 && hour < 17) return 'day'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}

function drawBlob(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x - radius * 0.7, y + radius * 0.2, radius * 0.58, 0, Math.PI * 2)
  ctx.arc(x, y - radius * 0.12, radius * 0.78, 0, Math.PI * 2)
  ctx.arc(x + radius * 0.78, y + radius * 0.16, radius * 0.62, 0, Math.PI * 2)
  ctx.rect(x - radius * 1.32, y + radius * 0.12, radius * 2.64, radius * 0.62)
  ctx.fill()
}

function drawMoon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  colors: SceneColors,
  moonPhase: MoonPhase,
) {
  ctx.fillStyle = colors.orbGlow
  ctx.beginPath()
  ctx.arc(x, y, radius * 2.65, 0, Math.PI * 2)
  ctx.fill()

  ctx.save()
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.clip()

  ctx.fillStyle = '#39476f'
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)

  drawMoonLight(ctx, x, y, radius, colors.orb, moonPhase.phase)

  ctx.restore()

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.lineWidth = Math.max(1, radius * 0.05)
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.stroke()
}

function drawMoonLight(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  phase: number,
) {
  const normalizedPhase = ((phase % 1) + 1) % 1
  const terminatorScale = Math.abs(Math.cos(normalizedPhase * Math.PI * 2))
  const rowHeight = Math.max(1, radius / 80)

  ctx.fillStyle = color

  for (let offsetY = -radius; offsetY <= radius; offsetY += rowHeight) {
    const centerY = offsetY + rowHeight / 2
    const edge = Math.sqrt(Math.max(0, radius * radius - centerY * centerY))
    const terminator = edge * terminatorScale
    let startX: number
    let endX: number

    if (normalizedPhase < 0.25) {
      startX = x + terminator
      endX = x + edge
    } else if (normalizedPhase < 0.5) {
      startX = x - terminator
      endX = x + edge
    } else if (normalizedPhase < 0.75) {
      startX = x - edge
      endX = x + terminator
    } else {
      startX = x - edge
      endX = x - terminator
    }

    if (endX > startX) {
      ctx.fillRect(startX, y + offsetY, endX - startX, rowHeight + 0.6)
    }
  }
}

function drawCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  colors: SceneColors,
) {
  drawBlob(ctx, x + scale * 4, y + scale * 4, scale * 42, colors.cloudShadow)
  drawBlob(ctx, x, y, scale * 42, colors.cloud)
}

function drawHill(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  y: number,
  color: string,
  lift: number,
) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(0, height)
  ctx.lineTo(0, y)
  ctx.bezierCurveTo(width * 0.2, y - lift, width * 0.34, y + lift, width * 0.52, y)
  ctx.bezierCurveTo(width * 0.7, y - lift * 1.2, width * 0.88, y + lift * 0.8, width, y - lift * 0.4)
  ctx.lineTo(width, height)
  ctx.closePath()
  ctx.fill()
}

function drawRiver(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  colors: SceneColors,
  time: number,
) {
  const top = height * 0.69
  const riverPath = new Path2D()
  riverPath.moveTo(width * 0.2, height)
  riverPath.bezierCurveTo(width * 0.36, height * 0.88, width * 0.42, height * 0.76, width * 0.5, top)
  riverPath.bezierCurveTo(width * 0.58, height * 0.76, width * 0.7, height * 0.88, width * 0.88, height)
  riverPath.closePath()

  ctx.fillStyle = colors.river
  ctx.fill(riverPath)

  ctx.save()
  ctx.clip(riverPath)
  ctx.strokeStyle = colors.riverHighlight
  ctx.lineWidth = Math.max(2, width * 0.003)
  ctx.lineCap = 'round'

  for (let i = 0; i < 5; i += 1) {
    const y = height * (0.74 + i * 0.046)
    const depth = Math.max(0, Math.min(1, (y - top) / (height - top)))
    const halfWidth = width * (0.022 + depth * 0.022)
    const centerX = width * 0.47 + Math.sin(depth * Math.PI * 0.85) * width * 0.06
    const drift = Math.sin(time * 0.7 + i) * width * 0.01
    ctx.beginPath()
    ctx.moveTo(centerX - halfWidth + drift, y)
    ctx.bezierCurveTo(
      centerX - halfWidth * 0.3 + drift,
      y - height * 0.006,
      centerX + halfWidth * 0.3 + drift,
      y + height * 0.006,
      centerX + halfWidth + drift,
      y,
    )
    ctx.stroke()
  }
  ctx.restore()
}

function drawHouse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  colors: SceneColors,
  isNight: boolean,
) {
  ctx.fillStyle = colors.house
  ctx.fillRect(x, y, size * 1.25, size)

  ctx.fillStyle = colors.roof
  ctx.beginPath()
  ctx.moveTo(x - size * 0.12, y)
  ctx.lineTo(x + size * 0.62, y - size * 0.58)
  ctx.lineTo(x + size * 1.38, y)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = isNight ? '#ffd166' : '#70a7d8'
  ctx.fillRect(x + size * 0.18, y + size * 0.28, size * 0.24, size * 0.24)
  ctx.fillRect(x + size * 0.82, y + size * 0.28, size * 0.24, size * 0.24)

  ctx.fillStyle = '#5b3f35'
  ctx.fillRect(x + size * 0.53, y + size * 0.48, size * 0.22, size * 0.52)
}

function drawBushes(ctx: CanvasRenderingContext2D, width: number, height: number, colors: SceneColors) {
  ctx.fillStyle = colors.bush

  for (let i = 0; i < 20; i += 1) {
    const x = (i * 71) % width
    const y = height * (0.82 + (i % 4) * 0.035)
    const radius = Math.max(14, width * (0.018 + (i % 3) * 0.004))
    ctx.beginPath()
    ctx.arc(x, y, radius, Math.PI, 0)
    ctx.arc(x + radius * 0.78, y + radius * 0.08, radius * 0.78, Math.PI, 0)
    ctx.arc(x - radius * 0.72, y + radius * 0.1, radius * 0.72, Math.PI, 0)
    ctx.lineTo(x + radius * 1.5, y + radius * 0.7)
    ctx.lineTo(x - radius * 1.5, y + radius * 0.7)
    ctx.closePath()
    ctx.fill()
  }
}

function seededUnit(index: number, salt: number) {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453
  return value - Math.floor(value)
}

function drawRain(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  intensity = 1,
) {
  ctx.strokeStyle = 'rgba(53, 125, 220, 0.54)'
  ctx.lineWidth = Math.max(1, width * 0.0016)
  ctx.lineCap = 'round'

  const drops = Math.round(105 * intensity)

  for (let i = 0; i < drops; i += 1) {
    const x = seededUnit(i, 4) * width
    const speed = height * (0.42 + seededUnit(i, 9) * 0.18)
    const y = (seededUnit(i, 2) * height + time * speed) % (height + 28) - 28
    const length = Math.max(8, height * (0.018 + seededUnit(i, 6) * 0.014))
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x, y + length)
    ctx.stroke()
  }
}

function drawSnow(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.86)'

  for (let i = 0; i < 74; i += 1) {
    const radius = 2 + (i % 5)
    const sway = Math.sin(time * 1.5 + i) * 18
    const x = (i * 79) % width + sway
    const y = (i * 53 + time * (28 + (i % 4) * 10)) % height
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawStorm(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
  drawRain(ctx, width, height, time * 1.18, 0.85)

  const anchors = [
    { x: 0.32, y: 0.18, delay: 0 },
    { x: 0.62, y: 0.16, delay: 1.3 },
    { x: 0.78, y: 0.25, delay: 2.15 },
  ]

  for (const anchor of anchors) {
    const flash = Math.sin(time * 2.8 + anchor.delay)
    if (flash <= 0.82) continue

    const x = width * anchor.x
    const y = height * anchor.y
    const boltWidth = Math.max(7, width * 0.012)
    const boltHeight = height * 0.2
    ctx.fillStyle = 'rgba(255, 244, 116, 0.9)'
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x - boltWidth * 0.8, y + boltHeight * 0.42)
    ctx.lineTo(x + boltWidth * 0.2, y + boltHeight * 0.38)
    ctx.lineTo(x - boltWidth * 0.6, y + boltHeight)
    ctx.lineTo(x + boltWidth * 1.1, y + boltHeight * 0.28)
    ctx.lineTo(x + boltWidth * 0.1, y + boltHeight * 0.34)
    ctx.closePath()
    ctx.fill()
  }
}

function drawFog(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
  ctx.strokeStyle = 'rgba(245, 248, 255, 0.42)'
  ctx.lineWidth = Math.max(6, width * 0.01)
  ctx.lineCap = 'round'

  for (let i = 0; i < 4; i += 1) {
    const y = height * (0.32 + i * 0.095)
    const offset = Math.sin(time * 0.45 + i) * width * 0.08
    ctx.beginPath()
    ctx.moveTo(width * -0.1 + offset, y)
    ctx.bezierCurveTo(width * 0.18, y - 22, width * 0.34, y + 22, width * 0.54, y)
    ctx.bezierCurveTo(width * 0.72, y - 20, width * 0.9, y + 18, width * 1.1, y)
    ctx.stroke()
  }
}

function drawStars(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
  ctx.fillStyle = '#ffffff'

  for (let i = 0; i < 46; i += 1) {
    const x = (i * 97) % width
    const y = ((i * 43) % Math.round(height * 0.45)) + height * 0.04
    const pulse = 0.45 + Math.sin(time * 1.6 + i) * 0.35
    ctx.globalAlpha = Math.max(0.22, pulse)
    ctx.beginPath()
    ctx.arc(x, y, 1.4 + (i % 3) * 0.6, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.globalAlpha = 1
}

function drawShootingStars(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
  const cycle = 7
  const streaks = [
    { x: 0.18, y: 0.12, delay: 0 },
    { x: 0.62, y: 0.2, delay: 2.6 },
    { x: 0.42, y: 0.08, delay: 4.7 },
  ]

  for (const streak of streaks) {
    const progress = ((time + streak.delay) % cycle) / cycle
    if (progress > 0.18) continue

    const fade = 1 - progress / 0.18
    const x = width * streak.x + progress * width * 0.42
    const y = height * streak.y + progress * height * 0.18
    const length = Math.max(42, width * 0.075)
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.68 * fade})`
    ctx.lineWidth = Math.max(1.4, width * 0.002)
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x - length, y - length * 0.34)
    ctx.stroke()
  }
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  weatherState: WeatherState,
  date: Date,
  elapsed: number,
  reduceMotion: boolean,
  temperature: number,
  moonPhase: MoonPhase,
) {
  const time = reduceMotion ? 0 : elapsed
  const timeOfDay = getTimeOfDay(date)
  const colors = palettes[timeOfDay]
  const tempTone = Math.max(0, Math.min(1, (temperature - 25) / 75))
  const sky = ctx.createLinearGradient(0, 0, 0, height)
  sky.addColorStop(0, colors.top)
  sky.addColorStop(0.52, colors.middle)
  sky.addColorStop(1, colors.bottom)
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, width, height)

  if (timeOfDay === 'night') {
    drawStars(ctx, width, height, time)
    if (weatherState === 'clear') {
      drawShootingStars(ctx, width, height, time)
    }
  }

  const minutes = date.getHours() * 60 + date.getMinutes()
  const dayProgress = Math.max(0, Math.min(1, (minutes - 300) / 960))
  const orbX =
    timeOfDay === 'night'
      ? width * (0.18 + ((minutes + 180) % 720) / 720 * 0.64)
      : width * (0.12 + dayProgress * 0.76)
  const orbY =
    timeOfDay === 'night'
      ? height * 0.22
      : height * (0.52 - Math.sin(dayProgress * Math.PI) * 0.35)

  if (timeOfDay === 'night') {
    drawMoon(ctx, orbX, orbY, Math.min(width, height) * 0.058, colors, moonPhase)
  } else {
    ctx.fillStyle = colors.orbGlow
    ctx.beginPath()
    ctx.arc(orbX, orbY, Math.min(width, height) * 0.16, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = colors.orb
    ctx.beginPath()
    ctx.arc(orbX, orbY, Math.min(width, height) * 0.055, 0, Math.PI * 2)
    ctx.fill()
  }

  const cloudDrift = reduceMotion ? 0 : Math.sin(time * 0.18) * width * 0.03
  const cloudCount = weatherState === 'clear' ? 2 : weatherState === 'cloudy' || weatherState === 'fog' ? 6 : 5

  for (let i = 0; i < cloudCount; i += 1) {
    const layer = i % 3
    const baseX = ((i * width * 0.23 + time * (8 + layer * 4)) % (width * 1.2)) - width * 0.1
    const baseY = height * (0.16 + layer * 0.1) + Math.sin(time * 0.4 + i) * 8
    const scale = Math.max(0.65, Math.min(1.25, width / 900)) * (0.72 + layer * 0.18)
    drawCloud(ctx, baseX + cloudDrift, baseY, scale, colors)
  }

  if (weatherState === 'rain') drawRain(ctx, width, height, time)
  if (weatherState === 'snow') drawSnow(ctx, width, height, time)
  if (weatherState === 'storm') drawStorm(ctx, width, height, time)
  if (weatherState === 'fog') drawFog(ctx, width, height, time)

  drawHill(ctx, width, height, height * 0.72, colors.hillBack, height * 0.11)
  drawRiver(ctx, width, height, colors, time)
  drawHouse(ctx, width * 0.12, height * 0.63, Math.max(28, width * 0.038), colors, timeOfDay === 'night')
  drawHouse(ctx, width * 0.77, height * 0.66, Math.max(24, width * 0.032), colors, timeOfDay === 'night')
  drawHill(ctx, width, height, height * 0.82, colors.hillFront, height * 0.08)
  drawBushes(ctx, width, height, colors)

  ctx.fillStyle =
    timeOfDay === 'night'
      ? '#203d5b'
      : `rgb(${Math.round(82 + tempTone * 55)}, ${Math.round(170 + tempTone * 42)}, ${Math.round(102 - tempTone * 30)})`
  for (let i = 0; i < 18; i += 1) {
    const x = (i * 89) % width
    const y = height * (0.78 + (i % 5) * 0.025)
    ctx.beginPath()
    ctx.ellipse(x, y, width * 0.018, height * 0.065, -0.2, 0, Math.PI * 2)
    ctx.fill()
  }
}

export function WeatherCanvas({
  weatherState,
  now,
  temperature,
  moonPhase,
  reduceMotion = false,
}: WeatherCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const nowRef = useRef(now)
  const weatherRef = useRef(weatherState)
  const temperatureRef = useRef(temperature)
  const moonPhaseRef = useRef(moonPhase)
  const reduceMotionRef = useRef(reduceMotion)

  useEffect(() => {
    nowRef.current = now
  }, [now])

  useEffect(() => {
    weatherRef.current = weatherState
  }, [weatherState])

  useEffect(() => {
    temperatureRef.current = temperature
  }, [temperature])

  useEffect(() => {
    moonPhaseRef.current = moonPhase
  }, [moonPhase])

  useEffect(() => {
    reduceMotionRef.current = reduceMotion
  }, [reduceMotion])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    let frame = 0
    let width = 0
    let height = 0
    const start = performance.now()

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = Math.max(1, Math.floor(rect.width))
      height = Math.max(1, Math.floor(rect.height))
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const render = (timestamp: number) => {
      drawScene(
        context,
        width,
        height,
        weatherRef.current,
        nowRef.current,
        (timestamp - start) / 1000,
        reduceMotionRef.current,
        temperatureRef.current,
        moonPhaseRef.current,
      )
      frame = requestAnimationFrame(render)
    }

    resize()
    window.addEventListener('resize', resize)
    frame = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas className="weather-canvas" ref={canvasRef} aria-hidden="true" />
}
