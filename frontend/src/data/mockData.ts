export type Facility = 'projector' | 'whiteboard' | 'video_conf' | 'tv' | 'phone';

export interface Room {
  id: string;
  name: string;
  code: string;
  location: string;
  floor: number;
  capacity: number;
  facilities: Facility[];
  photo: string;
  operatingHours: { open: string; close: string };
  isActive: boolean;
}

export type BookingStatus = 'confirmed' | 'cancelled';

export interface Booking {
  id: string;
  roomId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  title: string;
  bookedByName: string;
  bookedByEmail: string;
  attendeeCount: number;
  notes: string;
  status: BookingStatus;
}

export const FACILITIES_LABELS: Record<Facility, string> = {
  projector: 'Projector',
  whiteboard: 'Whiteboard',
  video_conf: 'Video Conf',
  tv: 'TV Screen',
  phone: 'Conference Phone',
};

export const ROOMS: Room[] = [
  {
    id: 'r1',
    name: 'Archipelago',
    code: 'A-01',
    location: 'Building A',
    floor: 1,
    capacity: 12,
    facilities: ['projector', 'whiteboard', 'video_conf', 'phone'],
    photo: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop&auto=format',
    operatingHours: { open: '08:00', close: '18:00' },
    isActive: true,
  },
  {
    id: 'r2',
    name: 'Komodo',
    code: 'A-02',
    location: 'Building A',
    floor: 1,
    capacity: 6,
    facilities: ['tv', 'whiteboard'],
    photo: 'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=600&h=400&fit=crop&auto=format',
    operatingHours: { open: '08:00', close: '18:00' },
    isActive: true,
  },
  {
    id: 'r3',
    name: 'Bromo',
    code: 'B-01',
    location: 'Building B',
    floor: 2,
    capacity: 20,
    facilities: ['projector', 'video_conf', 'phone', 'whiteboard', 'tv'],
    photo: 'https://images.unsplash.com/photo-1497366412874-3415097a27e7?w=600&h=400&fit=crop&auto=format',
    operatingHours: { open: '08:00', close: '18:00' },
    isActive: true,
  },
  {
    id: 'r4',
    name: 'Rinjani',
    code: 'B-02',
    location: 'Building B',
    floor: 2,
    capacity: 4,
    facilities: ['tv', 'phone'],
    photo: 'https://images.unsplash.com/photo-1572025442646-866d16c84a54?w=600&h=400&fit=crop&auto=format',
    operatingHours: { open: '08:00', close: '18:00' },
    isActive: true,
  },
  {
    id: 'r5',
    name: 'Batur',
    code: 'C-01',
    location: 'Building C',
    floor: 3,
    capacity: 8,
    facilities: ['projector', 'whiteboard'],
    photo: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=600&h=400&fit=crop&auto=format',
    operatingHours: { open: '08:00', close: '18:00' },
    isActive: true,
  },
  {
    id: 'r6',
    name: 'Semeru',
    code: 'C-02',
    location: 'Building C',
    floor: 3,
    capacity: 30,
    facilities: ['projector', 'video_conf', 'phone', 'whiteboard', 'tv'],
    photo: 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=600&h=400&fit=crop&auto=format',
    operatingHours: { open: '07:00', close: '20:00' },
    isActive: false,
  },
];

