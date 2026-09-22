export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export function minutesToTime(m: number): string {
  const h = String(Math.floor(m / 60)).padStart(2, '0')
  const min = String(m % 60).padStart(2, '0')
  return `${h}:${min}`
}

export function hasOverlap(bookings: { start_time: string; end_time: string }[], startTime: string, endTime: string): boolean {
  const start = timeToMinutes(startTime)
  const end = timeToMinutes(endTime)
  return bookings.some(b => {
    const bStart = timeToMinutes(b.start_time)
    const bEnd = timeToMinutes(b.end_time)
    return start < bEnd && end > bStart
  })
}
