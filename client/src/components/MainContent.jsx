import { useState } from 'react'

const LOADER_SCRIPT = `loadstring(game:HttpGet("https://raw.githubusercontent.com/your-repo/loader.lua"))()`

// Top 3 brainrots this user has stolen the most
// image: URL from your DB/webhook; null shows placeholder
const TOP_BRAINROTS = [
  { rank: 1, name: 'Brainrot 1', count: '0', tier: 'DIAMOND', tierColor: '#22d3ee', timeAgo: '—' },
  { rank: 2, name: 'Brainrot 2', count: '0', tier: 'DIVINE',  tierColor: '#a855f7', timeAgo: '—' },
  { rank: 3, name: 'Brainrot 3', count: '0', tier: 'GOLD',    tierColor: '#f0b429', timeAgo: '—' },
]

const DIVISIONS = ['All', 'Grand 1', 'Grand 2']
const DIV_COLORS = { All: '#f472b6', 'Grand 1': '#22d3ee', 'Grand 2': '#a855f7' }

// Brainrot image placeholder
function BrainrotIcon() {
  return (
    <svg width="22" height="22" fill="none" stroke="rgba(196,181,253,0.4)" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M12 2a7 7 0 017 7c0 2.5-1.3 4.7-3.3 6l-.7.4V17a2 2 0 01-2 2h-2a2 2 0 01-2-2v-1.6l-.7-.4A7 7 0 015 9a7 7 0 017-7z"/>
      <line x1="10" y1="21" x2="14" y2="21"/>
    </svg>
  )
}

// Single brainrot card
function BrainrotCard({ b }) {
  return (
    <div
      className="card-hover flex-1 flex flex-col items-center rounded-xl p-2 gap-1"
      style={{ background: 'rgba(8,11,22,0.75)', border: `1px solid ${b.tierColor}22`, minWidth: 0 }}
    >
      <span
        className="text-[9px] font-black px-2 py-0.5 rounded-full"
        style={{ background: `${b.tierColor}18`, color: b.tierColor, border: `1px solid ${b.tierColor}40` }}
      >
        #{b.rank}
      </span>
      <div
        className="w-11 h-11 rounded-lg flex items-center justify-center"
        style={{ background: 'rgba(26,31,58,0.8)', border: `1px solid ${b.tierColor}30` }}
      >
        {b.image
          ? <img src={b.image} alt={b.name} className="w-full h-full rounded-lg object-cover" />
          : <BrainrotIcon />
        }
      </div>
      <p className="text-[10px] font-bold text-white text-center truncate w-full leading-tight px-1">{b.name}</p>
      <p className="text-[15px] font-black leading-none" style={{ color: b.tierColor }}>{b.count}</p>
      <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: b.tierColor }}>{b.tier}</p>
      <p className="text-[9px]" style={{ color: 'rgba(156,163,175,0.4)' }}>{b.timeAgo}</p>
    </div>
  )
}

// Top steals panel content
function TopStealsContent() {
  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <span className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: 'rgba(196,181,253,0.35)' }}>
          Top Steals
        </span>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>
      <div className="flex gap-2 flex-1 min-h-0">
        {TOP_BRAINROTS.map((b) => <BrainrotCard key={b.rank} b={b} />)}
      </div>
    </div>
  )
}

