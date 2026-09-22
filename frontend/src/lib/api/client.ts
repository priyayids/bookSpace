import type { Room, Booking, Settings } from '../../types'

const BASE = '/api'
let token: string | null = typeof window !== 'undefined' ? localStorage.getItem('roombook_admin_token') : null

export function setToken(t: string | null) {
  token = t
  if (typeof window !== 'undefined') {
    if (t) localStorage.setItem('roombook_admin_token', t)
    else localStorage.removeItem('roombook_admin_token')
  }
}

export function getToken(): string | null {
  return token
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${BASE}${url}`, {
    headers,
    credentials: 'include',
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `Request failed with status ${res.status}`)
  }
  return res.json()
}

export const api = {
  rooms: {
    list: () => request<Room[]>('/rooms'),
    get: (id: string) => request<Room>(`/rooms/${id}`),
    create: (data: Partial<Room>) => request<Room>('/rooms', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Room>) => request<Room>(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deactivate: (id: string) => request<void>(`/rooms/${id}`, { method: 'DELETE' }),
    availability: (id: string, date: string) => request<any>(`/rooms/${id}/availability?date=${date}`),
  },
  bookings: {
    list: (params?: { date?: string; room_id?: string; booked_by_email?: string; status?: string }) => {
      const q = new URLSearchParams(params as any).toString()
      return request<Booking[]>(`/bookings${q ? `?${q}` : ''}`)
    },
    create: (data: Partial<Booking> | any) => request<Booking>('/bookings', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Booking> | any) => request<Booking>(`/bookings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    approve: (id: string) => request<{ message: string; booking: Booking }>(`/bookings/${id}/approve`, { method: 'POST' }),
    cancel: (id: string) => request<void>(`/bookings/${id}`, { method: 'DELETE' }),
  },
  settings: {
    get: () => request<Settings>('/settings'),
    update: (data: Partial<Settings>) => request<Settings>('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  },
  dashboard: {
    stats: () => request<any>('/dashboard/stats'),
  },
  auth: {
    login: (password: string) => request<{ token: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ password }) }),
  },
}
