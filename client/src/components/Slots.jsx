import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

// Mock chart data per Grand (replace with Supabase later)
function makeChartData(seed) {
  const hours = []
  for (let i = 23; i >= 0; i--) {
    const base = seed * 120
    hours.push({
      time: i === 0 ? 'Now' : `-${i}h`,
      og:     Math.max(0, Math.round(base + Math.sin((i + seed) * 0.7) * base * 0.6 + Math.random() * 40)),
      legend: Math.max(0, Math.round(base * 0.15 + Math.sin((i + seed) * 0.5) * 30 + Math.random() * 15)),
      best:   Math.max(0, Math.round(base * 0.07 + Math.sin((i + seed) * 0.3) * 15 + Math.random() * 8)),
    })
  }
  return hours
}

// Grand data (replace with Supabase later)
const GRANDS = [
  {
    id: 1,
    name: 'Grand 1',
    available: true,
    maxSlots: 5,
    // Each user: Discord id, username, discriminator, avatarUrl
    users: [],
    counters: { og: 0, best: 0, legend: 0, high: 0 },
    chartData: makeChartData(3),
  },
  {
    id: 2,
    name: 'Grand 2',
    available: false,
    maxSlots: 5,
    users: [],
    counters: { og: 0, best: 0, legend: 0, high: 0 },
    chartData: makeChartData(1),
  },
]

// Category counter config
const CATEGORIES = [
  { key: 'og',     label: 'OGs',    color: '#22d3ee' },
  { key: 'best',   label: 'BEST',   color: '#818cf8' },
  { key: 'legend', label: 'LEGEND', color: '#f472b6' },
  { key: 'high',   label: 'HIGH',   color: '#34d399' },
]

function pad(n) {
  return String(n).padStart(2, '0')
}

const PANEL = {
  background: 'rgba(13,18,38,0.75)',
  border: '1px solid rgba(139,92,246,0.18)',
  backdropFilter: 'blur(10px)',
}

// Custom chart tooltip
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs space-y-1"
      style={{ background: 'rgba(10,14,30,0.95)', border: '1px solid rgba(139,92,246,0.3)' }}
    >
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

// Discord avatar — shows real avatar URL or placeholder SVG
function DiscordAvatar({ avatarUrl, size = 26 }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt="avatar"
        className="rounded-full flex-shrink-0 object-cover"
        style={{ width: size, height: size, border: '1px solid rgba(139,92,246,0.4)' }}
      />
    )
  }
  return (
    <div
      className="rounded-full flex-shrink-0 flex items-center justify-center"
      style={{ width: size, height: size, background: 'rgba(26,31,58,0.9)', border: '1px solid rgba(139,92,246,0.35)' }}
    >
      <svg width={size * 0.5} height={size * 0.5} fill="rgba(156,163,175,0.6)" viewBox="0 0 24 24">
        <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.315 0-10 1.655-10 5v1a1 1 0 001 1h18a1 1 0 001-1v-1c0-3.345-6.685-5-10-5z" />
      </svg>
    </div>
  )
}

