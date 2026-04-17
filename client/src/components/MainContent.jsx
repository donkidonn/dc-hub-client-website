import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../api'
import { useUser } from '../context/UserContext'
import DepositModal from './DepositModal'

const LUARMOR_PROJECT_ID = '014cbaf57fd36e7b489604f35b65c257'

const TIER_CONFIG = {
  og:        { label: 'OG',     color: '#f472b6' },
  best:      { label: 'BEST',   color: '#22d3ee' },
  legendary: { label: 'LEGEND', color: '#7c3aed' },
  high:      { label: 'HIGH',   color: '#a78bfa' },
}

const GRANDS = [
  { id: 1, label: 'Grand 1', maxSlots: 5 },
  { id: 2, label: 'Grand 2', maxSlots: 5, locked: true },
]

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

function timeIn(ts) {
  const diff = Math.floor((new Date(ts) - Date.now()) / 1000)
  if (diff <= 0) return 'soon'
  if (diff < 60) return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function BrainrotIcon() {
  return (
    <svg width="22" height="22" fill="none" stroke="rgba(196,181,253,0.4)" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M12 2a7 7 0 017 7c0 2.5-1.3 4.7-3.3 6l-.7.4V17a2 2 0 01-2 2h-2a2 2 0 01-2-2v-1.6l-.7-.4A7 7 0 015 9a7 7 0 017-7z"/>
      <line x1="10" y1="21" x2="14" y2="21"/>
    </svg>
  )
}

function formatAmount(n) {
  if (!n) return '?'
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(n % 1_000_000_000 === 0 ? 0 : 1)}B/s`
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M/s`
  if (n >= 1_000)         return `$${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K/s`
  return `$${n}/s`
}

function BrainrotCard({ item }) {
  const cfg = TIER_CONFIG[item.tier?.toLowerCase()] ?? { label: item.tier?.toUpperCase() ?? '?', color: '#7c3aed' }
  return (
    <div className="card-hover flex-1 flex flex-col items-center rounded-xl p-3 gap-1.5"
      style={{ background: 'rgba(8,11,22,0.75)', border: `1px solid ${cfg.color}22`, minWidth: 0 }}>
      <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
        style={{ background: `${cfg.color}18`, color: cfg.color, border: `1px solid ${cfg.color}40` }}>
        #{item.rank}
      </span>
      <div className="w-11 h-11 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(26,31,58,0.8)', border: `1px solid ${cfg.color}30` }}>
        {item.image_url
          ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover"
              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
          : null}
        <div className={`w-full h-full items-center justify-center ${item.image_url ? 'hidden' : 'flex'}`}>
          <BrainrotIcon />
        </div>
      </div>
      <p className="text-[10px] font-bold text-white text-center truncate w-full leading-tight px-1">{item.name}</p>
      <p className="text-[13px] font-black leading-none" style={{ color: cfg.color }}>{formatAmount(item.amount)}</p>
      <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: cfg.color }}>{cfg.label}</p>
    </div>
  )
}

function EmptyBrainrotCard({ rank }) {
  return (
    <div className="flex-1 flex flex-col items-center rounded-xl p-3 gap-1.5"
      style={{ background: 'rgba(8,11,22,0.5)', border: '1px solid rgba(139,92,246,0.08)', minWidth: 0 }}>
      <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
        style={{ background: 'rgba(139,92,246,0.08)', color: 'rgba(156,163,175,0.3)' }}>
        #{rank}
      </span>
      <div className="w-11 h-11 rounded-lg flex items-center justify-center"
        style={{ background: 'rgba(26,31,58,0.4)', border: '1px solid rgba(139,92,246,0.08)' }}>
        <BrainrotIcon />
      </div>
      <p className="text-[10px] font-bold text-center" style={{ color: 'rgba(156,163,175,0.2)' }}>—</p>
      <p className="text-[15px] font-black leading-none" style={{ color: 'rgba(156,163,175,0.15)' }}>0</p>
      <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'rgba(156,163,175,0.15)' }}>—</p>
    </div>
  )
}

