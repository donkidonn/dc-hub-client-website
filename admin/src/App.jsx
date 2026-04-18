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
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <div className="text-center">
          <p className="text-2xl font-black text-white mb-1">Grand Notifier</p>
          <p className="text-sm" style={{ color: 'rgba(156,163,175,0.5)' }}>Admin Panel</p>
        </div>
        <a
          href={`${import.meta.env.VITE_API_URL || ''}/auth/discord`}
          className="px-6 py-3 rounded-xl text-sm font-bold text-white transition-all"
          style={{ background: 'linear-gradient(135deg,#5865f2,#4752c4)', boxShadow: '0 4px 20px rgba(88,101,242,0.4)' }}
        >
          Continue with Discord
        </a>
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
