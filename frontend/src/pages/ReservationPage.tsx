import { useState, useEffect, useMemo } from 'react'
import { api } from '../lib/api'
import RoomTimeline, { timeToMinutes, minutesToTime, getLocalDateString } from '../components/RoomTimeline'

type Step = 'pick' | 'form' | 'success'

function generateTimeSlots(open: string, close: string, granularity: number): string[] {
  const slots: string[] = []
  let cur = timeToMinutes(open)
  const end = timeToMinutes(close)
  while (cur <= end) {
    slots.push(minutesToTime(cur))
    cur += granularity
  }
  return slots
}

function hasOverlap(bookings: { start_time: string; end_time: string }[], startTime: string, endTime: string): boolean {
  const start = timeToMinutes(startTime)
  const end = timeToMinutes(endTime)
  return bookings.some(b => {
    const bStart = timeToMinutes(b.start_time)
    const bEnd = timeToMinutes(b.end_time)
    return start < bEnd && end > bStart
  })
}

const FACILITY_LABELS: Record<string, string> = {
  projector: 'Projector', whiteboard: 'Whiteboard', video_conf: 'Video Conf', tv: 'TV Screen', phone: 'Conference Phone',
}

function FacilityTag({ facility }: { facility: string }) {
  return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--secondary)', color: 'var(--secondary-foreground)' }}>{FACILITY_LABELS[facility]}</span>
}

