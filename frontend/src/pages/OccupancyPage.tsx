import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import RoomTimeline, { timeToMinutes, getLocalDateString } from '../components/RoomTimeline'

function StatusDot({ status }: { status: 'available' | 'occupied' | 'upcoming' }) {
  const colors = { available: '#16a34a', occupied: '#dc2626', upcoming: '#d97706' }
  return <span className="inline-block w-3 h-3 rounded-full animate-pulse" style={{ background: colors[status], boxShadow: `0 0 8px ${colors[status]}` }} />
}

function RoomCard({ roomId, now }: { roomId: string; now: Date }) {
  const [room, setRoom] = useState<any>(null)
  const [availability, setAvailability] = useState<any>(null)
  const todayDate = getLocalDateString(now)

  useEffect(() => {
    Promise.all([
      api.rooms.get(roomId),
      api.rooms.availability(roomId, todayDate)
    ]).then(([r, a]) => {
      setRoom(r)
      setAvailability(a)
    }).catch(() => {})
  }, [roomId, todayDate])

  if (!room) {
    return (
      <div className="rounded-2xl overflow-hidden flex flex-col" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="h-32 bg-gray-800" />
        <div className="p-4" />
      </div>
    )
  }

  const curMinutes = now.getHours() * 60 + now.getMinutes()
  const bookings = availability?.busySlots || []
  const currentBooking = bookings.find((b: any) => {
    const bStart = timeToMinutes(b.start)
    const bEnd = timeToMinutes(b.end)
    return bStart <= curMinutes && bEnd > curMinutes
  })

  const isOccupied = Boolean(currentBooking)
  const status = isOccupied ? 'occupied' : 'available'
  const statusLabel = isOccupied ? 'In Use' : 'Available'
  const c = {
    available: { bg: 'rgba(22,163,74,0.12)', border: 'rgba(22,163,74,0.3)', text: '#4ade80' },
    occupied: { bg: 'rgba(220,38,38,0.12)', border: 'rgba(220,38,38,0.3)', text: '#f87171' }
  }[status]

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col transition-all duration-500" style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${c.border}`, boxShadow: `0 0 30px ${c.bg}` }}>
      <div className="relative h-32 overflow-hidden bg-gray-800">
        {room.photo_url ? (
          <img src={room.photo_url} alt={room.name} className="w-full h-full object-cover opacity-60" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-indigo-950 text-4xl opacity-40">🏢</div>
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,10,20,0.9), rgba(10,10,20,0.2))' }} />
        <div className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium" style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
          <StatusDot status={status} />{statusLabel}
        </div>
        <div className="absolute bottom-3 left-4">
          <div className="font-display text-2xl text-white leading-tight">{room.name}</div>
          <div className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>{room.code} · {room.location}</div>
        </div>
      </div>
      <div className="p-4 flex flex-col gap-3 flex-1">
        {currentBooking ? (
          <div>
            <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Current meeting</div>
            <div className="font-medium text-white leading-tight mb-0.5">{currentBooking.title}</div>
            <div className="flex items-center gap-2 text-xs font-mono" style={{ color: c.text }}>
              <span>{currentBooking.start}–{currentBooking.end}</span>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Status</div>
            <div className="font-medium" style={{ color: c.text }}>
              {bookings.length > 0 ? 'Free' : 'Free all day'}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>Capacity</span>
          <span className="font-mono" style={{ color: 'rgba(255,255,255,0.7)' }}>{room.capacity} seats</span>
        </div>
        <div className="pt-1">
          <RoomTimeline
            roomId={roomId}
            date={todayDate}
            compact
            dark
            availabilityData={availability}
          />
        </div>
      </div>
    </div>
  )
}

export default function OccupancyPage() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(interval)
  }, [])

  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })
  const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const [rooms, setRooms] = useState<any[]>([])
  const [stats, setStats] = useState({ available: 0, occupied: 0 })

  useEffect(() => {
    api.rooms.list().then(async (r) => {
      const active = r.filter((x: any) => x.is_active)
      setRooms(active)
      let avail = 0, occ = 0
      const cur = now.getHours() * 60 + now.getMinutes()
      const todayDateStr = getLocalDateString(now)
      for (const room of active) {
        try {
          const a = await api.rooms.availability(room.id, todayDateStr)
          const isOcc = a.busySlots?.some((b: any) => {
            const bStart = timeToMinutes(b.start)
            const bEnd = timeToMinutes(b.end)
            return bStart <= cur && bEnd > cur
          })
          if (isOcc) occ++
          else avail++
        } catch {}
      }
      setStats({ available: avail, occupied: occ })
    }).catch(() => {})
  }, [now])

  return (
    <div className="min-h-screen p-6 lg:p-10" style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #0f0f1e 50%, #0a1020 100%)', color: 'white' }}>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-5xl lg:text-6xl mb-1">Room Status</h1>
          <p className="text-base" style={{ color: 'rgba(255,255,255,0.4)' }}>{dateStr}</p>
        </div>
        <div className="text-right">
          <div className="font-mono text-5xl lg:text-6xl font-light" style={{ color: 'rgba(255,255,255,0.9)' }}>{timeStr}</div>
          <div className="flex gap-4 mt-2 justify-end">
            <div className="flex items-center gap-1.5 text-sm">
              <span className="w-2 h-2 rounded-full" style={{ background: '#16a34a' }} />
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>{stats.available} available</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <span className="w-2 h-2 rounded-full" style={{ background: '#dc2626' }} />
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>{stats.occupied} occupied</span>
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {rooms.map(room => <RoomCard key={room.id} roomId={room.id} now={now} />)}
      </div>
      <div className="mt-8 text-center text-xs font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>
        Auto-refreshes every 30 seconds · Asia/Jakarta
      </div>
    </div>
  )
}
