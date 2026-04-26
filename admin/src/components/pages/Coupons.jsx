import { useCallback, useEffect, useState } from 'react'
import api from '../../api'
import {
  Panel, PanelHeader, PageHeader,
  Tag, Button, Input, Avatar, FieldLabel,
  EmptyState, FlashMessage, formatRelativeDate,
} from '../ui'

function CreateCouponForm({ onCreated }) {
  const [code, setCode]       = useState('')
  const [amount, setAmount]   = useState('')
  const [maxUses, setMaxUses] = useState('1')
  const [expires, setExpires] = useState('')
  const [busy, setBusy]       = useState(false)
  const [msg, setMsg]         = useState(null)

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setMsg(null)
    try {
      await api.post('/admin/coupons', {
        code: code.trim(),
        amount: Number(amount),
        max_uses: Number(maxUses),
        expires_at: expires ? new Date(expires).toISOString() : null,
      })
      setMsg({ ok: true, text: `Created "${code.trim().toUpperCase()}"` })
      setCode(''); setAmount(''); setMaxUses('1'); setExpires('')
      onCreated()
    } catch (err) {
      setMsg({ ok: false, text: err.message })
    } finally { setBusy(false) }
  }

  return (
    <Panel accent="violet">
      <PanelHeader
        eyebrow="New issue"
        title="Create coupon"
        subtitle="Issue a redeemable promo code with amount, use limit, and optional expiry."
      />
      <form onSubmit={submit} className="p-5 flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col gap-2">
            <FieldLabel>Code</FieldLabel>
            <Input
              mono
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="FREE1HOUR"
              maxLength={32}
            />
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel>Amount ($)</FieldLabel>
            <Input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="2.00"
            />
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel>Max uses</FieldLabel>
            <Input
              type="number"
              value={maxUses}
              onChange={e => setMaxUses(e.target.value)}
              placeholder="1"
            />
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel>Expires (optional)</FieldLabel>
            <Input
              type="datetime-local"
              value={expires}
              onChange={e => setExpires(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap pt-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <FlashMessage msg={msg} />
          <Button
            type="submit"
            variant="solid"
            size="lg"
            disabled={busy || !code.trim() || !amount || !maxUses}>
            {busy ? 'Creating…' : '+ Create coupon'}
          </Button>
        </div>
      </form>
    </Panel>
  )
}

function ProgressBar({ used, max }) {
  const pct  = Math.min(100, Math.round((used / max) * 100))
  const full = pct >= 100
  const color = full ? '#f87171' : pct > 70 ? '#f59e0b' : '#34d399'
  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      <div className="relative flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}aa, ${color})`,
            boxShadow: `0 0 10px ${color}77`,
          }} />
      </div>
      <span className="text-[10.5px] font-black tabular-nums whitespace-nowrap mono"
        style={{ color }}>
        {used}/{max}
      </span>
    </div>
  )
}