function TopStealsContent({ topItems = [] }) {
  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <span className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: 'rgba(196,181,253,0.35)' }}>
          Top Steals
        </span>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>
      <div className="flex gap-2">
        {[1, 2, 3].map((rank) => {
          const item = topItems.find(i => i.rank === rank)
          return item ? <BrainrotCard key={rank} item={item} /> : <EmptyBrainrotCard key={rank} rank={rank} />
        })}
      </div>
    </div>
  )
}

function ManualModal({ onClose }) {
  const steps = [
    {
      n: 1, title: 'Top Up Balance',
      body: 'Click the + button next to your balance in the sidebar. Choose your amount and payment method, then send the exact crypto amount shown. Your balance updates automatically once confirmed.',
      color: '#22d3ee',
    },
    {
      n: 2, title: 'Acquire a Slot',
      body: 'Select Grand 1, choose how many hours you want, then click ⚡ Lock In Slot. The cost is $1/hr and is deducted from your balance instantly.',
      color: '#a855f7',
    },
    {
      n: 3, title: 'Copy Your Script',
      body: 'Go to the Home tab. Copy the full script — it includes your personal script_key and the loader. Paste both lines into your Roblox executor and execute.',
      color: '#f472b6',
    },
    {
      n: 4, title: 'Extend or Renew',
      body: 'If you have an active slot, the Acquire panel becomes "Extend Slot" — add more hours without losing your spot. If your slot expired, just acquire a new one.',
      color: '#f59e0b',
    },

  ]

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <div className="relative w-[420px] max-h-[90vh] rounded-2xl flex flex-col overflow-hidden"
        style={{ background: 'rgba(8,12,28,0.98)', border: '1px solid rgba(139,92,246,0.3)', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}
        onClick={e => e.stopPropagation()}>
        <div className="h-[2px] w-full flex-shrink-0" style={{ background: 'linear-gradient(90deg,#7c3aed,#22d3ee,#f472b6)' }} />

        <div className="px-5 py-4 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <p className="text-sm font-black text-white">How to Use</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'rgba(156,163,175,0.45)' }}>Grand Notifier — quick start guide</p>
          </div>
          <button onClick={onClose} style={{ color: 'rgba(156,163,175,0.4)', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto p-5 flex flex-col gap-3">
          {steps.map(step => (
            <div key={step.n} className="flex gap-3 rounded-xl p-3"
              style={{ background: `${step.color}08`, border: `1px solid ${step.color}20` }}>
              <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-black mt-0.5"
                style={{ background: `${step.color}20`, color: step.color, border: `1px solid ${step.color}40` }}>
                {step.n}
              </div>
              <div>
                <p className="text-[12px] font-bold mb-1" style={{ color: step.color }}>{step.title}</p>
                <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(196,181,253,0.6)' }}>{step.body}</p>
              </div>
            </div>
          ))}

          <div className="rounded-xl p-3 mt-1"
            style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)' }}>
            <p className="text-[11px] font-bold mb-1" style={{ color: '#f87171' }}>Need help?</p>
            <p className="text-[11px]" style={{ color: 'rgba(196,181,253,0.5)' }}>
              Open a ticket in the Discord server and a staff member will assist you.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

function AcquireSlot({ slots, mySlot, onSuccess }) {
  const [grandId, setGrandId]     = useState(1)
  const [hours, setHours]         = useState(1)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [showManual, setShowManual]   = useState(false)
  const [showDeposit, setShowDeposit] = useState(false)

  const grand1Slots  = slots.filter(s => s.grand_id === 1)
  const occupied1    = grand1Slots.filter(s => s.users)
  const slotsAvail   = occupied1.length < 5
  const nextExpiry   = !slotsAvail && occupied1.length > 0
    ? occupied1.reduce((min, s) => (!min || s.expires_at < min) ? s.expires_at : min, null)
    : null

  const hasActiveSlot = !!mySlot
  const isGrandLocked = grandId === 2
  const pricePerHour  = 1
  const total         = hours * pricePerHour
  const canAct        = !isGrandLocked && (hasActiveSlot || slotsAvail)

  async function handleAction() {
    setLoading(true)
    setError(null)
    try {
      const endpoint = hasActiveSlot ? '/api/slots/extend' : '/api/slots/acquire'
      const body     = hasActiveSlot ? { hours } : { grand_id: grandId, hours }
      await api.post(endpoint, body)
      onSuccess()
    } catch (err) {
      setError(err.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="panel-hover flex flex-col rounded-2xl overflow-hidden flex-shrink-0"
      style={{ background: 'rgba(10,14,26,0.82)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.06)', borderTop: '2px solid #a855f7', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>

      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.25), rgba(34,211,238,0.1))', border: '1px solid rgba(168,85,247,0.35)' }}>
            <svg width="13" height="13" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7" rx="1.5"/>
              <rect x="14" y="3" width="7" height="7" rx="1.5"/>
              <rect x="14" y="14" width="7" height="7" rx="1.5"/>
              <rect x="3" y="14" width="7" height="7" rx="1.5"/>
            </svg>
          </div>
          <h3 className="text-[13px] font-bold tracking-wide text-white">
            {hasActiveSlot ? 'Extend Slot' : 'Acquire Slot'}
          </h3>
        </div>

        {/* Plan status pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{
            background: hasActiveSlot ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)',
            border: `1px solid ${hasActiveSlot ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`,
          }}>
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50"
              style={{ background: hasActiveSlot ? '#34d399' : '#f87171' }} />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5"
              style={{ background: hasActiveSlot ? '#34d399' : '#f87171' }} />
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wider"
            style={{ color: hasActiveSlot ? 'rgba(52,211,153,0.8)' : 'rgba(248,113,113,0.8)' }}>
            {hasActiveSlot ? 'Active' : 'No Plan'}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pt-3 pb-4 flex flex-col gap-3">

        {/* Grand selector */}
        <div>
          <p className="text-[8px] font-bold uppercase tracking-[0.18em] mb-1.5" style={{ color: 'rgba(156,163,175,0.45)' }}>Grand</p>
          <div className="flex gap-1.5">
            {GRANDS.map((g) => {
              const color  = g.locked ? 'rgba(139,92,246,0.4)' : '#22d3ee'
              const active = grandId === g.id
              return (
                <button key={g.id}
                  onClick={() => !g.locked && setGrandId(g.id)}
                  className="flex-1 py-2 rounded-xl text-[11px] font-bold transition-all duration-150"
                  style={active
                    ? { background: `${color}18`, color, border: `1px solid ${color}50`, cursor: g.locked ? 'not-allowed' : 'pointer' }
                    : { background: 'rgba(255,255,255,0.02)', color: 'rgba(156,163,175,0.4)', border: '1px solid rgba(255,255,255,0.06)', cursor: g.locked ? 'not-allowed' : 'pointer' }
                  }>
                  {g.label}{g.locked ? ' 🔒' : ''}
                </button>
              )
            })}
          </div>
        </div>

        {/* Duration stepper */}
        <div>
          <p className="text-[8px] font-bold uppercase tracking-[0.18em] mb-1.5" style={{ color: 'rgba(156,163,175,0.45)' }}>
            {hasActiveSlot ? 'Add Hours' : 'Duration (Hours)'}
          </p>
          <div className="flex items-center rounded-xl overflow-hidden"
            style={{ background: 'rgba(8,11,22,0.8)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <button onClick={() => setHours(Math.max(1, hours - 1))}
              className="px-3 py-2 text-lg font-black transition-colors duration-150 flex-shrink-0"
              style={{ color: 'rgba(196,181,253,0.6)', cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#a855f7'; e.currentTarget.style.background = 'rgba(168,85,247,0.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(196,181,253,0.6)'; e.currentTarget.style.background = 'transparent' }}>
              −
            </button>
            <div className="flex-1 text-center">
              <span className="text-sm font-black text-white">{hours}</span>
              <span className="text-[10px] ml-1" style={{ color: 'rgba(156,163,175,0.4)' }}>hr{hours !== 1 ? 's' : ''}</span>
            </div>
            <button onClick={() => setHours(hours + 1)}
              className="px-3 py-2 text-lg font-black transition-colors duration-150 flex-shrink-0"
              style={{ color: 'rgba(196,181,253,0.6)', cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#a855f7'; e.currentTarget.style.background = 'rgba(168,85,247,0.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(196,181,253,0.6)'; e.currentTarget.style.background = 'transparent' }}>
              +
            </button>
          </div>
        </div>

        {/* Availability bar (only when acquiring) */}
        {!hasActiveSlot && (
          <div className="flex items-center justify-between px-3 py-2 rounded-xl"
            style={{
              background: slotsAvail ? 'rgba(52,211,153,0.06)' : 'rgba(244,114,182,0.06)',
              border: `1px solid ${slotsAvail ? 'rgba(52,211,153,0.2)' : 'rgba(244,114,182,0.2)'}`,
            }}>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: slotsAvail ? '#34d399' : '#f472b6', boxShadow: `0 0 5px ${slotsAvail ? '#34d399' : '#f472b6'}` }} />
              <span className="text-[11px] font-bold" style={{ color: slotsAvail ? '#34d399' : '#f472b6' }}>
                {slotsAvail ? 'Slots Available' : 'Fully Booked'}
              </span>
            </div>
            {!slotsAvail && nextExpiry && (
              <span className="text-[9px] font-semibold" style={{ color: 'rgba(156,163,175,0.4)' }}>
                Opens in {timeIn(nextExpiry)}
              </span>
            )}
          </div>
        )}

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

        {/* Error */}
        {error && <p className="text-[11px] text-red-400 text-center">{error}</p>}

        {/* CTA */}
        <button
          disabled={!canAct || loading}
          onClick={handleAction}
          className="w-full py-2.5 rounded-xl text-sm font-black tracking-wide transition-all duration-200"
          style={canAct
            ? { background: 'linear-gradient(135deg, #7c3aed, #22d3ee)', color: '#fff', cursor: loading ? 'wait' : 'pointer', boxShadow: '0 4px 20px rgba(124,58,237,0.35)', opacity: loading ? 0.7 : 1 }
            : { background: 'rgba(139,92,246,0.08)', color: 'rgba(139,92,246,0.35)', border: '1px solid rgba(139,92,246,0.15)', cursor: 'not-allowed' }
          }>
          {loading
            ? 'Processing...'
            : isGrandLocked
              ? 'Coming Soon'
              : hasActiveSlot
                ? '⚡ Extend Slot'
                : slotsAvail
                  ? '⚡ Lock In Slot'
                  : 'Unavailable'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <span className="text-[8px] font-bold uppercase tracking-[0.15em]" style={{ color: 'rgba(156,163,175,0.25)' }}>Quick Actions</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
        </div>

        {/* Utility buttons */}
        <div className="grid grid-cols-2 gap-1.5">
          {/* Deposit */}
          <button onClick={() => setShowDeposit(true)}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-semibold transition-all duration-150"
            style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(196,181,253,0.55)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(139,92,246,0.1)'; e.currentTarget.style.color = '#c4b5fd'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'rgba(196,181,253,0.55)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}>
            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Deposit
          </button>

          {/* Manual */}
          <button onClick={() => setShowManual(true)}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-semibold transition-all duration-150"
            style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(196,181,253,0.55)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(139,92,246,0.1)'; e.currentTarget.style.color = '#c4b5fd'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'rgba(196,181,253,0.55)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}>
            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
            Manual
          </button>
        </div>

        {showManual   && <ManualModal   onClose={() => setShowManual(false)} />}
        {showDeposit  && <DepositModal  onClose={() => setShowDeposit(false)} />}

      </div>
    </div>
  )
}

function Panel({ title, accent = '#7c3aed', action, children, className = '' }) {
  return (
    <div className={`panel-hover flex flex-col rounded-2xl overflow-hidden ${className}`}
      style={{ background: 'rgba(10, 14, 26, 0.82)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.06)', borderTop: `2px solid ${accent}`, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
      <div className="px-5 py-3.5 flex items-center justify-between flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <h3 className="text-[13px] font-bold tracking-wide text-white">{title}</h3>
        {action}
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
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <p className="text-[11px] font-medium text-center" style={{ color: 'rgba(107,114,128,0.55)' }}>{message}</p>
    </div>
  )
}

function StealRow({ steal }) {
  const cfg = TIER_CONFIG[steal.tier?.toLowerCase()] ?? { label: steal.tier, color: '#7c3aed' }
  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${cfg.color}20`, borderLeft: `2px solid ${cfg.color}` }}>
      <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
        style={{ background: 'rgba(26,31,58,0.8)', border: `1px solid ${cfg.color}25` }}>
        {steal.image_url
          ? <img src={steal.image_url} alt={steal.item_name} className="w-full h-full object-cover"
              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
          : null}
        <div className={`w-full h-full items-center justify-center ${steal.image_url ? 'hidden' : 'flex'}`}>
          <svg width="14" height="14" fill="none" stroke={cfg.color} strokeWidth="1.5" strokeOpacity="0.5" viewBox="0 0 24 24">
            <path d="M12 2a7 7 0 017 7c0 2.5-1.3 4.7-3.3 6l-.7.4V17a2 2 0 01-2 2h-2a2 2 0 01-2-2v-1.6l-.7-.4A7 7 0 015 9a7 7 0 017-7z"/>
          </svg>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white truncate">{steal.item_name}</p>
        <p className="text-[10px]" style={{ color: 'rgba(156,163,175,0.45)' }}>{timeAgo(steal.timestamp)}</p>
      </div>
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
        style={{ background: `${cfg.color}18`, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
        {cfg.label}
      </span>
    </div>
  )
}

function DepositRow({ deposit }) {
  const statusColor = { finished: '#34d399', confirming: '#22d3ee', confirmed: '#34d399', waiting: '#f59e0b', failed: '#f87171', expired: '#f87171' }[deposit.status] ?? '#9ca3af'
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(52,211,153,0.12)', borderLeft: '2px solid rgba(52,211,153,0.4)' }}>
      <div>
        <p className="text-xs font-semibold text-white">${Number(deposit.amount).toFixed(2)}</p>
        <p className="text-[10px]" style={{ color: 'rgba(156,163,175,0.45)' }}>{timeAgo(deposit.created_at)} · {deposit.crypto?.toUpperCase()}</p>
      </div>
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
        style={{ background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}30` }}>
        {deposit.status}
      </span>
    </div>
  )
}

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
  const { user: authUser, refreshUser } = useUser()
  const queryClient        = useQueryClient()
  const [copied, setCopied] = useState(false)

  const { data: stats = {} } = useQuery({
    queryKey: ['steals', 'my-stats'],
    queryFn:  () => api.get('/api/steals/my-stats'),
    refetchInterval: 60_000,
  })

  const { data: slots = [] } = useQuery({
    queryKey: ['slots'],
    queryFn:  () => api.get('/api/slots'),
    refetchInterval: 15_000,
  })

  const { data: mySlot } = useQuery({
    queryKey: ['slots', 'my-slot'],
    queryFn:  () => api.get('/api/slots/my-slot'),
    refetchInterval: 30_000,
  })

  const { data: stealHistory = [] } = useQuery({
    queryKey: ['steals', 'my-history'],
    queryFn:  () => api.get('/api/steals/my-history'),
    refetchInterval: 30_000,
  })

  const { data: deposits = [] } = useQuery({
    queryKey: ['steals', 'deposits'],
    queryFn:  () => api.get('/api/steals/deposits'),
    refetchInterval: 60_000,
  })

  const loaderLine = `loadstring(game:HttpGet("https://api.luarmor.net/v3/projects/${LUARMOR_PROJECT_ID}/loader"))()`
  const keyLine    = authUser?.luarmor_key ? `script_key="${authUser.luarmor_key}";` : null
  const fullScript = keyLine ? `${keyLine}\n${loaderLine}` : loaderLine

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullScript)
    } catch {
      const el = document.createElement('textarea')
      el.value = fullScript
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleSlotSuccess() {
    queryClient.invalidateQueries({ queryKey: ['slots'] })
    queryClient.invalidateQueries({ queryKey: ['slots', 'my-slot'] })
    refreshUser() // re-fetch balance + luarmor_key
  }

  const copyBtn = (
    <button onClick={handleCopy}
      className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all duration-150"
      style={copied
        ? { background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }
        : { background: 'rgba(34,211,238,0.1)', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.25)', cursor: 'pointer' }
      }>
      {copied ? <CheckIcon /> : <CopyIcon />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )

  const topItems = stats.topItems ?? []

  return (
    <div className="flex-1 flex flex-col p-3 md:p-4 gap-3 md:gap-4 overflow-y-auto lg:overflow-hidden min-w-0">

      {/* Script panel */}
      <div className="panel-hover rounded-2xl flex-shrink-0"
        style={{ background: 'rgba(10,14,26,0.82)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.06)', borderTop: '2px solid #22d3ee', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
        <div className="px-5 py-3.5 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 className="text-[13px] font-bold tracking-wide text-white">Script</h3>
          {copyBtn}
        </div>
        <div className="p-4">
          <div className="rounded-xl px-5 py-4 font-mono text-[12px] leading-relaxed cursor-text select-all flex flex-col gap-1"
            style={{ background: 'rgba(3,5,14,0.85)', border: '1px solid rgba(34,211,238,0.08)', letterSpacing: '0.01em', wordBreak: 'break-all' }}>
            {keyLine && (
              <span style={{ color: '#34d399' }}>{keyLine}</span>
            )}
            <span style={{ color: 'rgba(167,139,250,0.9)' }}>{loaderLine}</span>
          </div>
        </div>
      </div>

      {/* Data panels */}
      <div className="flex flex-col lg:flex-row gap-3 md:gap-4 lg:flex-1 lg:min-h-0">

        {/* Left column */}
        <div className="flex flex-col gap-3 md:gap-4 lg:flex-1 lg:min-h-0">
          <Panel title="Top 3 Steals" accent="#f472b6" className="lg:flex-1">
            <TopStealsContent topItems={topItems} />
          </Panel>
          <Panel title="Steal History" accent="#7c3aed" className="lg:flex-1">
            {stealHistory.length === 0
              ? <EmptyState message="No steals yet" accent="#7c3aed" />
              : <div className="flex flex-col gap-2">
                  {stealHistory.slice(0, 20).map(s => <StealRow key={s.id} steal={s} />)}
                </div>
            }
          </Panel>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-3 md:gap-4 lg:flex-1 lg:min-h-0 lg:overflow-y-auto">
          <AcquireSlot slots={slots} mySlot={mySlot} onSuccess={handleSlotSuccess} />
          <Panel title="Top Up History" accent="#34d399" className="flex-shrink-0">
            {deposits.length === 0
              ? <EmptyState message="No top ups yet" accent="#34d399" />
              : <div className="flex flex-col gap-2">
                  {deposits.map(d => <DepositRow key={d.id} deposit={d} />)}
                </div>
            }
          </Panel>
        </div>

      </div>

    </div>
  )
}
