import { useContext, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AnimationContext } from '../context/AnimationContext'
import { useUser } from '../context/UserContext'
import api from '../api'
import DepositModal from './DepositModal'

// Nav icons
const NAV_ICONS = {
  Home: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Statistics: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6"  y1="20" x2="6"  y2="14"/>
    </svg>
  ),
  Slots: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3"  y="3"  width="7" height="7" rx="1.5"/>
      <rect x="14" y="3"  width="7" height="7" rx="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      <rect x="3"  y="14" width="7" height="7" rx="1.5"/>
    </svg>
  ),
  Leaderboards: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h8M12 21v-8"/>
      <path d="M7.5 4H4C4 8 6.5 11 10 12M16.5 4H20C20 8 17.5 11 14 12"/>
      <path d="M7.5 4A4.5 4.5 0 0016.5 4V2h-9v2z"/>
    </svg>
  ),
}

const NAV_ITEMS = ['Home', 'Statistics', 'Slots', 'Leaderboards']

// Sidebar stat rows
const STATS = [
  { key: 'timeRemaining', label: 'Time Left',      color: '#22d3ee' },
  { key: 'totalDeposit',  label: 'Total Deposit',  color: '#34d399' },
  { key: 'totalSteals',   label: 'Total Steals',   color: '#f472b6' },
]


function useCountdown(expiryDate) {
  const [remaining, setRemaining] = useState('')
  useEffect(() => {
    if (!expiryDate) { setRemaining(''); return }
    const tick = () => {
      const diff = new Date(expiryDate) - Date.now()
      if (diff <= 0) { setRemaining('Expired'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      if (h > 0) setRemaining(`${h}h ${String(m).padStart(2, '0')}m`)
      else setRemaining(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiryDate])
  return remaining
}


function Divider({ mx = 16 }) {
  return <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: `0 ${mx}px` }} />
}

function Avatar({ avatarUrl }) {
  return (
    <div className="relative flex-shrink-0">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt="avatar"
          className="w-11 h-11 rounded-full object-cover"
          style={{ border: '2px solid rgba(139,92,246,0.45)' }}
        />
      ) : (
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(109,40,217,0.35), rgba(34,211,238,0.12))',
            border: '2px solid rgba(139,92,246,0.45)',
          }}
        >
          <svg width="20" height="20" fill="rgba(196,181,253,0.65)" viewBox="0 0 24 24">
            <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.315 0-10 1.655-10 5v1a1 1 0 001 1h18a1 1 0 001-1v-1c0-3.345-6.685-5-10-5z"/>
          </svg>
        </div>
      )}
      {/* Online dot */}
      <span
        className="absolute bottom-0 right-0 w-3 h-3 rounded-full"
        style={{ background: '#34d399', border: '2px solid rgba(6,9,20,0.9)' }}
      />
    </div>
  )
}