function CouponRow({ coupon, onDelete }) {
  const [expanded, setExpanded]       = useState(false)
  const [redemptions, setRedemptions] = useState(null)
  const [loadingR, setLoadingR]       = useState(false)
  const [copied, setCopied]           = useState(false)

  const expired = coupon.expires_at && new Date(coupon.expires_at) < new Date()
  const spent   = coupon.uses >= coupon.max_uses
  const status  = expired ? 'expired' : spent ? 'spent' : 'active'

  const statusTag = {
    active:  { color: 'green',   label: 'Active' },
    expired: { color: 'red',     label: 'Expired' },
    spent:   { color: 'magenta', label: 'Spent'  },
  }[status]

  async function handleCopy() {
    try { await navigator.clipboard.writeText(coupon.code) } catch {}
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  async function toggleExpand() {
    const next = !expanded
    setExpanded(next)
    if (next && redemptions === null) {
      setLoadingR(true)
      try {
        const data = await api.get(`/admin/coupons/${coupon.id}/redemptions`)
        setRedemptions(data)
      } catch { setRedemptions([]) }
      finally { setLoadingR(false) }
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete coupon "${coupon.code}"? This cannot be undone.`)) return
    try { await api.del(`/admin/coupons/${coupon.id}`); onDelete() }
    catch (e) { alert(e.message) }
  }

  return (
    <div className="rounded-[10px] flex flex-col"
      style={{
        background: 'rgba(255,255,255,0.015)',
        border: `1px solid ${status === 'active' ? 'rgba(52,211,153,0.18)' : 'rgba(255,255,255,0.05)'}`,
      }}>
      {/* Main row */}
      <div className="p-4 flex items-center gap-3 flex-wrap">
        {/* Code chip — click to copy */}
        <button onClick={handleCopy}
          className="mono flex items-center gap-2 px-3 py-1.5 rounded-[8px] text-[12px] font-bold transition-all"
          style={{
            background: 'rgba(34,211,238,0.07)',
            color: '#22d3ee',
            border: '1px solid rgba(34,211,238,0.3)',
            cursor: 'pointer',
            letterSpacing: '0.04em',
          }}
          title="Click to copy"
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,211,238,0.14)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(34,211,238,0.07)'}>
          <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            {copied
              ? <polyline points="20 6 9 17 4 12"/>
              : <><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></>}
          </svg>
          {coupon.code}
        </button>

        {/* Amount */}
        <div className="flex items-baseline gap-1">
          <span className="text-[16px] font-black tabular-nums"
            style={{ color: '#34d399', textShadow: '0 0 12px rgba(52,211,153,0.4)' }}>
            ${Number(coupon.amount).toFixed(2)}
          </span>
        </div>

        <Tag color={statusTag.color}>{statusTag.label}</Tag>

        <ProgressBar used={coupon.uses} max={coupon.max_uses} />

        <div className="text-[10.5px] flex flex-col leading-tight mono"
          style={{ color: 'rgba(156,163,175,0.5)' }}>
          <span>Created {formatRelativeDate(coupon.created_at)}</span>
          {coupon.expires_at
            ? <span style={{ color: expired ? '#f87171' : 'rgba(156,163,175,0.5)' }}>
                Expires {new Date(coupon.expires_at).toLocaleDateString()}
              </span>
            : <span>No expiry</span>
          }
        </div>

        <div className="flex-1" />

        <Button size="sm" variant="ghost" onClick={toggleExpand}>
          {expanded ? '▲ Hide' : '▼ Redemptions'}
        </Button>
        <Button size="sm" variant="danger" onClick={handleDelete}>Delete</Button>
      </div>

      {/* Expanded — redemption list */}
      {expanded && (
        <div className="px-4 pb-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2 py-3">
            <p className="eyebrow">Redemptions</p>
            <span className="text-[11px] font-black mono" style={{ color: '#22d3ee' }}>
              {redemptions?.length ?? 0}
            </span>
          </div>
          {loadingR
            ? <p className="text-[11px] py-2" style={{ color: 'rgba(156,163,175,0.5)' }}>Loading…</p>
            : !redemptions?.length
              ? <p className="text-[11px] py-2" style={{ color: 'rgba(156,163,175,0.4)' }}>No redemptions yet.</p>
              : <div className="flex flex-col gap-1.5">
                  {redemptions.map(r => (
                    <div key={r.id} className="flex items-center gap-3 px-3 py-2 rounded-[8px]"
                      style={{
                        background: 'rgba(255,255,255,0.015)',
                        border: '1px solid rgba(255,255,255,0.04)',
                      }}>
                      <Avatar url={r.users?.avatar_url} size={26} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11.5px] font-bold text-white truncate">{r.users?.username ?? 'Unknown'}</p>
                        <p className="text-[10px] mono" style={{ color: 'rgba(156,163,175,0.4)' }}>
                          ID {r.users?.discord_id ?? '—'}
                        </p>
                      </div>
                      <span className="text-[10px] mono" style={{ color: 'rgba(156,163,175,0.5)' }}>
                        {formatRelativeDate(r.redeemed_at)}
                      </span>
                    </div>
                  ))}
                </div>}
        </div>
      )}
    </div>
  )
}

export default function Coupons() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const fetchAll = useCallback(async () => {
    try {
      const d = await api.get('/admin/coupons')
      setCoupons(d)
      setError(null)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const activeCount = coupons.filter(c => {
    const expired = c.expires_at && new Date(c.expires_at) < new Date()
    return !expired && c.uses < c.max_uses
  }).length

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow="Promo codes"
        title="Coupons"
        subtitle="Create, distribute, and audit redeemable promo codes."
        right={
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[8px]"
            style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.22)' }}>
            <span className="eyebrow" style={{ color: 'rgba(52,211,153,0.7)' }}>Active</span>
            <span className="text-[13px] font-black tabular-nums mono" style={{ color: '#34d399' }}>
              {activeCount}
            </span>
          </div>
        }
      />

      <CreateCouponForm onCreated={fetchAll} />

      <Panel accent="cyan">
        <PanelHeader
          eyebrow="Ledger"
          title={`All coupons · ${coupons.length}`}
          subtitle="Click a code to copy. Expand a row to see redemption history."
        />
        <div className="p-4 flex flex-col gap-2.5">
          {loading
            ? <EmptyState message="Loading coupons…" />
            : coupons.length === 0
              ? <EmptyState
                  message="No coupons yet"
                  hint="Create one above to get started."
                  icon={
                    <svg width="22" height="22" fill="none" stroke="rgba(34,211,238,0.55)" strokeWidth="1.6" viewBox="0 0 24 24">
                      <path d="M20 12a2 2 0 012-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v4a2 2 0 012 2 2 2 0 01-2 2v4a2 2 0 002 2h16a2 2 0 002-2v-4a2 2 0 01-2-2z"/>
                      <line x1="9" y1="8" x2="9" y2="10"/><line x1="9" y1="14" x2="9" y2="16"/>
                    </svg>
                  } />
              : coupons.map(c => <CouponRow key={c.id} coupon={c} onDelete={fetchAll} />)
          }
        </div>
      </Panel>

      {error && (
        <p className="text-[12px] inline-flex items-center gap-1.5 uppercase tracking-wide font-bold"
          style={{ color: '#f87171' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#f87171', boxShadow: '0 0 8px #f87171' }} />
          {error}
        </p>
      )}
    </div>
  )
}
