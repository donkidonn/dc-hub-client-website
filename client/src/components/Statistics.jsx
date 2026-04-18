import { useQuery } from '@tanstack/react-query'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../api'

const TIER_COLORS = {
  og:        '#f472b6',
  bestTier:  '#22d3ee',
  legendary: '#7c3aed',
  highTier:  '#a78bfa',
}

const TIERS = [
  { id: 'og',        label: 'OG',            color: '#f472b6', statKey: 'og' },
  { id: 'bestTier',  label: 'BEST TIER',     color: '#22d3ee', statKey: 'best' },
  { id: 'legendary', label: 'LEGENDARY',     color: '#7c3aed', statKey: 'legendary' },
  { id: 'highTier',  label: 'HIGH TIER',     color: '#a78bfa', statKey: 'high' },
]

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 text-xs space-y-1"
      style={{ background: 'rgba(10,14,30,0.95)', border: '1px solid rgba(139,92,246,0.3)' }}>
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
    <div className="panel-hover flex flex-col rounded-2xl overflow-hidden flex-1"
      style={{ background: 'rgba(10,14,26,0.82)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.06)', borderTop: `2px solid ${accent}`, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
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
      <div className="w-9 h-9 rounded-full flex items-center justify-center"
        style={{ background: `${accent}12`, border: `1px solid ${accent}30` }}>
        <svg width="15" height="15" fill="none" stroke={accent} strokeWidth="2" strokeOpacity="0.7" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <p className="text-[11px] font-medium" style={{ color: 'rgba(107,114,128,0.55)' }}>{message}</p>
    </div>
  )
}

const TIER_LABEL    = { og: 'OG', beyondbest: 'BEST', big: 'LEGEND', high: 'HIGH' }
const TIER_COLOR_MAP = { og: '#f472b6', beyondbest: '#22d3ee', big: '#7c3aed', high: '#a78bfa' }

function BrainrotRow({ row }) {
  const color = TIER_COLOR_MAP[row.tier] || '#7c3aed'
  const ts    = row.created_at
  const date  = new Date(ts && !ts.endsWith('Z') && !ts.includes('+') ? ts + 'Z' : ts)
  const diff  = Math.floor((Date.now() - date) / 1000)
  const ago   = diff < 60 ? `${diff}s ago` : diff < 3600 ? `${Math.floor(diff/60)}m ago` : `${Math.floor(diff/3600)}h ago`

  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}20`, borderLeft: `2px solid ${color}` }}>
      <div>
        <p className="text-xs font-semibold text-white">{row.name}</p>
        <p className="text-[10px]" style={{ color: 'rgba(156,163,175,0.45)' }}>{ago}{row.raw_value ? ` · ${row.raw_value}` : ''}</p>
      </div>
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
        style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
        {TIER_LABEL[row.tier] ?? row.tier}
      </span>
    </div>
  )
}

export default function Statistics() {
  const { data: stats } = useQuery({
    queryKey: ['brainrots', 'stats'],
    queryFn:  () => api.get('/api/steals/brainrots-stats'),
    refetchInterval: 60_000,
  })

  const { data: chartData = [] } = useQuery({
    queryKey: ['brainrots', 'chart'],
    queryFn:  () => api.get('/api/steals/brainrots-chart'),
    refetchInterval: 60_000,
  })

  const { data: ogHistory = [] } = useQuery({
    queryKey: ['brainrots', 'recent', 'og'],
    queryFn:  () => api.get('/api/steals/brainrots-recent?tier=og'),
    refetchInterval: 30_000,
  })

  const { data: bestHistory = [] } = useQuery({
    queryKey: ['brainrots', 'recent', 'best'],
    queryFn:  () => api.get('/api/steals/brainrots-recent?tier=best'),
    refetchInterval: 30_000,
  })

  const { data: legendaryHistory = [] } = useQuery({
    queryKey: ['brainrots', 'recent', 'legendary'],
    queryFn:  () => api.get('/api/steals/brainrots-recent?tier=legendary'),
    refetchInterval: 30_000,
  })

  const counts = stats ?? {}

  return (
    <div className="flex-1 flex flex-col p-3 md:p-4 gap-3 md:gap-4 overflow-y-auto lg:overflow-hidden min-w-0">

      {/* Chart */}
      <div className="rounded-2xl flex-shrink-0"
        style={{ background: 'rgba(10,14,26,0.82)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.06)', borderTop: '2px solid #f0b429', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
        <div className="px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 className="text-[13px] font-bold tracking-wide text-white">Logs (Last 24h)</h3>
        </div>
        <div className="px-4 pb-4 pt-3" style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="gradOG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f472b6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f472b6" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradLeg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradBest" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.08)" />
              <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 9 }} axisLine={{ stroke: 'rgba(139,92,246,0.2)' }} tickLine={false} interval={3} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 9 }} axisLine={{ stroke: 'rgba(139,92,246,0.2)' }} tickLine={false} tickFormatter={v => v >= 1000 ? `${v/1000}k` : v} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(139,92,246,0.3)', strokeWidth: 1 }} />
              <Area type="monotone" dataKey="og"        name="OG"        stroke="#f472b6" strokeWidth={2}   fill="url(#gradOG)"   dot={false} activeDot={{ r: 3, fill: '#f472b6', strokeWidth: 0 }} />
              <Area type="monotone" dataKey="legendary" name="Legendary" stroke="#7c3aed" strokeWidth={1.5} fill="url(#gradLeg)"  dot={false} activeDot={{ r: 3, fill: '#7c3aed', strokeWidth: 0 }} />
              <Area type="monotone" dataKey="bestTier"  name="Best Tier" stroke="#f59e0b" strokeWidth={1.5} fill="url(#gradBest)" dot={false} activeDot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tier KPI cards */}
      <div className="grid grid-cols-2 lg:flex gap-3 md:gap-4 flex-shrink-0">
        {TIERS.map((tier) => (
          <div key={tier.id} className="card-hover flex-1 rounded-2xl px-5 py-4 flex items-center gap-4"
            style={{ background: 'rgba(10,14,26,0.82)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.06)', borderLeft: `3px solid ${tier.color}`, boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: 'rgba(156,163,175,0.5)' }}>{tier.label}</p>
              <p className="text-3xl font-black leading-none" style={{ color: tier.color }}>
                {counts[tier.statKey] ?? 0}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${tier.color}15`, border: `1px solid ${tier.color}25` }}>
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
          {ogHistory.length === 0
            ? <EmptyState message="No OGs yet" accent="#f472b6" />
            : <div className="flex flex-col gap-2">{ogHistory.map(r => <BrainrotRow key={r.id} row={r} />)}</div>
          }
        </Panel>
        <Panel title="Recent Best" accent="#22d3ee">
          {bestHistory.length === 0
            ? <EmptyState message="No Best yet" accent="#22d3ee" />
            : <div className="flex flex-col gap-2">{bestHistory.map(r => <BrainrotRow key={r.id} row={r} />)}</div>
          }
        </Panel>
        <Panel title="Recent Legendary" accent="#7c3aed">
          {legendaryHistory.length === 0
            ? <EmptyState message="No Legendary yet" accent="#7c3aed" />
            : <div className="flex flex-col gap-2">{legendaryHistory.map(r => <BrainrotRow key={r.id} row={r} />)}</div>
          }
        </Panel>
      </div>

    </div>
  )
}
