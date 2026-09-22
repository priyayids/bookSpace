import { useState } from 'react';
import { setToken } from './lib/api/client';
import ReservationPage from './pages/ReservationPage';
import OccupancyPage from './pages/OccupancyPage';
import AdminPage from './pages/AdminPage';

type Page = 'reserve' | 'occupancy' | 'admin';

const NAV_ITEMS: { id: Page; label: string; icon: string }[] = [
  { id: 'reserve', label: 'Book a Room', icon: '📅' },
  { id: 'occupancy', label: 'Room Status', icon: '🏢' },
  { id: 'admin', label: 'Admin', icon: '⚙️' },
];

export default function App() {
  const [page, setPage] = useState<Page>('reserve');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top nav */}
      <nav className="border-b sticky top-0 z-50"
        style={{ background: 'var(--card)', borderColor: 'var(--border)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-end h-14">
          <div className="flex items-center gap-1">
            {NAV_ITEMS.map(item => (
              <button key={item.id} onClick={() => setPage(item.id)}
                className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: page === item.id ? 'var(--primary)' : 'transparent',
                  color: page === item.id ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                }}>
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">{item.icon}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main style={{ flex: 1 }}>
        {page === 'reserve' && <ReservationPage />}
        {page === 'occupancy' && <OccupancyPage />}
        {page === 'admin' && <AdminPage />}
      </main>
    </div>
  );
}