const today = new Date().toISOString().split('T')[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

export let BOOKINGS: Booking[] = [
  {
    id: 'b1', roomId: 'r1', date: today, startTime: '09:00', endTime: '10:30',
    title: 'Q3 Planning Review', bookedByName: 'Aditya Putra', bookedByEmail: 'aditya@company.co',
    attendeeCount: 8, notes: '', status: 'confirmed',
  },
  {
    id: 'b2', roomId: 'r1', date: today, startTime: '13:00', endTime: '15:00',
    title: 'Product Roadmap Sync', bookedByName: 'Sari Dewi', bookedByEmail: 'sari@company.co',
    attendeeCount: 10, notes: 'Bring printed decks', status: 'confirmed',
  },
  {
    id: 'b3', roomId: 'r2', date: today, startTime: '10:00', endTime: '11:00',
    title: 'Design Critique', bookedByName: 'Rizky Halim', bookedByEmail: 'rizky@company.co',
    attendeeCount: 4, notes: '', status: 'confirmed',
  },
  {
    id: 'b4', roomId: 'r3', date: today, startTime: '08:00', endTime: '09:30',
    title: 'All-hands Kickoff', bookedByName: 'Maya Sari', bookedByEmail: 'maya@company.co',
    attendeeCount: 18, notes: 'Town hall format', status: 'confirmed',
  },
  {
    id: 'b5', roomId: 'r3', date: today, startTime: '14:00', endTime: '16:00',
    title: 'Partner Integration Demo', bookedByName: 'Budi Santoso', bookedByEmail: 'budi@company.co',
    attendeeCount: 15, notes: '', status: 'confirmed',
  },
  {
    id: 'b6', roomId: 'r4', date: today, startTime: '11:00', endTime: '12:00',
    title: '1-on-1 Coaching', bookedByName: 'Putri Wulandari', bookedByEmail: 'putri@company.co',
    attendeeCount: 2, notes: '', status: 'confirmed',
  },
  {
    id: 'b7', roomId: 'r5', date: today, startTime: '15:00', endTime: '17:00',
    title: 'Engineering Retrospective', bookedByName: 'Fajar Nugroho', bookedByEmail: 'fajar@company.co',
    attendeeCount: 6, notes: 'Bring sticky notes', status: 'confirmed',
  },
  {
    id: 'b8', roomId: 'r1', date: tomorrow, startTime: '09:00', endTime: '11:00',
    title: 'Budget Review FY25', bookedByName: 'Aditya Putra', bookedByEmail: 'aditya@company.co',
    attendeeCount: 6, notes: '', status: 'confirmed',
  },
];

export function addBooking(booking: Omit<Booking, 'id'>): Booking {
  const newBooking = { ...booking, id: `b${Date.now()}` };
  BOOKINGS.push(newBooking);
  return newBooking;
}

export function cancelBooking(id: string) {
  const b = BOOKINGS.find(b => b.id === id);
  if (b) b.status = 'cancelled';
}

export function updateBooking(id: string, updates: Partial<Booking>) {
  const idx = BOOKINGS.findIndex(b => b.id === id);
  if (idx !== -1) BOOKINGS[idx] = { ...BOOKINGS[idx], ...updates };
}

export function getBookingsForRoomDate(roomId: string, date: string): Booking[] {
  return BOOKINGS.filter(b => b.roomId === roomId && b.date === date && b.status === 'confirmed');
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(m: number): string {
  const h = Math.floor(m / 60).toString().padStart(2, '0');
  const min = (m % 60).toString().padStart(2, '0');
  return `${h}:${min}`;
}

export function getRoomStatus(room: Room, bookings: Booking[], now: Date): 'available' | 'occupied' | 'upcoming' {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const current = bookings.find(b =>
    timeToMinutes(b.startTime) <= currentMinutes && timeToMinutes(b.endTime) > currentMinutes
  );
  if (current) return 'occupied';
  const next = bookings
    .filter(b => timeToMinutes(b.startTime) > currentMinutes)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))[0];
  if (next && timeToMinutes(next.startTime) - currentMinutes <= 30) return 'upcoming';
  return 'available';
}

export function getCurrentOrNextBooking(bookings: Booking[], now: Date): { booking: Booking | null; isNow: boolean } {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const current = bookings.find(b =>
    timeToMinutes(b.startTime) <= currentMinutes && timeToMinutes(b.endTime) > currentMinutes
  );
  if (current) return { booking: current, isNow: true };
  const next = bookings
    .filter(b => timeToMinutes(b.startTime) > currentMinutes)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))[0];
  return { booking: next || null, isNow: false };
}

export function hasOverlap(bookings: Booking[], startTime: string, endTime: string): boolean {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  return bookings.some(b => {
    const bStart = timeToMinutes(b.startTime);
    const bEnd = timeToMinutes(b.endTime);
    return start < bEnd && end > bStart;
  });
}

export const SETTINGS = {
  operatingHours: { open: '08:00', close: '18:00' },
  minDurationMinutes: 60,
  slotGranularityMinutes: 30,
};

export function generateTimeSlots(open: string, close: string, granularity: number): string[] {
  const slots: string[] = [];
  let cur = timeToMinutes(open);
  const end = timeToMinutes(close);
  while (cur <= end) {
    slots.push(minutesToTime(cur));
    cur += granularity;
  }
  return slots;
}
