import { useState, useEffect } from 'react'
import { api } from '../lib/api'

export function timeToMinutes(t: string): number {
  const [h, m] = (t || '00:00').split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

export function minutesToTime(m: number): string {
  const h = String(Math.floor(m / 60)).padStart(2, '0')
  const min = String(m % 60).padStart(2, '0')
  return `${h}:${min}`
}

export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

interface RoomTimelineProps {
  roomId: string
  date: string
  compact?: boolean
  highlightStart?: string
  highlightEnd?: string
  dark?: boolean
  availabilityData?: any
}

export default function RoomTimeline({
  roomId,
  date,
  compact = false,
  highlightStart,
  highlightEnd,
  dark = false,
  availabilityData,
}: RoomTimelineProps) {
  const [fetchedAvailability, setFetchedAvailability] = useState<any>(null)

  useEffect(() => {
    if (!availabilityData) {
      api.rooms.availability(roomId, date).then(setFetchedAvailability).catch(() => {})
    }
  }, [roomId, date, availabilityData])

  const availability = availabilityData || fetchedAvailability

  if (!availability || !availability.room) {
    return (
      <div className="relative" style={{ paddingBottom: compact ? 16 : 20 }}>
        <div
          className={`relative ${compact ? 'h-5' : 'h-9'} rounded overflow-hidden`}
          style={{ background: dark ? 'rgba(255,255,255,0.08)' : 'var(--secondary)' }}
        />
      </div>
    )
  }

  const opHours = typeof availability.room.operating_hours === 'string'
    ? JSON.parse(availability.room.operating_hours)
    : (availability.room.operating_hours || { open: '08:00', close: '18:00' })

  const op = timeToMinutes(opHours.open || '08:00')
  const close = timeToMinutes(opHours.close || '18:00')
  const total = (close - op) || 600

  const toPercent = (t: string | number) => {
    const min = typeof t === 'number' ? t : timeToMinutes(t)
    return ((min - op) / total) * 100
  }

  const now = new Date()
  const todayDateStr = getLocalDateString(now)
  const isToday = date === todayDateStr
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const nowPct = toPercent(nowMin)

  const openHour = Math.ceil(op / 60)
  const closeHour = Math.floor(close / 60)
  const hourTicks: number[] = []
  for (let h = openHour; h <= closeHour; h++) {
    hourTicks.push(h)
  }

  const bookings = availability.busySlots || []

  if (compact) {
    return (
      <div className="relative" style={{ paddingBottom: 16 }}>
        <div
          className="relative h-5 rounded overflow-hidden"
          style={{ background: dark ? 'rgba(255,255,255,0.08)' : 'var(--secondary)' }}
        >
          {hourTicks.map(h => {
            const pct = toPercent(h * 60)
            if (pct <= 0 || pct >= 100) return null
            return (
              <div
                key={h}
                className="absolute top-0 h-full w-px pointer-events-none"
                style={{
                  left: `${pct}%`,
                  background: dark ? 'rgba(255,255,255,0.2)' : 'var(--muted-foreground)',
                  opacity: dark ? 0.4 : 0.3,
                }}
              />
            )
          })}
          {bookings.map((b: any, idx: number) => {
            const left = Math.max(0, toPercent(b.start))
            const width = Math.max(4, Math.min(100 - left, toPercent(b.end) - left))
            return (
              <div
                key={idx}
                className="absolute top-0 h-full flex items-center justify-center overflow-hidden px-1 cursor-default"
                title={`${b.title} (${b.start}–${b.end})`}
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  background: 'var(--status-occupied)',
                  opacity: 0.88,
                  minWidth: 4,
                }}
              >
                <span className="truncate text-[9px] text-white font-mono leading-none select-none">
                  {b.title}
                </span>
              </div>
            )
          })}
          {highlightStart && highlightEnd && (
            <div
              className="absolute top-0 h-full rounded pointer-events-none"
              style={{
                left: `${toPercent(highlightStart)}%`,
                width: `${toPercent(highlightEnd) - toPercent(highlightStart)}%`,
                background: 'var(--accent)',
                opacity: 0.55,
              }}
            />
          )}
          {isToday && nowPct >= 0 && nowPct <= 100 && (
            <div
              className="absolute top-0 h-full w-0.5 z-10 pointer-events-none"
              style={{
                left: `${nowPct}%`,
                background: dark ? '#ffffff' : 'var(--foreground)',
                boxShadow: dark ? '0 0 6px rgba(255,255,255,0.8)' : 'none',
                opacity: 0.9,
              }}
            />
          )}
        </div>
        <div className="relative mt-1" style={{ height: 12 }}>
          {hourTicks
            .filter((_, i) => i % 2 === 0)
            .map(h => {
              const pct = toPercent(h * 60)
              if (pct < 0 || pct > 100) return null
              return (
                <span
                  key={h}
                  className="absolute text-[9px] font-mono -translate-x-1/2 select-none"
                  style={{
                    left: `${pct}%`,
                    color: dark ? 'rgba(255,255,255,0.4)' : 'var(--muted-foreground)',
                    top: 0,
                  }}
                >
                  {String(h).padStart(2, '0')}
                </span>
              )
            })}
        </div>
      </div>
    )
  }

  return (
    <div className="relative" style={{ paddingBottom: 20 }}>
      <div
        className="relative h-9 rounded overflow-hidden"
        style={{ background: dark ? 'rgba(255,255,255,0.08)' : 'var(--secondary)' }}
      >
        {hourTicks.map(h => {
          const pct = toPercent(h * 60)
          if (pct <= 0 || pct >= 100) return null
          return (
            <div
              key={h}
              className="absolute top-0 h-full w-px pointer-events-none"
              style={{
                left: `${pct}%`,
                background: dark ? 'rgba(255,255,255,0.2)' : 'var(--border)',
                opacity: 0.8,
              }}
            />
          )
        })}
        {bookings.map((b: any, idx: number) => {
          const left = Math.max(0, toPercent(b.start))
          const width = Math.max(4, Math.min(100 - left, toPercent(b.end) - left))
          return (
            <div
              key={idx}
              className="absolute top-0 h-full flex items-center justify-center overflow-hidden px-1.5 group cursor-default"
              title={`${b.title}\n${b.start}–${b.end}`}
              style={{
                left: `${left}%`,
                width: `${width}%`,
                background: 'var(--status-occupied)',
                opacity: 0.88,
                minWidth: 4,
              }}
            >
              <span className="truncate text-[10px] text-white font-medium select-none">
                {b.title}
              </span>
            </div>
          )
        })}
        {highlightStart && highlightEnd && (
          <div
            className="absolute top-0 h-full rounded pointer-events-none"
            style={{
              left: `${toPercent(highlightStart)}%`,
              width: `${toPercent(highlightEnd) - toPercent(highlightStart)}%`,
              background: 'var(--accent)',
              opacity: 0.55,
            }}
          />
        )}
        {isToday && nowPct >= 0 && nowPct <= 100 && (
          <div
            className="absolute top-0 h-full w-0.5 z-10 pointer-events-none"
            style={{
              left: `${nowPct}%`,
              background: dark ? '#ffffff' : 'var(--foreground)',
              boxShadow: dark ? '0 0 6px rgba(255,255,255,0.8)' : 'none',
              opacity: 0.95,
            }}
          />
        )}
      </div>
      <div className="relative mt-1" style={{ height: 16 }}>
        {hourTicks.map(h => {
          const pct = toPercent(h * 60)
          if (pct < 0 || pct > 100) return null
          return (
            <span
              key={h}
              className="absolute text-[10px] font-mono -translate-x-1/2 select-none"
              style={{
                left: `${pct}%`,
                color: dark ? 'rgba(255,255,255,0.4)' : 'var(--muted-foreground)',
                top: 0,
              }}
            >
              {String(h).padStart(2, '0')}:00
            </span>
          )
        })}
      </div>
      <div
        className="flex items-center gap-4 mt-1 text-[10px]"
        style={{ color: dark ? 'rgba(255,255,255,0.45)' : 'var(--muted-foreground)' }}
      >
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-2 rounded-sm" style={{ background: 'var(--status-occupied)' }} />
          Booked
        </span>
        {highlightStart && (
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-2 rounded-sm opacity-55" style={{ background: 'var(--accent)' }} />
            Your slot
          </span>
        )}
        <span className="flex items-center gap-1">
          <span className="inline-block w-0.5 h-3" style={{ background: dark ? '#ffffff' : 'var(--foreground)', opacity: 0.8 }} />
          Now
        </span>
      </div>
    </div>
  )
}
