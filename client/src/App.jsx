import { useContext, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import backgroundImg from './assets/background.png'
import Sidebar from './components/Sidebar'
import LiveSteals from './components/LiveSteals'
import LoginPage from './components/LoginPage'
import MainContent from './components/MainContent'
import Statistics from './components/Statistics'
import Slots from './components/Slots'
import Leaderboard from './components/Leaderboard'
import ParticleCanvas from './components/ParticleCanvas'
import { AnimationProvider, AnimationContext } from './context/AnimationContext'
import { UserProvider, useUser } from './context/UserContext'
import api from './api'

// Map URL paths to page ids used by Sidebar
const PATH_TO_PAGE = {
  '/home':         'Home',
  '/statistics':   'Statistics',
  '/slots':        'Slots',
  '/leaderboards': 'Leaderboards',
}

// Ambient blurred orbs — only rendered when animations are on
function AmbientOrbs() {
  const { animationsEnabled } = useContext(AnimationContext)
  if (!animationsEnabled) return null
  return (
    <>
      <div className="absolute rounded-full pointer-events-none" style={{
        width: 520, height: 520, top: '-12%', left: '-6%',
        background: 'rgba(109,40,217,0.07)',
        filter: 'blur(90px)',
        animation: 'floatSlow 11s ease-in-out infinite',
        zIndex: 0,
      }} />
      <div className="absolute rounded-full pointer-events-none" style={{
        width: 380, height: 380, bottom: '-8%', right: '-4%',
        background: 'rgba(34,211,238,0.06)',
        filter: 'blur(80px)',
        animation: 'float 8s ease-in-out infinite',
        zIndex: 0,
      }} />
      <div className="absolute rounded-full pointer-events-none" style={{
        width: 260, height: 260, top: '45%', left: '42%',
        background: 'rgba(244,114,182,0.05)',
        filter: 'blur(70px)',
        animation: 'floatSlow 13s ease-in-out infinite 3s',
        zIndex: 0,
      }} />
    </>
  )
}

// Compact header shown only on mobile in place of the sidebar
function MobileHeader() {
  const { animationsEnabled, toggleAnimations } = useContext(AnimationContext)
  const { user: authUser } = useUser()
  const user = {
    name:    authUser?.username ?? 'Username',
    tag:     authUser?.discord_id ?? '000000000000',
    balance: authUser ? `$${Number(authUser.balance).toFixed(2)}` : '$0.00',
  }

  return (
    <div
      className="md:hidden flex items-center justify-between px-4 py-2.5 flex-shrink-0"
      style={{
        background: 'rgba(5,8,18,0.92)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Logo */}
      <div className="leading-none">
        <span style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 14, color: '#fff' }}>GRAND </span>
        <span style={{ fontFamily: "'Permanent Marker', cursive", fontSize: 14, background: 'linear-gradient(100deg,#7c3aed,#22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>NOTIFIER</span>
      </div>

      {/* User info */}
      <div className="flex items-center gap-2">
        <div className="relative flex-shrink-0">
          <div className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,rgba(109,40,217,0.35),rgba(34,211,238,0.12))', border: '1.5px solid rgba(139,92,246,0.45)' }}>
            <svg width="13" height="13" fill="rgba(196,181,253,0.65)" viewBox="0 0 24 24">
              <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.315 0-10 1.655-10 5v1a1 1 0 001 1h18a1 1 0 001-1v-1c0-3.345-6.685-5-10-5z"/>
            </svg>
          </div>
          <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full" style={{ background: '#34d399', border: '1.5px solid rgba(6,9,20,0.9)' }} />
        </div>
        <div className="leading-none">
          <p className="text-[11px] font-bold text-white">{user.name}</p>
          <p className="text-[9px]" style={{ color: 'rgba(196,181,253,0.45)' }}>ID: {user.tag}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Balance pill */}
        <div className="px-3 py-1.5 rounded-xl"
          style={{ background: 'linear-gradient(135deg,rgba(76,29,149,0.65),rgba(109,40,217,0.35))', border: '1px solid rgba(139,92,246,0.3)' }}>
          <p className="text-[7px] font-bold uppercase tracking-[0.18em]" style={{ color: 'rgba(216,180,254,0.55)' }}>Balance</p>
          <p className="text-sm font-black text-white leading-none">{user.balance}</p>
        </div>

        {/* Mobile animation toggle */}
        <button
          onClick={toggleAnimations}
          title={animationsEnabled ? 'Turn off animations' : 'Turn on animations'}
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200"
          style={{
            background: animationsEnabled ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${animationsEnabled ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke={animationsEnabled ? '#a78bfa' : 'rgba(156,163,175,0.4)'}
            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

// Mobile bottom nav — only visible on small screens
function MobileNav() {
  const navigate  = useNavigate()
  const location  = useLocation()

  const items = [
    {
      id: 'Home',
      path: '/home',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
    },
    {
      id: 'Statistics',
      path: '/statistics',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6"  y1="20" x2="6"  y2="14"/>
        </svg>
      ),
    },
    {
      id: 'Slots',
      path: '/slots',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3"  y="3"  width="7" height="7" rx="1.5"/>
          <rect x="14" y="3"  width="7" height="7" rx="1.5"/>
          <rect x="14" y="14" width="7" height="7" rx="1.5"/>
          <rect x="3"  y="14" width="7" height="7" rx="1.5"/>
        </svg>
      ),
    },
    {
      id: 'Leaderboards',
      path: '/leaderboards',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 21h8M12 21v-8"/>
          <path d="M7.5 4H4C4 8 6.5 11 10 12M16.5 4H20C20 8 17.5 11 14 12"/>
          <path d="M7.5 4A4.5 4.5 0 0016.5 4V2h-9v2z"/>
        </svg>
      ),
    },
  ]

  return (
    <div
      className="fixed bottom-0 left-0 right-0 md:hidden z-50 flex items-center justify-around px-2 py-1"
      style={{
        background: 'rgba(5,8,18,0.97)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {items.map(({ id, path, icon }) => {
        const active = location.pathname === path
        return (
          <button
            key={id}
            onClick={() => navigate(path)}
            className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-150"
            style={{ color: active ? '#a78bfa' : 'rgba(156,163,175,0.45)' }}
          >
            {icon}
            <span className="text-[9px] font-semibold">{id}</span>
          </button>
        )
      })}
    </div>
  )
}

// Dashboard shell — wraps all protected pages
function Dashboard() {
  const { animationsEnabled } = useContext(AnimationContext)
  const navigate   = useNavigate()
  const location   = useLocation()
  const activePage = PATH_TO_PAGE[location.pathname] ?? 'Home'

  function handleNavigate(page) {
    const path = Object.keys(PATH_TO_PAGE).find(k => PATH_TO_PAGE[k] === page)
    if (path) navigate(path)
  }

  return (
    <div
      data-animations={animationsEnabled ? 'true' : 'false'}
      className="relative flex h-screen w-screen overflow-hidden text-white"
      style={{
        backgroundImage: `url(${backgroundImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0" style={{ background: 'rgba(4, 8, 16, 0.45)', zIndex: 0 }} />

      {/* Particle canvas */}
      <ParticleCanvas />

      {/* Ambient orbs */}
      <AmbientOrbs />

      {/* Main layout */}
      <div className="relative flex w-full h-full" style={{ zIndex: 1 }}>

        {/* Sidebar — hidden on mobile, shown on md+ */}
        <div className="hidden md:block h-full flex-shrink-0">
          <Sidebar activePage={activePage} onNavigate={handleNavigate} />
        </div>

        {/* Page content */}
        <div className="flex-1 flex flex-col min-w-0 pb-14 md:pb-0 overflow-hidden">
          <MobileHeader />
          <Routes>
            <Route path="/home"         element={<MainContent />} />
            <Route path="/statistics"   element={<Statistics />} />
            <Route path="/slots"        element={<Slots />} />
            <Route path="/leaderboards" element={<Leaderboard />} />
            <Route path="*"             element={<Navigate to="/home" replace />} />
          </Routes>
        </div>

        {/* Live steals — only on wide screens */}
        <div className="hidden xl:block h-full flex-shrink-0">
          <LiveSteals />
        </div>

      </div>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  )
}

// Handles the /auth?code=... redirect from Discord OAuth
function AuthCallback() {
  const navigate = useNavigate()
  const { refreshUser } = useUser()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const error = params.get('error')

    if (!code) {
      console.error('Auth failed:', error)
      navigate('/', { replace: true })
      return
    }

    window.history.replaceState({}, '', '/auth')

    api.post('/auth/discord/exchange', { code })
      .then(({ token }) => {
        localStorage.setItem('token', token)
        return refreshUser()
      })
      .then(() => navigate('/home', { replace: true }))
      .catch(err => {
        console.error('Auth exchange failed:', err.message)
        navigate('/', { replace: true })
      })
  }, [])

  return null
}

function AppInner() {
  const { user, loading } = useUser()

  function handleLogin() {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/discord`
  }

  // If no token at all, show login immediately (no flash)
  const hasToken = !!localStorage.getItem('token')

  // Still verifying token with server — show nothing (avoids login flash)
  if (hasToken && loading) return null

  // Token gone or auth failed → show login
  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage onLogin={handleLogin} />} />
      </Routes>
    )
  }

  return <Dashboard />
}

function App() {
  return (
    <AnimationProvider>
      <UserProvider>
        <Routes>
          <Route path="/auth" element={<AuthCallback />} />
          <Route path="/*" element={<AppInner />} />
        </Routes>
      </UserProvider>
    </AnimationProvider>
  )
}

export default App
