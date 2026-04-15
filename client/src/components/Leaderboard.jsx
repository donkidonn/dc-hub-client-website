import { useState } from 'react'

// Tier color map
const TIER_COLORS = {
  DIAMOND:   '#22d3ee',
  DIVINE:    '#a855f7',
  GOLD:      '#f0b429',
  LEGENDARY: '#f472b6',
  OG:        '#ffffff',
}

// Helper to build topSteals array
const makeTopSteals = (a, b, c) => [
  { rank: 1, name: a[0], count: a[1], tier: a[2] },
  { rank: 2, name: b[0], count: b[1], tier: b[2] },
  { rank: 3, name: c[0], count: c[1], tier: c[2] },
]

// Mock data (replace with Supabase later)
const MOCK_STEALS = [
  { rank: 1, name: 'PlayerOne',   tag: 'user#0001', steals: 15420, deposited: '$245.00', hours: 342,
    topSteals: makeTopSteals(['Meowi','9.3K','DIAMOND'], ['Skibidi Toilet','4.5K','DIVINE'], ['Brainrot','3.2K','GOLD']) },
  { rank: 2, name: 'PlayerTwo',   tag: 'user#0002', steals: 12300, deposited: '$180.00', hours: 280,
    topSteals: makeTopSteals(['Skibidi Toilet','7.1K','LEGENDARY'], ['Meowi','3.8K','DIAMOND'], ['Brainrot','2.1K','GOLD']) },
  { rank: 3, name: 'PlayerThree', tag: 'user#0003', steals:  9800, deposited: '$120.00', hours: 215,
    topSteals: makeTopSteals(['Brainrot','5.2K','GOLD'], ['Meowi','2.9K','DIVINE'], ['Skibidi Toilet','1.7K','DIAMOND']) },
  { rank: 4, name: 'PlayerFour',  tag: 'user#0004', steals:  7200, deposited:  '$95.00', hours: 168,
    topSteals: makeTopSteals(['Meowi','4.1K','DIAMOND'], ['Brainrot','1.8K','GOLD'], ['Skibidi Toilet','1.3K','DIVINE']) },
  { rank: 5, name: 'PlayerFive',  tag: 'user#0005', steals:  5600, deposited:  '$75.00', hours: 132,
    topSteals: makeTopSteals(['Skibidi Toilet','3.2K','DIVINE'], ['Brainrot','1.4K','LEGENDARY'], ['Meowi','1.0K','DIAMOND']) },
  { rank: 6, name: 'PlayerSix',   tag: 'user#0006', steals:  4100, deposited:  '$60.00', hours:  98,
    topSteals: makeTopSteals(['Brainrot','2.4K','GOLD'], ['Skibidi Toilet','1.1K','DIVINE'], ['Meowi','0.6K','DIAMOND']) },
  { rank: 7, name: 'PlayerSeven', tag: 'user#0007', steals:  2900, deposited:  '$45.00', hours:  72,
    topSteals: makeTopSteals(['Meowi','1.6K','DIAMOND'], ['Brainrot','0.8K','GOLD'], ['Skibidi Toilet','0.5K','DIVINE']) },
]

const MOCK_DEPOSITS = [
  { rank: 1, name: 'WhaleOne',   tag: 'user#1001', deposited: '$1,250.00', steals: 8200, hours: 215,
    topSteals: makeTopSteals(['Meowi','5.1K','DIAMOND'], ['Skibidi Toilet','2.2K','LEGENDARY'], ['Brainrot','0.9K','GOLD']) },
  { rank: 2, name: 'WhaleTwo',   tag: 'user#1002', deposited:   '$980.00', steals: 6100, hours: 180,
    topSteals: makeTopSteals(['Brainrot','3.8K','GOLD'], ['Meowi','1.5K','DIVINE'], ['Skibidi Toilet','0.8K','DIAMOND']) },
  { rank: 3, name: 'WhaleThree', tag: 'user#1003', deposited:   '$740.00', steals: 5400, hours: 162,
    topSteals: makeTopSteals(['Skibidi Toilet','3.1K','DIVINE'], ['Brainrot','1.3K','LEGENDARY'], ['Meowi','0.9K','DIAMOND']) },
  { rank: 4, name: 'WhaleFour',  tag: 'user#1004', deposited:   '$520.00', steals: 4300, hours: 130,
    topSteals: makeTopSteals(['Meowi','2.6K','DIAMOND'], ['Brainrot','1.1K','GOLD'], ['Skibidi Toilet','0.6K','DIVINE']) },
  { rank: 5, name: 'WhaleFive',  tag: 'user#1005', deposited:   '$390.00', steals: 3200, hours:  98,
    topSteals: makeTopSteals(['Skibidi Toilet','1.9K','DIVINE'], ['Meowi','0.8K','DIAMOND'], ['Brainrot','0.5K','GOLD']) },
  { rank: 6, name: 'WhaleSix',   tag: 'user#1006', deposited:   '$270.00', steals: 2100, hours:  72,
    topSteals: makeTopSteals(['Brainrot','1.2K','LEGENDARY'], ['Meowi','0.6K','DIAMOND'], ['Skibidi Toilet','0.3K','DIVINE']) },
  { rank: 7, name: 'WhaleSeven', tag: 'user#1007', deposited:   '$150.00', steals: 1100, hours:  45,
    topSteals: makeTopSteals(['Meowi','0.7K','DIAMOND'], ['Skibidi Toilet','0.3K','DIVINE'], ['Brainrot','0.1K','GOLD']) },
]

