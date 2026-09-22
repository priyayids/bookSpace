export interface Room {
  id: string
  name: string
  code: string
  location: string
  floor: number
  capacity: number
  facilities: string[]
  photo_url: string | null
  operating_hours: { open: string; close: string }
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface Booking {
  id: string
  room_id: string
  date: string
  start_time: string
  end_time: string
  title: string
  booked_by_name: string
  booked_by_email: string
  attendee_count: number | null
  notes: string | null
  status: string
  created_at: Date
  updated_at: Date
}

export interface Settings {
  id: string
  operating_hours: { open: string; close: string }
  min_duration_minutes: number
  slot_granularity_minutes: number
  timezone: string
  updated_at: Date
}
