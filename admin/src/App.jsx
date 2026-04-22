import { useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { UserProvider, useUser } from './context/UserContext'
import Dashboard from './components/Dashboard'
import api from './api'

function AuthCallback() {
  const navigate     = useNavigate()
  const { refreshUser } = useUser()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code   = params.get('code')
    if (!code) { navigate('/', { replace: true }); return }
    window.history.replaceState({}, '', '/auth')
    api.post('/auth/discord/exchange', { code })
      .then(({ token }) => { localStorage.setItem('token', token); return refreshUser() })
      .then(() => navigate('/', { replace: true }))
      .catch(() => navigate('/', { replace: true }))
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm" style={{ color: 'rgba(196,181,253,0.6)' }}>Authenticating...</p>
    </div>
  )
}

function AppInner() {
  const { user, loading } = useUser()
  const hasToken = !!localStorage.getItem('token')
  if (hasToken && loading) return null

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Background orbs */}
        <div className="absolute rounded-full pointer-events-none" style={{ width: 600, height: 600, top: '-20%', left: '-15%', background: 'rgba(109,40,217,0.07)', filter: 'blur(100px)' }} />
        <div className="absolute rounded-full pointer-events-none" style={{ width: 400, height: 400, bottom: '-15%', right: '-10%', background: 'rgba(34,211,238,0.05)', filter: 'blur(90px)' }} />
        <div className="absolute rounded-full pointer-events-none" style={{ width: 300, height: 300, top: '40%', right: '20%', background: 'rgba(244,114,182,0.04)', filter: 'blur(80px)' }} />

        {/* Login card */}
        <div className="relative flex flex-col items-center gap-8 px-10 py-12 rounded-3xl" style={{
          background: 'rgba(10,14,26,0.85)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(139,92,246,0.2)',
          borderTop: '2px solid rgba(168,85,247,0.5)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.05)',
          minWidth: 340,
        }}>
          {/* Shield icon */}
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(34,211,238,0.08))',
            border: '1px solid rgba(168,85,247,0.3)',
            boxShadow: '0 8px 24px rgba(168,85,247,0.15)',
          }}>
            <svg width="28" height="28" fill="none" stroke="#a855f7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>

          {/* Title */}
          <div className="text-center flex flex-col gap-1">
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-black text-white">GRAND</span>
              <span className="text-2xl font-black" style={{ background: 'linear-gradient(100deg,#a855f7,#22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>NOTIFIER</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="h-px flex-1" style={{ background: 'rgba(139,92,246,0.2)' }} />
              <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(196,181,253,0.4)' }}>Admin Panel</p>
              <div className="h-px flex-1" style={{ background: 'rgba(139,92,246,0.2)' }} />
            </div>
          </div>

          {/* Warning notice */}
          <div className="w-full px-4 py-3 rounded-xl flex items-start gap-2.5" style={{
            background: 'rgba(248,113,113,0.05)',
            border: '1px solid rgba(248,113,113,0.15)',
          }}>
            <svg width="14" height="14" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ marginTop: 1, flexShrink: 0 }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(252,165,165,0.7)' }}>
              Restricted access. Only authorized Discord accounts may proceed.
            </p>
          </div>

          {/* Discord button */}
          <a
            href={`${import.meta.env.VITE_API_URL || ''}/auth/discord`}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg,#5865f2,#4752c4)',
              boxShadow: '0 4px 20px rgba(88,101,242,0.35)',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 28px rgba(88,101,242,0.55)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(88,101,242,0.35)'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z"/>
            </svg>
            Continue with Discord
          </a>
        </div>
      </div>
    )
  }

  return <Dashboard />
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
