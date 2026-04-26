import { NavLink } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { Avatar } from './ui'

const ITEMS = [
  {
    id: 'overview',
    label: 'Overview',
    path: '/overview',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3"  width="7" height="9" rx="1.5"/>
        <rect x="14" y="3"  width="7" height="5" rx="1.5"/>
        <rect x="14" y="12" width="7" height="9" rx="1.5"/>
        <rect x="3" y="16" width="7" height="5" rx="1.5"/>
      </svg>
    ),
  },
  {
    id: 'users',
    label: 'Users',
    path: '/users',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87"/>
        <path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
  {
    id: 'coupons',
    label: 'Coupons',
    path: '/coupons',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 12a2 2 0 012-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v4a2 2 0 012 2 2 2 0 01-2 2v4a2 2 0 002 2h16a2 2 0 002-2v-4a2 2 0 01-2-2z"/>
        <line x1="9" y1="8"  x2="9" y2="10"/>
        <line x1="9" y1="14" x2="9" y2="16"/>
      </svg>
    ),
  },
  {
    id: 'system',
    label: 'System',
    path: '/system',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
      </svg>
    ),
  },
]

export default function Sidebar() {
  const { user, logout } = useUser()

  return (
    <aside
      className="flex flex-col h-screen flex-shrink-0 sticky top-0 z-10"
      style={{
        width: 252,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(34,211,238,0.12)',
      }}>

      {/* Logo */}
      <div className="px-6 pt-7 pb-6">
        <div className="flex flex-col leading-none">
          <p className="text-[22px] font-black tracking-tight text-white"
            style={{ fontFamily: '"Permanent Marker", "Caveat Brush", cursive', letterSpacing: '0.01em' }}>
            GRAND
          </p>
          <p className="text-[22px] font-black tracking-tight"
            style={{
              fontFamily: '"Permanent Marker", "Caveat Brush", cursive',
              background: 'linear-gradient(100deg,#a855f7 30%,#22d3ee)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '0.01em',
              marginTop: 2,
            }}>
            NOTIFIER
          </p>
        </div>
        <p className="eyebrow mt-3" style={{ color: 'rgba(244,114,182,0.7)' }}>Admin Panel</p>
      </div>

      {/* User card */}
      <div className="px-4">
        <div className="flex items-center gap-3 px-3 py-3 rounded-[10px]"
          style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
          <Avatar url={user?.avatar_url} size={36} />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-[12.5px] font-bold text-white truncate">{user?.username ?? 'Admin'}</p>
            <p className="text-[10px] mono mt-0.5 truncate" style={{ color: 'rgba(156,163,175,0.5)' }}>
              {user?.discord_id ? `${user.discord_id.slice(0, 18)}…` : '—'}
            </p>
          </div>
          <span className="w-1.5 h-1.5 rounded-full pulse"
            style={{ background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pt-5 flex flex-col gap-0.5">
        <p className="eyebrow px-3 mb-2">Navigation</p>
        {ITEMS.map(item => (
          <NavLink key={item.id} to={item.path}
            className="group flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[12.5px] font-semibold transition-all duration-150 relative"
            style={({ isActive }) => ({
              color: isActive ? '#fff' : 'rgba(196,181,253,0.55)',
              background: isActive
                ? 'linear-gradient(90deg, rgba(168,85,247,0.18), rgba(168,85,247,0.04) 80%)'
                : 'transparent',
            })}
            onMouseEnter={e => {
              const active = e.currentTarget.getAttribute('aria-current') === 'page'
              if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.025)'
            }}
            onMouseLeave={e => {
              const active = e.currentTarget.getAttribute('aria-current') === 'page'
              if (!active) e.currentTarget.style.background = 'transparent'
            }}>
            {({ isActive }) => (
              <>
                {isActive && (
                  <span aria-hidden style={{
                    position: 'absolute', left: 0, top: 6, bottom: 6, width: 2,
                    background: 'linear-gradient(180deg, #a855f7, #22d3ee)',
                    borderRadius: 2,
                    boxShadow: '0 0 10px rgba(168,85,247,0.7)',
                  }} />
                )}
                <span style={{ color: isActive ? '#22d3ee' : 'rgba(196,181,253,0.45)' }}>{item.icon}</span>
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom — logout */}
      <div className="p-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[12.5px] font-semibold transition-all duration-150"
          style={{
            background: 'transparent',
            color: 'rgba(248,113,113,0.75)',
            border: '1px solid transparent',
            cursor: 'pointer',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.18)'; e.currentTarget.style.color = '#f87171' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = 'rgba(248,113,113,0.75)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Log out
        </button>
      </div>
    </aside>
  )
}
