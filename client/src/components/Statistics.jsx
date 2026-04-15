import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

// Mock chart data (replace with Supabase later)
const CHART_DATA = [
  { time: '-23h', og: 2500, legendary: 210, bestTier: 80 },
  { time: '-22h', og: 2650, legendary: 195, bestTier: 75 },
  { time: '-21h', og: 2400, legendary: 220, bestTier: 90 },
  { time: '-20h', og: 2700, legendary: 250, bestTier: 85 },
  { time: '-19h', og: 2900, legendary: 230, bestTier: 95 },
  { time: '-18h', og: 3200, legendary: 260, bestTier: 100 },
  { time: '-17h', og: 4100, legendary: 300, bestTier: 110 },
  { time: '-16h', og: 5800, legendary: 380, bestTier: 130 },
  { time: '-15h', og: 7900, legendary: 450, bestTier: 150 },
  { time: '-14h', og: 7200, legendary: 420, bestTier: 145 },
  { time: '-13h', og: 5500, legendary: 350, bestTier: 125 },
  { time: '-12h', og: 5900, legendary: 370, bestTier: 135 },
  { time: '-11h', og: 5600, legendary: 360, bestTier: 130 },
  { time: '-10h', og: 4800, legendary: 320, bestTier: 115 },
  { time: '-9h',  og: 4200, legendary: 290, bestTier: 105 },
  { time: '-8h',  og: 3800, legendary: 270, bestTier: 100 },
  { time: '-7h',  og: 3500, legendary: 255, bestTier: 95  },
  { time: '-6h',  og: 3100, legendary: 240, bestTier: 90  },
  { time: '-5h',  og: 2800, legendary: 225, bestTier: 85  },
  { time: '-4h',  og: 2600, legendary: 215, bestTier: 82  },
  { time: '-3h',  og: 2400, legendary: 205, bestTier: 78  },
  { time: '-2h',  og: 2200, legendary: 198, bestTier: 75  },
  { time: '-1h',  og: 2100, legendary: 190, bestTier: 72  },
  { time: 'Now',  og: 2300, legendary: 200, bestTier: 78  },
]

// Tier definitions
const TIERS = [
  { id: 'og',        label: 'OG',              color: '#ffffff'  },
  { id: 'bestTier',  label: 'BEST TIER',        color: '#22d3ee'  },
  { id: 'legendary', label: 'LEGENDARY TIER',   color: '#f472b6'  },
  { id: 'highTier',  label: 'HIGH TIER',        color: '#a78bfa'  },
]

// Custom tooltip for the chart
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs space-y-1"
      style={{ background: 'rgba(10,14,30,0.95)', border: '1px solid rgba(139,92,246,0.3)' }}
    >
      <p className="font-semibold text-white mb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span style={{ color: entry.color }}>{entry.name}:</span>
          <span className="text-white font-medium">{entry.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

function Panel({ title, accent = '#7c3aed', children }) {
  return (
    <div
      className="panel-hover flex flex-col rounded-2xl overflow-hidden flex-1"
      style={{
        background: 'rgba(10,14,26,0.82)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderTop: `2px solid ${accent}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}
    >
      <div className="px-5 py-3.5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <h3 className="text-[13px] font-bold tracking-wide text-white">{title}</h3>
      </div>
      <div className="flex-auto overflow-y-auto p-4">{children}</div>
    </div>
  )
}

function EmptyState({ message, accent = '#7c3aed' }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 py-6">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center"
        style={{ background: `${accent}12`, border: `1px solid ${accent}30` }}
      >
        <svg width="15" height="15" fill="none" stroke={accent} strokeWidth="2" strokeOpacity="0.7" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <p className="text-[11px] font-medium" style={{ color: 'rgba(107,114,128,0.55)' }}>{message}</p>
    </div>
  )
}

export default function Statistics() {
  return (
    <div className="flex-1 flex flex-col p-3 md:p-4 gap-3 md:gap-4 overflow-y-auto lg:overflow-hidden min-w-0">

      {/* Logs panel with area chart */}
      <div
        className="rounded-2xl flex-shrink-0"
        style={{
          background: 'rgba(10,14,26,0.82)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderTop: '2px solid #f0b429',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}
      >
        <div className="px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 className="text-[13px] font-bold tracking-wide text-white">Logs</h3>
        </div>
        <div className="px-4 pb-4 pt-3" style={{ height: '180px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={CHART_DATA} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="gradOG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f472b6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f472b6" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradLegendary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradBestTier" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.08)" />

              <XAxis
                dataKey="time"
                tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 9, fontFamily: 'Montserrat' }}
                axisLine={{ stroke: 'rgba(139,92,246,0.2)' }}
                tickLine={false}
                interval={3}
              />
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 9, fontFamily: 'Montserrat' }}
                axisLine={{ stroke: 'rgba(139,92,246,0.2)' }}
                tickLine={false}
                tickFormatter={(v) => v >= 1000 ? `${v / 1000}k` : v}
              />

              <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(139,92,246,0.3)', strokeWidth: 1 }} />

              <Area type="monotone" dataKey="og"        name="OG"         stroke="#f472b6" strokeWidth={2}   fill="url(#gradOG)"         dot={false} activeDot={{ r: 3, fill: '#f472b6', strokeWidth: 0 }} />
              <Area type="monotone" dataKey="legendary" name="Legendary"  stroke="#7c3aed" strokeWidth={1.5} fill="url(#gradLegendary)"  dot={false} activeDot={{ r: 3, fill: '#7c3aed', strokeWidth: 0 }} />
              <Area type="monotone" dataKey="bestTier"  name="Best Tier"  stroke="#f59e0b" strokeWidth={1.5} fill="url(#gradBestTier)"   dot={false} activeDot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tier KPI cards */}
      <div className="grid grid-cols-2 lg:flex gap-3 md:gap-4 flex-shrink-0">
        {TIERS.map((tier) => (
          <div
            key={tier.id}
            className="card-hover flex-1 rounded-2xl px-5 py-4 flex items-center gap-4"
            style={{
              background: 'rgba(10,14,26,0.82)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderLeft: `3px solid ${tier.color}`,
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: 'rgba(156,163,175,0.5)' }}>
                {tier.label}
              </p>
              <p className="text-3xl font-black leading-none" style={{ color: tier.color }}>
                0
              </p>
            </div>
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${tier.color}15`, border: `1px solid ${tier.color}25` }}
            >
              <svg width="18" height="18" fill="none" stroke={tier.color} strokeWidth="2" strokeOpacity="0.8" viewBox="0 0 24 24">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                <polyline points="17 6 23 6 23 12"/>
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Recent panels */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 lg:flex-1 lg:min-h-0">
        <Panel title="Recent OGs" accent="#f472b6">
          <EmptyState message="No recent OGs" accent="#f472b6" />
        </Panel>
        <Panel title="Recent Best Tier" accent="#818cf8">
          <EmptyState message="No recent Best Tier" accent="#818cf8" />
        </Panel>
        <Panel title="Recent Legendary Tier" accent="#a855f7">
          <EmptyState message="No recent Legendary Tier" accent="#a855f7" />
        </Panel>
      </div>

    </div>
  )
}