export default function Sidebar({ activePage, onNavigate }) {
  const { animationsEnabled, toggleAnimations } = useContext(AnimationContext)
  const { user: authUser, refreshUser } = useUser()
  const [showDeposit, setShowDeposit]   = useState(false)
  const [couponCode, setCouponCode]     = useState('')
  const [couponState, setCouponState]   = useState(null) // null | 'loading' | { ok, msg }

  async function handleRedeem() {
    if (!couponCode.trim()) return
    setCouponState('loading')
    try {
      const data = await api.post('/api/balance/redeem', { code: couponCode.trim() })
      setCouponState({ ok: true, msg: `+$${Number(data.amount).toFixed(2)} added!` })
      setCouponCode('')
      refreshUser()
    } catch (err) {
      setCouponState({ ok: false, msg: err.message })
    }
  }

  const { data: mySlot } = useQuery({
    queryKey: ['slots', 'my-slot'],
    queryFn:  () => api.get('/api/slots/my-slot'),
    refetchInterval: 30_000,
    enabled: !!authUser,
  })

  const { data: sidebarStats } = useQuery({
    queryKey: ['steals', 'my-stats'],
    queryFn:  () => api.get('/api/steals/my-stats'),
    refetchInterval: 60_000,
    enabled: !!authUser,
  })

  const { data: deposits = [] } = useQuery({
    queryKey: ['steals', 'deposits'],
    queryFn:  () => api.get('/api/steals/deposits'),
    refetchInterval: 60_000,
    enabled: !!authUser,
  })

  const slotCountdown  = useCountdown(mySlot?.expires_at)
  const totalDepositAmt = deposits
    .filter(d => d.status === 'finished' || d.status === 'confirmed')
    .reduce((sum, d) => sum + Number(d.amount), 0)

  const user = {
    name:          authUser?.username ?? 'Username',
    tag:           authUser?.discord_id ?? '000000000000',
    avatarUrl:     authUser?.avatar_url ?? null,
    balance:       authUser ? `$ ${Number(authUser.balance).toFixed(2)}` : '$ 0.00',
    timeRemaining: slotCountdown || '—',
    totalDeposit:  `$ ${totalDepositAmt.toFixed(2)}`,
    totalSteals:   String(sidebarStats?.totalSteals ?? 0),
  }

  return (
    <div
      className="w-56 h-full flex flex-col flex-shrink-0"
      style={{
        background: 'rgba(5, 8, 18, 0.90)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Branding */}
      <div className="px-5 pt-5 pb-3">
        <p
          style={{
            fontFamily: "'Permanent Marker', cursive",
            fontSize: 24,
            color: '#fff',
            lineHeight: 1.05,
            letterSpacing: '0.01em',
          }}
        >
          GRAND
        </p>

        <p
          style={{
            fontFamily: "'Permanent Marker', cursive",
            fontSize: 24,
            lineHeight: 1.05,
            letterSpacing: '0.01em',
            background: 'linear-gradient(100deg, #7c3aed 0%, #22d3ee 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            display: 'inline-block',
          }}
        >
          NOTIFIER
        </p>

        {/* Brushstroke underline + star */}
        <div className="flex items-center gap-1 mt-0.5">
          <svg viewBox="0 0 148 10" preserveAspectRatio="none" style={{ flex: 1, height: 7 }}>
            <defs>
              <linearGradient id="brushGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.5" />
              </linearGradient>
            </defs>
            <path
              d="M2,6.5 C15,3.5 35,8 60,5.5 C85,3 110,7.5 146,4.5"
              stroke="url(#brushGrad)"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              opacity="0.85"
            />
          </svg>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="1.8" strokeLinecap="round" style={{ flexShrink: 0, opacity: 0.85 }}>
            <line x1="12" y1="2"    x2="12" y2="22" />
            <line x1="2"  y1="12"   x2="22" y2="12" />
            <line x1="5"  y1="5"    x2="19" y2="19" />
            <line x1="19" y1="5"    x2="5"  y2="19" />
          </svg>
        </div>
      </div>

      <Divider />

      {/* User info */}
      <div className="px-4 py-4 flex items-center gap-3">
        <Avatar avatarUrl={user.avatarUrl} />
        <div className="min-w-0">
          <p className="text-sm font-bold text-white truncate leading-tight">{user.name}</p>
          <p className="text-[11px] leading-snug truncate" style={{ color: 'rgba(196,181,253,0.45)' }}>
            ID: {user.tag}
          </p>
        </div>
      </div>

      {/* Balance */}
      <div
        className="balance-hover mx-3 mb-3 px-4 py-3 rounded-2xl flex items-center justify-between"
        style={{
          background: 'linear-gradient(135deg, rgba(76,29,149,0.65) 0%, rgba(109,40,217,0.35) 100%)',
          border: '1px solid rgba(139,92,246,0.3)',
          boxShadow: '0 4px 20px rgba(109,40,217,0.15)',
        }}
      >
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: 'rgba(216,180,254,0.55)' }}>
            Balance
          </p>
          <p className="text-2xl font-black text-white leading-none">{user.balance}</p>
        </div>
        <button
          onClick={() => setShowDeposit(true)}
          title="Add balance"
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>

      {showDeposit && <DepositModal onClose={() => setShowDeposit(false)} />}

      {/* Redeem coupon */}
      <div className="mx-3 mb-3">
        <div className="flex gap-1.5">
          <input
            type="text"
            placeholder="Redeem code..."
            value={couponCode}
            onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponState(null) }}
            onKeyDown={e => e.key === 'Enter' && handleRedeem()}
            maxLength={32}
            className="flex-1 min-w-0 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-white placeholder:text-gray-600 outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.2)' }}
          />
          <button
            onClick={handleRedeem}
            disabled={couponState === 'loading' || !couponCode.trim()}
            className="px-3 py-1.5 rounded-xl text-[11px] font-bold flex-shrink-0 transition-all"
            style={{
              background: 'linear-gradient(135deg,rgba(109,40,217,0.6),rgba(124,58,237,0.4))',
              border: '1px solid rgba(139,92,246,0.35)',
              color: couponCode.trim() ? '#c4b5fd' : 'rgba(196,181,253,0.3)',
              cursor: couponCode.trim() ? 'pointer' : 'default',
            }}
          >
            {couponState === 'loading' ? '...' : 'Apply'}
          </button>
        </div>
        {couponState && couponState !== 'loading' && (
          <p className="text-[10px] font-semibold mt-1 px-1"
            style={{ color: couponState.ok ? '#34d399' : '#f87171' }}>
            {couponState.msg}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="mx-3 flex flex-col gap-1">
        {STATS.map((stat) => (
          <div
            key={stat.key}
            className="stat-hover flex items-center justify-between px-3 py-2 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <span className="text-[10px] font-medium" style={{ color: 'rgba(156,163,175,0.55)' }}>
              {stat.label}
            </span>
            <span className="text-xs font-bold" style={{ color: stat.color }}>
              {user[stat.key]}
            </span>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <nav className="mt-auto mx-3 mb-4 flex flex-col gap-1">
        <Divider mx={0} />
        <div className="h-2" />
        {NAV_ITEMS.map((item) => {
          const active = activePage === item
          return (
            <button
              key={item}
              onClick={() => onNavigate(item)}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 text-left"
              style={
                active
                  ? {
                      background: 'linear-gradient(135deg, rgba(109,40,217,0.45), rgba(124,58,237,0.25))',
                      color: '#fff',
                      border: '1px solid rgba(139,92,246,0.4)',
                      boxShadow: '0 0 16px rgba(109,40,217,0.2)',
                    }
                  : {
                      background: 'transparent',
                      color: 'rgba(156,163,175,0.6)',
                      border: '1px solid transparent',
                    }
              }
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.85)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.color = 'rgba(156,163,175,0.6)'
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              <span className="flex-shrink-0" style={{ opacity: active ? 1 : 0.55 }}>
                {NAV_ICONS[item]}
              </span>
              {item}
            </button>
          )
        })}

        {/* Animation toggle */}
        <div className="mt-1">
          <Divider mx={0} />
          <div className="h-2" />
          <button
            onClick={toggleAnimations}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[12px] font-semibold transition-all duration-200 text-left"
            style={{
              background: animationsEnabled ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${animationsEnabled ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.06)'}`,
              color: animationsEnabled ? 'rgba(196,181,253,0.8)' : 'rgba(156,163,175,0.4)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = animationsEnabled ? 'rgba(139,92,246,0.18)' : 'rgba(255,255,255,0.06)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = animationsEnabled ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.03)' }}
            title={animationsEnabled ? 'Turn off animations' : 'Turn on animations'}
          >
            {/* Lightning bolt icon */}
            <span className="flex-shrink-0">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke={animationsEnabled ? '#a78bfa' : 'rgba(156,163,175,0.35)'}
                strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </span>
            Effects
            <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md"
              style={{
                background: animationsEnabled ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.06)',
                color: animationsEnabled ? '#c4b5fd' : 'rgba(156,163,175,0.35)',
              }}>
              {animationsEnabled ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>
      </nav>
    </div>
  )
}
