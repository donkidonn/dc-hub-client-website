import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../api'

const TIER_COLORS = {
  DIAMOND:   '#22d3ee',
  DIVINE:    '#a855f7',
  GOLD:      '#f0b429',
  LEGENDARY: '#f472b6',
  OG:        '#ffffff',
}

const RANK_CONFIG = {
  1: { border: 'linear-gradient(135deg,#f472b6,#7c3aed)', glow: 'rgba(244,114,182,0.25)', badgeBg: 'rgba(244,114,182,0.2)', badgeColor: '#f9a8d4', avatarBorder: '#f472b6' },
  2: { border: 'linear-gradient(135deg,#22d3ee,#3b82f6)', glow: 'rgba(34,211,238,0.15)',  badgeBg: 'rgba(34,211,238,0.15)',  badgeColor: '#67e8f9',  avatarBorder: '#22d3ee' },
  3: { border: 'linear-gradient(135deg,#7c3aed,#4f46e5)', glow: 'rgba(124,58,237,0.15)',  badgeBg: 'rgba(124,58,237,0.2)',   badgeColor: '#c4b5fd',  avatarBorder: '#7c3aed' },
}

function Avatar({ size = 52, borderColor = '#7c3aed', avatarUrl }) {
  if (avatarUrl) return (
    <img src={avatarUrl} alt="avatar" className="rounded-full object-cover flex-shrink-0"
      style={{ width: size, height: size, border: `2px solid ${borderColor}` }} />
  )
  return (
    <div className="rounded-full flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size, border: `2px solid ${borderColor}`, background: 'rgba(26,31,58,0.9)' }}>
      <svg width={size * 0.45} height={size * 0.45} fill="rgba(156,163,175,0.7)" viewBox="0 0 24 24">
        <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.315 0-10 1.655-10 5v1a1 1 0 001 1h18a1 1 0 001-1v-1c0-3.345-6.685-5-10-5z"/>
      </svg>
    </div>
  )
}

function RankBadge({ rank }) {
  const cfg = RANK_CONFIG[rank] || { badgeBg: 'rgba(30,35,60,0.8)', badgeColor: 'rgba(156,163,175,0.7)' }
  return (
    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
      style={{ background: cfg.badgeBg, color: cfg.badgeColor, border: `1px solid ${cfg.badgeColor}40` }}>
      #{rank}
    </span>
  )
}