// Single Grand row
function GrandRow({ grand }) {
  const usedSlots = grand.users.length
  const isLocked  = !grand.available

  return (
    <div className="flex flex-col gap-2">
      {/* Grand title */}
      <h2
        className="text-base font-bold tracking-wide"
        style={{ color: isLocked ? 'rgba(34,211,238,0.35)' : '#22d3ee' }}
      >
        {grand.name}
        {isLocked && (
          <span
            className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(139,92,246,0.15)', color: 'rgba(139,92,246,0.6)', border: '1px solid rgba(139,92,246,0.2)' }}
          >
            Coming Soon
          </span>
        )}
      </h2>

      {/* 3-column layout */}
      <div className="flex flex-col md:flex-row gap-3" style={{ opacity: isLocked ? 0.4 : 1 }}>

        {/* Left: area chart */}
        <div className="flex-1 rounded-2xl overflow-hidden" style={{ ...PANEL, minHeight: 220, height: 240 }}>
          {isLocked ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-xs font-medium" style={{ color: 'rgba(139,92,246,0.35)' }}>
                Coming Soon
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={grand.chartData} margin={{ top: 12, right: 8, bottom: 0, left: -18 }}>
                <defs>
                  <linearGradient id={`gOG${grand.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f472b6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f472b6" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id={`gLegend${grand.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id={`gBest${grand.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.07)" />
                <XAxis
                  dataKey="time"
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 8, fontFamily: 'Montserrat' }}
                  axisLine={{ stroke: 'rgba(139,92,246,0.15)' }}
                  tickLine={false}
                  interval={5}
                />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 8, fontFamily: 'Montserrat' }}
                  axisLine={{ stroke: 'rgba(139,92,246,0.15)' }}
                  tickLine={false}
                  tickFormatter={(v) => v >= 1000 ? `${v / 1000}k` : v}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(139,92,246,0.25)', strokeWidth: 1 }} />
                <Area type="monotone" dataKey="og"     name="OG"        stroke="#f472b6" strokeWidth={2}   fill={`url(#gOG${grand.id})`}     dot={false} activeDot={{ r: 3, fill: '#f472b6', strokeWidth: 0 }} />
                <Area type="monotone" dataKey="legend" name="Legendary"  stroke="#7c3aed" strokeWidth={1.5} fill={`url(#gLegend${grand.id})`} dot={false} activeDot={{ r: 3, fill: '#7c3aed', strokeWidth: 0 }} />
                <Area type="monotone" dataKey="best"   name="Best"       stroke="#f59e0b" strokeWidth={1.5} fill={`url(#gBest${grand.id})`}   dot={false} activeDot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Middle: category counters */}
        <div
          className="rounded-2xl flex flex-col justify-around px-4 py-4"
          style={{ ...PANEL, minWidth: 160 }}
        >
          {CATEGORIES.map(({ key, label, color }) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <span
                className="text-[10px] font-semibold uppercase tracking-widest w-14"
                style={{ color: 'rgba(196,181,253,0.55)' }}
              >
                {label}
              </span>
              <span
                className="text-2xl font-black tabular-nums leading-none"
                style={{ color, letterSpacing: '0.05em' }}
              >
                {pad(grand.counters[key])}
              </span>
            </div>
          ))}
        </div>

        {/* Right: Discord user slots */}
        <div
          className="rounded-2xl flex flex-col px-3 py-3 gap-2"
          style={{ ...PANEL, minWidth: 185 }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider flex-shrink-0" style={{ color: 'rgba(196,181,253,0.5)' }}>
            USERS&nbsp;
            <span style={{ color: usedSlots >= grand.maxSlots ? '#f472b6' : '#22d3ee' }}>
              ({usedSlots}/{grand.maxSlots} slots)
            </span>
          </p>

          {/* Slot rows */}
          {Array.from({ length: grand.maxSlots }).map((_, i) => {
            const user = grand.users[i]
            return (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 flex-shrink-0"
                style={{
                  background: user ? 'rgba(139,92,246,0.1)' : 'rgba(8,12,28,0.6)',
                  border: user
                    ? '1px solid rgba(139,92,246,0.25)'
                    : '1px solid rgba(139,92,246,0.08)',
                  minHeight: 32,
                }}
              >
                {user ? (
                  <>
                    <DiscordAvatar avatarUrl={user.avatarUrl} size={22} />
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-white truncate leading-tight">
                        {user.username}
                      </p>
                      {user.discriminator && user.discriminator !== '0' && (
                        <p className="text-[9px] leading-tight truncate" style={{ color: 'rgba(196,181,253,0.4)' }}>
                          #{user.discriminator}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <span className="text-[10px]" style={{ color: 'rgba(107,114,128,0.4)' }}>
                    Empty slot
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function Slots() {
  return (
    <div className="flex-1 flex flex-col p-3 md:p-4 gap-4 md:gap-6 overflow-y-auto min-w-0">
      {GRANDS.map((grand) => (
        <GrandRow key={grand.id} grand={grand} />
      ))}
    </div>
  )
}
