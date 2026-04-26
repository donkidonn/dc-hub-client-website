import { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { UserProvider, useUser } from './context/UserContext'
import Sidebar from './components/Sidebar'
import Overview from './components/pages/Overview'
import Users from './components/pages/Users'
import Coupons from './components/pages/Coupons'
import System from './components/pages/System'
import api from './api'

function AuthCallback() {
  const navigate     = useNavigate()
  const { refreshUser } = useUser()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code   = params.get('code')
    if (!code) { navigate('/', { replace: true }); return }
    window.history.replaceState({}, '', '/auth')
    api.post('/auth/discord/admin/exchange', { code })
      .then(({ token }) => { localStorage.setItem('token', token); return refreshUser() })
      .then(() => navigate('/', { replace: true }))
      .catch(e => {
        if (e.message.includes('admin list') || e.message.includes('Access denied')) {
          alert('Access denied — your Discord ID is not in the admin list.')
        }
        navigate('/', { replace: true })
      })
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="eyebrow pulse" style={{ color: 'rgba(34,211,238,0.7)' }}>Authenticating…</p>
    </div>
  )
}

function LoginScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      <div className="relative w-full max-w-[420px] flex flex-col gap-7 px-8 py-10 rounded-[14px]"
        style={{
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(18px)',
          border: '1px solid rgba(34,211,238,0.18)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}>
        {/* top neon edge */}
        <div aria-hidden style={{
          position: 'absolute', top: -1, left: '8%', right: '8%', height: 1,
          background: 'linear-gradient(90deg, transparent, #22d3ee 50%, transparent)',
          boxShadow: '0 0 14px rgba(34,211,238,0.5)',
        }} />

        <div className="flex flex-col items-center gap-2 text-center">
          <p className="eyebrow" style={{ color: 'rgba(244,114,182,0.7)' }}>Restricted Area</p>
          <div className="flex items-baseline gap-2 mt-1"
            style={{ fontFamily: '"Permanent Marker", cursive' }}>
            <span className="text-[28px] font-black text-white tracking-tight">GRAND</span>
            <span className="text-[28px] font-black tracking-tight"
              style={{ background: 'linear-gradient(100deg,#a855f7,#22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              NOTIFIER
            </span>
          </div>
          <p className="eyebrow mt-1">Admin Panel</p>
        </div>

        <div className="px-4 py-3 rounded-[10px] flex items-start gap-2.5"
          style={{
            background: 'rgba(248,113,113,0.04)',
            border: '1px solid rgba(248,113,113,0.18)',
          }}>
          <svg width="14" height="14" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ marginTop: 1, flexShrink: 0 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <p className="text-[11.5px] leading-relaxed" style={{ color: 'rgba(252,165,165,0.78)' }}>
            Authorized Discord accounts only. Unauthorized attempts are logged.
          </p>
        </div>

        <a
          href={`${import.meta.env.VITE_API_URL || ''}/auth/discord/admin`}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-[10px] text-[13px] font-bold text-white transition-all duration-200 uppercase tracking-wider"
          style={{
            background: 'linear-gradient(135deg,#5865f2,#4752c4)',
            boxShadow: '0 4px 24px rgba(88,101,242,0.4)',
            letterSpacing: '0.06em',
          }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 32px rgba(88,101,242,0.6)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 24px rgba(88,101,242,0.4)'}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z"/>
          </svg>
          Continue with Discord
        </a>
      </div>
    </div>
  )
}

function AppInner() {
  const { user, loading, logout } = useUser()
  const hasToken = !!localStorage.getItem('token')

  useEffect(() => {
    if (!user) return
    api.get('/admin/status').catch(e => {
      if (e.message.includes('Forbidden')) {
        alert('Access denied — your Discord ID is not in the admin list.')
        logout()
      }
    })
  }, [user, logout])

  if (hasToken && loading) return null
  if (!user) return <LoginScreen />

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="px-7 py-10 md:px-14 md:py-14 mx-auto w-full" style={{ maxWidth: 1400 }}>
          <Routes>
            <Route path="/overview" element={<Overview />} />
            <Route path="/users"    element={<Users />} />
            <Route path="/coupons"  element={<Coupons />} />
            <Route path="/system"   element={<System />} />
            <Route path="*"         element={<Navigate to="/overview" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <UserProvider>
      <Routes>
        <Route path="/auth" element={<AuthCallback />} />
        <Route path="/*"   element={<AppInner />} />
      </Routes>
    </UserProvider>
  )
}
