import { useState, useEffect } from 'react'
import { api, setToken, getToken } from '../lib/api'

type AdminTab = 'overview' | 'rooms' | 'bookings' | 'settings'

const FACILITY_OPTIONS = ['projector', 'whiteboard', 'video_conf', 'tv', 'phone']
const FACILITY_LABELS: Record<string, string> = {
  projector: 'Projector', whiteboard: 'Whiteboard', video_conf: 'Video Conf',
  tv: 'TV Screen', phone: 'Conference Phone',
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl border p-5" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
      <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
      <p className="font-display text-3xl" style={{ color: color || 'var(--foreground)' }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{sub}</p>}
    </div>
  )
}

function OverviewTab() {
  const [stats, setStats] = useState<any>(null)
  useEffect(() => { api.dashboard.stats().then(setStats).catch(() => {}) }, [])

  const today = new Date().toISOString().split('T')[0]
  const todayBookings = stats?.todayBookings || 0
  const totalBookings = stats?.totalBookings ?? todayBookings
  const cancelledBookings = stats?.cancelledBookings ?? 0
  const activeRooms = stats?.activeRooms || 0
  const totalRooms = stats?.totalRooms || 0
  const recentActivity = stats?.recentActivity || []
  const roomUsage = stats?.mostBookedRooms || []
  const maxUsage = roomUsage.length > 0 ? roomUsage[0].count : 1

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active rooms" value={activeRooms} sub={`${totalRooms - activeRooms} inactive`} />
        <StatCard label="Today's bookings" value={todayBookings} sub="confirmed" color="var(--accent)" />
        <StatCard label="Total bookings" value={totalBookings} sub="all time" />
        <StatCard label="Cancelled" value={cancelledBookings} sub="all time" color="var(--status-occupied)" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="rounded-xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}><h3 className="font-medium">Recent bookings</h3></div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {recentActivity.map((b: any, i: number) => (
              <div key={i} className="px-5 py-3 flex items-center gap-4">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--status-available)' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{b.title}</p>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {b.room?.name} · {b.date} · <span className="font-mono">{b.startTime}–{b.endTime}</span>
                  </p>
                </div>
                <div className="text-xs shrink-0" style={{ color: 'var(--muted-foreground)' }}>{b.bookedByName}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}><h3 className="font-medium">Most booked rooms</h3></div>
          <div className="px-5 py-3 space-y-3">
            {roomUsage.map((r: any, i: number) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{r.name}</span>
                  <span className="font-mono" style={{ color: 'var(--muted-foreground)' }}>{r.count}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--secondary)' }}>
                  <div className="h-full rounded-full transition-all" style={{
                    width: `${(r.count / maxUsage) * 100}%`,
                    background: i === 0 ? 'var(--accent)' : 'var(--muted-foreground)',
                    opacity: i === 0 ? 1 : 0.5,
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function RoomsTab() {
  const [rooms, setRooms] = useState<any[]>([])
  const [editing, setEditing] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<any>({ name: '', code: '', location: '', floor: 1, capacity: 8, facilities: [], photo_url: '', operating_hours: { open: '08:00', close: '18:00' }, is_active: true })
  const [photoPreview, setPhotoPreview] = useState<string>('')
  useEffect(() => { api.rooms.list().then(setRooms).catch(() => {}) }, [])

  function openEdit(room: any) { setEditing(room); setForm({ ...room }); setPhotoPreview(room.photo_url || ''); setShowForm(true) }
  function openNew() { setEditing(null); setForm({ name: '', code: '', location: '', floor: 1, capacity: 8, facilities: [], photo_url: '', operating_hours: { open: '08:00', close: '18:00' }, is_active: true }); setPhotoPreview(''); setShowForm(true) }

  async function save() {
    try {
      if (editing) { await api.rooms.update(editing.id, form); setRooms(rooms.map(r => r.id === editing.id ? { ...r, ...form } : r)) }
      else { const newRoom = await api.rooms.create(form); setRooms([...rooms, newRoom]) }
      setShowForm(false)
    } catch (err) { console.error(err) }
  }

  async function toggleActive(id: string, currentState: boolean) {
    await api.rooms.update(id, { is_active: !currentState })
    setRooms(rooms.map(r => r.id === id ? { ...r, is_active: !currentState } : r))
  }

  const roomFields: [string, string][] = [['name', 'Room name'], ['code', 'Code (e.g. A-01)'], ['location', 'Location/Building']]
  const numberFields: [string, string][] = [['capacity', 'Capacity'], ['floor', 'Floor']]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-medium">All Rooms ({rooms.length})</h2>
        <button onClick={openNew} className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>+ Add Room</button>
      </div>
      {showForm && (
        <div className="rounded-xl border p-5 space-y-4" style={{ background: 'var(--card)', borderColor: 'var(--accent)' }}>
          <h3 className="font-medium">{editing ? `Edit ${editing.name}` : 'New Room'}</h3>
          <div className="grid grid-cols-2 gap-3">
            {roomFields.map(([key, label]) => (
              <div key={key}>
                <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>{label}</label>
                <input type="text" value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--border)', background: 'var(--background)' }} />
              </div>
            ))}
            {numberFields.map(([key, label]) => (
              <div key={key}>
                <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>{label}</label>
                <input type="number" min={1} value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: +e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--border)', background: 'var(--background)' }} />
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs mb-2 block" style={{ color: 'var(--muted-foreground)' }}>Room photo</label>
            <div className="flex gap-4 items-start">
              <div className="w-32 h-24 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border" style={{ background: 'var(--secondary)', borderColor: 'var(--border)' }}>
                {(photoPreview || form.photo_url) ? <img src={photoPreview || form.photo_url} alt="Room preview" className="w-full h-full object-cover" /> : <span className="text-2xl opacity-30">🏢</span>}
              </div>
              <div className="flex-1 space-y-2">
                <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer text-sm font-medium transition-colors hover:opacity-80 w-fit" style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--secondary-foreground)' }}>
                  <span>↑</span> Upload image
                  <input type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = ev => { const dataUrl = ev.target?.result as string; setPhotoPreview(dataUrl); setForm(f => ({ ...f, photo_url: dataUrl })) }; reader.readAsDataURL(file) } }} />
                </label>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>JPG, PNG, WebP</p>
                {(photoPreview || form.photo_url) && <button type="button" onClick={() => { setPhotoPreview(''); setForm(f => ({ ...f, photo_url: '' })) }} className="text-xs px-3 py-1 rounded border" style={{ borderColor: '#fecaca', color: '#b91c1c', background: '#fee2e2' }}>Remove photo</button>}
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs mb-2 block" style={{ color: 'var(--muted-foreground)' }}>Facilities</label>
            <div className="flex flex-wrap gap-2">
              {FACILITY_OPTIONS.map(f => (
                <label key={f} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="checkbox" checked={(form.facilities || []).includes(f)} onChange={e => setForm(prev => ({ ...prev, facilities: e.target.checked ? [...prev.facilities, f] : prev.facilities.filter((x: string) => x !== f) }))} />
                  {FACILITY_LABELS[f]}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm border" style={{ borderColor: 'var(--border)', color: 'var(--secondary-foreground)' }}>Cancel</button>
          </div>
        </div>
      )}
      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
              {['', 'Room', 'Code', 'Location', 'Capacity', 'Facilities', 'Status', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {rooms.map(room => (
              <tr key={room.id} style={{ opacity: room.is_active ? 1 : 0.5 }}>
                <td className="px-3 py-2 w-12">
                  <div className="w-10 h-10 rounded-md overflow-hidden" style={{ background: 'var(--secondary)' }}>
                    {room.photo_url ? <img src={room.photo_url} alt={room.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-sm opacity-30">🏢</div>}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium">{room.name}</td>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--muted-foreground)' }}>{room.code}</td>
                <td className="px-4 py-3" style={{ color: 'var(--muted-foreground)' }}>{room.location}, F{room.floor}</td>
                <td className="px-4 py-3 font-mono">{room.capacity}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(room.facilities || []).slice(0, 3).map(f => <span key={f} className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--secondary)', color: 'var(--secondary-foreground)' }}>{FACILITY_LABELS[f]}</span>)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive(room.id, room.is_active)} className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: room.is_active ? '#dcfce7' : 'var(--secondary)', color: room.is_active ? '#15803d' : 'var(--muted-foreground)' }}>
                    {room.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => openEdit(room)} className="text-xs px-3 py-1 rounded border transition-colors hover:opacity-70" style={{ borderColor: 'var(--border)', color: 'var(--secondary-foreground)' }}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function BookingsTab() {
  const [bookings, setBookings] = useState<any[]>([])
  const [filterRoom, setFilterRoom] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [rooms, setRooms] = useState<any[]>([])
  useEffect(() => { api.bookings.list().then(setBookings).catch(() => {}) }, [])
  useEffect(() => { api.rooms.list().then(setRooms).catch(() => {}) }, [])

  const filtered = bookings.filter((b: any) => {
    if (filterRoom && b.room_id !== filterRoom) return false
    if (filterDate && b.date !== filterDate) return false
    if (filterStatus && b.status !== filterStatus) return false
    return true
  }).sort((a: any, b: any) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))

  async function handleApprove(id: string) {
    try {
      await api.bookings.approve(id)
      setBookings(bookings.map(b => b.id === id ? { ...b, status: 'confirmed' } : b))
    } catch (err) {
      console.error('Failed to approve booking', err)
    }
  }

  async function handleCancel(id: string) {
    try {
      await api.bookings.cancel(id)
      setBookings(bookings.map(b => b.id === id ? { ...b, status: 'cancelled' } : b))
    } catch (err) {
      console.error('Failed to cancel booking', err)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <select value={filterRoom} onChange={e => setFilterRoom(e.target.value)} className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <option value="">All Rooms</option>
          {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="px-3 py-2 rounded-lg border text-sm font-mono outline-none" style={{ borderColor: 'var(--border)', background: 'var(--card)' }} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <span className="text-sm ml-auto" style={{ color: 'var(--muted-foreground)' }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
              {['Title', 'Room', 'Date', 'Time', 'Booked by', 'Attendees', 'Status', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {filtered.map((b: any) => (
              <tr key={b.id} style={{ opacity: b.status === 'cancelled' ? 0.5 : 1 }}>
                <td className="px-4 py-3 font-medium max-w-[160px] truncate">{b.title}</td>
                <td className="px-4 py-3" style={{ color: 'var(--muted-foreground)' }}>{rooms.find((r: any) => r.id === b.room_id)?.name || ''}</td>
                <td className="px-4 py-3 font-mono text-xs">{b.date}</td>
                <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">{b.start_time}–{b.end_time}</td>
                <td className="px-4 py-3">
                  <div className="text-xs">{b.booked_by_name}</div>
                  <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{b.booked_by_email}</div>
                </td>
                <td className="px-4 py-3 font-mono">{b.attendee_count || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                    b.status === 'confirmed'
                      ? 'badge-available'
                      : b.status === 'pending'
                      ? 'badge-pending'
                      : 'badge-occupied'
                  }`}>
                    {b.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {b.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(b.id)}
                          className="text-xs px-3 py-1 rounded font-medium transition-opacity hover:opacity-90 cursor-pointer"
                          style={{ background: '#16a34a', color: '#ffffff' }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleCancel(b.id)}
                          className="text-xs px-3 py-1 rounded border transition-opacity hover:opacity-70 cursor-pointer"
                          style={{ borderColor: '#fecaca', color: '#b91c1c', background: '#fee2e2' }}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {b.status === 'confirmed' && (
                      <button
                        onClick={() => handleCancel(b.id)}
                        className="text-xs px-3 py-1 rounded border transition-opacity hover:opacity-70 cursor-pointer"
                        style={{ borderColor: '#fecaca', color: '#b91c1c', background: '#fee2e2' }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="py-12 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>No bookings match the current filters.</div>}
      </div>
    </div>
  )
}

function SettingsTab() {
  const [settings, setSettings] = useState<any>(null)
  const [saved, setSaved] = useState(false)
  useEffect(() => { api.settings.get().then(setSettings).catch(() => {}) }, [])

  async function save() {
    try { await api.settings.update(settings); setSaved(true); setTimeout(() => setSaved(false), 2000) } catch {}
  }

  if (!settings) return <div className="max-w-lg space-y-6"><div className="rounded-xl border p-5" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}><div className="h-4 bg-gray-200 rounded animate-pulse" /></div></div>

  return (
    <div className="max-w-lg space-y-6">
      <div className="rounded-xl border p-5 space-y-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <h3 className="font-medium">Operating Hours</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Opens</label>
            <input type="time" value={settings.operating_hours?.open || ''} onChange={e => setSettings(s => ({ ...s, operating_hours: { ...s.operating_hours, open: e.target.value } }))} className="w-full px-3 py-2 rounded-lg border text-sm font-mono outline-none" style={{ borderColor: 'var(--border)', background: 'var(--background)' }} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Closes</label>
            <input type="time" value={settings.operating_hours?.close || ''} onChange={e => setSettings(s => ({ ...s, operating_hours: { ...s.operating_hours, close: e.target.value } }))} className="w-full px-3 py-2 rounded-lg border text-sm font-mono outline-none" style={{ borderColor: 'var(--border)', background: 'var(--background)' }} />
          </div>
        </div>
      </div>
      <div className="rounded-xl border p-5 space-y-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <h3 className="font-medium">Booking Rules</h3>
        <div>
          <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Minimum duration (minutes)</label>
          <input type="number" min={15} step={15} value={settings.min_duration_minutes || 60} onChange={e => setSettings(s => ({ ...s, min_duration_minutes: +e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm font-mono outline-none" style={{ borderColor: 'var(--border)', background: 'var(--background)' }} />
        </div>
        <div>
          <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>Time slot granularity (minutes)</label>
          <select value={settings.slot_granularity_minutes || 30} onChange={e => setSettings(s => ({ ...s, slot_granularity_minutes: +e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--border)', background: 'var(--background)' }}>
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>60 minutes</option>
          </select>
        </div>
      </div>
      <button onClick={save} className="px-6 py-2.5 rounded-lg text-sm font-medium transition-all" style={{ background: saved ? '#16a34a' : 'var(--primary)', color: 'white' }}>
        {saved ? '✓ Saved' : 'Save Settings'}
      </button>
    </div>
  )
}

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>('overview')
  const [authed, setAuthed] = useState(() => !!getToken())
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    try { const { token } = await api.auth.login(password); setToken(token); setAuthed(true) } catch { setError('Incorrect password. Try "admin".') }
  }

  const tabs = [{ id: 'overview', label: 'Overview' }, { id: 'rooms', label: 'Rooms' }, { id: 'bookings', label: 'Bookings' }, { id: 'settings', label: 'Settings' }]

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="w-full max-w-sm p-8 rounded-2xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="mb-6">
            <h1 className="font-display text-3xl mb-1">Admin Access</h1>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Enter your admin password to continue</p>
          </div>
          <form onSubmit={handleLogin}>
            <input type="password" placeholder="Password" value={password} onChange={e => { setPassword(e.target.value); setError('') }} className="w-full px-4 py-3 rounded-lg border mb-3 text-sm outline-none focus:ring-2" style={{ borderColor: error ? 'var(--status-occupied)' : 'var(--border)', background: 'var(--background)' }} />
            {error && <p className="text-xs mb-3" style={{ color: 'var(--status-occupied)' }}>{error}</p>}
            <button type="submit" className="w-full py-3 rounded-lg font-medium text-sm transition-opacity hover:opacity-90" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>Sign In</button>
          </form>
          <p className="text-xs mt-4 text-center" style={{ color: 'var(--muted-foreground)' }}>Demo: password is "admin"</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
            <h1 className="font-display text-xl">Admin Dashboard</h1>
          </div>
          <button onClick={() => { setToken(null); setAuthed(false) }} className="text-xs px-3 py-1.5 rounded border" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>Sign out</button>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-1 mb-8 border-b" style={{ borderColor: 'var(--border)' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className="px-4 py-2.5 text-sm font-medium transition-colors relative" style={{ color: tab === t.id ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
              {t.label}
              {tab === t.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t" style={{ background: 'var(--accent)' }} />}
            </button>
          ))}
        </div>
        <div>
          {tab === 'overview' && <OverviewTab />}
          {tab === 'rooms' && <RoomsTab />}
          {tab === 'bookings' && <BookingsTab />}
          {tab === 'settings' && <SettingsTab />}
        </div>
      </div>
    </div>
  )
}
