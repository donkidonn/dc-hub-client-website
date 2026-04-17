import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useUser } from '../context/UserContext'

const BASE_URL = import.meta.env.VITE_API_URL || ''

const CURRENCIES = [
  { id: 'usdtbsc',      label: 'USDT',  network: 'BEP-20',   color: '#26a17b' },
  { id: 'usdttrc20',    label: 'USDT',  network: 'TRC-20',   color: '#26a17b' },
  { id: 'usdterc20',    label: 'USDT',  network: 'ERC-20',   color: '#26a17b' },
  { id: 'btc',          label: 'BTC',   network: 'Bitcoin',  color: '#f7931a' },
  { id: 'eth',          label: 'ETH',   network: 'Ethereum', color: '#627eea' },
  { id: 'bnbbsc',       label: 'BNB',   network: 'BEP-20',   color: '#f3ba2f' },
  { id: 'sol',          label: 'SOL',   network: 'Solana',   color: '#9945ff' },
  { id: 'ltc',          label: 'LTC',   network: 'Litecoin', color: '#bfbbbb' },
  { id: 'trx',          label: 'TRX',   network: 'TRON',     color: '#ef0027' },
  { id: 'doge',         label: 'DOGE',  network: 'Dogecoin', color: '#c2a633' },
  { id: 'ton',          label: 'TON',   network: 'TON',      color: '#0098ea' },
  { id: 'maticpolygon', label: 'POL',   network: 'Polygon',  color: '#8247e5' },
]

