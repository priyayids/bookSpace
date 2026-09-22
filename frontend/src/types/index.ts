export type Facility = 'projector' | 'whiteboard' | 'video_conf' | 'tv' | 'phone'

export interface Room {
  id: string
  name: string
  code: string
  location: string
  floor: number
  capacity: number
  facilities: Facility[]
  photo_url: string | null
  operating_hours: { open: string; close: string }
  is_active: boolean
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
  status: 'pending' | 'confirmed' | 'cancelled'
}

export interface Settings {
  operating_hours: { open: string; close: string }
  min_duration_minutes: number
  slot_granularity_minutes: number
}