function MiniTopSteals({ steals, stack = false }) {
  if (!steals?.length) return null
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 my-2">
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
        <span className="text-[8px] font-bold uppercase tracking-[0.18em]" style={{ color: 'rgba(196,181,253,0.35)' }}>Top Steals</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
      </div>
      <div className={stack ? 'flex flex-col gap-1' : 'flex gap-2'}>
        {steals.map((s) => {
          const color = TIER_COLORS[s.tier?.toUpperCase()] || '#a78bfa'
          return (
            <div key={s.rank} className="flex items-center gap-1.5 px-2 py-1 rounded-lg min-w-0"
              style={{ background: `${color}0e`, border: `1px solid ${color}25`, flex: stack ? undefined : '1' }}>
              <span className="text-[9px] font-black flex-shrink-0" style={{ color }}>#{s.rank}</span>
              <span className="text-[9px] font-semibold text-white truncate flex-1">{s.name}</span>
              <span className="text-[9px] font-black flex-shrink-0" style={{ color }}>{s.count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PodiumCard({ entry, tab }) {
  const cfg = RANK_CONFIG[entry.rank]
  const isFirst = entry.rank === 1
  const hoursLabel = `${entry.total_hours ?? 0}h`
  const primaryStat    = tab === 'steals'   ? { label: 'Total Steals', value: entry.steals?.toLocaleString() } : { label: 'Total Deposited', value: entry.deposited }
  const secondaryStats = tab === 'steals'   ? [{ label: 'Deposited', value: entry.deposited }, { label: 'Total Hours', value: hoursLabel }]
                                            : [{ label: 'Steals', value: entry.steals?.toLocaleString() }, { label: 'Total Hours', value: hoursLabel }]
  return (
    <div className={`podium-hover relative flex flex-col items-center rounded-xl md:rounded-2xl p-2 md:p-4 flex-1 min-w-0 ${isFirst ? 'self-start' : 'self-center mt-4 md:mt-6'}`}
      style={{ background: 'rgba(13,18,38,0.80)', backdropFilter: 'blur(10px)', boxShadow: `0 0 24px ${cfg.glow}, inset 0 0 0 1.5px rgba(255,255,255,0.04)` }}>
      <div className="absolute inset-0 rounded-xl md:rounded-2xl pointer-events-none"
        style={{ padding: 1.5, background: cfg.border, WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }} />
      <div className="mb-2"><RankBadge rank={entry.rank} /></div>
      <Avatar size={isFirst ? 44 : 36} borderColor={cfg.avatarBorder} avatarUrl={entry.avatar_url} />
      <p className="mt-2 text-[11px] md:text-sm font-bold text-white truncate max-w-full">{entry.name}</p>
      <p className="text-[9px] mb-2" style={{ color: 'rgba(196,181,253,0.5)' }}>{entry.total_hours ?? 0}h rented</p>
      <p className="text-sm md:text-lg font-bold" style={{ color: cfg.badgeColor }}>{primaryStat.value}</p>
      <p className="text-[8px] md:text-[10px] mb-1" style={{ color: 'rgba(156,163,175,0.5)' }}>{primaryStat.label}</p>
      <div className="flex gap-2 md:gap-4 w-full justify-center mb-1">
        {secondaryStats.map((s) => (
          <div key={s.label} className="flex flex-col items-center">
            <p className="text-[10px] md:text-xs font-semibold text-white">{s.value}</p>
            <p className="text-[8px]" style={{ color: 'rgba(156,163,175,0.5)' }}>{s.label}</p>
          </div>
        ))}
      </div>
      {entry.topSteals?.length > 0 && <MiniTopSteals steals={entry.topSteals} stack />}
    </div>
  )
}

function LeaderboardRow({ entry, tab }) {
  const hoursLabel     = `${entry.total_hours ?? 0}h`
  const primaryStat    = tab === 'steals' ? { label: 'Steals',    value: entry.steals?.toLocaleString() } : { label: 'Deposited', value: entry.deposited }
  const secondaryStats = tab === 'steals'
    ? [{ label: 'Deposited', value: entry.deposited }, { label: 'Hours', value: hoursLabel }]
    : [{ label: 'Steals', value: entry.steals?.toLocaleString() }, { label: 'Hours', value: hoursLabel }]
  return (
    <div className="row-hover flex flex-col px-4 py-3 rounded-2xl gap-2"
      style={{ background: 'rgba(13,18,38,0.70)', border: '1px solid rgba(139,92,246,0.15)', backdropFilter: 'blur(8px)' }}>
      <div className="flex items-center gap-4">
        <RankBadge rank={entry.rank} />
        <Avatar size={36} borderColor="rgba(139,92,246,0.5)" avatarUrl={entry.avatar_url} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{entry.name}</p>
          <p className="text-[10px]" style={{ color: 'rgba(196,181,253,0.45)' }}>{entry.total_hours ?? 0}h rented</p>
        </div>
        <div className="flex gap-6 flex-shrink-0">
          <div className="text-right">
            <p className="text-sm font-bold text-white">{primaryStat.value}</p>
            <p className="text-[10px]" style={{ color: 'rgba(156,163,175,0.5)' }}>{primaryStat.label}</p>
          </div>
          {secondaryStats.map((s) => (
            <div key={s.label} className="text-right">
              <p className="text-sm font-semibold" style={{ color: 'rgba(196,181,253,0.8)' }}>{s.value}</p>
              <p className="text-[10px]" style={{ color: 'rgba(156,163,175,0.5)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
      {entry.topSteals?.length > 0 && <MiniTopSteals steals={entry.topSteals} />}
    </div>
  )
}

export default function Leaderboard() {
  const [tab, setTab] = useState('steals')

  const { data = [], isLoading } = useQuery({
    queryKey: ['leaderboard', tab],
    queryFn:  () => api.get(`/api/leaderboard?type=${tab}`),
    refetchInterval: 60_000,
  })

  const podium      = data.filter(e => e.rank <= 3)
  const theRest     = data.filter(e => e.rank > 3)
  const podiumOrder = [podium.find(e => e.rank === 3), podium.find(e => e.rank === 1), podium.find(e => e.rank === 2)].filter(Boolean)

  return (
    <div className="flex-1 flex flex-col p-4 gap-5 overflow-y-auto min-w-0">

      {/* Tab switcher */}
      <div className="flex items-center justify-center gap-3 flex-shrink-0">
        {[
          { id: 'deposits', label: 'Top Deposits', activeColor: '#f472b6' },
          { id: 'steals',   label: 'Top Steals',   activeColor: '#22d3ee' },
        ].map(({ id, label, activeColor }) => (
          <button key={id} onClick={() => setTab(id)}
            className="px-5 py-2 rounded-full text-sm font-bold transition-all duration-200 hover:scale-105 active:scale-95"
            style={tab === id
              ? { background: `${activeColor}18`, color: activeColor, border: `1.5px solid ${activeColor}` }
              : { background: 'transparent', color: `${activeColor}70`, border: `1.5px solid ${activeColor}35`, cursor: 'pointer' }
            }>
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-transparent" style={{ borderTopColor: '#7c3aed', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : data.length === 0 ? (
        <div className="flex justify-center py-20">
          <p className="text-sm" style={{ color: 'rgba(156,163,175,0.4)' }}>No data yet</p>
        </div>
      ) : (
        <>
          <div className="flex items-end justify-center gap-2 md:gap-4 flex-shrink-0 px-1 md:px-4">
            {podiumOrder.map(entry => <PodiumCard key={entry.rank} entry={entry} tab={tab} />)}
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            {theRest.map(entry => <LeaderboardRow key={entry.rank} entry={entry} tab={tab} />)}
          </div>
        </>
      )}
    </div>
  )
}