function useCountdown(expiryDate) {
  const [remaining, setRemaining] = useState('')
  useEffect(() => {
    if (!expiryDate) { setRemaining(''); return }
    const tick = () => {
      const diff = new Date(expiryDate) - Date.now()
      if (diff <= 0) { setRemaining('Expired'); return }
      const m = String(Math.floor(diff / 60000)).padStart(2, '0')
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0')
      setRemaining(`${m}:${s}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiryDate])
  return remaining
}

const STATUS_COLOR = {
  waiting:    '#f59e0b',
  confirming: '#22d3ee',
  confirmed:  '#34d399',
  finished:   '#34d399',
  failed:     '#f87171',
  expired:    '#f87171',
}

// ─── Pending tab ────────────────────────────────────────────────────────────
function PendingTab({ pending, loadingPending, onConfirmed, onCancelled }) {
  const [status, setStatus]         = useState(pending?.status ?? 'waiting')
  const [copied, setCopied]         = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState(null)
  const pollRef                     = useRef(null)
  const countdown                   = useCountdown(pending?.expiry)
  const statusColor                 = STATUS_COLOR[status] ?? '#9ca3af'

  // Update local status when pending prop changes (e.g. after switching tabs)
  useEffect(() => { if (pending?.status) setStatus(pending.status) }, [pending])

  // Poll status while viewing a pending payment
  useEffect(() => {
    if (!pending?.payment_id) return
    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`${BASE_URL}/api/balance/deposit/${pending.payment_id}/status`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
        const data = await res.json()
        setStatus(data.status)
        if (data.status === 'finished' || data.status === 'confirmed') {
          clearInterval(pollRef.current)
          onConfirmed()
        }
      } catch {}
    }, 8000)
    return () => clearInterval(pollRef.current)
  }, [pending?.payment_id])

  async function handleCancel() {
    setCancelling(true)
    setCancelError(null)
    try {
      const res = await fetch(`${BASE_URL}/api/balance/deposit/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error)
      }
      onCancelled()
    } catch (err) {
      setCancelError(err.message || 'Failed to cancel')
    } finally {
      setCancelling(false)
    }
  }

  function copyAddress() {
    navigator.clipboard.writeText(pending.pay_address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loadingPending) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="w-6 h-6 rounded-full border-2 border-transparent"
          style={{ borderTopColor: '#a78bfa', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  if (!pending) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10">
        <div className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
          <svg width="18" height="18" fill="none" stroke="rgba(139,92,246,0.5)" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <p className="text-xs font-medium text-center" style={{ color: 'rgba(156,163,175,0.5)' }}>No pending payments</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Status + countdown */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
          <span className="text-xs font-semibold capitalize" style={{ color: statusColor }}>{status}</span>
        </div>
        {countdown && (
          <span className="text-xs font-bold tabular-nums" style={{ color: 'rgba(196,181,253,0.6)' }}>
            {countdown}
          </span>
        )}
      </div>

      {/* Amount */}
      <div className="text-center">
        <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'rgba(156,163,175,0.4)' }}>Send Exactly</p>
        <p className="text-2xl font-black text-white leading-none">{pending.pay_amount}</p>
        <p className="text-xs font-semibold mt-0.5" style={{ color: '#22d3ee' }}>{pending.pay_currency?.toUpperCase()}</p>
        <p className="text-[10px] mt-1" style={{ color: 'rgba(156,163,175,0.35)' }}>(≈ ${pending.amount} USD)</p>
      </div>

      {/* QR */}
      <div className="flex justify-center">
        <div className="p-2 rounded-xl" style={{ background: '#fff' }}>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(pending.pay_address)}&margin=4`}
            alt="QR" width={140} height={140} className="rounded-lg"
          />
        </div>
      </div>

      {/* Address */}
      <div className="flex flex-col gap-1">
        <p className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(156,163,175,0.4)' }}>Address</p>
        <button onClick={copyAddress}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl w-full text-left transition-all"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.2)', cursor: 'pointer' }}>
          <span className="text-[11px] font-mono text-white flex-1 truncate">{pending.pay_address}</span>
          <span className="text-[10px] font-semibold flex-shrink-0" style={{ color: copied ? '#34d399' : '#a78bfa' }}>
            {copied ? 'Copied!' : 'Copy'}
          </span>
        </button>
      </div>

      <p className="text-[10px] text-center" style={{ color: 'rgba(156,163,175,0.35)' }}>
        Send the exact amount. Underpayments will not be credited.
      </p>

      {/* Divider */}
      <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

      {cancelError && (
        <p className="text-[11px] text-center" style={{ color: '#f87171' }}>{cancelError}</p>
      )}

      <button
        onClick={handleCancel}
        disabled={cancelling}
        className="w-full py-2.5 rounded-xl text-[11px] font-semibold transition-all"
        style={{
          background: 'rgba(248,113,113,0.08)',
          border: '1px solid rgba(248,113,113,0.2)',
          color: cancelling ? 'rgba(248,113,113,0.4)' : 'rgba(248,113,113,0.75)',
          cursor: cancelling ? 'wait' : 'pointer',
        }}
        onMouseEnter={e => { if (!cancelling) { e.currentTarget.style.background = 'rgba(248,113,113,0.15)'; e.currentTarget.style.color = '#f87171' } }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; e.currentTarget.style.color = cancelling ? 'rgba(248,113,113,0.4)' : 'rgba(248,113,113,0.75)' }}>
        {cancelling ? 'Cancelling...' : 'Cancel Payment'}
      </button>
    </div>
  )
}

// ─── Create tab ──────────────────────────────────────────────────────────────
function CreateTab({ hasPending, onCreated }) {
  const [amount, setAmount]     = useState('')
  const [currency, setCurrency] = useState('usdtbsc')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  async function handleCreate() {
    const num = Number(amount)
    if (!num || num < 1) { setError('Minimum deposit is $1'); return }
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${BASE_URL}/api/balance/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ amount: num, currency }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onCreated(data, num)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (hasPending) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        <div className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <svg width="18" height="18" fill="none" stroke="#f59e0b" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <p className="text-xs font-semibold" style={{ color: 'rgba(245,158,11,0.8)' }}>
          You already have a pending payment
        </p>
        <p className="text-[11px]" style={{ color: 'rgba(156,163,175,0.45)' }}>
          Complete or wait for it to expire before creating a new one.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Amount */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(196,181,253,0.5)' }}>Amount (USD)</label>
        <div className="flex items-center rounded-xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.2)' }}>
          <button onClick={() => { setAmount(v => Math.max(2, Number(v) - 1)); setError(null) }}
            className="px-3 py-2.5 text-lg font-bold transition-all flex-shrink-0"
            style={{ color: 'rgba(196,181,253,0.5)', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.color = '#c4b5fd'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(196,181,253,0.5)'}>−</button>
          <div className="flex items-center gap-1 flex-1 justify-center">
            <span className="text-sm font-bold" style={{ color: 'rgba(196,181,253,0.5)' }}>$</span>
            <input type="text" inputMode="decimal" placeholder="0.00" value={amount}
              onChange={e => { setAmount(e.target.value.replace(/[^0-9.]/g, '')); setError(null) }}
              className="w-16 bg-transparent outline-none text-sm font-bold text-white text-center placeholder:text-gray-600"
              autoFocus />
          </div>
          <button onClick={() => { setAmount(v => Number(v) + 1 || 1); setError(null) }}
            className="px-3 py-2.5 text-lg font-bold transition-all flex-shrink-0"
            style={{ color: 'rgba(196,181,253,0.5)', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.color = '#c4b5fd'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(196,181,253,0.5)'}>+</button>
        </div>
        <div className="flex gap-2">
          {[5, 10, 20].map(v => (
            <button key={v} onClick={() => { setAmount(v); setError(null) }}
              className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{
                background: Number(amount) === v ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${Number(amount) === v ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.08)'}`,
                color: Number(amount) === v ? '#c4b5fd' : 'rgba(156,163,175,0.5)',
                cursor: 'pointer',
              }}>
              ${v}
            </button>
          ))}
        </div>
      </div>

      {/* Currency */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(196,181,253,0.5)' }}>Currency</label>
        <div className="grid gap-1.5 overflow-y-auto pr-0.5"
          style={{ gridTemplateColumns: 'repeat(3, 1fr)', maxHeight: 148, scrollbarWidth: 'thin', scrollbarColor: 'rgba(139,92,246,0.3) transparent' }}>
          {CURRENCIES.map(c => {
            const active = currency === c.id
            return (
              <button key={c.id} onClick={() => setCurrency(c.id)}
                className="py-2 px-1 rounded-xl text-center transition-all"
                style={{
                  background: active ? `${c.color}18` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${active ? c.color + '60' : 'rgba(255,255,255,0.07)'}`,
                  cursor: 'pointer',
                }}>
                <p className="text-xs font-bold leading-tight" style={{ color: active ? c.color : 'rgba(255,255,255,0.55)' }}>{c.label}</p>
                <p className="text-[9px] leading-tight mt-0.5" style={{ color: 'rgba(156,163,175,0.35)' }}>{c.network}</p>
              </button>
            )
          })}
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button onClick={handleCreate} disabled={loading}
        className="w-full py-3 rounded-xl text-sm font-bold transition-all"
        style={{
          background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
          color: '#fff',
          opacity: loading ? 0.6 : 1,
          boxShadow: '0 4px 16px rgba(109,40,217,0.35)',
          cursor: loading ? 'wait' : 'pointer',
        }}>
        {loading ? 'Creating payment...' : 'Create Payment'}
      </button>
    </div>
  )
}

// ─── Modal shell ─────────────────────────────────────────────────────────────
export default function DepositModal({ onClose }) {
  const { refreshUser } = useUser()
  const [tab, setTab]               = useState('create')  // 'create' | 'pending'
  const [pending, setPending]       = useState(null)
  const [loadingPending, setLoadingPending] = useState(true)
  const [confirmed, setConfirmed]   = useState(false)

  // Fetch pending payment on open
  useEffect(() => {
    async function fetchPending() {
      try {
        const res  = await fetch(`${BASE_URL}/api/balance/deposit/pending`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
        const data = await res.json()
        if (data?.payment_id) {
          setPending(data)
          setTab('pending')  // auto-switch to pending tab if one exists
        }
      } catch {}
      finally { setLoadingPending(false) }
    }
    fetchPending()
  }, [])

  function handleCreated(data, amount) {
    setPending({ ...data, amount })
    setTab('pending')
  }

  function handleConfirmed() {
    setConfirmed(true)
    setPending(null)
  }

  function handleCancelled() {
    setPending(null)
    setTab('create')
  }

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <div className="relative w-80 rounded-2xl flex flex-col overflow-hidden"
        style={{ background: 'rgba(8,12,28,0.98)', border: '1px solid rgba(139,92,246,0.3)', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}
        onClick={e => e.stopPropagation()}>

        {/* Top accent line */}
        <div className="h-[2px] w-full flex-shrink-0"
          style={{ background: 'linear-gradient(90deg,#7c3aed,#22d3ee,#f472b6)' }} />

        {/* Header */}
        <div className="px-5 pt-4 pb-0 flex items-center justify-between flex-shrink-0">
          <p className="text-sm font-bold text-white">
            {confirmed ? 'Payment Confirmed' : 'Add Balance'}
          </p>
          <button onClick={onClose} style={{ color: 'rgba(156,163,175,0.4)', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* CONFIRMED state */}
        {confirmed ? (
          <div className="p-5 flex flex-col items-center gap-4 py-8">
            <div className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-base font-black text-white">Balance Added!</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(156,163,175,0.5)' }}>
                Your balance has been credited.
              </p>
            </div>
            <button onClick={() => { refreshUser(); onClose() }}
              className="w-full py-3 rounded-xl text-sm font-bold"
              style={{ background: 'linear-gradient(135deg,#34d399,#059669)', color: '#fff', cursor: 'pointer' }}>
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="px-5 pt-3 pb-0 flex gap-1 flex-shrink-0">
              {[
                { id: 'create',  label: 'Create Payment' },
                { id: 'pending', label: 'Pending', badge: pending ? 1 : 0 },
              ].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all flex-1 justify-center"
                  style={tab === t.id
                    ? { background: 'rgba(139,92,246,0.2)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.35)', cursor: 'pointer' }
                    : { background: 'transparent', color: 'rgba(156,163,175,0.45)', border: '1px solid transparent', cursor: 'pointer' }
                  }>
                  {t.label}
                  {t.badge > 0 && (
                    <span className="w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center flex-shrink-0"
                      style={{ background: '#f59e0b', color: '#000' }}>
                      {t.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="mx-5 mt-3 mb-0 h-px flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.06)' }} />

            {/* Tab content */}
            <div className="p-5 flex flex-col gap-4 overflow-y-auto"
              style={{ maxHeight: 480, scrollbarWidth: 'thin', scrollbarColor: 'rgba(139,92,246,0.2) transparent' }}>
              {tab === 'create' && (
                <CreateTab hasPending={!!pending} onCreated={handleCreated} />
              )}
              {tab === 'pending' && (
                <PendingTab
                  pending={pending}
                  loadingPending={loadingPending}
                  onConfirmed={handleConfirmed}
                  onCancelled={handleCancelled}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