// Rank configs for top 3
const RANK_CONFIG = {
  1: { border: 'linear-gradient(135deg,#f472b6,#7c3aed)', glow: 'rgba(244,114,182,0.25)', badgeBg: 'rgba(244,114,182,0.2)', badgeColor: '#f9a8d4', avatarBorder: '#f472b6' },
  2: { border: 'linear-gradient(135deg,#22d3ee,#3b82f6)', glow: 'rgba(34,211,238,0.15)',  badgeBg: 'rgba(34,211,238,0.15)',  badgeColor: '#67e8f9',  avatarBorder: '#22d3ee' },
  3: { border: 'linear-gradient(135deg,#7c3aed,#4f46e5)', glow: 'rgba(124,58,237,0.15)',  badgeBg: 'rgba(124,58,237,0.2)',   badgeColor: '#c4b5fd',  avatarBorder: '#7c3aed' },
}

function Avatar({ size = 52, borderColor = '#7c3aed' }) {
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

// Mini top-steals section inside podium cards and rows
// compact=true → pills layout (rows #4-7, horizontal)
// compact=true + stack=true → pills stacked vertically (podium cards)
// compact=false → full accent-border cards (not used on mobile podium)
function MiniTopSteals({ steals, compact = false, stack = false }) {
  return (
    <div className="w-full">
      {/* Divider + label */}
      <div className="flex items-center gap-2 my-2">
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
        <span className="text-[8px] font-bold uppercase tracking-[0.18em]" style={{ color: 'rgba(196,181,253,0.35)' }}>
          Top Steals
        </span>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
      </div>

      {compact ? (
        // Stacked vertically for podium cards, horizontal for rows
        <div className={stack ? 'flex flex-col gap-1' : 'flex gap-2'}>
          {steals.map((s) => {
            const color = TIER_COLORS[s.tier] || '#a78bfa'
            return (
              <div key={s.rank}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg min-w-0"
                style={{
                  background: `${color}0e`,
                  border: `1px solid ${color}25`,
                  flex: stack ? undefined : '1',
                }}>
                <span className="text-[9px] font-black flex-shrink-0" style={{ color }}>#{s.rank}</span>
                <span className="text-[9px] font-semibold text-white truncate flex-1">{s.name}</span>
                <span className="text-[9px] font-black flex-shrink-0" style={{ color }}>{s.count}</span>
              </div>
            )
          })}
        </div>
      ) : (
        // Full accent-border cards for desktop podium
        <div className="flex flex-col gap-1.5 w-full">
          {steals.map((s) => {
            const color = TIER_COLORS[s.tier] || '#a78bfa'
            return (
              <div key={s.rank}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl"
                style={{ background: `${color}0e`, border: `1px solid ${color}20`, borderLeft: `2px solid ${color}` }}>
                <span className="text-[9px] font-black flex-shrink-0 w-4" style={{ color }}>#{s.rank}</span>
                <span className="text-[10px] font-semibold text-white truncate flex-1">{s.name}</span>
                <div className="flex flex-col items-end flex-shrink-0">
                  <span className="text-[11px] font-black leading-none" style={{ color }}>{s.count}</span>
                  <span className="text-[8px] uppercase tracking-wide" style={{ color: `${color}90` }}>{s.tier}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function PodiumCard({ entry, tab }) {
  const cfg    = RANK_CONFIG[entry.rank]
  const isFirst = entry.rank === 1

  const primaryStat    = tab === 'steals'
    ? { label: 'Total Steals',    value: entry.steals?.toLocaleString() }
    : { label: 'Total Deposited', value: entry.deposited }

  const secondaryStats = tab === 'steals'
    ? [{ label: 'Deposited', value: entry.deposited }, { label: 'Hours', value: `${entry.hours}h` }]
    : [{ label: 'Steals', value: entry.steals?.toLocaleString() }, { label: 'Hours', value: `${entry.hours}h` }]

  return (
    <div
      className={`podium-hover relative flex flex-col items-center rounded-xl md:rounded-2xl p-2 md:p-4 flex-1 min-w-0 ${isFirst ? 'self-start' : 'self-center mt-4 md:mt-6'}`}
      style={{
        background: 'rgba(13,18,38,0.80)',
        backdropFilter: 'blur(10px)',
        boxShadow: `0 0 24px ${cfg.glow}, inset 0 0 0 1.5px rgba(255,255,255,0.04)`,
      }}
    >
      {/* Gradient border overlay */}
      <div className="absolute inset-0 rounded-xl md:rounded-2xl pointer-events-none"
        style={{ padding: 1.5, background: cfg.border, WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }} />

      <div className="mb-2"><RankBadge rank={entry.rank} /></div>
      <Avatar size={isFirst ? 44 : 36} borderColor={cfg.avatarBorder} />

      <p className="mt-2 text-[11px] md:text-sm font-bold text-white truncate max-w-full">{entry.name}</p>
      <p className="text-[9px] mb-2" style={{ color: 'rgba(196,181,253,0.5)' }}>{entry.tag}</p>

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

      {entry.topSteals && <MiniTopSteals steals={entry.topSteals} compact={true} stack={true} />}
    </div>
  )
}

// Row entry for ranks #4+
function LeaderboardRow({ entry, tab }) {
  const primaryStat    = tab === 'steals'
    ? { label: 'Steals',    value: entry.steals?.toLocaleString() }
    : { label: 'Deposited', value: entry.deposited }

  const secondaryStats = tab === 'steals'
    ? [{ label: 'Deposited', value: entry.deposited }, { label: 'Hours', value: `${entry.hours}h` }]
    : [{ label: 'Steals', value: entry.steals?.toLocaleString() }, { label: 'Hours', value: `${entry.hours}h` }]

  return (
    <div className="row-hover flex flex-col px-4 py-3 rounded-2xl gap-2"
      style={{ background: 'rgba(13,18,38,0.70)', border: '1px solid rgba(139,92,246,0.15)', backdropFilter: 'blur(8px)' }}>

      {/* Main row */}
      <div className="flex items-center gap-4">
        <RankBadge rank={entry.rank} />
        <Avatar size={36} borderColor="rgba(139,92,246,0.5)" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{entry.name}</p>
          <p className="text-[10px]" style={{ color: 'rgba(196,181,253,0.45)' }}>{entry.tag}</p>
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

      {/* Top 3 steals as compact pills */}
      {entry.topSteals && <MiniTopSteals steals={entry.topSteals} compact={true} />}
    </div>
  )
}

export default function Leaderboard() {
  const [tab, setTab] = useState('steals')
  const data     = tab === 'steals' ? MOCK_STEALS : MOCK_DEPOSITS
  const podium   = data.filter((e) => e.rank <= 3)
  const theRest  = data.filter((e) => e.rank > 3)
  const podiumOrder = [
    podium.find((e) => e.rank === 3),
    podium.find((e) => e.rank === 1),
    podium.find((e) => e.rank === 2),
  ].filter(Boolean)

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

      {/* Podium — always 3 side by side */}
      <div className="flex items-end justify-center gap-2 md:gap-4 flex-shrink-0 px-1 md:px-4">
        {podiumOrder.map((entry) => <PodiumCard key={entry.rank} entry={entry} tab={tab} />)}
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-2 flex-shrink-0">
        {theRest.map((entry) => <LeaderboardRow key={entry.rank} entry={entry} tab={tab} />)}
      </div>

    </div>
  )
}
