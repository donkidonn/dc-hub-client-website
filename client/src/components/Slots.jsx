import { useQuery } from '@tanstack/react-query'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import api from '../api'

const CATEGORIES = [
  { key: 'og',     label: 'OGs',    color: '#22d3ee' },
  { key: 'best',   label: 'BEST',   color: '#818cf8' },
  { key: 'legend', label: 'LEGEND', color: '#f472b6' },
  { key: 'high',   label: 'HIGH',   color: '#34d399' },
]

const PANEL = {
  background: 'rgba(13,18,38,0.75)',
  border: '1px solid rgba(139,92,246,0.18)',
  backdropFilter: 'blur(10px)',
}

function pad(n) { return String(n).padStart(2, '0') }

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 text-xs space-y-1"
      style={{ background: 'rgba(10,14,30,0.95)', border: '1px solid rgba(139,92,246,0.3)' }}>
      <p className="font-semibold text-white mb-1">{label}</p>
      {payload.map((e) => (
        <div key={e.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.color }} />
          <span style={{ color: e.color }}>{e.name}:</span>
          <span className="text-white font-medium">{e.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

function DiscordAvatar({ avatarUrl, size = 26 }) {
  if (avatarUrl) {
    return (
      <img src={avatarUrl} alt="avatar" className="rounded-full flex-shrink-0 object-cover"
        style={{ width: size, height: size, border: '1px solid rgba(139,92,246,0.4)' }} />
    )
  }
  return (
    <div className="rounded-full flex-shrink-0 flex items-center justify-center"
      style={{ width: size, height: size, background: 'rgba(26,31,58,0.9)', border: '1px solid rgba(139,92,246,0.35)' }}>
      <svg width={size * 0.5} height={size * 0.5} fill="rgba(156,163,175,0.6)" viewBox="0 0 24 24">
        <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.315 0-10 1.655-10 5v1a1 1 0 001 1h18a1 1 0 001-1v-1c0-3.345-6.685-5-10-5z" />
      </svg>
    </div>
  )
}

function GrandRow({ grand, slots, chartData, stats }) {
  const now        = Date.now()
  const grandSlots = slots.filter(s => s.grand_id === grand.id)
  // Treat a slot as active only if expires_at is in the future
  const activeGrandSlots = grandSlots.map(s => ({
    ...s,
    users: s.users && s.expires_at && new Date(s.expires_at) > now ? s.users : null,
  }))
  const usedSlots = activeGrandSlots.filter(s => s.users).length
  const isLocked  = !grand.available

  const counters = {
    og:     stats?.og     ?? 0,
    best:   stats?.best   ?? 0,
    legend: stats?.legend ?? 0,
    high:   stats?.high   ?? 0,
  }

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-base font-bold tracking-wide"
        style={{ color: isLocked ? 'rgba(34,211,238,0.35)' : '#22d3ee' }}>
        {grand.name}
        {isLocked && (
          <span className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(139,92,246,0.15)', color: 'rgba(139,92,246,0.6)', border: '1px solid rgba(139,92,246,0.2)' }}>
            Coming Soon
          </span>
        )}
      </h2>

      <div className="flex flex-col md:flex-row gap-3" style={{ opacity: isLocked ? 0.4 : 1 }}>

        {/* Chart */}
        <div className="flex-1 rounded-2xl overflow-hidden" style={{ ...PANEL, minHeight: 220, height: 240 }}>
          {isLocked ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-xs font-medium" style={{ color: 'rgba(139,92,246,0.35)' }}>Coming Soon</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 12, right: 8, bottom: 0, left: -18 }}>
                <defs>
                  <linearGradient id={`gOG${grand.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f472b6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f472b6" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id={`gLegend${grand.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id={`gBest${grand.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.07)" />
                <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 8 }} axisLine={{ stroke: 'rgba(139,92,246,0.15)' }} tickLine={false} interval={5} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 8 }} axisLine={{ stroke: 'rgba(139,92,246,0.15)' }} tickLine={false} tickFormatter={v => v >= 1000 ? `${v/1000}k` : v} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(139,92,246,0.25)', strokeWidth: 1 }} />
                <Area type="monotone" dataKey="og"     name="OG"        stroke="#f472b6" strokeWidth={2}   fill={`url(#gOG${grand.id})`}     dot={false} activeDot={{ r: 3, fill: '#f472b6', strokeWidth: 0 }} />
                <Area type="monotone" dataKey="legend" name="Legendary" stroke="#7c3aed" strokeWidth={1.5} fill={`url(#gLegend${grand.id})`} dot={false} activeDot={{ r: 3, fill: '#7c3aed', strokeWidth: 0 }} />
                <Area type="monotone" dataKey="best"   name="Best"      stroke="#f59e0b" strokeWidth={1.5} fill={`url(#gBest${grand.id})`}   dot={false} activeDot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Counters */}
        <div className="rounded-2xl flex flex-col justify-around px-4 py-4" style={{ ...PANEL, minWidth: 160 }}>
          {CATEGORIES.map(({ key, label, color }) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-semibold uppercase tracking-widest w-14" style={{ color: 'rgba(196,181,253,0.55)' }}>
                {label}
              </span>
              <span className="text-2xl font-black tabular-nums leading-none" style={{ color, letterSpacing: '0.05em' }}>
                {pad(counters[key])}
              </span>
            </div>
          ))}
        </div>

        {/* User slots */}
        <div className="rounded-2xl flex flex-col px-3 py-3 gap-2" style={{ ...PANEL, minWidth: 185 }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider flex-shrink-0" style={{ color: 'rgba(196,181,253,0.5)' }}>
            USERS&nbsp;
            <span style={{ color: usedSlots >= grand.maxSlots ? '#f472b6' : '#22d3ee' }}>
              ({usedSlots}/{grand.maxSlots} slots)
            </span>
          </p>
          {Array.from({ length: grand.maxSlots }).map((_, i) => {
            const slot = activeGrandSlots[i]
            const user = slot?.users
            return (
              <div key={i} className="flex items-center gap-2 rounded-lg px-2 py-1.5 flex-shrink-0"
                style={{
                  background: user ? 'rgba(139,92,246,0.1)' : 'rgba(8,12,28,0.6)',
                  border: user ? '1px solid rgba(139,92,246,0.25)' : '1px solid rgba(139,92,246,0.08)',
                  minHeight: 32,
                }}>
                {user ? (
                  <>
                    <DiscordAvatar avatarUrl={user.avatar_url} size={22} />
                    <p className="text-[11px] font-semibold text-white truncate leading-tight">{user.username}</p>
                  </>
                ) : (
                  <span className="text-[10px]" style={{ color: 'rgba(107,114,128,0.4)' }}>Empty slot</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const GRANDS = [
  { id: 1, name: 'Grand 1', available: true,  maxSlots: 5 },
  { id: 2, name: 'Grand 2', available: false, maxSlots: 5 },
]

export default function Slots() {
  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['slots'],
    queryFn:  () => api.get('/api/slots'),
    refetchInterval: 15_000,
  })

  const { data: chartData = [] } = useQuery({
    queryKey: ['steals', 'global-chart'],
    queryFn:  () => api.get('/api/steals/global-chart'),
    refetchInterval: 60_000,
  })

  const { data: stats } = useQuery({
    queryKey: ['steals', 'global-stats'],
    queryFn:  () => api.get('/api/steals/global-stats'),
    refetchInterval: 60_000,
  })

  if (isLoading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-transparent" style={{ borderTopColor: '#7c3aed', animation: 'spin 1s linear infinite' }} />
    </div>
  )

  return (
    <div className="flex-1 flex flex-col p-3 md:p-4 gap-4 md:gap-6 overflow-y-auto min-w-0">
      {GRANDS.map((grand) => (
        <GrandRow key={grand.id} grand={grand} slots={slots} chartData={chartData} stats={stats} />
      ))}
    </div>
  )
}