export default function ReservationPage() {
  const today = getLocalDateString()
  const [step, setStep] = useState<Step>('pick')
  const [selectedDate, setSelectedDate] = useState(today)
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [form, setForm] = useState({ title: '', name: '', email: '', attendees: '', notes: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null)
  const [myEmail, setMyEmail] = useState('')
  const [myBookings, setMyBookings] = useState<any[]>([])
  const [showMine, setShowMine] = useState(false)
  const [rooms, setRooms] = useState<any[]>([])
  const [roomsLoading, setRoomsLoading] = useState(true)

  const timeSlots = useMemo(() => generateTimeSlots('08:00', '18:00', 30), [])

  useEffect(() => { api.rooms.list().then(r => { setRooms(r.filter((x: any) => x.is_active)); setRoomsLoading(false) }).catch(() => setRoomsLoading(false)) }, [])

  const selectedRoom = rooms.find(r => r.id === selectedRoomId) || null
  const selectedRoomBookings = selectedRoomId ? [] : []

  function validate() {
    const errs: Record<string, string> = {}
    if (!form.title.trim()) errs.title = 'Required'
    if (!form.name.trim()) errs.name = 'Required'
    if (!form.email.trim() || !form.email.includes('@')) errs.email = 'Valid email required'
    const start = timeToMinutes(startTime), end = timeToMinutes(endTime)
    if (end - start < 60) errs.time = 'Minimum 60 min booking'
    if (form.attendees && selectedRoom && parseInt(form.attendees) > selectedRoom.capacity) errs.attendees = `Exceeds room capacity (${selectedRoom.capacity})`
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate() || !selectedRoomId) return
    try {
      const b = await api.bookings.create({ roomId: selectedRoomId, date: selectedDate, startTime, endTime, title: form.title, bookedByName: form.name, bookedByEmail: form.email, attendeeCount: parseInt(form.attendees) || 0, notes: form.notes })
      setConfirmedBooking(b)
      setStep('success')
    } catch (err) { setErrors({ time: (err as Error).message }) }
  }

  async function lookupMyBookings() {
    try { const results = await api.bookings.list({ booked_by_email: myEmail, status: 'all' }); setMyBookings(results) } catch {}
  }

  if (step === 'success' && confirmedBooking) {
    const isPending = confirmedBooking.status === 'pending'
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--background)' }}>
        <div className="max-w-md w-full text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{
              background: isPending ? '#fef3c7' : '#dcfce7',
              color: isPending ? '#b45309' : '#15803d',
              fontSize: 32,
            }}
          >
            {isPending ? '⏳' : '✓'}
          </div>
          <h1 className="font-display text-3xl mb-2" style={{ color: 'var(--foreground)' }}>
            {isPending ? 'Booking Requested' : 'Booking Confirmed'}
          </h1>
          <p className="mb-8" style={{ color: 'var(--muted-foreground)' }}>
            {isPending
              ? 'Your booking request is pending admin approval.'
              : 'Your room is reserved. See you there.'}
          </p>
          <div className="rounded-xl border p-6 text-left space-y-3" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--muted-foreground)' }}>Status</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${isPending ? 'badge-pending' : 'badge-available'}`}>
                {confirmedBooking.status || 'pending'}
              </span>
            </div>
            <div className="flex justify-between text-sm"><span style={{ color: 'var(--muted-foreground)' }}>Room</span><span className="font-medium">{confirmedBooking.room?.name || selectedRoom?.name || ''} ({confirmedBooking.room?.code || selectedRoom?.code || ''})</span></div>
            <div className="flex justify-between text-sm"><span style={{ color: 'var(--muted-foreground)' }}>Date</span><span className="font-medium font-mono">{confirmedBooking.date}</span></div>
            <div className="flex justify-between text-sm"><span style={{ color: 'var(--muted-foreground)' }}>Time</span><span className="font-medium font-mono">{confirmedBooking.startTime || confirmedBooking.start_time} – {confirmedBooking.endTime || confirmedBooking.end_time}</span></div>
            <div className="flex justify-between text-sm"><span style={{ color: 'var(--muted-foreground)' }}>Meeting</span><span className="font-medium">{confirmedBooking.title}</span></div>
            <div className="flex justify-between text-sm"><span style={{ color: 'var(--muted-foreground)' }}>Booked by</span><span className="font-medium">{confirmedBooking.bookedByName || confirmedBooking.booked_by_name}</span></div>
          </div>
          <button onClick={() => { setStep('pick'); setSelectedRoomId(null); setForm({ title: '', name: '', email: '', attendees: '', notes: '' }) }} className="mt-6 w-full py-3 rounded-lg font-medium transition-opacity hover:opacity-90" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>Book Another Room</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-end justify-between mb-8">
          <div><h1 className="font-display text-4xl mb-1" style={{ color: 'var(--foreground)' }}>Reserve a Room</h1><p style={{ color: 'var(--muted-foreground)' }}>Find and book your ideal meeting space</p></div>
          <button onClick={() => setShowMine(!showMine)} className="text-sm px-4 py-2 rounded-lg border transition-colors hover:opacity-80" style={{ borderColor: 'var(--border)', color: 'var(--secondary-foreground)', background: 'var(--card)' }}>My Bookings</button>
        </div>
        {showMine && (
          <div className="mb-8 p-5 rounded-xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <h3 className="font-medium mb-3">Look up your bookings</h3>
            <div className="flex gap-2 mb-4">
              <input type="email" placeholder="your@email.com" value={myEmail} onChange={e => setMyEmail(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2" style={{ borderColor: 'var(--border)', background: 'var(--background)' }} />
              <button onClick={lookupMyBookings} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>Search</button>
            </div>
            {myBookings.length === 0 && myEmail && <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No active bookings found.</p>}
            {myBookings.map((b: any) => (
              <div key={b.id} className="flex items-center justify-between py-2 border-t text-sm" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{b.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                      b.status === 'confirmed'
                        ? 'badge-available'
                        : b.status === 'pending'
                        ? 'badge-pending'
                        : 'badge-occupied'
                    }`}>
                      {b.status}
                    </span>
                  </div>
                  <div style={{ color: 'var(--muted-foreground)' }}>{b.room?.name || ''} · {b.date} · <span className="font-mono">{b.startTime || b.start_time}–{b.endTime || b.end_time}</span></div>
                </div>
                {b.status !== 'cancelled' && (
                  <button onClick={() => api.bookings.cancel(b.id).then(() => lookupMyBookings()).catch(() => {})} className="text-xs px-3 py-1 rounded border transition-colors hover:opacity-70" style={{ borderColor: '#fecaca', color: '#b91c1c', background: '#fee2e2' }}>Cancel</button>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-4 mb-8">
          <label className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Date</label>
          <input type="date" value={selectedDate} min={today} onChange={e => { setSelectedDate(e.target.value); setSelectedRoomId(null); setStep('pick') }} className="px-3 py-2 rounded-lg border text-sm font-mono outline-none focus:ring-2" style={{ borderColor: 'var(--border)', background: 'var(--card)' }} />
        </div>
        {step === 'pick' && (
          <div className="grid gap-4 sm:grid-cols-2">
            {roomsLoading ? <p>Loading rooms...</p> : rooms.map((room: any) => (
              <button key={room.id} onClick={() => { setSelectedRoomId(room.id); setStep('form') }} className="text-left rounded-xl border overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 group" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                <div className="relative h-36 overflow-hidden bg-gray-800">
                  {room.photo_url ? (
                    <img src={room.photo_url} alt={room.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 text-3xl opacity-50">🏢</div>
                  )}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)' }} />
                  <div className="absolute top-3 right-3"><span className="text-xs font-medium px-2 py-1 rounded-full badge-available">● Available</span></div>
                  <div className="absolute bottom-3 left-3 text-white"><div className="font-display text-xl leading-tight">{room.name}</div><div className="text-xs opacity-80 font-mono">{room.code} · {room.location}, Floor {room.floor}</div></div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm"><span style={{ color: 'var(--muted-foreground)' }}>Capacity</span><span className="font-medium">{room.capacity} people</span></div>
                  <div className="flex flex-wrap gap-1">{room.facilities?.map((f: string) => <FacilityTag key={f} facility={f} />)}</div>
                  <div className="pt-1"><RoomTimeline roomId={room.id} date={selectedDate} compact /></div>
                </div>
              </button>
            ))}
          </div>
        )}
        {step === 'form' && selectedRoom && (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="rounded-xl border p-6 space-y-6" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3"><button onClick={() => setStep('pick')} className="text-sm transition-opacity hover:opacity-60" style={{ color: 'var(--muted-foreground)' }}>← Back</button><span style={{ color: 'var(--border)' }}>|</span><h2 className="font-display text-2xl">{selectedRoom.name}</h2><span className="text-sm font-mono" style={{ color: 'var(--muted-foreground)' }}>{selectedRoom.code}</span></div>
              <div><p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--muted-foreground)' }}>Availability — {selectedDate}</p><div className="mb-6"><RoomTimeline roomId={selectedRoom.id} date={selectedDate} highlightStart={startTime} highlightEnd={endTime} /></div></div>
              <div><p className="text-sm font-medium mb-3">Select time</p><div className="grid grid-cols-2 gap-3"><div><label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Start</label><select value={startTime} onChange={e => { setStartTime(e.target.value); const st = timeToMinutes(e.target.value); setEndTime(minutesToTime(st + 60)) }} className="w-full px-3 py-2 rounded-lg border text-sm font-mono outline-none focus:ring-2" style={{ borderColor: errors.time ? 'var(--status-occupied)' : 'var(--border)', background: 'var(--background)' }}>{timeSlots.slice(0, -1).map(t => <option key={t} value={t}>{t}</option>)}</select></div><div><label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>End</label><select value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm font-mono outline-none focus:ring-2" style={{ borderColor: errors.time ? 'var(--status-occupied)' : 'var(--border)', background: 'var(--background)' }}>{timeSlots.filter(t => timeToMinutes(t) > timeToMinutes(startTime)).map(t => <option key={t} value={t}>{t}</option>)}</select></div></div>{errors.time && <p className="text-xs mt-1" style={{ color: 'var(--status-occupied)' }}>{errors.time}</p>}</div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><label className="text-sm font-medium block mb-1">Meeting title *</label><input type="text" placeholder="e.g. Q3 Planning Review" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2" style={{ borderColor: errors.title ? 'var(--status-occupied)' : 'var(--border)', background: 'var(--background)' }} />{errors.title && <p className="text-xs mt-1" style={{ color: 'var(--status-occupied)' }}>{errors.title}</p>}</div>
                <div className="grid grid-cols-2 gap-3"><div><label className="text-sm font-medium block mb-1">Your name *</label><input type="text" placeholder="Full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2" style={{ borderColor: errors.name ? 'var(--status-occupied)' : 'var(--border)', background: 'var(--background)' }} />{errors.name && <p className="text-xs mt-1" style={{ color: 'var(--status-occupied)' }}>{errors.name}</p>}</div><div><label className="text-sm font-medium block mb-1">Email *</label><input type="email" placeholder="you@company.co" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2" style={{ borderColor: errors.email ? 'var(--status-occupied)' : 'var(--border)', background: 'var(--background)' }} />{errors.email && <p className="text-xs mt-1" style={{ color: 'var(--status-occupied)' }}>{errors.email}</p>}</div></div>
                <div><label className="text-sm font-medium block mb-1">Number of attendees</label><input type="number" min={1} max={selectedRoom.capacity} placeholder={`Max ${selectedRoom.capacity}`} value={form.attendees} onChange={e => setForm(f => ({ ...f, attendees: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2" style={{ borderColor: errors.attendees ? '#d97706' : 'var(--border)', background: 'var(--background)' }} />{errors.attendees && <p className="text-xs mt-1" style={{ color: '#d97706' }}>{errors.attendees}</p>}</div>
                <div><label className="text-sm font-medium block mb-1">Notes</label><textarea rows={2} placeholder="Any special requirements…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 resize-none" style={{ borderColor: 'var(--border)', background: 'var(--background)' }} /></div>
                <button type="submit" className="w-full py-3 rounded-lg font-medium text-sm transition-opacity hover:opacity-90" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>Confirm Booking</button>
              </form>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                {selectedRoom.photo_url ? (
                  <img src={selectedRoom.photo_url} alt={selectedRoom.name} className="w-full h-44 object-cover" />
                ) : (
                  <div className="w-full h-44 flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 text-4xl opacity-50">🏢</div>
                )}
                <div className="p-4 space-y-3"><div><h3 className="font-display text-xl">{selectedRoom.name}</h3><p className="text-sm font-mono" style={{ color: 'var(--muted-foreground)' }}>{selectedRoom.location} · Floor {selectedRoom.floor}</p></div><div className="text-sm flex justify-between"><span style={{ color: 'var(--muted-foreground)' }}>Capacity</span><span className="font-medium">{selectedRoom.capacity} people</span></div><div className="text-sm flex justify-between"><span style={{ color: 'var(--muted-foreground)' }}>Operating hours</span><span className="font-mono font-medium">{selectedRoom.operating_hours?.open} – {selectedRoom.operating_hours?.close}</span></div><div className="flex flex-wrap gap-1 pt-1">{selectedRoom.facilities?.map((f: string) => <FacilityTag key={f} facility={f} />)}</div></div></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