// Acquire Slot panel
function AcquireSlot() {
  const [division, setDivision] = useState('All')
  const [hours, setHours] = useState(1)

  // Mock state — replace with Supabase data later
  const slotsAvailable = false
  const nextSlotIn = '1h 24m 41s'
  const pricePerHour = 2
  const total = hours * pricePerHour

  const UTIL_BUTTONS = [
    { label: 'Deposit',      path: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { label: 'Reset HWID',   path: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
    { label: 'Transfer Key', path: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
    { label: 'Manual',       path: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  ]

  return (
    <div
      className="panel-hover flex flex-col rounded-2xl overflow-hidden flex-shrink-0"
      style={{
        background: 'rgba(10,14,26,0.82)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderTop: '2px solid #a855f7',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-2">
          {/* Slot icon */}
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.25), rgba(34,211,238,0.1))', border: '1px solid rgba(168,85,247,0.35)' }}>
            <svg width="13" height="13" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7" rx="1.5"/>
              <rect x="14" y="3" width="7" height="7" rx="1.5"/>
              <rect x="14" y="14" width="7" height="7" rx="1.5"/>
              <rect x="3" y="14" width="7" height="7" rx="1.5"/>
            </svg>
          </div>
          <h3 className="text-[13px] font-bold tracking-wide text-white">Acquire Slot</h3>
        </div>

        {/* Plan status pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style={{ background: '#f87171' }} />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: '#f87171' }} />
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'rgba(248,113,113,0.8)' }}>
            No Plan
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pt-3 pb-4 flex flex-col gap-3">

        {/* Division selector */}
        <div>
          <p className="text-[8px] font-bold uppercase tracking-[0.18em] mb-1.5" style={{ color: 'rgba(156,163,175,0.45)' }}>
            Grand
          </p>
          <div className="flex gap-1.5">
            {DIVISIONS.map((div) => {
              const color = DIV_COLORS[div]
              const active = division === div
              return (
                <button
                  key={div}
                  onClick={() => setDivision(div)}
                  className="flex-1 py-2 rounded-xl text-[11px] font-bold transition-all duration-150"
                  style={active
                    ? { background: `${color}18`, color, border: `1px solid ${color}50`, boxShadow: `0 0 10px ${color}20`, cursor: 'pointer' }
                    : { background: 'rgba(255,255,255,0.02)', color: 'rgba(156,163,175,0.4)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }
                  }
                >
                  {div}
                </button>
              )
            })}
          </div>
        </div>

        {/* Duration stepper */}
        <div>
          <p className="text-[8px] font-bold uppercase tracking-[0.18em] mb-1.5" style={{ color: 'rgba(156,163,175,0.45)' }}>
            Duration (Hours)
          </p>
          <div className="flex items-center rounded-xl overflow-hidden"
            style={{ background: 'rgba(8,11,22,0.8)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <button
              onClick={() => setHours(Math.max(1, hours - 1))}
              className="px-3 py-2 text-lg font-black transition-colors duration-150 flex-shrink-0"
              style={{ color: 'rgba(196,181,253,0.6)', cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#a855f7'; e.currentTarget.style.background = 'rgba(168,85,247,0.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(196,181,253,0.6)'; e.currentTarget.style.background = 'transparent' }}
            >−</button>
            <div className="flex-1 text-center">
              <span className="text-sm font-black text-white">{hours}</span>
              <span className="text-[10px] ml-1" style={{ color: 'rgba(156,163,175,0.4)' }}>hr{hours !== 1 ? 's' : ''}</span>
            </div>
            <button
              onClick={() => setHours(hours + 1)}
              className="px-3 py-2 text-lg font-black transition-colors duration-150 flex-shrink-0"
              style={{ color: 'rgba(196,181,253,0.6)', cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#a855f7'; e.currentTarget.style.background = 'rgba(168,85,247,0.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(196,181,253,0.6)'; e.currentTarget.style.background = 'transparent' }}
            >+</button>
          </div>
        </div>

        {/* Availability bar */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl"
          style={{
            background: slotsAvailable ? 'rgba(52,211,153,0.06)' : 'rgba(244,114,182,0.06)',
            border: `1px solid ${slotsAvailable ? 'rgba(52,211,153,0.2)' : 'rgba(244,114,182,0.2)'}`,
          }}>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: slotsAvailable ? '#34d399' : '#f472b6', boxShadow: `0 0 5px ${slotsAvailable ? '#34d399' : '#f472b6'}` }} />
            <span className="text-[11px] font-bold" style={{ color: slotsAvailable ? '#34d399' : '#f472b6' }}>
              {slotsAvailable ? 'Slots Available' : 'Fully Booked'}
            </span>
          </div>
          {!slotsAvailable && (
            <span className="text-[9px] font-semibold" style={{ color: 'rgba(156,163,175,0.4)' }}>
              Opens in {nextSlotIn}
            </span>
          )}
        </div>

        {/* Price row */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[8px] font-bold uppercase tracking-[0.18em]" style={{ color: 'rgba(156,163,175,0.4)' }}>Total</p>
            <p className="text-2xl font-black leading-none"
              style={{ background: 'linear-gradient(100deg, #a855f7, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              ${total.toFixed(2)}
            </p>
          </div>
          <p className="text-[9px] mb-1" style={{ color: 'rgba(156,163,175,0.35)' }}>${pricePerHour}/hr</p>
        </div>

        {/* Main CTA button */}
        <button
          disabled={!slotsAvailable}
          className="w-full py-2.5 rounded-xl text-sm font-black tracking-wide transition-all duration-200"
          style={slotsAvailable
            ? { background: 'linear-gradient(135deg, #7c3aed, #22d3ee)', color: '#fff', cursor: 'pointer', boxShadow: '0 4px 20px rgba(124,58,237,0.35)' }
            : { background: 'rgba(139,92,246,0.08)', color: 'rgba(139,92,246,0.35)', border: '1px solid rgba(139,92,246,0.15)', cursor: 'not-allowed' }
          }
        >
          {slotsAvailable ? '⚡ Lock In Slot' : 'Unavailable'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <span className="text-[8px] font-bold uppercase tracking-[0.15em]" style={{ color: 'rgba(156,163,175,0.25)' }}>Quick Actions</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
        </div>

        {/* Utility buttons */}
        <div className="grid grid-cols-2 gap-1.5">
          {UTIL_BUTTONS.map(({ label, path }) => (
            <button
              key={label}
              className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-semibold transition-all duration-150"
              style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(196,181,253,0.55)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(139,92,246,0.1)'; e.currentTarget.style.color = '#c4b5fd'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'rgba(196,181,253,0.55)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
            >
              <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d={path} />
              </svg>
              {label}
            </button>
          ))}
        </div>

      </div>
    </div>
  )
}

// Shared panel
function Panel({ title, accent = '#7c3aed', action, children, className = '' }) {
  return (
    <div
      className={`panel-hover flex flex-col rounded-2xl overflow-hidden ${className}`}
      style={{
        background: 'rgba(10, 14, 26, 0.82)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderTop: `2px solid ${accent}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}
    >
      <div
        className="px-5 py-3.5 flex items-center justify-between flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <h3 className="text-[13px] font-bold tracking-wide text-white">{title}</h3>
        {action}
      </div>
      <div className="flex-auto overflow-y-auto p-4">{children}</div>
    </div>
  )
}

// Empty state
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
      <p className="text-[11px] font-medium text-center" style={{ color: 'rgba(107,114,128,0.55)' }}>
        {message}
      </p>
    </div>
  )
}

// Copy button icons
function CopyIcon() {
  return (
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="9" y="9" width="13" height="13" rx="2"/>
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

export default function MainContent() {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(LOADER_SCRIPT)
    } catch {
      const el = document.createElement('textarea')
      el.value = LOADER_SCRIPT
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyBtn = (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all duration-150"
      style={
        copied
          ? { background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }
          : { background: 'rgba(34,211,238,0.1)', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.25)', cursor: 'pointer' }
      }
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )

  return (
    <div className="flex-1 flex flex-col p-3 md:p-4 gap-3 md:gap-4 overflow-y-auto lg:overflow-hidden min-w-0">

      {/* Script panel — written inline (block layout) to avoid flex height collapse on mobile */}
      <div
        className="panel-hover rounded-2xl flex-shrink-0"
        style={{
          background: 'rgba(10,14,26,0.82)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderTop: '2px solid #22d3ee',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}
      >
        <div
          className="px-5 py-3.5 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <h3 className="text-[13px] font-bold tracking-wide text-white">Script</h3>
          {copyBtn}
        </div>
        <div className="p-4">
          <div
            className="rounded-xl px-5 py-4 font-mono text-[12px] leading-relaxed cursor-text select-all flex items-center"
            style={{
              background: 'rgba(3,5,14,0.85)',
              border: '1px solid rgba(34,211,238,0.08)',
              color: 'rgba(167,139,250,0.9)',
              letterSpacing: '0.01em',
              wordBreak: 'break-all',
            }}
          >
            {LOADER_SCRIPT}
          </div>
        </div>
      </div>

      {/* Data panels */}
      <div className="flex flex-col lg:flex-row gap-3 md:gap-4 lg:flex-1 lg:min-h-0">

        {/* Left column */}
        <div className="flex flex-col gap-3 md:gap-4 lg:flex-1 lg:min-h-0">
          <Panel title="Top 5 Steals" accent="#f472b6" className="lg:flex-1">
            <TopStealsContent />
          </Panel>
          <Panel title="Steal History" accent="#7c3aed" className="lg:flex-1">
            <EmptyState message="No history yet" accent="#7c3aed" />
          </Panel>
        </div>

        {/* Right column — Acquire Slot + Top Up History */}
        <div className="flex flex-col gap-3 md:gap-4 lg:flex-1 lg:min-h-0 lg:overflow-y-auto">
          <AcquireSlot />
          <Panel title="Top Up History" accent="#34d399" className="flex-shrink-0">
            <EmptyState message="No top ups yet" accent="#34d399" />
          </Panel>
        </div>

      </div>

    </div>
  )
}
